# 5. Subqueries

A subquery is a query nested entirely inside another SQL query. Subqueries can execute independently (basic calculation), evaluate logical lists (NOT IN), or execute recursively against the outer query row-by-row (correlated).

Below are the 3 distinct subquery implementations used to solve scheduling problems in the Optimization System.

---

## 1. Basic (Scalar) Subquery
A subquery that resolves to exactly one single value before the outer query runs.

### Finding Maximum Capacity Rooms
The inner query `(SELECT MAX(capacity) FROM Room)` executes first, evaluating to an integer like `120`. Then, the outer query fetches the room numbers that match that exact capacity size.
```sql
SELECT room_number, capacity
FROM Room
WHERE capacity = (SELECT MAX(capacity) FROM Room);
```

---

## 2. Multi-row Subqueries (`IN` / `NOT IN`)
A subquery that returns a list (column) of values for the outer query to check against. 

### Free Rooms Subquery
Used strictly as a simulated set operator, the subquery compiles a massive list of every `room_id` that has already been booked into the `Course_Schedule`. The outer query filters the master `Room` table to exclude any room matching that list, leaving only vacant rooms.
```sql
SELECT room_number 
FROM Room
WHERE room_id NOT IN (
    SELECT room_id FROM Course_Schedule
);
```

---

## 3. Advanced / Correlated Subqueries
Subqueries that cannot resolve independently. They execute repeatedly (looping) once for every row processed by the outer query, often using values *from* the outer query.

### Correlated Thresholding (Average Usage Filter)
This query identifies "Overutilized" rooms. It operates on two layers of subqueries simultaneously (a Derived Table subquery computing the `avg_usage`, nested inside a filtering subquery).

The outer query pulls a specific Room's `usage_count`. The deeply nested subquery calculates the dynamic campus-wide average utilization. By wrapping them in a `HAVING` clause, the subquery checks *each room's individual count* against the derived campus baseline exactly once per room.
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

## Real Case Scenarios (Subqueries)

Below are practical examples demonstrating how subqueries solve multi-step logic recursively or sequentially in a single execution.

### 1. Basic Scalar Subquery
**Question:** What is the course code of the course that happens in a room with a capacity of exactly 120?

**SQL Statement:**
```sql
SELECT c.course_code 
FROM Course c JOIN Course_Schedule cs ON c.course_id = cs.course_id
WHERE cs.room_id = (SELECT room_id FROM Room WHERE capacity = 120 LIMIT 1);
```

**Output:**
```
+-------------+
| course_code |
+-------------+
| CS301T      |
+-------------+
```

### 2. Multi-row Subqueries (IN)
**Question:** Find the names of all departments that actually have registered courses.

**SQL Statement:**
```sql
SELECT dept_name 
FROM Department 
WHERE dept_id IN (SELECT DISTINCT dept_id FROM Course);
```

**Output:**
```
+-----------------------------------------+
| dept_name                               |
+-----------------------------------------+
| Computer Science and Engineering        |
| Electronics and Communication Engineering|
+-----------------------------------------+
```

### 3. Correlated Subquery
**Question:** Which specific rooms are being used more times than the campus-wide average?

**SQL Statement:**
```sql
SELECT r.room_number, COUNT(cs.schedule_id) AS usage_count
FROM Room r JOIN Course_Schedule cs ON r.room_id = cs.room_id
GROUP BY r.room_number
HAVING COUNT(cs.schedule_id) > (
    SELECT AVG(usage_count) FROM (
        SELECT COUNT(schedule_id) AS usage_count FROM Course_Schedule GROUP BY room_id
    ) AS avg_usage
);
```

**Output:**
```
+-------------+-------------+
| room_number | usage_count |
+-------------+-------------+
| UB101       |           2 |
+-------------+-------------+
```

### 4. Advanced Analytics: Room Saturation Risk
**Question:** Are there any rooms where the total mapped students in their current schedules exceed 90% of their physical capacity?

**SQL Statement:**
```sql
SELECT room_number 
FROM Room r 
WHERE (
    SELECT MAX(b.student_count) 
    FROM Course_Schedule cs 
    JOIN Batch b ON cs.batch_id = b.batch_id 
    WHERE cs.room_id = r.room_id
) >= r.capacity * 0.90;
```

**Output:**
```
+-------------+
| room_number |
+-------------+
| UB101       |
+-------------+
```
