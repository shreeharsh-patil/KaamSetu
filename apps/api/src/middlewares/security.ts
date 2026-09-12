import express, { Express } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from '../config/index.js';
import { createCorsMiddleware } from './cors.js';
import { requestIdMiddleware } from './request-id.js';
import { requestLoggerMiddleware } from './request-logger.js';
import { nosqlSanitizerMiddleware } from './nosql-sanitizer.js';
import { hppMiddleware } from './hpp.js';
import { requestTimeoutMiddleware } from './request-timeout.js';
import { globalRateLimiter } from './rate-limiter.js';

export function applySecurityMiddlewares(app: Express): void {
  // 1. Request ID for traceability across all layers
  app.use(requestIdMiddleware);

  // 2. HTTP Request Logger
  app.use(requestLoggerMiddleware);

  // 3. Robust Helmet Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          fontSrc: ["'self'", 'https:', 'data:'],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          scriptSrcAttr: ["'none'"],
          styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
    })
  );

  // 4. Permissions-Policy Header
  app.use((_req, res, next) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(self), payment=(), usb=()'
    );
    next();
  });

  // 5. Strict CORS Policy
  app.use(createCorsMiddleware());

  // 6. Request Timeout (slowloris & runaway protection)
  app.use(requestTimeoutMiddleware());

  // 7. Response Compression
  app.use(
    compression({
      threshold: 1024, // only compress responses larger than 1kb
    })
  );

  // 8. JSON Body Parsing with strict size limits
  app.use(express.json({ limit: env.BODY_SIZE_LIMIT }));

  // 9. URL-encoded Body Parsing
  app.use(express.urlencoded({ extended: true, limit: env.BODY_SIZE_LIMIT }));

  // 10. Cookie Parser
  app.use(cookieParser());

  // 11. NoSQL Injection Protection across body, query, and params
  app.use(nosqlSanitizerMiddleware());

  // 12. HTTP Parameter Pollution Protection
  app.use(hppMiddleware());

  // 13. Distributed Rate Limiting (Redis-backed with in-memory fallback)
  app.use(globalRateLimiter);
}
