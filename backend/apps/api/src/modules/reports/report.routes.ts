import { Router } from 'express';
import {
  createReport,
  getMyReports,
  listReports,
  getReportById,
  updateReport,
} from './report.controller.js';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { UserRole } from '@kaamsetu/types';

export const reportRoutes = Router();

// Submit a new report (any authenticated user)
reportRoutes.post('/', authenticate(), asyncHandler(createReport));

// View reports filed by authenticated user
reportRoutes.get('/me', authenticate(), asyncHandler(getMyReports));

// List all reports (Admin / Support only)
reportRoutes.get(
  '/',
  authenticate(),
  requireRole(UserRole.ADMIN, UserRole.SUPPORT),
  asyncHandler(listReports)
);

// View specific report
reportRoutes.get('/:id', authenticate(), asyncHandler(getReportById));

// Admin / Support update or resolve report
reportRoutes.patch(
  '/:id',
  authenticate(),
  requireRole(UserRole.ADMIN, UserRole.SUPPORT),
  asyncHandler(updateReport)
);
