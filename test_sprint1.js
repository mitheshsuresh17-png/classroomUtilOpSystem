// Sprint 1 Automated RBAC and Authentication Verification Script
import http from 'http';

const BASE_URL = 'http://localhost:5000';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('  CLUS SPRINT 1 AUTOMATED VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // Test 1: Public Self-Registration is Disabled
  console.log('1. Testing Public Self-Registration Removal...');
  const signupRes = await request('/api/auth/signup', {
    method: 'POST',
    body: { name: 'Unauthorized Student', email: 'student@college.edu', password: 'Password@123' }
  });
  assert(signupRes.status === 404, `POST /api/auth/signup should return 404 Not Found (got ${signupRes.status})`);

  // Test 2: Unauthenticated Access to Protected Endpoints
  console.log('\n2. Testing Unauthenticated Access Rejection...');
  const unauthRooms = await request('/api/rooms');
  assert(unauthRooms.status === 401, `GET /api/rooms without token returns 401 (got ${unauthRooms.status})`);

  const unauthSchedules = await request('/api/schedules');
  assert(unauthSchedules.status === 401, `GET /api/schedules without token returns 401 (got ${unauthSchedules.status})`);

  const unauthAnalytics = await request('/api/advanced-analytics/efficiency-score');
  assert(unauthAnalytics.status === 401, `GET /api/advanced-analytics/efficiency-score without token returns 401 (got ${unauthAnalytics.status})`);

  const unauthUsers = await request('/api/users');
  assert(unauthUsers.status === 401, `GET /api/users without token returns 401 (got ${unauthUsers.status})`);

  // Test 3: Invalid Credentials Rejection
  console.log('\n3. Testing Invalid Credentials Rejection...');
  const badLogin = await request('/api/auth/signin', {
    method: 'POST',
    body: { email: 'coordinator@college.edu', password: 'WrongPassword' }
  });
  assert(badLogin.status === 401, `POST /api/auth/signin with bad password returns 401 (got ${badLogin.status})`);

  // Test 4: Viewer Authentication and RBAC
  console.log('\n4. Testing Viewer Authentication & Role Restrictions...');
  const viewerLogin = await request('/api/auth/signin', {
    method: 'POST',
    body: { email: 'viewer@college.edu', password: 'Viewer@123' }
  });
  assert(viewerLogin.status === 200, `POST /api/auth/signin for viewer returns 200 (got ${viewerLogin.status})`);
  assert(viewerLogin.data?.user?.role === 'viewer', `Viewer user role is "viewer" (got "${viewerLogin.data?.user?.role}")`);
  assert(!!viewerLogin.data?.token, `JWT token received in login response`);

  const viewerToken = viewerLogin.data?.token;
  const viewerHeaders = { Authorization: `Bearer ${viewerToken}` };

  // Viewer read permissions
  const viewerGetRooms = await request('/api/rooms', { headers: viewerHeaders });
  assert(viewerGetRooms.status === 200 && Array.isArray(viewerGetRooms.data), `Viewer can GET /api/rooms (got ${viewerGetRooms.status})`);

  const viewerGetSchedules = await request('/api/schedules', { headers: viewerHeaders });
  assert(viewerGetSchedules.status === 200 && Array.isArray(viewerGetSchedules.data), `Viewer can GET /api/schedules (got ${viewerGetSchedules.status})`);

  const viewerGetEfficiency = await request('/api/advanced-analytics/efficiency-score', { headers: viewerHeaders });
  assert(viewerGetEfficiency.status === 200, `Viewer can GET /api/advanced-analytics/efficiency-score (got ${viewerGetEfficiency.status})`);

  // Viewer mutation rejection (403 Forbidden)
  const viewerPostRoom = await request('/api/rooms', {
    method: 'POST',
    headers: viewerHeaders,
    body: { room_number: 'VIEWER99', room_type: 'Classroom', capacity: 30 }
  });
  assert(viewerPostRoom.status === 403, `Viewer attempting POST /api/rooms returns 403 Forbidden (got ${viewerPostRoom.status})`);

  const viewerPostSchedule = await request('/api/schedules', {
    method: 'POST',
    headers: viewerHeaders,
    body: { course_id: 101, batch_id: 201, room_number: 'UB101', slot_id: 5 }
  });
  assert(viewerPostSchedule.status === 403, `Viewer attempting POST /api/schedules returns 403 Forbidden (got ${viewerPostSchedule.status})`);

  const viewerPostBatch = await request('/api/batches', {
    method: 'POST',
    headers: viewerHeaders,
    body: { batch_id: 999, year_of_study: 1, section: 'Z', student_count: 30, dept_id: 1 }
  });
  assert(viewerPostBatch.status === 403, `Viewer attempting POST /api/batches returns 403 Forbidden (got ${viewerPostBatch.status})`);

  const viewerGetUsers = await request('/api/users', { headers: viewerHeaders });
  assert(viewerGetUsers.status === 403, `Viewer attempting GET /api/users returns 403 Forbidden (got ${viewerGetUsers.status})`);

  const viewerPostUser = await request('/api/users', {
    method: 'POST',
    headers: viewerHeaders,
    body: { name: 'Rogue User', email: 'rogue@college.edu', password: 'Password@123', role: 'coordinator' }
  });
  assert(viewerPostUser.status === 403, `Viewer attempting POST /api/users returns 403 Forbidden (got ${viewerPostUser.status})`);

  // Test 5: Coordinator Authentication and Privileges
  console.log('\n5. Testing Coordinator Authentication & Full Privileges...');
  const coordLogin = await request('/api/auth/signin', {
    method: 'POST',
    body: { email: 'coordinator@college.edu', password: 'Coordinator@123' }
  });
  assert(coordLogin.status === 200, `POST /api/auth/signin for coordinator returns 200 (got ${coordLogin.status})`);
  assert(coordLogin.data?.user?.role === 'coordinator', `Coordinator user role is "coordinator" (got "${coordLogin.data?.user?.role}")`);

  const coordToken = coordLogin.data?.token;
  const coordHeaders = { Authorization: `Bearer ${coordToken}` };

  // Coordinator can list users
  const coordGetUsers = await request('/api/users', { headers: coordHeaders });
  assert(coordGetUsers.status === 200 && Array.isArray(coordGetUsers.data), `Coordinator can GET /api/users (got ${coordGetUsers.status})`);

  // Coordinator can provision a new staff account
  const testStaffEmail = `staff_${Date.now()}@college.edu`;
  const provisionRes = await request('/api/users', {
    method: 'POST',
    headers: coordHeaders,
    body: { name: 'Assistant Coordinator', email: testStaffEmail, password: 'StaffPassword@123', role: 'viewer' }
  });
  assert(provisionRes.status === 201, `Coordinator can POST /api/users to provision staff (got ${provisionRes.status})`);
  assert(provisionRes.data?.user?.email === testStaffEmail, `Provisioned user returned in response`);

  // New staff user can log in
  const newStaffLogin = await request('/api/auth/signin', {
    method: 'POST',
    body: { email: testStaffEmail, password: 'StaffPassword@123' }
  });
  assert(newStaffLogin.status === 200, `Newly provisioned staff user can sign in (got ${newStaffLogin.status})`);
  assert(newStaffLogin.data?.user?.role === 'viewer', `Newly provisioned staff has correct assigned role "viewer"`);

  // Coordinator can perform CRUD mutations
  const createRoomRes = await request('/api/rooms', {
    method: 'POST',
    headers: coordHeaders,
    body: { room_number: 'TEST99', room_type: 'Lab', capacity: 45 }
  });
  assert(createRoomRes.status === 201, `Coordinator can POST /api/rooms (got ${createRoomRes.status})`);

  const deleteRoomRes = await request('/api/rooms/TEST99', {
    method: 'DELETE',
    headers: coordHeaders
  });
  assert(deleteRoomRes.status === 200, `Coordinator can DELETE /api/rooms/TEST99 (got ${deleteRoomRes.status})`);

  console.log('\n====================================================');
  console.log(`  VERIFICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
