import pool from '../config/db.js';

export const createOrganization = async (name) => {
  const result = await pool.query(
    'INSERT INTO organizations (name) VALUES ($1) RETURNING *',
    [name]
  );
  return result.rows[0];
};

export const getOrganizationById = async (id) => {
  const result = await pool.query('SELECT * FROM organizations WHERE id = $1', [id]);
  return result.rows[0];
};
