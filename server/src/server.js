import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import config from './config/index.js';
import setupSocket from './sockets/socket.js';
import { runMigrations } from '../database/migration.js';

const server = http.createServer(app);

// Auto-run safe schema migrations on startup
runMigrations().catch((err) => console.warn('[startup] Migration warning:', err.message));

const io = new Server(server, {
  cors: { origin: config.clientUrl, methods: ['GET', 'POST'] },
});

app.set('io', io);
setupSocket(io);
console.log('SOCKET SERVER READY');

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
