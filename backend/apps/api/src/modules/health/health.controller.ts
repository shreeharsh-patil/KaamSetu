import type { Request, Response } from 'express';
import { getMongoDBStatus } from '../../database/mongodb.js';
import { getRedisStatus } from '../../database/redis.js';
import { env } from '../../config/index.js';
import type { HealthResponse, ReadyResponse } from '@kaamsetu/types';

import { metricsService } from '../../observability/metrics.service.js';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: env.APP_VERSION,
  };

  res.status(200).json(response);
}

export async function getReady(_req: Request, res: Response): Promise<void> {
  const dbStart = performance.now();
  const dbStatus = getMongoDBStatus();
  if (dbStatus === 'connected') {
    metricsService.recordDbLatency(parseFloat((performance.now() - dbStart).toFixed(2)));
  }

  const redisStart = performance.now();
  const redisStatus = await getRedisStatus();
  if (redisStatus === 'connected') {
    metricsService.recordRedisLatency(parseFloat((performance.now() - redisStart).toFixed(2)));
  }

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

export async function getMetrics(req: Request, res: Response): Promise<void> {
  const wantsJson =
    req.query['format'] === 'json' ||
    (req.headers.accept && req.headers.accept.includes('application/json'));

  if (wantsJson) {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      data: metricsService.getMetricsSnapshot(),
    });
    return;
  }

  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.status(200).send(metricsService.toPrometheusFormat());
}
