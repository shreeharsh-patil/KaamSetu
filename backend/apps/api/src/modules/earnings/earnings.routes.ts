import { Router } from 'express';
import {
  getEarningsSummary,
  getEarningsJobs,
} from './earnings.controller.js';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { UserRole } from '@kaamsetu/types';

export const earningsRoutes = Router();

// Worker earnings routes
earningsRoutes.get(
  '/summary',
  authenticate(),
  requireRole(UserRole.WORKER, UserRole.ADMIN),
  asyncHandler(getEarningsSummary)
);

earningsRoutes.get(
  '/jobs',
  authenticate(),
  requireRole(UserRole.WORKER, UserRole.ADMIN),
  asyncHandler(getEarningsJobs)
);
