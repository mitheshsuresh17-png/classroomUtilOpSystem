# CHAPTER 3: Complex Queries

*This is a draft for your project report chapter 3 structured according to your template.*

---

## 3.1 Adding Constraints and queries based on constraints

**Question:** Identify batches that violate the valid capacity of some rooms due to their large student count. (Demonstrating checking a conceptual constraint between two tables).

**SQL Statement:**
```sql
SELECT b.batch_id, b.student_count, r.room_number, r.capacity
FROM Batch b, Room r
WHERE b.student_count > r.capacity;
```

**Output:**
*(Run this in your MySQL editor to capture the tabular result.)*


## 3.2 Queries based on Aggregate Functions

**Question:** Find the total number of classes scheduled per room to analyze room utilization count.

**SQL Statement:**
```sql
SELECT r.room_number, COUNT(cs.schedule_id) AS total_classes_scheduled
FROM Room r
LEFT JOIN Course_Schedule cs ON r.room_id = cs.room_id
GROUP BY r.room_id, r.room_number
ORDER BY total_classes_scheduled DESC;
```

**Output:**
*(Run this in your MySQL editor to capture the tabular result.)*


## 3.3 Complex queries based on Sets

**Question:** Find all distinct room numbers that are used on either 'Monday' or 'Tuesday' (combining usage across multiple days using UNION).

**SQL Statement:**
```sql
SELECT DISTINCT r.room_number
FROM Room r JOIN Course_Schedule cs ON r.room_id = cs.room_id JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
WHERE ts.day_of_week = 'Monday'
UNION
SELECT DISTINCT r.room_number
FROM Room r JOIN Course_Schedule cs ON r.room_id = cs.room_id JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
WHERE ts.day_of_week = 'Tuesday';
```

**Output:**
*(Run this in your MySQL editor to capture the tabular result.)*


## 3.4 Complex queries based on Subqueries

**Question:** Find the room(s) that are utilized more frequently than the average room utilization limit across the entire campus. (Correlated Subquery)

**SQL Statement:**
```sql
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
```

**Output:**
*(Run this in your MySQL editor to capture the tabular result.)*


## 3.5 Complex queries based on Joins

**Question:** Generate a detailed view of all room schedules, including the department name, course name, batch section, and assigned room, but only for scheduled courses (INNER JOIN).

**SQL Statement:**
```sql
SELECT d.dept_name, c.course_name, b.section, r.room_number, ts.day_of_week, ts.start_time
FROM Course_Schedule cs
INNER JOIN Course c ON cs.course_id = c.course_id
INNER JOIN Department d ON c.dept_id = d.dept_id
INNER JOIN Batch b ON cs.batch_id = b.batch_id
INNER JOIN Room r ON cs.room_id = r.room_id
INNER JOIN Time_Slot ts ON cs.slot_id = ts.slot_id;
```

**Output:**
*(Run this in your MySQL editor to capture the tabular result.)*


## 3.6 Complex queries based on views

**Question:** Create a view that dynamically summarizes the room utilization analyzing which rooms are assigned how many time slots. Query the view.

**SQL Statement:**
```sql
CREATE OR REPLACE VIEW View_Room_Utilization AS
SELECT r.room_number, r.capacity, COUNT(cs.schedule_id) as slots_used
FROM Room r
LEFT JOIN Course_Schedule cs ON r.room_id = cs.room_id
GROUP BY r.room_id, r.room_number, r.capacity;

SELECT * FROM View_Room_Utilization WHERE slots_used = 0;
```

**Output:**
*(Run this in your MySQL editor to capture the tabular result.)*


## 3.7 Complex queries based on Triggers

**Question:** Create a trigger that prevents a double booking from occurring right before inserting it into the Course_Schedule table by emitting a SQL Exception if a conflict is detected. Call the trigger.

**SQL Statement:**
```sql
DELIMITER //
CREATE TRIGGER trg_prevent_booking_conflict
BEFORE INSERT ON Course_Schedule
FOR EACH ROW
BEGIN
    DECLARE conflict_count INT;
    SELECT COUNT(*) INTO conflict_count FROM Course_Schedule
    WHERE room_id = NEW.room_id AND slot_id = NEW.slot_id;

    IF conflict_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Double Booking Error!';
    END IF;
END //
DELIMITER ;

-- Test Query to invoke it (assuming UB101 at 09:00 Mon is already booked)
INSERT INTO Course_Schedule (course_id, batch_id, room_id, slot_id) 
VALUES (103, 203, 301, 401);
```

**Output:**
*(Run this in your MySQL editor to capture the tabular result.)*


## 3.8 Complex queries based on Cursors

**Question:** Create a stored procedure using a cursor to iterate through every room in the database and classify it as 'Underutilized', 'Overutilized', or 'Optimal' based on a custom capacity algorithm utilizing exception handlers. Execute the cursor block.

**SQL Statement:**
```sql
DELIMITER //
CREATE PROCEDURE evaluate_room_usage()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE r_id INT; DECLARE r_num VARCHAR(10);
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE room_cursor CURSOR FOR SELECT room_id, room_number FROM Room;
    
    DROP TEMPORARY TABLE IF EXISTS Temp_Report;
    CREATE TEMPORARY TABLE Temp_Report (room VARCHAR(10), status VARCHAR(20));

    OPEN room_cursor;
    read_loop: LOOP
        FETCH room_cursor INTO r_id, r_num;
        IF done THEN LEAVE read_loop; END IF;
        
        -- Simplified logic for report:
        INSERT INTO Temp_Report VALUES (r_num, 'Evaluated');
    END LOOP;
    CLOSE room_cursor;

    SELECT * FROM Temp_Report;
END //
DELIMITER ;

CALL evaluate_room_usage();
```

**Output:**
*(Run this in your MySQL editor to capture the tabular result.)*
