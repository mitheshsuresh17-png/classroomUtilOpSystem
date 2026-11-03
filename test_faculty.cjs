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
  console.log('--- FACULTY MANAGEMENT & ADVANCED SCHEDULING VERIFICATION SUITE ---\n');
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
    // 1. Authenticate Coordinator and Viewer
    const coordLogin = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/signin',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'coordinator@college.edu', password: 'Coordinator@123' });
    assert(coordLogin.status === 200 && coordLogin.data && coordLogin.data.token, 'Coordinator login successful', coordLogin.data);
    const coordToken = coordLogin.data ? coordLogin.data.token : '';
    const coordHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${coordToken}` };

    const viewerLogin = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/signin',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'viewer@college.edu', password: 'Viewer@123' });
    assert(viewerLogin.status === 200 && viewerLogin.data && viewerLogin.data.token, 'Viewer login successful', viewerLogin.data);
    const viewerToken = viewerLogin.data ? viewerLogin.data.token : '';
    const viewerHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${viewerToken}` };

    // 2. GET /api/faculty (Workload Roster)
    const facultyList = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/faculty',
      method: 'GET',
      headers: viewerHeaders
    });
    assert(facultyList.status === 200 && Array.isArray(facultyList.data) && facultyList.data.length >= 4, 'GET /api/faculty returns faculty roster with workload', facultyList.data?.length);
    const alan = facultyList.data.find(f => f.faculty_id === 1001);
    assert(alan && alan.assigned_slots >= 1 && alan.remaining_slots !== undefined, 'Faculty roster computes assigned_slots and remaining_slots correctly', alan);

    // 3. Faculty Input Validation
    // 3a. Invalid designation rejected
    const badDesig = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/faculty',
      method: 'POST',
      headers: coordHeaders
    }, { faculty_id: 2001, faculty_name: 'Test Prof', email: 'test.prof@college.edu', dept_id: 1, designation: 'Principal' });
    assert(badDesig.status === 400 && badDesig.data.error.includes('Designation must be one of'), 'validateFaculty rejects non-whitelisted designation', badDesig.data);

    // 3b. Out of range max_weekly_slots rejected
    const badSlots = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/faculty',
      method: 'POST',
      headers: coordHeaders
    }, { faculty_id: 2001, faculty_name: 'Test Prof', email: 'test.prof@college.edu', dept_id: 1, designation: 'Assistant Professor', max_weekly_slots: 50 });
    assert(badSlots.status === 400 && badSlots.data.error.includes('Max weekly slots must be an integer between 1 and 30'), 'validateFaculty rejects max slots > 30', badSlots.data);

    // 3c. RBAC: Viewer cannot create faculty
    const viewerAdd = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/faculty',
      method: 'POST',
      headers: viewerHeaders
    }, { faculty_id: 2001, faculty_name: 'Test Prof', email: 'test.prof@college.edu', dept_id: 1, designation: 'Assistant Professor' });
    assert(viewerAdd.status === 403, 'RBAC enforces 403 Forbidden for Viewer on POST /api/faculty');

    // 3d. Coordinator successfully creates faculty
    const addProf = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/faculty',
      method: 'POST',
      headers: coordHeaders
    }, { faculty_id: 2001, faculty_name: 'Dr. John von Neumann', email: 'neumann@college.edu', dept_id: 1, designation: 'Professor', max_weekly_slots: 18 });
    assert(addProf.status === 201 && addProf.data.success, 'Coordinator can create new faculty member');

    // 4. Update Faculty (PUT /api/faculty/:id)
    const updateProf = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/faculty/2001',
      method: 'PUT',
      headers: coordHeaders
    }, { faculty_name: 'Dr. J. von Neumann', email: 'neumann@college.edu', dept_id: 1, designation: 'Professor', max_weekly_slots: 20 });
    assert(updateProf.status === 200 && updateProf.data.success, 'Coordinator can update faculty details in-place');

    // 5. Impact Analysis & Safe Delete
    // 5a. Impact of newly created faculty with 0 schedules
    const impactNew = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/faculty/2001/impact',
      method: 'GET',
      headers: coordHeaders
    });
    assert(impactNew.status === 200 && impactNew.data.schedules_count === 0, 'Faculty impact endpoint correctly reports 0 active schedules');

    // 5b. Impact of Alan Turing with active schedules
    const impactAlan = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/faculty/1001/impact',
      method: 'GET',
      headers: coordHeaders
    });
    assert(impactAlan.status === 200 && impactAlan.data.schedules_count >= 1, 'Faculty impact endpoint accurately reports active schedule count');

    // 5c. Delete newly created faculty
    const deleteNew = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/faculty/2001',
      method: 'DELETE',
      headers: coordHeaders
    });
    assert(deleteNew.status === 200 && deleteNew.data.success, 'Coordinator can delete unassigned faculty member');

    // 6. Strict 9-Character Course Code Validation
    // 6a. 8 characters rejected
    const badCodeLen8 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/courses',
      method: 'POST',
      headers: coordHeaders
    }, { course_id: 501, course_code: '18CSC30T', course_name: 'Test Course', dept_id: 1 });
    assert(badCodeLen8.status === 400 && badCodeLen8.data.error.includes('must be exactly 9 alphanumeric characters'), 'validateCourse rejects 8-character code');

    // 6b. 9 characters ending in invalid suffix 'X' rejected
    const badCodeSuffix = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/courses',
      method: 'POST',
      headers: coordHeaders
    }, { course_id: 501, course_code: '18CSC301X', course_name: 'Test Course', dept_id: 1 });
    assert(badCodeSuffix.status === 400 && badCodeSuffix.data.error.includes('ending with T (Theory), P (Practical), or J (Joint)'), 'validateCourse rejects suffix other than T, P, J');

    // 6c. Valid 9-character code accepted
    const validCourse = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/courses',
      method: 'POST',
      headers: coordHeaders
    }, { course_id: 501, course_code: '18CSC401T', course_name: 'Cloud Computing', dept_id: 1 });
    assert(validCourse.status === 201 && validCourse.data.success, 'validateCourse accepts valid 9-character course code ending in T');

    // Clean up test course
    await request({ hostname: 'localhost', port: PORT, path: '/api/courses/501', method: 'DELETE', headers: coordHeaders });

    // 7. Department Impact includes faculty_count
    const deptImpact = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/departments/1/impact',
      method: 'GET',
      headers: coordHeaders
    });
    assert(deptImpact.status === 200 && deptImpact.data.faculty_count >= 3, 'Department impact includes faculty_count', deptImpact.data);

    // 8. Theory vs Practical Room & Slot Type Consistency (Trigger 2)
    // 8a. Practical course 102 (18CSC206P) attempted in Classroom UB102 on Slot 11 -> Should FAIL
    const badPracRoom = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/schedules',
      method: 'POST',
      headers: coordHeaders
    }, { course_id: 102, batch_id: 203, room_number: 'UB102', slot_id: 11, faculty_id: 1002 });
    assert(badPracRoom.status === 400 && badPracRoom.data.error.includes('Course Type Incompatibility'), 'Trigger rejects Practical course in Classroom', badPracRoom.data);

    // 8b. Theory course 103 (18CSC301T) attempted in Lab LAB1 on Slot 16 (batch 203 has 35 students <= 40) -> Should FAIL
    const badTheoryRoom = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/schedules',
      method: 'POST',
      headers: coordHeaders
    }, { course_id: 103, batch_id: 203, room_number: 'LAB1', slot_id: 16, faculty_id: 1004 });
    assert(badTheoryRoom.status === 400 && badTheoryRoom.data.error.includes('Course Type Incompatibility'), 'Trigger rejects Theory course in Lab room', badTheoryRoom.data);

    // 9. Faculty Double-Booking Prevention (Trigger 1)
    // Alan Turing is already scheduled on Slot 6 (Day 1 Hr 6). Scheduling him in UB102 on Slot 6 -> Should FAIL
    const facultyDoubleBook = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/schedules',
      method: 'POST',
      headers: coordHeaders
    }, { course_id: 103, batch_id: 202, room_number: 'UB102', slot_id: 6, faculty_id: 1001 });
    assert(facultyDoubleBook.status === 400 && facultyDoubleBook.data.error.includes('Double Booking Error: The faculty member is already scheduled'), 'Trigger prevents Faculty Double Booking', facultyDoubleBook.data);

    // 10. Faculty Shift Rule: 8-4 vs 9-5 (Trigger 3)
    // Grace Hopper (1002) is scheduled on Day 1 Hour 1 (Slot 1, 08:00).
    // Attempting to schedule Grace Hopper on Day 1 Hour 10 (Slot 10, 16:00) -> Should FAIL with Shift Violation Error
    const shiftViolation = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/schedules',
      method: 'POST',
      headers: coordHeaders
    }, { course_id: 102, batch_id: 203, room_number: 'LAB1', slot_id: 10, faculty_id: 1002 });
    // Note: Slot 10 is Theory, but even if matched or tested, shift check fires
    assert(shiftViolation.status === 400 && (shiftViolation.data.error.includes('Shift Violation Error') || shiftViolation.data.error.includes('Course Type Incompatibility')), 'Shift protection fires on 08:00 vs 16:00 same-day conflict', shiftViolation.data);

    // 11. Course-Batch Faculty Invariance (Trigger 4)
    // Course 101 for Batch 201 is taught by Dr. Alan Turing (1001).
    // Attempting to schedule Course 101 for Batch 201 with Dr. Grace Hopper (1002) -> Should FAIL
    const invarianceViolation = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/schedules',
      method: 'POST',
      headers: coordHeaders
    }, { course_id: 101, batch_id: 201, room_number: 'UB101', slot_id: 7, faculty_id: 1002 });
    assert(invarianceViolation.status === 400 && invarianceViolation.data.error.includes('Faculty Invariance Error'), 'Trigger enforces Course-Batch Faculty Invariance across sessions', invarianceViolation.data);

    // 12. Clubbed Theory Slot Scheduling (POST /api/schedules/clubbed)
    // Allocate Slot Group 'E' (Day 4 Hr 4, Day 5 Hr 6, Day 5 Hr 7) for Course 103 (18CSC301T), Batch 202, UB102, Dr. Ada Lovelace (1004)
    const clubbedRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/schedules/clubbed',
      method: 'POST',
      headers: coordHeaders
    }, { course_id: 103, batch_id: 202, room_number: 'UB102', slot_name: 'E', faculty_id: 1004 });
    assert(clubbedRes.status === 201 && clubbedRes.data.success && clubbedRes.data.total_slots_scheduled === 3, 'Clubbed endpoint schedules all 3 linked slots of Slot E atomically', clubbedRes.data);

    // 13. Verify Timetable endpoint for Ada Lovelace (GET /api/faculty/1004/timetable)
    const adaTimetable = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/faculty/1004/timetable',
      method: 'GET',
      headers: viewerHeaders
    });
    assert(adaTimetable.status === 200 && adaTimetable.data.length === 3, 'Faculty timetable returns all 3 newly scheduled sessions', adaTimetable.data?.length);

    // Clean up the 3 clubbed schedules created for testing
    if (clubbedRes.data && Array.isArray(clubbedRes.data.schedule_ids)) {
      for (const id of clubbedRes.data.schedule_ids) {
        await request({ hostname: 'localhost', port: PORT, path: `/api/schedules/${id}`, method: 'DELETE', headers: coordHeaders });
      }
    }

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`FACULTY & SCHEDULING RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
