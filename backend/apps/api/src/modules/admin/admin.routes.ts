import { Router } from 'express';
import {
  listUsers,
  getStats,
  getUserById,
  suspendUser,
  restoreUser,
  changeUserRole,
  listWorkers,
  approveVerification,
  rejectVerification,
  listJobs,
  listReports,
  listDisputes,
  createFinancialAdjustment,
  createCategory,
  updateCategory,
  createSkill,
  updateSkill,
  listAuditLogs,
} from './admin.controller.js';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { UserRole } from '@kaamsetu/types';

export const adminRoutes = Router();

adminRoutes.get(
  '/stats',
  authenticate(),
  requireRole(UserRole.ADMIN, UserRole.SUPPORT),
  asyncHandler(getStats)
);

// -------------------------------------------------------------
// 1. User Management Endpoints
// -------------------------------------------------------------

// List users (ADMIN and SUPPORT)
adminRoutes.get(
  '/users',
  authenticate(),
  requireRole(UserRole.ADMIN, UserRole.SUPPORT),
  asyncHandler(listUsers)
);

// Get user detail (ADMIN and SUPPORT)
adminRoutes.get(
  '/users/:id',
  authenticate(),
  requireRole(UserRole.ADMIN, UserRole.SUPPORT),
  asyncHandler(getUserById)
);

// Suspend user (ADMIN only)
adminRoutes.post(
  '/users/:id/suspend',
  authenticate(),
  requireRole(UserRole.ADMIN),
  asyncHandler(suspendUser)
);

// Restore user (ADMIN only)
adminRoutes.post(
  '/users/:id/restore',
  authenticate(),
  requireRole(UserRole.ADMIN),
  asyncHandler(restoreUser)
);

// Change user role (ADMIN only)
adminRoutes.post(
  '/users/:id/role',
  authenticate(),
  requireRole(UserRole.ADMIN),
  asyncHandler(changeUserRole)
);

// -------------------------------------------------------------
// 2. Worker & Verification Endpoints
// -------------------------------------------------------------

// List worker profiles (ADMIN and SUPPORT)
adminRoutes.get(
  '/workers',
  authenticate(),
  requireRole(UserRole.ADMIN, UserRole.SUPPORT),
  asyncHandler(listWorkers)
);

// Approve worker verification (ADMIN only)
adminRoutes.post(
  '/verifications/:id/approve',
  authenticate(),
  requireRole(UserRole.ADMIN),
  asyncHandler(approveVerification)
);

// Reject worker verification (ADMIN only)
adminRoutes.post(
  '/verifications/:id/reject',
  authenticate(),
  requireRole(UserRole.ADMIN),
  asyncHandler(rejectVerification)
);

// -------------------------------------------------------------
// 3. Operational Monitoring Endpoints
// -------------------------------------------------------------

// List jobs (ADMIN and SUPPORT)
adminRoutes.get(
  '/jobs',
  authenticate(),
  requireRole(UserRole.ADMIN, UserRole.SUPPORT),
  asyncHandler(listJobs)
);

// List trust & safety reports (ADMIN and SUPPORT)
adminRoutes.get(
  '/reports',
  authenticate(),
  requireRole(UserRole.ADMIN, UserRole.SUPPORT),
  asyncHandler(listReports)
);

// List disputes (ADMIN and SUPPORT)
adminRoutes.get(
  '/disputes',
  authenticate(),
  requireRole(UserRole.ADMIN, UserRole.SUPPORT),
  asyncHandler(listDisputes)
);

// -------------------------------------------------------------
// 4. Financial Adjustments
// -------------------------------------------------------------

// Create financial adjustment (ADMIN only)
adminRoutes.post(
  '/financial-adjustments',
  authenticate(),
  requireRole(UserRole.ADMIN),
  asyncHandler(createFinancialAdjustment)
);

// -------------------------------------------------------------
// 5. Taxonomy Management: Categories & Skills
// -------------------------------------------------------------

// Create service category (ADMIN only)
adminRoutes.post(
  '/categories',
  authenticate(),
  requireRole(UserRole.ADMIN),
  asyncHandler(createCategory)
);

// Update service category (ADMIN only)
adminRoutes.patch(
  '/categories/:id',
  authenticate(),
  requireRole(UserRole.ADMIN),
  asyncHandler(updateCategory)
);

// Create skill (ADMIN only)
adminRoutes.post(
  '/skills',
  authenticate(),
  requireRole(UserRole.ADMIN),
  asyncHandler(createSkill)
);

// Update skill (ADMIN only)
adminRoutes.patch(
  '/skills/:id',
  authenticate(),
  requireRole(UserRole.ADMIN),
  asyncHandler(updateSkill)
);

// -------------------------------------------------------------
// 6. Immutable Audit Log Trail
// -------------------------------------------------------------

// List immutable audit logs (ADMIN only - SUPPORT forbidden)
adminRoutes.get(
  '/audit-logs',
  authenticate(),
  requireRole(UserRole.ADMIN),
  asyncHandler(listAuditLogs)
);
