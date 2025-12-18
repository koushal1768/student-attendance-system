import express from 'express';
import {
  markAttendance,
  getStudentAttendance,
  getSessionAttendance,
  getAllAttendance,
  manualMarkAttendance
} from '../controllers/attendance.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Student routes
router.post('/mark', authorize('student'), markAttendance);
router.get('/student', authorize('student'), getStudentAttendance);

// Teacher/Admin routes
router.get('/', authorize('teacher', 'admin'), getAllAttendance);
router.get('/session/:sessionId', authorize('teacher', 'admin'), getSessionAttendance);
router.post('/manual', authorize('teacher', 'admin'), manualMarkAttendance);

export default router;



