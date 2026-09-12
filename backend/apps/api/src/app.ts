import express, { Express } from 'express';
import { applySecurityMiddlewares } from './middlewares/security.js';
import { createApiRouter } from './routes/index.js';
import { notFoundMiddleware } from './middlewares/not-found.js';
import { errorHandlerMiddleware } from './middlewares/error-handler.js';

export function createApp(): Express {
  const app = express();

  // Disable x-powered-by header
  app.disable('x-powered-by');

  // Trust reverse proxy (needed behind Nginx, AWS ALB, Cloudflare)
  app.set('trust proxy', 1);

  // Apply security, compression, cors, body parsers, logging and request-id
  applySecurityMiddlewares(app);

  // Mount API and health routes
  app.use(createApiRouter());

  // Handle 404 Not Found
  app.use(notFoundMiddleware);

  // Centralized Global Error Handler
  app.use(errorHandlerMiddleware);

  return app;
}

export const app: Express = createApp();
