# 8. Stored Functions

A Stored Function is a named subprogram compiled and stored in the database that always returns exactly one value. Unlike Stored Procedures, Functions can be used directly inside standard `SELECT` or `WHERE` clauses as mathematical abstractions.

---

## 1. Mathematical Abstraction Function

### Utilization Percentage Calculation (`get_utilization_percent`)
This project utilizes a custom deterministic Stored Function to dynamically calculate the physical utilization metric for any given Room on campus.

The function accepts a `p_room_id` variable and computes a live percentage mapping by executing two internal scalar queries. It divides the specific room's active bookings (`used_slots`) by the absolute maximum permitted bookings across the campus (`total_slots`), then mathematically formats the result as a strict Decimal limit: `DECIMAL(5,2)`.

```sql
DELIMITER //
CREATE FUNCTION get_utilization_percent(p_room_id INT) 
RETURNS DECIMAL(5,2)
DETERMINISTIC
BEGIN
    DECLARE total_slots INT;
    DECLARE used_slots INT;
    DECLARE util_percent DECIMAL(5,2);

    -- 1. Find the Absolute Maximum theoretical boundary
    SELECT COUNT(*) INTO total_slots FROM Time_Slot;
    
    -- Safety check to avoid division by zero errors
    IF total_slots = 0 THEN RETURN 0.00; END IF;

    -- 2. Find the Specific Room's real usage mapping
    SELECT COUNT(*) INTO used_slots FROM Course_Schedule WHERE room_id = p_room_id;

    -- 3. Calculate and Return the standard Percentage
    SET util_percent = (used_slots / total_slots) * 100;
    RETURN util_percent;
END //
DELIMITER ;
```

**Usage Example:**
This abstraction allows the Cursor to simply run:
`SET u_percent = get_utilization_percent(r_id);` 
inside its looping structure without recalculating those massive joins manually every time!

---

## Real Case Scenarios (Stored Functions)

Below are practical examples demonstrating how the scalar mathematical function calculates live values.

### 1. Function Execution via SELECT
**Question:** What is the precise utilization percentage of Room ID 301 (UB101) directly evaluated?

**SQL Statement:**
```sql
SELECT get_utilization_percent(301) AS utilization_percent;
```

**Output:**
```
+---------------------+
| utilization_percent |
+---------------------+
|                3.33 |
+---------------------+
```

### 2. Function Execution on Empty Room
**Question:** What does the function return for a completely empty room like LAB1 (Room ID 304)?

**SQL Statement:**
```sql
SELECT get_utilization_percent(304) AS lab1_utilization;
```

**Output:**
```
+------------------+
| lab1_utilization |
+------------------+
|             0.00 |
+------------------+
```

### 3. Function inside a WHERE Clause
**Question:** Can I use the custom function to filter out all rooms that have a utilization percentage strictly greater than 0%?

**SQL Statement:**
```sql
SELECT room_number 
FROM Room 
WHERE get_utilization_percent(room_id) > 0.00;
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

### 4. Advanced Analytics: Infrastructure Sorting
**Question:** Generate a complete list of all facilities on campus, sorted dynamically from highest mathematical utilization down to lowest.

**SQL Statement:**
```sql
SELECT room_number, room_type, get_utilization_percent(room_id) AS current_util_percent 
FROM Room 
ORDER BY current_util_percent DESC;
```

**Output:**
```
+-------------+--------------+----------------------+
| room_number | room_type    | current_util_percent |
+-------------+--------------+----------------------+
| UB101       | Classroom    |                 3.33 |
| UB102       | Classroom    |                 1.67 |
| UB201       | Lecture Hall |                 1.67 |
| LAB1        | Lab          |                 0.00 |
| LAB2        | Lab          |                 0.00 |
+-------------+--------------+----------------------+
```
