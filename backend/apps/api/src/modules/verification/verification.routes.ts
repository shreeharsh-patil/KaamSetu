import { Router } from 'express';
import {
  submitVerification,
  getMyVerificationRequests,
  listVerificationRequests,
  getVerificationRequestById,
  reviewVerificationRequest,
} from './verification.controller.js';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { UserRole } from '@kaamsetu/types';

export const verificationRoutes = Router();

// Worker submits verification request
verificationRoutes.post(
  '/requests',
  authenticate(),
  requireRole(UserRole.WORKER),
  asyncHandler(submitVerification)
);

// Worker views their submitted verification requests
verificationRoutes.get(
  '/requests/me',
  authenticate(),
  requireRole(UserRole.WORKER),
  asyncHandler(getMyVerificationRequests)
);

// Admin / Support list all verification requests
verificationRoutes.get(
  '/requests',
  authenticate(),
  requireRole(UserRole.ADMIN, UserRole.SUPPORT),
  asyncHandler(listVerificationRequests)
);

// Get single verification request
verificationRoutes.get(
  '/requests/:id',
  authenticate(),
  asyncHandler(getVerificationRequestById)
);

// Admin / Support reviews verification request
verificationRoutes.patch(
  '/requests/:id/review',
  authenticate(),
  requireRole(UserRole.ADMIN, UserRole.SUPPORT),
  asyncHandler(reviewVerificationRequest)
);
