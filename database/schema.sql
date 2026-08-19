-- =====================================================
-- CLASSROOM & LAB UTILIZATION OPTIMIZATION SYSTEM
-- UNIFIED SCHEMA (schema.sql)
-- =====================================================

DROP DATABASE IF EXISTS classroom_utilization_db;
CREATE DATABASE classroom_utilization_db;
USE classroom_utilization_db;

-- -----------------------------------------------------
-- 1. DDL: Create Tables with Constraints
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS Department (
    dept_id INT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Course (
    course_id INT PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    course_code VARCHAR(10) NOT NULL UNIQUE,
    dept_id INT NOT NULL,
    FOREIGN KEY (dept_id) REFERENCES Department(dept_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Batch (
    batch_id INT PRIMARY KEY,
    year_of_study INT NOT NULL CHECK (year_of_study BETWEEN 1 AND 4),
    section CHAR(1) NOT NULL,
    student_count INT NOT NULL CHECK (student_count > 0),
    dept_id INT NOT NULL,
    UNIQUE(year_of_study, section, dept_id),
    FOREIGN KEY (dept_id) REFERENCES Department(dept_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Room (
    room_number VARCHAR(10) PRIMARY KEY,
    room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('Classroom', 'Lab', 'Lecture Hall')),
    capacity INT NOT NULL CHECK (capacity > 0)
);

CREATE TABLE IF NOT EXISTS Time_Slot (
    slot_id INT PRIMARY KEY,
    day_of_week VARCHAR(15) NOT NULL CHECK (day_of_week IN ('1', '2', '3', '4', '5')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CONSTRAINT chk_time CHECK (end_time > start_time),
    UNIQUE(day_of_week, start_time, end_time)
);

CREATE TABLE IF NOT EXISTS Course_Schedule (
    schedule_id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    batch_id INT NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    slot_id INT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES Batch(batch_id) ON DELETE CASCADE,
    FOREIGN KEY (room_number) REFERENCES Room(room_number) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES Time_Slot(slot_id) ON DELETE CASCADE,
    UNIQUE(room_number, slot_id) -- Prevents double booking at the schema level
);


-- -----------------------------------------------------
-- Lookup and Intersection Tables (BCNF & 4NF)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Room_Type_Lookup (
    type_id INT PRIMARY KEY AUTO_INCREMENT,
    type_name VARCHAR(50) UNIQUE NOT NULL
);

-- Note: type_id column on Room could be managed here if BCNF is strictly followed

CREATE TABLE IF NOT EXISTS Resource (
    resource_id INT PRIMARY KEY AUTO_INCREMENT,
    resource_name VARCHAR(100) UNIQUE NOT NULL
);

INSERT IGNORE INTO Resource (resource_name) VALUES ('Projector'), ('Air Conditioner'), ('Smart Board'), ('High-End PCs'), ('Fan');

-- Intersection table to handle MVD (Many-to-Many between Room and Resource)
CREATE TABLE IF NOT EXISTS Room_Resource (
    room_number VARCHAR(10),
    resource_id INT,
    PRIMARY KEY (room_number, resource_id),
    FOREIGN KEY (room_number) REFERENCES Room(room_number) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES Resource(resource_id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- User Authentication Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- 4.1 Views
-- -----------------------------------------------------

-- View: Complete Schedule Details
CREATE OR REPLACE VIEW View_Detailed_Schedule AS
SELECT 
    cs.schedule_id, c.course_code, c.course_name, d.dept_name, 
    b.year_of_study, b.section, r.room_number, r.room_type, 
    ts.day_of_week, ts.start_time, ts.end_time
FROM Course_Schedule cs
JOIN Course c ON cs.course_id = c.course_id
JOIN Department d ON c.dept_id = d.dept_id
JOIN Batch b ON cs.batch_id = b.batch_id
JOIN Room r ON cs.room_number = r.room_number
JOIN Time_Slot ts ON cs.slot_id = ts.slot_id;

-- View: Room Utilization Analysis
CREATE OR REPLACE VIEW View_Room_Utilization AS
SELECT 
    r.room_number, r.capacity, COUNT(cs.schedule_id) as slots_used
FROM Room r
LEFT JOIN Course_Schedule cs ON r.room_number = cs.room_number
GROUP BY r.room_number, r.capacity;

-- -----------------------------------------------------
-- 4.2 Triggers
-- -----------------------------------------------------

DELIMITER //

-- Trigger: Prevent Double Booking AND Check Capacity before INSERT
DROP TRIGGER IF EXISTS trg_prevent_booking_conflict;
CREATE TRIGGER trg_prevent_booking_conflict
BEFORE INSERT ON Course_Schedule
FOR EACH ROW
BEGIN
    DECLARE conflict_count INT;
    DECLARE room_cap INT;
    DECLARE student_cnt INT;

    -- 1. Check Double Booking Conflict
    SELECT COUNT(*) INTO conflict_count
    FROM Course_Schedule
    WHERE room_number = NEW.room_number AND slot_id = NEW.slot_id;

    IF conflict_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Double Booking Error: The room is already occupied for this time slot!';
    END IF;

    -- 2. Check Capacity Constraint
    SELECT capacity INTO room_cap FROM Room WHERE room_number = NEW.room_number;
    SELECT student_count INTO student_cnt FROM Batch WHERE batch_id = NEW.batch_id;

    IF student_cnt > room_cap THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Capacity Error: Room capacity is insufficient for the batch size!';
    END IF;
END //

DELIMITER ;

-- -----------------------------------------------------
-- 4.3 Stored Functions
-- -----------------------------------------------------

DELIMITER //

-- Function: Calculate Utilization Percentage of a specific Room
DROP FUNCTION IF EXISTS get_utilization_percent;
CREATE FUNCTION get_utilization_percent(p_room_number VARCHAR(10)) 
RETURNS DECIMAL(5,2)
DETERMINISTIC
BEGIN
    DECLARE total_slots INT;
    DECLARE used_slots INT;
    DECLARE util_percent DECIMAL(5,2);

    -- Total available time slots in the system
    SELECT COUNT(*) INTO total_slots FROM Time_Slot;

    IF total_slots = 0 THEN
        RETURN 0.00;
    END IF;

    -- Slots used by this room
    SELECT COUNT(*) INTO used_slots 
    FROM Course_Schedule 
    WHERE room_number = p_room_number;

    SET util_percent = (used_slots / total_slots) * 100;

    RETURN util_percent;
END //

DELIMITER ;

-- -----------------------------------------------------
-- 4.4 Cursors & Exception Handling
-- -----------------------------------------------------

DELIMITER //

-- Procedure: Cursor to loop through all rooms and evaluate their usage status
DROP PROCEDURE IF EXISTS evaluate_room_usage;
CREATE PROCEDURE evaluate_room_usage()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE r_num VARCHAR(10);
    DECLARE u_percent DECIMAL(5,2);
    DECLARE status_msg VARCHAR(50);
    
    -- Cursor Definition
    DECLARE room_cursor CURSOR FOR SELECT room_number FROM Room;

    -- Exception Handling
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION Select 'An error occurred during evaluation' as ErrorMessage;
    
    -- Temporary table to hold output
    DROP TEMPORARY TABLE IF EXISTS Temp_Room_Report;
    CREATE TEMPORARY TABLE Temp_Room_Report (
        room_number VARCHAR(10),
        utilization_percent DECIMAL(5,2),
        status VARCHAR(50)
    );

    OPEN room_cursor;

    read_loop: LOOP
        FETCH room_cursor INTO r_num;
        IF done THEN
            LEAVE read_loop;
        END IF;

        SET u_percent = get_utilization_percent(r_num);

        IF u_percent < 30.0 THEN
            SET status_msg = 'Underutilized';
        ELSEIF u_percent > 80.0 THEN
            SET status_msg = 'Overutilized';
        ELSE
            SET status_msg = 'Optimal';
        END IF;

        INSERT INTO Temp_Room_Report VALUES (r_num, u_percent, status_msg);
    END LOOP;

    CLOSE room_cursor;

    SELECT * FROM Temp_Room_Report;
END //

DELIMITER ;

-- -----------------------------------------------------
-- Advanced Analytics Views & Functions
-- -----------------------------------------------------

-- View: Unified Utilization (Time Utilization)
CREATE OR REPLACE VIEW UnifiedUtilizationView AS
SELECT 
    r.room_number,
    r.room_type,
    r.capacity,
    (SELECT COUNT(*) FROM Time_Slot) as total_available_slots,
    COUNT(cs.schedule_id) as booked_slots,
    COALESCE(ROUND((COUNT(cs.schedule_id) / (SELECT COUNT(*) FROM Time_Slot)) * 100, 2), 0) as time_utilization_percent,
    COALESCE(ROUND(AVG(b.student_count / r.capacity) * 100, 2), 0) as avg_seat_utilization_percent
FROM Room r
LEFT JOIN Course_Schedule cs ON r.room_number = cs.room_number
LEFT JOIN Batch b ON cs.batch_id = b.batch_id
GROUP BY r.room_number, r.room_type, r.capacity;

-- View: Wasted Capacity
CREATE OR REPLACE VIEW WastedCapacityView AS
SELECT 
    cs.schedule_id,
    r.room_number,
    b.section as batch_section,
    ts.day_of_week,
    r.capacity as room_capacity,
    b.student_count as batch_size,
    (r.capacity - b.student_count) as wasted_seats
FROM Course_Schedule cs
JOIN Room r ON cs.room_number = r.room_number
JOIN Batch b ON cs.batch_id = b.batch_id
JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
WHERE (r.capacity - b.student_count) > 0;

-- View: Temporal Stress Index (Congestion by hour)
CREATE OR REPLACE VIEW TemporalStressIndex AS
SELECT 
    ts.day_of_week,
    ts.start_time,
    COUNT(cs.schedule_id) as concurrent_classes,
    (SELECT COUNT(*) FROM Room) as total_rooms,
    ROUND((COUNT(cs.schedule_id) / (SELECT COUNT(*) FROM Room)) * 100, 2) as network_congestion_percent
FROM Time_Slot ts
LEFT JOIN Course_Schedule cs ON ts.slot_id = cs.slot_id
GROUP BY ts.day_of_week, ts.start_time
ORDER BY ts.day_of_week, ts.start_time;

-- View: Capacity Mismatch Analysis
CREATE OR REPLACE VIEW CapacityMismatchAnalysis AS
SELECT 
    r.room_number,
    r.capacity as room_cap,
    b.student_count as batch_size,
    ts.day_of_week,
    ts.start_time,
    CASE 
        WHEN b.student_count > r.capacity THEN 'Severe Overcrowding'
        WHEN (r.capacity - b.student_count) > 30 THEN 'Severe Wasted Capacity'
        ELSE 'Optimal'
    END as mismatch_severity,
    CASE 
        WHEN b.student_count > r.capacity THEN -10
        WHEN (r.capacity - b.student_count) > 30 THEN -5
        ELSE 0
    END as penalty_score
FROM Course_Schedule cs
JOIN Room r ON cs.room_number = r.room_number
JOIN Batch b ON cs.batch_id = b.batch_id
JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
WHERE b.student_count > r.capacity OR (r.capacity - b.student_count) > 30;

-- View: Utilization Imbalance (class distribution across days)
CREATE OR REPLACE VIEW UtilizationImbalance AS
SELECT 
    ts.day_of_week,
    COUNT(cs.schedule_id) as total_classes
FROM Course_Schedule cs
JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
GROUP BY ts.day_of_week;

-- -----------------------------------------------------
-- Efficiency Scoring System
-- -----------------------------------------------------

DELIMITER //

DROP FUNCTION IF EXISTS calculate_system_efficiency_score;
CREATE FUNCTION calculate_system_efficiency_score() 
RETURNS DECIMAL(5,2)
DETERMINISTIC
BEGIN
    DECLARE avg_time_util DECIMAL(5,2);
    DECLARE avg_seat_util DECIMAL(5,2);
    DECLARE total_penalty INT;
    DECLARE final_score DECIMAL(5,2);

    -- 1. Get average time utilization across all rooms
    SELECT COALESCE(AVG(time_utilization_percent), 0) INTO avg_time_util FROM UnifiedUtilizationView;
    
    -- 2. Get average seat utilization across all rooms
    SELECT COALESCE(AVG(avg_seat_utilization_percent), 0) INTO avg_seat_util FROM UnifiedUtilizationView;
    
    -- 3. Calculate total mismatch penalty (-2 points for every severe mismatch)
    SELECT COALESCE(COUNT(*) * 2, 0) INTO total_penalty FROM CapacityMismatchAnalysis;

    -- 4. Calculate weighted score (50% Time, 50% Seats) minus penalties
    SET final_score = ((avg_time_util * 0.5) + (avg_seat_util * 0.5)) - total_penalty;

    -- Clamp score between 0 and 100
    IF final_score < 0 THEN SET final_score = 0; END IF;
    IF final_score > 100 THEN SET final_score = 100; END IF;

    RETURN final_score;
END //

DELIMITER ;

-- -----------------------------------------------------
-- Actionable Signals Engine (UNION View)
-- -----------------------------------------------------
CREATE OR REPLACE VIEW ActionableAnalyticsSignals AS
-- Flag 1: High Congestion Time Slots (Severity 8-10)
SELECT 
    'Network Congestion' as signal_type,
    CONCAT('Peak congestion at Day ', day_of_week, ' ', start_time, ' (', network_congestion_percent, '% rooms full)') as message,
    CASE WHEN network_congestion_percent > 90 THEN 10 ELSE 8 END as severity_score
FROM TemporalStressIndex
WHERE network_congestion_percent > 80

UNION ALL

-- Flag 2: Overcrowded Rooms (Severity 10)
SELECT 
    'Overcrowding Hazard',
    CONCAT('Room ', room_number, ' is severely overcrowded. Capacity: ', room_cap, ' vs Batch: ', batch_size),
    10 as severity_score
FROM CapacityMismatchAnalysis
WHERE mismatch_severity = 'Severe Overcrowding'

UNION ALL

-- Flag 3: Dead Rooms (Severity 6)
SELECT 
    'Dead Resource',
    CONCAT('Room ', room_number, ' is highly underutilized (', time_utilization_percent, '% time active)'),
    6 as severity_score
FROM UnifiedUtilizationView
WHERE time_utilization_percent < 20

UNION ALL

-- Flag 4: High Trapped Capacity (Severity 5)
SELECT 
    'Trapped Capacity',
    CONCAT(wasted_seats, ' empty seats trapped in ', room_number, ' by small Batch Section ', batch_section),
    5 as severity_score
FROM WastedCapacityView
WHERE wasted_seats > 40;
