import pool from '../config/db.js';

export const createTask = async (title, description, projectId, createdBy, assignedTo, priority, dueDate) => {
  const result = await pool.query(
    `INSERT INTO tasks (title, description, project_id, created_by, assigned_to, priority, due_date) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [title, description, projectId, createdBy, assignedTo, priority, dueDate]
  );
  return result.rows[0];
};

export const getTasksByProject = async (projectId) => {
  const result = await pool.query(
    `SELECT t.*, u1.name as creator_name, u2.name as assignee_name 
     FROM tasks t 
     LEFT JOIN users u1 ON t.created_by = u1.id 
     LEFT JOIN users u2 ON t.assigned_to = u2.id 
     WHERE t.project_id = $1 
     ORDER BY t.created_at DESC`,
    [projectId]
  );
  return result.rows;
};

export const getTaskById = async (id, organizationId) => {
  const result = await pool.query(
    `SELECT t.*, u1.name as creator_name, u2.name as assignee_name 
     FROM tasks t 
     LEFT JOIN users u1 ON t.created_by = u1.id 
     LEFT JOIN users u2 ON t.assigned_to = u2.id 
     JOIN projects p ON t.project_id = p.id
     WHERE t.id = $1 AND p.organization_id = $2`,
    [id, organizationId]
  );
  return result.rows[0];
};

export const updateTask = async (id, updates) => {
  const { title, description, assignedTo, status, priority, dueDate } = updates;
  const result = await pool.query(
    `UPDATE tasks 
     SET title = COALESCE($1, title), 
         description = COALESCE($2, description), 
         assigned_to = COALESCE($3, assigned_to), 
         status = COALESCE($4, status), 
         priority = COALESCE($5, priority), 
         due_date = COALESCE($6, due_date),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $7 RETURNING *`,
    [title, description, assignedTo, status, priority, dueDate, id]
  );
  return result.rows[0];
};

export const deleteTask = async (id) => {
  await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
};
