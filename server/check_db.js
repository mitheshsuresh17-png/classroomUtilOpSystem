import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'mysql999',
  database: process.env.DB_NAME || 'classroom_utilization_db',
});

async function run() {
    try {
        const [rows] = await db.query("SHOW TABLES LIKE 'users'");
        if (rows.length === 0) {
            console.log("Table 'users' DOES NOT EXIST.");
            // If it doesn't exist, let's create it.
            await db.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log("Table 'users' CREATED and fixed.");
        } else {
            console.log("Table 'users' EXISTS.");
        }
    } catch(err) {
        console.error("DB Error:", err);
    } finally {
        await db.end();
    }
}

run();
