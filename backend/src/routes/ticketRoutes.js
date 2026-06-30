import express from 'express';
import { createTicket, getTickets, getTicketById, updateTicket, deleteTicket } from '../controllers/ticketController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All routes protected

// Users can create and view their tickets
router.post('/', createTicket);
router.get('/', getTickets);
router.get('/:id', getTicketById);

// Agents, Managers, Admins, and assigned Employees can update tickets
router.put('/:id', updateTicket);

// Only Admins and Managers can delete tickets
router.delete('/:id', authorize('Admin', 'Manager'), deleteTicket);

export default router;
