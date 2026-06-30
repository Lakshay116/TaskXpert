import express from 'express';
import { getTicketMessages } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/ticket/:ticketId', getTicketMessages);

export default router;
