import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { getRedisClient } from '../database/redis.js';
import { TooManyRequestsError } from '../errors/index.js';
import { logger } from '../config/index.js';

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  prefix?: string;
  skip?: (req: Request) => boolean;
  headers?: boolean;
}

interface MemoryBucket {
  count: number;
  resetAt: number;
}

// In-memory fallback store for offline tests or when Redis is disconnected
const memoryBuckets = new Map<string, MemoryBucket>();

// Periodic cleanup of stale memory buckets
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of memoryBuckets.entries()) {
    if (now >= bucket.resetAt) {
      memoryBuckets.delete(key);
    }
  }
}, 60000).unref();

const REDIS_RATE_LIMIT_LUA = `
local current = redis.call('incr', KEYS[1])
if current == 1 then
  redis.call('pexpire', KEYS[1], ARGV[1])
end
local ttl = redis.call('pttl', KEYS[1])
return {current, ttl}
`;

export function createRateLimiter(options: RateLimiterOptions): RequestHandler {
  const {
    windowMs,
    max,
    message = 'Too many requests. Please try again later.',
    keyGenerator = (req: Request) =>
      req.user?.id || req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1',
    prefix = 'rl:general',
    skip = () => false,
    headers = true,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (skip(req)) {
      return next();
    }

    const clientKey = keyGenerator(req);
    const storageKey = `ratelimit:${prefix}:${clientKey}`;

    let current = 0;
    let ttlMs = windowMs;

    const redis = getRedisClient();
    if (redis && redis.status === 'ready') {
      try {
        const result = (await redis.eval(
          REDIS_RATE_LIMIT_LUA,
          1,
          storageKey,
          windowMs.toString()
        )) as [number, number];

        current = result[0];
        ttlMs = Math.max(0, result[1]);
      } catch (err) {
        logger.warn(
          { err: err instanceof Error ? err.message : String(err), storageKey },
          'Redis rate limit check failed; falling back to in-memory store'
        );
      }
    }

    // Fallback to in-memory tracking if Redis is null or failed
    if (current === 0) {
      const now = Date.now();
      const existing = memoryBuckets.get(storageKey);

      if (!existing || now >= existing.resetAt) {
        const resetAt = now + windowMs;
        memoryBuckets.set(storageKey, { count: 1, resetAt });
        current = 1;
        ttlMs = windowMs;
      } else {
        existing.count += 1;
        current = existing.count;
        ttlMs = Math.max(0, existing.resetAt - now);
      }
    }

    const remaining = Math.max(0, max - current);
    const resetTimeSec = Math.ceil((Date.now() + ttlMs) / 1000);
    const retryAfterSec = Math.ceil(ttlMs / 1000);

    if (headers) {
      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', remaining);
      res.setHeader('RateLimit-Reset', resetTimeSec);
    }

    if (current > max) {
      res.setHeader('Retry-After', retryAfterSec);
      return next(new TooManyRequestsError(message));
    }

    next();
  };
}

/**
 * Global rate limiter across all public APIs (300 requests per minute by default)
 */
export const globalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: process.env['NODE_ENV'] === 'test' ? 10000 : 300,
  prefix: 'global',
  skip: (req) => req.path === '/health' || req.path === '/ready',
});

/**
 * Strict rate limiter for Authentication and OTP verification
 * Blocks brute-force attacks and SMS flooding
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: process.env['NODE_ENV'] === 'test' ? 10000 : 15,
  prefix: 'auth',
  message: 'Too many authentication attempts. Please slow down and try again later.',
  keyGenerator: (req) => {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
    const phone = req.body?.phone ? String(req.body.phone) : '';
    return phone ? `${ip}:${phone}` : ip;
  },
});

/**
 * Rate limiter for generating presigned upload URLs (20 uploads per minute)
 */
export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: process.env['NODE_ENV'] === 'test' ? 10000 : 20,
  prefix: 'upload',
  message: 'Too many upload requests. Please wait before requesting new upload URLs.',
});
