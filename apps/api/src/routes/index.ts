import { Router } from 'express';
import { healthRoutes } from '../modules/health/health.routes.js';
import { env } from '../config/index.js';

export function createApiRouter(): Router {
  const router = Router();

  // Root level health endpoints (used by Docker, Kubernetes, AWS ALB, ECS)
  router.use('/', healthRoutes);

  // API version namespace (/api/v1)
  const apiV1Router = Router();
  // Health also accessible under /api/v1/health
  apiV1Router.use('/', healthRoutes);

  // Future business modules will be mounted here (e.g. /api/v1/workers, /api/v1/jobs)

  router.use(env.API_PREFIX, apiV1Router);

  return router;
}
