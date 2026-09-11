import cors, { CorsOptions } from 'cors';
import { env } from '../config/index.js';

export function createCorsMiddleware() {
  const allowedOrigins = env.CORS_ORIGINS;

  const corsOptions: CorsOptions = {
    origin(requestOrigin, callback) {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!requestOrigin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes('*') || allowedOrigins.includes(requestOrigin)) {
        return callback(null, true);
      }

      callback(new Error(`Origin ${requestOrigin} not allowed by CORS policy`));
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
