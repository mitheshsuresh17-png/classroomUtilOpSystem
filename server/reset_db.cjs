const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load .env from server directory first, fallback to root
const envPath = fs.existsSync(path.join(__dirname, '.env')) 
    ? path.join(__dirname, '.env') 
    : path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

function splitSqlScript(sql) {
    const statements = [];
    const lines = sql.split(/\r?\n/);
    let currentDelimiter = ';';
    let currentBuffer = [];

    for (const rawLine of lines) {
        const trimmed = rawLine.trim();

        // Check for DELIMITER change
        if (trimmed.toUpperCase().startsWith('DELIMITER')) {
            const parts = trimmed.split(/\s+/);
            if (parts.length > 1) {
                // If there's pending content, push it
                if (currentBuffer.length > 0) {
                    const stmt = currentBuffer.join('\n').trim();
                    if (stmt) statements.push(stmt);
                    currentBuffer = [];
                }
                currentDelimiter = parts[1];
                continue;
            }
        }

        if (currentDelimiter === ';') {
            currentBuffer.push(rawLine);
            // If statement ends with semicolon
            if (trimmed.endsWith(';')) {
                const stmt = currentBuffer.join('\n').trim();
                if (stmt) statements.push(stmt);
                currentBuffer = [];
            }
        } else {
            // In custom delimiter mode (e.g. //)
            if (trimmed.endsWith(currentDelimiter)) {
                // Remove the delimiter from the end of the line
                const lineWithoutDelim = rawLine.slice(0, rawLine.lastIndexOf(currentDelimiter));
                currentBuffer.push(lineWithoutDelim);
                const stmt = currentBuffer.join('\n').trim();
                if (stmt) statements.push(stmt);
                currentBuffer = [];
            } else {
                currentBuffer.push(rawLine);
            }
        }
    }

    if (currentBuffer.length > 0) {
        const stmt = currentBuffer.join('\n').trim();
        if (stmt) statements.push(stmt);
    }

    return statements;
}

async function resetDB() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: Number(process.env.DB_PORT) || 3306,
        multipleStatements: true
    };

    console.log(`[db:reset] Connecting to MySQL at ${config.host}:${config.port} as ${config.user}...`);
    let connection;

    try {
        connection = await mysql.createConnection(config);
        console.log('[db:reset] Connected successfully.');

        // 1. Read and execute schema.sql
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        console.log(`[db:reset] Reading schema from ${schemaPath}...`);
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        const schemaStatements = splitSqlScript(schemaSql);

        console.log(`[db:reset] Executing ${schemaStatements.length} schema blocks...`);
        for (const stmt of schemaStatements) {
            if (stmt.trim()) {
                await connection.query(stmt);
            }
        }
        console.log('[db:reset] Schema applied successfully.');

        // 2. Read and execute seed.sql
        const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');
        console.log(`[db:reset] Reading seed from ${seedPath}...`);
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        const seedStatements = splitSqlScript(seedSql);

        console.log(`[db:reset] Executing ${seedStatements.length} seed blocks...`);
        for (const stmt of seedStatements) {
            if (stmt.trim()) {
                await connection.query(stmt);
            }
        }
        console.log('[db:reset] Seed data loaded successfully.');

        console.log('\n[db:reset] SUCCESS: Database classroom_utilization_db fully reset and seeded!');
    } catch (err) {
        console.error('[db:reset] ERROR:', err.message);
        process.exitCode = 1;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

resetDB();
