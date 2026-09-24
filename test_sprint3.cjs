const http = require('http');

const PORT = 5005;
const BASE_URL = `http://localhost:${PORT}/api`;

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('--- SPRINT 3 VERIFICATION SUITE ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate as Coordinator
    const coordLogin = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/signin',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'coordinator@college.edu', password: 'Coordinator@123' });

    assert(coordLogin.status === 200 && coordLogin.data.token, 'Coordinator signin successful');
    const coordToken = coordLogin.data.token;

    // 2. Authenticate as Viewer
    const viewerLogin = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/signin',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'viewer@college.edu', password: 'Viewer@123' });

    assert(viewerLogin.status === 200 && viewerLogin.data.token, 'Viewer signin successful');
    const viewerToken = viewerLogin.data.token;

    // 3. Test Room In-Place Update (Coordinator)
    const updateRoomRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/rooms/UB101',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${coordToken}` }
    }, { room_type: 'Lecture Hall', capacity: 120 });

    assert(updateRoomRes.status === 200 && updateRoomRes.data.success, 'Coordinator can update Room (PUT /api/rooms/:room_number)');

    // 4. Test Room Update Rejection when Lowering Below Scheduled Batch Size (Trigger protection)
    // Find a room with an active schedule
    const schedList = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/schedules',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${coordToken}` }
    });

    const activeSched = schedList.data.find(s => s.room_number && s.student_count > 0);
    if (activeSched) {
      const invalidRoomUpdate = await request({
        hostname: 'localhost',
        port: PORT,
        path: `/api/rooms/${activeSched.room_number}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${coordToken}` }
      }, { room_type: 'Classroom', capacity: Math.max(1, activeSched.student_count - 10) });

      assert(invalidRoomUpdate.status === 400 && (invalidRoomUpdate.data.error || '').includes('Capacity'), 
        `Trigger protection prevents lowering room capacity below scheduled batch size (${invalidRoomUpdate.data.error})`);
    }

    // 5. Test Batch In-Place Update (Coordinator)
    const updateBatchRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/batches/201',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${coordToken}` }
    }, { year_of_study: 2, section: 'A', student_count: 55, dept_id: 1 });

    assert(updateBatchRes.status === 200 && updateBatchRes.data.success, 'Coordinator can update Batch (PUT /api/batches/:batch_id)');

    // 6. Test Batch Update Rejection when Exceeding Room Capacity in Active Schedule (Trigger protection)
    if (activeSched) {
      const invalidBatchUpdate = await request({
        hostname: 'localhost',
        port: PORT,
        path: `/api/batches/${activeSched.batch_id}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${coordToken}` }
      }, { year_of_study: activeSched.year_of_study, section: activeSched.section, student_count: 9999, dept_id: 1 });

      assert(invalidBatchUpdate.status === 400 && (invalidBatchUpdate.data.error || '').includes('Cannot increase batch size'), 
        `Trigger protection prevents increasing batch size beyond scheduled room capacity (${invalidBatchUpdate.data.error})`);
    }

    // 7. Test Schedule In-Place Update (Coordinator)
    if (activeSched) {
      const updateSchedRes = await request({
        hostname: 'localhost',
        port: PORT,
        path: `/api/schedules/${activeSched.schedule_id}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${coordToken}` }
      }, {
        course_id: activeSched.course_id,
        batch_id: activeSched.batch_id,
        room_number: activeSched.room_number,
        slot_id: activeSched.slot_id
      });

      assert(updateSchedRes.status === 200 && updateSchedRes.data.success, 'Coordinator can update Schedule (PUT /api/schedules/:schedule_id)');
    }

    // 8. Test RBAC: Viewer must NOT be able to execute PUT routes (403 Forbidden)
    const viewerRoomPut = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/rooms/UB101',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${viewerToken}` }
    }, { room_type: 'Lab', capacity: 80 });

    assert(viewerRoomPut.status === 403, 'RBAC enforces 403 Forbidden on PUT /api/rooms for Viewer');

    const viewerBatchPut = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/batches/201',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${viewerToken}` }
    }, { year_of_study: 2, section: 'A', student_count: 60, dept_id: 1 });

    assert(viewerBatchPut.status === 403, 'RBAC enforces 403 Forbidden on PUT /api/batches for Viewer');

    const viewerSchedPut = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/schedules/${activeSched?.schedule_id || 1}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${viewerToken}` }
    }, { course_id: 101, batch_id: 201, room_number: 'UB101', slot_id: 1 });

    assert(viewerSchedPut.status === 403, 'RBAC enforces 403 Forbidden on PUT /api/schedules for Viewer');

    // 9. Verify Advanced Analytics & Views Endpoints
    const signalsRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/advanced-analytics/signals',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${coordToken}` }
    });
    assert(signalsRes.status === 200 && Array.isArray(signalsRes.data), 'GET /api/advanced-analytics/signals returns array');
    if (signalsRes.data.length > 0) {
      const sig = signalsRes.data[0];
      assert('signal_type' in sig && 'message' in sig && 'severity_score' in sig, 'Signals have signal_type, message, severity_score');
    }

    const mismatchRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/advanced-analytics/mismatch',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${coordToken}` }
    });
    assert(mismatchRes.status === 200 && Array.isArray(mismatchRes.data), 'GET /api/advanced-analytics/mismatch returns array');
    if (mismatchRes.data.length > 0) {
      const mis = mismatchRes.data[0];
      assert('room_cap' in mis && 'batch_size' in mis && 'mismatch_severity' in mis, 'Mismatch rows have room_cap, batch_size, mismatch_severity');
    }

    const wastedRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/advanced-analytics/wasted-capacity',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${coordToken}` }
    });
    assert(wastedRes.status === 200 && Array.isArray(wastedRes.data), 'GET /api/advanced-analytics/wasted-capacity returns array');
    if (wastedRes.data.length > 0) {
      const w = wastedRes.data[0];
      assert('wasted_seats' in w && 'batch_section' in w && 'start_time' in w && 'end_time' in w, 'Wasted capacity rows have wasted_seats, batch_section, start_time, end_time');
    }

    const stressRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/advanced-analytics/temporal-stress',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${coordToken}` }
    });
    assert(stressRes.status === 200 && Array.isArray(stressRes.data), 'GET /api/advanced-analytics/temporal-stress returns array');
    if (stressRes.data.length > 0) {
      const s = stressRes.data[0];
      assert('network_congestion_percent' in s && 'concurrent_classes' in s && 'end_time' in s, 'Temporal stress rows have network_congestion_percent, concurrent_classes, end_time');
    }

    const effRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/advanced-analytics/efficiency-score',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${coordToken}` }
    });
    assert(effRes.status === 200 && 'efficiency_score' in effRes.data, `GET /api/advanced-analytics/efficiency-score returns score (${effRes.data.efficiency_score})`);

    const unscheduledRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/analytics/unscheduled-courses',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${coordToken}` }
    });
    assert(unscheduledRes.status === 200 && Array.isArray(unscheduledRes.data), `GET /api/analytics/unscheduled-courses returns array (${unscheduledRes.data.length} unscheduled)`);

    console.log(`\n========================================`);
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test Suite Error:', err);
    process.exit(1);
  }
}

runTests();
