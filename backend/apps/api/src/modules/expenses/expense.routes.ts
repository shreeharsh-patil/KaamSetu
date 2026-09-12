import { Router } from 'express';
import {
  createExpense,
  listExpenses,
  updateExpense,
  deleteExpense,
} from './expense.controller.js';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { UserRole } from '@kaamsetu/types';

export const expenseRoutes = Router();

// All expense routes require authentication and worker (or admin) role
expenseRoutes.post(
  '/',
  authenticate(),
  requireRole(UserRole.WORKER, UserRole.ADMIN),
  asyncHandler(createExpense)
);

expenseRoutes.get(
  '/',
  authenticate(),
  requireRole(UserRole.WORKER, UserRole.ADMIN),
  asyncHandler(listExpenses)
);

expenseRoutes.patch(
  '/:id',
  authenticate(),
  requireRole(UserRole.WORKER, UserRole.ADMIN),
  asyncHandler(updateExpense)
);

expenseRoutes.delete(
  '/:id',
  authenticate(),
  requireRole(UserRole.WORKER, UserRole.ADMIN),
  asyncHandler(deleteExpense)
);
