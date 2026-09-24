# Sprint 1 — Real Auth for a Single-Department Pilot

## Overview

Convert the prototype client-side authentication into a secure, server-side JWT authentication system with Role-Based Access Control (RBAC) supporting two roles:
1. **`coordinator`**: Full administrative access (create/delete rooms, batches, schedules; provision other users).
2. **`viewer`**: Read-only access (view master schedule, room directories, batches, utilization reports, and analytics).

Public self-registration (`/api/auth/signup`) will be removed and replaced with coordinator-only user provisioning (`POST /api/users`).

---

## User Review Required

> [!IMPORTANT]
> **Default Seed Accounts:**
> To enable immediate testing after `npm run db:reset`, the seed data will include two initial accounts:
> - **Coordinator:** `coordinator@college.edu` / `Coordinator@123` (`role: 'coordinator'`)
> - **Viewer:** `viewer@college.edu` / `Viewer@123` (`role: 'viewer'`)
>
> Passwords will be securely hashed with `bcryptjs` (salt rounds: 10) in `seed.sql`.

> [!IMPORTANT]
> **Public Signup Removal:**
> As specified in `CLUS_development_spec.md`, open self-registration will be completely removed. The `/auth` page will become a dedicated sign-in screen. Department staff accounts are created directly by coordinators from within the dashboard.

---

## Proposed Changes

### 1. Database Schema & Seed Data

#### [MODIFY] [database/schema.sql](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/database/schema.sql)
- Update `users` table definition to include `role`:
  ```sql
  CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('coordinator', 'viewer')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

#### [MODIFY] [database/seed.sql](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/database/seed.sql)
- Seed initial coordinator (`coordinator@college.edu`) and viewer (`viewer@college.edu`) accounts with valid pre-hashed bcrypt strings.

---

### 2. Backend & Authentication Middleware

#### [MODIFY] [server/package.json](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/package.json)
- Add `jsonwebtoken` dependency (`^9.0.2`).

#### [MODIFY] [server/.env.example](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/.env.example)
- Add `JWT_SECRET=your_jwt_secret_key_here` configuration variable.

#### [MODIFY] [server/index.js](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/index.js)
- Implement `authenticateToken` middleware:
  - Validates `Authorization: Bearer <token>`.
  - Attaches decoded payload `{ id, name, email, role }` to `req.user`.
  - Returns `401 Unauthorized` if token is missing or invalid.
- Implement `requireCoordinator` middleware:
  - Enforces `req.user.role === 'coordinator'`.
  - Returns `403 Forbidden` if user is a `viewer`.
- Route protection matrix:
  - **Public:** `POST /api/auth/signin`
  - **Authenticated (Coordinator & Viewer):** All `GET` routes (`/api/rooms`, `/api/schedules`, `/api/batches`, `/api/courses`, `/api/timeslots`, `/api/reports/*`, `/api/analytics/*`, `/api/advanced-analytics/*`, `GET /api/users/me`)
  - **Coordinator-Only:** All mutating routes (`POST /api/rooms`, `DELETE /api/rooms/*`, `POST /api/batches`, `DELETE /api/batches/*`, `POST /api/schedules`, `DELETE /api/schedules/*`, `POST /api/users`, `GET /api/users`)
- Remove `POST /api/auth/signup`.
- Add `POST /api/users` (provision new coordinator/viewer, coordinator-only).
- Add `GET /api/users` (list provisioned users, coordinator-only).

---

### 3. Frontend Integration

#### [MODIFY] [src/lib/api.ts](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/lib/api.ts)
- Implement `authFetch(url, options)` helper that automatically includes `Authorization: Bearer <token>` from `localStorage` (`clus_token`).
- Update all API calls to route through `authFetch`.
- Add `provisionUser({ name, email, password, role })` and `fetchUsers()` API functions.
- Remove `registerUser` function.

#### [MODIFY] [src/contexts/AuthContext.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/contexts/AuthContext.tsx)
- Update `User` interface to include `role: 'coordinator' | 'viewer'`.
- Store JWT in `localStorage` as `clus_token`.
- On login, store both `user` and `token`.
- On logout, clear both `clus_user` and `clus_token`.

#### [MODIFY] [src/components/auth/AuthPage.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/auth/AuthPage.tsx)
- Remove the "Sign Up" tab switch and sign-up form logic.
- Render a clean, single-purpose Sign In form for department staff with email and password fields.

#### [MODIFY] [src/components/DashboardLayout.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/DashboardLayout.tsx)
- Display the user's role badge (`Coordinator` in indigo/blue, `Viewer` in gray) next to user profile.
- If user is a `coordinator`, provide access to a user management modal/section to provision and view staff accounts.

#### [MODIFY] [src/components/RoomList.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/RoomList.tsx), [src/components/BatchList.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/BatchList.tsx), [src/components/ScheduleView.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/ScheduleView.tsx)
- Check `user?.role`. If `role === 'viewer'`, hide or disable the "Add New" and "Delete" actions and display a non-intrusive read-only indicator.

---

## Verification Plan

### Automated / Scripted Tests
1. `npm run db:reset` to apply new schema with `role` column and seed accounts.
2. Run automated test script (`test_auth_rbac.js`) verifying:
   - Unauthenticated requests to `/api/rooms`, `/api/schedules`, `/api/analytics/*` receive `401 Unauthorized`.
   - Public signup `POST /api/auth/signup` returns `404 Not Found`.
   - Viewer sign-in receives token with `role: 'viewer'`.
   - Viewer can successfully `GET /api/schedules` and `GET /api/analytics/*`.
   - Viewer attempting `POST /api/rooms` or `DELETE /api/schedules/1` receives `403 Forbidden`.
   - Coordinator sign-in receives token with `role: 'coordinator'`.
   - Coordinator can provision a new viewer via `POST /api/users`.
   - Coordinator can create and delete rooms/schedules (`200`/`201`).

### Browser Verification
1. Open `http://localhost:5173/auth` — verify clean Sign In layout without public signup tab.
2. Sign in as `viewer@college.edu` (`Viewer@123`):
   - Verify role badge shows "Viewer".
   - Verify room list, schedules, and dashboard are readable.
   - Verify "Add Room", "Add Batch", "Add Schedule" and delete buttons are hidden/disabled.
3. Sign in as `coordinator@college.edu` (`Coordinator@123`):
   - Verify role badge shows "Coordinator".
   - Verify user provisioning UI allows creating a new staff account.
   - Verify room creation and schedule allocation work smoothly.
