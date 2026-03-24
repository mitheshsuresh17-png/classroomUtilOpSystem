# 2. Aggregate Functions

Aggregate functions compute a single result from a set of input values. Below are all the instances across the entire Optimization System where `COUNT`, `MAX`, `MIN`, and `AVG` are explicitly used, ranging from simple Group By queries to complex View and Trigger logic.

---

## 1. Standard Aggregates & GROUP BY

### Room Utilization Count
Counts the total schedules assigned to each room, even if 0 (`LEFT JOIN`).
```sql
SELECT r.room_number, COUNT(cs.schedule_id) AS total_classes_scheduled
FROM Room r
LEFT JOIN Course_Schedule cs ON r.room_id = cs.room_id
GROUP BY r.room_id, r.room_number
ORDER BY total_classes_scheduled DESC;
```

### Capacity Analysis
Analyzes infrastructure mathematically using multiple aggregate forms concurrently.
```sql
SELECT room_type, MAX(capacity) as MaxCap, MIN(capacity) as MinCap, AVG(capacity) as AvgCap
FROM Room
GROUP BY room_type;
```

---

## 2. Aggregates inside Subqueries

### Finding Extremes
Identifies the exact room entity matching the absolute `MAX` boundary discovered in the subquery.
```sql
SELECT room_number, capacity
FROM Room
WHERE capacity = (SELECT MAX(capacity) FROM Room);
```

### Correlated Thresholding
Determines dynamically which specific rooms exceed the *average campus utilization*. Uses `COUNT` internally and recursively maps against an `AVG` derived from another aggregate.
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

---

## 3. Aggregates inside Views

### View: Room Utilization Analysis
The system compresses real-time aggregate reporting into a virtual table, abstracting the `COUNT` mapping logic away from the frontend application permanently.
```sql
CREATE OR REPLACE VIEW View_Room_Utilization AS
SELECT 
    r.room_number, r.capacity, COUNT(cs.schedule_id) as slots_used
FROM Room r
LEFT JOIN Course_Schedule cs ON r.room_id = cs.room_id
GROUP BY r.room_id, r.room_number, r.capacity;
```

---

## 4. Aggregates inside Triggers

### Overlap Detection (`trg_prevent_booking_conflict`)
The trigger uses `COUNT(*)` to securely measure if any row maps to the same room/time combination.
```sql
    DECLARE conflict_count INT;

    -- Check Validation 1: Overlap using Aggregate counting
    SELECT COUNT(*) INTO conflict_count
    FROM Course_Schedule
    WHERE room_id = NEW.room_id AND slot_id = NEW.slot_id;

    IF conflict_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Double Booking Error: The room is already occupied!';
    END IF;
```

---

## 5. Aggregates inside Stored Functions

### Utilization Percentage Calculation (`get_utilization_percent`)
The function measures structural limits dynamically by utilizing `COUNT(*)` across two different relational tables mathematically.
```sql
    DECLARE total_slots INT;
    DECLARE used_slots INT;

    -- Aggregate 1: Absolute limits
    SELECT COUNT(*) INTO total_slots FROM Time_Slot;

    -- Aggregate 2: Currently mapped allocations
    SELECT COUNT(*) INTO used_slots FROM Course_Schedule WHERE room_id = p_room_id;

    -- Calculation logic
    SET util_percent = (used_slots / total_slots) * 100;
```

---

## Real Case Scenarios (Aggregate Functions)

Below are practical examples demonstrating how aggregate functions compute real-world metrics.

### 1. Simple Aggregation (COUNT)
**Question:** How many classes in total are scheduled in the entire campus?

**SQL Statement:**
```sql
SELECT COUNT(schedule_id) AS total_classes FROM Course_Schedule;
```

**Output:**
```
+---------------+
| total_classes |
+---------------+
|             4 |
+---------------+
```

### 2. Group By Aggregation (MAX/MIN/AVG)
**Question:** What is the maximum, minimum, and average capacity of 'Classroom' type rooms?

**SQL Statement:**
```sql
SELECT room_type, MAX(capacity) as MaxCap, MIN(capacity) as MinCap, AVG(capacity) as AvgCap
FROM Room
WHERE room_type = 'Classroom'
GROUP BY room_type;
```

**Output:**
```
+-----------+--------+--------+---------+
| room_type | MaxCap | MinCap | AvgCap  |
+-----------+--------+--------+---------+
| Classroom |     65 |     60 | 62.5000 |
+-----------+--------+--------+---------+
```

### 3. Aggregate in Filtering (HAVING)
**Question:** Which rooms are hosting more than 1 class?

**SQL Statement:**
```sql
SELECT r.room_number, COUNT(cs.schedule_id) AS usage_count
FROM Room r
JOIN Course_Schedule cs ON r.room_id = cs.room_id
GROUP BY r.room_number
HAVING usage_count > 1;
```

**Output:**
```
+-------------+-------------+
| room_number | usage_count |
+-------------+-------------+
| UB101       |           2 |
+-------------+-------------+
```

### 4. Advanced Analytics: Department Course Load
**Question:** Which department runs the highest number of unique courses? 

**SQL Statement:**
```sql
SELECT d.dept_name, COUNT(c.course_id) AS total_courses
FROM Department d
LEFT JOIN Course c ON d.dept_id = c.dept_id
GROUP BY d.dept_name
ORDER BY total_courses DESC
LIMIT 1;
```

**Output:**
```
+------------------------------------------+---------------+
| dept_name                                | total_courses |
+------------------------------------------+---------------+
| Computer Science and Engineering         |             3 |
+------------------------------------------+---------------+
```
