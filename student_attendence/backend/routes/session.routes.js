import express from 'express';
import {
  generateSession,
  getSessions,
  getSession,
  scanQRCode,
  completeSession,
  getActiveSessions
} from '../controllers/session.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Public routes (for authenticated users)
router.get('/', getSessions);
router.get('/active', getActiveSessions);
router.get('/:id', getSession);

// Teacher only routes
router.post('/generate', authorize('teacher', 'admin'), generateSession);
router.put('/:id/complete', authorize('teacher', 'admin'), completeSession);

// Student only routes
router.post('/scan', authorize('student'), scanQRCode);

export default router;



