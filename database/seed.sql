-- =====================================================
-- CLASSROOM & LAB UTILIZATION OPTIMIZATION SYSTEM
-- MASTER SEED DATA (seed.sql) - Expanded Academic Dataset
-- 10 Batches • 12 Faculty • 20 Courses • 10 Rooms • Rich Schedules
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

-- 2. Seed Base Entities (Departments)
INSERT INTO Department (dept_id, dept_name) VALUES
(1, 'Computer Science and Engineering'),
(2, 'Electronics and Communication Engineering'),
(3, 'Mechanical Engineering');

-- 3. Seed Faculty Members (12 Professors & Academic Faculty)
INSERT INTO Faculty (faculty_id, faculty_name, email, dept_id, designation, max_weekly_slots) VALUES
(1001, 'Dr. Alan Turing', 'alan.turing@college.edu', 1, 'Professor', 16),
(1002, 'Dr. Grace Hopper', 'grace.hopper@college.edu', 1, 'Associate Professor', 16),
(1003, 'Dr. Claude Shannon', 'claude.shannon@college.edu', 2, 'Professor', 16),
(1004, 'Dr. Ada Lovelace', 'ada.lovelace@college.edu', 1, 'Assistant Professor', 14),
(1005, 'Dr. John von Neumann', 'john.vonneumann@college.edu', 1, 'Professor', 18),
(1006, 'Dr. Barbara Liskov', 'barbara.liskov@college.edu', 1, 'Associate Professor', 14),
(1007, 'Dr. Donald Knuth', 'donald.knuth@college.edu', 1, 'Professor', 16),
(1008, 'Dr. Heinrich Hertz', 'heinrich.hertz@college.edu', 2, 'Professor', 16),
(1009, 'Dr. James Clerk Maxwell', 'james.maxwell@college.edu', 2, 'Associate Professor', 14),
(1010, 'Dr. Nikola Tesla', 'nikola.tesla@college.edu', 2, 'Assistant Professor', 14),
(1011, 'Dr. James Watt', 'james.watt@college.edu', 3, 'Professor', 16),
(1012, 'Dr. Isaac Newton', 'isaac.newton@college.edu', 3, 'Associate Professor', 16);

-- 4. Seed Courses (20 Courses ending in T, P, or J)
INSERT INTO Course (course_id, course_code, course_name, dept_id) VALUES
-- CSE Courses
(101, '18CSC101T', 'Programming in C', 1),
(102, '18CSC102P', 'Programming Lab', 1),
(103, '18CSC201T', 'Data Structures & Algorithms', 1),
(104, '18CSC202P', 'Data Structures Lab', 1),
(105, '18CSC205J', 'Database Management Systems', 1),
(106, '18CSC206P', 'Operating Systems Lab', 1),
(107, '18CSC301T', 'Artificial Intelligence', 1),
(108, '18CSC302T', 'Computer Networks', 1),
(109, '18CSC303P', 'Computer Networks Lab', 1),
(110, '18CSC304T', 'Software Engineering', 1),
(111, '18CSC305T', 'Cloud Computing', 1),
(112, '18CSC401T', 'Machine Learning', 1),
(113, '18CSC402P', 'Machine Learning Lab', 1),
(114, '18CSC403T', 'Cyber Security & Forensics', 1),
-- ECE Courses
(201, '18ECC201T', 'Signals and Systems', 2),
(202, '18ECC202P', 'Electronic Devices Lab', 2),
(203, '18ECC301T', 'Microprocessors & Microcontrollers', 2),
(204, '18ECC302T', 'Digital Image Processing', 2),
(205, '18ECC303P', 'Microprocessors Lab', 2),
-- ME Courses
(301, '18MEC101T', 'Engineering Mechanics', 3);

-- 5. Seed Batches (10 Student Cohorts across Year 1-4)
INSERT INTO Batch (batch_id, year_of_study, section, student_count, dept_id) VALUES
(101, 1, 'A', 55, 1),
(102, 1, 'B', 50, 1),
(201, 2, 'A', 60, 1),
(202, 2, 'B', 58, 1),
(203, 2, 'C', 35, 1), -- Lab-sized cohort fits 40-cap labs
(301, 3, 'A', 55, 1),
(302, 3, 'B', 52, 1),
(303, 3, 'C', 36, 1), -- Lab-sized cohort
(304, 3, 'A', 45, 2), -- ECE Year 3 Sec A
(401, 4, 'A', 48, 1); -- CSE Year 4 Sec A

-- 6. Seed Rooms (10 Venues: Classrooms, Lecture Halls, and Specialized Labs)
INSERT INTO Room (room_number, room_type, capacity) VALUES
('UB101', 'Classroom', 65),
('UB102', 'Classroom', 65),
('UB103', 'Classroom', 60),
('UB201', 'Lecture Hall', 120),
('UB202', 'Lecture Hall', 100),
('UB301', 'Classroom', 70),
('LAB1', 'Lab', 40),
('LAB2', 'Lab', 40),
('LAB3', 'Lab', 40),
('LAB4', 'Lab', 40);

-- 7. Seed Unified 50-Slot Time Grid (5 Days × 10 Periods, 08:00 – 16:50)
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
('UB101', 1), ('UB101', 2),
('UB102', 1), ('UB102', 4),
('UB103', 1), ('UB103', 2),
('UB201', 1), ('UB201', 2), ('UB201', 5),
('UB202', 1), ('UB202', 2),
('UB301', 1), ('UB301', 5),
('LAB1', 3),  ('LAB1', 5),  ('LAB1', 2),
('LAB2', 3),  ('LAB2', 2),
('LAB3', 3),  ('LAB3', 5),
('LAB4', 3),  ('LAB4', 2);

-- 9. Seed Administrative Users
INSERT INTO users (id, name, email, password_hash, role) VALUES
(1, 'Department Coordinator', 'coordinator@college.edu', '$2b$10$Jmtekl/KZmivVCFLfm1diOBQYHbFX3cCmdYQOuAPfP2QQQYyE.CzW', 'coordinator'),
(2, 'Department Viewer', 'viewer@college.edu', '$2b$10$7HT2HYBEdWxLYl0jMKSk.uuV6ltPhJThHTHQn8UlwjLMBfzGVO9H6', 'viewer');

-- 10. Seed Realistic Academic Schedules
-- Carefully mapped ensuring:
-- - No room double-booking
-- - No batch double-booking
-- - No faculty double-booking
-- - Theory courses (T) in Classrooms/Lecture Halls
-- - Practical courses (P) in Labs
-- - Batch capacity <= Room capacity
-- - Shift rule: no faculty has Hour 1 and Hour 10 on the same day
-- - Faculty invariance: (course, batch) assigned consistently to same faculty

INSERT INTO Course_Schedule (schedule_id, course_id, batch_id, room_number, slot_id, faculty_id, created_by) VALUES
-- Batch 201 (CSE Year 2 Sec A, 60 students)
-- DBMS (105, Joint - in Theory slot / Classroom UB101) with Dr. Alan Turing
(1,  105, 201, 'UB101', 6,  1001, 1), -- Mon Hr 6 (Slot A)
(2,  105, 201, 'UB101', 7,  1001, 1), -- Mon Hr 7 (Slot A)
(3,  105, 201, 'UB101', 15, 1001, 1), -- Tue Hr 5 (Slot A)
(4,  105, 201, 'UB101', 28, 1001, 1), -- Wed Hr 8 (Slot A)
-- AI (107, Theory in UB201 Lecture Hall) with Dr. Barbara Liskov
(5,  107, 201, 'UB201', 13, 1006, 1), -- Tue Hr 3 (Slot G)
(6,  107, 201, 'UB201', 14, 1006, 1), -- Tue Hr 4 (Slot G)

-- Batch 202 (CSE Year 2 Sec B, 58 students)
-- Data Structures (103, Theory in UB102) with Dr. Donald Knuth
(7,  103, 202, 'UB102', 11, 1007, 1), -- Tue Hr 1 (Slot B)
(8,  103, 202, 'UB102', 12, 1007, 1), -- Tue Hr 2 (Slot B)
(9,  103, 202, 'UB102', 33, 1007, 1), -- Thu Hr 3 (Slot B)
-- Software Engineering (110, Theory in UB102) with Dr. Ada Lovelace
(10, 110, 202, 'UB102', 26, 1004, 1), -- Wed Hr 6 (Slot C)
(11, 110, 202, 'UB102', 27, 1004, 1), -- Wed Hr 7 (Slot C)

-- Batch 203 (CSE Year 2 Sec C, 35 students - Lab cohort)
-- Operating Systems Lab (106, Practical in LAB1) with Dr. Grace Hopper
(12, 106, 203, 'LAB1', 1,  1002, 1), -- Mon Hr 1 (Slot P1)
(13, 106, 203, 'LAB1', 2,  1002, 1), -- Mon Hr 2 (Slot P2)
-- Data Structures Lab (104, Practical in LAB2) with Dr. Donald Knuth
(14, 104, 203, 'LAB2', 16, 1007, 1), -- Tue Hr 6 (Slot P16)
(15, 104, 203, 'LAB2', 17, 1007, 1), -- Tue Hr 7 (Slot P17)

-- Batch 301 (CSE Year 3 Sec A, 55 students)
-- Computer Networks (108, Theory in UB103) with Dr. John von Neumann
(151, 108, 301, 'UB103', 31, 1005, 1), -- Thu Hr 1 (Slot D)
(152, 108, 301, 'UB103', 32, 1005, 1), -- Thu Hr 2 (Slot D)
-- Cloud Computing (111, Theory in UB202) with Dr. Barbara Liskov
(153, 111, 301, 'UB202', 46, 1006, 1), -- Fri Hr 6 (Slot E)
(154, 111, 301, 'UB202', 47, 1006, 1), -- Fri Hr 7 (Slot E)

-- Batch 303 (CSE Year 3 Sec C, 36 students - Lab cohort)
-- Computer Networks Lab (109, Practical in LAB3) with Dr. John von Neumann
(155, 109, 303, 'LAB3', 21, 1005, 1), -- Wed Hr 1 (Slot P21)
(156, 109, 303, 'LAB3', 22, 1005, 1), -- Wed Hr 2 (Slot P22)

-- Batch 304 (ECE Year 3 Sec A, 45 students)
-- Digital Image Processing (204, Theory in UB301) with Dr. Claude Shannon
(157, 204, 304, 'UB301', 8,  1003, 1), -- Mon Hr 8 (Slot F)
(158, 204, 304, 'UB301', 9,  1003, 1), -- Mon Hr 9 (Slot F)
-- Microprocessors (203, Theory in UB301) with Dr. Heinrich Hertz
(159, 203, 304, 'UB301', 34, 1008, 1), -- Thu Hr 4 (Slot E)
(160, 203, 304, 'UB301', 35, 1008, 1), -- Thu Hr 5 (Slot C)

-- Batch 401 (CSE Year 4 Sec A, 48 students)
-- Machine Learning (112, Theory in UB201) with Dr. Alan Turing
(161, 112, 401, 'UB201', 29, 1001, 1), -- Wed Hr 9 (Slot D)
(162, 112, 401, 'UB201', 48, 1001, 1), -- Fri Hr 8 (Slot C)
-- Cyber Security (114, Theory in UB103) with Dr. Ada Lovelace
(163, 114, 401, 'UB103', 49, 1004, 1), -- Fri Hr 9 (Slot F)

-- Batch 101 (CSE Year 1 Sec A, 55 students)
-- Programming in C (101, Theory in UB101) with Dr. Grace Hopper
(164, 101, 101, 'UB101', 33, 1002, 1), -- Thu Hr 3 (Slot B)
(165, 101, 101, 'UB101', 35, 1002, 1); -- Thu Hr 5 (Slot C)

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
