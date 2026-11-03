# Implementation Plan — Sprint 3: Close CRUD Gaps + Fix Analytics

## Goal Description
Implement Sprint 3 per [CLUS_development_spec.md](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/CLUS_development_spec.md):
1. Add in-place `PUT` update routes and UI modals for Rooms, Batches, and Schedules (editing records directly without delete+recreate).
2. Re-enable the Analytics tab in navigation and fix all 9 field-name mismatches in `AnalyticsView.tsx`.
3. Render `unscheduledData` (unscheduled courses list) in `ScheduleView.tsx`.

---

## User Review Required

> [!IMPORTANT]
> **Key Deliverables in Sprint 3:**
> 1. **In-Place Updates (`PUT` routes + UI modals)**:
>    - `PUT /api/rooms/:room_number`: Update room type and capacity in place. Database trigger `trg_check_room_capacity_update` protects against capacity reductions below scheduled batch sizes.
>    - `PUT /api/batches/:batch_id`: Update year, section, student count, and department. Trigger `trg_check_batch_size_update` protects against oversized batch assignments.
>    - `PUT /api/schedules/:schedule_id`: Update course, batch, room, and time slot. Trigger `trg_check_schedule_update` protects against room/batch collisions and capacity violations.
> 2. **Analytics Tab Restored & Field Mapping Fixed**:
>    - Add `Analytics` to navigation tabs in `DashboardLayout.tsx`.
>    - Fix all column mismatches in `AnalyticsView.tsx`:
>      - `signal.description` $\rightarrow$ `signal.message`
>      - `m.mismatch_status` $\rightarrow$ `m.mismatch_severity`
>      - `m.room_capacity` $\rightarrow$ `m.room_cap`
>      - `m.fill_percentage` $\rightarrow$ computed `(m.batch_size / m.room_cap) * 100`
>      - `waste.trapped_capacity` $\rightarrow$ `waste.wasted_seats`
>      - `waste.course_name` $\rightarrow$ dynamic label `Batch Section ${waste.batch_section}`
>      - `stress.stress_ratio_percent` $\rightarrow$ `stress.network_congestion_percent`
>      - `stress.end_time` $\rightarrow$ mapped correctly
>      - `stress.active_rooms` $\rightarrow$ `stress.concurrent_classes`
> 3. **Unscheduled Courses Feed**:
>    - Render `unscheduledData` in `ScheduleView.tsx` to alert staff of courses with 0 allocated slots.

---

## Proposed Changes

### 1. Database Views (`database/schema.sql`)

#### [MODIFY] [database/schema.sql](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/database/schema.sql)
- Include `ts.start_time` in `WastedCapacityView` and `ts.end_time` in `TemporalStressIndex` view SELECTs so analytics views have direct access to slot timings.

---

### 2. Backend API (`server/index.js`)

#### [MODIFY] [server/index.js](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/server/index.js)
- Add `PUT /api/rooms/:room_number` (Coordinator only)
- Add `PUT /api/batches/:batch_id` (Coordinator only)
- Add `PUT /api/schedules/:schedule_id` (Coordinator only)

---

### 3. Frontend API Client (`src/lib/api.ts`)

#### [MODIFY] [src/lib/api.ts](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/lib/api.ts)
- Add `updateRoom(roomNumber, data)`
- Add `updateBatch(batchId, data)`
- Add `updateSchedule(scheduleId, data)`

---

### 4. Frontend UI Components

#### [MODIFY] [src/components/AnalyticsView.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/AnalyticsView.tsx)
- Correct all field accessors to match SQL view column names.
- Ensure proper null-safe rendering.

#### [MODIFY] [src/components/DashboardLayout.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/DashboardLayout.tsx)
- Re-enable the `Analytics` tab in the navigation bar.

#### [MODIFY] [src/components/RoomList.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/RoomList.tsx)
- Add "Edit" button (pencil icon) for coordinators opening an edit room modal.

#### [MODIFY] [src/components/BatchList.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/BatchList.tsx)
- Add "Edit" button for coordinators opening an edit batch modal.

#### [MODIFY] [src/components/ScheduleView.tsx](file:///d:/Shahzaad/Projects/College/classroomUtilOpSystem/src/components/ScheduleView.tsx)
- Add "Edit" button for coordinators opening an edit schedule modal.
- Render the `unscheduledCourses` section displaying unallocated courses.

---

## Verification Plan

### Automated Tests (`test_sprint3.cjs`)
1. Test in-place `PUT /api/rooms/:room_number`:
   - Valid capacity update succeeds.
   - Reducing capacity below scheduled batch fails with trigger error.
   - Viewer attempting edit receives 403.
2. Test in-place `PUT /api/batches/:batch_id`:
   - Valid student count update succeeds.
   - Increasing size above scheduled room fails with trigger error.
   - Viewer attempting edit receives 403.
3. Test in-place `PUT /api/schedules/:schedule_id`:
   - Valid schedule update succeeds.
   - Updating to conflicting room/slot fails with trigger error.
   - Viewer attempting edit receives 403.
4. Verify all analytics endpoints return valid structured data matching expected fields.
5. Verify `GET /api/analytics/unscheduled-courses` returns courses needing allocation.

### Browser Verification (`http://localhost:5174`)
1. Click **Analytics** tab $\rightarrow$ verify all cards (System Grade, Signals, Capacity Mismatches, Trapped Capacity, Temporal Stress) render real values without `undefined` or layout errors.
2. In **Rooms**, edit a room capacity and confirm update reflects.
3. In **Batches**, edit a batch section and confirm update reflects.
4. In **Schedules**, verify the unscheduled courses alert and test editing a schedule in place.
