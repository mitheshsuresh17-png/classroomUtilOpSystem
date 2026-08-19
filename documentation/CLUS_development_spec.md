# CLUS Development Specification — For Coding Agent

**Purpose of this document:** You are being handed an existing codebase (`classroomUtilOpSystem/`) that started as a college DBMS course project and is being converted into a real tool for a college's administrative department. This document is your source of truth for scope, priorities, and constraints. A full code audit has already been performed — do not re-discover facts listed here as "verified," trust them and act on them. Where this document says "confirm before proceeding," stop and ask rather than assume.

---

## 1. Project Context (read this first)

- **What CLUS is:** a room/lab scheduling and utilization-analytics system for a college.
- **Who uses it:** department administrative staff (a coordinator role, possibly a read-only faculty role). **There is no student-facing functionality, no student accounts, and no student personalization.** If any task below seems to imply a student-facing feature, stop and flag it — do not build it.
- **Current deployment stage:** pre-pilot. The target is a **single-department pilot**, not a college-wide rollout. Do not over-build multi-department permission complexity beyond what Sprint 1 specifies.
- **Hosting target:** not yet decided (self-hosted on college infra vs. externally hosted). Do not make hosting-specific assumptions (e.g., don't hardcode a specific cloud provider's SDK, don't assume a specific reverse proxy). Keep infra-agnostic until Sprint 5.
- **Scale target:** unknown — the college has not yet provided real room/timeslot counts. Do not hardcode limits based on the current seed data (4 rooms). Build for "small-to-medium," not for huge scale, but don't paginate/optimize prematurely either.

---

## 2. Non-Negotiable Design Constraints

1. **Keep validation logic in the database, not just the application layer.** The existing `trg_prevent_booking_conflict` trigger (double-booking + capacity checks) exists specifically to avoid a TOCTOU race condition between concurrent requests. Do not replace it with application-level-only validation. You may *add* clearer application-level pre-checks for better UX, but the DB-level trigger must remain the source of truth.
2. **Do not introduce student accounts, student login, or student personalization** in any sprint below.
3. **Do not silently change ON DELETE CASCADE behavior** without flagging it — cascading deletes are currently used throughout and changing them affects data integrity assumptions elsewhere.
4. **Do not commit secrets.** `server/.env` currently contains a real DB password and is present in the working tree despite `.gitignore` — this must be rotated and scrubbed from git history as the very first task, before any other work.

---

## 3. Verified Current State (from code audit, do not re-verify unless something seems off)

### Confirmed broken (fix first, Sprint 0)
| # | Issue | Location |
|---|-------|----------|
| 1 | `.env` with real DB password committed to working tree | `server/.env` |
| 2 | `room_id` referenced but doesn't exist (PK is `room_number`) | `server/index.js` — `/api/analytics/room-saturation` (~L269), `/api/analytics/infrastructure-sorting` (~L317); also `server/restore_views.js` (~L21, L28) and `test_empty.js` (~L11, L13) |
| 3 | `ORDER BY trapped_capacity` — view outputs `wasted_seats`, not `trapped_capacity` | `server/index.js` `/api/advanced-analytics/wasted-capacity` (~L368) |
| 4 | `ORDER BY fill_percentage` — view outputs `mismatch_severity`/`penalty_score`, not `fill_percentage` | `server/index.js` `/api/advanced-analytics/mismatch` (~L395) |
| 5 | `ORDER BY day_of_week` — `UnifiedUtilizationView` doesn't output that column | `server/index.js` `/api/advanced-analytics/unified-utilization` (~L359) |
| 6 | `loadRooms()` called but undefined — actual function is `loadData()` | `src/components/RoomList.tsx` (~L42, L53) — breaks room create/delete in the UI |
| 7 | `UtilizationImbalance` view only exists in `server/deploy_analytics_views.cjs`, not in `database/schema.sql` — running the documented setup steps alone leaves this route broken | `server/index.js` `/api/advanced-analytics/imbalance` (~L386) |
| 8 | Connection leak: `connection.release()` only called on success path | `server/index.js` `/api/analytics/trapped-capacity` (~L328–349) |
| 9 | Fabricated content: fake university testimonials, fake "500+ Classrooms Managed" stat, SaaS-style copy ("Start for Free") that misrepresents this as a live product with existing customers | `src/components/auth/AuthPage.tsx` (~L6-12), `src/components/LandingPage.tsx` (~L36, L77) |
| 10 | Seed/schema resource name mismatch: schema inserts `'AC'`, seed inserts `'Air Conditioner'`; seed also adds `'Fan'` which schema doesn't know about | `database/schema.sql` (~L81) vs `database/seed.sql` (~L28, L30) |

### Confirmed present, deferred to later sprints
- No role/permission system at all — any signed-up user has full access to everything
- Auth is enforced client-side only (`localStorage` check in `ProtectedRoute`) — **no server route verifies authentication**
- Open self-registration — anyone can create an account
- No audit trail — no `created_by`/`updated_at`/`modified_by` anywhere
- No Course or Department management UI — only creatable via raw SQL
- No `PUT`/`PATCH` routes anywhere — editing requires delete + recreate
- No `BEFORE UPDATE` trigger — capacity/conflict validity isn't re-checked on update
- Analytics tab is fully built but **commented out** in `src/components/DashboardLayout.tsx` (~L19), and even if re-enabled, references ~10 field names that don't match actual view column names (see table below)
- `unscheduledData` is fetched in `ScheduleView.tsx` but never rendered
- CORS is wide open (`cors()` with no config) — `server/index.js` (~L17)
- No rate limiting anywhere
- No server-side input validation beyond DB constraints

### AnalyticsView field-name mismatches (fix as part of re-enabling the tab)
| Component reference (`src/components/AnalyticsView.tsx`) | Actual view column |
|---|---|
| `signal.description` | `message` (in `ActionableAnalyticsSignals`) |
| `m.mismatch_status` | `mismatch_severity` (in `CapacityMismatchAnalysis`) |
| `m.room_capacity` | `room_cap` |
| `m.fill_percentage` | not present in view — remove or compute |
| `waste.trapped_capacity` | `wasted_seats` (in `WastedCapacityView`) |
| `waste.course_name` | not present in view — remove or join in |
| `stress.stress_ratio_percent` | `network_congestion_percent` (in `TemporalStressIndex`) |
| `stress.end_time` | not present in view — remove or add to view SELECT |
| `stress.active_rooms` | `concurrent_classes` |

---

## 4. Sprint Plan

### Sprint 0 — Stop the bleeding
**Goal:** Nothing here changes behavior or scope, it just makes the existing app correct and safe to keep working on.
- [ ] Rotate the DB password. Remove `.env` from git history (not just `.gitignore` going forward — actually purge it, e.g. `git filter-repo` or equivalent). Confirm `server/.env` is genuinely untracked afterward.
- [ ] Fix all 4 `room_id` references (items #2 above) to use `room_number`.
- [ ] Fix all 3 broken `ORDER BY` clauses (items #3, #4, #5) to reference real column names.
- [ ] Fix `loadRooms()` → `loadData()` in `RoomList.tsx`.
- [ ] Move `UtilizationImbalance` (and any other view/trigger currently only in a standalone `.cjs` script) into `database/schema.sql` itself, so a single `SOURCE schema.sql` produces a fully working database. Standalone deploy scripts should become redundant, not required.
- [ ] Remove fabricated testimonials/stats from `AuthPage.tsx` and `LandingPage.tsx`. Replace with honest placeholder copy (e.g., "Built for [College Name]" or generic descriptive copy) — do not invent new fake numbers.
- [ ] Reconcile the resource seed/schema mismatch — decide one canonical resource list (`'AC'` vs `'Air Conditioner'`, whether `'Fan'` is included) and make schema.sql and seed.sql agree.

**Acceptance criteria:** Fresh `SOURCE schema.sql; SOURCE seed.sql;` produces a fully working app with zero broken routes when manually exercised through the UI (rooms, batches, schedules, all analytics endpoints). No secrets in the repo.

---

### Sprint 1 — Real auth for a single-department pilot
**Goal:** Two roles only — do not build more than this without explicit sign-off.
- [ ] Add a `role` column to `users` (values: `coordinator`, `viewer`).
- [ ] Move authentication server-side: implement session or JWT-based auth, with middleware enforcing it on every route that mutates data. `GET` routes for analytics can remain viewer-accessible; all `POST`/`DELETE`/`PUT` routes require `coordinator` role.
- [ ] Remove open self-registration. Replace `/api/auth/signup` with an admin-provisioning flow (a coordinator creates accounts for other coordinators/viewers — do not expose public signup).
- [ ] **Before implementing:** confirm whether the pilot department has an existing identity system (Google Workspace / LDAP / SSO). If yes, prefer integrating with it over building a fresh password system. If unknown, build the standalone JWT/session system but keep the user-provisioning logic decoupled so SSO can be swapped in later without a schema rewrite.

**Acceptance criteria:** No route is callable by an unauthenticated request. A `viewer` account cannot create/edit/delete anything. Signup is not publicly reachable.

---

### Sprint 2 — Data integrity for real use
- [ ] Add `created_by`, `updated_at` columns to `Course_Schedule` (minimum), populate on write.
- [ ] Add a `BEFORE UPDATE` trigger mirroring the existing `BEFORE INSERT` logic on `Course_Schedule`-adjacent tables — specifically, re-check capacity if `Batch.student_count` is updated or `Room.capacity` is updated, for any existing schedule that would become invalid.
- [ ] Replace blind `ON DELETE CASCADE` on `Department`, `Room`, and `Batch` with either (a) a confirmation step surfaced in the UI showing what will be deleted, or (b) soft-delete (`deleted_at` column, filter in queries) — pick (a) first unless told otherwise, it's less invasive.
- [ ] Build Course and Department management UI (list/create/delete at minimum) — currently only possible via raw SQL.

**Acceptance criteria:** Editing a batch's student count or a room's capacity that would invalidate an existing schedule is rejected with a clear error. Deleting a department shows what will be affected before it happens. Courses and Departments are manageable entirely from the UI.

---

### Sprint 3 — Close CRUD gaps + fix Analytics
- [ ] Add `PUT`/`PATCH` routes for Room, Batch, and Course_Schedule (edit in place instead of delete+recreate).
- [ ] Re-enable the Analytics tab in `DashboardLayout.tsx` and fix all field-name mismatches listed in Section 3's table.
- [ ] Render the `unscheduledData` state that's already being fetched in `ScheduleView.tsx` but currently unused.

**Acceptance criteria:** Analytics tab is visible, reachable, and every card renders real (non-undefined) data. Rooms/batches/schedules can be edited without deleting first.

---

### Sprint 4 — Pilot hardening
- [ ] Restrict CORS to the actual deployment origin(s) — no more default-open `cors()`.
- [ ] Add rate limiting at minimum on `/api/auth/*` routes.
- [ ] Add server-side input validation (length/format/type) ahead of DB constraints, with clear error messages surfaced to the coordinator — don't just pass raw SQL trigger errors to the frontend.
- [ ] Fix the connection leak on the `trapped-capacity` route: wrap in `try/finally` so `connection.release()` always runs.

**Acceptance criteria:** Repeated failed logins are throttled. Malformed input (e.g., negative capacity, empty room number) gets a clear 400 error before ever reaching MySQL. Connection pool doesn't leak under repeated errors (verify by forcing an error path and checking pool size after).

---

### Sprint 5 — Pilot go-live
**Do not start this sprint until hosting is decided (flag to the human, don't assume).**
- [ ] Set up the actual hosting environment (whichever was decided).
- [ ] Build a real backup/restore procedure — `reset_db.cjs` is destructive and not a substitute for backups.
- [ ] Once the pilot department provides real room/timeslot numbers, replace seed data with their actual data (or a realistic placeholder set at that scale) and sanity-check performance/UX at that scale.

**Acceptance criteria:** App is reachable at a real URL for the pilot department, with a documented backup/restore process and real (or realistically-scaled) seed data.

---

## 5. Guardrails — things to explicitly NOT do

- Do not add student accounts or any student-facing view.
- Do not build more than 2 roles in Sprint 1 without confirmation.
- Do not remove the DB-level trigger validation in favor of application-only checks.
- Do not assume a specific cloud provider or hosting setup before Sprint 5.
- Do not invent new marketing copy, statistics, or testimonials — real or fake — when cleaning up the landing page in Sprint 0. Use neutral, honest placeholder text.
- Do not silently change `ON DELETE CASCADE` behavior without surfacing the decision.

## 6. Things to flag back to the human rather than assume

- Whether the pilot department has an existing identity system (SSO/LDAP/Google Workspace) — needed before finalizing Sprint 1's auth approach.
- Real room/timeslot/schedule counts from the pilot department — needed before Sprint 5.
- Final hosting decision — needed before Sprint 5 starts.
- Whether `Course` and `Department` management (Sprint 2) should also be `coordinator`-only or if a broader "editor" role is wanted — currently scoped as coordinator-only by default.
