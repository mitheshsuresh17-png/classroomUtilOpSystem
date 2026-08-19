require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');

async function deployViews() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    try {
        console.log('Deploying UnifiedUtilizationView...');
        await connection.query(`
            CREATE OR REPLACE VIEW UnifiedUtilizationView AS
            SELECT 
                r.room_number,
                r.room_type,
                r.capacity,
                (SELECT COUNT(*) FROM Time_Slot) as total_available_slots,
                COUNT(cs.schedule_id) as booked_slots,
                COALESCE(ROUND((COUNT(cs.schedule_id) / (SELECT COUNT(*) FROM Time_Slot)) * 100, 2), 0) as time_utilization_percent,
                COALESCE(ROUND(AVG(b.student_count / r.capacity) * 100, 2), 0) as avg_seat_utilization_percent
            FROM Room r
            LEFT JOIN Course_Schedule cs ON r.room_number = cs.room_number
            LEFT JOIN Batch b ON cs.batch_id = b.batch_id
            GROUP BY r.room_number, r.room_type, r.capacity;
        `);

        console.log('Deploying WastedCapacityView...');
        await connection.query(`
            CREATE OR REPLACE VIEW WastedCapacityView AS
            SELECT 
                cs.schedule_id,
                r.room_number,
                b.section as batch_section,
                ts.day_of_week,
                r.capacity as room_capacity,
                b.student_count as batch_size,
                (r.capacity - b.student_count) as wasted_seats
            FROM Course_Schedule cs
            JOIN Room r ON cs.room_number = r.room_number
            JOIN Batch b ON cs.batch_id = b.batch_id
            JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
            WHERE (r.capacity - b.student_count) > 0;
        `);

        console.log('Deploying TemporalStressIndex...');
        await connection.query(`
            CREATE OR REPLACE VIEW TemporalStressIndex AS
            SELECT 
                ts.day_of_week,
                ts.start_time,
                COUNT(cs.schedule_id) as concurrent_classes,
                (SELECT COUNT(*) FROM Room) as total_rooms,
                ROUND((COUNT(cs.schedule_id) / (SELECT COUNT(*) FROM Room)) * 100, 2) as network_congestion_percent
            FROM Time_Slot ts
            LEFT JOIN Course_Schedule cs ON ts.slot_id = cs.slot_id
            GROUP BY ts.day_of_week, ts.start_time
            ORDER BY ts.day_of_week, ts.start_time;
        `);

        console.log('Deploying CapacityMismatchAnalysis...');
        await connection.query(`
            CREATE OR REPLACE VIEW CapacityMismatchAnalysis AS
            SELECT 
                r.room_number,
                r.capacity as room_cap,
                b.student_count as batch_size,
                ts.day_of_week,
                ts.start_time,
                CASE 
                    WHEN b.student_count > r.capacity THEN 'Severe Overcrowding'
                    WHEN (r.capacity - b.student_count) > 30 THEN 'Severe Wasted Capacity'
                    ELSE 'Optimal'
                END as mismatch_severity,
                CASE 
                    WHEN b.student_count > r.capacity THEN -10
                    WHEN (r.capacity - b.student_count) > 30 THEN -5
                    ELSE 0
                END as penalty_score
            FROM Course_Schedule cs
            JOIN Room r ON cs.room_number = r.room_number
            JOIN Batch b ON cs.batch_id = b.batch_id
            JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
            WHERE b.student_count > r.capacity OR (r.capacity - b.student_count) > 30;
        `);

        console.log('Deploying ActionableAnalyticsSignals...');
        await connection.query(`
            CREATE OR REPLACE VIEW ActionableAnalyticsSignals AS
            SELECT 
                'Network Congestion' as signal_type,
                CONCAT('Peak congestion at Day ', day_of_week, ' ', start_time, ' (', network_congestion_percent, '% rooms full)') as message,
                CASE WHEN network_congestion_percent > 90 THEN 10 ELSE 8 END as severity_score
            FROM TemporalStressIndex
            WHERE network_congestion_percent > 80
            UNION ALL
            SELECT 
                'Overcrowding Hazard',
                CONCAT('Room ', room_number, ' is severely overcrowded. Capacity: ', room_cap, ' vs Batch: ', batch_size),
                10 as severity_score
            FROM CapacityMismatchAnalysis
            WHERE mismatch_severity = 'Severe Overcrowding'
            UNION ALL
            SELECT 
                'Dead Resource',
                CONCAT('Room ', room_number, ' is highly underutilized (', time_utilization_percent, '% time active)'),
                6 as severity_score
            FROM UnifiedUtilizationView
            WHERE time_utilization_percent < 20
            UNION ALL
            SELECT 
                'Trapped Capacity',
                CONCAT(wasted_seats, ' empty seats trapped in ', room_number, ' by small Batch Section ', batch_section),
                5 as severity_score
            FROM WastedCapacityView
            WHERE wasted_seats > 40;
        `);

        console.log('Deploying UtilizationImbalance (dummy structure)...');
        await connection.query(`
            CREATE OR REPLACE VIEW UtilizationImbalance AS
            SELECT 
                day_of_week,
                COUNT(schedule_id) as total_classes
            FROM Course_Schedule cs
            JOIN Time_Slot ts ON cs.slot_id = ts.slot_id
            GROUP BY day_of_week;
        `);

        console.log('Deploying calculate_system_efficiency_score function...');
        await connection.query('DROP FUNCTION IF EXISTS calculate_system_efficiency_score;');
        await connection.query(`
            CREATE FUNCTION calculate_system_efficiency_score() 
            RETURNS DECIMAL(5,2)
            DETERMINISTIC
            BEGIN
                DECLARE avg_time_util DECIMAL(5,2);
                DECLARE avg_seat_util DECIMAL(5,2);
                DECLARE total_penalty INT;
                DECLARE final_score DECIMAL(5,2);

                SELECT COALESCE(AVG(time_utilization_percent), 0) INTO avg_time_util FROM UnifiedUtilizationView;
                SELECT COALESCE(AVG(avg_seat_utilization_percent), 0) INTO avg_seat_util FROM UnifiedUtilizationView;
                SELECT COALESCE(COUNT(*) * 2, 0) INTO total_penalty FROM CapacityMismatchAnalysis;

                SET final_score = ((avg_time_util * 0.5) + (avg_seat_util * 0.5)) - total_penalty;

                IF final_score < 0 THEN SET final_score = 0; END IF;
                IF final_score > 100 THEN SET final_score = 100; END IF;

                RETURN final_score;
            END
        `);

        console.log('Views and Functions deployed successfully!');
    } catch (err) {
        console.error('Error deploying views:', err);
    } finally {
        await connection.end();
    }
}

deployViews();
