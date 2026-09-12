import type { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../errors/not-found-error.js';

export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
}
