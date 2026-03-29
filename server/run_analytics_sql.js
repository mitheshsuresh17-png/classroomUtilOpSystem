import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'mysql999',
  database: process.env.DB_NAME || 'classroom_utilization_db',
  multipleStatements: true
});

async function run() {
    try {
        console.log("Creating UnifiedUtilizationView...");
        await db.query(`
            CREATE OR REPLACE VIEW UnifiedUtilizationView AS
            SELECT 
                r.room_id, 
                r.room_number,
                r.room_type,
                r.capacity AS total_capacity,
                t.day_of_week,
                COUNT(cs.schedule_id) AS active_slots,
                (COUNT(cs.schedule_id) / 12.0) * 100 AS time_utilization_percent,
                SUM(b.student_count) AS total_students_scheduled,
                SUM(r.capacity) AS total_capacity_available_in_active_slots,
                (SUM(b.student_count) / SUM(r.capacity)) * 100 AS seat_utilization_percent
            FROM Room r
            CROSS JOIN (SELECT DISTINCT day_of_week FROM Time_Slot) t
            LEFT JOIN Course_Schedule cs ON r.room_id = cs.room_id 
            LEFT JOIN Time_Slot ts ON cs.slot_id = ts.slot_id AND ts.day_of_week = t.day_of_week
            LEFT JOIN Batch b ON cs.batch_id = b.batch_id
            GROUP BY r.room_id, t.day_of_week;
        `);
        console.log("UnifiedUtilizationView created.");

        console.log("Creating WastedCapacityView...");
        await db.query(`
            CREATE OR REPLACE VIEW WastedCapacityView AS
            SELECT 
                cs.schedule_id,
                r.room_id,
                r.room_number,
                r.room_type,
                r.capacity AS room_capacity,
                b.batch_id,
                b.section,
                b.student_count AS batch_size,
                (r.capacity - b.student_count) AS trapped_capacity,
                ts.day_of_week,
                ts.start_time,
                ts.end_time,
                c.course_name,
                d.dept_name
            FROM Course_Schedule cs
            JOIN Room r ON cs.room_id = r.room_id
            JOIN Batch b ON cs.batch_id = b.batch_id
            JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
            JOIN Course c ON cs.course_id = c.course_id
            JOIN Department d ON c.dept_id = d.dept_id;
        `);
        console.log("WastedCapacityView created.");

        console.log("Creating TemporalStressIndex...");
        await db.query(`
            CREATE OR REPLACE VIEW TemporalStressIndex AS
            SELECT 
                ts.day_of_week,
                ts.start_time,
                ts.end_time,
                COUNT(cs.schedule_id) AS active_rooms,
                (SELECT COUNT(*) FROM Room) AS total_rooms,
                (COUNT(cs.schedule_id) * 1.0 / (SELECT COUNT(*) FROM Room)) * 100 AS stress_ratio_percent
            FROM Time_Slot ts
            LEFT JOIN Course_Schedule cs ON ts.slot_id = cs.slot_id
            GROUP BY ts.day_of_week, ts.start_time, ts.end_time;
        `);
        console.log("TemporalStressIndex created.");

        console.log("Creating UtilizationImbalance...");
        await db.query(`
            CREATE OR REPLACE VIEW UtilizationImbalance AS
            SELECT 
                u.day_of_week,
                AVG(u.time_utilization_percent) AS avg_time_utilization,
                STDDEV(u.time_utilization_percent) AS stddev_time_utilization,
                MAX(u.time_utilization_percent) AS max_time_utilization,
                MIN(u.time_utilization_percent) AS min_time_utilization
            FROM UnifiedUtilizationView u
            GROUP BY u.day_of_week;
        `);
        console.log("UtilizationImbalance created.");

        console.log("Creating CapacityMismatchAnalysis...");
        await db.query(`
            CREATE OR REPLACE VIEW CapacityMismatchAnalysis AS
            SELECT 
                cs.schedule_id,
                r.room_number,
                r.capacity AS room_capacity,
                b.student_count AS batch_size,
                (b.student_count * 100.0 / r.capacity) AS fill_percentage,
                CASE 
                    WHEN (b.student_count * 100.0 / r.capacity) < 50 THEN 'Over-allocation (Too big)'
                    WHEN (b.student_count * 100.0 / r.capacity) > 100 THEN 'Under-allocation (Overcrowded)'
                    ELSE 'Optimal'
                END AS mismatch_status,
                ts.day_of_week,
                ts.start_time
            FROM Course_Schedule cs
            JOIN Room r ON cs.room_id = r.room_id
            JOIN Batch b ON cs.batch_id = b.batch_id
            JOIN Time_Slot ts ON cs.slot_id = ts.slot_id;
        `);
        console.log("CapacityMismatchAnalysis created.");

        console.log("Dropping existing score function...");
        await db.query(`DROP FUNCTION IF EXISTS calculate_system_efficiency_score;`);

        console.log("Creating calculate_system_efficiency_score function...");
        await db.query(`
            CREATE FUNCTION calculate_system_efficiency_score()
            RETURNS DECIMAL(5,2)
            READS SQL DATA
            BEGIN
                DECLARE avg_time_util DECIMAL(5,2);
                DECLARE avg_seat_util DECIMAL(5,2);
                DECLARE mismatch_penalty DECIMAL(5,2);
                DECLARE final_score DECIMAL(5,2);

                SELECT COALESCE(AVG(time_utilization_percent), 0) INTO avg_time_util FROM UnifiedUtilizationView;
                SELECT COALESCE(AVG(seat_utilization_percent), 0) INTO avg_seat_util FROM UnifiedUtilizationView;
                
                SELECT COALESCE(COUNT(*) * 2.0, 0) INTO mismatch_penalty 
                FROM CapacityMismatchAnalysis 
                WHERE mismatch_status != 'Optimal';

                SET final_score = (avg_time_util * 0.5) + (avg_seat_util * 0.5) - mismatch_penalty;
                
                IF final_score < 0 THEN SET final_score = 0; END IF;
                IF final_score > 100 THEN SET final_score = 100; END IF;
                
                RETURN final_score;
            END;
        `);
        console.log("calculate_system_efficiency_score created.");

        console.log("Creating ActionableAnalyticsSignals...");
        await db.query(`
            CREATE OR REPLACE VIEW ActionableAnalyticsSignals AS
            SELECT 
                'UNDERUTILIZED_ROOM' AS signal_type,
                CONCAT('Room ', room_number, ' is severely underutilized (', ROUND(time_utilization_percent, 1), '%).') AS description,
                room_number,
                5 AS severity_score
            FROM UnifiedUtilizationView
            WHERE time_utilization_percent < 20

            UNION ALL

            SELECT 
                'OVERCROWDED_ROOM' AS signal_type,
                CONCAT('Room ', room_number, ' is overcrowded! Capacity: ', room_capacity, ' vs Batch Size: ', batch_size) AS description,
                room_number,
                10 AS severity_score
            FROM CapacityMismatchAnalysis
            WHERE fill_percentage > 100

            UNION ALL

            SELECT 
                'HIGH_WASTE_ROOM' AS signal_type,
                CONCAT('Room ', room_number, ' has high trapped capacity: ', trapped_capacity, ' empty seats.') AS description,
                room_number,
                7 AS severity_score
            FROM WastedCapacityView
            WHERE trapped_capacity > 30

            UNION ALL

            SELECT 
                'PEAK_CONGESTION' AS signal_type,
                CONCAT('High congestion at ', start_time, ' on Day ', day_of_week, ' (', ROUND(stress_ratio_percent, 1), '% rooms in use).') AS description,
                NULL AS room_number,
                8 AS severity_score
            FROM TemporalStressIndex
            WHERE stress_ratio_percent > 85;
        `);
        console.log("ActionableAnalyticsSignals created.");

        console.log("All views and functions successfully created!");
    } catch (e) {
        console.error("Error executing SQL setup:", e);
    } finally {
        await db.end();
    }
}

run();
