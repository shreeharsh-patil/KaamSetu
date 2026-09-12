import { Router } from 'express';
import {
  listTransactions,
  createAdjustment,
} from './transaction.controller.js';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { UserRole } from '@kaamsetu/types';

export const transactionRoutes = Router();

// List financial ledger transactions
transactionRoutes.get(
  '/',
  authenticate(),
  requireRole(UserRole.WORKER, UserRole.ADMIN),
  asyncHandler(listTransactions)
);

// Privileged adjustment endpoint (Admin only)
transactionRoutes.post(
  '/adjustment',
  authenticate(),
  requireRole(UserRole.ADMIN),
  asyncHandler(createAdjustment)
);
