# CLUS Codebase Audit Report

**Auditor:** Antigravity (AI Code Audit)  
**Date:** 2026-08-19  
**Repository:** `classroomUtilOpSystem/`  
**Scope:** Full read of every file in `server/`, `database/`, `src/`, and root config files

---

## 1. EXECUTIVE SUMMARY

CLUS is a full-stack web application that manages **room-to-timeslot scheduling** for a college. In concrete terms, what it does today:

1. **CRUD for rooms, batches, and schedules.** An authenticated user can create/delete rooms, create/delete batches (student cohorts), and create/delete course-to-room-to-timeslot allocations.
2. **Database-level scheduling integrity.** A MySQL `BEFORE INSERT` trigger prevents double-booking (same room + same timeslot) and rejects bookings where the batch's student count exceeds the room's capacity.
3. **Read-only analytics dashboards.** Multiple SQL views compute utilization percentages, wasted capacity, temporal congestion, capacity mismatches, and an overall "efficiency score" — all surfaced in the frontend.
4. **Minimal authentication.** Users sign up with name/email/password (bcrypt-hashed), sign in, and the user object is stored in `localStorage`. There is no session token, no JWT, no server-side session verification on any route.

**What it is NOT today:** It is not a role-based system. There are no admin vs. faculty vs. student roles. Any signed-in user can do everything — create rooms, delete schedules, view all analytics. The frontend's `ProtectedRoute` wrapper only checks whether a user object exists in localStorage; no server route checks authentication or authorization at all.

> [!IMPORTANT]
> **Scope discrepancy:** The `users` table and auth flow (signup/signin) are generic — they accept any email, have no `role` column, and store no department affiliation. The auth page's marketing copy references "50+ Institutions", "SRM University", "VIT Vellore", "IIT Madras", etc. ([AuthPage.tsx L6-L12](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/auth/AuthPage.tsx#L6-L12)) — these are fabricated testimonials with no basis in reality. The landing page says "Start for Free" and "Get Started Free" ([LandingPage.tsx L36, L77](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/LandingPage.tsx#L36-L77)), implying a SaaS product, which does not match the stated goal of a department-internal tool.

---

## 2. DATA MODEL — GROUND TRUTH

### 2.1 Tables, Columns, Types, and Constraints

All definitions from [schema.sql](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/database/schema.sql).

#### `Department` (L14-17)
| Column | Type | Constraints |
|--------|------|-------------|
| `dept_id` | `INT` | `PRIMARY KEY` |
| `dept_name` | `VARCHAR(100)` | `NOT NULL UNIQUE` |

#### `Course` (L19-25)
| Column | Type | Constraints |
|--------|------|-------------|
| `course_id` | `INT` | `PRIMARY KEY` |
| `course_name` | `VARCHAR(100)` | `NOT NULL` |
| `course_code` | `VARCHAR(10)` | `NOT NULL UNIQUE` |
| `dept_id` | `INT` | `NOT NULL`, FK → `Department(dept_id) ON DELETE CASCADE` |

#### `Batch` (L27-35)
| Column | Type | Constraints |
|--------|------|-------------|
| `batch_id` | `INT` | `PRIMARY KEY` |
| `year_of_study` | `INT` | `NOT NULL`, `CHECK (year_of_study BETWEEN 1 AND 4)` |
| `section` | `CHAR(1)` | `NOT NULL` |
| `student_count` | `INT` | `NOT NULL`, `CHECK (student_count > 0)` |
| `dept_id` | `INT` | `NOT NULL`, FK → `Department(dept_id) ON DELETE CASCADE` |
| | | `UNIQUE(year_of_study, section, dept_id)` |

#### `Room` (L37-41)
| Column | Type | Constraints |
|--------|------|-------------|
| `room_number` | `VARCHAR(10)` | `PRIMARY KEY` |
| `room_type` | `VARCHAR(20)` | `NOT NULL`, `CHECK (room_type IN ('Classroom', 'Lab', 'Lecture Hall'))` |
| `capacity` | `INT` | `NOT NULL`, `CHECK (capacity > 0)` |

> [!IMPORTANT]
> **There is no `room_id` column on the `Room` table.** The primary key is `room_number VARCHAR(10)`. Multiple places in the code reference `room_id` — see Section 7.

#### `Time_Slot` (L43-50)
| Column | Type | Constraints |
|--------|------|-------------|
| `slot_id` | `INT` | `PRIMARY KEY` |
| `day_of_week` | `VARCHAR(15)` | `NOT NULL`, `CHECK (day_of_week IN ('1','2','3','4','5'))` |
| `start_time` | `TIME` | `NOT NULL` |
| `end_time` | `TIME` | `NOT NULL` |
| | | `CHECK (end_time > start_time)`, `UNIQUE(day_of_week, start_time, end_time)` |

#### `Course_Schedule` (L52-63)
| Column | Type | Constraints |
|--------|------|-------------|
| `schedule_id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` |
| `course_id` | `INT` | `NOT NULL`, FK → `Course(course_id) ON DELETE CASCADE` |
| `batch_id` | `INT` | `NOT NULL`, FK → `Batch(batch_id) ON DELETE CASCADE` |
| `room_number` | `VARCHAR(10)` | `NOT NULL`, FK → `Room(room_number) ON DELETE CASCADE` |
| `slot_id` | `INT` | `NOT NULL`, FK → `Time_Slot(slot_id) ON DELETE CASCADE` |
| | | `UNIQUE(room_number, slot_id)` — prevents double booking at schema level |

#### `Room_Type_Lookup` (L69-72)
| Column | Type | Constraints |
|--------|------|-------------|
| `type_id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` |
| `type_name` | `VARCHAR(50)` | `UNIQUE NOT NULL` |

> [!NOTE]
> This table is **not referenced by any foreign key.** The `Room.room_type` column is a plain `VARCHAR` with a `CHECK` constraint, not a FK to this lookup table. The table exists solely as a "BCNF proof" artifact for the academic documentation.

#### `Resource` (L76-81)
| Column | Type | Constraints |
|--------|------|-------------|
| `resource_id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` |
| `resource_name` | `VARCHAR(100)` | `UNIQUE NOT NULL` |

Schema.sql inserts 4 default resources at L81: `'Projector', 'AC', 'Smart Board', 'High-End PCs'`.

#### `Room_Resource` (L84-90)
| Column | Type | Constraints |
|--------|------|-------------|
| `room_number` | `VARCHAR(10)` | PK (composite), FK → `Room(room_number) ON DELETE CASCADE` |
| `resource_id` | `INT` | PK (composite), FK → `Resource(resource_id) ON DELETE CASCADE` |

#### `users` (L95-101)
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` |
| `name` | `VARCHAR(100)` | `NOT NULL` |
| `email` | `VARCHAR(255)` | `NOT NULL UNIQUE` |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |

> [!WARNING]
> **No `role` column exists.** There is no way to distinguish admin, registrar, faculty, or any other role. Any user who signs up has implicit full access. This is the single most critical gap for the stated deployment goal.

### 2.2 Foreign Key ON DELETE Behavior

Every single FK in the schema uses `ON DELETE CASCADE`. This means:
- Deleting a `Department` cascades to delete all its `Course`s, `Batch`es, and transitively all `Course_Schedule` entries.
- Deleting a `Room` cascades to delete all `Course_Schedule` entries using that room, plus its `Room_Resource` entries.
- Deleting a `Time_Slot` cascades to delete all `Course_Schedule` entries using that slot.

This is explicitly noted in the README as a pitfall (L709).

### 2.3 Seed Data vs. Schema Mismatches

| Issue | Detail |
|-------|--------|
| **Resource name mismatch** | Schema L81 inserts `'AC'`, but seed.sql L28 inserts `'Air Conditioner'`. Since the seed `TRUNCATE`s `resource` first (L18) and re-inserts, the seed wins at runtime. The schema's inline `INSERT IGNORE` for `'AC'` becomes dead code if seed has already run. |
| **Seed includes `Fan`** | Seed.sql L30 inserts resource `(4, 'Fan')` which is not in the schema's inline insert list. |
| **Resource ID collision potential** | Schema uses `AUTO_INCREMENT` for `resource_id` but also does `INSERT IGNORE` with no explicit IDs. Seed.sql uses explicit IDs `(1-5)`. If schema runs first, the auto-increment counter and seed's explicit IDs could conflict on re-runs. |

---

## 3. BUSINESS LOGIC INVENTORY

### 3.1 Double-Booking Prevention

**Location:** Database trigger `trg_prevent_booking_conflict` — [schema.sql L136-162](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/database/schema.sql#L136-L162), also deployed via [deploy_triggers.cjs L26-52](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/deploy_triggers.cjs#L26-L52).

**Also enforced by:** `UNIQUE(room_number, slot_id)` constraint on `Course_Schedule` — [schema.sql L62](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/database/schema.sql#L62).

**Exact trigger condition:**
```sql
SELECT COUNT(*) INTO conflict_count
FROM Course_Schedule
WHERE room_number = NEW.room_number AND slot_id = NEW.slot_id;

IF conflict_count > 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Double Booking Error: The room is already occupied for this time slot!';
END IF;
```

> [!NOTE]
> The trigger and the UNIQUE constraint are **redundant** — both prevent the same thing. The trigger fires first (`BEFORE INSERT`), so the UNIQUE constraint error would never be reached if the trigger is present. This is intentional for academic demonstration purposes.

### 3.2 Capacity Check

**Location:** Same trigger `trg_prevent_booking_conflict`, second half — [schema.sql L154-161](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/database/schema.sql#L154-L161).

**Exact condition:**
```sql
SELECT capacity INTO room_cap FROM Room WHERE room_number = NEW.room_number;
SELECT student_count INTO student_cnt FROM Batch WHERE batch_id = NEW.batch_id;

IF student_cnt > room_cap THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Capacity Error: Room capacity is insufficient for the batch size!';
END IF;
```

> [!WARNING]
> **No BEFORE UPDATE trigger exists.** If someone updates `Batch.student_count` to exceed the capacity of a room it's already scheduled in, no validation fires. Similarly, if `Room.capacity` is reduced below an already-scheduled batch size, no check runs.

### 3.3 Utilization Percentage Calculation

**Location:** Stored function `get_utilization_percent` — [schema.sql L173-197](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/database/schema.sql#L173-L197).

**Formula:** `(used_slots_for_room / total_slots_in_system) * 100`

This means utilization is relative to **all timeslots in the system** — e.g., if there are 50 timeslots (5 days × 10 hours), a room booked for 5 slots has 10% utilization regardless of room type or actual hours of operation.

### 3.4 Efficiency Scoring

**Location:** Stored function `calculate_system_efficiency_score` — [schema.sql L337-364](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/database/schema.sql#L337-L364).

**Exact formula:**
```sql
SET final_score = ((avg_time_util * 0.5) + (avg_seat_util * 0.5)) - total_penalty;
-- total_penalty = COUNT(*) of CapacityMismatchAnalysis rows × 2
-- Clamped between 0 and 100
```

### 3.5 Room Usage Evaluation (Cursor)

**Location:** Stored procedure `evaluate_room_usage` — [schema.sql L208-256](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/database/schema.sql#L208-L256).

**Thresholds:**
- `< 30%` → `'Underutilized'`
- `> 80%` → `'Overutilized'`
- Otherwise → `'Optimal'`

### 3.6 Mismatch Severity Classification

**Location:** View `CapacityMismatchAnalysis` — [schema.sql L308-329](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/database/schema.sql#L308-L329).

```sql
WHEN b.student_count > r.capacity THEN 'Severe Overcrowding'
WHEN (r.capacity - b.student_count) > 30 THEN 'Severe Wasted Capacity'
ELSE 'Optimal'
```

### 3.7 Application-Level Logic

The Express server ([index.js](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/index.js)) contains **zero business logic** beyond pass-through CRUD. All validation, computation, and constraints are in MySQL. The server is purely a REST interface to SQL queries.

---

## 4. API SURFACE — VERIFIED

### 4.1 All Routes Actually Defined in [server/index.js](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/index.js)

| # | Method | Path | Line | What it does |
|---|--------|------|------|--------------|
| 1 | `GET` | `/api/rooms` | L25 | SELECT rooms with GROUP_CONCAT resources |
| 2 | `GET` | `/api/schedules` | L46 | SELECT * FROM View_Detailed_Schedule |
| 3 | `GET` | `/api/courses` | L56 | SELECT * FROM Course |
| 4 | `GET` | `/api/batches` | L66 | SELECT * FROM Batch |
| 5 | `GET` | `/api/timeslots` | L76 | SELECT * FROM Time_Slot |
| 6 | `POST` | `/api/schedules` | L86 | INSERT INTO Course_Schedule (trigger validates) |
| 7 | `DELETE` | `/api/schedules/:id` | L101 | DELETE FROM Course_Schedule |
| 8 | `POST` | `/api/rooms` | L112 | INSERT INTO Room |
| 9 | `DELETE` | `/api/rooms/:room_number` | L126 | DELETE FROM Room |
| 10 | `POST` | `/api/batches` | L137 | INSERT INTO Batch |
| 11 | `DELETE` | `/api/batches/:id` | L151 | DELETE FROM Batch |
| 12 | `GET` | `/api/reports/utilization` | L166 | View_Room_Utilization + get_utilization_percent() |
| 13 | `GET` | `/api/reports/free-rooms` | L185 | NOT IN subquery |
| 14 | `GET` | `/api/reports/empty-slots` | L199 | RIGHT JOIN (CROSS JOIN rooms × timeslots) |
| 15 | `GET` | `/api/analytics/department-course-load` | L225 | LEFT JOIN + COUNT, LIMIT 1 |
| 16 | `GET` | `/api/analytics/unscheduled-courses` | L244 | LEFT JOIN ... WHERE IS NULL |
| 17 | `GET` | `/api/analytics/room-saturation` | L259 | Correlated subquery — **BROKEN** (uses `room_id`) |
| 18 | `GET` | `/api/analytics/infrastructure-averages` | L279 | AVG(slots_used) GROUP BY room_type |
| 19 | `GET` | `/api/analytics/trigger-troubleshooting` | L294 | Cartesian product between Batch and Room |
| 20 | `GET` | `/api/analytics/infrastructure-sorting` | L314 | **BROKEN** (uses `room_id` in function call) |
| 21 | `GET` | `/api/analytics/trapped-capacity` | L328 | CALL evaluate_room_usage() + query Temp_Room_Report |
| 22 | `GET` | `/api/advanced-analytics/unified-utilization` | L357 | SELECT * FROM UnifiedUtilizationView |
| 23 | `GET` | `/api/advanced-analytics/wasted-capacity` | L366 | SELECT * FROM WastedCapacityView — **BROKEN ORDER BY** |
| 24 | `GET` | `/api/advanced-analytics/temporal-stress` | L375 | SELECT * FROM TemporalStressIndex |
| 25 | `GET` | `/api/advanced-analytics/imbalance` | L384 | SELECT * FROM UtilizationImbalance |
| 26 | `GET` | `/api/advanced-analytics/mismatch` | L393 | SELECT * FROM CapacityMismatchAnalysis — **BROKEN ORDER BY** |
| 27 | `GET` | `/api/advanced-analytics/signals` | L402 | SELECT * FROM ActionableAnalyticsSignals |
| 28 | `GET` | `/api/advanced-analytics/efficiency-score` | L411 | SELECT calculate_system_efficiency_score() |
| 29 | `GET` | `/api/reports/cursor-evaluation` | L422 | CALL evaluate_room_usage() |
| 30 | `POST` | `/api/auth/signup` | L437 | INSERT INTO users (bcrypt hashed) |
| 31 | `POST` | `/api/auth/signin` | L461 | SELECT + bcrypt.compare |

### 4.2 README vs. Code Cross-Check

| README claim | Code reality | Status |
|---|---|---|
| All routes in the "REST API Reference" tables (L472-571) | All listed routes exist in the code | ✅ **Match** |
| Route `GET /api/analytics/room-saturation` (L553) | Present at L259, but SQL uses `room_id` which doesn't exist | ⚠️ **Present but broken** |
| Route `GET /api/analytics/infrastructure-sorting` (L556) | Present at L314, but SQL calls `get_utilization_percent(room_id)` — `room_id` doesn't exist | ⚠️ **Present but broken** |
| `npm run start:all` script (L151) | Present in root package.json L9: `"start:all": "npx concurrently ..."` | ✅ **Match** — but `concurrently` is not in `devDependencies`, it would be installed ad-hoc by `npx` |
| README says sidebar navigation (L617-621) | Code uses tab-based navigation in a top navbar, not a sidebar. Sidebar only appears on mobile. | ⚠️ **Discrepancy** |

### 4.3 Routes Present but Undocumented in README

| Route | Line |
|-------|------|
| `GET /api/reports/cursor-evaluation` | L422 — Calls `evaluate_room_usage()`. The README mentions cursor evaluation (L543, L600) but this specific route path doesn't appear in the REST API Reference table. |

---

## 5. AUTH & ACCESS CONTROL — CURRENT STATE

### 5.1 Signup Flow

1. Client sends `POST /api/auth/signup` with `{ name, email, password }` — [index.js L437-457](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/index.js#L437-L457)
2. Server checks for duplicate email via `SELECT id FROM users WHERE email = ?`
3. Server hashes password with `bcrypt.genSalt(10)` + `bcrypt.hash()`
4. Server inserts into `users` table
5. Server responds with `{ user: { id, name, email } }`
6. Client stores the user object in `localStorage` as `clus_user` — [AuthContext.tsx L76](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/contexts/AuthContext.tsx#L76)

### 5.2 Signin Flow

1. Client sends `POST /api/auth/signin` with `{ email, password }` — [index.js L461-479](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/index.js#L461-L479)
2. Server fetches user by email: `SELECT * FROM users WHERE email = ?` (L467)
3. Server compares with `bcrypt.compare()`
4. On success, responds with `{ user: { id, name, email } }`
5. Client stores in `localStorage`

### 5.3 Client-Side Session

- User state is stored in React Context + `localStorage` key `clus_user` — [AuthContext.tsx L27-36](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/contexts/AuthContext.tsx#L27-L36)
- On mount, `AuthProvider` reads from `localStorage` and sets the user in state
- `ProtectedRoute` in [App.tsx L7-19](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/App.tsx#L7-L19) checks `isAuthenticated` (which is `!!user`) and redirects to `/auth` if false

### 5.4 Server-Side Access Control

> [!CAUTION]
> **There is ZERO server-side authentication or authorization on any route.** Every single API route in [index.js](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/index.js) can be called by anyone with network access to port 5000. There is:
> - No middleware checking for an auth token/session
> - No JWT generation or verification
> - No role-based access checks
> - No rate limiting
>
> The "authentication" exists only as a cosmetic frontend gate. An unauthenticated HTTP client (e.g., `curl`) can create rooms, delete schedules, read all data, and create admin accounts with no restriction.

### 5.5 Scope Discrepancy: Open Self-Registration

Anyone can sign up at `/auth` — there is no invitation system, no admin approval, no email verification, and no domain restriction. For a department-facing production tool, this means any person who discovers the URL can create an account and gain full access to all scheduling data and operations.

---

## 6. FRONTEND COMPONENT INVENTORY

### 6.1 [LandingPage.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/LandingPage.tsx) (172 lines)

**Renders:** Marketing/landing page with hero section, feature cards, and footer.  
**API calls:** None.  
**Status:** Fully cosmetic — no backend interaction. Contains hardcoded stats in the "dashboard preview" section (L107-123: "Total Rooms: 12", "Schedules: 48", "Free Rooms: 3", "Analytics: 7") that are fake mockup values, not live data.  

> [!WARNING]
> **Scope discrepancy:** Marketing copy ("Start for Free", "Get Started Free") suggests a SaaS product with self-service onboarding, which contradicts the goal of a department-internal admin tool.

### 6.2 [AuthPage.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/auth/AuthPage.tsx) (319 lines)

**Renders:** Split-layout auth page with Sign In / Sign Up tabs.  
**API calls:** Calls `login()` and `signup()` from `AuthContext`.  
**Status:** Fully wired to backend auth routes. Works end-to-end.  

> [!WARNING]
> **Scope discrepancy:** Contains fabricated university testimonials (L6-12: "SRM University", "VIT Vellore", "Anna University", "IIT Madras", "PSG Tech") with fake quotes and star ratings. Also displays fake stat badges ("500+ Classrooms Managed", "98% Uptime Reliability" at L89-104). This is misleading marketing copy.

### 6.3 [DashboardLayout.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/DashboardLayout.tsx) (178 lines)

**Renders:** Top navigation bar with tab switching, user profile dropdown, and mobile sidebar.  
**API calls:** None directly — delegates to child components.  
**Status:** Fully wired. Note that the `analytics` tab is **commented out** at L19:
```ts
// { id: 'analytics', label: 'Analytics', icon: BarChart3 },
```
But the `AnalyticsView` is still rendered if `activeTab === 'analytics'` at L173 — this code path is unreachable from the UI since there's no way to set the tab to `'analytics'`.

The profile dropdown has a "Profile" button (L107-110) that does nothing — it has no `onClick` handler.

### 6.4 [Dashboard.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/Dashboard.tsx) (142 lines)

**Renders:** Two stat cards (Total Rooms, Total Schedules) and a utilization summary table.  
**API calls:** `fetchUtilizationReport()`, `fetchFreeRooms()`, `fetchSchedules()`, `fetchRooms()` — all via `Promise.all` at L32-37.  
**Status:** Fully wired to backend. The `conflicts` stat is hardcoded to `0` (L43) — it's never computed. The `freeRooms` stat is computed but not displayed in the stat cards (removed from `statCards` array; only `totalRooms` and `totalSchedules` are shown at L64-67).

### 6.5 [RoomList.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/RoomList.tsx) (284 lines)

**Renders:** Filterable room directory with create/delete functionality and expandable TimeSlotGrid per room.  
**API calls:** `fetchRooms()`, `fetchFreeRooms()`, `fetchTimeSlots()`, `fetchSchedules()`, `createRoom()`, `deleteRoom()`.  
**Status:** Fully wired. The "Show Completely Free Rooms Only" toggle switches between `fetchRooms()` and `fetchFreeRooms()`. The expandable row shows TimeSlotGrid in view mode with booked slots highlighted.

Note: The `loadRooms` function referenced at L42 is actually `loadData` (L63). This is a minor naming inconsistency — `loadRooms()` is not defined as a standalone function; the `handleCreate` callback at L42 calls `loadRooms()` which would be `loadData()`. **Wait — `loadRooms` is not defined in this component.** The `handleCreate` at L42 calls `loadRooms()` but only `loadData` exists. This would be a **runtime error** if creating a room. Let me re-check... Actually, looking more carefully, `loadData` is at L63, and `handleCreate` at L42 calls `loadRooms()`. This should fail at runtime. **However**, upon further review the effect at L59-61 re-runs `loadData()` when `showFreeOnly` changes, so room creation would only refresh if the toggle changes. The `loadRooms()` call at L42 is indeed an undefined function call bug.

**Actually correction:** I need to re-examine. Looking at L63: `const loadData = async () => {`. And L42: `loadRooms();`. There is no `loadRooms` function. This is a bug that would throw a ReferenceError at runtime when creating a room. The same issue at L53 in `handleDelete` — it also calls `loadRooms()`. **This is a confirmed bug.**

### 6.6 [BatchList.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/BatchList.tsx) (222 lines)

**Renders:** Filterable batch directory with create/delete functionality.  
**API calls:** `fetchBatches()`, `createBatch()`, `deleteBatch()`.  
**Status:** Fully wired to backend. The batch creation form requires manual `batch_id` input (L100-101) — this is unusual since `batch_id` is a primary key that would normally be auto-generated, but the schema defines it as a plain `INT PRIMARY KEY` (not `AUTO_INCREMENT`), so manual entry is required.

### 6.7 [ScheduleView.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/ScheduleView.tsx) (323 lines)

**Renders:** Schedule creation form (course + batch + room + timeslot) with a master schedule table and filters.  
**API calls:** `fetchSchedules()`, `fetchCourses()`, `fetchBatches()`, `fetchRooms()`, `fetchTimeSlots()`, `scheduleRoom()`, `fetchEmptySlots()`, `fetchUnscheduledCourses()`, `deleteSchedule()`.  
**Status:** Fully wired. The "Include Empty Time Slots" toggle merges empty slot data into the schedule table. The unscheduled courses data is fetched (L74) but **never displayed in the UI** — the `unscheduledData` state is set but not rendered anywhere in the component's JSX.

### 6.8 [AnalyticsView.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/AnalyticsView.tsx) (360 lines)

**Renders:** Advanced analytics dashboard with efficiency score, actionable signals, capacity mismatches, wasted capacity, and temporal stress.  
**API calls:** `fetchEfficiencyScore()`, `fetchActionableSignals()`, `fetchCapacityMismatch()`, `fetchWastedCapacity()`, `fetchTemporalStress()`, `fetchUnifiedUtilization()`, `fetchUtilizationImbalance()`.  
**Status:** **Unreachable from the UI.** The analytics tab is commented out in DashboardLayout.tsx L19. The component is fully implemented but cannot be accessed by users.

Additional issue: The component references fields that don't match the view definitions:
- L180: `signal.description` — but the `ActionableAnalyticsSignals` view outputs `message`, not `description`
- L202, L217, L218: `m.mismatch_status` — but the `CapacityMismatchAnalysis` view outputs `mismatch_severity`, not `mismatch_status`
- L242: `m.room_capacity` — but the view outputs `room_cap`
- L251: `m.fill_percentage` — the view does not output a `fill_percentage` column
- L284: `waste.trapped_capacity` — but `WastedCapacityView` outputs `wasted_seats`, not `trapped_capacity`
- L291: `waste.course_name` — the view does not include `course_name`
- L326: `stress.stress_ratio_percent` — the `TemporalStressIndex` view outputs `network_congestion_percent`, not `stress_ratio_percent`
- L333: `stress.end_time` — the view does not include `end_time` in its SELECT
- L347: `stress.active_rooms` — the view outputs `concurrent_classes`, not `active_rooms`

> [!CAUTION]
> The AnalyticsView component references **at least 10 field names that do not match the actual SQL view column names.** Even if the tab were enabled, it would render empty/undefined values throughout.

### 6.9 [TimeSlotGrid.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/TimeSlotGrid.tsx) (123 lines)

**Renders:** Visual 5-day × N-hour grid of timeslots with booked/available/selected states.  
**API calls:** None — pure presentational component receiving data as props.  
**Status:** Fully functional as a child component. Used by RoomList (view mode) and ScheduleView (select mode).

---

## 7. KNOWN BUGS — VERIFIED OR REFUTED

### 7.1 `room_id` vs `room_number` Bug

**README claim (L706):** "Some analytics queries reference `room_id` (a column that doesn't exist on the Room table, which uses `room_number` as its PK)"

**Status: ✅ CONFIRMED — STILL PRESENT in 3 locations:**

1. **`/api/analytics/room-saturation`** — [index.js L269](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/index.js#L269):
   ```sql
   WHERE cs.room_id = r.room_id
   ```
   `room_id` does not exist on either `Course_Schedule` or `Room`. This query will fail with a MySQL error.

2. **`/api/analytics/infrastructure-sorting`** — [index.js L317](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/index.js#L317):
   ```sql
   get_utilization_percent(room_id)
   ```
   `room_id` does not exist on `Room`. Will fail with MySQL error.

3. **`restore_views.js`** — [L21, L28](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/restore_views.js#L21-L28):
   ```sql
   JOIN room r ON cs.room_id = r.room_id
   -- and
   LEFT JOIN course_schedule cs ON r.room_id = cs.room_id
   ```
   Both references use `room_id`. This script would fail if run.

4. **`test_empty.js`** — [L11, L13](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/test_empty.js#L11-L13):
   ```sql
   SELECT r.room_id, ... FROM Room r ...
   ON cs.room_id = all_slots.room_id
   ```
   Uses `room_id`. This test script would fail.

### 7.2 `wasted_seats` / `trapped_capacity` ORDER BY Bug

**README claim (L711):** "The WastedCapacityView uses `wasted_seats` but the API endpoint orders by `trapped_capacity` (which doesn't exist in the view)"

**Status: ✅ CONFIRMED — STILL PRESENT**

[index.js L368](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/index.js#L368):
```sql
SELECT * FROM WastedCapacityView ORDER BY trapped_capacity DESC
```

The view ([schema.sql L287](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/database/schema.sql#L287)) outputs `wasted_seats`, not `trapped_capacity`. As the README notes, MySQL 8 may silently ignore an ORDER BY on a non-existent column (behavior varies by MySQL mode), resulting in unordered results rather than an error.

### 7.3 Additional ORDER BY Bug — `mismatch` Route

**Not mentioned in README but present:**

[index.js L395](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/index.js#L395):
```sql
SELECT * FROM CapacityMismatchAnalysis ORDER BY fill_percentage DESC
```

The view ([schema.sql L308-329](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/database/schema.sql#L308-L329)) does not output `fill_percentage`. It outputs `mismatch_severity` and `penalty_score`. Same silent-failure behavior.

### 7.4 Additional ORDER BY Bug — `unified-utilization` Route

[index.js L359](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/index.js#L359):
```sql
SELECT * FROM UnifiedUtilizationView ORDER BY day_of_week
```

The `UnifiedUtilizationView` ([schema.sql L264-276](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/database/schema.sql#L264-L276)) does not include `day_of_week` in its output columns. It groups by `room_number, room_type, capacity`. This ORDER BY will silently fail.

### 7.5 Connection Leak on `trapped-capacity` Route

**README claim (L707):** "The `trapped-capacity` endpoint uses `db.getConnection()` and must call `connection.release()` — if the route errors before release, connections leak"

**Status: ✅ CONFIRMED — STILL PRESENT**

[index.js L328-349](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/index.js#L328-L349):
```javascript
const connection = await db.getConnection();
await connection.query('CALL evaluate_room_usage()');
const [rows] = await connection.query(`...`);
connection.release();  // Only reached on success
res.json(rows);
```

If either `CALL evaluate_room_usage()` or the second query throws, execution jumps to the `catch` block at L347, and `connection.release()` at L345 is never called. The `catch` block does not call `connection.release()`. This is a connection pool leak.

### 7.6 Trigger Ordering Issue

**README claim (L708):** "The trigger checks double-booking first, then capacity. If both violations exist, only the double-booking error is surfaced."

**Status: ✅ CONFIRMED — by design**

The trigger at [schema.sql L144-161](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/database/schema.sql#L144-L161) checks conflict first, then capacity. `SIGNAL` terminates the trigger immediately, so only the first violation is reported.

### 7.7 NEW: `loadRooms` Undefined Function Bug

**Not in README.** [RoomList.tsx L42, L53](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/RoomList.tsx#L42-L53) call `loadRooms()` which is not defined in the component. The actual data-loading function is `loadData` at L63. This would cause a `ReferenceError` at runtime when creating or deleting a room.

---

## 8. SECURITY POSTURE — VERIFIED

### 8.1 CORS Configuration

[index.js L17](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/index.js#L17):
```javascript
app.use(cors());
```

`cors()` with no arguments enables **all origins**. Any website on the internet can make API calls to this server. The README acknowledges this at L710.

### 8.2 `.env` Values

**Committed to repository:** The file `server/.env` is present in the working tree and contains the actual database password:
```
DB_PASSWORD=mysql999
```
([server/.env L3](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/.env#L3))

The root `.gitignore` includes `.env` (L23), which should prevent it from being tracked. However, the `.env` file is present in the repo — it may have been committed before the `.gitignore` entry was added, or the gitignore pattern `.env` may not match `server/.env` depending on Git version behavior. **The credential `mysql999` is visible in the codebase.**

**Hardcoded fallback credentials** in [db.js L12](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/db.js#L12):
```javascript
password: process.env.DB_PASSWORD || '',
```
This falls back to empty password, not a hardcoded secret — acceptable.

### 8.3 SQL Injection

**All SQL queries use parameterized queries (`?` placeholders).** Examples:
- [index.js L90-91](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/index.js#L90-L91): `'INSERT INTO Course_Schedule ... VALUES (?, ?, ?, ?)'`
- [index.js L444](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/index.js#L444): `'SELECT id FROM users WHERE email = ?'`

**No string concatenation for SQL** was found in any server-side file. ✅ **Parameterized queries throughout.**

### 8.4 Sensitive Fields in API Responses

**Signin route** at [index.js L467](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/index.js#L467):
```javascript
const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
```
This fetches **all columns** including `password_hash`. However, the response at L476 only sends:
```javascript
res.json({ user: { id: user.id, name: user.name, email: user.email } });
```
So `password_hash` is not returned to the client. ✅ **Password hash is not leaked in responses.**

### 8.5 Other Security Issues

| Issue | Detail |
|-------|--------|
| **No rate limiting** | No middleware limits login attempts, signup spam, or API call volume |
| **No input validation** | Room number, batch section, etc. are passed directly to SQL with no length/format checks beyond DB constraints |
| **No HTTPS enforcement** | Server binds to `0.0.0.0:5000` (L482) with plain HTTP |
| **No CSRF protection** | With `cors()` wide open and localStorage auth, CSRF is not a concern per se (no cookies), but the open CORS means any script can call the API |
| **Password policy** | Frontend enforces `minLength={6}` (AuthPage L263) but server only checks for non-empty (L463) |

---

## 9. GAPS AGAINST THE STATED GOAL

The stated goal is: *"a reliable tool a college department can depend on — NOT a student-facing app."*

### Gap 1: No Role-Based Access Control
The `users` table has no `role` column. There's no distinction between a registrar, department coordinator, faculty member, or an unauthorized user. Everyone who signs up has full power.

### Gap 2: No Server-Side Authentication
All API routes are publicly accessible. The frontend auth gate is trivially bypassed.

### Gap 3: Open Self-Registration
Anyone can create an account. For a department tool, users should be provisioned by an administrator.

### Gap 4: No Audit Trail
There is no logging of who created, modified, or deleted schedules, rooms, or batches. No `created_by`, `updated_at`, or `modified_by` columns exist.

### Gap 5: No Course or Department Management in the UI
There are no UI screens to create/edit/delete Courses or Departments. These can only be managed via direct SQL. For a department tool, these are fundamental CRUD operations.

### Gap 6: No Update Operations
There are no `PUT`/`PATCH` routes for any entity. You cannot edit a room's capacity, a batch's student count, or reschedule an allocation — only delete and recreate.

### Gap 7: No BEFORE UPDATE Trigger
If a room's capacity is reduced or a batch's student count is increased after scheduling, no validation fires to catch the newly-invalid state.

### Gap 8: Broken Analytics Routes
At least 2 routes (`room-saturation`, `infrastructure-sorting`) will fail with MySQL errors due to referencing non-existent `room_id` column. At least 3 ORDER BY clauses reference non-existent columns.

### Gap 9: Analytics Tab Disabled
The AnalyticsView component is fully built but inaccessible — the tab is commented out. Even if enabled, it references ~10 wrong field names.

### Gap 10: No Data Backup or Migration Strategy
`ON DELETE CASCADE` on every FK means accidental deletions propagate catastrophically. There's no soft-delete, no undo, no backup mechanism.

### Gap 11: Misleading Marketing Content
Fabricated university testimonials, fake statistics ("500+ Classrooms Managed"), and SaaS-style marketing copy conflict with the goal of a department-internal tool and could create credibility issues.

### Gap 12: Connection Pool Leak
The `trapped-capacity` route can leak database connections on error, eventually exhausting the connection pool (10 connections per [db.js L15](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/db.js#L15)).

### Gap 13: No Input Sanitization/Validation Beyond Database
No server-side validation of input format, length, or type before database queries. Relies entirely on MySQL CHECK constraints and type coercion.

### Gap 14: `loadRooms` Reference Error
Creating or deleting a room in the RoomList component will throw a JavaScript runtime error, making room management partially broken.

### Gap 15: Stale Helper Scripts
`restore_views.js` and `test_empty.js` use the old `room_id` column and will fail if executed. `reset_db.cjs` looks for `database/` relative to `__dirname` (which is `server/`), so it looks at `server/database/` which doesn't exist — the database folder is at the project root.

---

## CONFIDENCE STATEMENT

### High Confidence (verified by reading actual code, line by line)
- All table definitions, constraints, and foreign keys in schema.sql
- All 31 API routes in index.js — their SQL queries, parameters, and error handling
- All frontend components — their API calls, state management, and rendering logic
- Authentication flow end-to-end (signup, signin, localStorage, ProtectedRoute)
- Every bug listed in the README — verified present or not
- SQL injection safety — confirmed all queries are parameterized
- CORS configuration — confirmed wide open

### Medium Confidence (verified by reading code, but behavior depends on runtime state)
- The `loadRooms` bug in RoomList.tsx — I'm confident the function is undefined in the component scope, but there's a small chance it's provided by a closure or import I missed (I did not find one)
- MySQL behavior for ORDER BY on non-existent columns — depends on `sql_mode` settings, but typically MySQL 8 in default mode silently ignores it
- The `.gitignore` coverage of `server/.env` — the pattern `.env` at root level should match `server/.env`, but the file is present in the working tree, suggesting it was committed before gitignore was set up

### Lower Confidence (inferred, not fully verified)
- Whether `reset_db.cjs` actually works — its `__dirname` path resolution points to `server/database/` which doesn't exist as a directory. I inferred this would fail but did not execute the script
- Runtime behavior of `deploy_analytics_views.cjs` and `deploy_triggers.cjs` — I verified their SQL matches the schema but did not execute them against a live database
- The `UtilizationImbalance` view referenced at [index.js L386](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/index.js#L386) — this view is **not defined in schema.sql**. It only exists in [deploy_analytics_views.cjs L123-131](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/deploy_analytics_views.cjs#L123-L131) which must be run separately. If only schema.sql is executed, this route will fail.
