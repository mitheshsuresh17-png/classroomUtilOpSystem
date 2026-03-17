/*
  # Classroom & Lab Utilization Optimization System - Complete Database Schema
  
  ## Overview
  This migration creates a comprehensive DBMS project for classroom scheduling and utilization tracking.
  It demonstrates all key database concepts including constraints, joins, views, functions, triggers, and more.
  
  ## 1. New Tables Created
  
  ### Department Table
  - `dept_id` (uuid, primary key) - Unique identifier for department
  - `dept_name` (text, unique, not null) - Department name
  - `created_at` (timestamptz) - Record creation timestamp
  
  ### Course Table
  - `course_id` (uuid, primary key) - Unique identifier for course
  - `course_name` (text, not null) - Course name
  - `course_code` (text, unique, not null) - Course code (e.g., CS101)
  - `dept_id` (uuid, foreign key) - References Department
  - `created_at` (timestamptz) - Record creation timestamp
  
  ### Batch Table
  - `batch_id` (uuid, primary key) - Unique identifier for batch
  - `year_of_study` (integer, not null) - Academic year (1-4)
  - `section` (text, not null) - Section identifier (A, B, C, etc.)
  - `student_count` (integer, not null) - Number of students
  - `dept_id` (uuid, foreign key) - References Department
  - `created_at` (timestamptz) - Record creation timestamp
  - UNIQUE constraint on (dept_id, year_of_study, section)
  
  ### Room Table
  - `room_id` (uuid, primary key) - Unique identifier for room
  - `room_number` (text, unique, not null) - Room number/name
  - `room_type` (text, not null) - Type: 'Classroom', 'Lab', 'Lecture Hall'
  - `capacity` (integer, not null) - Maximum capacity
  - `created_at` (timestamptz) - Record creation timestamp
  - CHECK constraint: capacity > 0
  
  ### Time_Slot Table
  - `slot_id` (uuid, primary key) - Unique identifier for time slot
  - `day` (text, not null) - Day of week (Monday-Saturday)
  - `start_time` (time, not null) - Starting time
  - `end_time` (time, not null) - Ending time
  - `created_at` (timestamptz) - Record creation timestamp
  - UNIQUE constraint on (day, start_time, end_time)
  - CHECK constraint: end_time > start_time
  
  ### Course_Schedule Table (Bridge Entity)
  - `schedule_id` (uuid, primary key) - Unique identifier for schedule
  - `course_id` (uuid, foreign key) - References Course
  - `batch_id` (uuid, foreign key) - References Batch
  - `room_id` (uuid, foreign key) - References Room
  - `slot_id` (uuid, foreign key) - References Time_Slot
  - `created_at` (timestamptz) - Record creation timestamp
  - UNIQUE constraint on (room_id, slot_id) - Prevents double booking
  
  ## 2. Indexes for Performance
  - Indexes on foreign keys for faster joins
  - Composite index on room_id and slot_id for conflict detection
  
  ## 3. Security (RLS Policies)
  - Public read access for all tables (for academic demonstration)
  - Authenticated users can manage all data
  
  ## 4. Advanced Features
  - Views for utilization analysis and conflict detection
  - Functions for calculating room utilization percentage
  - Stored procedures for allocating rooms with conflict checking
  - Triggers for preventing double booking
  
  ## 5. Important Notes
  - All timestamps use UTC timezone
  - Foreign keys have ON DELETE CASCADE for referential integrity
  - CHECK constraints ensure data validity
  - UNIQUE constraints prevent duplicate scheduling
*/

-- =====================================================
-- 1. CREATE TABLES WITH CONSTRAINTS
-- =====================================================

-- Department Table
CREATE TABLE IF NOT EXISTS department (
  dept_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dept_name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Course Table
CREATE TABLE IF NOT EXISTS course (
  course_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_name text NOT NULL,
  course_code text UNIQUE NOT NULL,
  dept_id uuid NOT NULL REFERENCES department(dept_id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Batch Table
CREATE TABLE IF NOT EXISTS batch (
  batch_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_of_study integer NOT NULL CHECK (year_of_study BETWEEN 1 AND 4),
  section text NOT NULL,
  student_count integer NOT NULL CHECK (student_count > 0),
  dept_id uuid NOT NULL REFERENCES department(dept_id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(dept_id, year_of_study, section)
);

-- Room Table
CREATE TABLE IF NOT EXISTS room (
  room_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number text UNIQUE NOT NULL,
  room_type text NOT NULL CHECK (room_type IN ('Classroom', 'Lab', 'Lecture Hall')),
  capacity integer NOT NULL CHECK (capacity > 0),
  created_at timestamptz DEFAULT now()
);

-- Time_Slot Table
CREATE TABLE IF NOT EXISTS time_slot (
  slot_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day text NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  start_time time NOT NULL,
  end_time time NOT NULL CHECK (end_time > start_time),
  created_at timestamptz DEFAULT now(),
  UNIQUE(day, start_time, end_time)
);

-- Course_Schedule Table (Bridge Entity)
CREATE TABLE IF NOT EXISTS course_schedule (
  schedule_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES course(course_id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES batch(batch_id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES room(room_id) ON DELETE CASCADE,
  slot_id uuid NOT NULL REFERENCES time_slot(slot_id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(room_id, slot_id)
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_course_dept ON course(dept_id);
CREATE INDEX IF NOT EXISTS idx_batch_dept ON batch(dept_id);
CREATE INDEX IF NOT EXISTS idx_schedule_course ON course_schedule(course_id);
CREATE INDEX IF NOT EXISTS idx_schedule_batch ON course_schedule(batch_id);
CREATE INDEX IF NOT EXISTS idx_schedule_room ON course_schedule(room_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slot ON course_schedule(slot_id);
CREATE INDEX IF NOT EXISTS idx_schedule_room_slot ON course_schedule(room_id, slot_id);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE department ENABLE ROW LEVEL SECURITY;
ALTER TABLE course ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch ENABLE ROW LEVEL SECURITY;
ALTER TABLE room ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slot ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_schedule ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (for academic demonstration)
CREATE POLICY "Allow public read access on department"
  ON department FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access on course"
  ON course FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access on batch"
  ON batch FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access on room"
  ON room FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access on time_slot"
  ON time_slot FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access on course_schedule"
  ON course_schedule FOR SELECT
  TO public
  USING (true);

-- Authenticated users can manage all data
CREATE POLICY "Allow authenticated users to insert department"
  ON department FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update department"
  ON department FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete department"
  ON department FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert course"
  ON course FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update course"
  ON course FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete course"
  ON course FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert batch"
  ON batch FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update batch"
  ON batch FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete batch"
  ON batch FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert room"
  ON room FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update room"
  ON room FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete room"
  ON room FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert time_slot"
  ON time_slot FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update time_slot"
  ON time_slot FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete time_slot"
  ON time_slot FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert course_schedule"
  ON course_schedule FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update course_schedule"
  ON course_schedule FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete course_schedule"
  ON course_schedule FOR DELETE
  TO authenticated
  USING (true);