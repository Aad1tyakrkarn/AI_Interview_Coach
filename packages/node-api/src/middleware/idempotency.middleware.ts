import { Request, Response, NextFunction } from 'express';
import { cache } from '../config/redis';
import { logger } from '../config/logger';

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const idempotencyKey = req.headers['x-idempotency-key'] as string;

  if (!idempotencyKey) {
    next();
    return;
  }

  const cacheKey = `idempotency:${idempotencyKey}`;

  cache.get(cacheKey).then((cached: any) => {
    if (cached) {
      logger.debug(`Idempotent request detected: ${idempotencyKey}`);
      res.status(cached.statusCode).json(cached.body);
      return;
    }

    // Override res.json to capture response
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      cache.set(cacheKey, {
        statusCode: res.statusCode,
        body,
      }, 86400).catch(() => {}); // 24h TTL
      return originalJson(body);
    };

    next();
  }).catch(() => next());
}
