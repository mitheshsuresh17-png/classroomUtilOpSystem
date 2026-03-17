/*
  # Insert Sample Data for Testing
  
  ## Overview
  This migration populates all tables with realistic sample data for demonstration.
  
  ## Data Inserted
  - 4 Departments (CS, EC, ME, CE)
  - 10 Courses across departments
  - 11 Batches (different years and sections)
  - 10 Rooms (Classrooms, Labs, Lecture Halls)
  - 18 Time Slots (Monday-Friday, various times)
  - 12 Course Schedules (sample allocations)
*/

-- Insert Departments
INSERT INTO department (dept_name) VALUES
  ('Computer Science'),
  ('Electronics and Communication'),
  ('Mechanical Engineering'),
  ('Civil Engineering')
ON CONFLICT (dept_name) DO NOTHING;

-- Insert Courses
WITH dept_ids AS (
  SELECT dept_id, dept_name FROM department
)
INSERT INTO course (course_name, course_code, dept_id)
SELECT * FROM (VALUES
  ('Data Structures', 'CS201', (SELECT dept_id FROM dept_ids WHERE dept_name = 'Computer Science')),
  ('Database Management Systems', 'CS301', (SELECT dept_id FROM dept_ids WHERE dept_name = 'Computer Science')),
  ('Operating Systems', 'CS302', (SELECT dept_id FROM dept_ids WHERE dept_name = 'Computer Science')),
  ('Computer Networks', 'CS401', (SELECT dept_id FROM dept_ids WHERE dept_name = 'Computer Science')),
  ('Digital Electronics', 'EC201', (SELECT dept_id FROM dept_ids WHERE dept_name = 'Electronics and Communication')),
  ('Signal Processing', 'EC301', (SELECT dept_id FROM dept_ids WHERE dept_name = 'Electronics and Communication')),
  ('Thermodynamics', 'ME201', (SELECT dept_id FROM dept_ids WHERE dept_name = 'Mechanical Engineering')),
  ('Fluid Mechanics', 'ME301', (SELECT dept_id FROM dept_ids WHERE dept_name = 'Mechanical Engineering')),
  ('Structural Analysis', 'CE301', (SELECT dept_id FROM dept_ids WHERE dept_name = 'Civil Engineering')),
  ('Geotechnical Engineering', 'CE401', (SELECT dept_id FROM dept_ids WHERE dept_name = 'Civil Engineering'))
) AS t(course_name, course_code, dept_id)
ON CONFLICT (course_code) DO NOTHING;

-- Insert Batches
WITH dept_ids AS (
  SELECT dept_id, dept_name FROM department
)
INSERT INTO batch (year_of_study, section, student_count, dept_id)
SELECT * FROM (VALUES
  (2, 'A', 45, (SELECT dept_id FROM dept_ids WHERE dept_name = 'Computer Science')),
  (2, 'B', 50, (SELECT dept_id FROM dept_ids WHERE dept_name = 'Computer Science')),
  (3, 'A', 48, (SELECT dept_id FROM dept_ids WHERE dept_name = 'Computer Science')),
  (3, 'B', 42, (SELECT dept_id FROM dept_ids WHERE dept_name = 'Computer Science')),
  (4, 'A', 40, (SELECT dept_id FROM dept_ids WHERE dept_name = 'Computer Science')),
  (2, 'A', 55, (SELECT dept_id FROM dept_ids WHERE dept_name = 'Electronics and Communication')),
  (3, 'A', 50, (SELECT dept_id FROM dept_ids WHERE dept_name = 'Electronics and Communication')),
  (2, 'A', 60, (SELECT dept_id FROM dept_ids WHERE dept_name = 'Mechanical Engineering')),
  (3, 'A', 58, (SELECT dept_id FROM dept_ids WHERE dept_name = 'Mechanical Engineering')),
  (3, 'A', 52, (SELECT dept_id FROM dept_ids WHERE dept_name = 'Civil Engineering')),
  (4, 'A', 48, (SELECT dept_id FROM dept_ids WHERE dept_name = 'Civil Engineering'))
) AS t(year_of_study, section, student_count, dept_id)
ON CONFLICT (dept_id, year_of_study, section) DO NOTHING;

-- Insert Rooms
INSERT INTO room (room_number, room_type, capacity) VALUES
  ('101', 'Classroom', 50),
  ('102', 'Classroom', 60),
  ('103', 'Lab', 45),
  ('104', 'Lab', 40),
  ('105', 'Classroom', 55),
  ('201', 'Lecture Hall', 100),
  ('202', 'Lecture Hall', 120),
  ('203', 'Lab', 50),
  ('204', 'Classroom', 45),
  ('205', 'Lab', 35)
ON CONFLICT (room_number) DO NOTHING;

-- Insert Time Slots
INSERT INTO time_slot (day, start_time, end_time) VALUES
  ('Monday', '09:00', '10:00'),
  ('Monday', '10:00', '11:00'),
  ('Monday', '11:00', '12:00'),
  ('Monday', '14:00', '15:00'),
  ('Monday', '15:00', '16:00'),
  ('Tuesday', '09:00', '10:00'),
  ('Tuesday', '10:00', '11:00'),
  ('Tuesday', '11:00', '12:00'),
  ('Tuesday', '14:00', '15:00'),
  ('Wednesday', '09:00', '10:00'),
  ('Wednesday', '10:00', '11:00'),
  ('Wednesday', '14:00', '15:00'),
  ('Thursday', '09:00', '10:00'),
  ('Thursday', '10:00', '11:00'),
  ('Thursday', '14:00', '15:00'),
  ('Friday', '09:00', '10:00'),
  ('Friday', '10:00', '11:00'),
  ('Friday', '11:00', '12:00')
ON CONFLICT (day, start_time, end_time) DO NOTHING;

-- Temporarily disable the trigger for initial data load
ALTER TABLE course_schedule DISABLE TRIGGER trigger_prevent_double_booking;

-- Insert Course Schedules with proper capacity matching
WITH 
  courses AS (SELECT course_id, course_code FROM course),
  batches AS (SELECT batch_id, dept_id, year_of_study, section, student_count FROM batch),
  rooms AS (SELECT room_id, room_number, capacity FROM room),
  slots AS (SELECT slot_id, day, start_time FROM time_slot),
  depts AS (SELECT dept_id, dept_name FROM department)
INSERT INTO course_schedule (course_id, batch_id, room_id, slot_id)
SELECT * FROM (VALUES
  (
    (SELECT course_id FROM courses WHERE course_code = 'CS201'),
    (SELECT batch_id FROM batches b JOIN depts d ON b.dept_id = d.dept_id WHERE d.dept_name = 'Computer Science' AND year_of_study = 2 AND section = 'A'),
    (SELECT room_id FROM rooms WHERE room_number = '101'),
    (SELECT slot_id FROM slots WHERE day = 'Monday' AND start_time = '09:00')
  ),
  (
    (SELECT course_id FROM courses WHERE course_code = 'CS201'),
    (SELECT batch_id FROM batches b JOIN depts d ON b.dept_id = d.dept_id WHERE d.dept_name = 'Computer Science' AND year_of_study = 2 AND section = 'B'),
    (SELECT room_id FROM rooms WHERE room_number = '102'),
    (SELECT slot_id FROM slots WHERE day = 'Monday' AND start_time = '09:00')
  ),
  (
    (SELECT course_id FROM courses WHERE course_code = 'CS301'),
    (SELECT batch_id FROM batches b JOIN depts d ON b.dept_id = d.dept_id WHERE d.dept_name = 'Computer Science' AND year_of_study = 3 AND section = 'A'),
    (SELECT room_id FROM rooms WHERE room_number = '203'),
    (SELECT slot_id FROM slots WHERE day = 'Monday' AND start_time = '10:00')
  ),
  (
    (SELECT course_id FROM courses WHERE course_code = 'CS302'),
    (SELECT batch_id FROM batches b JOIN depts d ON b.dept_id = d.dept_id WHERE d.dept_name = 'Computer Science' AND year_of_study = 3 AND section = 'A'),
    (SELECT room_id FROM rooms WHERE room_number = '101'),
    (SELECT slot_id FROM slots WHERE day = 'Tuesday' AND start_time = '09:00')
  ),
  (
    (SELECT course_id FROM courses WHERE course_code = 'CS301'),
    (SELECT batch_id FROM batches b JOIN depts d ON b.dept_id = d.dept_id WHERE d.dept_name = 'Computer Science' AND year_of_study = 3 AND section = 'B'),
    (SELECT room_id FROM rooms WHERE room_number = '103'),
    (SELECT slot_id FROM slots WHERE day = 'Tuesday' AND start_time = '10:00')
  ),
  (
    (SELECT course_id FROM courses WHERE course_code = 'CS401'),
    (SELECT batch_id FROM batches b JOIN depts d ON b.dept_id = d.dept_id WHERE d.dept_name = 'Computer Science' AND year_of_study = 4 AND section = 'A'),
    (SELECT room_id FROM rooms WHERE room_number = '201'),
    (SELECT slot_id FROM slots WHERE day = 'Wednesday' AND start_time = '09:00')
  ),
  (
    (SELECT course_id FROM courses WHERE course_code = 'EC201'),
    (SELECT batch_id FROM batches b JOIN depts d ON b.dept_id = d.dept_id WHERE d.dept_name = 'Electronics and Communication' AND year_of_study = 2 AND section = 'A'),
    (SELECT room_id FROM rooms WHERE room_number = '102'),
    (SELECT slot_id FROM slots WHERE day = 'Monday' AND start_time = '11:00')
  ),
  (
    (SELECT course_id FROM courses WHERE course_code = 'EC301'),
    (SELECT batch_id FROM batches b JOIN depts d ON b.dept_id = d.dept_id WHERE d.dept_name = 'Electronics and Communication' AND year_of_study = 3 AND section = 'A'),
    (SELECT room_id FROM rooms WHERE room_number = '203'),
    (SELECT slot_id FROM slots WHERE day = 'Thursday' AND start_time = '09:00')
  ),
  (
    (SELECT course_id FROM courses WHERE course_code = 'ME201'),
    (SELECT batch_id FROM batches b JOIN depts d ON b.dept_id = d.dept_id WHERE d.dept_name = 'Mechanical Engineering' AND year_of_study = 2 AND section = 'A'),
    (SELECT room_id FROM rooms WHERE room_number = '202'),
    (SELECT slot_id FROM slots WHERE day = 'Friday' AND start_time = '09:00')
  ),
  (
    (SELECT course_id FROM courses WHERE course_code = 'ME301'),
    (SELECT batch_id FROM batches b JOIN depts d ON b.dept_id = d.dept_id WHERE d.dept_name = 'Mechanical Engineering' AND year_of_study = 3 AND section = 'A'),
    (SELECT room_id FROM rooms WHERE room_number = '202'),
    (SELECT slot_id FROM slots WHERE day = 'Tuesday' AND start_time = '10:00')
  ),
  (
    (SELECT course_id FROM courses WHERE course_code = 'CE301'),
    (SELECT batch_id FROM batches b JOIN depts d ON b.dept_id = d.dept_id WHERE d.dept_name = 'Civil Engineering' AND year_of_study = 3 AND section = 'A'),
    (SELECT room_id FROM rooms WHERE room_number = '105'),
    (SELECT slot_id FROM slots WHERE day = 'Wednesday' AND start_time = '10:00')
  ),
  (
    (SELECT course_id FROM courses WHERE course_code = 'CE401'),
    (SELECT batch_id FROM batches b JOIN depts d ON b.dept_id = d.dept_id WHERE d.dept_name = 'Civil Engineering' AND year_of_study = 4 AND section = 'A'),
    (SELECT room_id FROM rooms WHERE room_number = '101'),
    (SELECT slot_id FROM slots WHERE day = 'Friday' AND start_time = '10:00')
  )
) AS t(course_id, batch_id, room_id, slot_id)
WHERE t.course_id IS NOT NULL 
  AND t.batch_id IS NOT NULL 
  AND t.room_id IS NOT NULL 
  AND t.slot_id IS NOT NULL
ON CONFLICT (room_id, slot_id) DO NOTHING;

-- Re-enable the trigger
ALTER TABLE course_schedule ENABLE TRIGGER trigger_prevent_double_booking;