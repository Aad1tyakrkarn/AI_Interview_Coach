import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../config/logger';

export function setupInterviewNamespace(io: SocketIOServer): void {
  const interviewNs = io.of('/interview');

  interviewNs.on('connection', (socket: Socket) => {
    logger.info(`Interview WS client connected: ${socket.id}`);

    socket.on('join-interview', (interviewId: string) => {
      socket.join(`interview:${interviewId}`);
      logger.info(`Socket ${socket.id} joined interview:${interviewId}`);
    });

    socket.on('leave-interview', (interviewId: string) => {
      socket.leave(`interview:${interviewId}`);
      logger.info(`Socket ${socket.id} left interview:${interviewId}`);
    });

    socket.on('submit-answer', (_data: { interviewId: string; questionIndex: number; answerText: string }) => {
      // Stub: Process answer submission in real-time
      socket.emit('answer-received', { status: 'not_implemented' });
    });

    socket.on('next-question', (_data: { interviewId: string }) => {
      // Stub: Send next question to client
      socket.emit('question', { status: 'not_implemented' });
    });

    socket.on('voice-data', (_data: { interviewId: string; audioChunk: string }) => {
      // Stub: Process real-time voice data
      socket.emit('voice-processed', { status: 'not_implemented' });
    });

    socket.on('camera-frame', (_data: { interviewId: string; frame: string }) => {
      // Stub: Process real-time camera frame
      socket.emit('frame-processed', { status: 'not_implemented' });
    });

    socket.on('disconnect', () => {
      logger.info(`Interview WS client disconnected: ${socket.id}`);
    });
  });
}
