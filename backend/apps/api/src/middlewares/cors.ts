import cors, { CorsOptions } from 'cors';
import { env } from '../config/index.js';

export function createCorsMiddleware() {
  // Normalize configured origins by stripping trailing slashes
  const allowedOrigins = env.CORS_ORIGINS.map((origin) => origin.replace(/\/+$/, ''));

  const corsOptions: CorsOptions = {
    origin(requestOrigin, callback) {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!requestOrigin) {
        return callback(null, true);
      }

      // Normalize incoming request origin by stripping trailing slashes
      const normalizedOrigin = requestOrigin.replace(/\/+$/, '');

      // In non-production environments, permit wildcard if explicitly configured
      if (allowedOrigins.includes('*') && env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      // Rejection with structured error handled safely by errorHandlerMiddleware (403 Forbidden)
      return callback(new Error(`Origin ${requestOrigin} not allowed by CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'x-request-id',
    ],
    exposedHeaders: ['x-request-id'],
    maxAge: 86400, // 24 hours
  };

  return cors(corsOptions);
}
