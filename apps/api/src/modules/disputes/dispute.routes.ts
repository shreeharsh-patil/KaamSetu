import { Router } from 'express';
import {
  createDispute,
  getMyDisputes,
  listDisputes,
  getDisputeById,
  resolveDispute,
} from './dispute.controller.js';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { UserRole } from '@kaamsetu/types';

export const disputeRoutes = Router();

// Raise a dispute (Job participants)
disputeRoutes.post('/', authenticate(), asyncHandler(createDispute));

// View disputes involving authenticated user
disputeRoutes.get('/me', authenticate(), asyncHandler(getMyDisputes));

// List all disputes (Admin / Support only)
disputeRoutes.get(
  '/',
  authenticate(),
  requireRole(UserRole.ADMIN, UserRole.SUPPORT),
  asyncHandler(listDisputes)
);

// View specific dispute
disputeRoutes.get('/:id', authenticate(), asyncHandler(getDisputeById));

// Admin / Support resolves or rejects a dispute
disputeRoutes.patch(
  '/:id/resolve',
  authenticate(),
  requireRole(UserRole.ADMIN, UserRole.SUPPORT),
  asyncHandler(resolveDispute)
);
