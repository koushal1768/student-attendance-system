import express from 'express';
import {
  getSubjects,
  getSubjectById,
  getTeacherSubjects,
  createSubject,
  updateSubject
} from '../controllers/subject.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Public routes (for authenticated users)
router.get('/', getSubjects);
router.get('/:id', getSubjectById);

// Teacher routes
router.get('/teacher/my-subjects', authorize('teacher', 'admin'), getTeacherSubjects);
router.post('/', authorize('teacher', 'admin'), createSubject);
router.put('/:id', authorize('teacher', 'admin'), updateSubject);

export default router;



