import { Request, Response } from 'express';
import { reviewService } from './review.service.js';
import {
  createReviewSchema,
  listReviewsQuerySchema,
} from '@kaamsetu/validation';
import { UnauthorizedError, BadRequestError } from '../../errors/index.js';

export async function createReview(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const validatedData = createReviewSchema.parse(req.body);
  const review = await reviewService.createReview(req.user.id, validatedData);

  res.status(201).json({
    success: true,
    data: review,
  });
}

export async function listReviews(req: Request, res: Response): Promise<void> {
  const validatedQuery = listReviewsQuerySchema.parse(req.query);
  const result = await reviewService.listReviews(validatedQuery);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getReviewById(req: Request, res: Response): Promise<void> {
  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) {
    throw new BadRequestError('Review ID parameter is required');
  }

  const review = await reviewService.getReviewById(id);

  res.status(200).json({
    success: true,
    data: review,
  });
}

export async function getWorkerReviews(req: Request, res: Response): Promise<void> {
  const rawWorkerId = req.params['workerId'];
  const workerId = Array.isArray(rawWorkerId) ? rawWorkerId[0] : rawWorkerId;
  if (!workerId) {
    throw new BadRequestError('Worker ID parameter is required');
  }

  const validatedQuery = listReviewsQuerySchema.parse({
    ...req.query,
    revieweeId: workerId,
  });
  const result = await reviewService.listReviews(validatedQuery);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getJobReviews(req: Request, res: Response): Promise<void> {
  const rawJobId = req.params['jobId'];
  const jobId = Array.isArray(rawJobId) ? rawJobId[0] : rawJobId;
  if (!jobId) {
    throw new BadRequestError('Job ID parameter is required');
  }

  const validatedQuery = listReviewsQuerySchema.parse({
    ...req.query,
    jobId,
  });
  const result = await reviewService.listReviews(validatedQuery);

  res.status(200).json({
    success: true,
    data: result,
  });
}
