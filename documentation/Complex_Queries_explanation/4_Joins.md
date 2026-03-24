# 4. Joins

Joins are fundamental to a normalized schema, linking separate tables logically based on their defined Foreign Keys. Below are all the variations of Joins used throughout the Optimization System.

---

## 1. INNER JOIN

`INNER JOIN` extracts rows where there is a direct match in both tables. This is heavily used to construct readable master schedules from the normalized IDs.

### Detailed Course Schedule View
This query traverses 5 different tables consecutively using `INNER JOIN` to build a human-readable schedule row containing the Department Name, Course Name, Section, Room Name, and Time Slot.
```sql
SELECT d.dept_name, c.course_name, b.section, r.room_number, ts.day_of_week, ts.start_time
FROM Course_Schedule cs
INNER JOIN Course c ON cs.course_id = c.course_id
INNER JOIN Department d ON c.dept_id = d.dept_id
INNER JOIN Batch b ON cs.batch_id = b.batch_id
INNER JOIN Room r ON cs.room_id = r.room_id
INNER JOIN Time_Slot ts ON cs.slot_id = ts.slot_id;
```

### Complete Schedule View abstraction
The `View_Detailed_Schedule` creates a persistent virtual table using `JOIN` (which defaults to `INNER JOIN` in MySQL).
```sql
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
```

### Correlated Subquery Filtering
Used within the average threshold analysis to link schedules to valid room names.
```sql
SELECT r.room_number, COUNT(cs.schedule_id) AS usage_count
FROM Room r
JOIN Course_Schedule cs ON r.room_id = cs.room_id
GROUP BY r.room_number
...
```

---

## 2. OUTER JOINS (LEFT & RIGHT)

Outer joins do not require a match in both tables, artificially padding missing relationships with `NULL`.

### LEFT JOIN (Identifying Orphaned or Unused Data)
List all rooms from the `Room` table on the *left*, forcing MySQL to output every room **even if they have NO schedules** assigned to them.
```sql
SELECT r.room_number, cs.schedule_id, c.course_name
FROM Room r
LEFT JOIN Course_Schedule cs ON r.room_id = cs.room_id
LEFT JOIN Course c ON cs.course_id = c.course_id;
```

Used again inside the analytical `View_Room_Utilization` to ensure completely empty rooms still display a `0` count instead of vanishing from the view.
```sql
CREATE OR REPLACE VIEW View_Room_Utilization AS
SELECT 
    r.room_number, r.capacity, COUNT(cs.schedule_id) as slots_used
FROM Room r
LEFT JOIN Course_Schedule cs ON r.room_id = cs.room_id
GROUP BY r.room_id, r.room_number, r.capacity;
```

### RIGHT JOIN (Inverting the Logic)
By putting `Time_Slot` on the right side of a `RIGHT JOIN`, we ensure every single Time Slot is displayed in the output, along with any classes that might overlap with them (padding empty time slots with `NULL`).
```sql
SELECT ts.day_of_week, ts.start_time, c.course_name
FROM Course_Schedule cs
JOIN Course c ON cs.course_id = c.course_id
RIGHT JOIN Time_Slot ts ON cs.slot_id = ts.slot_id;
```

---

## Real Case Scenarios (Joins)

Below are practical examples demonstrating the difference between Join types when fetching related schema data.

### 1. INNER JOIN
**Question:** Show me a readable list of every scheduled class including the specific Course Name and Room Number.

**SQL Statement:**
```sql
SELECT c.course_name, r.room_number
FROM Course_Schedule cs
INNER JOIN Course c ON cs.course_id = c.course_id
INNER JOIN Room r ON cs.room_id = r.room_id;
```

**Output:**
```
+-----------------------------+-------------+
| course_name                 | room_number |
+-----------------------------+-------------+
| Database Management Systems | UB101       |
| Operating Systems           | UB102       |
| Artificial Intelligence     | UB201       |
| Database Management Systems | UB101       |
+-----------------------------+-------------+
```

### 2. LEFT JOIN
**Question:** List all rooms and the number of classes inside them, ensuring every room is listed even if it has 0 classes.

**SQL Statement:**
```sql
SELECT r.room_number, COUNT(cs.schedule_id) as class_count
FROM Room r
LEFT JOIN Course_Schedule cs ON r.room_id = cs.room_id
GROUP BY r.room_number;
```

**Output:**
```
+-------------+-------------+
| room_number | class_count |
+-------------+-------------+
| UB101       |           2 |
| UB102       |           1 |
| UB201       |           1 |
| LAB1        |           0 |
| LAB2        |           0 |
+-------------+-------------+
```

### 3. RIGHT JOIN
**Question:** Show all Time Slots for Day '1' and any courses taught in them, ensuring we see every time slot even if no course is scheduled yet.

**SQL Statement:**
```sql
SELECT ts.start_time, c.course_name
FROM Course_Schedule cs
JOIN Course c ON cs.course_id = c.course_id
RIGHT JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
WHERE ts.day_of_week = '1';
```

**Output:**
```
+------------+-----------------------------+
| start_time | course_name                 |
+------------+-----------------------------+
| 08:00:00   | Database Management Systems |
| 08:50:00   | Artificial Intelligence     |
| 08:50:00   | Database Management Systems |
| 09:45:00   | NULL                        |
| 10:40:00   | NULL                        |
+------------+-----------------------------+
```

### 4. Advanced Analytics: Unscheduled Courses
**Question:** Which registered courses have not yet been placed into the Master Schedule?

**SQL Statement:**
```sql
SELECT c.course_code, c.course_name 
FROM Course c
LEFT JOIN Course_Schedule cs ON c.course_id = cs.course_id
WHERE cs.schedule_id IS NULL;
```

**Output:**
```
+-------------+-----------------------+
| course_code | course_name           |
+-------------+-----------------------+
| CS302P      | DBMS Lab              |
| EC301T      | Digital Communication |
+-------------+-----------------------+
```
