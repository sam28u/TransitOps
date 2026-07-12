# 🚚 TransitOps — Smart Transport Operations Platform

[![Hackathon Edition](https://img.shields.io/badge/Hackathon%20Edition-8--Hour%20Challenge-amber?style=for-the-badge)](https://github.com)
[![Stack](https://img.shields.io/badge/Stack-React%2019%20+%20TypeScript%20+%20Vite-blue?style=for-the-badge)](https://vitejs.dev)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20+%20Express%20+%20REST-green?style=for-the-badge)](https://expressjs.com)
[![UI](https://img.shields.io/badge/UI-Vanilla%20CSS%20Glassmorphism-indigo?style=for-the-badge)](#)
[![RBAC Enforced](https://img.shields.io/badge/RBAC-4%20Personas%20Enforced-red?style=for-the-badge)](#)

> **Digitizing Vehicle, Driver, Dispatch, Maintenance, and Expense Management while Enforcing Strict Business Rules & Providing Real-Time Operational Insights.**

---

## 📖 1. Business Context & Executive Summary

Many logistics companies still rely on disconnected spreadsheets and manual logbooks to manage their transport operations. This leads to **scheduling conflicts, underutilized vehicles, missed workshop maintenance, expired driver licenses, inaccurate expense tracking, and zero financial visibility**.

**TransitOps** is an end-to-end centralized transport operations command center designed to solve these exact operational bottlenecks. Built specifically for high-velocity logistics organizations, it digitizes the complete lifecycle of fleet operations while executing a **zero-compromise automated business rules engine** on both the frontend and REST API backend.

---

## 👥 2. Target Users & Role-Based Access Control (RBAC)

TransitOps enforces strict security and UI scoping tailored to four distinct personas. Access scopes can be dynamically modified in real-time using the **Settings & RBAC Matrix** tab inside the platform.

| Role Profile | Default Credentials | Scope & Capabilities | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **👑 Fleet Manager** *(Super Admin)* | **Email:** `raven.k@transitops.in`<br>**Pass:** `password123` | **Full Read / Write / Delete** across all modules | Oversees total fleet asset lifecycle, acquisition costs, workshop lockouts, and system-wide RBAC matrix configuration. |
| **🚚 Dispatcher** *(Operations)* | **Email:** `dispatch@transitops.in`<br>**Pass:** `password123` | **Trips & Drivers** *(Create/Edit)*<br>**Fleet** *(View Only)* | Creates trips, assigns vehicles and drivers, checks live load capacities, and monitors dispatch telemetry. |
| **🛡️ Safety Officer** *(Compliance)* | **Email:** `compliance@transitops.in`<br>**Pass:** `password123` | **Drivers & Maintenance** *(Create/Edit)*<br>**Trips** *(View Only)* | Enforces license category compliance, monitors driver safety scores (`0-100`), audits license expiration dates, and logs routine safety maintenance. |
| **📈 Financial Analyst** *(Accounting)* | **Email:** `finance@transitops.in`<br>**Pass:** `password123` | **Fuel, Expenses & Analytics** *(Full Access)* | Logs fuel refills, repair receipts, calculates live profit margins, cost per kilometer, and monitors exact ROI formulas. |

---

## ⚡ 3. Automated Business Rules Engine (`Zero Violations Guaranteed`)

TransitOps eliminates human error by enforcing strict automated validation before any operational transition can occur on the platform:

### 🚫 Rule 1: Vehicle Load Capacity Enforcement (`CARGO_OVERLOAD`)
Before a trip can be created or dispatched, the system verifies that the planned cargo weight does not exceed the vehicle’s rated capacity:
$$\text{Cargo Weight (kg)} \le \text{Vehicle Max Load Capacity (kg)}$$
If exceeded, dispatch is instantly blocked both on the client UI and via HTTP `400 Bad Request` on the backend (`Rule Violated: CARGO_OVERLOAD`).

### 🪪 Rule 2: Driver License & Safety Compliance (`LICENSE_EXPIRED`)
Before a driver can be assigned to a trip, the engine checks their compliance status:
- Driver must have status **`Available`** (cannot be `Off Duty`, `On Trip`, or `Suspended`).
- **License Expiry Check:** The driver’s license expiry date (`licenseExpiryDate`) must be strictly greater than or equal to today (`new Date()`). If expired, assignment is blocked (`Rule Violated: LICENSE_EXPIRED`).

### 🔧 Rule 3: Automated Workshop Maintenance Lockout (`VEHICLE_UNAVAILABLE`)
When a vehicle requires service:
1. Creating a maintenance order (`In Progress` or `Scheduled`) automatically switches the vehicle status from `Available` to **`In Shop`**.
2. **Dispatch Lockout:** Any attempt to dispatch an `In Shop` vehicle is automatically blocked (`Rule Violated: VEHICLE_UNAVAILABLE`).
3. **Auto Restoration:** Closing/completing the service order (`PUT /api/maintenance/:id/close`) automatically checks if all active maintenance is cleared, restoring the asset to **`Available`**.

### 🔄 Rule 4: Multi-Entity Telemetry & Status Sync
When a trip transitions lifecycle stages, all linked assets synchronize automatically:
- **On Dispatch (`Dispatched`)**: Both assigned Vehicle and Driver statuses switch from `Available` to **`On Trip`**.
- **On Trip Completion (`Completed`)**:
  - Vehicle odometer updates automatically: $\text{New Odometer} = \max(\text{Current}, \text{Final Odometer})$.
  - Revenue generated is calculated and credited to the vehicle: $\text{Revenue} = (\text{Weight} \times 0.12) + (\text{Distance} \times 2.5)$.
  - Fuel consumed (`liters`) during the trip is **automatically logged** as a new entry in the Fuel & Expense registry (`fuelLogs`).
  - Both Vehicle and Driver statuses release back to **`Available`**.

---

## 📊 4. Operational Insights & Financial Formulas (`GET /api/analytics/summary`)

The platform calculates live, audit-ready operational KPIs across all active assets:

1. **Exact Return on Investment (ROI) Formula:**
   $$\text{ROI (\%)} = \left( \frac{\text{Total Fleet Revenue} - \text{Total Operational Expenses}}{\text{Total Operational Expenses}} \right) \times 100$$
2. **Net Profit:** $\text{Total Revenue} - (\text{Fuel Cost} + \text{Maintenance Cost} + \text{Other Expenses})$
3. **Fleet Utilization Rate:** $\left( \frac{\text{Vehicles On Trip}}{\text{Total Active Fleet Count}} \right) \times 100$
4. **Fuel Efficiency Ratio:** $\frac{\text{Total Completed Trip Distance (km)}}{\text{Total Fuel Consumed (L)}}$
5. **Cost Per Kilometer:** $\frac{\text{Total Operational Expenses (\$)}}{\text{Total Completed Trip Distance (km)}}$

---

## 🏗️ 5. Technical Stack & Modular Architecture

```text
TransitOps/
├── src/                            # React 19 + TypeScript Frontend
│   ├── components/
│   │   ├── Login.tsx               # Wireframe 0 Split-screen RBAC authentication & error simulation
│   │   ├── DashboardView.tsx       # Live KPI widgets, operational charts, and alerts grid
│   │   ├── FleetRegistryView.tsx   # Vehicle registry CRUD with capacity & status filters
│   │   ├── DriverPoolView.tsx      # Driver onboarding, safety scores, and license compliance verification
│   │   ├── TripDispatcherView.tsx  # 4-stage lifecycle visual stepper & Section 5 automated workflow harness
│   │   ├── MaintenanceLogView.tsx  # Workshop maintenance tracking with auto lockout triggers
│   │   └── SettingsView.tsx        # Live RBAC permission matrix configuration
│   ├── context/
│   │   └── TransitContext.tsx      # Real-time REST API sync engine with resilient offline fallback
│   └── index.css                   # Custom Linear/Stripe dark mode glassmorphism design tokens
│
└── server/                         # Node.js + Express + TypeScript Backend
    ├── index.ts                    # REST API entrypoint, CORS, and request telemetry logging (Port 3001)
    ├── db.ts                       # Atomic file-backed JSON persistent storage engine
    ├── middleware/
    │   └── rbac.ts                 # Security middleware enforcing persona permissions (`X-User-Role`)
    └── routes/
        ├── auth.ts                 # Authentication, session issuance, & demo database reset (`/api/auth`)
        ├── vehicles.ts             # Fleet asset CRUD (`/api/vehicles`)
        ├── drivers.ts              # Driver pool compliance checking (`/api/drivers`)
        ├── trips.ts                # Core business rules validation engine (`/api/trips`)
        ├── maintenance.ts          # Automated workshop lockout controller (`/api/maintenance`)
        ├── expenses.ts             # Fuel refill & expense logging (`/api/expenses`)
        ├── analytics.ts            # Live ROI, profitability & efficiency formula runner (`/api/analytics`)
        └── rbac.ts                 # Dynamic role security matrix controller (`/api/rbac`)
```

---

## 🚀 6. Quick Start & Installation Guide (`Zero External Setup`)

TransitOps requires **no external database installations** (no Docker, no local PostgreSQL needed). The backend runs its own atomic file-backed JSON database (`server/data/transitops.db.json`), making evaluation instant and guaranteed across any environment.

### Prerequisites
- **Node.js** (`v18.0.0` or higher)
- **npm** (`v9.0.0` or higher)

### Step 1: Clone & Install Dependencies
Open your terminal inside the project directory:
```bash
npm install
```

### Step 2: Run Full-Stack Concurrently (Recommended)
Launch both the **Node/Express Backend (`Port 3001`)** and **Vite Frontend (`Port 5173/5174`)** simultaneously:
```bash
npm run dev:all
```
- 🌐 **Frontend Command Center:** Open `http://localhost:5174/` *(or `http://localhost:5173/` depending on your active port)*
- 🔗 **Backend REST Health Check:** Open `http://localhost:3001/api/health`

### Alternative: Run Frontend and Backend Separately
If you prefer separate terminal tabs:
```bash
# Terminal 1: Start Backend REST Server (Port 3001)
npm run server

# Terminal 2: Start Frontend Dev Server
npm run dev
```

### Step 3: Production Build & Check
Verify TypeScript type-checking and build the optimized production bundle:
```bash
npm run build
```

---

## 🧪 7. Interactive Verification Harness (Section 5 Testing)

For rapid evaluation by hackathon judges, TransitOps includes an embedded **Section 5 Interactive Workflow Verification Harness** inside the **`Trip Dispatcher`** tab.

1. Navigate to **Trip Dispatcher** in the sidebar.
2. Locate the **Visual Stepper Lifecycle & Workflow Harness** card at the top.
3. Click the glowing button: **`⚡ Run All 9 Steps Automatically`**.
4. The system will sequentially execute across both the Frontend and Backend API:
   - **Step 1:** Register Vehicle `VAN-05` (500 kg capacity).
   - **Step 2:** Register Driver `Alex Rivera` (Valid license DL-998822).
   - **Step 3 & 4:** Create Trip (`Cargo 450 kg <= 500 kg capacity -> ALLOWED`).
   - **Step 5:** Verify automatic telemetry sync (`VAN-05` and `Alex Rivera` switch to `'On Trip'`).
   - **Step 6 & 7:** Complete trip -> odometer incremented (+120 km), revenue credited ($354), fuel consumed automatically logged (18L), and assets restored to `'Available'`.
   - **Step 8:** Log Maintenance ticket ($320) -> verify vehicle automatically switches to `'In Shop'` and locked from dispatch!
   - **Step 9:** Verify Analytics financial calculations, Net Profit, and ROI percentage updated live!

You can also click the individual stage pills (`[Step 1]`, `[Step 2]`, `[Step 3-4]`, etc.) to run and inspect each rule step-by-step!

---

## 🌟 License & Credits

Built with ❤️ by the **TransitOps Engineering Team** for the **Smart Transport Operations Platform 8-Hour Hackathon Challenge (2026)**.
