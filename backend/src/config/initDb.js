import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initDb = async () => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing schema.sql...');
    await pool.query(sql);
    console.log('Database initialized successfully with schema.sql');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    pool.end();
  }
};

initDb();
