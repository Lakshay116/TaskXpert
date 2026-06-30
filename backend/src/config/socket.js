import { Server } from 'socket.io';
import * as messageModel from '../models/messageModel.js';
import * as ticketModel from '../models/ticketModel.js';
import pool from './db.js';

export let ioInstance;

export const getIo = () => ioInstance;

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // In production, replace with frontend domain
      methods: ['GET', 'POST']
    }
  });
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`User connected to socket: ${socket.id}`);

    // Register user for personal notifications
    socket.on('register_user', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${socket.id} registered for notifications: user_${userId}`);
    });

    // Join a specific ticket room
    socket.on('join_ticket', (ticketId) => {
      socket.join(ticketId);
      console.log(`User ${socket.id} joined ticket room: ${ticketId}`);
    });

    // Send a message
    socket.on('send_message', async (data) => {
      try {
        let savedMessage = await messageModel.saveMessage(
          data.ticketId,
          data.senderId,
          data.message,
          data.attachmentUrl,
          data.isFromAgent
        );

        // Fetch sender name
        const { rows } = await pool.query('SELECT name FROM users WHERE id = $1', [data.senderId]);
        if (rows.length > 0) {
          savedMessage.sender_name = rows[0].name;
        }
        
        // Broadcast the saved message to everyone in the room
        io.to(data.ticketId).emit('receive_message', savedMessage);

        // Fetch ticket to get user_id and agent_id for notifications
        const ticketResult = await pool.query('SELECT user_id, agent_id, subject FROM tickets WHERE id = $1', [data.ticketId]);
        const ticket = ticketResult.rows[0];
        if (ticket) {
          const notificationData = {
            ticketId: data.ticketId,
            subject: ticket.subject,
            senderId: data.senderId,
            message: data.message
          };
          
          const notifiedUsers = new Set();
          
          // Notify the owner (if sender is not the owner)
          if (ticket.user_id !== data.senderId) {
            io.to(`user_${ticket.user_id}`).emit('ticket_notification', notificationData);
            notifiedUsers.add(ticket.user_id);
          }
          // Notify the agent (if sender is not the agent and not already notified)
          if (ticket.agent_id && ticket.agent_id !== data.senderId && !notifiedUsers.has(ticket.agent_id)) {
            io.to(`user_${ticket.agent_id}`).emit('ticket_notification', notificationData);
          }
        }
      } catch (error) {
        console.error('Error saving socket message:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};
