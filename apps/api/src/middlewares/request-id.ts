import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.headers[REQUEST_ID_HEADER];
  
  const id = (typeof existingId === 'string' && existingId.trim().length > 0)
    ? existingId.trim()
    : `req_${randomUUID()}`;

  req.id = id;
  res.setHeader(REQUEST_ID_HEADER, id);

  next();
}
