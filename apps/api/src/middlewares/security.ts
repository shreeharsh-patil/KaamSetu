import express, { Express } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from '../config/index.js';
import { createCorsMiddleware } from './cors.js';
import { requestIdMiddleware } from './request-id.js';
import { requestLoggerMiddleware } from './request-logger.js';

export function applySecurityMiddlewares(app: Express): void {
  // 1. Request ID for traceability across all layers
  app.use(requestIdMiddleware);

  // 2. HTTP Request Logger
  app.use(requestLoggerMiddleware);

  // 3. Helmet security headers
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // 4. Strict CORS policy
  app.use(createCorsMiddleware());

  // 5. Response compression
  app.use(
    compression({
      threshold: 1024, // only compress responses larger than 1kb
    })
  );

  // 6. JSON body parsing with strict size limits
  app.use(express.json({ limit: env.BODY_SIZE_LIMIT }));

  // 7. URL-encoded body parsing
  app.use(express.urlencoded({ extended: true, limit: env.BODY_SIZE_LIMIT }));

  // 8. Cookie parser
  app.use(cookieParser());
}
