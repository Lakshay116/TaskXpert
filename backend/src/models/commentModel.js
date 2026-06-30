import pool from '../config/db.js';

export const createComment = async (taskId, userId, commentText) => {
  const result = await pool.query(
    'INSERT INTO comments (task_id, user_id, comment) VALUES ($1, $2, $3) RETURNING *',
    [taskId, userId, commentText]
  );
  return result.rows[0];
};

export const getCommentsByTask = async (taskId) => {
  const result = await pool.query(
    `SELECT c.*, u.name as user_name, u.avatar 
     FROM comments c 
     LEFT JOIN users u ON c.user_id = u.id 
     WHERE c.task_id = $1 
     ORDER BY c.created_at ASC`,
    [taskId]
  );
  return result.rows;
};

export const deleteComment = async (id) => {
  await pool.query('DELETE FROM comments WHERE id = $1', [id]);
};

export const getCommentById = async (id) => {
  const result = await pool.query('SELECT * FROM comments WHERE id = $1', [id]);
  return result.rows[0];
};
