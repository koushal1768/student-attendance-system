import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { getPendingUsers, verifyUser } from '../controllers/hod.controller.js';

const router = express.Router();

// Sare HOD routes authentication + admin (HOD) authorization ke saath
router.use(authenticate, authorize('admin'));

router.get('/pending-users', getPendingUsers);
router.post('/verify-user/:id', verifyUser);

export default router;


