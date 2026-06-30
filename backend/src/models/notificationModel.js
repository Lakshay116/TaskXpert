import pool from '../config/db.js';

export const createNotification = async (userId, title, message, linkUrl = null) => {
  const result = await pool.query(
    'INSERT INTO notifications (user_id, title, message, link_url) VALUES ($1, $2, $3, $4) RETURNING *',
    [userId, title, message, linkUrl]
  );
  return result.rows[0];
};

export const getNotificationsByUserId = async (userId) => {
  const result = await pool.query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
};

export const markAsRead = async (id, userId) => {
  const result = await pool.query(
    'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, userId]
  );
  return result.rows[0];
};

export const markAllAsRead = async (userId) => {
  await pool.query(
    'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
    [userId]
  );
};
