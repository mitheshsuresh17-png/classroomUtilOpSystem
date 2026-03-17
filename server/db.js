import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create the connection pool.
// Ensure your .env file in the server/ directory contains these variables:
// DB_HOST, DB_USER, DB_PASSWORD, DB_NAME (default: classroom_utilization_db)
const pool = createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'classroom_utilization_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
