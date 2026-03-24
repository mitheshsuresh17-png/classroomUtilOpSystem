# 1. Constraints (DDL & DML)
Constraints maintain relational integrity and data validity. Below are the complete table definitions for the Classroom Utilization System containing all Primary Key, Foreign Key, CHECK, and UNIQUE constraints.

### 1. Department Table
Defines the `dept_name` with a `UNIQUE` constraint to prevent duplicate departments.
```sql
CREATE TABLE Department (
    dept_id INT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL UNIQUE
);
```

### 2. Course Table
Defines `course_code` as `UNIQUE` and uses a `FOREIGN KEY` to link to the Department table with cascading deletes.
```sql
CREATE TABLE Course (
    course_id INT PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    course_code VARCHAR(10) NOT NULL UNIQUE,
    dept_id INT NOT NULL,
    FOREIGN KEY (dept_id) REFERENCES Department(dept_id) ON DELETE CASCADE
);
```

### 3. Batch Table
Uses `CHECK` constraints to ensure year of study (1-4) and positive student counts. It relies on a composite `UNIQUE` constraint to prevent identical batches in the same department.
```sql
CREATE TABLE Batch (
    batch_id INT PRIMARY KEY,
    year_of_study INT NOT NULL CHECK (year_of_study BETWEEN 1 AND 4),
    section CHAR(1) NOT NULL,
    student_count INT NOT NULL CHECK (student_count > 0),
    dept_id INT NOT NULL,
    UNIQUE(year_of_study, section, dept_id),
    FOREIGN KEY (dept_id) REFERENCES Department(dept_id) ON DELETE CASCADE
);
```

### 4. Room Table
Uses `CHECK` constraints to validate `room_type` against an ENUM-like list and ensures `capacity` is strictly positive.
```sql
CREATE TABLE Room (
    room_id INT PRIMARY KEY,
    room_number VARCHAR(10) NOT NULL UNIQUE,
    room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('Classroom', 'Lab', 'Lecture Hall')),
    capacity INT NOT NULL CHECK (capacity > 0)
);
```

### 5. Time_Slot Table
Validates `day_of_week` strictly falls between 1 and 5 (representing Monday-Friday) using a `CHECK` constraint. It also uses a table-level `CONSTRAINT` to ensure end times chronologically follow start times.
```sql
CREATE TABLE Time_Slot (
    slot_id INT PRIMARY KEY,
    day_of_week VARCHAR(15) NOT NULL CHECK (day_of_week IN ('1', '2', '3', '4', '5')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CONSTRAINT chk_time CHECK (end_time > start_time),
    UNIQUE(day_of_week, start_time, end_time)
);
```

### 6. Course_Schedule Table
The central linking table carrying multiple `FOREIGN KEY` definitions. It implements a critical `UNIQUE` constraint to prevent two courses running in the exact same room at the exact same time slot.
```sql
CREATE TABLE Course_Schedule (
    schedule_id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    batch_id INT NOT NULL,
    room_id INT NOT NULL,
    slot_id INT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES Batch(batch_id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES Room(room_id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES Time_Slot(slot_id) ON DELETE CASCADE,
    UNIQUE(room_id, slot_id) -- Prevents double booking at the schema level
);
```

---

## Real Case Scenarios (Constraint Violations)

Below are practical examples demonstrating how these constraints actively protect the system when invalid data is inserted.

### 1. PRIMARY KEY Violation
**Question:** What happens if a user tries to create a new department with an ID that already exists?

**SQL Statement:**
```sql
INSERT INTO Department (dept_id, dept_name) VALUES (1, 'Mechanical Engineering');
```

**Output:**
```
ERROR 1062 (23000): Duplicate entry '1' for key 'department.PRIMARY'
```

### 2. UNIQUE Constraint Violation
**Question:** What happens if an administrator tries to double-book a room at the exact same time slot?

**SQL Statement:**
```sql
-- Attempting to book Room 301 at Slot 101, which is already booked by Course 101.
INSERT INTO Course_Schedule (course_id, batch_id, room_id, slot_id) VALUES (102, 201, 301, 101);
```

**Output:**
```
ERROR 1062 (23000): Duplicate entry '301-101' for key 'course_schedule.room_id'
```

### 3. CHECK Constraint Violation
**Question:** What happens if a user tries to register a room with a negative seating capacity?

**SQL Statement:**
```sql
INSERT INTO Room (room_id, room_number, room_type, capacity) VALUES (401, 'UB301', 'Classroom', -10);
```

**Output:**
```
ERROR 3819 (HY000): Check constraint 'room_chk_2' is violated.
```

### 4. FOREIGN KEY Violation
**Question:** What happens if someone tries to schedule a course in a room that does not exist in the database?

**SQL Statement:**
```sql
-- Room ID 999 does not exist in the Room table
INSERT INTO Course_Schedule (course_id, batch_id, room_id, slot_id) VALUES (101, 201, 999, 101);
```

**Output:**
```
ERROR 1452 (23000): Cannot add or update a child row: a foreign key constraint fails (`classroom_utilization_db`.`course_schedule`, CONSTRAINT `course_schedule_ibfk_3` FOREIGN KEY (`room_id`) REFERENCES `room` (`room_id`) ON DELETE CASCADE)
```
