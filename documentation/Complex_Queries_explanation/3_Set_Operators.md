# 3. Set Operators

Set operators combine the results of multiple separated queries into a single logical result set. Since MySQL does not formally support `INTERSECT` or `EXCEPT`/`MINUS` keywords directly, these behaviors are logically simulated using robust `IN` and `NOT IN` clauses.

Below are all the instances across the Optimization System where set manipulations are executed.

---

## 1. Explicit Set Operators

### UNION
Merges two physically separate queries into one distinct list. Useful for aggregating diverse conditional filters across the same schema without complex OR groupings.

**Example: Fetching distinct rooms utilized across Day 1 OR Day 2.**
```sql
SELECT DISTINCT r.room_number
FROM Room r 
JOIN Course_Schedule cs ON r.room_id = cs.room_id 
JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
WHERE ts.day_of_week = '1'

UNION

SELECT DISTINCT r.room_number
FROM Room r 
JOIN Course_Schedule cs ON r.room_id = cs.room_id 
JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
WHERE ts.day_of_week = '2';
```

---

## 2. Simulated Set Operators (MySQL Equivalent)

### EXCEPT / MINUS (`NOT IN`)
Finds records that exist in the first set but are *totally absent* from the second set.

**Example: Detecting completely idle infrastructure (Free Rooms).**
This query takes the mathematical set of *all possible rooms*, and subtracts the exact set of *rooms currently scheduled*, leaving only absolutely vacant infrastructure.
```sql
SELECT room_number 
FROM Room
WHERE room_id NOT IN (
    SELECT room_id FROM Course_Schedule
);
```

---

## Real Case Scenarios (Set Operators)

Below are practical examples demonstrating how set operations merge or isolate datasets.

### 1. UNION Operator
**Question:** Give me a consolidated list of distinct rooms used on either Day 1 or Day 2.

**SQL Statement:**
```sql
SELECT DISTINCT r.room_number
FROM Room r JOIN Course_Schedule cs ON r.room_id = cs.room_id JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
WHERE ts.day_of_week = '1'
UNION
SELECT DISTINCT r.room_number
FROM Room r JOIN Course_Schedule cs ON r.room_id = cs.room_id JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
WHERE ts.day_of_week = '2';
```

**Output:**
```
+-------------+
| room_number |
+-------------+
| UB101       |
| UB102       |
| UB201       |
+-------------+
```

### 2. EXCEPT/MINUS Simulation (NOT IN)
**Question:** Which rooms are completely free and have absolutely zero classes assigned to them?

**SQL Statement:**
```sql
SELECT room_number FROM Room 
WHERE room_id NOT IN (SELECT room_id FROM Course_Schedule);
```

**Output:**
```
+-------------+
| room_number |
+-------------+
| LAB1        |
| LAB2        |
+-------------+
```

### 3. INTERSECT Simulation (INNER JOIN / IN)
**Question:** Which rooms are both large (capacity > 60) AND currently scheduled?

**SQL Statement:**
```sql
SELECT room_number FROM Room WHERE capacity > 60
AND room_id IN (SELECT room_id FROM Course_Schedule);
```

**Output:**
```
+-------------+
| room_number |
+-------------+
| UB101       |
| UB201       |
+-------------+
```

### 4. Advanced Analytics: Inactive Departments
**Question:** Which registered departments currently have absolutely zero courses scheduled to run?

**SQL Statement:**
```sql
SELECT dept_name FROM Department
WHERE dept_id NOT IN (
    SELECT DISTINCT c.dept_id 
    FROM Course c 
    JOIN Course_Schedule cs ON c.course_id = cs.course_id
);
```

**Output:**
```
+------------------------+
| dept_name              |
+------------------------+
| Mechanical Engineering |
+------------------------+
```
