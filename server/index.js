import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ==========================================
// Basic CRUD Routes
// ==========================================

// Get all rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Room ORDER BY room_id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all schedules (using the View)
app.get('/api/schedules', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM View_Detailed_Schedule ORDER BY day_of_week DESC, start_time');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all courses
app.get('/api/courses', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Course');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all batches
app.get('/api/batches', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Batch');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all time slots
app.get('/api/timeslots', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Time_Slot ORDER BY day_of_week DESC, start_time');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Allocate a Room (Invokes trigger implicitly)
app.post('/api/schedules', async (req, res) => {
  const { course_id, batch_id, room_id, slot_id } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO Course_Schedule (course_id, batch_id, room_id, slot_id) VALUES (?, ?, ?, ?)',
      [course_id, batch_id, room_id, slot_id]
    );
    res.status(201).json({ success: true, schedule_id: result.insertId });
  } catch (err) {
    // MySQL trigger errors (like capacity or double booking) will be caught here
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// Advanced DBMS Concept Routes
// ==========================================

// Room Utilization Analysis (View)
app.get('/api/reports/utilization', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM View_Room_Utilization');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Free Rooms Analysis (EXCEPT equivalent - Not IN)
app.get('/api/reports/free-rooms', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT room_number, room_type, capacity 
      FROM Room 
      WHERE room_id NOT IN (SELECT room_id FROM Course_Schedule)
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Empty Time Slots (RIGHT JOIN equivalent)
app.get('/api/reports/empty-slots', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        'Empty' AS dept_name, 'No Course' AS course_name,
        NULL AS year_of_study, NULL AS section,
        r.room_number, ts.day_of_week, ts.start_time, ts.end_time
      FROM Course_Schedule cs
      RIGHT JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
      RIGHT JOIN Room r ON cs.room_id = r.room_id
      WHERE cs.schedule_id IS NULL
      ORDER BY ts.day_of_week, ts.start_time, r.room_number;
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Advanced Analytics Routes (From Documentation)
// ==========================================

// 1. Department Course Load (Aggregate/Left Join)
app.get('/api/analytics/department-course-load', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.dept_name, COUNT(c.course_id) AS total_courses
      FROM Department d
      LEFT JOIN Course c ON d.dept_id = c.dept_id
      GROUP BY d.dept_name
      ORDER BY total_courses DESC
      LIMIT 1;
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// 3. Unscheduled Courses (Left Join / Null check)
app.get('/api/analytics/unscheduled-courses', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.course_code, c.course_name 
      FROM Course c
      LEFT JOIN Course_Schedule cs ON c.course_id = cs.course_id
      WHERE cs.schedule_id IS NULL;
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Room Saturation Risk (Correlated Subquery)
app.get('/api/analytics/room-saturation', async (req, res) => {
  try {
    const minSaturation = parseFloat(req.query.min_saturation) || 0.90;
    const [rows] = await db.query(`
      SELECT room_number 
      FROM Room r 
      WHERE (
          SELECT MAX(b.student_count) 
          FROM Course_Schedule cs 
          JOIN Batch b ON cs.batch_id = b.batch_id 
          WHERE cs.room_id = r.room_id
      ) >= r.capacity * ?;
    `, [minSaturation]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Infrastructure Averages (View join)
app.get('/api/analytics/infrastructure-averages', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.room_type, AVG(v.slots_used) as avg_utilized_slots
      FROM Room r
      JOIN View_Room_Utilization v ON r.room_number = v.room_number
      GROUP BY r.room_type;
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Trigger Troubleshooting (Mathematical calculation on physical limits)
app.get('/api/analytics/trigger-troubleshooting', async (req, res) => {
  try {
    const batchId = parseInt(req.query.batch_id) || 201;
    const roomNumber = req.query.room_number || 'UB102';
    
    const [rows] = await db.query(`
      SELECT 
          b.batch_id, b.student_count AS attempted_students, 
          r.room_number, r.capacity AS max_room_capacity,
          (b.student_count - r.capacity) AS overflow_amount
      FROM Batch b, Room r
      WHERE b.batch_id = ? AND r.room_number = ?;
    `, [batchId, roomNumber]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Infrastructure Sorting (Calling Stored Function inside Select)
app.get('/api/analytics/infrastructure-sorting', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT room_number, room_type, get_utilization_percent(room_id) AS current_util_percent 
      FROM Room 
      ORDER BY current_util_percent DESC;
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Trapped Capacity (Extracting Intelligence from Cursor Temp Table)
app.get('/api/analytics/trapped-capacity', async (req, res) => {
  try {
    // We MUST execute the procedural cursor first in the same connection session!
    const connection = await db.getConnection();
    
    // Step 1: Execute Cursor to generate Temp_Room_Report natively
    await connection.query('CALL evaluate_room_usage()');
    
    // Step 2: Run the analytical query against that freshly populated temp table
    const [rows] = await connection.query(`
      SELECT t.status, SUM(r.capacity) as trapped_capacity_seats
      FROM Temp_Room_Report t
      JOIN Room r ON t.room_number = r.room_number
      WHERE t.status = 'Underutilized'
      GROUP BY t.status;
    `);
    
    connection.release();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Call evaluate_room_usage Cursor Procedure
app.get('/api/reports/cursor-evaluation', async (req, res) => {
  try {
    const [rows] = await db.query('CALL evaluate_room_usage()');
    // Result from a CALL is an array of result sets; the first element is the temp table selection
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Classroom Utilization Node.js/Express server running on port ${port}`);
});
