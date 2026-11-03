const fs = require('fs');
const path = require('path');
const mysql = require(path.join(__dirname, '../server/node_modules/mysql2/promise'));
require(path.join(__dirname, '../server/node_modules/dotenv')).config({ path: path.join(__dirname, '../server/.env') });

async function resetSeed() {
  console.log('--- Seeding Database with Unified Batch 2 Master Dataset ---');
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'classroom_utilization_db',
    multipleStatements: true
  });

  const connection = await pool.getConnection();

  try {
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await connection.query(seedSql);
    console.log('✅ Master seed dataset successfully inserted into MySQL!\n');
  } catch (err) {
    console.error('Seeding error:', err);
    throw err;
  } finally {
    connection.release();
    pool.end();
  }
}

resetSeed();
