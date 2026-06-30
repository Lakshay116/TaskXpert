import pool from '../config/db.js';

export const createProject = async (name, description, ownerId, department, project_type, organizationId) => {
  const result = await pool.query(
    'INSERT INTO projects (name, description, owner_id, department, project_type, organization_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [name, description, ownerId, department || 'Development', project_type || 'Web', organizationId]
  );
  return result.rows[0];
};

export const getAllProjects = async (userId, role, organizationId) => {
  if (role === 'Admin') {
    const result = await pool.query(`
      SELECT p.*, u.name as owner_name,
      (SELECT COUNT(*) FROM tasks t2 WHERE t2.project_id = p.id AND t2.assigned_to = $1 AND t2.status != 'Done') as active_task_count
      FROM projects p 
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.organization_id = $2
      ORDER BY p.created_at DESC
    `, [userId, organizationId]);
    return result.rows;
  } else {
    const result = await pool.query(`
      SELECT DISTINCT p.*, u.name as owner_name,
      (SELECT COUNT(*) FROM tasks t2 WHERE t2.project_id = p.id AND t2.assigned_to = $1 AND t2.status != 'Done') as active_task_count
      FROM projects p 
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.organization_id = $2 AND (p.owner_id = $1 OR t.assigned_to = $1)
      ORDER BY p.created_at DESC
    `, [userId, organizationId]);
    return result.rows;
  }
};

export const getProjectById = async (id, organizationId) => {
  const result = await pool.query(
    `SELECT p.*, u.name as owner_name 
     FROM projects p 
     LEFT JOIN users u ON p.owner_id = u.id 
     WHERE p.id = $1 AND p.organization_id = $2`,
    [id, organizationId]
  );
  return result.rows[0];
};

export const updateProject = async (id, name, description, department, project_type, organizationId) => {
  const result = await pool.query(
    'UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description), department = COALESCE($4, department), project_type = COALESCE($5, project_type) WHERE id = $3 AND organization_id = $6 RETURNING *',
    [name, description, id, department, project_type, organizationId]
  );
  return result.rows[0];
};

export const deleteProject = async (id, organizationId) => {
  await pool.query('DELETE FROM projects WHERE id = $1 AND organization_id = $2', [id, organizationId]);
};
