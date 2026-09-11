import { Router } from 'express';
import { healthRoutes } from '../modules/health/health.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { workerRoutes } from '../modules/worker-profiles/worker-profile.routes.js';
import { customerRoutes } from '../modules/customer-profiles/customer-profile.routes.js';
import { jobRoutes } from '../modules/jobs/job.routes.js';
import { offerRoutes } from '../modules/job-offers/job-offer.routes.js';
import { getWorkerOffers } from '../modules/job-offers/job-offer.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { UserRole } from '@kaamsetu/types';
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

  // Worker profile endpoints under /api/v1/workers
  apiV1Router.use('/workers', workerRoutes);

  // Customer profile endpoints under /api/v1/customers
  apiV1Router.use('/customers', customerRoutes);

  // Job lifecycle endpoints under /api/v1/jobs (Phase 4)
  apiV1Router.use('/jobs', jobRoutes);

  // Worker offers list endpoint under /api/v1/worker/offers (Phase 5)
  apiV1Router.get(
    '/worker/offers',
    authenticate(),
    requireRole(UserRole.WORKER, UserRole.ADMIN),
    asyncHandler(getWorkerOffers)
  );

  // Job offer endpoints under /api/v1/offers (Phase 5)
  apiV1Router.use('/offers', offerRoutes);

  // Mount API version router
  router.use(env.API_PREFIX, apiV1Router);

  return router;
}
