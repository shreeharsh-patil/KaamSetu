import { Redis, RedisOptions } from 'ioredis';
import { logger } from '../config/index.js';
import type { ServiceConnectionStatus } from '@kaamsetu/types';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  return redisClient;
}

export async function connectRedis(url: string, options: Partial<RedisOptions> = {}): Promise<Redis> {
  if (redisClient && (redisClient.status === 'ready' || redisClient.status === 'connecting')) {
    return redisClient;
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true,
    retryStrategy(times: number) {
      const delay = Math.min(times * 100, 3000);
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
    await client.connect();
    return client;
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : String(error) }, 'Failed to connect to Redis');
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
