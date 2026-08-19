import db from './server/db.js';

async function testQuery() {
  const [rows] = await db.query(`
      SELECT 
        'Empty' AS dept_name, 'No Course' AS course_name,
        NULL AS year_of_study, NULL AS section,
        all_slots.room_number, all_slots.day_of_week, all_slots.start_time, all_slots.end_time
      FROM Course_Schedule cs
      RIGHT JOIN (
          SELECT r.room_id, r.room_number, ts.slot_id, ts.day_of_week, ts.start_time, ts.end_time 
          FROM Room r CROSS JOIN Time_Slot ts
      ) AS all_slots ON cs.slot_id = all_slots.slot_id AND cs.room_id = all_slots.room_id
      WHERE cs.schedule_id IS NULL
      ORDER BY all_slots.day_of_week, all_slots.start_time, all_slots.room_number;
  `);
  console.log(rows.length);
  if (rows.length > 0) {
      console.log(rows[0]);
  }
  process.exit(0);
}

testQuery();
