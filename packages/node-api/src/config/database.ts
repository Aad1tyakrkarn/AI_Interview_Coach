import { PrismaClient } from '@prisma/client';
import { config } from './index';
import { logger } from './logger';

export const prisma = new PrismaClient({
  log: config.isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('PostgreSQL connected via Prisma');
  } catch (error) {
    logger.error('PostgreSQL connection failed', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database connection closed');
}
