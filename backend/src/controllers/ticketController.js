import * as ticketModel from '../models/ticketModel.js';
import * as messageModel from '../models/messageModel.js';
import * as userModel from '../models/userModel.js';
import { getIo } from '../config/socket.js';
import { sendEmail } from '../utils/mailer.js';

export const createTicket = async (req, res, next) => {
  try {
    const { subject, description, priority, ticket_type, department = 'Support' } = req.body;
    const userId = req.user.id;

    if (!subject || !description) {
      return res.status(400).json({ error: { message: 'Subject and description are required' } });
    }

    const ticket = await ticketModel.createTicket(userId, subject, description, priority || 'Low', ticket_type, req.user.organization_id, department);
    res.status(201).json({ message: 'Ticket created successfully', ticket });
  } catch (error) {
    next(error);
  }
};

export const getTickets = async (req, res, next) => {
  try {
    let tickets;
    if (req.user.role === 'Admin') {
      tickets = await ticketModel.getAllTickets(req.user.organization_id);
    } else if (['Manager', 'Agent'].includes(req.user.role)) {
      tickets = await ticketModel.getAllTickets(req.user.organization_id, req.user.department);
    } else {
      tickets = await ticketModel.getTicketsByUser(req.user.id, req.user.organization_id);
    }
    res.status(200).json({ tickets });
  } catch (error) {
    next(error);
  }
};

export const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await ticketModel.getTicketById(id, req.user.organization_id);

    if (!ticket) {
      return res.status(404).json({ error: { message: 'Ticket not found' } });
    }

    if (ticket.user_id !== req.user.id && ticket.agent_id !== req.user.id && !['Admin', 'Manager', 'Agent'].includes(req.user.role)) {
      return res.status(403).json({ error: { message: 'Not authorized to view this ticket' } });
    }

    if (['Manager', 'Agent'].includes(req.user.role) && ticket.department !== req.user.department && ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Ticket does not belong to your department' } });
    }

    const messages = await messageModel.getMessagesByTicket(id);

    if (ticket.user_id === req.user.id && ticket.agent_id === req.user.id) {
      await ticketModel.clearUnreadCount(id, 'both');
      ticket.user_unread_count = 0;
      ticket.agent_unread_count = 0;
    } else if (ticket.user_id === req.user.id) {
      await ticketModel.clearUnreadCount(id, 'user');
      ticket.user_unread_count = 0;
    } else if (ticket.agent_id === req.user.id || ['Admin', 'Manager', 'Agent'].includes(req.user.role)) {
      await ticketModel.clearUnreadCount(id, 'agent');
      ticket.agent_unread_count = 0;
    }

    res.status(200).json({ ticket, messages });
  } catch (error) {
    next(error);
  }
};

export const updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, agent_id, priority } = req.body;

    const oldTicket = await ticketModel.getTicketById(id, req.user.organization_id);
    
    if (!oldTicket) {
      return res.status(404).json({ error: { message: 'Ticket not found' } });
    }

    if (oldTicket.agent_id !== req.user.id && !['Admin', 'Manager', 'Agent'].includes(req.user.role)) {
       return res.status(403).json({ error: { message: 'Not authorized to update this ticket' } });
    }

    const oldAgentId = oldTicket?.agent_id ? String(oldTicket.agent_id) : null;
    const newAgentId = agent_id ? String(agent_id) : null;
    
    const assignedBy = newAgentId && oldAgentId !== newAgentId ? req.user.id : undefined;

    const ticket = await ticketModel.updateTicket(id, status, agent_id, priority, assignedBy);

    const io = getIo();
    
    // Fetch the user performing the action to get their name
    const actor = await userModel.getUserById(req.user.id);
    const actorName = actor?.name || 'a user';

    if (newAgentId && oldAgentId !== newAgentId && io) {
      io.to(`user_${newAgentId}`).emit('ticket_assigned', {
        ticketId: ticket.id,
        subject: ticket.subject,
        message: 'You have been assigned a new ticket'
      });
      
      // Timeline message for assignment
      const assignedUser = await userModel.getUserById(newAgentId);
      const msgText = `[SYSTEM] Ticket was assigned to ${assignedUser?.name || 'an agent'} by ${actorName}`;
      const savedMsg = await messageModel.saveMessage(ticket.id, req.user.id, msgText, null, true);
      io.to(String(ticket.id)).emit('receive_message', savedMsg);

      // Send email notification to the assigned user
      if (assignedUser && assignedUser.email) {
        sendEmail(
          assignedUser.email,
          `You've been assigned Ticket #${ticket.id}`,
          `<div style="font-family: sans-serif; padding: 20px;">
            <h2>Ticket Assignment</h2>
            <p>Hi ${assignedUser.name},</p>
            <p>You have been assigned to support ticket <strong>#${ticket.id}: ${ticket.subject}</strong>.</p>
            <p>Please log in to the TaskXpert dashboard to view and respond to this ticket.</p>
          </div>`
        );
      }
    }

    if (status && oldTicket.status !== status && io) {
      const msgText = `[SYSTEM] Ticket status was changed to ${status} by ${actorName}`;
      const savedMsg = await messageModel.saveMessage(ticket.id, req.user.id, msgText, null, true);
      io.to(String(ticket.id)).emit('receive_message', savedMsg);
    }

    res.status(200).json({ message: 'Ticket updated', ticket });
  } catch (error) {
    next(error);
  }
};

export const deleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;

    await ticketModel.deleteTicket(id);
    res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    next(error);
  }
};
