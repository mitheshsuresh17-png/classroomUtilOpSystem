/*
  # Advanced Database Features - Views, Functions, Triggers
  
  ## 1. Views Created
  
  ### room_utilization_summary
  - Aggregate view showing room usage statistics
  - Includes: room details, total allocations, utilization percentage
  - Uses GROUP BY and aggregate functions (COUNT)
  
  ### conflict_detection_view
  - Identifies scheduling conflicts (same room, same slot, multiple courses)
  - Uses GROUP BY with HAVING clause
  
  ### free_rooms_view
  - Shows rooms that have no allocations (LEFT JOIN)
  - Useful for finding available rooms
  
  ### detailed_schedule_view
  - Complete schedule with all details (INNER JOIN)
  - Combines data from all tables for comprehensive view
  
  ### time_slot_usage_view
  - Shows all time slots with their usage count (RIGHT JOIN concept)
  - Helps identify peak usage times
  
  ## 2. Functions Created
  
  ### calculate_room_utilization(room_id)
  - Returns utilization percentage for a specific room
  - Formula: (allocated_slots / total_available_slots) * 100
  
  ### get_free_rooms_for_slot(slot_id)
  - Returns list of available rooms for a given time slot
  - Uses subquery to exclude occupied rooms
  
  ### get_room_capacity_match(required_capacity)
  - Returns rooms that can accommodate the required capacity
  
  ## 3. Stored Procedures
  
  ### allocate_room_with_conflict_check
  - Safely allocates a room with automatic conflict detection
  - Raises exception if conflict detected
  - Includes capacity validation
  
  ## 4. Triggers
  
  ### prevent_double_booking_trigger
  - Automatically prevents double booking before insert
  - Validates capacity vs student count
  - Raises exception for conflicts
  
  ## 5. Important Notes
  - All functions include proper error handling
  - Views are optimized with appropriate joins
  - Triggers ensure data integrity automatically
*/

-- =====================================================
-- 1. CREATE VIEWS
-- =====================================================

-- View 1: Room Utilization Summary (Aggregate Functions + GROUP BY)
CREATE OR REPLACE VIEW room_utilization_summary AS
SELECT 
  r.room_id,
  r.room_number,
  r.room_type,
  r.capacity,
  COUNT(cs.schedule_id) as total_allocations,
  ROUND(
    (COUNT(cs.schedule_id)::numeric / 
    NULLIF((SELECT COUNT(*) FROM time_slot), 0)::numeric) * 100, 
    2
  ) as utilization_percentage
FROM room r
LEFT JOIN course_schedule cs ON r.room_id = cs.room_id
GROUP BY r.room_id, r.room_number, r.room_type, r.capacity
ORDER BY total_allocations DESC;

-- View 2: Conflict Detection View (GROUP BY with HAVING)
CREATE OR REPLACE VIEW conflict_detection_view AS
SELECT 
  cs.room_id,
  r.room_number,
  cs.slot_id,
  ts.day,
  ts.start_time,
  ts.end_time,
  COUNT(*) as conflict_count,
  string_agg(c.course_name, ', ') as conflicting_courses
FROM course_schedule cs
JOIN room r ON cs.room_id = r.room_id
JOIN time_slot ts ON cs.slot_id = ts.slot_id
JOIN course c ON cs.course_id = c.course_id
GROUP BY cs.room_id, r.room_number, cs.slot_id, ts.day, ts.start_time, ts.end_time
HAVING COUNT(*) > 1;

-- View 3: Free Rooms View (LEFT JOIN showing unallocated rooms)
CREATE OR REPLACE VIEW free_rooms_view AS
SELECT 
  r.room_id,
  r.room_number,
  r.room_type,
  r.capacity
FROM room r
LEFT JOIN course_schedule cs ON r.room_id = cs.room_id
WHERE cs.schedule_id IS NULL;

-- View 4: Detailed Schedule View (INNER JOIN - Complete Information)
CREATE OR REPLACE VIEW detailed_schedule_view AS
SELECT 
  cs.schedule_id,
  c.course_code,
  c.course_name,
  d.dept_name,
  b.year_of_study,
  b.section,
  b.student_count,
  r.room_number,
  r.room_type,
  r.capacity,
  ts.day,
  ts.start_time,
  ts.end_time
FROM course_schedule cs
INNER JOIN course c ON cs.course_id = c.course_id
INNER JOIN department d ON c.dept_id = d.dept_id
INNER JOIN batch b ON cs.batch_id = b.batch_id
INNER JOIN room r ON cs.room_id = r.room_id
INNER JOIN time_slot ts ON cs.slot_id = ts.slot_id
ORDER BY ts.day, ts.start_time;

-- View 5: Time Slot Usage View (Shows all slots with usage count)
CREATE OR REPLACE VIEW time_slot_usage_view AS
SELECT 
  ts.slot_id,
  ts.day,
  ts.start_time,
  ts.end_time,
  COUNT(cs.schedule_id) as times_used,
  CASE 
    WHEN COUNT(cs.schedule_id) = 0 THEN 'Unused'
    WHEN COUNT(cs.schedule_id) < 3 THEN 'Low Usage'
    WHEN COUNT(cs.schedule_id) < 6 THEN 'Medium Usage'
    ELSE 'High Usage'
  END as usage_category
FROM time_slot ts
LEFT JOIN course_schedule cs ON ts.slot_id = cs.slot_id
GROUP BY ts.slot_id, ts.day, ts.start_time, ts.end_time
ORDER BY times_used DESC;

-- =====================================================
-- 2. CREATE FUNCTIONS
-- =====================================================

-- Function 1: Calculate Room Utilization Percentage
CREATE OR REPLACE FUNCTION calculate_room_utilization(p_room_id uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  v_allocated_slots integer;
  v_total_slots integer;
  v_utilization numeric;
BEGIN
  -- Count allocated slots for the room
  SELECT COUNT(*) INTO v_allocated_slots
  FROM course_schedule
  WHERE room_id = p_room_id;
  
  -- Get total available time slots
  SELECT COUNT(*) INTO v_total_slots
  FROM time_slot;
  
  -- Calculate utilization percentage
  IF v_total_slots > 0 THEN
    v_utilization := (v_allocated_slots::numeric / v_total_slots::numeric) * 100;
  ELSE
    v_utilization := 0;
  END IF;
  
  RETURN ROUND(v_utilization, 2);
END;
$$;

-- Function 2: Get Free Rooms for a Specific Time Slot
CREATE OR REPLACE FUNCTION get_free_rooms_for_slot(p_slot_id uuid)
RETURNS TABLE(
  room_id uuid,
  room_number text,
  room_type text,
  capacity integer
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT r.room_id, r.room_number, r.room_type, r.capacity
  FROM room r
  WHERE r.room_id NOT IN (
    SELECT cs.room_id
    FROM course_schedule cs
    WHERE cs.slot_id = p_slot_id
  )
  ORDER BY r.capacity DESC;
END;
$$;

-- Function 3: Get Rooms Matching Capacity Requirements
CREATE OR REPLACE FUNCTION get_room_capacity_match(p_required_capacity integer)
RETURNS TABLE(
  room_id uuid,
  room_number text,
  room_type text,
  capacity integer,
  excess_capacity integer
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.room_id, 
    r.room_number, 
    r.room_type, 
    r.capacity,
    (r.capacity - p_required_capacity) as excess_capacity
  FROM room r
  WHERE r.capacity >= p_required_capacity
  ORDER BY (r.capacity - p_required_capacity) ASC;
END;
$$;

-- Function 4: Detect Scheduling Conflicts
CREATE OR REPLACE FUNCTION check_scheduling_conflict(
  p_room_id uuid,
  p_slot_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_conflict_count integer;
BEGIN
  SELECT COUNT(*) INTO v_conflict_count
  FROM course_schedule
  WHERE room_id = p_room_id AND slot_id = p_slot_id;
  
  RETURN v_conflict_count > 0;
END;
$$;

-- =====================================================
-- 3. CREATE STORED PROCEDURES
-- =====================================================

-- Stored Procedure: Allocate Room with Conflict Check
CREATE OR REPLACE FUNCTION allocate_room_with_conflict_check(
  p_course_id uuid,
  p_batch_id uuid,
  p_room_id uuid,
  p_slot_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_schedule_id uuid;
  v_has_conflict boolean;
  v_room_capacity integer;
  v_student_count integer;
BEGIN
  -- Check for scheduling conflict
  v_has_conflict := check_scheduling_conflict(p_room_id, p_slot_id);
  
  IF v_has_conflict THEN
    RAISE EXCEPTION 'Scheduling conflict detected: Room is already booked for this time slot';
  END IF;
  
  -- Check capacity vs student count
  SELECT capacity INTO v_room_capacity FROM room WHERE room_id = p_room_id;
  SELECT student_count INTO v_student_count FROM batch WHERE batch_id = p_batch_id;
  
  IF v_student_count > v_room_capacity THEN
    RAISE EXCEPTION 'Room capacity (%) is insufficient for student count (%)', 
      v_room_capacity, v_student_count;
  END IF;
  
  -- Insert the schedule
  INSERT INTO course_schedule (course_id, batch_id, room_id, slot_id)
  VALUES (p_course_id, p_batch_id, p_room_id, p_slot_id)
  RETURNING schedule_id INTO v_schedule_id;
  
  RETURN v_schedule_id;
END;
$$;

-- =====================================================
-- 4. CREATE TRIGGERS
-- =====================================================

-- Trigger Function: Prevent Double Booking
CREATE OR REPLACE FUNCTION prevent_double_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_conflict_count integer;
  v_room_capacity integer;
  v_student_count integer;
BEGIN
  -- Check for existing booking
  SELECT COUNT(*) INTO v_conflict_count
  FROM course_schedule
  WHERE room_id = NEW.room_id 
    AND slot_id = NEW.slot_id
    AND schedule_id != COALESCE(NEW.schedule_id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'Cannot book room: Time slot already occupied';
  END IF;
  
  -- Validate room capacity vs student count
  SELECT capacity INTO v_room_capacity FROM room WHERE room_id = NEW.room_id;
  SELECT student_count INTO v_student_count FROM batch WHERE batch_id = NEW.batch_id;
  
  IF v_student_count > v_room_capacity THEN
    RAISE EXCEPTION 'Room capacity (%) insufficient for % students', 
      v_room_capacity, v_student_count;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attach trigger to course_schedule table
DROP TRIGGER IF EXISTS trigger_prevent_double_booking ON course_schedule;
CREATE TRIGGER trigger_prevent_double_booking
  BEFORE INSERT OR UPDATE ON course_schedule
  FOR EACH ROW
  EXECUTE FUNCTION prevent_double_booking();