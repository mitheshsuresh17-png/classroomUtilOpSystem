const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './server/.env' });

async function resetDB() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        multipleStatements: true
    });

    try {
        console.log('Reading schema.sql...');
        const schema = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');
        console.log('Executing schema.sql...');
        await connection.query(schema);

        console.log('Reading seed.sql...');
        const seed = fs.readFileSync(path.join(__dirname, 'database', 'seed.sql'), 'utf8');
        console.log('Executing seed.sql...');
        await connection.query(seed);

        console.log('Database successfully rebuilt with new room_number schema!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

resetDB();
