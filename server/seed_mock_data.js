import db from './db.js';

async function seedData() {
  console.log('Starting large mock data seed...');
  
  try {
    // 1. Add Departments
    const newDepts = [
      { id: 3, name: 'Mechanical Engineering' },
      { id: 4, name: 'Civil Engineering' },
      { id: 5, name: 'Electrical Engineering' },
      { id: 6, name: 'Information Technology' },
      { id: 7, name: 'Biotechnology' },
      { id: 8, name: 'Chemical Engineering' },
      { id: 9, name: 'Aerospace Engineering' },
      { id: 10, name: 'Mathematics' },
    ];
    
    for (const d of newDepts) {
      await db.query('INSERT IGNORE INTO Department (dept_id, dept_name) VALUES (?, ?)', [d.id, d.name]);
    }
    console.log('Departments seeded.');

    // 2. Add Courses for each department
    let courseId = 300;
    const allCourses = [];
    for (const d of newDepts) {
      for (let i = 1; i <= 5; i++) {
        const code = `${d.name.substring(0, 2).toUpperCase()}${courseId}${['T','P'][i%2]}`;
        const name = `Advanced ${d.name} ${i}`;
        await db.query('INSERT IGNORE INTO Course (course_id, course_name, course_code, dept_id) VALUES (?, ?, ?, ?)', 
          [courseId, name, code, d.id]);
        allCourses.push(courseId);
        courseId++;
      }
    }
    console.log('Courses seeded.');

    // 3. Add Batches for each department
    let batchId = 400;
    const allBatches = [];
    for (const d of newDepts) {
      for (let year = 1; year <= 4; year++) {
        const sections = ['A', 'B'];
        for (const sec of sections) {
          const studentCount = Math.floor(Math.random() * 40) + 30; // 30 to 70 students
          await db.query('INSERT IGNORE INTO Batch (batch_id, year_of_study, section, student_count, dept_id) VALUES (?, ?, ?, ?, ?)', 
            [batchId, year, sec, studentCount, d.id]);
          allBatches.push({ id: batchId, count: studentCount });
          batchId++;
        }
      }
    }
    console.log('Batches seeded.');

    // 4. Add Rooms
    let roomId = 400;
    const allRooms = [];
    const types = ['Classroom', 'Lab', 'Lecture Hall'];
    for (let i = 1; i <= 25; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      let cap = 60;
      if (type === 'Lecture Hall') cap = 150;
      if (type === 'Lab') cap = 40;
      
      const rNum = `${type === 'Lab' ? 'L' : type === 'Lecture Hall' ? 'LH' : 'CR'}${roomId}`;
      
      await db.query('INSERT IGNORE INTO Room (room_id, room_number, room_type, capacity) VALUES (?, ?, ?, ?)', 
        [roomId, rNum, type, cap]);
      allRooms.push({ id: roomId, cap });
      roomId++;
    }
    console.log('Rooms seeded.');

    // Get time slots
    const [slots] = await db.query('SELECT slot_id FROM Time_Slot');
    const allSlots = slots.map(s => s.slot_id);

    // 5. Add Schedules
    // We want to add ~200 schedules.
    // Constraints: 
    // - UNIQUE(room_id, slot_id) -> double booking
    // - room capacity >= student count
    
    let schedulesAdded = 0;
    const usedRoomSlots = new Set();
    
    // Shuffle arrays for randomness
    allCourses.sort(() => 0.5 - Math.random());
    allBatches.sort(() => 0.5 - Math.random());
    allRooms.sort(() => 0.5 - Math.random());
    allSlots.sort(() => 0.5 - Math.random());

    for (const batch of allBatches) {
      // Each batch gets 2-4 classes
      const numClasses = Math.floor(Math.random() * 3) + 2;
      for (let c = 0; c < numClasses; c++) {
        const cId = allCourses[Math.floor(Math.random() * allCourses.length)];
        
        // Find a suitable room and slot
        let scheduled = false;
        // try randomly a few times
        for (let attempt = 0; attempt < 100; attempt++) {
          const r = allRooms[Math.floor(Math.random() * allRooms.length)];
          if (r.cap >= batch.count) {
             const s = allSlots[Math.floor(Math.random() * allSlots.length)];
             const comboId = `${r.id}-${s}`;
             if (!usedRoomSlots.has(comboId)) {
               usedRoomSlots.add(comboId);
               try {
                 await db.query('INSERT INTO Course_Schedule (course_id, batch_id, room_id, slot_id) VALUES (?, ?, ?, ?)', 
                   [cId, batch.id, r.id, s]);
                 schedulesAdded++;
                 scheduled = true;
               } catch (e) {
                 // Might be caught by trigger, ignore
               }
               break;
             }
          }
        }
      }
    }
    console.log(`Successfully added ${schedulesAdded} schedules.`);
    
    console.log('Seeding complete! You now have a massive dataset.');
    process.exit(0);

  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
}

seedData();
