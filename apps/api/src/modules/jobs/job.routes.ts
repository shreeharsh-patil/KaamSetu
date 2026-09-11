import { Router } from 'express';
import {
  createJob,
  listJobs,
  getJob,
  updateJob,
  publishJob,
  cancelJob,
  getJobEvents,
} from './job.controller.js';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { UserRole } from '@kaamsetu/types';

const router: Router = Router();

// POST /api/v1/jobs - Customers and Admins only
router.post(
  '/',
  authenticate(),
  requireRole(UserRole.CUSTOMER, UserRole.ADMIN),
  asyncHandler(createJob)
);

// GET /api/v1/jobs - Authenticated users
router.get(
  '/',
  authenticate(),
  requireRole(UserRole.CUSTOMER, UserRole.WORKER, UserRole.ADMIN),
  asyncHandler(listJobs)
);

// GET /api/v1/jobs/:id - Job details
router.get(
  '/:id',
  authenticate(),
  requireRole(UserRole.CUSTOMER, UserRole.WORKER, UserRole.ADMIN),
  asyncHandler(getJob)
);

// PATCH /api/v1/jobs/:id - Edit job (Customer/Admin only)
router.patch(
  '/:id',
  authenticate(),
  requireRole(UserRole.CUSTOMER, UserRole.ADMIN),
  asyncHandler(updateJob)
);

// POST /api/v1/jobs/:id/publish - Publish job
router.post(
  '/:id/publish',
  authenticate(),
  requireRole(UserRole.CUSTOMER, UserRole.ADMIN),
  asyncHandler(publishJob)
);

// POST /api/v1/jobs/:id/cancel - Cancel job
router.post(
  '/:id/cancel',
  authenticate(),
  requireRole(UserRole.CUSTOMER, UserRole.WORKER, UserRole.ADMIN),
  asyncHandler(cancelJob)
);

// GET /api/v1/jobs/:id/events - Job event audit trail
router.get(
  '/:id/events',
  authenticate(),
  requireRole(UserRole.CUSTOMER, UserRole.WORKER, UserRole.ADMIN),
  asyncHandler(getJobEvents)
);

export const jobRoutes: Router = router;
