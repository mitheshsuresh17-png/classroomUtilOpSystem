-- =====================================================
-- CLASSROOM & LAB UTILIZATION OPTIMIZATION SYSTEM
-- MASTER SEED DATA (seed.sql)
-- =====================================================

-- Disable foreign key checks to allow truncating tables
SET FOREIGN_KEY_CHECKS = 0;

-- Clean out all existing data
TRUNCATE TABLE course_schedule;
TRUNCATE TABLE room_resource;
TRUNCATE TABLE batch;
TRUNCATE TABLE course;
TRUNCATE TABLE department;
TRUNCATE TABLE room;
TRUNCATE TABLE time_slot;
TRUNCATE TABLE room_type_lookup;
TRUNCATE TABLE resource;

-- 1. Seed Lookups (For Normalization Proofs)
INSERT INTO room_type_lookup (type_id, type_name) VALUES
(1, 'Classroom'),
(2, 'Lab'),
(3, 'Lecture Hall');

INSERT INTO resource (resource_id, resource_name) VALUES
(1, 'Projector'),
(2, 'Air Conditioner'),
(3, 'High-End PCs'),
(4, 'Fan'),
(5, 'Smart Board');

-- 2. Seed Base Entities (Matching Chapter 4 & 5 Report)
INSERT INTO department (dept_id, dept_name) VALUES
(1, 'Computer Science and Engineering'),
(2, 'Electronics and Communication Engineering');

INSERT INTO course (course_id, course_code, course_name, dept_id) VALUES
(101, 'CS205P', 'Database Management Systems', 1),
(102, 'CS206P', 'Operating Systems', 1),
(103, 'CS301T', 'Artificial Intelligence', 1),
(201, 'EC302T', 'Digital Image Processing', 2);

INSERT INTO batch (batch_id, year_of_study, section, student_count, dept_id) VALUES
(201, 2, 'A', 60, 1),
(202, 2, 'B', 58, 1),
(203, 3, 'A', 55, 1),
(301, 3, 'A', 45, 2);

INSERT INTO room (room_number, room_type, capacity) VALUES
('UB101', 'Classroom', 65),
('UB102', 'Classroom', 60),
('UB201', 'Lecture Hall', 120),
('LAB1', 'Lab', 40);

-- 3. Seed Full Time Slot Grid (5 days × 10 periods, 08:00 – 17:50)
-- This is the college-wide standard grid; slot IDs are sequential 1–50.
-- Day 1 = Monday, Day 2 = Tuesday, ... Day 5 = Friday.
INSERT INTO time_slot (slot_id, day_of_week, start_time, end_time) VALUES
-- Day 1 (Monday)
(1,  '1', '08:00:00', '08:50:00'),
(2,  '1', '09:00:00', '09:50:00'),
(3,  '1', '10:00:00', '10:50:00'),
(4,  '1', '11:00:00', '11:50:00'),
(5,  '1', '12:00:00', '12:50:00'),
(6,  '1', '13:00:00', '13:50:00'),
(7,  '1', '14:00:00', '14:50:00'),
(8,  '1', '15:00:00', '15:50:00'),
(9,  '1', '16:00:00', '16:50:00'),
(10, '1', '17:00:00', '17:50:00'),
-- Day 2 (Tuesday)
(11, '2', '08:00:00', '08:50:00'),
(12, '2', '09:00:00', '09:50:00'),
(13, '2', '10:00:00', '10:50:00'),
(14, '2', '11:00:00', '11:50:00'),
(15, '2', '12:00:00', '12:50:00'),
(16, '2', '13:00:00', '13:50:00'),
(17, '2', '14:00:00', '14:50:00'),
(18, '2', '15:00:00', '15:50:00'),
(19, '2', '16:00:00', '16:50:00'),
(20, '2', '17:00:00', '17:50:00'),
-- Day 3 (Wednesday)
(21, '3', '08:00:00', '08:50:00'),
(22, '3', '09:00:00', '09:50:00'),
(23, '3', '10:00:00', '10:50:00'),
(24, '3', '11:00:00', '11:50:00'),
(25, '3', '12:00:00', '12:50:00'),
(26, '3', '13:00:00', '13:50:00'),
(27, '3', '14:00:00', '14:50:00'),
(28, '3', '15:00:00', '15:50:00'),
(29, '3', '16:00:00', '16:50:00'),
(30, '3', '17:00:00', '17:50:00'),
-- Day 4 (Thursday)
(31, '4', '08:00:00', '08:50:00'),
(32, '4', '09:00:00', '09:50:00'),
(33, '4', '10:00:00', '10:50:00'),
(34, '4', '11:00:00', '11:50:00'),
(35, '4', '12:00:00', '12:50:00'),
(36, '4', '13:00:00', '13:50:00'),
(37, '4', '14:00:00', '14:50:00'),
(38, '4', '15:00:00', '15:50:00'),
(39, '4', '16:00:00', '16:50:00'),
(40, '4', '17:00:00', '17:50:00'),
-- Day 5 (Friday)
(41, '5', '08:00:00', '08:50:00'),
(42, '5', '09:00:00', '09:50:00'),
(43, '5', '10:00:00', '10:50:00'),
(44, '5', '11:00:00', '11:50:00'),
(45, '5', '12:00:00', '12:50:00'),
(46, '5', '13:00:00', '13:50:00'),
(47, '5', '14:00:00', '14:50:00'),
(48, '5', '15:00:00', '15:50:00'),
(49, '5', '16:00:00', '16:50:00'),
(50, '5', '17:00:00', '17:50:00');

-- 4. Seed Intersection Tables (4NF Proof)
INSERT INTO room_resource (room_number, resource_id) VALUES
('UB101', 1), -- UB101 has Projector
('UB101', 2), -- UB101 has Air Conditioner
('UB102', 1), -- UB102 has Projector
('UB102', 4), -- UB102 has Fan
('LAB1', 3),  -- LAB1 has High-End PCs
('LAB1', 5);  -- LAB1 has Smart Board

-- 5. Seed Initial Schedule (Matching Transaction 1 & 5NF Proof)
-- slot_id 1 = Day 1, 08:00 (old 101); slot_id 14 = Day 2, 11:00 (old 105); slot_id 27 = Day 3, 14:00 (old 108)
INSERT INTO course_schedule (schedule_id, course_id, batch_id, room_number, slot_id) VALUES
(1, 101, 201, 'UB101', 1),   -- DBMS in UB101, Day 1 (Mon) 08:00
(2, 102, 202, 'UB102', 14),  -- OS in UB102, Day 2 (Tue) 11:00
(3, 103, 203, 'UB201', 27);  -- AI in UB201, Day 3 (Wed) 14:00

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
