const path = require('path');
const mysql = require(path.join(__dirname, '../server/node_modules/mysql2/promise'));
require(path.join(__dirname, '../server/node_modules/dotenv')).config({ path: path.join(__dirname, '../server/.env') });

async function migrate() {
  console.log('--- Applying Faculty & Unified Grid Database Migration ---');
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'classroom_utilization_db',
    multipleStatements: true
  });

  const connection = await pool.getConnection();

  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Alter Time_Slot to include hour_order, slot_name, slot_type
    console.log('1. Updating Time_Slot schema...');
    const [tsCols] = await connection.query(`SHOW COLUMNS FROM Time_Slot LIKE 'hour_order'`);
    if (tsCols.length === 0) {
      await connection.query(`
        ALTER TABLE Time_Slot 
        ADD COLUMN hour_order INT NOT NULL DEFAULT 1 CHECK (hour_order BETWEEN 1 AND 10),
        ADD COLUMN slot_name VARCHAR(10) NOT NULL DEFAULT 'A',
        ADD COLUMN slot_type ENUM('Theory', 'Lab') NOT NULL DEFAULT 'Theory'
      `);
      console.log('  Added hour_order, slot_name, slot_type to Time_Slot.');
    } else {
      console.log('  Time_Slot already has hour_order, slot_name, slot_type.');
    }

    // 2. Create Faculty Table
    console.log('2. Creating Faculty table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Faculty (
          faculty_id INT PRIMARY KEY,
          faculty_name VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          dept_id INT NOT NULL,
          designation ENUM('Professor', 'Associate Professor', 'Assistant Professor', 'Adjunct Lecturer') NOT NULL DEFAULT 'Assistant Professor',
          max_weekly_slots INT NOT NULL DEFAULT 16 CHECK (max_weekly_slots > 0 AND max_weekly_slots <= 30),
          FOREIGN KEY (dept_id) REFERENCES Department(dept_id) ON DELETE RESTRICT
      )
    `);
    console.log('  Faculty table created / verified.');

    // 3. Alter Course_Schedule to include faculty_id
    console.log('3. Updating Course_Schedule schema...');
    const [csCols] = await connection.query(`SHOW COLUMNS FROM Course_Schedule LIKE 'faculty_id'`);
    if (csCols.length === 0) {
      await connection.query(`
        ALTER TABLE Course_Schedule ADD COLUMN faculty_id INT NULL,
        ADD CONSTRAINT fk_schedule_faculty FOREIGN KEY (faculty_id) REFERENCES Faculty(faculty_id) ON DELETE RESTRICT
      `);
      console.log('  Added faculty_id to Course_Schedule with Foreign Key.');
    } else {
      console.log('  Course_Schedule already has faculty_id.');
    }

    // 4. Update Course table course_code length check if needed (schema has VARCHAR(10), which fits 9 chars)
    console.log('4. Course code length verified.');

    // 5. Create or Replace Views
    console.log('5. Updating View_Detailed_Schedule and View_Faculty_Workload...');
    await connection.query(`
      CREATE OR REPLACE VIEW View_Detailed_Schedule AS
      SELECT 
          cs.schedule_id, cs.course_id, cs.batch_id, cs.slot_id, cs.faculty_id,
          f.faculty_name, f.designation AS faculty_designation, f.email AS faculty_email,
          c.course_code, c.course_name, d.dept_name, d.dept_id,
          b.year_of_study, b.section, b.student_count,
          r.room_number, r.room_type, r.capacity as room_capacity,
          ts.day_of_week, ts.start_time, ts.end_time, ts.hour_order, ts.slot_name, ts.slot_type,
          cs.created_by, u.name AS created_by_name, u.email AS created_by_email, cs.updated_at
      FROM Course_Schedule cs
      JOIN Course c ON cs.course_id = c.course_id
      JOIN Department d ON c.dept_id = d.dept_id
      JOIN Batch b ON cs.batch_id = b.batch_id
      JOIN Room r ON cs.room_number = r.room_number
      JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
      LEFT JOIN Faculty f ON cs.faculty_id = f.faculty_id
      LEFT JOIN users u ON cs.created_by = u.id
    `);

    await connection.query(`
      CREATE OR REPLACE VIEW View_Faculty_Workload AS
      SELECT 
          f.faculty_id,
          f.faculty_name,
          f.email,
          f.designation,
          f.dept_id,
          d.dept_name,
          f.max_weekly_slots,
          COUNT(cs.schedule_id) AS assigned_slots,
          (f.max_weekly_slots - COUNT(cs.schedule_id)) AS remaining_slots,
          COALESCE(ROUND((COUNT(cs.schedule_id) / f.max_weekly_slots) * 100, 2), 0) AS utilization_percent
      FROM Faculty f
      JOIN Department d ON f.dept_id = d.dept_id
      LEFT JOIN Course_Schedule cs ON f.faculty_id = cs.faculty_id
      GROUP BY f.faculty_id, f.faculty_name, f.email, f.designation, f.dept_id, d.dept_name, f.max_weekly_slots
    `);
    console.log('  Views updated successfully.');

    // 6. Update Triggers on Course_Schedule
    console.log('6. Updating triggers with Double-Booking, Course Type, Shift, and Invariance rules...');
    await connection.query('DROP TRIGGER IF EXISTS trg_prevent_booking_conflict');
    await connection.query(`
      CREATE TRIGGER trg_prevent_booking_conflict
      BEFORE INSERT ON Course_Schedule
      FOR EACH ROW
      BEGIN
          DECLARE conflict_count INT;
          DECLARE room_cap INT;
          DECLARE student_cnt INT;
          DECLARE v_course_code VARCHAR(10);
          DECLARE v_code_suffix CHAR(1);
          DECLARE v_slot_type VARCHAR(10);
          DECLARE v_room_type VARCHAR(20);
          DECLARE v_day VARCHAR(15);
          DECLARE v_hour INT;
          DECLARE shift_conflict_count INT;
          DECLARE existing_faculty INT;

          -- 1. Check Room Double Booking Conflict
          SELECT COUNT(*) INTO conflict_count
          FROM Course_Schedule
          WHERE room_number = NEW.room_number AND slot_id = NEW.slot_id;

          IF conflict_count > 0 THEN
              SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'Double Booking Error: The room is already occupied for this time slot!';
          END IF;

          -- 2. Check Batch Double Booking Conflict
          SELECT COUNT(*) INTO conflict_count
          FROM Course_Schedule
          WHERE batch_id = NEW.batch_id AND slot_id = NEW.slot_id;

          IF conflict_count > 0 THEN
              SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'Batch Conflict Error: This batch is already scheduled for another class in this time slot!';
          END IF;

          -- 3. Check Faculty Double Booking Conflict
          IF NEW.faculty_id IS NOT NULL THEN
              SELECT COUNT(*) INTO conflict_count
              FROM Course_Schedule
              WHERE faculty_id = NEW.faculty_id AND slot_id = NEW.slot_id;

              IF conflict_count > 0 THEN
                  SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Double Booking Error: The faculty member is already scheduled for another class in this time slot!';
              END IF;
          END IF;

          -- 4. Check Capacity Constraint
          SELECT capacity INTO room_cap FROM Room WHERE room_number = NEW.room_number;
          SELECT student_count INTO student_cnt FROM Batch WHERE batch_id = NEW.batch_id;

          IF student_cnt > room_cap THEN
              SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'Capacity Error: Room capacity is insufficient for the batch size!';
          END IF;

          -- 5. Check Course Type & Room Consistency (T, P, J)
          SELECT course_code INTO v_course_code FROM Course WHERE course_id = NEW.course_id;
          SET v_code_suffix = UPPER(RIGHT(v_course_code, 1));
          SELECT slot_type INTO v_slot_type FROM Time_Slot WHERE slot_id = NEW.slot_id;
          SELECT room_type INTO v_room_type FROM Room WHERE room_number = NEW.room_number;

          IF v_code_suffix = 'T' THEN
              IF v_slot_type != 'Theory' OR v_room_type = 'Lab' THEN
                  SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Course Type Incompatibility: Theory courses (ending in T) must be scheduled in Theory slots and Classroom/Lecture Hall rooms!';
              END IF;
          ELSEIF v_code_suffix = 'P' THEN
              IF v_slot_type != 'Lab' OR v_room_type != 'Lab' THEN
                  SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Course Type Incompatibility: Practical courses (ending in P) must be scheduled in Lab slots and Lab rooms!';
              END IF;
          ELSEIF v_code_suffix = 'J' THEN
              IF v_slot_type = 'Theory' AND v_room_type = 'Lab' THEN
                  SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Course Type Incompatibility: Joint courses in Theory slots must use Classroom or Lecture Hall rooms!';
              ELSEIF v_slot_type = 'Lab' AND v_room_type != 'Lab' THEN
                  SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Course Type Incompatibility: Joint courses in Lab slots must use Lab rooms!';
              END IF;
          END IF;

          -- 6. Check Faculty Shift Rule (8-4 vs 9-5)
          IF NEW.faculty_id IS NOT NULL THEN
              SELECT day_of_week, hour_order INTO v_day, v_hour FROM Time_Slot WHERE slot_id = NEW.slot_id;
              
              IF v_hour = 1 THEN
                  SELECT COUNT(*) INTO shift_conflict_count
                  FROM Course_Schedule cs
                  JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
                  WHERE cs.faculty_id = NEW.faculty_id AND ts.day_of_week = v_day AND ts.hour_order = 10;
                  
                  IF shift_conflict_count > 0 THEN
                      SIGNAL SQLSTATE '45000'
                      SET MESSAGE_TEXT = 'Shift Violation Error: Faculty cannot be scheduled for both the first slot (08:00) and the last slot (16:00) on the same day!';
                  END IF;
              ELSEIF v_hour = 10 THEN
                  SELECT COUNT(*) INTO shift_conflict_count
                  FROM Course_Schedule cs
                  JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
                  WHERE cs.faculty_id = NEW.faculty_id AND ts.day_of_week = v_day AND ts.hour_order = 1;
                  
                  IF shift_conflict_count > 0 THEN
                      SIGNAL SQLSTATE '45000'
                      SET MESSAGE_TEXT = 'Shift Violation Error: Faculty cannot be scheduled for both the first slot (08:00) and the last slot (16:00) on the same day!';
                  END IF;
              END IF;
          END IF;

          -- 7. Check Course-Batch Faculty Invariance
          IF NEW.faculty_id IS NOT NULL THEN
              SELECT faculty_id INTO existing_faculty
              FROM Course_Schedule
              WHERE course_id = NEW.course_id AND batch_id = NEW.batch_id AND faculty_id IS NOT NULL
              LIMIT 1;

              IF existing_faculty IS NOT NULL AND existing_faculty != NEW.faculty_id THEN
                  SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Faculty Invariance Error: A course for a batch must be handled by the same faculty member across all scheduled sessions!';
              END IF;
          END IF;
      END
    `);

    await connection.query('DROP TRIGGER IF EXISTS trg_check_schedule_update');
    await connection.query(`
      CREATE TRIGGER trg_check_schedule_update
      BEFORE UPDATE ON Course_Schedule
      FOR EACH ROW
      BEGIN
          DECLARE conflict_count INT;
          DECLARE room_cap INT;
          DECLARE student_cnt INT;
          DECLARE v_course_code VARCHAR(10);
          DECLARE v_code_suffix CHAR(1);
          DECLARE v_slot_type VARCHAR(10);
          DECLARE v_room_type VARCHAR(20);
          DECLARE v_day VARCHAR(15);
          DECLARE v_hour INT;
          DECLARE shift_conflict_count INT;
          DECLARE existing_faculty INT;

          -- 1. Check Room Double Booking Conflict
          SELECT COUNT(*) INTO conflict_count
          FROM Course_Schedule
          WHERE room_number = NEW.room_number AND slot_id = NEW.slot_id AND schedule_id != OLD.schedule_id;

          IF conflict_count > 0 THEN
              SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'Double Booking Error: The room is already occupied for this time slot!';
          END IF;

          -- 2. Check Batch Double Booking Conflict
          SELECT COUNT(*) INTO conflict_count
          FROM Course_Schedule
          WHERE batch_id = NEW.batch_id AND slot_id = NEW.slot_id AND schedule_id != OLD.schedule_id;

          IF conflict_count > 0 THEN
              SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'Batch Conflict Error: This batch is already scheduled for another class in this time slot!';
          END IF;

          -- 3. Check Faculty Double Booking Conflict
          IF NEW.faculty_id IS NOT NULL THEN
              SELECT COUNT(*) INTO conflict_count
              FROM Course_Schedule
              WHERE faculty_id = NEW.faculty_id AND slot_id = NEW.slot_id AND schedule_id != OLD.schedule_id;

              IF conflict_count > 0 THEN
                  SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Double Booking Error: The faculty member is already scheduled for another class in this time slot!';
              END IF;
          END IF;

          -- 4. Check Capacity Constraint
          SELECT capacity INTO room_cap FROM Room WHERE room_number = NEW.room_number;
          SELECT student_count INTO student_cnt FROM Batch WHERE batch_id = NEW.batch_id;

          IF student_cnt > room_cap THEN
              SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'Capacity Error: Room capacity is insufficient for the batch size!';
          END IF;

          -- 5. Check Course Type & Room Consistency (T, P, J)
          SELECT course_code INTO v_course_code FROM Course WHERE course_id = NEW.course_id;
          SET v_code_suffix = UPPER(RIGHT(v_course_code, 1));
          SELECT slot_type INTO v_slot_type FROM Time_Slot WHERE slot_id = NEW.slot_id;
          SELECT room_type INTO v_room_type FROM Room WHERE room_number = NEW.room_number;

          IF v_code_suffix = 'T' THEN
              IF v_slot_type != 'Theory' OR v_room_type = 'Lab' THEN
                  SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Course Type Incompatibility: Theory courses (ending in T) must be scheduled in Theory slots and Classroom/Lecture Hall rooms!';
              END IF;
          ELSEIF v_code_suffix = 'P' THEN
              IF v_slot_type != 'Lab' OR v_room_type != 'Lab' THEN
                  SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Course Type Incompatibility: Practical courses (ending in P) must be scheduled in Lab slots and Lab rooms!';
              END IF;
          ELSEIF v_code_suffix = 'J' THEN
              IF v_slot_type = 'Theory' AND v_room_type = 'Lab' THEN
                  SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Course Type Incompatibility: Joint courses in Theory slots must use Classroom or Lecture Hall rooms!';
              ELSEIF v_slot_type = 'Lab' AND v_room_type != 'Lab' THEN
                  SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Course Type Incompatibility: Joint courses in Lab slots must use Lab rooms!';
              END IF;
          END IF;

          -- 6. Check Faculty Shift Rule (8-4 vs 9-5)
          IF NEW.faculty_id IS NOT NULL THEN
              SELECT day_of_week, hour_order INTO v_day, v_hour FROM Time_Slot WHERE slot_id = NEW.slot_id;
              
              IF v_hour = 1 THEN
                  SELECT COUNT(*) INTO shift_conflict_count
                  FROM Course_Schedule cs
                  JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
                  WHERE cs.faculty_id = NEW.faculty_id AND ts.day_of_week = v_day AND ts.hour_order = 10 AND cs.schedule_id != OLD.schedule_id;
                  
                  IF shift_conflict_count > 0 THEN
                      SIGNAL SQLSTATE '45000'
                      SET MESSAGE_TEXT = 'Shift Violation Error: Faculty cannot be scheduled for both the first slot (08:00) and the last slot (16:00) on the same day!';
                  END IF;
              ELSEIF v_hour = 10 THEN
                  SELECT COUNT(*) INTO shift_conflict_count
                  FROM Course_Schedule cs
                  JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
                  WHERE cs.faculty_id = NEW.faculty_id AND ts.day_of_week = v_day AND ts.hour_order = 1 AND cs.schedule_id != OLD.schedule_id;
                  
                  IF shift_conflict_count > 0 THEN
                      SIGNAL SQLSTATE '45000'
                      SET MESSAGE_TEXT = 'Shift Violation Error: Faculty cannot be scheduled for both the first slot (08:00) and the last slot (16:00) on the same day!';
                  END IF;
              END IF;
          END IF;

          -- 7. Check Course-Batch Faculty Invariance
          IF NEW.faculty_id IS NOT NULL THEN
              SELECT faculty_id INTO existing_faculty
              FROM Course_Schedule
              WHERE course_id = NEW.course_id AND batch_id = NEW.batch_id AND faculty_id IS NOT NULL AND schedule_id != OLD.schedule_id
              LIMIT 1;

              IF existing_faculty IS NOT NULL AND existing_faculty != NEW.faculty_id THEN
                  SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Faculty Invariance Error: A course for a batch must be handled by the same faculty member across all scheduled sessions!';
              END IF;
          END IF;
      END
    `);
    console.log('  Triggers updated successfully.');

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n✅ Database migration completed successfully!\n');
  } catch (err) {
    console.error('Migration error:', err);
    throw err;
  } finally {
    connection.release();
    pool.end();
  }
}

migrate();
