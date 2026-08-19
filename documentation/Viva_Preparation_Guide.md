# MASTER VIVA PREPARATION GUIDE
**Classroom & Lab Utilization Optimization System (CLUS)**
**Topic: Frontend–Backend–Database Connectivity**

---

## 1. System Architecture Overview

The CLUS application follows a modern **3-Tier Architecture** (Client-Server Architecture). This means the application is divided into three distinct layers that talk to each other sequentially.

**The Full Flow Cycle:**
1. **Frontend (React)**: The user clicks a button (e.g., "Schedule Room"). React packages this request into JSON and sends it over HTTP to the Backend.
2. **Backend (Node.js/Express)**: The server receives the HTTP request, parses the JSON, and writes an SQL query. It acts as the strict middleman.
3. **Database (MySQL)**: The backend sends the SQL query to MySQL. MySQL executes the query, ensures no rules are broken (like double-booking), and returns the result (success or error).
4. **Response**: The Backend receives the result from MySQL, wraps it in an HTTP Response, and sends it back to the Frontend. The Frontend then updates the UI (e.g., showing a green success badge).

*Analogy:* Imagine a restaurant. The **Frontend** is the menu and the waiter taking your order. The **Backend** is the kitchen manager checking if they have the ingredients. The **Database** is the pantry where food is actually stored and retrieved.

---

## 2. Role of Each Layer

### Frontend (React with TypeScript)
* **Responsibility**: User Interface (UI) and User Experience (UX).
* **What it does**: Displays the dashboards, forms, and buttons. It collects user input and makes sure it looks correct (e.g., ensuring an email has an '@' symbol) before ever talking to the server.
* **Why TypeScript?**: It catches errors *during development* by strictly enforcing data types, preventing crashes when the app runs.

### Backend (Node.js with Express)
* **Responsibility**: Business Logic and Security.
* **What it does**: Express creates API "routes" (like `/api/auth/signup`). It takes requests from the frontend, validates the business rules, securely hashes passwords, and speaks to the database.
* **Crucial Rule**: It never trusts the frontend. It always double-checks the data.

### Database (MySQL)
* **Responsibility**: Persistent Storage and Data Integrity.
* **What it does**: Stores all rooms, courses, and schedules permanently on disk. It enforces strict physical rules (Constraints, Triggers) so that even if the Backend makes a mistake, the Database will reject invalid data.

---

## 3. Database Connectivity

### What is `mysql2`?
`mysql2` is a fast Node.js driver for MySQL. It is the bridge language that allows JavaScript code to execute SQL commands. We use the **Promise-based API** of `mysql2` because it allows us to use modern `async/await` syntax instead of messy, nested callbacks.

### What is a Connection Pool?
Instead of opening one single connection to the database, a connection pool creates a "batch" of connections (e.g., 10 connections) that are kept open and ready to use. 

### Why Pooling instead of a Single Connection?
* **Performance**: Opening and closing a database connection takes time. With a pool, connections are reused. 
* **Concurrency**: If 10 users click "book room" at the exact same time, a pool allows all 10 to be processed simultaneously using the 10 open connections. A single connection would force them to wait in line.
* *Analogy*: A single connection is like having one cashier at a supermarket. A connection pool is like having 10 cashiers; when one is busy, the next customer goes to an open cashier. When the customer leaves, the cashier is ready for the next person.

### Executing Queries with `async/await`
Database queries take time (they are asynchronous). `await` tells JavaScript: "Send this query to MySQL, pause this specific function, do other things in the background, and resume here only when MySQL replies."

---

## 4. Step-by-Step Request Flow: Scheduling a Class

1. **User Action**: The admin selects "Course A", "Batch B", and "Room 101" on the React frontend and clicks "Schedule".
2. **Frontend Fetch**: React uses the `fetch()` API to send a `POST` request to `http://localhost:5000/api/schedules` with the data formatted as JSON.
3. **Backend Route**: Express.js catches the request at the `/api/schedules` endpoint. It extracts `course_id`, `batch_id`, `room_id`, and `slot_id`.
4. **Database Query**: The backend grabs an available connection from the **Connection Pool** and executes: 
   `INSERT INTO Course_Schedule ... VALUES (?, ?, ?, ?)`
5. **Database Execution & Triggers**: MySQL tries to insert the row. Before inserting, a **Trigger** fires to check if `room 101` is already booked for that `slot_id`. If it is, MySQL throws an error.
6. **Response**: 
   * *If Success*: MySQL returns the new ID. The backend sends a `201 Created` HTTP status to React.
   * *If Error*: The backend catches the MySQL trigger error and sends a `400 Bad Request` HTTP status to React.
7. **UI Update**: React reads the HTTP status. If 201, it shows a success toast. If 400, it shows the red error message to the user.

---

## 5. Code Explanation (`db.js`)

Here is how our database connection file works:

* **`createPool`**: A function imported from `mysql2/promise`. It initializes our pool of reusable connections.
* **Environment Variables (`.env`)**: We use the `dotenv` package to load hidden variables like `DB_PASSWORD`. We do this so passwords aren't hardcoded into the source code where hackers or other developers can see them.
* **`connectionLimit: 10`**: This tells the pool to hold a maximum of 10 simultaneous connections. If an 11th request comes in, it waits in a queue until one of the 10 connections finishes its job.
* **`waitForConnections: true`**: Ensures that if the pool is full, incoming requests patiently queue up rather than immediately crashing and returning an error.

---

## 6. Data Validation and Constraints

Data is validated at three levels, but the database is the ultimate source of truth.

* **Primary Keys (PK) & Foreign Keys (FK)**: 
  * **PK**: Ensures every room or course has a unique identifier (no duplicates).
  * **FK**: Prevents "Orphaned Records". You cannot schedule a class in a Room ID that does not exist in the Room table. The database will literally block the insert.
* **Preventing Double Booking**: We enforce this via a schema constraint: `UNIQUE(room_id, slot_id)`. We also use a **BEFORE INSERT Trigger** to check if the room capacity is large enough for the batch size before allowing the booking.

---

## 7. Concurrency Handling

**What happens if two users try to book the exact same room at the exact same millisecond?**

* **The Problem**: A Race Condition. Both users check the database, see the room is empty, and both try to book it.
* **The Solution (Transactions & Locking)**: We use SQL Transactions (`START TRANSACTION` and `COMMIT`). 
* **Row-Level Locking**: Inside the transaction, we can run `SELECT * FROM Room WHERE room_id = 301 FOR UPDATE`. This places a "lock" on Room 301. User A gets the lock, books the room, and commits. User B is forced to wait until User A is done. By the time User B gets the lock, the room is taken, and User B's transaction is safely rejected.

---

## 8. Security Best Practices

* **Why shouldn't Frontend connect directly to the Database?**
  If React connected directly to MySQL, the database username and password would have to be sent to the user's browser. Anyone could open "Inspect Element", steal the credentials, and delete your entire database. The Backend acts as a secure firewall.
* **Why `.env` is used**: It keeps secrets out of Git repositories. If you upload your code to GitHub, the `.env` file is ignored (via `.gitignore`), keeping your server passwords safe.
* **Basic API Security**: 
  * We use parameterized queries (e.g., `VALUES (?, ?)`). This prevents **SQL Injection** attacks, where a hacker types malicious SQL code into a login box to drop tables.

---

## 9. Common Viva Questions and Perfect Answers

**Q1: What architecture does your project use?**
**A**: It uses a 3-tier architecture: A React frontend for the UI, a Node.js/Express backend for business logic, and a MySQL database for persistent storage.

**Q2: Why did you use `mysql2` instead of the standard `mysql` package?**
**A**: `mysql2` natively supports Promises. This allows me to use `async/await` syntax, which prevents "callback hell" and makes my backend code much cleaner and easier to debug.

**Q3: What is connection pooling and why is it in your `db.js`?**
**A**: Connection pooling creates a batch of reusable database connections. Instead of opening and closing a new connection for every single user request (which is very slow), the server reuses open connections, drastically improving performance and handling multiple users concurrently.

**Q4: How do you prevent two teachers from booking the same room at the same time?**
**A**: At the schema level, I have a `UNIQUE(room_id, slot_id)` constraint. I also implemented a `BEFORE INSERT` Trigger in MySQL that actively checks for existing bookings and throws a custom error before the row is inserted.

**Q5: What is an environment variable (`.env`) and why use it?**
**A**: It is a file that stores sensitive configuration data, like database passwords and port numbers. It is never uploaded to version control (like GitHub) to ensure malicious actors cannot access our live database.

**Q6: What happens if the database throws an error? Will your backend crash?**
**A**: No. I wrap all database queries in `try...catch` blocks. If MySQL throws an error (like a trigger violation), the `catch` block catches it and sends a polite `400 Bad Request` JSON response back to the frontend, preventing the server from crashing.

**Q7: How do you prevent SQL Injection in your backend?**
**A**: By using parameterized queries. When I write `db.query('INSERT INTO table VALUES (?, ?)', [val1, val2])`, the `mysql2` driver automatically escapes the inputs, neutralizing any malicious SQL code a user might have typed into a form.

**Q8: Explain how a Promise works in your database query.**
**A**: A Promise represents a value that is currently unknown but will be resolved in the future. When I query the database, Node doesn't freeze; it promises to return the result when MySQL is finished searching the hard drive, allowing the server to handle other users in the meantime.

**Q9: Why are Foreign Keys important in your system?**
**A**: They ensure Referential Integrity. For example, a Foreign Key guarantees that a schedule cannot be created for a `batch_id` or `room_id` that doesn't actually exist in the master tables.

**Q10: What is a Race Condition, and how does your database handle it?**
**A**: A race condition occurs when two concurrent requests try to modify the same data at the same time. I handle this using SQL Transactions and Row-Level Locking (`SELECT ... FOR UPDATE`), which forces the second request to wait until the first request finishes its booking.

---

## 10. One Final Summary (Memorize This!)

*"For my project, I implemented a robust 3-tier architecture. The user interacts with the React frontend, which sends JSON data to my Node.js and Express backend via HTTP. The backend acts as a secure middleware; it validates the request and uses the `mysql2` package to talk to the MySQL database. I implemented **Connection Pooling** in the backend to ensure high performance and concurrent user handling. The database itself is heavily fortified using Foreign Keys, Unique Constraints, and Custom Triggers to guarantee that data integrity is never compromised, such as completely preventing double-booking. Finally, all communication between the backend and database uses parameterized queries to protect against SQL injection."*
