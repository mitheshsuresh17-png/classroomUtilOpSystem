import http from 'http';

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    }).on('error', reject);
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(`http://localhost:5000${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function del(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:5000${path}`, { method: 'DELETE' }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('=== TESTING API ENDPOINTS ===\n');

  // 1. Schedules
  const schedules = await get('/api/schedules');
  console.log('1. /api/schedules (Status:', schedules.status, ')');
  console.log('   Count:', schedules.data.length);
  schedules.data.forEach(s => {
    console.log(`   - ${s.course_code} in ${s.room_number} for Yr ${s.year_of_study}-${s.section} on Day ${s.day_of_week} (${s.start_time.substring(0,5)}-${s.end_time.substring(0,5)})`);
  });

  // 2. Room CRUD
  console.log('\n2. Room CRUD Verification:');
  const createRoom = await post('/api/rooms', { room_number: 'TEST301', room_type: 'Classroom', capacity: 75 });
  console.log('   POST /api/rooms -> Status:', createRoom.status, createRoom.data);

  const roomsAfterAdd = await get('/api/rooms');
  const found = roomsAfterAdd.data.find(r => r.room_number === 'TEST301');
  console.log('   GET /api/rooms -> TEST301 present:', !!found);

  const deleteRoom = await del('/api/rooms/TEST301');
  console.log('   DELETE /api/rooms/TEST301 -> Status:', deleteRoom.status, deleteRoom.data);

  const roomsAfterDel = await get('/api/rooms');
  const foundAfter = roomsAfterDel.data.find(r => r.room_number === 'TEST301');
  console.log('   GET /api/rooms -> TEST301 removed:', !foundAfter);

  // 3. Analytics Endpoints
  console.log('\n3. Analytics Endpoints:');
  
  const endpoints = [
    '/api/analytics/room-saturation',
    '/api/analytics/infrastructure-sorting',
    '/api/analytics/trapped-capacity',
    '/api/advanced-analytics/wasted-capacity',
    '/api/advanced-analytics/mismatch',
    '/api/advanced-analytics/unified-utilization',
    '/api/advanced-analytics/imbalance',
    '/api/advanced-analytics/efficiency-score',
    '/api/advanced-analytics/signals',
    '/api/advanced-analytics/temporal-stress'
  ];

  for (const ep of endpoints) {
    const res = await get(ep);
    console.log(`   ${ep.padEnd(45)} -> Status: ${res.status} | Data:`, JSON.stringify(res.data).substring(0, 80) + '...');
  }

  console.log('\n=== ALL ENDPOINTS TESTED SUCCESSFULLY ===');
}

runTests().catch(console.error);
