import express from 'express';
import {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  deleteSession,
  startFaceRecognition,
  stopFaceRecognition,
  getSessionStudents
} from '../controllers/attendanceSession.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route for AI service (with token verification)
router.get('/:sessionId/students', getSessionStudents);

// All other routes require authentication
router.use(authenticate);

// Teacher only routes
router.post('/', authorize('teacher', 'admin'), createSession);
router.get('/', authorize('teacher', 'admin'), getSessions);
router.get('/:id', authorize('teacher', 'admin'), getSessionById);
router.put('/:id', authorize('teacher', 'admin'), updateSession);
router.delete('/:id', authorize('teacher', 'admin'), deleteSession);
router.post('/:id/start-face-recognition', authorize('teacher', 'admin'), startFaceRecognition);
router.post('/:id/stop-face-recognition', authorize('teacher', 'admin'), stopFaceRecognition);

export default router;



