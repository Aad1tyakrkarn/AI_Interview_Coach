import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../config/logger';

export function setupAdminNamespace(io: SocketIOServer): void {
  const adminNs = io.of('/admin');

  adminNs.on('connection', (socket: Socket) => {
    logger.info(`Admin WS client connected: ${socket.id}`);

    socket.on('subscribe-metrics', () => {
      socket.join('admin:metrics');
      // Stub: Start sending real-time system metrics
      socket.emit('metrics-subscribed', { status: 'not_implemented' });
    });

    socket.on('subscribe-interviews', () => {
      socket.join('admin:interviews');
      // Stub: Start sending real-time interview activity
      socket.emit('interviews-subscribed', { status: 'not_implemented' });
    });

    socket.on('subscribe-users', () => {
      socket.join('admin:users');
      // Stub: Start sending real-time user activity
      socket.emit('users-subscribed', { status: 'not_implemented' });
    });

    socket.on('subscribe-errors', () => {
      socket.join('admin:errors');
      // Stub: Start sending real-time error alerts
      socket.emit('errors-subscribed', { status: 'not_implemented' });
    });

    socket.on('disconnect', () => {
      logger.info(`Admin WS client disconnected: ${socket.id}`);
    });
  });
}
