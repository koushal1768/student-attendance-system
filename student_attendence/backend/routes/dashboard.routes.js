import express from 'express';
import {
  getStudentDashboard,
  getTeacherDashboard
} from '../controllers/dashboard.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/student', authorize('student'), getStudentDashboard);
router.get('/teacher', authorize('teacher', 'admin'), getTeacherDashboard);

export default router;



