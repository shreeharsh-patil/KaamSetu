import { Router } from 'express';
import {
  getWorkerOffers,
  getOfferById,
  acceptOffer,
  rejectOffer,
} from './job-offer.controller.js';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { UserRole } from '@kaamsetu/types';

const router = Router();

// Worker offers list
router.get(
  '/worker/offers',
  authenticate(),
  requireRole(UserRole.WORKER, UserRole.ADMIN),
  asyncHandler(getWorkerOffers)
);

// Get offer details
router.get(
  '/:id',
  authenticate(),
  requireRole(UserRole.WORKER, UserRole.CUSTOMER, UserRole.ADMIN),
  asyncHandler(getOfferById)
);

// Accept offer
router.post(
  '/:id/accept',
  authenticate(),
  requireRole(UserRole.WORKER),
  asyncHandler(acceptOffer)
);

// Reject offer
router.post(
  '/:id/reject',
  authenticate(),
  requireRole(UserRole.WORKER),
  asyncHandler(rejectOffer)
);

export const offerRoutes = router;
