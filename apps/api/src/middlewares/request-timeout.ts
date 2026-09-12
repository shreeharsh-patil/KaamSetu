import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { RequestTimeoutError } from '../errors/index.js';
import { env } from '../config/index.js';

export interface RequestTimeoutOptions {
  timeoutMs?: number;
}

/**
 * Enforces execution time limits on incoming HTTP requests.
 * Prevents slowloris attacks and runaway database/external service operations.
 */
export function requestTimeoutMiddleware(options: RequestTimeoutOptions = {}): RequestHandler {
  const timeoutMs = options.timeoutMs ?? env.REQUEST_TIMEOUT_MS;

  return (_req: Request, res: Response, next: NextFunction): void => {
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      if (!res.headersSent) {
        next(new RequestTimeoutError(`Request exceeded processing timeout of ${timeoutMs}ms`));
      }
    }, timeoutMs);

    // Unref timer so node process is not held open in tests
    timer.unref();

    const cleanup = () => {
      clearTimeout(timer);
    };

    res.once('finish', cleanup);
    res.once('close', cleanup);

    // If already timed out before next middleware
    if (timedOut) {
      return;
    }

    next();
  };
}
