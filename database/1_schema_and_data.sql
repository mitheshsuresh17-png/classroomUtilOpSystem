-- =====================================================
-- CLASSROOM & LAB UTILIZATION OPTIMIZATION SYSTEM
-- DDL & DML Script (MySQL)
-- =====================================================

CREATE DATABASE IF NOT EXISTS classroom_utilization_db;
USE classroom_utilization_db;

-- -----------------------------------------------------
-- 1. DDL: Create Tables with Constraints
-- -----------------------------------------------------

CREATE TABLE Department (
    dept_id INT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE Course (
    course_id INT PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    course_code VARCHAR(10) NOT NULL UNIQUE,
    dept_id INT NOT NULL,
    FOREIGN KEY (dept_id) REFERENCES Department(dept_id) ON DELETE CASCADE
);

CREATE TABLE Batch (
    batch_id INT PRIMARY KEY,
    year_of_study INT NOT NULL CHECK (year_of_study BETWEEN 1 AND 4),
    section CHAR(1) NOT NULL,
    student_count INT NOT NULL CHECK (student_count > 0),
    dept_id INT NOT NULL,
    UNIQUE(year_of_study, section, dept_id),
    FOREIGN KEY (dept_id) REFERENCES Department(dept_id) ON DELETE CASCADE
);

CREATE TABLE Room (
    room_id INT PRIMARY KEY,
    room_number VARCHAR(10) NOT NULL UNIQUE,
    room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('Classroom', 'Lab', 'Lecture Hall')),
    capacity INT NOT NULL CHECK (capacity > 0)
);

CREATE TABLE Time_Slot (
    slot_id INT PRIMARY KEY,
    day_of_week VARCHAR(15) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CONSTRAINT chk_time CHECK (end_time > start_time),
    UNIQUE(day_of_week, start_time, end_time)
);

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

-- -----------------------------------------------------
-- 2. DML: Insert Sample Data
-- -----------------------------------------------------

INSERT INTO Department (dept_id, dept_name) VALUES
(1, 'Computer Science and Engineering'),
(2, 'Electronics and Communication Engineering');

INSERT INTO Course (course_id, course_name, course_code, dept_id) VALUES
(101, 'Database Management Systems', 'CS205P', 1),
(102, 'Operating Systems', 'CS206P', 1),
(103, 'Artificial Intelligence', 'CS301T', 1),
(201, 'Digital Image Processing', 'EC302T', 2);

INSERT INTO Batch (batch_id, year_of_study, section, student_count, dept_id) VALUES
(201, 2, 'A', 60, 1),
(202, 2, 'B', 58, 1),
(203, 3, 'A', 55, 1),
(301, 3, 'A', 45, 2);

INSERT INTO Room (room_id, room_number, room_type, capacity) VALUES
(301, 'UB101', 'Classroom', 65),
(302, 'UB102', 'Classroom', 60),
(303, 'UB201', 'Lecture Hall', 120),
(304, 'LAB1', 'Lab', 40),
(305, 'LAB2', 'Lab', 60);

INSERT INTO Time_Slot (slot_id, day_of_week, start_time, end_time) VALUES
(401, 'Monday', '09:00:00', '10:00:00'),
(402, 'Monday', '10:00:00', '11:00:00'),
(403, 'Tuesday', '09:00:00', '11:00:00');

INSERT INTO Course_Schedule (course_id, batch_id, room_id, slot_id) VALUES
(101, 201, 301, 401),
(102, 202, 302, 401),
(103, 203, 303, 402),
(101, 202, 301, 402);
