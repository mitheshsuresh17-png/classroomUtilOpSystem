import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' }); // or server/.env since it's the root

const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'classroom_utilization_db',
    multipleStatements: true
});

try {
    await db.query(`
        CREATE OR REPLACE VIEW view_detailed_schedule AS 
        SELECT cs.schedule_id, c.course_code, c.course_name, d.dept_name, b.year_of_study, b.section, r.room_number, r.room_type, ts.day_of_week, ts.start_time, ts.end_time 
        FROM course_schedule cs 
        JOIN course c ON cs.course_id = c.course_id 
        JOIN department d ON c.dept_id = d.dept_id 
        JOIN batch b ON cs.batch_id = b.batch_id 
        JOIN room r ON cs.room_id = r.room_id 
        JOIN time_slot ts ON cs.slot_id = ts.slot_id
    `);
    await db.query(`
        CREATE OR REPLACE VIEW view_room_utilization AS 
        SELECT r.room_number, r.capacity, COUNT(cs.schedule_id) as slots_used 
        FROM room r 
        LEFT JOIN course_schedule cs ON r.room_id = cs.room_id 
        GROUP BY r.room_id, r.room_number, r.capacity
    `);
    console.log('Views Created.');
} catch(e) {
    console.error(e.message);
} finally {
    await db.end();
}
