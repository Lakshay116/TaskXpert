import pool from '../config/db.js';

export const createAttachment = async (taskId, uploadedBy, fileUrl, fileType) => {
  const result = await pool.query(
    'INSERT INTO attachments (task_id, uploaded_by, file_url, file_type) VALUES ($1, $2, $3, $4) RETURNING *',
    [taskId, uploadedBy, fileUrl, fileType]
  );
  return result.rows[0];
};

export const getAttachmentsByTask = async (taskId) => {
  const result = await pool.query(
    `SELECT a.*, u.name as uploader_name 
     FROM attachments a 
     LEFT JOIN users u ON a.uploaded_by = u.id 
     WHERE a.task_id = $1 
     ORDER BY a.created_at DESC`,
    [taskId]
  );
  return result.rows;
};

export const deleteAttachment = async (id) => {
  const result = await pool.query('DELETE FROM attachments WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};
