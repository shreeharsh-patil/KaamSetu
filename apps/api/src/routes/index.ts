import { Router } from 'express';
import { healthRoutes } from '../modules/health/health.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { env } from '../config/index.js';

export function createApiRouter(): Router {
  const router = Router();

  // Root level health endpoints (used by Docker, Kubernetes, AWS ALB, ECS)
  router.use('/', healthRoutes);

  // API version namespace (/api/v1)
  const apiV1Router = Router();

  // Health check under /api/v1/health
  apiV1Router.use('/', healthRoutes);

  // Auth endpoints under /api/v1/auth
  apiV1Router.use('/auth', authRoutes);

  // Mount API version router
  router.use(env.API_PREFIX, apiV1Router);

  return router;
}
