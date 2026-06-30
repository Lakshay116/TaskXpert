import pool from './src/config/db.js';

const setup = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS task_timeline (
      id SERIAL PRIMARY KEY,
      task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100),
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Table task_timeline created successfully');
  process.exit(0);
};

setup();
