import { CorsOptions } from 'cors';
import { config } from './index';

export const corsOptions: CorsOptions = {
  origin: [config.cors.origin, 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key'],
  exposedHeaders: ['X-Total-Count', 'X-Request-Id'],
  maxAge: 86400,
};
