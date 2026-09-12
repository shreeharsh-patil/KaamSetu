import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { BadRequestError } from '../errors/index.js';

const PROHIBITED_OPERATOR_REGEX = /^\$|\./;

/**
 * Recursively scans an object, array, or value for NoSQL injection operator keys ($where, $gt, $ne, etc.) or dot notation keys.
 * Returns the detected offending key, or null if clean.
 */
function findProhibitedKey(target: unknown): string | null {
  if (!target || typeof target !== 'object') {
    return null;
  }

  if (Array.isArray(target)) {
    for (const item of target) {
      const offending = findProhibitedKey(item);
      if (offending) return offending;
    }
    return null;
  }

  const obj = target as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (PROHIBITED_OPERATOR_REGEX.test(key)) {
      return key;
    }
    const offending = findProhibitedKey(obj[key]);
    if (offending) return offending;
  }

  return null;
}

/**
 * Middleware that strictly protects against NoSQL injection across body, query, and params.
 * Rejects any request containing MongoDB query operators ($gt, $ne, $regex, etc.) or dot-notation keys with 400 Bad Request.
 */
export function nosqlSanitizerMiddleware(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // 1. Inspect req.body
    if (req.body) {
      const offendingKey = findProhibitedKey(req.body);
      if (offendingKey) {
        return next(
          new BadRequestError(
            `Prohibited NoSQL query operator or character detected in request body: "${offendingKey}"`
          )
        );
      }
    }

    // 2. Inspect req.query
    if (req.query) {
      const offendingKey = findProhibitedKey(req.query);
      if (offendingKey) {
        return next(
          new BadRequestError(
            `Prohibited NoSQL query operator or character detected in query parameters: "${offendingKey}"`
          )
        );
      }
    }

    // 3. Inspect req.params
    if (req.params) {
      const offendingKey = findProhibitedKey(req.params);
      if (offendingKey) {
        return next(
          new BadRequestError(
            `Prohibited NoSQL query operator or character detected in route parameters: "${offendingKey}"`
          )
        );
      }
    }

    next();
  };
}
