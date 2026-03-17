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
