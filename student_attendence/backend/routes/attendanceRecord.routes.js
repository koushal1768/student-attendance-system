import express from 'express';
import {
  scanQR,
  faceVerify,
  getAttendanceRecords,
  getStudentAttendanceRecords
} from '../controllers/attendanceRecord.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Face verification route (public for AI service with token)
router.post('/face-verify', faceVerify);

// All other routes require authentication
router.use(authenticate);

// Student route
router.post('/qr-scan', authorize('student'), scanQR);

// Teacher routes
router.get('/records', authorize('teacher', 'admin'), getAttendanceRecords);
router.get('/records/:studentId', getStudentAttendanceRecords); // Both teacher and student can access

export default router;



