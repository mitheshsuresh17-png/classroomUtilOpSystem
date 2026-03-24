-- =====================================================
-- 3. Complex Queries (Aggregates, Sets, Joins, Subqueries)
-- =====================================================

USE classroom_utilization_db;

-- -----------------------------------------------------
-- 3.1 Aggregates and Group By
-- -----------------------------------------------------

-- Q: Find the total number of classes scheduled per room (Room Utilization Count).
SELECT r.room_number, COUNT(cs.schedule_id) AS total_classes_scheduled
FROM Room r
LEFT JOIN Course_Schedule cs ON r.room_id = cs.room_id
GROUP BY r.room_id, r.room_number
ORDER BY total_classes_scheduled DESC;

-- Q: Find the max, min, and average capacity of rooms available by type.
SELECT room_type, MAX(capacity) as MaxCap, MIN(capacity) as MinCap, AVG(capacity) as AvgCap
FROM Room
GROUP BY room_type;

-- -----------------------------------------------------
-- 3.2 Constraints (Testing the constraints)
-- -----------------------------------------------------

-- Q: Identify batches that violate the valid capacity of some rooms.
SELECT b.batch_id, b.student_count, r.room_number, r.capacity
FROM Batch b, Room r
WHERE b.student_count > r.capacity;

-- -----------------------------------------------------
-- 3.3 Set Operations (UNION, EXCEPT/MINUS equivalent)
-- -----------------------------------------------------

-- Q: List all distinct room numbers used on 'Monday' UNION 'Tuesday' (Combine usage across days).
SELECT DISTINCT r.room_number
FROM Room r JOIN Course_Schedule cs ON r.room_id = cs.room_id JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
WHERE ts.day_of_week = '1'
UNION
SELECT DISTINCT r.room_number
FROM Room r JOIN Course_Schedule cs ON r.room_id = cs.room_id JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
WHERE ts.day_of_week = '2';

-- Q: Find Free Rooms (rooms that are NOT in the Course_Schedule table) using Set Exception simulation (MySQL uses NOT IN or LEFT JOIN for Except).
SELECT room_number FROM Room
WHERE room_id NOT IN (
    SELECT room_id FROM Course_Schedule
);

-- -----------------------------------------------------
-- 3.4 Joins
-- -----------------------------------------------------

-- Q: Detailed Course Schedule: Fetch the Dept Name, Course Name, Batch Section, Room Number, and Day for all schedules using INNER JOIN.
SELECT d.dept_name, c.course_name, b.section, r.room_number, ts.day_of_week, ts.start_time
FROM Course_Schedule cs
INNER JOIN Course c ON cs.course_id = c.course_id
INNER JOIN Department d ON c.dept_id = d.dept_id
INNER JOIN Batch b ON cs.batch_id = b.batch_id
INNER JOIN Room r ON cs.room_id = r.room_id
INNER JOIN Time_Slot ts ON cs.slot_id = ts.slot_id;

-- Q: List all rooms and show their assigned schedules, even if they have NO schedules (LEFT JOIN).
SELECT r.room_number, cs.schedule_id, c.course_name
FROM Room r
LEFT JOIN Course_Schedule cs ON r.room_id = cs.room_id
LEFT JOIN Course c ON cs.course_id = c.course_id;

-- Q: Show all Time Slots and any courses taught in them (RIGHT JOIN).
SELECT ts.day_of_week, ts.start_time, c.course_name
FROM Course_Schedule cs
JOIN Course c ON cs.course_id = c.course_id
RIGHT JOIN Time_Slot ts ON cs.slot_id = ts.slot_id;

-- -----------------------------------------------------
-- 3.5 Subqueries
-- -----------------------------------------------------

-- Q: Find the Room(s) with the highest total capacity.
SELECT room_number, capacity
FROM Room
WHERE capacity = (SELECT MAX(capacity) FROM Room);

-- Q: Correlated Subquery: Find rooms that are used more frequently than the average room usage.
SELECT r.room_number, COUNT(cs.schedule_id) AS usage_count
FROM Room r
JOIN Course_Schedule cs ON r.room_id = cs.room_id
GROUP BY r.room_number
HAVING COUNT(cs.schedule_id) > (
    SELECT AVG(usage_count) FROM (
        SELECT COUNT(schedule_id) AS usage_count
        FROM Course_Schedule
        GROUP BY room_id
    ) AS avg_usage
);
