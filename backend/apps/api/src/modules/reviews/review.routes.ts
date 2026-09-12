import { Router } from 'express';
import {
  createReview,
  listReviews,
  getReviewById,
  getWorkerReviews,
  getJobReviews,
} from './review.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const reviewRoutes = Router();

// Submit review (requires auth)
reviewRoutes.post('/', authenticate(), asyncHandler(createReview));

// Public / authenticated review reading
reviewRoutes.get('/', asyncHandler(listReviews));
reviewRoutes.get('/workers/:workerId', asyncHandler(getWorkerReviews));
reviewRoutes.get('/jobs/:jobId', asyncHandler(getJobReviews));
reviewRoutes.get('/:id', asyncHandler(getReviewById));
