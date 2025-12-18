## AttendEase – Smart Attendance Platform

**AttendEase** is a full-stack smart attendance system that combines **QR-based check-ins**, **live face recognition**, and **role-based dashboards** for **Students, Teachers, and HOD/Admins**.  
It is designed as a complete minor/major project that you can showcase on GitHub and in resumes/portfolios.

---

### 📁 Monorepo Structure

This repository contains the entire system (frontend, backend, and AI microservice) in a single project:

```text
student_attendence/
├── backend/        # Node.js + Express REST API, MongoDB models & business logic
├── frontend/       # React + Vite SPA (TypeScript, Tailwind, shadcn-ui)
├── ai-service/     # Python Flask microservice for real-time face recognition
├── *.md            # Project documentation and design notes
└── venv/           # (Optional) Python virtual environment for root-level work
```

| Area      | Key Tech | Highlights |
|-----------|----------|------------|
| **Backend**   | Node 18+, Express, MongoDB (Mongoose), JWT, bcrypt, qrcode | Clean MVC-style controllers/routes, attendance session + record separation, HOD verification with secret key |
| **Frontend**  | Vite, React 18, TypeScript, Tailwind, shadcn-ui, React Query | Central `AuthContext`, protected routing, dashboards, QR workflows & scanning |
| **AI Layer**  | Python 3.8+, Flask, OpenCV, `face-recognition`, `dlib` | Streams webcam/CCTV frames, compares embeddings, posts matches back to backend |

---

## 🎯 Project Objectives

- **Automate classroom attendance** using QR codes and face recognition.
- **Minimize proxy attendance** by requiring both **QR scan + face verification**.
- Provide **clean dashboards** for:
  - Students (personal attendance history & stats),
  - Teachers (session management, per-class analytics),
  - HOD/Admin (global overview, user/subject management).
- Build a **portfolio-ready full-stack project** with clear architecture and documentation.

---

## ✨ Major Features

- **Role-based JWT authentication** (Student / Teacher / HOD).
- **HOD self-registration with secret key** to prevent unauthorized HOD creation.
- **QR-based attendance**:
  - Teacher creates a session and generates a unique QR code.
  - Students scan the QR using the web app (mobile-friendly).
- **Face recognition–based verification** using a separate Python AI service.
- **Dual-event attendance model**:
  - QR scan + Face verification update a *single* attendance record.
  - Status values like `Present`, `Pending`, `Suspicious`.
- **Dashboards**:
  - Student: attendance percentage, recent sessions, historical records.
  - Teacher: sessions, per-session statistics, present/absent lists.
  - HOD/Admin: subjects, teachers, students, approvals.
- **Subject & user management** (CRUD APIs for subjects, students, teachers).

---

## 🏗️ System Architecture Overview

1. **Frontend (React SPA)**
   - Built with **Vite + React + TypeScript + Tailwind + shadcn-ui**.
   - Uses **React Router** for navigation and protected routes.
   - Central `AuthContext` stores current user and JWT token.
   - `src/lib/api.ts` centralizes Axios instance and API calls.
   - Uses **React Query** for data fetching, caching, and background refetching.

2. **Backend (Node/Express API)**
   - Exposes REST endpoints under `/api/*`.
   - Uses **Mongoose** for MongoDB models:
     - `User`, `AttendanceSession`, `AttendanceRecord`, `Subject`.
   - JWT-based authentication and role-based authorization middleware.
   - Separate controllers and routes for each module (auth, attendance, sessions, subjects, HOD, etc.).
   - Integrates with AI service via HTTP calls for face verification.

3. **AI Service (Python + Flask)**
   - Maintains active recognition sessions.
   - Reads video frames from **webcam or CCTV** (`cv2.VideoCapture`).
   - Uses **dlib + face-recognition** to generate and compare embeddings.
   - On a successful face match, calls backend endpoint (e.g. `/api/attendance/face-verify`) to mark face verification for that student/session.

---

## 🧱 Data Model Summary

| Model | Purpose | Notable Fields |
|-------|---------|----------------|
| **User** | Represents students, teachers, HOD/admins | `name`, `email`, `password`, `role`, `studentId`, `faceEmbedding`, `isFaceRegistered`, HOD approval fields |
| **AttendanceSession** | A class session created by a teacher | `teacher`, `subject`, `startTime`, `endTime`, `qrCodeString`, `isActive`, `faceRecognitionActive` |
| **AttendanceRecord** | Attendance of a single student for a single session | `student`, `session`, `qrScanned`, `faceVerified`, `confidence`, `status` (Present/Pending/Suspicious), helper `updateStatus()` |
| **Subject** | Course/subject definitions | `name`, `code`, assigned teachers, meta for forms |

Indexes are used on common query fields (teacher/date, student/session, status) to keep dashboards responsive.

---

## 🔁 End-to-End User Flows

### 👨‍🏫 Teacher Flow
- Login as **Teacher**.
- From the dashboard:
  - Create a **new attendance session** (select subject, time, options).
  - System generates a unique `qrCodeString` and displays a QR code.
  - Optionally **start face recognition** which:
    - Sends enrolled student embeddings to the AI service.
    - Starts capturing frames from webcam/CCTV.
- Monitor live attendance as students scan and get verified.
- End the session and review statistics (present/absent, suspicious).

### 🧑‍🎓 Student Flow
- Login/Register as **Student**.
- From the dashboard:
  - View **upcoming/active sessions**.
  - Use the **Scan QR** page to scan the QR code generated by the teacher.
- Once QR is scanned:
  - `qrScanned = true` is recorded for that session.
  - If face recognition is active, the AI service attempts to match the student's face.
- View personal **attendance history and statistics** over time.

### 🧑‍💼 HOD/Admin Flow
- Register using a **secret key** (HOD secret) configured in backend `.env`.
- Approve teachers/students if needed and manage:
  - Subjects, teacher assignments, student enrollments.
  - High-level attendance and usage overview.

### 🔙 Backend Logic
- `AttendanceRecord.updateStatus()` marks:
  - **Present** if both `qrScanned` and `faceVerified` are `true`.
  - **Pending/Suspicious** based on mismatched or missing events.
- Dashboards hit endpoints such as:
  - `/api/dashboard/student`
  - `/api/dashboard/teacher`

---

## 🚀 Getting Started (Local Development)

You can run the **entire system locally**: backend API, frontend SPA, and AI service.

### 1️⃣ Backend API (Node + Express)

```bash
cd backend
npm install
cp .env.example .env   # or create .env manually
npm run dev            # or npm start for production-like run
```

**Example backend `.env` configuration:**

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/attendease
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TOKEN=your_ai_service_secret_token
HOD_SECRET=some_strong_secret_for_hod_registration
```

> The `HOD_SECRET` is used when HODs self-register from the frontend; the frontend passes this secret and the backend validates it.

The server will run at: `http://localhost:5000`

---

### 2️⃣ Frontend SPA (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env   # or create .env manually
npm run dev
```

**Example frontend `.env` configuration:**

```env
VITE_API_URL=http://localhost:5000/api
```

Visit `http://localhost:5173` in your browser.  
Auth state is persisted via `localStorage` (`token`, `user`), and Axios interceptors automatically log the user out on `401` responses.

---

### 3️⃣ AI Face Recognition Service (Python + Flask)

```bash
cd ai-service
python -m venv venv && venv\Scripts\activate  # Windows
pip install -r requirements.txt
set BACKEND_URL=http://localhost:5000/api
set AI_SERVICE_TOKEN=your_ai_service_secret_token
set PORT=8000
python app.py
```

> Make sure you have `cmake`/build tools installed before `dlib`.  
> Change `cv2.VideoCapture(0)` in `app.py` to an **RTSP CCTV URL** or video file path for production-like testing.

AI service will run at: `http://localhost:8000`

---

## 🌐 Important API Groups (High-Level)

- **Auth**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- **Users / HOD**
  - CRUD for students and teachers.
  - HOD registration/approval and subject-teacher mappings.
- **Sessions**
  - `POST /api/sessions` – create a new session with QR.
  - Additional endpoints to start/stop face recognition for a session.
- **Attendance**
  - `POST /api/attendance/qr-scan` – called when student scans QR.
  - `POST /api/attendance/face-verify` – called by AI service.
  - Student/teacher-specific listing endpoints.
- **AI Service**
  - `POST /start-session`, `POST /stop-session`
  - `POST /generate-embedding`, `POST /verify-single-face`
  - `GET /health`

For full, low-level details (request bodies, response shapes), see:
- `backend/README.md`
- `FRONTEND_BACKEND_ALIGNMENT.md`
- `INTEGRATION_GUIDE.md`

---

## 🧪 Development & Testing Notes

- Use **Postman/Insomnia** to manually test backend endpoints.
- Use browser DevTools + **React Query Devtools** to inspect frontend network/cache behaviour.
- When integrating real cameras:
  - Start by testing with webcam, then switch to CCTV URL.
  - Monitor AI service logs for recognition confidence values.
- Security improvements to consider:
  - Rate limiting, request validation, centralized logging (e.g. Winston).
  - Refresh tokens for long-running sessions in production.

---

## 📂 Additional Documentation

- `PROJECT_PLAN_IMPLEMENTATION.md` – detailed change log and implementation notes.
- `FRONTEND_BACKEND_ALIGNMENT.md` – API contracts and response shapes for frontend integration.
- `INTEGRATION_GUIDE.md` – how the SPA consumes the API step by step.
- `backend/README.md` – backend-specific setup, endpoints, and formats.
- `frontend/README.md` – frontend/Lovable-specific notes.
- `ai-service/README.md` – AI microservice setup and endpoint documentation.

Use this root `README.md` as the **main high-level project overview** for GitHub visitors and attach screenshots/diagrams in your repository if desired.
