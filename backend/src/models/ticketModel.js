import pool from '../config/db.js';

export const createTicket = async (userId, subject, description, priority, ticketType, organizationId, department = 'Support') => {
  const result = await pool.query(
    'INSERT INTO tickets (user_id, subject, description, priority, ticket_type, organization_id, department) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [userId, subject, description, priority, ticketType || 'Question', organizationId, department]
  );
  return result.rows[0];
};

export const getTicketsByUser = async (userId, organizationId) => {
  const result = await pool.query(
    `SELECT t.*, u1.name as user_name, u2.name as agent_name, u3.name as assigned_by_name
     FROM tickets t 
     LEFT JOIN users u1 ON t.user_id = u1.id
     LEFT JOIN users u2 ON t.agent_id = u2.id 
     LEFT JOIN users u3 ON t.assigned_by = u3.id
     WHERE (t.user_id = $1 OR t.agent_id = $1) AND t.organization_id = $2
     ORDER BY t.created_at DESC`,
    [userId, organizationId]
  );
  return result.rows;
};

export const getAllTickets = async (organizationId, department = null) => {
  let query = `
    SELECT t.*, u1.name as user_name, u2.name as agent_name, u3.name as assigned_by_name
    FROM tickets t 
    LEFT JOIN users u1 ON t.user_id = u1.id 
    LEFT JOIN users u2 ON t.agent_id = u2.id 
    LEFT JOIN users u3 ON t.assigned_by = u3.id
    WHERE t.organization_id = $1
  `;
  const params = [organizationId];

  if (department) {
    query += ` AND t.department = $2`;
    params.push(department);
  }

  query += ` ORDER BY t.created_at DESC`;

  const result = await pool.query(query, params);
  return result.rows;
};

export const getTicketById = async (id, organizationId) => {
  const result = await pool.query(
    `SELECT t.*, u1.name as user_name, u2.name as agent_name, u3.name as assigned_by_name,
            r1.name as user_role, u1.department as user_department,
            r2.name as agent_role, u2.department as agent_department
     FROM tickets t 
     LEFT JOIN users u1 ON t.user_id = u1.id 
     LEFT JOIN roles r1 ON u1.role_id = r1.id
     LEFT JOIN users u2 ON t.agent_id = u2.id 
     LEFT JOIN roles r2 ON u2.role_id = r2.id
     LEFT JOIN users u3 ON t.assigned_by = u3.id
     WHERE t.id = $1 AND t.organization_id = $2`,
    [id, organizationId]
  );
  return result.rows[0];
};

export const updateTicket = async (id, status, agentId, priority, assignedBy) => {
  const result = await pool.query(
    `UPDATE tickets 
     SET status = COALESCE($1, status), 
         agent_id = COALESCE($2, agent_id), 
         priority = COALESCE($3, priority),
         assigned_by = COALESCE($5, assigned_by),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4 RETURNING *`,
    [status, agentId, priority, id, assignedBy]
  );
  return result.rows[0];
};

export const deleteTicket = async (id) => {
  await pool.query('DELETE FROM tickets WHERE id = $1', [id]);
};

export const clearUnreadCount = async (ticketId, type) => {
  if (type === 'user') {
    await pool.query('UPDATE tickets SET user_unread_count = 0 WHERE id = $1', [ticketId]);
  } else if (type === 'agent') {
    await pool.query('UPDATE tickets SET agent_unread_count = 0 WHERE id = $1', [ticketId]);
  } else if (type === 'both') {
    await pool.query('UPDATE tickets SET user_unread_count = 0, agent_unread_count = 0 WHERE id = $1', [ticketId]);
  }
};
