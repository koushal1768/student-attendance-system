import express from 'express';
import {
  getStudents,
  getStudentById
} from '../controllers/student.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', authorize('teacher', 'admin'), getStudents);
router.get('/:id', getStudentById);

export default router;



