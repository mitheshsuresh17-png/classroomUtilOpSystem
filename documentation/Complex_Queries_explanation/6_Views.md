# 6. Views

A View is a virtual table whose contents are defined by a pre-compiled SQL query. They are excellent for abstracting complex joins and aggregations so the backend/frontend doesn't have to repeatedly compute or transmit massive query structures.

There are exactly two persistent Views used in the Optimization System to drive the React frontend features.

---

## 1. Relational Abstraction View

### View: Complete Schedule Details (`View_Detailed_Schedule`)
This view permanently stores the deeply nested 5-table `INNER JOIN` query. Instead of writing out the massive join block every time the frontend requests the schedule list, the Node.js backend can simply query `SELECT * FROM View_Detailed_Schedule` as if it were a flat, denormalized table.
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

---

## 2. Analytical Summary View

### View: Room Utilization Analysis (`View_Room_Utilization`)
This view permanently calculates and stores the mathematical aggregate counts for every room's scheduled classes using a `LEFT JOIN`. 
The frontend "Dashboard" directly polls this view to generate the real-time "Room Utilization Summary" table and its progress bars instantly.
```sql
CREATE OR REPLACE VIEW View_Room_Utilization AS
SELECT 
    r.room_number, r.capacity, COUNT(cs.schedule_id) as slots_used
FROM Room r
LEFT JOIN Course_Schedule cs ON r.room_id = cs.room_id
GROUP BY r.room_id, r.room_number, r.capacity;
```

---

## Real Case Scenarios (Views)

Below are practical examples demonstrating how abstracting massive logic into native Views dramatically simplifies direct client queries.

### 1. Querying an Analytical View
**Question:** Give me the utilization details exclusively for the 'UB101' room without writing any GROUP BY or JOIN clauses myself.

**SQL Statement:**
```sql
SELECT * FROM View_Room_Utilization 
WHERE room_number = 'UB101';
```

**Output:**
```
+-------------+----------+------------+
| room_number | capacity | slots_used |
+-------------+----------+------------+
| UB101       |       65 |          2 |
+-------------+----------+------------+
```

### 2. Querying a Relational Abstraction View
**Question:** What section and year of study is scheduled in Room 'UB102' on Day '1'?

**SQL Statement:**
```sql
SELECT year_of_study, section FROM View_Detailed_Schedule 
WHERE room_number = 'UB102' AND day_of_week = '1';
```

**Output:**
```
+---------------+---------+
| year_of_study | section |
+---------------+---------+
|             2 | B       |
+---------------+---------+
```

### 3. Joining a View with a Table
**Question:** Combine our predefined 'Room Utilization Analysis' view with the actual Room types from the base table.

**SQL Statement:**
```sql
SELECT v.room_number, r.room_type, v.slots_used 
FROM View_Room_Utilization v
JOIN Room r ON v.room_number = r.room_number;
```

**Output:**
```
+-------------+--------------+------------+
| room_number | room_type    | slots_used |
+-------------+--------------+------------+
| UB101       | Classroom    |          2 |
| UB102       | Classroom    |          1 |
| UB201       | Lecture Hall |          1 |
| LAB1        | Lab          |          0 |
| LAB2        | Lab          |          0 |
+-------------+--------------+------------+
```

### 4. Advanced Analytics: Infrastructure Averages via View
**Question:** Run an analysis showing the average number of used slots per room category, utilizing the pre-calculated metrics inside the View rather than raw tables.

**SQL Statement:**
```sql
SELECT r.room_type, AVG(v.slots_used) as avg_utilized_slots
FROM Room r
JOIN View_Room_Utilization v ON r.room_number = v.room_number
GROUP BY r.room_type;
```

**Output:**
```
+--------------+--------------------+
| room_type    | avg_utilized_slots |
+--------------+--------------------+
| Classroom    |             1.5000 |
| Lecture Hall |             1.0000 |
| Lab          |             0.0000 |
+--------------+--------------------+
```
