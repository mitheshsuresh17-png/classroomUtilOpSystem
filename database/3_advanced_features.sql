-- =====================================================
-- 4. Advanced Database Concepts (Views, Functions, Triggers, Cursors)
-- =====================================================

USE classroom_utilization_db;

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
JOIN Room r ON cs.room_id = r.room_id
JOIN Time_Slot ts ON cs.slot_id = ts.slot_id;

-- View: Room Utilization Analysis
CREATE OR REPLACE VIEW View_Room_Utilization AS
SELECT 
    r.room_number, r.capacity, COUNT(cs.schedule_id) as slots_used
FROM Room r
LEFT JOIN Course_Schedule cs ON r.room_id = cs.room_id
GROUP BY r.room_id, r.room_number, r.capacity;

-- -----------------------------------------------------
-- 4.2 Triggers
-- -----------------------------------------------------

DELIMITER //

-- Trigger: Prevent Double Booking AND Check Capacity before INSERT
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
    WHERE room_id = NEW.room_id AND slot_id = NEW.slot_id;

    IF conflict_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Double Booking Error: The room is already occupied for this time slot!';
    END IF;

    -- 2. Check Capacity Constraint
    SELECT capacity INTO room_cap FROM Room WHERE room_id = NEW.room_id;
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
CREATE FUNCTION get_utilization_percent(p_room_id INT) 
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
    WHERE room_id = p_room_id;

    SET util_percent = (used_slots / total_slots) * 100;

    RETURN util_percent;
END //

DELIMITER ;

-- -----------------------------------------------------
-- 4.4 Cursors & Exception Handling
-- -----------------------------------------------------

DELIMITER //

-- Procedure: Cursor to loop through all rooms and evaluate their usage status
CREATE PROCEDURE evaluate_room_usage()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE r_id INT;
    DECLARE r_num VARCHAR(10);
    DECLARE u_percent DECIMAL(5,2);
    DECLARE status_msg VARCHAR(50);
    
    -- Exception Handling
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION Select 'An error occurred during evaluation' as ErrorMessage;

    -- Cursor Definition
    DECLARE room_cursor CURSOR FOR SELECT room_id, room_number FROM Room;
    
    -- Temporary table to hold output
    DROP TEMPORARY TABLE IF EXISTS Temp_Room_Report;
    CREATE TEMPORARY TABLE Temp_Room_Report (
        room_number VARCHAR(10),
        utilization_percent DECIMAL(5,2),
        status VARCHAR(50)
    );

    OPEN room_cursor;

    read_loop: LOOP
        FETCH room_cursor INTO r_id, r_num;
        IF done THEN
            LEAVE read_loop;
        END IF;

        SET u_percent = get_utilization_percent(r_id);

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

    -- Output the report
    SELECT * FROM Temp_Room_Report;
END //

DELIMITER ;
