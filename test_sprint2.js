// test_sprint2.js
const http = require('http');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const API_BASE = 'http://localhost:5000/api';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = body;
        }
        resolve({ status: res.statusCode, body: json });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Sprint 2 Automated Tests ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Direct MySQL Trigger Tests
  console.log('\n[1] Testing Database Triggers directly via MySQL connection...');
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'classroom_utilization_db'
  });

  try {
    // Test 1.1: Room Capacity Update Trigger (trg_check_room_capacity_update)
    // In seed: UB101 has capacity 60, holds Batch 201 with 55 students.
    // Reducing UB101 capacity to 50 should FAIL.
    let roomError = null;
    try {
      await pool.query('UPDATE Room SET capacity = 50 WHERE room_number = "UB101"');
    } catch (err) {
      roomError = err.message;
    }
    assert(roomError && roomError.includes('Capacity Error'), `Room capacity reduction below active schedule rejected (${roomError})`);

    // Test 1.2: Batch Size Update Trigger (trg_check_batch_size_update)
    // In seed: Batch 201 has 55 students, in UB101 (cap 60).
    // Increasing Batch 201 to 65 students should FAIL.
    let batchError = null;
    try {
      await pool.query('UPDATE Batch SET student_count = 65 WHERE batch_id = 201');
    } catch (err) {
      batchError = err.message;
    }
    assert(batchError && batchError.includes('Capacity Error'), `Batch size increase above scheduled room capacity rejected (${batchError})`);

    // Test 1.3: Course_Schedule Update Trigger (trg_check_schedule_update)
    // Schedule 1 is on slot 1 in UB101.
    // Schedule 2 is on slot 14 in UB102.
    // Updating Schedule 2 to slot 1 in UB101 should FAIL due to double booking.
    let scheduleConflictError = null;
    try {
      await pool.query('UPDATE Course_Schedule SET room_number = "UB101", slot_id = 1 WHERE schedule_id = 2');
    } catch (err) {
      scheduleConflictError = err.message;
    }
    assert(scheduleConflictError && scheduleConflictError.includes('Double Booking Error'), `Schedule update to occupied room/slot rejected (${scheduleConflictError})`);

    // Updating Schedule 1 to a room with smaller capacity (e.g., LAB1 has cap 30, Batch 201 has 55) should FAIL
    let scheduleCapError = null;
    try {
      await pool.query('UPDATE Course_Schedule SET room_number = "LAB1" WHERE schedule_id = 1');
    } catch (err) {
      scheduleCapError = err.message;
    }
    assert(scheduleCapError && scheduleCapError.includes('Capacity Error'), `Schedule update to undersized room rejected (${scheduleCapError})`);

  } finally {
    await pool.end();
  }

  // 2. Authentication Tokens
  console.log('\n[2] Authenticating Coordinator and Viewer...');
  const coordLogin = await request('/auth/signin', {
    method: 'POST',
    body: { email: 'coordinator@college.edu', password: 'Coordinator@123' }
  });
  assert(coordLogin.status === 200 && coordLogin.body.token, 'Coordinator login successful');
  const coordToken = coordLogin.body.token;

  const viewerLogin = await request('/auth/signin', {
    method: 'POST',
    body: { email: 'viewer@college.edu', password: 'Viewer@123' }
  });
  assert(viewerLogin.status === 200 && viewerLogin.body.token, 'Viewer login successful');
  const viewerToken = viewerLogin.body.token;

  // 3. Department Management & Impact Analysis
  console.log('\n[3] Testing Department Endpoints & Cascade Impact...');
  const deptsRes = await request('/departments', {
    headers: { Authorization: `Bearer ${viewerToken}` }
  });
  assert(deptsRes.status === 200 && Array.isArray(deptsRes.body) && deptsRes.body.length >= 2, 'GET /api/departments returns department list with stats');

  // Test Department Impact for Dept 1 (CSE - has courses and batches)
  const dept1Impact = await request('/departments/1/impact', {
    headers: { Authorization: `Bearer ${viewerToken}` }
  });
  assert(dept1Impact.status === 200 && dept1Impact.body.courses_count >= 1 && dept1Impact.body.batches_count >= 1, `GET /api/departments/1/impact returns accurate counts (courses: ${dept1Impact.body.courses_count}, batches: ${dept1Impact.body.batches_count}, schedules: ${dept1Impact.body.schedules_count})`);

  // Viewer cannot create department
  const viewerAddDept = await request('/departments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${viewerToken}` },
    body: { dept_id: 99, dept_name: 'Unauthorized Dept' }
  });
  assert(viewerAddDept.status === 403, 'Viewer cannot create department (403 Forbidden)');

  // Coordinator creates department
  const coordAddDept = await request('/departments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${coordToken}` },
    body: { dept_id: 10, dept_name: 'Mechanical Engineering' }
  });
  assert(coordAddDept.status === 201 && coordAddDept.body.success, 'Coordinator can create department (201 Created)');

  // Coordinator deletes test department
  const coordDelDept = await request('/departments/10', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${coordToken}` }
  });
  assert(coordDelDept.status === 200 && coordDelDept.body.deleted === 1, 'Coordinator can delete department (200 OK)');

  // 4. Course Management & Impact Analysis
  console.log('\n[4] Testing Course Endpoints & Impact Analysis...');
  const coursesRes = await request('/courses', {
    headers: { Authorization: `Bearer ${viewerToken}` }
  });
  assert(coursesRes.status === 200 && Array.isArray(coursesRes.body) && coursesRes.body.length >= 3, 'GET /api/courses returns course list with department info');

  // Test Course Impact for Course 101 (DBMS - has 1 schedule)
  const course101Impact = await request('/courses/101/impact', {
    headers: { Authorization: `Bearer ${viewerToken}` }
  });
  assert(course101Impact.status === 200 && course101Impact.body.schedules_count === 1, `GET /api/courses/101/impact returns schedules count (schedules: ${course101Impact.body.schedules_count})`);

  // Viewer cannot create course
  const viewerAddCourse = await request('/courses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${viewerToken}` },
    body: { course_id: 999, course_code: 'ME101', course_name: 'Thermodynamics', dept_id: 1 }
  });
  assert(viewerAddCourse.status === 403, 'Viewer cannot create course (403 Forbidden)');

  // Coordinator creates course
  const coordAddCourse = await request('/courses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${coordToken}` },
    body: { course_id: 105, course_code: 'CS301', course_name: 'Computer Networks', dept_id: 1 }
  });
  assert(coordAddCourse.status === 201 && coordAddCourse.body.success, 'Coordinator can create course (201 Created)');

  // Coordinator deletes course
  const coordDelCourse = await request('/courses/105', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${coordToken}` }
  });
  assert(coordDelCourse.status === 200 && coordDelCourse.body.deleted === 1, 'Coordinator can delete course (200 OK)');

  // 5. Room and Batch Cascade Impact Endpoints
  console.log('\n[5] Testing Room and Batch Impact Endpoints...');
  const roomImpact = await request('/rooms/UB101/impact', {
    headers: { Authorization: `Bearer ${viewerToken}` }
  });
  assert(roomImpact.status === 200 && roomImpact.body.schedules_count >= 1, `GET /api/rooms/UB101/impact returns active schedules count (${roomImpact.body.schedules_count})`);

  const batchImpact = await request('/batches/201/impact', {
    headers: { Authorization: `Bearer ${viewerToken}` }
  });
  assert(batchImpact.status === 200 && batchImpact.body.schedules_count >= 1, `GET /api/batches/201/impact returns active schedules count (${batchImpact.body.schedules_count})`);

  // 6. Schedule Audit Trail Verification
  console.log('\n[6] Testing Schedule Audit Trail (created_by & updated_at)...');
  const schedulesRes = await request('/schedules', {
    headers: { Authorization: `Bearer ${coordToken}` }
  });
  assert(schedulesRes.status === 200 && schedulesRes.body.length >= 3, 'GET /api/schedules returns schedules with audit info');
  const scheduleRow = schedulesRes.body[0];
  assert(scheduleRow.created_by !== undefined && scheduleRow.created_by_name !== undefined, `Schedule row contains created_by audit metadata (created_by_name: ${scheduleRow.created_by_name || 'System'})`);

  console.log(`\n========================================`);
  console.log(`Sprint 2 Test Summary: ${passed} passed, ${failed} failed`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
