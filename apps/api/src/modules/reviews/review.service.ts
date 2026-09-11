import { Types } from 'mongoose';
import {
  JobStatus,
  type IReviewEntity,
  type CursorPage,
} from '@kaamsetu/types';
import type {
  CreateReviewInputDto,
  ListReviewsQueryDto,
} from '@kaamsetu/validation';
import { IReviewRepository, reviewRepository } from './review.repository.js';
import { IJobRepository, jobRepository } from '../jobs/job.repository.js';
import { WorkerProfileModel } from '../worker-profiles/worker-profile.model.js';
import { CustomerProfileModel } from '../customer-profiles/customer-profile.model.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
} from '../../errors/index.js';
import { withTransaction } from '../../database/transaction.js';

export class ReviewService {
  constructor(
    private readonly reviewRepo: IReviewRepository = reviewRepository,
    private readonly jobRepo: IJobRepository = jobRepository
  ) {}

  /**
   * Submit a review for a completed job.
   * Concurrency-safe: writes review and recalculates reviewee's aggregate rating.
   */
  async createReview(
    reviewerId: string,
    input: CreateReviewInputDto
  ): Promise<IReviewEntity> {
    if (!Types.ObjectId.isValid(reviewerId)) {
      throw new BadRequestError('Invalid reviewer ID format');
    }
    if (!Types.ObjectId.isValid(input.jobId)) {
      throw new BadRequestError('Invalid job ID format');
    }

    const job = await this.jobRepo.findById(input.jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // Rule: Only completed jobs permit reviews
    if (job.status !== JobStatus.COMPLETED) {
      throw new ConflictError(
        `Reviews are only permitted for COMPLETED jobs (current status: ${job.status})`
      );
    }

    // Rule: Only participants (customer or assigned worker) can review
    const isCustomer = job.customerId === reviewerId;
    const isWorker = job.assignedWorkerId === reviewerId;

    if (!isCustomer && !isWorker) {
      throw new ForbiddenError('Only participants involved in this completed job may submit reviews');
    }

    const revieweeId = isCustomer ? job.assignedWorkerId : job.customerId;
    if (!revieweeId) {
      throw new BadRequestError('Cannot determine reviewee for this job');
    }

    // Rule: One review per reviewer per job
    const existing = await this.reviewRepo.findByJobAndReviewer(job.id, reviewerId);
    if (existing) {
      throw new ConflictError('You have already submitted a review for this job');
    }

    // Create review inside atomic transaction (with standalone fallback)
    const review = await withTransaction(async (session) => {
      return this.reviewRepo.create(
        {
          jobId: job.id,
          reviewerId,
          revieweeId,
          rating: input.rating,
          quality: input.quality,
          punctuality: input.punctuality,
          communication: input.communication,
          comment: input.comment,
        },
        session ?? undefined
      );
    });

    // Concurrency-safe recalculation of reviewee's aggregate rating
    await this.recalculateRating(revieweeId);

    return review;
  }

  /**
   * Recalculates and updates aggregate ratings on worker and customer profiles safely.
   */
  async recalculateRating(userId: string): Promise<void> {
    const { average, count } = await this.reviewRepo.aggregateRatingForUser(userId);

    await Promise.all([
      WorkerProfileModel.updateOne(
        { userId: new Types.ObjectId(userId) },
        { $set: { 'rating.average': average, 'rating.count': count } }
      ).exec(),
      CustomerProfileModel.updateOne(
        { userId: new Types.ObjectId(userId) },
        { $set: { 'rating.average': average, 'rating.count': count } }
      ).exec(),
    ]);
  }

  /**
   * List reviews with cursor pagination.
   */
  async listReviews(query: ListReviewsQueryDto): Promise<CursorPage<IReviewEntity>> {
    return this.reviewRepo.listReviewsCursor(query);
  }

  /**
   * Get review by ID.
   */
  async getReviewById(id: string): Promise<IReviewEntity> {
    const review = await this.reviewRepo.findById(id);
    if (!review) {
      throw new NotFoundError('Review not found');
    }
    return review;
  }
}

export const reviewService = new ReviewService();
