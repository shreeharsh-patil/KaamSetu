import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { metricsService } from '../observability/metrics.service.js';

/**
 * Middleware that tracks request throughput, status codes, and latency percentiles.
 */
export function metricsMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = performance.now();

    res.once('finish', () => {
      const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
      const route = req.route?.path || req.baseUrl || req.path;
      metricsService.recordHttpRequest(req.method, route, res.statusCode, durationMs);
    });

    next();
  };
}
