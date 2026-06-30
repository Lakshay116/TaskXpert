import pool from '../config/db.js';

export const saveMessage = async (ticketId, senderId, message, attachmentUrl, isFromAgent) => {
  const result = await pool.query(
    `INSERT INTO ticket_messages (ticket_id, sender_id, message, attachment_url, is_from_agent) 
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [ticketId, senderId, message, attachmentUrl, isFromAgent]
  );
  
  const ticketRes = await pool.query('SELECT user_id, agent_id FROM tickets WHERE id = $1', [ticketId]);
  if (ticketRes.rows.length > 0) {
    const ticket = ticketRes.rows[0];
    if (senderId === ticket.user_id) {
       await pool.query('UPDATE tickets SET agent_unread_count = COALESCE(agent_unread_count, 0) + 1 WHERE id = $1', [ticketId]);
    } else {
       await pool.query('UPDATE tickets SET user_unread_count = COALESCE(user_unread_count, 0) + 1 WHERE id = $1', [ticketId]);
    }
  }

  return result.rows[0];
};

export const getMessagesByTicket = async (ticketId) => {
  const result = await pool.query(
    `SELECT m.*, u.name as sender_name, u.avatar 
     FROM ticket_messages m 
     LEFT JOIN users u ON m.sender_id = u.id 
     WHERE m.ticket_id = $1 
     ORDER BY m.created_at ASC`,
    [ticketId]
  );
  return result.rows;
};
