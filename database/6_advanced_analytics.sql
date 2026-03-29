-- =====================================================
-- CLASSROOM & LAB UTILIZATION OPTIMIZATION SYSTEM
-- Advanced Analytics Engine Views & Functions (MySQL)
-- =====================================================

USE classroom_utilization_db;

-- -----------------------------------------------------------------------------
-- 1. UnifiedUtilizationView
-- Computes time and seat utilization across 3 axes per room per day
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW UnifiedUtilizationView AS
SELECT 
    r.room_id, 
    r.room_number,
    r.room_type,
    r.capacity AS total_capacity,
    t.day_of_week,
    COUNT(cs.schedule_id) AS active_slots,
    (COUNT(cs.schedule_id) / 12.0) * 100 AS time_utilization_percent, -- Assuming 12 slots per day max
    SUM(b.student_count) AS total_students_scheduled,
    SUM(r.capacity) AS total_capacity_available_in_active_slots,
    (SUM(b.student_count) / SUM(r.capacity)) * 100 AS seat_utilization_percent
FROM Room r
CROSS JOIN (SELECT DISTINCT day_of_week FROM Time_Slot) t
LEFT JOIN Course_Schedule cs ON r.room_id = cs.room_id 
LEFT JOIN Time_Slot ts ON cs.slot_id = ts.slot_id AND ts.day_of_week = t.day_of_week
LEFT JOIN Batch b ON cs.batch_id = b.batch_id
GROUP BY r.room_id, t.day_of_week;

-- -----------------------------------------------------------------------------
-- 2. WastedCapacityView
-- Computes trapped capacity (unusable seats) for every occupied schedule
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW WastedCapacityView AS
SELECT 
    cs.schedule_id,
    r.room_id,
    r.room_number,
    r.room_type,
    r.capacity AS room_capacity,
    b.batch_id,
    b.section,
    b.student_count AS batch_size,
    (r.capacity - b.student_count) AS trapped_capacity,
    ts.day_of_week,
    ts.start_time,
    ts.end_time,
    c.course_name,
    d.dept_name
FROM Course_Schedule cs
JOIN Room r ON cs.room_id = r.room_id
JOIN Batch b ON cs.batch_id = b.batch_id
JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
JOIN Course c ON cs.course_id = c.course_id
JOIN Department d ON c.dept_id = d.dept_id;

-- -----------------------------------------------------------------------------
-- 3. TemporalStressIndex
-- Time-based profiling aggregating load by hour/slot across the institution
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW TemporalStressIndex AS
SELECT 
    ts.day_of_week,
    ts.start_time,
    ts.end_time,
    COUNT(cs.schedule_id) AS active_rooms,
    (SELECT COUNT(*) FROM Room) AS total_rooms,
    (COUNT(cs.schedule_id) * 1.0 / (SELECT COUNT(*) FROM Room)) * 100 AS stress_ratio_percent
FROM Time_Slot ts
LEFT JOIN Course_Schedule cs ON ts.slot_id = cs.slot_id
GROUP BY ts.day_of_week, ts.start_time, ts.end_time;

-- -----------------------------------------------------------------------------
-- 4. UtilizationImbalance
-- Measures standard deviation of utilization to identify uneven loads across days
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW UtilizationImbalance AS
SELECT 
    u.day_of_week,
    AVG(u.time_utilization_percent) AS avg_time_utilization,
    STDDEV(u.time_utilization_percent) AS stddev_time_utilization,
    MAX(u.time_utilization_percent) AS max_time_utilization,
    MIN(u.time_utilization_percent) AS min_time_utilization
FROM UnifiedUtilizationView u
GROUP BY u.day_of_week;

-- -----------------------------------------------------------------------------
-- 5. CapacityMismatchAnalysis
-- Identifies systemic allocation inefficiency (Over-allocation / Overcrowding)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW CapacityMismatchAnalysis AS
SELECT 
    cs.schedule_id,
    r.room_number,
    r.capacity AS room_capacity,
    b.student_count AS batch_size,
    (b.student_count * 100.0 / r.capacity) AS fill_percentage,
    CASE 
        WHEN (b.student_count * 100.0 / r.capacity) < 50 THEN 'Over-allocation (Too big)'
        WHEN (b.student_count * 100.0 / r.capacity) > 100 THEN 'Under-allocation (Overcrowded)'
        ELSE 'Optimal'
    END AS mismatch_status,
    ts.day_of_week,
    ts.start_time
FROM Course_Schedule cs
JOIN Room r ON cs.room_id = r.room_id
JOIN Batch b ON cs.batch_id = b.batch_id
JOIN Time_Slot ts ON cs.slot_id = ts.slot_id;

-- -----------------------------------------------------------------------------
-- 6. calculate_system_efficiency_score() Function
-- Returns a weighted 0-100 score based on utilization and mismatch penalties
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS calculate_system_efficiency_score;
DELIMITER //
CREATE FUNCTION calculate_system_efficiency_score()
RETURNS DECIMAL(5,2)
READS SQL DATA
BEGIN
    DECLARE avg_time_util DECIMAL(5,2);
    DECLARE avg_seat_util DECIMAL(5,2);
    DECLARE mismatch_penalty DECIMAL(5,2);
    DECLARE final_score DECIMAL(5,2);

    -- Get institution wide averages
    SELECT COALESCE(AVG(time_utilization_percent), 0) INTO avg_time_util FROM UnifiedUtilizationView;
    SELECT COALESCE(AVG(seat_utilization_percent), 0) INTO avg_seat_util FROM UnifiedUtilizationView;
    
    -- Penalty: subtract 2 points for every severe mismatch (under or over allocation)
    SELECT COALESCE(COUNT(*) * 2.0, 0) INTO mismatch_penalty 
    FROM CapacityMismatchAnalysis 
    WHERE mismatch_status != 'Optimal';

    -- Weighted score (50% time, 50% capacity, minus penalties)
    SET final_score = (avg_time_util * 0.5) + (avg_seat_util * 0.5) - mismatch_penalty;
    
    IF final_score < 0 THEN SET final_score = 0; END IF;
    IF final_score > 100 THEN SET final_score = 100; END IF;
    
    RETURN final_score;
END //
DELIMITER ;

-- -----------------------------------------------------------------------------
-- 7. ActionableAnalyticsSignals (Master View)
-- Unions threshold breaches from all views to generate actionable insights
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW ActionableAnalyticsSignals AS
SELECT 
    'UNDERUTILIZED_ROOM' AS signal_type,
    CONCAT('Room ', room_number, ' is severely underutilized (', ROUND(time_utilization_percent, 1), '%).') AS description,
    room_number,
    5 AS severity_score
FROM UnifiedUtilizationView
WHERE time_utilization_percent < 20

UNION ALL

SELECT 
    'OVERCROWDED_ROOM' AS signal_type,
    CONCAT('Room ', room_number, ' is overcrowded! Capacity: ', room_capacity, ' vs Batch Size: ', batch_size) AS description,
    room_number,
    10 AS severity_score
FROM CapacityMismatchAnalysis
WHERE fill_percentage > 100

UNION ALL

SELECT 
    'HIGH_WASTE_ROOM' AS signal_type,
    CONCAT('Room ', room_number, ' has high trapped capacity: ', trapped_capacity, ' empty seats.') AS description,
    room_number,
    7 AS severity_score
FROM WastedCapacityView
WHERE trapped_capacity > 30

UNION ALL

SELECT 
    'PEAK_CONGESTION' AS signal_type,
    CONCAT('High congestion at ', start_time, ' on Day ', day_of_week, ' (', ROUND(stress_ratio_percent, 1), '% rooms in use).') AS description,
    NULL AS room_number,
    8 AS severity_score
FROM TemporalStressIndex
WHERE stress_ratio_percent > 85;
