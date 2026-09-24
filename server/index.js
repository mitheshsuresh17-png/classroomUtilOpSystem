import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'clus_jwt_dev_secret_key_2026';

app.use(cors());
app.use(express.json());

// ==========================================
// Authentication & Authorization Middleware
// ==========================================

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Missing token.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
    req.user = user; // { id, name, email, role }
    next();
  });
}

export function requireCoordinator(req, res, next) {
  if (!req.user || req.user.role !== 'coordinator') {
    return res.status(403).json({ error: 'Forbidden: Coordinator privileges required.' });
  }
  next();
}

// ==========================================
// Basic CRUD Routes
// ==========================================

// Get all rooms (Authenticated: Coordinator & Viewer)
app.get('/api/rooms', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        r.room_number, 
        r.room_type, 
        r.capacity,
        GROUP_CONCAT(res.resource_name) as resources
      FROM Room r
      LEFT JOIN Room_Resource rr ON r.room_number = rr.room_number
      LEFT JOIN Resource res ON rr.resource_id = res.resource_id
      GROUP BY r.room_number
      ORDER BY r.room_number
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all schedules (Authenticated: Coordinator & Viewer)
app.get('/api/schedules', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM View_Detailed_Schedule ORDER BY day_of_week DESC, start_time');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Department Management Routes
// ==========================================

// Get all departments with counts (Authenticated: Coordinator & Viewer)
app.get('/api/departments', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.dept_id, d.dept_name,
             COUNT(DISTINCT c.course_id) AS total_courses,
             COUNT(DISTINCT b.batch_id) AS total_batches
      FROM Department d
      LEFT JOIN Course c ON d.dept_id = c.dept_id
      LEFT JOIN Batch b ON d.dept_id = b.dept_id
      GROUP BY d.dept_id, d.dept_name
      ORDER BY d.dept_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Department (Coordinator only)
app.post('/api/departments', authenticateToken, requireCoordinator, async (req, res) => {
  const { dept_id, dept_name } = req.body;
  if (!dept_id || !dept_name) {
    return res.status(400).json({ error: 'Department ID and Department Name are required.' });
  }
  try {
    await db.query('INSERT INTO Department (dept_id, dept_name) VALUES (?, ?)', [Number(dept_id), dept_name.trim()]);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Impact preview for Department deletion
app.get('/api/departments/:dept_id/impact', authenticateToken, async (req, res) => {
  const { dept_id } = req.params;
  try {
    const [courseRows] = await db.query('SELECT COUNT(*) as count FROM Course WHERE dept_id = ?', [dept_id]);
    const [batchRows] = await db.query('SELECT COUNT(*) as count FROM Batch WHERE dept_id = ?', [dept_id]);
    const [scheduleRows] = await db.query(`
      SELECT COUNT(*) as count FROM Course_Schedule cs
      JOIN Course c ON cs.course_id = c.course_id
      WHERE c.dept_id = ?
    `, [dept_id]);
    res.json({
      dept_id: Number(dept_id),
      courses_count: courseRows[0].count,
      batches_count: batchRows[0].count,
      schedules_count: scheduleRows[0].count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Department (Coordinator only)
app.delete('/api/departments/:dept_id', authenticateToken, requireCoordinator, async (req, res) => {
  const { dept_id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM Department WHERE dept_id = ?', [dept_id]);
    res.json({ success: true, deleted: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Course Management Routes
// ==========================================

// Get all courses with department and schedule info (Authenticated: Coordinator & Viewer)
app.get('/api/courses', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.course_id, c.course_name, c.course_code, c.dept_id, d.dept_name,
             COUNT(cs.schedule_id) AS scheduled_slots
      FROM Course c
      JOIN Department d ON c.dept_id = d.dept_id
      LEFT JOIN Course_Schedule cs ON c.course_id = cs.course_id
      GROUP BY c.course_id, c.course_name, c.course_code, c.dept_id, d.dept_name
      ORDER BY c.course_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Course (Coordinator only)
app.post('/api/courses', authenticateToken, requireCoordinator, async (req, res) => {
  const { course_id, course_code, course_name, dept_id } = req.body;
  if (!course_id || !course_code || !course_name || !dept_id) {
    return res.status(400).json({ error: 'All fields (ID, code, name, department) are required.' });
  }
  try {
    await db.query(
      'INSERT INTO Course (course_id, course_code, course_name, dept_id) VALUES (?, ?, ?, ?)',
      [Number(course_id), course_code.trim(), course_name.trim(), Number(dept_id)]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Impact preview for Course deletion
app.get('/api/courses/:course_id/impact', authenticateToken, async (req, res) => {
  const { course_id } = req.params;
  try {
    const [scheduleRows] = await db.query('SELECT COUNT(*) as count FROM Course_Schedule WHERE course_id = ?', [course_id]);
    res.json({
      course_id: Number(course_id),
      schedules_count: scheduleRows[0].count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Course (Coordinator only)
app.delete('/api/courses/:course_id', authenticateToken, requireCoordinator, async (req, res) => {
  const { course_id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM Course WHERE course_id = ?', [course_id]);
    res.json({ success: true, deleted: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Entity Impact Routes (Cascade Protection)
// ==========================================

// Impact preview for Room deletion
app.get('/api/rooms/:room_number/impact', authenticateToken, async (req, res) => {
  const { room_number } = req.params;
  try {
    const [scheduleRows] = await db.query('SELECT COUNT(*) as count FROM Course_Schedule WHERE room_number = ?', [room_number]);
    res.json({
      room_number,
      schedules_count: scheduleRows[0].count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Impact preview for Batch deletion
app.get('/api/batches/:batch_id/impact', authenticateToken, async (req, res) => {
  const { batch_id } = req.params;
  try {
    const [scheduleRows] = await db.query('SELECT COUNT(*) as count FROM Course_Schedule WHERE batch_id = ?', [batch_id]);
    res.json({
      batch_id: Number(batch_id),
      schedules_count: scheduleRows[0].count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all batches (Authenticated: Coordinator & Viewer)
app.get('/api/batches', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT b.*, d.dept_name 
      FROM Batch b 
      JOIN Department d ON b.dept_id = d.dept_id 
      ORDER BY b.dept_id, b.year_of_study, b.section
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all time slots (Authenticated: Coordinator & Viewer)
app.get('/api/timeslots', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Time_Slot ORDER BY day_of_week DESC, start_time');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Allocate a Room (Coordinator only - logs created_by)
app.post('/api/schedules', authenticateToken, requireCoordinator, async (req, res) => {
  const { course_id, batch_id, room_number, slot_id } = req.body;
  const created_by = req.user ? req.user.id : null;
  try {
    const [result] = await db.query(
      'INSERT INTO Course_Schedule (course_id, batch_id, room_number, slot_id, created_by) VALUES (?, ?, ?, ?, ?)',
      [course_id, batch_id, room_number, slot_id, created_by]
    );
    res.status(201).json({ success: true, schedule_id: result.insertId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a Schedule (Coordinator only)
app.delete('/api/schedules/:id', authenticateToken, requireCoordinator, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM Course_Schedule WHERE schedule_id = ?', [id]);
    res.json({ success: true, deleted: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a Room (Coordinator only)
app.post('/api/rooms', authenticateToken, requireCoordinator, async (req, res) => {
  const { room_number, room_type, capacity } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO Room (room_number, room_type, capacity) VALUES (?, ?, ?)',
      [room_number, room_type, capacity]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a Room (Coordinator only)
app.delete('/api/rooms/:room_number', authenticateToken, requireCoordinator, async (req, res) => {
  const { room_number } = req.params;
  try {
    const [result] = await db.query('DELETE FROM Room WHERE room_number = ?', [room_number]);
    res.json({ success: true, deleted: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a Batch (Coordinator only)
app.post('/api/batches', authenticateToken, requireCoordinator, async (req, res) => {
  const { batch_id, year_of_study, section, student_count, dept_id } = req.body;
  if (!batch_id || !year_of_study || !section || !student_count || !dept_id) {
    return res.status(400).json({ error: 'All fields (Batch ID, Year of Study, Section, Student Count, Department) are required.' });
  }
  try {
    const [deptRows] = await db.query('SELECT dept_id, dept_name FROM Department WHERE dept_id = ?', [dept_id]);
    if (deptRows.length === 0) {
      return res.status(400).json({ error: `Selected department (ID: ${dept_id}) does not exist. Please select an existing department.` });
    }
    const [result] = await db.query(
      'INSERT INTO Batch (batch_id, year_of_study, section, student_count, dept_id) VALUES (?, ?, ?, ?, ?)',
      [Number(batch_id), Number(year_of_study), section.trim().toUpperCase(), Number(student_count), Number(dept_id)]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: `Batch with ID #${batch_id} or Year ${year_of_study} Section ${section} already exists in this department.` });
    }
    res.status(400).json({ error: err.sqlMessage || err.message });
  }
});

// Delete a Batch (Coordinator only)
app.delete('/api/batches/:id', authenticateToken, requireCoordinator, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM Batch WHERE batch_id = ?', [id]);
    res.json({ success: true, deleted: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Advanced DBMS Concept Routes
// ==========================================

// Room Utilization Analysis (Authenticated: Coordinator & Viewer)
app.get('/api/reports/utilization', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        v.room_number, 
        r.room_type, 
        v.capacity, 
        v.slots_used,
        get_utilization_percent(r.room_number) AS utilization_percentage
      FROM View_Room_Utilization v
      JOIN Room r ON v.room_number = r.room_number
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Free Rooms Analysis (Authenticated: Coordinator & Viewer)
app.get('/api/reports/free-rooms', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT room_number, room_type, capacity 
      FROM Room 
      WHERE room_number NOT IN (SELECT room_number FROM Course_Schedule)
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Empty Time Slots (Authenticated: Coordinator & Viewer)
app.get('/api/reports/empty-slots', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        'Empty' AS dept_name, 'No Course' AS course_name,
        NULL AS year_of_study, NULL AS section,
        all_slots.room_number, all_slots.day_of_week, all_slots.start_time, all_slots.end_time
      FROM Course_Schedule cs
      RIGHT JOIN (
          SELECT r.room_number, ts.slot_id, ts.day_of_week, ts.start_time, ts.end_time 
          FROM Room r CROSS JOIN Time_Slot ts
      ) AS all_slots ON cs.slot_id = all_slots.slot_id AND cs.room_number = all_slots.room_number
      WHERE cs.schedule_id IS NULL
      ORDER BY all_slots.day_of_week, all_slots.start_time, all_slots.room_number;
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Advanced Analytics Routes
// ==========================================

// 1. Department Course Load (Authenticated: Coordinator & Viewer)
app.get('/api/analytics/department-course-load', authenticateToken, async (req, res) => {
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

// 3. Unscheduled Courses (Authenticated: Coordinator & Viewer)
app.get('/api/analytics/unscheduled-courses', authenticateToken, async (req, res) => {
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

// 4. Room Saturation Risk (Authenticated: Coordinator & Viewer)
app.get('/api/analytics/room-saturation', authenticateToken, async (req, res) => {
  try {
    const minSaturation = parseFloat(req.query.min_saturation) || 0.90;
    const [rows] = await db.query(`
      SELECT room_number 
      FROM Room r 
      WHERE (
          SELECT MAX(b.student_count) 
          FROM Course_Schedule cs 
          JOIN Batch b ON cs.batch_id = b.batch_id 
          WHERE cs.room_number = r.room_number
      ) >= r.capacity * ?;
    `, [minSaturation]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Infrastructure Averages (Authenticated: Coordinator & Viewer)
app.get('/api/analytics/infrastructure-averages', authenticateToken, async (req, res) => {
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

// 6. Trigger Troubleshooting (Authenticated: Coordinator & Viewer)
app.get('/api/analytics/trigger-troubleshooting', authenticateToken, async (req, res) => {
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

// 7. Infrastructure Sorting (Authenticated: Coordinator & Viewer)
app.get('/api/analytics/infrastructure-sorting', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT room_number, room_type, get_utilization_percent(room_number) AS current_util_percent 
      FROM Room 
      ORDER BY current_util_percent DESC;
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Trapped Capacity (Authenticated: Coordinator & Viewer)
app.get('/api/analytics/trapped-capacity', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.query('CALL evaluate_room_usage()');
    const [rows] = await connection.query(`
      SELECT t.status, SUM(r.capacity) as trapped_capacity_seats
      FROM Temp_Room_Report t
      JOIN Room r ON t.room_number = r.room_number
      WHERE t.status = 'Underutilized'
      GROUP BY t.status;
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// ==========================================
// Advanced Analytics Extensions
// ==========================================

app.get('/api/advanced-analytics/unified-utilization', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM UnifiedUtilizationView ORDER BY room_number');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/advanced-analytics/wasted-capacity', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM WastedCapacityView ORDER BY wasted_seats DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/advanced-analytics/temporal-stress', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM TemporalStressIndex ORDER BY day_of_week, start_time');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/advanced-analytics/imbalance', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM UtilizationImbalance ORDER BY day_of_week');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/advanced-analytics/mismatch', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM CapacityMismatchAnalysis ORDER BY penalty_score ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/advanced-analytics/signals', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ActionableAnalyticsSignals ORDER BY severity_score DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/advanced-analytics/efficiency-score', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT calculate_system_efficiency_score() AS efficiency_score');
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Call evaluate_room_usage Cursor Procedure (Authenticated: Coordinator & Viewer)
app.get('/api/reports/cursor-evaluation', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('CALL evaluate_room_usage()');
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Authentication & Staff User Management
// ==========================================

// Sign In (Public)
app.post('/api/auth/signin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List Users (Coordinator only)
app.get('/api/users', authenticateToken, requireCoordinator, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Provision User (Coordinator only)
app.post('/api/users', authenticateToken, requireCoordinator, async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required.' });
  }
  if (!['coordinator', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'Role must be either "coordinator" or "viewer".' });
  }
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'A staff user with this email already exists.' });
    }
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, password_hash, role]
    );
    res.status(201).json({
      success: true,
      user: { id: result.insertId, name, email, role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Classroom Utilization Node.js/Express server running on port ${port} (exposed to network)`);
});

