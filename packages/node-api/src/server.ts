import 'dotenv/config';
import http from 'http';
import { app } from './app';
import { config } from './config';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initializeWebSocket } from './websocket';
import { scheduleCleanupJobs } from './jobs/data-cleanup.job';

const server = http.createServer(app);

// Initialize Socket.IO
initializeWebSocket(server);

async function start(): Promise<void> {
  try {
    await connectDatabase();

    server.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
      scheduleCleanupJobs();
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, shutting down gracefully...`);
  server.close(async () => {
    await disconnectDatabase();
    logger.info('Server shut down complete');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();

export { server };
