import express from 'express';
import {
  verifyFace,
  registerFace
} from '../controllers/faceRecognition.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/verify', verifyFace);
router.post('/register', registerFace);

export default router;



