# CareConnect – Pediatrician Online Consultation Platform 🩺👶

CareConnect is an end-to-end, full-stack pediatric telemedicine and online consultation platform designed to connect parents and legal guardians directly with verified pediatricians. Built with **React 18, Vite, TypeScript, Tailwind CSS, FastAPI, SQLAlchemy ORM, WebSockets, ReportLab, and PostgreSQL/SQLite**, CareConnect delivers a hospital-grade, secure digital clinic experience.

---

## 🌟 Key Capabilities & Features

### 1. 👨‍👩‍👧 Parent Module
- **Registration & Authentication**: JWT-based session security with Guardian Consent verification compliant with the Telemedicine Practice Guidelines and DPDP Act.
- **Multi-Child Health Profiles**: Manage profiles for multiple children under a single guardian account (DOB, calculated age, blood group, drug/food allergies, past medical conditions).
- **Appointment Scheduling**: Interactive calendar booking showing real-time doctor availability with automatic conflict removal and server-side double-booking prevention (HTTP 409).
- **Prescription Vault**: Instantly access and download digitally signed PDF prescriptions generated during pediatric consultations.
- **Medical Records**: Securely upload and store vaccination records, lab test reports, and imaging scans.

### 2. 🩺 Doctor Dashboard
- **Consultation Schedule**: Overview of today’s patient queue, start-times, chief medical complaints, and patient age.
- **Interactive Video Clinic**: Conduct secure, encrypted Jitsi Meet video consultations with live stopwatch duration tracking, fullscreen controls, and clinical summary drawer.
- **Digital Prescription Generator**: Formally issue prescriptions with dynamic medication rows (medicine name, form, pediatric dosage, frequency, duration, administration instructions) and automatic ReportLab PDF creation.
- **Availability Manager**: Configure working hours by day, slot duration (15/30/45 mins), break timings (e.g. 13:00 - 14:00), and block out dates for conferences or leave.

### 3. 💬 Real-Time Messaging & Notifications
- **WebSocket Chat**: Low-latency, one-to-one messaging between parent and pediatrician linked directly to the consultation.
- **Live Typing Indicators & Read Receipts**: Real-time typing status and message read confirmation.
- **Prescription In-Chat Cards**: Digital prescriptions are automatically rendered directly into the consultation chat thread with one-click PDF downloads.
- **In-App Real-time Notifications**: Instant alerts for appointment bookings, confirmations, doctor messages, and prescription generation.

### 4. 🛡️ Administrator & Security Oversight
- **Platform Analytics**: Interactive KPI metrics and Recharts visualizations for user distribution, appointments, and prescriptions.
- **Pediatrician Credential Verification**: Admin review of doctor registration licenses (MCI/NMC) with instant verification toggle.
- **Audit Logging**: Comprehensive security audit trail recording user logins, appointment bookings, and prescription creations with IP logging.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Axios, Lucide React, Recharts |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy ORM, Pydantic v2, Uvicorn |
| **Database** | PostgreSQL (Production / Docker) & SQLite (Zero-dependency local development) |
| **Migrations** | Alembic |
| **Real-time** | WebSockets (Chat & In-app Notifications) |
| **Video Calls** | Jitsi Meet Integration (Encrypted Consultation Rooms) |
| **PDF Generation** | ReportLab (Pediatric Letterhead, Rx Table, Telemedicine Legal Disclaimers) |
| **Security** | BCrypt password hashing, JWT Bearer tokens, Role-Based Access Control (RBAC) |

---

## 🔑 Demo Development Credentials

A complete set of demo seed accounts is pre-configured. You can log in using these credentials or use the **1-Click Demo Login** buttons on the login page:

| Role | Email | Password | Details |
|---|---|---|---|
| **Administrator** | `admin@careconnect.com` | `Admin@123` | Full administrative oversight and audit logs |
| **Pediatrician** | `dr.sharma@careconnect.com` | `Doctor@123` | Dr. Rajesh Sharma, MD (AIIMS), MCI-DMR-2014-88421 |
| **Parent 1** | `priya.sharma@gmail.com` | `Parent@123` | Parent of Aarav Sharma (3 yrs) & Ananya Sharma (10 mos) |
| **Parent 2** | `vikram.mehta@gmail.com` | `Parent@123` | Parent of Vivaan Mehta (15 mos, eczema & allergies) |

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Database & Seed Data Setup
```bash
# Navigate to backend
cd backend

# Install Python requirements
pip install -r requirements.txt

# Run Database Migrations and Seed Sample Data
python seed.py
```

### 2. Run Backend API Server
```bash
# Start FastAPI backend (runs on http://127.0.0.1:8000)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Interactive Swagger OpenAPI Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Run Frontend Application
```bash
# In a separate terminal, navigate to frontend
cd frontend

# Install npm packages
npm install

# Start Vite dev server (runs on http://localhost:5173)
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🧪 Automated Test Suite

A comprehensive test suite verifies authentication, parent-child data isolation, doctor slot availability, appointment double-booking prevention (HTTP 409), digital prescription PDF generation, and admin metrics:

```bash
# Run backend test suite
cd backend
python test_suite.py
```

All 6 test suites execute and pass with zero failures:
```
[PASS] Root Health check passed
[PASS] Authentication & Role-based tokens passed
[PASS] Parent-Child CRUD & Cross-parent security isolation passed
[PASS] Appointment booking & Double-booking prevention rule verified (HTTP 409 Conflict)
[PASS] Digital Prescription & ReportLab PDF download verified
[PASS] Admin Dashboard metrics and user auditing verified
```

---

## 🐳 Docker Deployment

To launch the entire platform with PostgreSQL, FastAPI backend, and Nginx frontend in Docker:

```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 📋 Regulatory & Telemedicine Practice Compliance

- **Guardian Consent**: Telemedicine for minors requires affirmative guardian consent. CareConnect incorporates legal consent checkboxes during registration and booking.
- **Doctor Verification**: Only pediatricians verified with valid registration numbers (NMC / State Medical Councils) can issue prescriptions.
- **Restricted Medicine Safeguards**: In accordance with the Telemedicine Practice Guidelines, the system does not auto-generate or suggest restricted narcotics/psychotropics, ensuring medical evaluation rests with the treating doctor.
- **Privacy & Data Security**: Children's health information is isolated by family account and never exposed via public unauthenticated routes.
