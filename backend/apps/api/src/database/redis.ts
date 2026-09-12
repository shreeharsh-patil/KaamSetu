import { Redis, RedisOptions } from 'ioredis';
import { logger } from '../config/index.js';
import type { ServiceConnectionStatus } from '@kaamsetu/types';

let redisClient: Redis | null = null;

export function sanitizeRedisUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    return 'redis://[sanitized]';
  }
}

export function getRedisClient(): Redis | null {
  return redisClient;
}

export async function connectRedis(url: string, options: Partial<RedisOptions> = {}): Promise<Redis> {
  if (redisClient && (redisClient.status === 'ready' || redisClient.status === 'connecting')) {
    return redisClient;
  }

  const isTls = url.startsWith('rediss://');

  const client = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true,
    connectTimeout: 10000, // 10s connection timeout
    tls: isTls ? { rejectUnauthorized: false } : undefined,
    retryStrategy(times: number) {
      if (times > 10) {
        logger.warn(
          { times },
          'Redis connection retry limit reached (10 attempts). Pausing retries.'
        );
        return null;
      }
      const delay = Math.min(times * 200, 3000);
      logger.warn({ times, delay }, 'Reconnecting to Redis...');
      return delay;
    },
    ...options,
  });

  client.on('connect', () => {
    logger.info('Redis socket connected');
  });

  client.on('ready', () => {
    logger.info('Redis ready to receive commands');
  });

  client.on('error', (err: Error) => {
    logger.error({ err: err.message }, 'Redis client error');
  });

  client.on('close', () => {
    logger.warn('Redis connection closed');
  });

  client.on('reconnecting', () => {
    logger.info('Redis client reconnecting...');
  });

  redisClient = client;

  try {
    // Bounded timeout for initial connection
    await Promise.race([
      client.connect(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Redis initial connection timed out after 10000ms')),
          10000
        )
      ),
    ]);
    return client;
  } catch (error) {
    const sanitized = sanitizeRedisUrl(url);
    logger.error(
      {
        err: error instanceof Error ? error.message : String(error),
        sanitizedUrl: sanitized,
      },
      'Failed to connect to Redis'
    );
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    } finally {
      redisClient = null;
      logger.info('Redis client disconnected gracefully');
    }
  }
}

export async function isRedisConnected(): Promise<boolean> {
  if (!redisClient) return false;
  try {
    const pingResponse = await redisClient.ping();
    return pingResponse === 'PONG';
  } catch {
    return false;
  }
}

export async function getRedisStatus(): Promise<ServiceConnectionStatus> {
  if (!redisClient) {
    return 'disconnected';
  }
  if (redisClient.status === 'ready') {
    try {
      const ping = await redisClient.ping();
      return ping === 'PONG' ? 'connected' : 'degraded';
    } catch {
      return 'degraded';
    }
  }
  if (redisClient.status === 'connecting' || redisClient.status === 'reconnecting') {
    return 'connecting';
  }
  return 'disconnected';
}
