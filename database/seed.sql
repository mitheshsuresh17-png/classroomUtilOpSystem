-- =====================================================
-- CLASSROOM & LAB UTILIZATION OPTIMIZATION SYSTEM
-- MASTER SEED DATA (seed.sql) - Unified Batch 2 Schema
-- =====================================================

-- Disable foreign key checks to allow truncating tables
SET FOREIGN_KEY_CHECKS = 0;

-- Clean out all existing data
TRUNCATE TABLE Course_Schedule;
TRUNCATE TABLE Room_Resource;
TRUNCATE TABLE Batch;
TRUNCATE TABLE Course;
TRUNCATE TABLE Faculty;
TRUNCATE TABLE Department;
TRUNCATE TABLE Room;
TRUNCATE TABLE Time_Slot;
TRUNCATE TABLE Room_Type_Lookup;
TRUNCATE TABLE Resource;
TRUNCATE TABLE users;

-- 1. Seed Lookups
INSERT INTO Room_Type_Lookup (type_id, type_name) VALUES
(1, 'Classroom'),
(2, 'Lab'),
(3, 'Lecture Hall');

INSERT INTO Resource (resource_id, resource_name) VALUES
(1, 'Projector'),
(2, 'Air Conditioner'),
(3, 'High-End PCs'),
(4, 'Fan'),
(5, 'Smart Board');

-- 2. Seed Base Entities
INSERT INTO Department (dept_id, dept_name) VALUES
(1, 'Computer Science and Engineering'),
(2, 'Electronics and Communication Engineering');

-- 3. Seed Faculty Members
INSERT INTO Faculty (faculty_id, faculty_name, email, dept_id, designation, max_weekly_slots) VALUES
(1001, 'Dr. Alan Turing', 'alan.turing@college.edu', 1, 'Professor', 16),
(1002, 'Dr. Grace Hopper', 'grace.hopper@college.edu', 1, 'Associate Professor', 16),
(1003, 'Dr. Claude Shannon', 'claude.shannon@college.edu', 2, 'Professor', 16),
(1004, 'Dr. Ada Lovelace', 'ada.lovelace@college.edu', 1, 'Assistant Professor', 14);

-- 4. Seed Courses (Strict 9-Character Course Codes ending in T, P, or J)
INSERT INTO Course (course_id, course_code, course_name, dept_id) VALUES
(101, '18CSC205J', 'Database Management Systems', 1),   -- Joint
(102, '18CSC206P', 'Operating Systems Lab', 1),          -- Practical
(103, '18CSC301T', 'Artificial Intelligence', 1),        -- Theory
(201, '18ECC302T', 'Digital Image Processing', 2);       -- Theory

-- 5. Seed Batches
INSERT INTO Batch (batch_id, year_of_study, section, student_count, dept_id) VALUES
(201, 2, 'A', 60, 1),
(202, 2, 'B', 58, 1),
(203, 3, 'A', 35, 1), -- Lab-sized batch (capacity fits LAB1)
(301, 3, 'A', 45, 2);

-- 6. Seed Rooms
INSERT INTO Room (room_number, room_type, capacity) VALUES
('UB101', 'Classroom', 65),
('UB102', 'Classroom', 60),
('UB201', 'Lecture Hall', 120),
('LAB1', 'Lab', 40),
('LAB2', 'Lab', 40);

-- 7. Seed Unified 50-Slot Time Grid (5 Days × 10 Periods, 08:00 – 16:50)
-- Hours 1–10 match official timetable:
-- 1: 08:00-08:50, 2: 08:50-09:40, 3: 09:45-10:35, 4: 10:40-11:30, 5: 11:35-12:25,
-- 6: 12:30-13:20, 7: 13:25-14:15, 8: 14:20-15:10, 9: 15:10-16:00, 10: 16:00-16:50.
INSERT INTO Time_Slot (slot_id, day_of_week, start_time, end_time, hour_order, slot_name, slot_type) VALUES
-- Day 1 (Monday)
(1,  '1', '08:00:00', '08:50:00', 1,  'P1',  'Lab'),
(2,  '1', '08:50:00', '09:40:00', 2,  'P2',  'Lab'),
(3,  '1', '09:45:00', '10:35:00', 3,  'P3',  'Lab'),
(4,  '1', '10:40:00', '11:30:00', 4,  'P4',  'Lab'),
(5,  '1', '11:35:00', '12:25:00', 5,  'P5',  'Lab'),
(6,  '1', '12:30:00', '13:20:00', 6,  'A',   'Theory'),
(7,  '1', '13:25:00', '14:15:00', 7,  'A',   'Theory'),
(8,  '1', '14:20:00', '15:10:00', 8,  'F',   'Theory'),
(9,  '1', '15:10:00', '16:00:00', 9,  'F',   'Theory'),
(10, '1', '16:00:00', '16:50:00', 10, 'G',   'Theory'),

-- Day 2 (Tuesday)
(11, '2', '08:00:00', '08:50:00', 1,  'B',   'Theory'),
(12, '2', '08:50:00', '09:40:00', 2,  'B',   'Theory'),
(13, '2', '09:45:00', '10:35:00', 3,  'G',   'Theory'),
(14, '2', '10:40:00', '11:30:00', 4,  'G',   'Theory'),
(15, '2', '11:35:00', '12:25:00', 5,  'A',   'Theory'),
(16, '2', '12:30:00', '13:20:00', 6,  'P16', 'Lab'),
(17, '2', '13:25:00', '14:15:00', 7,  'P17', 'Lab'),
(18, '2', '14:20:00', '15:10:00', 8,  'P18', 'Lab'),
(19, '2', '15:10:00', '16:00:00', 9,  'P19', 'Lab'),
(20, '2', '16:00:00', '16:50:00', 10, 'P20', 'Lab'),

-- Day 3 (Wednesday)
(21, '3', '08:00:00', '08:50:00', 1,  'P21', 'Lab'),
(22, '3', '08:50:00', '09:40:00', 2,  'P22', 'Lab'),
(23, '3', '09:45:00', '10:35:00', 3,  'P23', 'Lab'),
(24, '3', '10:40:00', '11:30:00', 4,  'P24', 'Lab'),
(25, '3', '11:35:00', '12:25:00', 5,  'P25', 'Lab'),
(26, '3', '12:30:00', '13:20:00', 6,  'C',   'Theory'),
(27, '3', '13:25:00', '14:15:00', 7,  'C',   'Theory'),
(28, '3', '14:20:00', '15:10:00', 8,  'A',   'Theory'),
(29, '3', '15:10:00', '16:00:00', 9,  'D',   'Theory'),
(30, '3', '16:00:00', '16:50:00', 10, 'B',   'Theory'),

-- Day 4 (Thursday)
(31, '4', '08:00:00', '08:50:00', 1,  'D',   'Theory'),
(32, '4', '08:50:00', '09:40:00', 2,  'D',   'Theory'),
(33, '4', '09:45:00', '10:35:00', 3,  'B',   'Theory'),
(34, '4', '10:40:00', '11:30:00', 4,  'E',   'Theory'),
(35, '4', '11:35:00', '12:25:00', 5,  'C',   'Theory'),
(36, '4', '12:30:00', '13:20:00', 6,  'P36', 'Lab'),
(37, '4', '13:25:00', '14:15:00', 7,  'P37', 'Lab'),
(38, '4', '14:20:00', '15:10:00', 8,  'P38', 'Lab'),
(39, '4', '15:10:00', '16:00:00', 9,  'P39', 'Lab'),
(40, '4', '16:00:00', '16:50:00', 10, 'P40', 'Lab'),

-- Day 5 (Friday)
(41, '5', '08:00:00', '08:50:00', 1,  'P41', 'Lab'),
(42, '5', '08:50:00', '09:40:00', 2,  'P42', 'Lab'),
(43, '5', '09:45:00', '10:35:00', 3,  'P43', 'Lab'),
(44, '5', '10:40:00', '11:30:00', 4,  'P44', 'Lab'),
(45, '5', '11:35:00', '12:25:00', 5,  'P45', 'Lab'),
(46, '5', '12:30:00', '13:20:00', 6,  'E',   'Theory'),
(47, '5', '13:25:00', '14:15:00', 7,  'E',   'Theory'),
(48, '5', '14:20:00', '15:10:00', 8,  'C',   'Theory'),
(49, '5', '15:10:00', '16:00:00', 9,  'F',   'Theory'),
(50, '5', '16:00:00', '16:50:00', 10, 'D',   'Theory');

-- 8. Seed Room Resources
INSERT INTO Room_Resource (room_number, resource_id) VALUES
('UB101', 1), -- Projector
('UB101', 2), -- Air Conditioner
('UB102', 1), -- Projector
('UB102', 4), -- Fan
('LAB1', 3),  -- High-End PCs
('LAB1', 5);  -- Smart Board

-- 9. Seed Administrative Users
INSERT INTO users (id, name, email, password_hash, role) VALUES
(1, 'Department Coordinator', 'coordinator@college.edu', '$2b$10$Jmtekl/KZmivVCFLfm1diOBQYHbFX3cCmdYQOuAPfP2QQQYyE.CzW', 'coordinator'),
(2, 'Department Viewer', 'viewer@college.edu', '$2b$10$7HT2HYBEdWxLYl0jMKSk.uuV6ltPhJThHTHQn8UlwjLMBfzGVO9H6', 'viewer');

-- 10. Seed Initial Schedules (Fully Compliant with Type, Shift, and Invariance Rules)
-- Schedule 1: 18CSC205J (Theory) in UB101 (Classroom), Slot 6 (Day 1 Hr 6 - Slot A), Dr. Alan Turing
-- Schedule 2: 18CSC206P (Practical) in LAB1 (Lab), Slot 1 (Day 1 Hr 1 - Slot P1), Dr. Grace Hopper
-- Schedule 3: 18CSC301T (Theory) in UB201 (Lecture Hall), Slot 14 (Day 2 Hr 4 - Slot G), Dr. Alan Turing
INSERT INTO Course_Schedule (schedule_id, course_id, batch_id, room_number, slot_id, faculty_id, created_by) VALUES
(1, 101, 201, 'UB101', 6, 1001, 1),
(2, 102, 203, 'LAB1', 1, 1002, 1),
(3, 103, 201, 'UB201', 14, 1001, 1);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
