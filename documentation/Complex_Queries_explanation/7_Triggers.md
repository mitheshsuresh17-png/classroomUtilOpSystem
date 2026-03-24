# 7. Triggers

Triggers are stored procedural blocks of code that automatically "fire" (execute) in response to specific Data Manipulation Language (DML) events—such as `INSERT`, `UPDATE`, or `DELETE`—on a particular table.

They are essential for enforcing complex business logic rules at the deepest database layer before data is actually committed to disk.

---

## 1. Complex Validation Trigger

### Safe Schedule Insertion (`trg_prevent_booking_conflict`)
This project utilizes a highly complex `BEFORE INSERT` trigger on the `Course_Schedule` table that fundamentally acts as the central validation gateway for the entire application. 

Before any schedule record is saved, the trigger intercepts the data (`NEW.room_id`, `NEW.slot_id`) and runs two completely independent database queries to cross-verify the proposed insertion against real-world physical boundaries. If either boundary is breached, it throws a custom SQL Exception (`SIGNAL SQLSTATE '45000'`) strictly rejecting the insert.

```sql
DELIMITER //
CREATE TRIGGER trg_prevent_booking_conflict
BEFORE INSERT ON Course_Schedule
FOR EACH ROW
BEGIN
    DECLARE conflict_count INT;
    DECLARE room_cap INT;
    DECLARE student_cnt INT;

    -- Validation 1: Double Booking Overlap 
    -- Checks if the exact Room and Time Slot combination already exists in the schedule
    SELECT COUNT(*) INTO conflict_count
    FROM Course_Schedule
    WHERE room_id = NEW.room_id AND slot_id = NEW.slot_id;

    IF conflict_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Double Booking Error: The room is already occupied for this time slot!';
    END IF;

    -- Validation 2: Physical Seating Capacity 
    -- Looks up the physical dimensions of the Room and compares to the exact number of students in the Batch
    SELECT capacity INTO room_cap FROM Room WHERE room_id = NEW.room_id;
    SELECT student_count INTO student_cnt FROM Batch WHERE batch_id = NEW.batch_id;

    IF student_cnt > room_cap THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Capacity Error: Room capacity is insufficient for the batch size!';
    END IF;
END //
DELIMITER ;
```

---

## Real Case Scenarios (Triggers)

Below are practical examples demonstrating the trigger actively intercepting inserts.

### 1. Trigger Blocking an Operation
**Question:** What happens if we try to schedule a class for Batch 301 (45 students) into LAB1 (capacity 40)?

**SQL Statement:**
```sql
-- Batch 301 is 45 students, Room 304 (LAB1) holds 40.
INSERT INTO Course_Schedule (course_id, batch_id, room_id, slot_id) 
VALUES (201, 301, 304, 105);
```

**Output:**
```
ERROR 1644 (45000): Capacity Error: Room capacity is insufficient for the batch size!
```

### 2. Trigger Allowing an Operation
**Question:** What happens if we schedule Batch 301 (45 students) into LAB2 (capacity 60)?

**SQL Statement:**
```sql
-- Batch 301 is 45 students, Room 305 (LAB2) holds 60.
INSERT INTO Course_Schedule (course_id, batch_id, room_id, slot_id) 
VALUES (201, 301, 305, 105);
```

**Output:**
```
Query OK, 1 row affected (0.01 sec)
```

### 3. Trigger Blocking a Double-Book OVERLAP
**Question:** What happens if we try to schedule a totally different batch into Room 301 at Slot 101, which is already occupied?

**SQL Statement:**
```sql
-- Room 301 is already booked by Batch 201 continuously at Slot 101.
INSERT INTO Course_Schedule (course_id, batch_id, room_id, slot_id) 
VALUES (103, 203, 301, 101);
```

**Output:**
```
ERROR 1644 (45000): Double Booking Error: The room is already occupied for this time slot!
```

### 4. Advanced Analytics: Troubleshooting Trigger Blocks
**Question:** A professor is repeatedly getting the "Capacity Error" from the trigger when trying to book Batch 201 into Room UB102. Write the analytical investigation query necessary to mathematically prove to the professor why the trigger is rejecting them.

**SQL Statement:**
```sql
SELECT 
    b.batch_id, b.student_count AS attempted_students, 
    r.room_number, r.capacity AS max_room_capacity,
    (b.student_count - r.capacity) AS overflow_amount
FROM Batch b, Room r
WHERE b.batch_id = 201 AND r.room_number = 'UB102';
```

**Output:**
```
+----------+--------------------+-------------+-------------------+-----------------+
| batch_id | attempted_students | room_number | max_room_capacity | overflow_amount |
+----------+--------------------+-------------+-------------------+-----------------+
|      201 |                 65 | UB102       |                60 |               5 |
+----------+--------------------+-------------+-------------------+-----------------+
```
