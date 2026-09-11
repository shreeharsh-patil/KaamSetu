import type { Request, Response } from 'express';
import { getMongoDBStatus } from '../../database/mongodb.js';
import { getRedisStatus } from '../../database/redis.js';
import { env } from '../../config/index.js';
import type { HealthResponse, ReadyResponse } from '@kaamsetu/types';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: env.APP_VERSION,
  };

  res.status(200).json(response);
}

export async function getReady(_req: Request, res: Response): Promise<void> {
  const dbStatus = getMongoDBStatus();
  const redisStatus = await getRedisStatus();

  const isReady = dbStatus === 'connected' && redisStatus === 'connected';

  const response: ReadyResponse = {
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
  };

  const statusCode = isReady ? 200 : 503;
  res.status(statusCode).json(response);
}
