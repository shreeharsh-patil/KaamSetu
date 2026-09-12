import { Router } from 'express';
import {
  getMyWorkerProfile,
  updateMyWorkerProfile,
  updateWorkerLocation,
  updateWorkerAvailability,
  updateWorkerServiceRadius,
  addWorkerSkill,
  removeWorkerSkill,
  getPublicWorkerProfile,
  enrollWorker,
} from './worker-profile.controller.js';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { UserRole } from '@kaamsetu/types';

export const workerRoutes = Router();

// Controlled CUSTOMER -> WORKER transition. The payload cannot select a staff role.
workerRoutes.post(
  '/enroll',
  authenticate(),
  requireRole(UserRole.CUSTOMER, UserRole.WORKER),
  asyncHandler(enrollWorker)
);

// Authenticated Worker endpoints
workerRoutes.get('/me', authenticate(), requireRole(UserRole.WORKER), asyncHandler(getMyWorkerProfile));
workerRoutes.patch('/me', authenticate(), requireRole(UserRole.WORKER), asyncHandler(updateMyWorkerProfile));

workerRoutes.put(
  '/me/location',
  authenticate(),
  requireRole(UserRole.WORKER),
  asyncHandler(updateWorkerLocation)
);
workerRoutes.put(
  '/me/availability',
  authenticate(),
  requireRole(UserRole.WORKER),
  asyncHandler(updateWorkerAvailability)
);
workerRoutes.put(
  '/me/service-radius',
  authenticate(),
  requireRole(UserRole.WORKER),
  asyncHandler(updateWorkerServiceRadius)
);

workerRoutes.post('/me/skills', authenticate(), requireRole(UserRole.WORKER), asyncHandler(addWorkerSkill));
workerRoutes.delete(
  '/me/skills/:skillId',
  authenticate(),
  requireRole(UserRole.WORKER),
  asyncHandler(removeWorkerSkill)
);

// Public Sanitized Worker Profile
workerRoutes.get('/:workerId', asyncHandler(getPublicWorkerProfile));
