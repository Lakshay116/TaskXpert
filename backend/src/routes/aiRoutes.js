import express from 'express';
import { chatWithAI } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All AI routes are protected
router.use(protect);

router.post('/chat', chatWithAI);

export default router;
