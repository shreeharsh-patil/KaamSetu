import { Router } from 'express';
import {
  createJob,
  listJobs,
  getJob,
  updateJob,
  publishJob,
  cancelJob,
  getJobEvents,
  startTravel,
  arrive,
  startJob,
  completeJob,
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
  requireRole(UserRole.CUSTOMER, UserRole.WORKER, UserRole.SUPPORT, UserRole.ADMIN),
  asyncHandler(listJobs)
);

// GET /api/v1/jobs/:id - Job details
router.get(
  '/:id',
  authenticate(),
  requireRole(UserRole.CUSTOMER, UserRole.WORKER, UserRole.SUPPORT, UserRole.ADMIN),
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
  requireRole(UserRole.CUSTOMER, UserRole.WORKER, UserRole.SUPPORT, UserRole.ADMIN),
  asyncHandler(cancelJob)
);

// GET /api/v1/jobs/:id/events - Job event audit trail
router.get(
  '/:id/events',
  authenticate(),
  requireRole(UserRole.CUSTOMER, UserRole.WORKER, UserRole.ADMIN),
  asyncHandler(getJobEvents)
);

// POST /api/v1/jobs/:id/start-travel - Assigned worker starts travel
router.post(
  '/:id/start-travel',
  authenticate(),
  requireRole(UserRole.WORKER, UserRole.ADMIN),
  asyncHandler(startTravel)
);

// POST /api/v1/jobs/:id/arrive - Assigned worker arrives at customer site
router.post(
  '/:id/arrive',
  authenticate(),
  requireRole(UserRole.WORKER, UserRole.ADMIN),
  asyncHandler(arrive)
);

// POST /api/v1/jobs/:id/start - Assigned worker starts work
router.post(
  '/:id/start',
  authenticate(),
  requireRole(UserRole.WORKER, UserRole.ADMIN),
  asyncHandler(startJob)
);

// POST /api/v1/jobs/:id/complete - Assigned worker completes work
router.post(
  '/:id/complete',
  authenticate(),
  requireRole(UserRole.WORKER, UserRole.ADMIN),
  asyncHandler(completeJob)
);

export const jobRoutes: Router = router;
