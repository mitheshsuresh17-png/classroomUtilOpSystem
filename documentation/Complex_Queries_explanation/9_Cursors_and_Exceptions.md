# 9. Cursors & Exception Handlers

A Cursor is a database object used to retrieve, manipulate, and navigate through a result set row-by-row, unlike standard SQL which operates on sets of rows simultaneously. They are typically used inside Stored Procedures when complex conditional logic needs to be evaluated per row.

Exception Handlers are used to catch and manage errors or specific conditions (like reaching the end of a Cursor) gracefully without crashing the procedure.

---

## 1. Procedural Evaluation Cursor

### Room Usage Evaluator (`evaluate_room_usage`)
This project utilizes a Stored Procedure containing a `CURSOR` to systematically loop through every single physical Room on campus and classify its usage status into a temporary report table.

It demonstrates advanced procedural concepts:
1. **Cursor Declaration**: Binds the Cursor to a `SELECT` statement fetching all Rooms.
2. **Exception Handling**: Declares a `CONTINUE HANDLER FOR NOT FOUND`. When the cursor fetches the last row, trying to fetch again will trigger this handler, intelligently flipping the `done` variable to `TRUE` to break the loop.
3. **Looping**: Opens the Cursor and enters a `read_loop`.
4. **Row-by-Row Execution**: For each individual room fetched, it calls the mathematically complex `get_utilization_percent()` function.
5. **Conditional Logic (`IF/ELSEIF`)**: Dynamically categorizes the room as `Underutilized` (<30%), `Overutilized` (>80%), or `Optimal` before inserting it into the `Temp_Room_Report`.

```sql
DELIMITER //
CREATE PROCEDURE evaluate_room_usage()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE r_id INT;
    DECLARE r_num VARCHAR(10);
    DECLARE u_percent DECIMAL(5,2);
    DECLARE status_msg VARCHAR(50);
    
    -- 1. Defining the Cursor
    DECLARE room_cursor CURSOR FOR SELECT room_id, room_number FROM Room;

    -- 2. Exception Handling
    -- Gracefully exits the loop when the Cursor runs out of rows
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Gracefully catches general SQL Errors and returns a message instead of crashing
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION Select 'An error occurred during evaluation' as ErrorMessage;
    
    -- Setup temporary reporting structure
    DROP TEMPORARY TABLE IF EXISTS Temp_Room_Report;
    CREATE TEMPORARY TABLE Temp_Room_Report (room_number VARCHAR(10), utilization_percent DECIMAL(5,2), status VARCHAR(50));

    -- 3. Open Cursor and Loop
    OPEN room_cursor;
    read_loop: LOOP
        FETCH room_cursor INTO r_id, r_num;
        IF done THEN LEAVE read_loop; END IF;

        -- 4. Row-by-Row execution
        SET u_percent = get_utilization_percent(r_id);

        -- 5. Conditional Reporting Classification
        IF u_percent < 30.0 THEN SET status_msg = 'Underutilized';
        ELSEIF u_percent > 80.0 THEN SET status_msg = 'Overutilized';
        ELSE SET status_msg = 'Optimal';
        END IF;

        INSERT INTO Temp_Room_Report VALUES (r_num, u_percent, status_msg);
    END LOOP;
    CLOSE room_cursor;

    SELECT * FROM Temp_Room_Report;
END //
DELIMITER ;
```

---

## Real Case Scenarios (Cursors & Exceptions)

Below are practical examples demonstrating how cursors are invoked.

### 1. Invoking a Procedural Cursor
**Question:** How do we trigger the cursor to loop over every room and print their dynamically evaluated status?

**SQL Statement:**
```sql
CALL evaluate_room_usage();
```

**Output:**
```
+-------------+---------------------+---------------+
| room_number | utilization_percent | status        |
+-------------+---------------------+---------------+
| UB101       |                3.33 | Underutilized |
| UB102       |                1.67 | Underutilized |
| UB201       |                1.67 | Underutilized |
| LAB1        |                0.00 | Underutilized |
| LAB2        |                0.00 | Underutilized |
+-------------+---------------------+---------------+
```

### 2. Exception Handling 
**Question:** How does the code prove the NOT FOUND exception handler worked?

**SQL Statement:**
```sql
-- By gracefully returning the SELECT * FROM Temp_Room_Report at the end!
-- If the handler didn't catch the End-of-Cursor error, the procedure would have simply crashed with:
```

**Output:**
```
ERROR 1329 (02000): No data - zero rows fetched, selected, or processed
```

### 3. Interrogating the Temporary Table
**Question:** After the cursor procedure finishes, how could another query theoretically access the structured report data within the same session?

**SQL Statement:**
```sql
-- Since evaluate_room_usage() generates a TEMPORARY TABLE:
SELECT COUNT(*) as underutilized_count FROM Temp_Room_Report WHERE status = 'Underutilized';
```

**Output:**
```
+---------------------+
| underutilized_count |
+---------------------+
|                   5 |
+---------------------+
```

### 4. Advanced Analytics: Extracted Intelligence from the Cursor
**Question:** Once the cursor has dynamically evaluated and categorized every room into the Temp Table, how do we query it to find exactly how much total capacity is currently trapped inside exclusively "Underutilized" rooms?

**SQL Statement:**
```sql
-- Assuming evaluate_room_usage() has already run in the current session
SELECT t.status, SUM(r.capacity) as trapped_capacity_seats
FROM Temp_Room_Report t
JOIN Room r ON t.room_number = r.room_number
WHERE t.status = 'Underutilized'
GROUP BY t.status;
```

**Output:**
```
+---------------+------------------------+
| status        | trapped_capacity_seats |
+---------------+------------------------+
| Underutilized |                    345 |
+---------------+------------------------+
```
