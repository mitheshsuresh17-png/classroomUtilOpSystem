# Classroom & Lab Utilization Optimization System (CLUS)

> A full-stack web application that optimizes classroom and lab scheduling for educational institutions, powered by advanced MySQL database logic and a modern React + TypeScript frontend.

---

## Table of Contents

- [Overview](#overview)
- [Tutorial — Getting Started](#tutorial--getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Set Up the MySQL Database](#2-set-up-the-mysql-database)
  - [3. Configure the Backend](#3-configure-the-backend)
  - [4. Install Dependencies](#4-install-dependencies)
  - [5. Start the Application](#5-start-the-application)
  - [6. Create Your First Account](#6-create-your-first-account)
  - [7. Schedule Your First Room Allocation](#7-schedule-your-first-room-allocation)
- [How-To Guides](#how-to-guides)
  - [How to Add a New Room](#how-to-add-a-new-room)
  - [How to Add a New Batch](#how-to-add-a-new-batch)
  - [How to Diagnose a Failed Allocation](#how-to-diagnose-a-failed-allocation)
  - [How to Reset the Database](#how-to-reset-the-database)
  - [How to Deploy Analytics Views](#how-to-deploy-analytics-views)
  - [How to Seed Time Slots](#how-to-seed-time-slots)
- [Reference](#reference)
  - [Architecture Overview](#architecture-overview)
  - [Project Structure](#project-structure)
  - [Database Schema (ER Model)](#database-schema-er-model)
  - [REST API Reference](#rest-api-reference)
  - [SQL Objects Reference](#sql-objects-reference)
  - [Frontend Components](#frontend-components)
  - [Environment Variables](#environment-variables)
- [Explanation](#explanation)
  - [Why Database-Driven Logic?](#why-database-driven-logic)
  - [Normal Forms and Data Integrity](#normal-forms-and-data-integrity)
  - [The Efficiency Scoring Algorithm](#the-efficiency-scoring-algorithm)
  - [Actionable Signals Engine](#actionable-signals-engine)
  - [Authentication Design Decisions](#authentication-design-decisions)
  - [Common Pitfalls & Edge Cases](#common-pitfalls--edge-cases)

---

## Overview

**CLUS** is a Classroom & Lab Utilization Optimization System designed for educational institutions. It solves the real-world problem of scheduling conflicts, wasted room capacity, and infrastructure underutilization.

**Key capabilities:**
- **Room Management** — Track classrooms, labs, and lecture halls with their capacities and resources
- **Smart Scheduling** — Allocate courses to rooms and time slots with automatic conflict prevention
- **Utilization Analytics** — Real-time dashboards showing room utilization percentages, wasted capacity, and congestion hotspots
- **Integrity Enforcement** — MySQL triggers prevent double-booking and capacity overflow at the database level

**Tech Stack:**

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, TypeScript, Vite        |
| Styling    | Tailwind CSS 3.4                  |
| Routing    | React Router v7                   |
| Backend    | Node.js, Express 4                |
| Database   | MySQL (Views, Triggers, Functions)|
| Auth       | bcryptjs (password hashing)       |
| Icons      | lucide-react                      |

---

## Tutorial — Getting Started

This tutorial walks you through setting up the project from scratch and making your first room allocation.

### Prerequisites

Ensure you have the following installed:

| Tool       | Minimum Version | Check Command       |
|------------|-----------------|----------------------|
| Node.js    | 18.x            | `node --version`     |
| npm        | 9.x             | `npm --version`      |
| MySQL      | 8.0             | `mysql --version`    |

### 1. Clone the Repository

```bash
git clone <repository-url>
cd classroomUtilOpSystem
```

### 2. Set Up the MySQL Database

Open your MySQL client and execute the schema and seed files in order:

```sql
-- Step 1: Create the database, tables, views, triggers, and functions
SOURCE database/schema.sql;

-- Step 2: Populate with sample data
SOURCE database/seed.sql;
```

> **⚠️ IMPORTANT:** You must execute `schema.sql` **before** `seed.sql`. The schema creates the database `classroom_utilization_db` and all dependent objects (tables, views, triggers, stored functions, procedures). Running seed first will fail with missing-table errors.

Verify the setup:

```sql
USE classroom_utilization_db;

-- Should return 4 rooms
SELECT * FROM Room;

-- Should return 3 scheduled classes
SELECT * FROM Course_Schedule;

-- Should return utilization percentages
SELECT * FROM View_Room_Utilization;
```

### 3. Configure the Backend

Create or edit the environment file at `server/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=classroom_utilization_db
PORT=5000
```

> **⚠️ WARNING:** Never commit `server/.env` to version control. The `.gitignore` file already excludes it, but double-check before pushing.

### 4. Install Dependencies

Install both the frontend and backend dependencies:

```bash
# Frontend dependencies (from project root)
npm install

# Backend dependencies
cd server
npm install
cd ..
```

### 5. Start the Application

Use the convenience script to start both servers simultaneously:

```bash
npm run start:all
```

This runs:
- **Vite dev server** on `http://localhost:5173` (frontend)
- **Express API server** on `http://localhost:5000` (backend)

The Vite dev server proxies all `/api` requests to the Express backend automatically (configured in `vite.config.ts`), so you only need to access `http://localhost:5173` in your browser.

> **💡 TIP:** You can also start them individually in separate terminals:
> ```bash
> # Terminal 1 — Backend
> npm run server
>
> # Terminal 2 — Frontend
> npm run dev
> ```

### 6. Create Your First Account

1. Navigate to `http://localhost:5173`
2. Click **"Get Started"** on the landing page
3. Switch to the **"Sign Up"** tab on the auth page
4. Enter your name, email, and a password
5. Click **"Create Account"**

You will be redirected to the protected dashboard.

### 7. Schedule Your First Room Allocation

1. From the sidebar, navigate to **Schedule**
2. Click **"+ Allocate Room"** to open the scheduling form
3. Select a **Course**, **Batch**, **Room**, and **Time Slot** from the dropdowns
4. Click **"Save Schedule"**

If the allocation succeeds, the schedule grid will update immediately. If it fails (e.g., the room is already booked at that time or the batch is too large), the MySQL trigger's error message will be displayed.

---

## How-To Guides

### How to Add a New Room

**Via the UI:**
1. Navigate to **Rooms** in the sidebar
2. Click the **"+ Add Room"** button
3. Fill in the room number (e.g., `UB301`), select the room type, and enter the capacity
4. Click **"Add Room"**

**Via the API:**

```bash
curl -X POST http://localhost:5000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"room_number": "UB301", "room_type": "Classroom", "capacity": 80}'
```

**Directly in SQL:**

```sql
INSERT INTO Room (room_number, room_type, capacity)
VALUES ('UB301', 'Classroom', 80);
```

> **📝 NOTE:** The `room_type` field is constrained to one of: `'Classroom'`, `'Lab'`, or `'Lecture Hall'`. Any other value will be rejected by the `CHECK` constraint.

---

### How to Add a New Batch

**Via the API:**

```bash
curl -X POST http://localhost:5000/api/batches \
  -H "Content-Type: application/json" \
  -d '{
    "batch_id": 401,
    "year_of_study": 1,
    "section": "A",
    "student_count": 70,
    "dept_id": 1
  }'
```

**Constraints to be aware of:**
- `year_of_study` must be between 1 and 4 (enforced by `CHECK`)
- `student_count` must be greater than 0
- The combination `(year_of_study, section, dept_id)` must be unique
- `dept_id` must reference an existing department (foreign key)

---

### How to Diagnose a Failed Allocation

When a schedule allocation is rejected, the MySQL trigger `trg_prevent_booking_conflict` fires and returns a specific error. Here's how to read it:

| Error Message | Cause | Fix |
|---|---|---|
| `Double Booking Error: The room is already occupied for this time slot!` | Another class is already scheduled in that room at that time | Choose a different room or time slot |
| `Capacity Error: Room capacity is insufficient for the batch size!` | The batch has more students than the room can hold | Choose a larger room or split the batch |

**Using the Trigger Diagnostics endpoint:**

```bash
# Check the exact overflow for a specific batch-room pair
curl "http://localhost:5000/api/analytics/trigger-troubleshooting?batch_id=201&room_number=LAB1"
```

This returns:

```json
[{
  "batch_id": 201,
  "attempted_students": 60,
  "room_number": "LAB1",
  "max_room_capacity": 40,
  "overflow_amount": 20
}]
```

The `overflow_amount` of `20` means 20 extra students cannot fit — you need a room with at least 60 seats.

---

### How to Reset the Database

Run the reset script to drop and recreate all tables:

```bash
cd server
node reset_db.cjs
```

Then re-seed:

```bash
# In MySQL
SOURCE database/schema.sql;
SOURCE database/seed.sql;
```

> **🚨 CAUTION:** This **permanently deletes all data** including user accounts, schedules, and rooms. Only use this in development.

---

### How to Deploy Analytics Views

If the advanced analytics views (`UnifiedUtilizationView`, `WastedCapacityView`, etc.) are missing, deploy them:

```bash
cd server
node deploy_analytics_views.cjs
```

This script creates all the advanced views and stored functions required by the analytics dashboard.

---

### How to Seed Time Slots

If the `Time_Slot` table is empty or you need a full weekly grid:

```bash
cd server
node seed_slots.cjs
```

This populates the table with time slots across all 5 weekdays.

---

## Reference

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│  React 18 + TypeScript + Tailwind CSS + React Router v7 │
│                                                          │
│  Components:                                             │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌────────────┐ │
│  │ Dashboard│ │ RoomList │ │ Schedule  │ │ Analytics  │ │
│  │          │ │          │ │ View      │ │ View       │ │
│  └────┬─────┘ └────┬─────┘ └─────┬─────┘ └─────┬──────┘ │
│       │             │             │              │        │
│       └─────────────┴──────┬──────┴──────────────┘        │
│                            │  fetch() via /api proxy      │
└────────────────────────────┼─────────────────────────────┘
                             │  Vite Proxy → localhost:5000
┌────────────────────────────┼─────────────────────────────┐
│                Express.js REST API (port 5000)            │
│                                                           │
│  Routes: /api/rooms, /api/schedules, /api/batches,        │
│          /api/reports/*, /api/analytics/*,                 │
│          /api/advanced-analytics/*, /api/auth/*            │
└────────────────────────────┼──────────────────────────────┘
                             │  mysql2/promise connection pool
┌────────────────────────────┼──────────────────────────────┐
│                    MySQL 8.0 Database                      │
│                                                            │
│  Tables: Department, Course, Batch, Room, Time_Slot,       │
│          Course_Schedule, Room_Resource, Resource, users    │
│                                                            │
│  Views: View_Detailed_Schedule, View_Room_Utilization,     │
│         UnifiedUtilizationView, WastedCapacityView,        │
│         TemporalStressIndex, CapacityMismatchAnalysis,     │
│         ActionableAnalyticsSignals                         │
│                                                            │
│  Functions: get_utilization_percent(),                      │
│             calculate_system_efficiency_score()             │
│                                                            │
│  Procedures: evaluate_room_usage() (cursor-based)          │
│                                                            │
│  Triggers: trg_prevent_booking_conflict (BEFORE INSERT)    │
└────────────────────────────────────────────────────────────┘
```

---

### Project Structure

```
classroomUtilOpSystem/
├── database/
│   ├── schema.sql              # DDL: tables, views, triggers, functions, procedures
│   └── seed.sql                # DML: sample departments, courses, rooms, schedules
│
├── server/
│   ├── .env                    # Database credentials (not committed)
│   ├── db.js                   # MySQL connection pool (mysql2/promise)
│   ├── index.js                # Express routes (CRUD + analytics + auth)
│   ├── package.json            # Backend dependencies
│   ├── deploy_analytics_views.cjs  # Script to create advanced analytics views
│   ├── deploy_triggers.cjs     # Script to create/update triggers
│   ├── reset_db.cjs            # Script to reset the database
│   ├── restore_views.js        # Script to restore views
│   └── seed_slots.cjs          # Script to populate time slots
│
├── src/
│   ├── App.tsx                 # Root component with routing and ProtectedRoute
│   ├── main.tsx                # React entry point (BrowserRouter + AuthProvider)
│   ├── index.css               # Global styles and Tailwind config
│   ├── components/
│   │   ├── LandingPage.tsx     # Public marketing/landing page
│   │   ├── DashboardLayout.tsx # Sidebar navigation + nested routing
│   │   ├── Dashboard.tsx       # Summary stats + utilization table
│   │   ├── RoomList.tsx        # Room directory with filtering
│   │   ├── ScheduleView.tsx    # Schedule grid with allocation form
│   │   ├── BatchList.tsx       # Batch management view
│   │   ├── AnalyticsView.tsx   # Advanced analytics dashboard
│   │   ├── TimeSlotGrid.tsx    # Visual time slot grid
│   │   └── auth/
│   │       └── AuthPage.tsx    # Sign In / Sign Up split-layout page
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication state (React Context + localStorage)
│   └── lib/
│       └── api.ts              # All fetch() wrappers for the REST API
│
├── index.html                  # Vite HTML entry
├── vite.config.ts              # Vite config with API proxy
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Frontend dependencies and scripts
```

---

### Database Schema (ER Model)

#### Core Tables

| Table | Primary Key | Purpose |
|-------|-------------|---------|
| `Department` | `dept_id` | Academic departments |
| `Course` | `course_id` | Courses offered, linked to a department |
| `Batch` | `batch_id` | Student cohorts (year, section, count, department) |
| `Room` | `room_number` | Physical rooms with type and capacity |
| `Time_Slot` | `slot_id` | Discrete time periods (day, start, end) |
| `Course_Schedule` | `schedule_id` | Central allocation table linking course → batch → room → slot |
| `Resource` | `resource_id` | Physical resources (Projector, AC, etc.) |
| `Room_Resource` | `(room_number, resource_id)` | Many-to-many between rooms and resources (4NF) |
| `Room_Type_Lookup` | `type_id` | Normalization lookup for room types (BCNF) |
| `users` | `id` | User authentication accounts |

#### Key Constraints

```sql
-- Double-booking prevention at schema level
UNIQUE(room_number, slot_id) ON Course_Schedule

-- Capacity bounds
CHECK (capacity > 0) ON Room
CHECK (student_count > 0) ON Batch
CHECK (year_of_study BETWEEN 1 AND 4) ON Batch

-- Room type enumeration
CHECK (room_type IN ('Classroom', 'Lab', 'Lecture Hall')) ON Room

-- Time validity
CHECK (end_time > start_time) ON Time_Slot

-- Referential integrity via ON DELETE CASCADE
FOREIGN KEY (dept_id) REFERENCES Department(dept_id) ON DELETE CASCADE
-- ... and similar for all foreign keys
```

#### Relationships

```
Department  1──────*  Course
Department  1──────*  Batch
Course      1──────*  Course_Schedule
Batch       1──────*  Course_Schedule
Room        1──────*  Course_Schedule
Time_Slot   1──────*  Course_Schedule
Room        *──────*  Resource        (via Room_Resource)
```

---

### REST API Reference

#### Authentication

| Method | Endpoint | Body | Response | Description |
|--------|----------|------|----------|-------------|
| `POST` | `/api/auth/signup` | `{ name, email, password }` | `{ user: { id, name, email } }` | Register a new user |
| `POST` | `/api/auth/signin` | `{ email, password }` | `{ user: { id, name, email } }` | Log in an existing user |

---

#### CRUD — Rooms

| Method | Endpoint | Body / Params | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/rooms` | — | List all rooms with their resources |
| `POST` | `/api/rooms` | `{ room_number, room_type, capacity }` | Create a new room |
| `DELETE` | `/api/rooms/:room_number` | — | Delete a room by its number |

**Example response** for `GET /api/rooms`:

```json
[
  {
    "room_number": "UB101",
    "room_type": "Classroom",
    "capacity": 65,
    "resources": "Projector,Air Conditioner"
  },
  {
    "room_number": "LAB1",
    "room_type": "Lab",
    "capacity": 40,
    "resources": "High-End PCs,Smart Board"
  }
]
```

---

#### CRUD — Schedules

| Method | Endpoint | Body / Params | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/schedules` | — | List all schedules (via `View_Detailed_Schedule`) |
| `POST` | `/api/schedules` | `{ course_id, batch_id, room_number, slot_id }` | Allocate a room (trigger validates) |
| `DELETE` | `/api/schedules/:id` | — | Remove a schedule entry |

> **⚠️ IMPORTANT:** `POST /api/schedules` invokes the `trg_prevent_booking_conflict` trigger. If the trigger rejects the allocation, the response will be `400` with an `error` field containing the trigger's `SIGNAL` message.

---

#### CRUD — Batches, Courses, Time Slots

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/batches` | List all batches |
| `POST` | `/api/batches` | Create a batch |
| `DELETE` | `/api/batches/:id` | Delete a batch |
| `GET` | `/api/courses` | List all courses |
| `GET` | `/api/timeslots` | List all time slots |

---

#### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports/utilization` | Room utilization % (via view + stored function) |
| `GET` | `/api/reports/free-rooms` | Rooms with zero allocations (`NOT IN` subquery) |
| `GET` | `/api/reports/empty-slots` | Unoccupied room-slot pairs (`RIGHT JOIN`) |
| `GET` | `/api/reports/cursor-evaluation` | Cursor-based room usage evaluation (`CALL evaluate_room_usage()`) |

---

#### Analytics

| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| `GET` | `/api/analytics/department-course-load` | — | Department with highest course count |
| `GET` | `/api/analytics/unscheduled-courses` | — | Courses without any schedule (`LEFT JOIN ... IS NULL`) |
| `GET` | `/api/analytics/room-saturation` | `?min_saturation=0.90` | Rooms near capacity threshold |
| `GET` | `/api/analytics/infrastructure-averages` | — | Average slot usage grouped by room type |
| `GET` | `/api/analytics/trigger-troubleshooting` | `?batch_id=201&room_number=LAB1` | Diagnose capacity overflow for a specific pair |
| `GET` | `/api/analytics/infrastructure-sorting` | — | All rooms sorted by utilization % (desc) |
| `GET` | `/api/analytics/trapped-capacity` | — | Wasted seats in underutilized rooms (cursor-based) |

---

#### Advanced Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/advanced-analytics/unified-utilization` | Time + seat utilization per room |
| `GET` | `/api/advanced-analytics/wasted-capacity` | Seats wasted per schedule entry |
| `GET` | `/api/advanced-analytics/temporal-stress` | Congestion index per time slot |
| `GET` | `/api/advanced-analytics/imbalance` | Utilization imbalance across days |
| `GET` | `/api/advanced-analytics/mismatch` | Capacity mismatch severity analysis |
| `GET` | `/api/advanced-analytics/signals` | Actionable alerts (overcrowding, dead rooms, etc.) |
| `GET` | `/api/advanced-analytics/efficiency-score` | System-wide efficiency score (0–100) |

---

### SQL Objects Reference

#### Views

| View Name | Purpose | Key Joins |
|-----------|---------|-----------|
| `View_Detailed_Schedule` | Full schedule with course, batch, room, and time details | 5-way JOIN across all entity tables |
| `View_Room_Utilization` | Slots used per room | `LEFT JOIN` Room ↔ Course_Schedule |
| `UnifiedUtilizationView` | Time utilization % + average seat utilization % per room | Subquery for total slots, `AVG` aggregation |
| `WastedCapacityView` | Empty seats per scheduled session | `capacity - student_count` calculation |
| `TemporalStressIndex` | Network congestion per hour per day | `COUNT` of concurrent classes ÷ total rooms |
| `CapacityMismatchAnalysis` | Overcrowding or wasted capacity flags with penalty scores | `CASE` logic with severity thresholds |
| `ActionableAnalyticsSignals` | Unified alert feed combining all warning signals | `UNION ALL` of 4 independent queries |

#### Stored Functions

| Function | Signature | Returns | Description |
|----------|-----------|---------|-------------|
| `get_utilization_percent` | `(p_room_number VARCHAR(10))` | `DECIMAL(5,2)` | `(slots_used / total_slots) * 100` |
| `calculate_system_efficiency_score` | `()` | `DECIMAL(5,2)` | Weighted average of time + seat utilization minus mismatch penalties, clamped 0–100 |

#### Stored Procedures

| Procedure | Description |
|-----------|-------------|
| `evaluate_room_usage()` | Uses a **cursor** to iterate all rooms, calls `get_utilization_percent()` for each, and classifies them as `Underutilized` (<30%), `Optimal` (30–80%), or `Overutilized` (>80%). Results stored in `Temp_Room_Report`. |

#### Triggers

| Trigger | Event | Purpose |
|---------|-------|---------|
| `trg_prevent_booking_conflict` | `BEFORE INSERT ON Course_Schedule` | 1. Checks for double-booking (same room + slot). 2. Checks batch size ≤ room capacity. Raises `SQLSTATE '45000'` with a descriptive message on violation. |

---

### Frontend Components

| Component | Route | Purpose |
|-----------|-------|---------|
| `LandingPage` | `/` | Public marketing page with hero section |
| `AuthPage` | `/auth` | Sign In / Sign Up with animated split layout |
| `DashboardLayout` | `/app/*` | Protected layout with sidebar navigation |
| `Dashboard` | `/app/` | Summary cards (total rooms, schedules) + utilization table |
| `RoomList` | `/app/rooms` | Filterable room directory with add/delete |
| `BatchList` | `/app/batches` | Batch management with add/delete |
| `ScheduleView` | `/app/schedule` | Schedule grid + allocation form + advanced toggles |
| `AnalyticsView` | `/app/analytics` | Advanced analytics dashboard cards |
| `TimeSlotGrid` | (child component) | Visual grid of time slot availability |
| `ProtectedRoute` | (wrapper) | Redirects unauthenticated users to `/auth` |

---

### Environment Variables

All backend configuration is in `server/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | MySQL server hostname |
| `DB_USER` | `root` | MySQL username |
| `DB_PASSWORD` | *(empty)* | MySQL password |
| `DB_NAME` | `classroom_utilization_db` | Target database name |
| `PORT` | `5000` | Express server port |

---

## Explanation

### Why Database-Driven Logic?

CLUS intentionally pushes validation and computation into MySQL rather than the application layer. This is a deliberate design choice for several reasons:

1. **Atomicity** — The `BEFORE INSERT` trigger guarantees that double-booking prevention and capacity checks happen in the **same transaction** as the insert. Application-level validation has a TOCTOU (time-of-check-to-time-of-use) race condition where two concurrent requests could both pass validation and then both insert.

2. **Single Source of Truth** — Views like `UnifiedUtilizationView` compute metrics directly from the canonical data. There's no risk of a stale cache or out-of-sync application state.

3. **Academic Demonstration** — As a DBMS project, CLUS deliberately showcases advanced SQL constructs: triggers, cursors, stored functions/procedures, views, subqueries, and set operations (`UNION ALL`, `NOT IN`, `RIGHT JOIN`).

### Normal Forms and Data Integrity

The schema is designed to satisfy up to **5NF** (Fifth Normal Form):

| Normal Form | How It's Achieved |
|-------------|-------------------|
| **1NF** | All columns are atomic. No repeating groups. |
| **2NF** | No partial dependencies — all non-key columns depend on the full primary key. |
| **3NF** | No transitive dependencies (e.g., `room_type` is a direct attribute of `Room`, not derived from another non-key column). |
| **BCNF** | `Room_Type_Lookup` table separates the room type enumeration, ensuring every determinant is a candidate key. |
| **4NF** | `Room_Resource` intersection table eliminates the multi-valued dependency between rooms and resources. |
| **5NF** | `Course_Schedule` with its 4-column composite foreign-key structure avoids join dependencies. |

### The Efficiency Scoring Algorithm

The `calculate_system_efficiency_score()` function produces a single 0–100 score:

```
Score = (avg_time_utilization × 0.5) + (avg_seat_utilization × 0.5) − (mismatch_count × 2)
```

Where:
- **avg_time_utilization** = average of `(booked_slots / total_slots) × 100` across all rooms
- **avg_seat_utilization** = average of `(student_count / room_capacity) × 100` across all bookings
- **mismatch_count** = number of severe mismatches (overcrowding or >30 wasted seats)

The score is clamped between 0 and 100. A perfectly scheduled institution with no wasted capacity scores ~100.

### Actionable Signals Engine

The `ActionableAnalyticsSignals` view acts as a unified alerting system by combining four independent signals via `UNION ALL`:

| Signal Type | Severity | Trigger Condition |
|-------------|----------|-------------------|
| **Network Congestion** | 8–10 | >80% of rooms occupied in a single time slot |
| **Overcrowding Hazard** | 10 | Batch size exceeds room capacity |
| **Dead Resource** | 6 | Room has <20% time utilization |
| **Trapped Capacity** | 5 | >40 empty seats wasted in a scheduled session |

These signals are surfaced in the Analytics view, ordered by severity (highest first), enabling administrators to prioritize actions.

### Authentication Design Decisions

- **No JWT/Sessions** — CLUS uses a simplified auth model where user data is stored in `localStorage` after login. This is appropriate for a college DBMS project but **not for production**. A production system would use JWT tokens with refresh rotation or server-side sessions.
- **Password Hashing** — Passwords are hashed server-side with `bcryptjs` (10 salt rounds) before storage. Raw passwords never touch the database.
- **Content-Type Validation** — The `AuthContext` checks `Content-Type: application/json` on responses to gracefully handle cases where the backend is offline and the proxy returns an HTML error page.

### Common Pitfalls & Edge Cases

| Pitfall | Description | Solution |
|---------|-------------|----------|
| **Missing views after schema reset** | Running `schema.sql` creates base views, but advanced analytics views may need separate deployment | Run `node server/deploy_analytics_views.cjs` |
| **Empty time slot table** | The seed data only includes 3 time slots; utilization percentages may seem inflated | Run `node server/seed_slots.cjs` for a full weekly grid |
| **`room_id` vs `room_number`** | Some analytics queries reference `room_id` (a column that doesn't exist on the `Room` table, which uses `room_number` as its PK) | These are known bugs in the `room-saturation` and `infrastructure-sorting` routes — use `room_number` instead |
| **Connection pool exhaustion** | The `trapped-capacity` endpoint uses `db.getConnection()` and must call `connection.release()` — if the route errors before release, connections leak | Wrap in `try/finally` to ensure `connection.release()` always runs |
| **Trigger order of operations** | The trigger checks double-booking first, then capacity. If both violations exist, only the double-booking error is surfaced | Fix the secondary issue after resolving the first |
| **Cascade deletes** | All foreign keys use `ON DELETE CASCADE`. Deleting a department deletes **all** its courses, batches, and their schedules | Warn users or add soft-delete in production |
| **CORS configuration** | The backend uses `cors()` with default settings (all origins allowed). Acceptable for development, not for production | Restrict to specific origins in production |
| **`wasted_seats` column alias** | The `WastedCapacityView` uses `wasted_seats` but the API endpoint orders by `trapped_capacity` (which doesn't exist in the view) | This will silently succeed with no ordering on MySQL 8 — fix the `ORDER BY` clause |

---

## Scripts Reference

| Script | Location | Command | Purpose |
|--------|----------|---------|---------|
| Frontend dev server | root | `npm run dev` | Start Vite on `:5173` |
| Backend server | root | `npm run server` | Start Express on `:5000` |
| Both servers | root | `npm run start:all` | Start frontend + backend concurrently |
| Production build | root | `npm run build` | Create optimized frontend bundle |
| Lint | root | `npm run lint` | Run ESLint |
| Type check | root | `npm run typecheck` | Run TypeScript compiler in check-only mode |
| Deploy views | `server/` | `node deploy_analytics_views.cjs` | Create advanced analytics SQL views |
| Deploy triggers | `server/` | `node deploy_triggers.cjs` | Create/update SQL triggers |
| Reset database | `server/` | `node reset_db.cjs` | Drop and recreate all tables |
| Restore views | `server/` | `node restore_views.js` | Restore SQL views if dropped |
| Seed time slots | `server/` | `node seed_slots.cjs` | Populate `Time_Slot` table |

---

## License

This project was created as a college DBMS course project.
