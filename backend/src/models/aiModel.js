import pool from '../config/db.js';

/**
 * Fetches all tasks associated with a user across all projects in their organization,
 * sorted by status progression, priority level, and due date.
 */
export const getUserTasks = async (userId, organizationId) => {
  const result = await pool.query(
    `SELECT t.*, p.name as project_name, u1.name as creator_name, u2.name as assignee_name 
     FROM tasks t 
     JOIN projects p ON t.project_id = p.id
     LEFT JOIN users u1 ON t.created_by = u1.id 
     LEFT JOIN users u2 ON t.assigned_to = u2.id 
     WHERE p.organization_id = $2 AND (t.assigned_to = $1 OR t.created_by = $1)
     ORDER BY 
       CASE 
         WHEN t.status = 'Todo' THEN 1
         WHEN t.status = 'In Progress' THEN 2
         WHEN t.status = 'In Review' THEN 3
         ELSE 4
       END ASC,
       CASE 
         WHEN t.priority = 'High' THEN 1
         WHEN t.priority = 'Medium' THEN 2
         ELSE 3
       END ASC,
       t.due_date ASC NULLS LAST`,
    [userId, organizationId]
  );
  return result.rows;
};
