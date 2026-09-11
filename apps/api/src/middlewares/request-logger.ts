import { pinoHttp } from 'pino-http';
import { logger } from '../config/index.js';
import type { Request, Response } from 'express';

export const requestLoggerMiddleware = pinoHttp({
  logger,
  genReqId(req: Request) {
    return req.id || (req.headers['x-request-id'] as string) || 'unknown';
  },
  customLogLevel(_req: Request, res: Response, err?: Error) {
    if (res.statusCode >= 500 || err) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    if (res.statusCode >= 300) {
      return 'info';
    }
    return 'info';
  },
  customSuccessMessage(req: Request, res: Response) {
    return `${req.method} ${req.url} completed with status ${res.statusCode}`;
  },
  customErrorMessage(req: Request, res: Response, err: Error) {
    return `${req.method} ${req.url} failed with status ${res.statusCode}: ${err.message}`;
  },
  customProps(req: Request) {
    return {
      requestId: req.id,
    };
  },
  autoLogging: {
    ignore: (req) => req.url === '/health',
  },
});
