const http = require('http');

const PORT = 5005;

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('--- SPRINT 4 PILOT HARDENING VERIFICATION SUITE ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name, details) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`, details ? `-> ${JSON.stringify(details)}` : '');
      failed++;
    }
  }

  try {
    // 1. Health check endpoint
    const health = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/health',
      method: 'GET'
    });
    assert(health.status === 200 && health.data.status === 'healthy' && health.data.database === 'connected', 'GET /api/health returns healthy and database connected', health);

    // 2. Authenticate as Coordinator to obtain token for authenticated validation tests
    const coordLogin = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/signin',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'coordinator@college.edu', password: 'Coordinator@123' });
    assert(coordLogin.status === 200 && coordLogin.data.token, 'Coordinator login successful', coordLogin);
    const token = coordLogin.data.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 3. Room input validation
    // 3a. Negative capacity rejected
    const badRoomCap = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/rooms',
      method: 'POST',
      headers: authHeaders
    }, { room_number: 'TEST-CAP', capacity: -15, room_type: 'Classroom' });
    assert(badRoomCap.status === 400 && badRoomCap.data?.error?.includes('Room capacity must be a positive integer'), 'validateRoom rejects negative capacity', badRoomCap);

    // 3b. Invalid room type rejected
    const badRoomType = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/rooms',
      method: 'POST',
      headers: authHeaders
    }, { room_number: 'TEST-TYP', capacity: 40, room_type: 'Auditorium' });
    assert(badRoomType.status === 400 && badRoomType.data?.error?.includes('Invalid room type'), 'validateRoom rejects invalid room type', badRoomType);

    // 4. Batch input validation
    // 4a. Invalid section format rejected
    const badBatchSection = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/batches',
      method: 'POST',
      headers: authHeaders
    }, { batch_id: 9991, year_of_study: 2, section: 'XYZ', student_count: 50, dept_id: 1 });
    assert(badBatchSection.status === 400 && badBatchSection.data?.error?.includes('Section must be a single uppercase letter'), 'validateBatch rejects invalid section', badBatchSection);

    // 4b. Zero or negative student count rejected
    const badBatchCount = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/batches',
      method: 'POST',
      headers: authHeaders
    }, { batch_id: 9992, year_of_study: 2, section: 'A', student_count: -10, dept_id: 1 });
    assert(badBatchCount.status === 400 && badBatchCount.data?.error?.includes('Student count must be a positive integer'), 'validateBatch rejects student count <= 0', badBatchCount);

    // 5. Department input validation
    // 5a. Non-integer dept_id rejected
    const badDeptId = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/departments',
      method: 'POST',
      headers: authHeaders
    }, { dept_id: 'invalid-id', dept_name: 'Test Dept' });
    assert(badDeptId.status === 400 && badDeptId.data?.error?.includes('Department ID must be a positive integer'), 'validateDepartment rejects non-integer dept_id', badDeptId);

    // 5b. Short department name rejected
    const badDeptName = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/departments',
      method: 'POST',
      headers: authHeaders
    }, { dept_id: 999, dept_name: 'A' });
    assert(badDeptName.status === 400 && badDeptName.data?.error?.includes('Department name must be between 2 and 100 characters'), 'validateDepartment rejects short dept_name', badDeptName);

    // 6. Course input validation
    // 6a. Non-integer course_id rejected
    const badCourseId = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/courses',
      method: 'POST',
      headers: authHeaders
    }, { course_id: 'bad-id', course_code: 'CS999', course_name: 'Test Course', dept_id: 1 });
    assert(badCourseId.status === 400 && badCourseId.data?.error?.includes('Course ID must be a positive integer'), 'validateCourse rejects invalid course_id', badCourseId);

    // 6b. Short course code rejected
    const badCourseCode = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/courses',
      method: 'POST',
      headers: authHeaders
    }, { course_id: 999, course_code: 'X', course_name: 'Test Course', dept_id: 1 });
    assert(badCourseCode.status === 400 && badCourseCode.data?.error?.includes('Course code must be'), 'validateCourse rejects invalid course_code', badCourseCode);

    // 7. Schedule input validation
    // 7a. Out of range slot_id rejected
    const badScheduleSlot = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/schedules',
      method: 'POST',
      headers: authHeaders
    }, { course_id: 1, batch_id: 1, room_number: 'LHC-101', slot_id: 99 });
    assert(badScheduleSlot.status === 400 && badScheduleSlot.data?.error?.includes('Time slot ID must be a valid slot between 1 and 50'), 'validateSchedule rejects slot_id > 50', badScheduleSlot);

    // 8. User Provisioning validation
    // 8a. Malformed email rejected
    const badUserEmail = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/users',
      method: 'POST',
      headers: authHeaders
    }, { name: 'Test User', email: 'not-an-email', password: 'Password@123', role: 'viewer' });
    assert(badUserEmail.status === 400 && badUserEmail.data?.error?.includes('valid email address is required'), 'validateUserProvision rejects malformed email', badUserEmail);

    // 8b. Password too short (< 8 chars) rejected
    const badUserPass = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/users',
      method: 'POST',
      headers: authHeaders
    }, { name: 'Test User', email: 'valid@college.edu', password: 'short', role: 'viewer' });
    assert(badUserPass.status === 400 && badUserPass.data?.error?.includes('Password must be at least 8 characters long'), 'validateUserProvision rejects short password', badUserPass);

    // 8c. Invalid role rejected
    const badUserRole = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/users',
      method: 'POST',
      headers: authHeaders
    }, { name: 'Test User', email: 'valid@college.edu', password: 'Password@123', role: 'student' });
    assert(badUserRole.status === 400 && badUserRole.data?.error?.includes('Role must be either "coordinator" or "viewer"'), 'validateUserProvision rejects invalid role', badUserRole);

    // 9. CORS Whitelist validation
    // 9a. Allowed origin (http://localhost:5174) gets Access-Control-Allow-Origin header
    const corsAllowed = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/health',
      method: 'GET',
      headers: { 'Origin': 'http://localhost:5174' }
    });
    assert(corsAllowed.headers['access-control-allow-origin'] === 'http://localhost:5174', 'CORS allows whitelisted origin http://localhost:5174');

    // 9b. Disallowed origin (http://evil-unauthorized.com) is blocked by CORS
    const corsBlocked = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/health',
      method: 'GET',
      headers: { 'Origin': 'http://evil-unauthorized.com' }
    });
    assert(corsBlocked.status === 500 || corsBlocked.text?.includes('CORS violation'), 'CORS blocks unauthorized origin http://evil-unauthorized.com');

    // 10. Rate Limiter on /api/auth/signin
    console.log('\nTesting rate limiter on /api/auth/signin (attempting rapid signins)...');
    let rateLimited = false;
    for (let i = 0; i < 15; i++) {
      const res = await request({
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/signin',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { email: 'fake@college.edu', password: 'FakePassword@123' });

      if (res.status === 429) {
        rateLimited = true;
        break;
      }
    }
    assert(rateLimited, 'Rate limiter triggers HTTP 429 Too Many Requests after threshold exceeded');

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`SPRINT 4 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
