import express from 'express';
import {
  getTeachers,
  getTeacherById
} from '../controllers/teacher.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', authorize('admin'), getTeachers);
router.get('/:id', getTeacherById);

export default router;



