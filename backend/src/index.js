import app from './app.js';
import dotenv from 'dotenv';
import pool from './config/db.js';
import http from 'http';
import { setupSocket } from './config/socket.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Setup Socket.IO
setupSocket(server);

const startServer = async () => {
  try {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Check database connection after server is listening
    try {
      const client = await pool.connect();
      client.release();
      console.log('Database connection verified.');
    } catch (dbErr) {
      console.error('Failed to connect to database. Please check your environment variables in Back4App:', dbErr.message);
      // We don't exit here so the container stays alive for healthchecks, but API calls might fail.
    }
    
    // Graceful shutdown to fix EADDRINUSE with nodemon on Windows
    const shutdown = () => {
      console.log('Shutting down server...');
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
      // Force close if it takes too long
      setTimeout(() => process.exit(1), 5000);
    };

    process.once('SIGUSR2', shutdown); // nodemon restart signal
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
