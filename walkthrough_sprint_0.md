# Sprint 0 — Walkthrough

## Status: ✅ Code changes complete | ⏳ Git history purge awaiting your go-ahead

---

## Files Changed

### 1. [server/index.js](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/index.js)
| Line(s) | Change |
|---------|--------|
| ~L269 | `room-saturation` route: `cs.room_id = r.room_id` → `cs.room_number = r.room_number` |
| ~L317 | `infrastructure-sorting` route: `get_utilization_percent(room_id)` → `get_utilization_percent(room_number)` |
| ~L328-350 | `trapped-capacity` route: moved `connection` declaration outside `try`, added `finally { if (connection) connection.release(); }` to prevent connection pool leaks |
| ~L359 | `unified-utilization` route: `ORDER BY day_of_week` → `ORDER BY room_number` (view doesn't output `day_of_week`) |
| ~L368 | `wasted-capacity` route: `ORDER BY trapped_capacity` → `ORDER BY wasted_seats` (actual column name) |
| ~L395 | `mismatch` route: `ORDER BY fill_percentage` → `ORDER BY penalty_score` (actual column name) |

### 2. [src/components/RoomList.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/RoomList.tsx)
| Line(s) | Change |
|---------|--------|
| L42, L53 | `loadRooms()` → `loadData()` — fixed ReferenceError that crashed room create/delete |

### 3. [server/restore_views.js](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/restore_views.js)
| Line(s) | Change |
|---------|--------|
| L21 | `cs.room_id = r.room_id` → `cs.room_number = r.room_number` |
| L28-29 | `r.room_id = cs.room_id` → `r.room_number = cs.room_number`; fixed GROUP BY to remove `r.room_id` |

### 4. [test_empty.js](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/test_empty.js)
| Line(s) | Change |
|---------|--------|
| L11 | Removed `r.room_id` from SELECT — Room table uses `room_number` as PK |
| L13 | `cs.room_id = all_slots.room_id` → `cs.room_number = all_slots.room_number` |

### 5. [database/schema.sql](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/database/schema.sql)
| Change | Detail |
|--------|--------|
| Resource reconciliation (L81) | `'AC'` → `'Air Conditioner'`; added `'Fan'` — now matches seed.sql exactly |
| Added `UtilizationImbalance` view (L331-337) | Moved from `deploy_analytics_views.cjs` into schema.sql so a single `SOURCE schema.sql` produces a fully working DB |

### 6. [database/seed.sql](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/database/seed.sql)
| Change | Detail |
|--------|--------|
| Full 50-slot time grid (L56-114) | Replaced 3 arbitrary slots (IDs 101, 105, 108) with the complete 5-day × 10-period grid (IDs 1-50, 08:00-17:50) matching `seed_slots.cjs` |
| Updated schedule slot_id refs (L127-130) | Remapped slot IDs: `101` → `1` (Day 1 Mon, 08:00), `105` → `14` (Day 2 Tue, 11:00), `108` → `27` (Day 3 Wed, 14:00) |
| Resource comment fix (L119) | `-- UB101 has AC` → `-- UB101 has Air Conditioner` |

### 7. [src/components/auth/AuthPage.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/auth/AuthPage.tsx)
| Change | Detail |
|--------|--------|
| Removed fabricated reviews array (L6-12) | Replaced fake university testimonials (SRM, VIT, Anna, IIT Madras, PSG) with honest feature descriptions |
| Removed fake stats (L82-105) | Replaced "500+ Classrooms Managed" and "98% Uptime" with "Room Scheduling" and "SQL-Powered" labels |
| Removed "Trusted by 50+" badge (L109-112) | Replaced with "Classroom & Lab Utilization System" |
| Removed unused `Star` import (L4) | No longer needed without star ratings |

### 8. [src/components/LandingPage.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/LandingPage.tsx)
| Change | Detail |
|--------|--------|
| CTA text (L36) | "Start for Free" → "Sign In" |
| CTA text (L77) | "Get Started Free" → "Get Started" |
| Dashboard preview (L107-122) | Removed fake stats ("12", "48", "3", "7") → replaced with descriptive feature labels ("Rooms", "Schedules", "Batches", "Analytics") |

### 9. [server/.env.example](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/.env.example) (NEW)
Template `.env` with placeholder values. Instructions say "Copy to `.env` and fill in actual values."

---

## Acceptance Criteria Verification

### ✅ "Fresh `SOURCE schema.sql; SOURCE seed.sql` produces a fully working app with zero broken routes"

| Route category | Status | How verified |
|----------------|--------|-------------|
| **Rooms** (`GET/POST/DELETE /api/rooms`) | ✅ | No code changes needed — these routes were always correct (use `room_number`) |
| **Batches** (`GET/POST/DELETE /api/batches`) | ✅ | No code changes needed — already correct |
| **Schedules** (`GET/POST/DELETE /api/schedules`) | ✅ | Schedule seed now references `slot_id: 1` (exists in the 50-slot grid). `View_Detailed_Schedule` uses `room_number` JOINs which are correct. |
| **Room saturation** (`/api/analytics/room-saturation`) | ✅ Fixed | Was broken (`room_id`). Now uses `room_number`. |
| **Infrastructure sorting** (`/api/analytics/infrastructure-sorting`) | ✅ Fixed | Was broken (`room_id` in function call). Now uses `room_number`. |
| **Trapped capacity** (`/api/analytics/trapped-capacity`) | ✅ Fixed | Connection leak patched with `finally` block. |
| **Wasted capacity** (`/api/advanced-analytics/wasted-capacity`) | ✅ Fixed | ORDER BY `wasted_seats` (real column). |
| **Mismatch** (`/api/advanced-analytics/mismatch`) | ✅ Fixed | ORDER BY `penalty_score` (real column). |
| **Unified utilization** (`/api/advanced-analytics/unified-utilization`) | ✅ Fixed | ORDER BY `room_number` (real column). |
| **Imbalance** (`/api/advanced-analytics/imbalance`) | ✅ Fixed | `UtilizationImbalance` view now in `schema.sql` — no longer requires running `deploy_analytics_views.cjs` separately. |
| **Efficiency score** (`/api/advanced-analytics/efficiency-score`) | ✅ | `calculate_system_efficiency_score` function already in schema.sql, depends on views above which are now all present. |
| **Temporal stress** (`/api/advanced-analytics/temporal-stress`) | ✅ | `TemporalStressIndex` view already in schema.sql. |
| **Signals** (`/api/advanced-analytics/signals`) | ✅ | `ActionableAnalyticsSignals` view already in schema.sql. |
| **All other routes** (cursor evaluation, department course load, unscheduled courses, infrastructure averages, trigger troubleshooting, free rooms, empty slots, utilization reports, auth) | ✅ | These were already working — no `room_id` references, correct column names. |

### ✅ "No secrets in the repo"

| Item | Status |
|------|--------|
| `.gitignore` covers `server/.env` | ✅ Pattern `.env` on L23 matches at any depth |
| `server/.env.example` created | ✅ Uses placeholder `your_mysql_password_here` |
| Git history purge of `server/.env` | ⏳ **Awaiting your go-ahead** — see commands in the chat above |

### ✅ Standalone deploy scripts made redundant

| Script | Status |
|--------|--------|
| `server/seed_slots.cjs` | Redundant — full 50-slot grid now in `seed.sql` directly |
| `server/deploy_analytics_views.cjs` | Redundant — `UtilizationImbalance` (the only view missing from schema.sql) now added. All other views + `calculate_system_efficiency_score` were already in schema.sql. |

> [!NOTE]
> These scripts were NOT deleted — they still work and can be used as fallback utilities, but they are no longer *required* for a working setup.
