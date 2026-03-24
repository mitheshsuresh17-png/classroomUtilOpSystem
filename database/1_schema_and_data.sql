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
    day_of_week VARCHAR(15) NOT NULL CHECK (day_of_week IN ('1', '2', '3', '4', '5')),
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
(101, '1', '08:00:00', '08:50:00'),
(102, '1', '08:50:00', '09:40:00'),
(103, '1', '09:45:00', '10:35:00'),
(104, '1', '10:40:00', '11:30:00'),
(105, '1', '11:35:00', '12:25:00'),
(106, '1', '12:30:00', '13:20:00'),
(107, '1', '13:25:00', '14:15:00'),
(108, '1', '14:20:00', '15:10:00'),
(109, '1', '15:10:00', '16:00:00'),
(110, '1', '16:00:00', '16:50:00'),
(111, '1', '16:50:00', '17:30:00'),
(112, '1', '17:30:00', '18:10:00'),
(201, '2', '08:00:00', '08:50:00'),
(202, '2', '08:50:00', '09:40:00'),
(203, '2', '09:45:00', '10:35:00'),
(204, '2', '10:40:00', '11:30:00'),
(205, '2', '11:35:00', '12:25:00'),
(206, '2', '12:30:00', '13:20:00'),
(207, '2', '13:25:00', '14:15:00'),
(208, '2', '14:20:00', '15:10:00'),
(209, '2', '15:10:00', '16:00:00'),
(210, '2', '16:00:00', '16:50:00'),
(211, '2', '16:50:00', '17:30:00'),
(212, '2', '17:30:00', '18:10:00'),
(301, '3', '08:00:00', '08:50:00'),
(302, '3', '08:50:00', '09:40:00'),
(303, '3', '09:45:00', '10:35:00'),
(304, '3', '10:40:00', '11:30:00'),
(305, '3', '11:35:00', '12:25:00'),
(306, '3', '12:30:00', '13:20:00'),
(307, '3', '13:25:00', '14:15:00'),
(308, '3', '14:20:00', '15:10:00'),
(309, '3', '15:10:00', '16:00:00'),
(310, '3', '16:00:00', '16:50:00'),
(311, '3', '16:50:00', '17:30:00'),
(312, '3', '17:30:00', '18:10:00'),
(401, '4', '08:00:00', '08:50:00'),
(402, '4', '08:50:00', '09:40:00'),
(403, '4', '09:45:00', '10:35:00'),
(404, '4', '10:40:00', '11:30:00'),
(405, '4', '11:35:00', '12:25:00'),
(406, '4', '12:30:00', '13:20:00'),
(407, '4', '13:25:00', '14:15:00'),
(408, '4', '14:20:00', '15:10:00'),
(409, '4', '15:10:00', '16:00:00'),
(410, '4', '16:00:00', '16:50:00'),
(411, '4', '16:50:00', '17:30:00'),
(412, '4', '17:30:00', '18:10:00'),
(501, '5', '08:00:00', '08:50:00'),
(502, '5', '08:50:00', '09:40:00'),
(503, '5', '09:45:00', '10:35:00'),
(504, '5', '10:40:00', '11:30:00'),
(505, '5', '11:35:00', '12:25:00'),
(506, '5', '12:30:00', '13:20:00'),
(507, '5', '13:25:00', '14:15:00'),
(508, '5', '14:20:00', '15:10:00'),
(509, '5', '15:10:00', '16:00:00'),
(510, '5', '16:00:00', '16:50:00'),
(511, '5', '16:50:00', '17:30:00'),
(512, '5', '17:30:00', '18:10:00');

INSERT INTO Course_Schedule (course_id, batch_id, room_id, slot_id) VALUES
(101, 201, 301, 101),
(102, 202, 302, 101),
(103, 203, 303, 102),
(101, 202, 301, 102);
