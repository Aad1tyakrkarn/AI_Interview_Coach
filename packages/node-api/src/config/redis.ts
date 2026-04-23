import { logger } from './logger';

// ---------------------------------------------------------------------------
// Redis cache with in-memory fallback
// Uses ioredis when REDIS_URL is set, otherwise falls back to JS Map
// ---------------------------------------------------------------------------

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

interface CacheAdapter {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  getClient(): unknown | null;
  destroy(): void;
}

// ---------------------------------------------------------------------------
// In-memory fallback (no Redis needed)
// ---------------------------------------------------------------------------
class InMemoryCache implements CacheAdapter {
  private store = new Map<string, CacheEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
    logger.info('Cache: Using in-memory store (no Redis configured)');
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: unknown, ttlSeconds: number = 3600): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  getClient(): null {
    return null;
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      logger.debug(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// ---------------------------------------------------------------------------
// Redis cache (production)
// ---------------------------------------------------------------------------
class RedisCache implements CacheAdapter {
  private client: import('ioredis').default;
  private connected = false;

  constructor(redisUrl: string) {
    // Lazy import to avoid loading ioredis when not needed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Redis = require('ioredis');
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => Math.min(times * 200, 5000),
      lazyConnect: true,
    });

    this.client.on('connect', () => {
      this.connected = true;
      logger.info('Cache: Redis connected');
    });

    this.client.on('error', (err: Error) => {
      logger.warn(`Cache: Redis error — ${err.message}`);
    });

    this.client.connect().catch(() => {
      logger.warn('Cache: Redis connection failed, operations will retry');
    });
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const raw = await this.client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number = 3600): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // Silently fail — cache miss is fine
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch {
      // Silently fail
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      return (await this.client.exists(key)) === 1;
    } catch {
      return false;
    }
  }

  getClient(): import('ioredis').default {
    return this.client;
  }

  destroy(): void {
    this.client.disconnect();
  }
}

// ---------------------------------------------------------------------------
// Factory: create Redis if URL set, otherwise in-memory
// ---------------------------------------------------------------------------
function createCache(): CacheAdapter {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      return new RedisCache(redisUrl);
    } catch (err) {
      logger.warn('Cache: Failed to create Redis client, falling back to in-memory');
      return new InMemoryCache();
    }
  }
  return new InMemoryCache();
}

export const cache = createCache();
