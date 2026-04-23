import rateLimit from 'express-rate-limit';
import { cache } from '../config/redis';

// Build Redis store if Redis is available
function getStore() {
  const redisClient = cache.getClient();
  if (!redisClient) return undefined; // Falls back to in-memory (default)

  try {
    const { RedisStore } = require('rate-limit-redis');
    return new RedisStore({
      sendCommand: (...args: string[]) => (redisClient as any).call(...args),
    });
  } catch {
    return undefined; // Falls back to in-memory
  }
}

const store = getStore();

export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  ...(store ? { store } : {}),
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 200 : 30,
  message: { error: { message: 'Too many authentication attempts, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
  ...(store ? { store } : {}),
});

export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { error: 'Too many uploads, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  ...(store ? { store } : {}),
});

export const interviewRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute for interview endpoints
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  ...(store ? { store } : {}),
});
