import express from 'express';
import {
  getStudents,
  getStudentById,
  addStudent,
  updateStudent,
  deleteStudent
} from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// All routes require teacher/admin role
router.use(authorize('teacher', 'admin'));

router.get('/students', getStudents);
router.get('/students/:id', getStudentById);
router.post('/students', addStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

export default router;



