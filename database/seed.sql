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

-- 3. Seed Time Slots (Matching Transactions)
INSERT INTO time_slot (slot_id, day_of_week, start_time, end_time) VALUES
(101, '1', '08:00:00', '08:50:00'),
(105, '2', '11:00:00', '11:50:00'),
(108, '3', '14:00:00', '14:50:00');

-- 4. Seed Intersection Tables (4NF Proof)
INSERT INTO room_resource (room_number, resource_id) VALUES
('UB101', 1), -- UB101 has Projector
('UB101', 2), -- UB101 has AC
('UB102', 1), -- UB102 has Projector
('UB102', 4), -- UB102 has Fan
('LAB1', 3), -- LAB1 has High-End PCs
('LAB1', 5); -- LAB1 has Smart Board

-- 5. Seed Initial Schedule (Matching Transaction 1 & 5NF Proof)
INSERT INTO course_schedule (schedule_id, course_id, batch_id, room_number, slot_id) VALUES
(1, 101, 201, 'UB101', 101), -- DBMS in UB101
(2, 102, 202, 'UB102', 101), -- OS in UB102
(3, 103, 203, 'UB201', 101); -- AI in UB201

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
