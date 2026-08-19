require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');

async function deployTriggers() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    try {
        console.log('Deploying View_Room_Utilization...');
        await connection.query(`
            CREATE OR REPLACE VIEW View_Room_Utilization AS
            SELECT 
                r.room_number, r.capacity, COUNT(cs.schedule_id) as slots_used
            FROM Room r
            LEFT JOIN Course_Schedule cs ON r.room_number = cs.room_number
            GROUP BY r.room_number, r.capacity;
        `);

        console.log('Deploying trg_prevent_booking_conflict...');
        await connection.query('DROP TRIGGER IF EXISTS trg_prevent_booking_conflict;');
        await connection.query(`
            CREATE TRIGGER trg_prevent_booking_conflict
            BEFORE INSERT ON Course_Schedule
            FOR EACH ROW
            BEGIN
                DECLARE conflict_count INT;
                DECLARE room_cap INT;
                DECLARE student_cnt INT;

                SELECT COUNT(*) INTO conflict_count
                FROM Course_Schedule
                WHERE room_number = NEW.room_number AND slot_id = NEW.slot_id;

                IF conflict_count > 0 THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Double Booking Error: The room is already occupied for this time slot!';
                END IF;

                SELECT capacity INTO room_cap FROM Room WHERE room_number = NEW.room_number;
                SELECT student_count INTO student_cnt FROM Batch WHERE batch_id = NEW.batch_id;

                IF student_cnt > room_cap THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Capacity Error: Room capacity is insufficient for the batch size!';
                END IF;
            END
        `);

        console.log('Deploying get_utilization_percent function...');
        await connection.query('DROP FUNCTION IF EXISTS get_utilization_percent;');
        await connection.query(`
            CREATE FUNCTION get_utilization_percent(p_room_number VARCHAR(10)) 
            RETURNS DECIMAL(5,2)
            DETERMINISTIC
            BEGIN
                DECLARE total_slots INT;
                DECLARE used_slots INT;
                DECLARE util_percent DECIMAL(5,2);

                SELECT COUNT(*) INTO total_slots FROM Time_Slot;

                IF total_slots = 0 THEN
                    RETURN 0.00;
                END IF;

                SELECT COUNT(*) INTO used_slots 
                FROM Course_Schedule 
                WHERE room_number = p_room_number;

                SET util_percent = (used_slots / total_slots) * 100;

                RETURN util_percent;
            END
        `);

        console.log('Deploying evaluate_room_usage procedure...');
        await connection.query('DROP PROCEDURE IF EXISTS evaluate_room_usage;');
        await connection.query(`
            CREATE PROCEDURE evaluate_room_usage()
            BEGIN
                DECLARE done INT DEFAULT FALSE;
                DECLARE r_num VARCHAR(10);
                DECLARE u_percent DECIMAL(5,2);
                DECLARE status_msg VARCHAR(50);
                
                DECLARE room_cursor CURSOR FOR SELECT room_number FROM Room;
                DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
                DECLARE CONTINUE HANDLER FOR SQLEXCEPTION Select 'An error occurred during evaluation' as ErrorMessage;
                
                DROP TEMPORARY TABLE IF EXISTS Temp_Room_Report;
                CREATE TEMPORARY TABLE Temp_Room_Report (
                    room_number VARCHAR(10),
                    utilization_percent DECIMAL(5,2),
                    status VARCHAR(50)
                );

                OPEN room_cursor;

                read_loop: LOOP
                    FETCH room_cursor INTO r_num;
                    IF done THEN
                        LEAVE read_loop;
                    END IF;

                    SET u_percent = get_utilization_percent(r_num);

                    IF u_percent < 30.0 THEN
                        SET status_msg = 'Underutilized';
                    ELSEIF u_percent > 80.0 THEN
                        SET status_msg = 'Overutilized';
                    ELSE
                        SET status_msg = 'Optimal';
                    END IF;

                    INSERT INTO Temp_Room_Report VALUES (r_num, u_percent, status_msg);
                END LOOP;

                CLOSE room_cursor;

                SELECT * FROM Temp_Room_Report;
            END
        `);

        console.log('Successfully deployed missing schema objects!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        connection.end();
    }
}
deployTriggers();
