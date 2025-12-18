# AttendEase Backend API

Backend API for Smart Attendance System with QR Code and Face Recognition built with Node.js, Express, and MongoDB.

## Features

- 🔐 Authentication & Authorization (JWT-based)
- 👥 User Management (Students & Teachers)
- 📱 QR Code Generation & Validation
- 📊 Session Management
- ✅ Attendance Tracking
- 📈 Dashboard Analytics
- 🎥 Face Recognition Integration (simulated)
- 📝 Subject & Enrollment Management

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **QR Code**: qrcode
- **Other**: moment, uuid

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend root directory:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/attendease
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
FACE_RECOGNITION_API_URL=http://localhost:8000
FACE_RECOGNITION_API_KEY=your_face_recognition_api_key
```

## Running the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will run on `http://localhost:5000` (or your configured PORT).

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)
- `PUT /api/auth/profile` - Update profile (Protected)
- `PUT /api/auth/change-password` - Change password (Protected)

### Sessions
- `POST /api/sessions/generate` - Generate QR code session (Teacher)
- `GET /api/sessions` - Get all sessions (Protected)
- `GET /api/sessions/active` - Get active sessions (Protected)
- `GET /api/sessions/:id` - Get session by ID (Protected)
- `POST /api/sessions/scan` - Scan QR code (Student)
- `PUT /api/sessions/:id/complete` - Complete session (Teacher)

### Attendance
- `POST /api/attendance/mark` - Mark attendance (Student)
- `GET /api/attendance/student` - Get student attendance (Student)
- `GET /api/attendance` - Get all attendance (Teacher)
- `GET /api/attendance/session/:sessionId` - Get session attendance (Teacher)
- `POST /api/attendance/manual` - Manually mark attendance (Teacher)

### Dashboard
- `GET /api/dashboard/student` - Get student dashboard data (Student)
- `GET /api/dashboard/teacher` - Get teacher dashboard data (Teacher)

### Students
- `GET /api/students` - Get all students (Teacher)
- `GET /api/students/:id` - Get student by ID (Protected)

### Teachers
- `GET /api/teachers` - Get all teachers (Admin)
- `GET /api/teachers/:id` - Get teacher by ID (Protected)

### Face Recognition
- `POST /api/face-recognition/verify` - Verify face (Protected)
- `POST /api/face-recognition/register` - Register face (Protected)

### Health Check
- `GET /api/health` - API health check

## Request/Response Format

All API responses follow this format:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (in development)"
}
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Or use the custom header:

```
x-auth-token: <token>
```

## Database Models

### User
- Student and Teacher profiles
- Authentication credentials
- Face recognition data

### Session
- Class sessions with QR codes
- Student presence tracking
- Time-based validity

### Attendance
- Attendance records
- QR and face verification status
- Manual overrides

### Subject
- Course/subject information
- Teacher assignments
- Student enrollments

## Error Handling

The API uses standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Development Notes

- Face recognition is currently simulated. Integrate with actual face recognition service in production.
- QR codes are generated as data URLs. Consider storing images in cloud storage for production.
- Use MongoDB Atlas for production database.
- Implement rate limiting for production.
- Add request validation middleware.
- Set up logging (e.g., Winston).

## License

ISC



