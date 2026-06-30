import pool from '../config/db.js';

export const createUser = async (name, email, hashedPassword, roleId, organizationId, department = 'Technical', googleId = null) => {
  const result = await pool.query(
    'INSERT INTO users (name, email, password, role_id, organization_id, department, google_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role_id, organization_id, department, avatar, status',
    [name, email, hashedPassword, roleId, organizationId, department, googleId]
  );
  return result.rows[0];
};

export const getUserByGoogleId = async (googleId) => {
  const result = await pool.query(
    `SELECT u.*, r.name as role_name, o.name as organization_name 
     FROM users u 
     LEFT JOIN roles r ON u.role_id = r.id 
     LEFT JOIN organizations o ON u.organization_id = o.id
     WHERE u.google_id = $1`,
    [googleId]
  );
  return result.rows[0];
};

export const getUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT u.*, r.name as role_name, o.name as organization_name 
     FROM users u 
     LEFT JOIN roles r ON u.role_id = r.id 
     LEFT JOIN organizations o ON u.organization_id = o.id
     WHERE u.email = $1`,
    [email]
  );
  return result.rows[0];
};

export const getUserById = async (id) => {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.role_id, u.organization_id, u.department, u.avatar, u.status, r.name as role_name, o.name as organization_name 
     FROM users u 
     LEFT JOIN roles r ON u.role_id = r.id 
     LEFT JOIN organizations o ON u.organization_id = o.id
     WHERE u.id = $1`,
    [id]
  );
  return result.rows[0];
};

export const getAllUsers = async (organizationId) => {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.role_id, u.organization_id, u.department, u.avatar, u.status, r.name as role_name 
     FROM users u 
     LEFT JOIN roles r ON u.role_id = r.id 
     WHERE u.organization_id = $1
     ORDER BY u.name ASC`,
    [organizationId]
  );
  return result.rows;
};

export const getRoleByName = async (roleName) => {
  const result = await pool.query('SELECT id FROM roles WHERE name = $1', [roleName]);
  return result.rows[0];
};

export const updateUserRole = async (userId, roleId) => {
  const result = await pool.query(
    'UPDATE users SET role_id = $1 WHERE id = $2 RETURNING *',
    [roleId, userId]
  );
  return result.rows[0];
};

export const updateGoogleIdAndAvatar = async (userId, googleId, avatar) => {
  await pool.query(
    'UPDATE users SET google_id = COALESCE(google_id, $1), avatar = COALESCE(avatar, $2) WHERE id = $3',
    [googleId, avatar, userId]
  );
};

export const deleteUser = async (userId, organizationId) => {
  // Check if they are part of the org first
  await pool.query(
    'DELETE FROM users WHERE id = $1 AND organization_id = $2',
    [userId, organizationId]
  );
};

export const updateUserDetails = async (userId, organizationId, updates) => {
  const { name, email, department } = updates;
  const result = await pool.query(
    `UPDATE users 
     SET name = COALESCE($1, name), 
         email = COALESCE($2, email), 
         department = COALESCE($3, department)
     WHERE id = $4 AND organization_id = $5 
     RETURNING *`,
    [name, email, department, userId, organizationId]
  );
  return result.rows[0];
};
