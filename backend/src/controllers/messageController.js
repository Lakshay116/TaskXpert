import * as messageModel from '../models/messageModel.js';
import * as ticketModel from '../models/ticketModel.js';

export const getTicketMessages = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    
    const ticket = await ticketModel.getTicketById(ticketId);
    if (!ticket) return res.status(404).json({ error: { message: 'Ticket not found' } });

    if (ticket.user_id !== req.user.id && !['Admin', 'Manager', 'Agent'].includes(req.user.role)) {
      return res.status(403).json({ error: { message: 'Not authorized' } });
    }

    const messages = await messageModel.getMessagesByTicket(ticketId);
    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
};
