require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');

async function run() {
    const c = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        await c.query('SET FOREIGN_KEY_CHECKS = 0');
        await c.query('TRUNCATE TABLE Time_Slot');
        let id = 1;
        for(let d=1; d<=5; d++) {
            for(let s=0; s<10; s++) {
                const startHour = 8 + s;
                const start = `${startHour.toString().padStart(2, '0')}:00:00`;
                const end = `${startHour.toString().padStart(2, '0')}:50:00`;
                await c.query('INSERT IGNORE INTO Time_Slot (slot_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)', [id++, String(d), start, end]);
            }
        }
        await c.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Slots seeded successfully! 50 slots generated.');
    } catch(err) {
        console.error(err);
    } finally {
        c.end();
    }
}
run();
