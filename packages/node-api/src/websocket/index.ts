import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setupInterviewNamespace } from './interview.ws';
import { setupHeartbeatNamespace } from './heartbeat.ws';
import { setupAdminNamespace } from './admin.ws';
import { logger } from '../config/logger';

let io: SocketIOServer;

export function initializeWebSocket(server: http.Server): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  // Setup namespaces
  setupInterviewNamespace(io);
  setupHeartbeatNamespace(io);
  setupAdminNamespace(io);

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  logger.info('WebSocket server initialized');
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}
