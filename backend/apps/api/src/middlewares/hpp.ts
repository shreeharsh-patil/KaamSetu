import type { Request, Response, NextFunction, RequestHandler } from 'express';

export interface HppOptions {
  whitelist?: string[];
}

/**
 * HTTP Parameter Pollution (HPP) Protection Middleware.
 * Prevents attackers from supplying repeated query parameters (turning scalars into arrays)
 * to bypass validations or manipulate database queries.
 */
export function hppMiddleware(options: HppOptions = {}): RequestHandler {
  const whitelist = new Set(options.whitelist || ['skills', 'categories', 'languages']);

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.query || typeof req.query !== 'object') {
      return next();
    }

    const query = req.query as Record<string, unknown>;

    for (const key of Object.keys(query)) {
      if (whitelist.has(key)) {
        continue;
      }

      const val = query[key];
      if (Array.isArray(val)) {
        // Coerce repeated parameter to its last scalar value
        query[key] = val[val.length - 1];
      }
    }

    next();
  };
}
