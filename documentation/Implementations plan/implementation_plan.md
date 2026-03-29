# Advanced Utilization Intelligence Engine Plan

This plan details the evolution of CLUS from a basic scheduling display into a high-impact utilization analytics engine using a strict SQL-first design. We will introduce several advanced Views and Functions to compute multi-dimensional inefficiencies without altering the existing core table structure.

## User Review Required

> [!IMPORTANT]  
> All calculations (Wasted Capacity, Stress Indexes, Imbalance) will be performed **strictly within MySQL** using Views and Functions. The Node.js backend will simply serve these pre-calculated insights to the frontend. Ensure your MySQL version supports nested views and CTEs (Common Table Expressions) if required.

## Proposed Changes

### Database Layer Extensions (`database/6_advanced_analytics.sql`)

#### [NEW] `UnifiedUtilizationView`
Computes utilization across 3 axes per room per day:
*   **Time Utilization**: [(Active Hours / Total Operation Hours) * 100](file:///d:/Shahzaad/SRM/Projects/classroomUtilOpSystem/src/App.tsx#22-39)
*   **Seat Utilization**: [(Total Students Scheduled / Total Room Capacity) * 100](file:///d:/Shahzaad/SRM/Projects/classroomUtilOpSystem/src/App.tsx#22-39)

#### [NEW] `WastedCapacityView`
A comprehensive view computing all forms of waste for each schedule/room:
*   **Empty Time Waste**: Total unused slots during operating hours.
*   **Trapped Capacity**: `Room Capacity - Batch Size` for occupied slots.
*   Shows exactly *where* and *when* (Course, Department, Time) seats are wasted.

#### [NEW] `TemporalStressIndex`
Time-based profiling aggregating load by hour across the institution:
*   Computes `Stress Ratio = (Active Rooms / Total Rooms)` per hour (1-8).
*   Identifies Peak Congestion Windows and Underutilized Windows.

#### [NEW] `UtilizationImbalance`
Measures how unevenly infrastructure is used.
*   Computes variance / standard deviation of room utilization to flag overused vs. underused clusters.

#### [NEW] `CapacityMismatchAnalysis`
Systemic allocation inefficiency identifier:
*   Joins [Schedule](file:///d:/Shahzaad/SRM/Projects/classroomUtilOpSystem/src/components/ScheduleView.tsx#8-19), [Batch](file:///d:/Shahzaad/SRM/Projects/classroomUtilOpSystem/src/components/ScheduleView.tsx#21-22), and [Room](file:///d:/Shahzaad/SRM/Projects/classroomUtilOpSystem/src/components/ScheduleView.tsx#22-23).
*   Flags **Over-allocation** (Batch Size < 50% Room Capacity).
*   Flags **Under-allocation/Overcrowding** (Batch Size > Room Capacity).

#### [NEW] `SystemEfficiencyScore` function
A weighted SQL composite function returning 0-100 based on the averages from the views above, classified into 'Highly Efficient', 'Critical', etc.

#### [NEW] `ActionableAnalyticsSignals`
A master view that unions threshold breaches from the above views to output structured signals:
*   `UNDERUTILIZED_ROOM`
*   `OVERCROWDED_ROOM`
*   `HIGH_WASTE_ROOM`
*   `PEAK_CONGESTION`
*   `CAPACITY_MISMATCH`
*   Includes a calculated Severity Score (1-10) for sorting.

## Verification Plan
1.  **SQL Execution**: Execute the new SQL script (`6_advanced_analytics.sql`) in the MySQL database to ensure all views and functions compile successfully.
2.  **Mock Data Validation**: Query the `ActionableAnalyticsSignals` and `WastedCapacityView` against our existing mock data to verify that it correctly flags known mismatches and computes correct trapped capacity values.
