# CLUS: Classroom Utilization System

**CLUS** is a comprehensive, SaaS-inspired web application designed to optimize and manage classroom and laboratory allocations for educational institutions. Born from a Database Management Systems (DBMS) project, it leverages advanced SQL logic to provide real-time insights, prevent scheduling conflicts, and maximize infrastructure usage.

---

## 🏗️ Architecture

The system follows a classic modern, decoupled client-server architecture:

### Frontend (Client-Side)
- **Framework:** React + TypeScript (bootstrapped with Vite).
- **Styling:** Tailwind CSS with a custom design system focusing on glassmorphism, dynamic gradients, and smooth micro-animations.
- **Routing:** React Router v7 protecting internal routes.
- **State Management:** React Context API for global authentication state (`AuthContext`) and local component state.
- **Icons:** `lucide-react` for scalable SVG iconography.

### Backend (Server-Side)
- **Framework:** Node.js + Express.
- **Database:** MySQL.
- **Authentication:** `bcryptjs` for password hashing, with secure email/password validation endpoints.
- **Extensibility:** RESTful API returning structured JSON.

### Database Layer (The Core Engine)
CLUS is heavily reliant on robust database constraints and logic rather than performing all calculations in the application layer. The MySQL database utilizes:
- **Views:** To denormalize and calculate complex metrics (e.g., Utilization Percentages, Department Course Loads).
- **Functions:** Stored Functions to dynamically compute live utilization rates (`get_utilization_percent`).
- **Procedures & Cursors:** To loop through and evaluate "Trapped Capacity" (rooms that are mostly full but have unusable leftover seats).
- **Triggers:** A `BEFORE INSERT` trigger (`CheckRoomCapacityAndConflicts`) to actively block double-booking or over-allocating students into small rooms.

---

## ✨ Features (Till Date)

### 1. Secure Authentication Flow
- **Floating Auth Screen:** A premium, split-layout authentication page featuring scattered contextual review cards, smooth CSS `max-height` transitions, and social sign-in UI placeholders.
- **Password Security:** Server-side password hashing integrated with local SQL storage.
- **Protected Routing:** Validated session flow preventing unauthorized access to the application dashboard.

### 2. Live Dashboard & Landing Page
- **Landing Page:** A dynamic, public-facing marketing page with hero gradients, 3D animated badges, and direct call-to-actions.
- **Dashboard Summary:** The entry point for authenticated users, displaying top-level statistics (Total Rooms, Schedules, Free Rooms).
- **Utilization Tracking:** Dynamic progress bars visualizing exactly how saturated a room currently is based on live SQL counts.

### 3. Room Management Directory
- **Advanced Filtering:** Users can filter the entire infrastructure by Name, Type (Classroom, Lab, Lecture Hall), and Minimum/Maximum capacity limits.
- **Completely Free Highlight:** Uses an SQL `EXCEPT` constraint to instantly find rooms that have **zero** active schedules associated with them.

### 4. Smart Scheduling System
- **Schedule Creation:** A user interface to safely allocate Batches and Courses to Rooms and Time Slots. If the allocation crashes into a Trigger constraint (e.g., Room capacity exceeded), the exact SQL error is presented elegantly to the user.
- **Schedule Viewing:** A master grid of all allocations, filterable by Day and Course search queries.
- **Orphaned Class Detection:** By toggling an advanced view, the system utilizes a `LEFT JOIN ... WHERE IS NULL` query to surface Courses that have not yet been assigned a Room/Time.
- **Empty Slot Injection:** Toggles a `RIGHT JOIN` to forcibly inject and visualize empty periods into the master schedule view.

### 5. Advanced Data Analytics Insights
The analytics tab directly exposes the power of the backend DBMS:
- **Aggregate Course Load:** Summarizes which departments carry the heaviest physical infrastructure load.
- **Room Saturation Risk:** Uses a Correlated `MAX` Subquery to flag specific rooms operating near their absolute breaking point (customizable threshold).
- **Infrastructure Averages:** Groups and averages the utilization slots mathematically separated by Category (Labs vs. Lecture Halls).
- **Trigger Diagnostics:** A bespoke diagnostic panel revealing exactly *why* the database blocked the last allocation attempt (e.g., showing the specific offset overflow amount).
- **Trapped Capacity:** A unique metric calculated via SQL cursors showing the total number of "wasted" physical seats inside essentially full rooms.

---

CLUS marries a state-of-the-art Frontend aesthetic with deep, structurally enforced database rules, resulting in a highly reliable and professional scheduling optimization engine.
