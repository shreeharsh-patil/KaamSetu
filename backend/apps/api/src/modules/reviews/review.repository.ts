import { Types, ClientSession, FilterQuery } from 'mongoose';
import { ReviewModel, toReviewEntity, IReviewDocument } from './review.model.js';
import type {
  IReviewEntity,
  ICreateReviewInput,
  ListReviewsFilters,
  CursorPage,
} from '@kaamsetu/types';

export interface IReviewRepository {
  create(
    data: ICreateReviewInput & { revieweeId: string },
    session?: ClientSession
  ): Promise<IReviewEntity>;
  findById(id: string): Promise<IReviewEntity | null>;
  findByJobAndReviewer(jobId: string, reviewerId: string): Promise<IReviewEntity | null>;
  listReviewsCursor(filters: ListReviewsFilters): Promise<CursorPage<IReviewEntity>>;
  aggregateRatingForUser(userId: string): Promise<{ average: number; count: number }>;
}

export class ReviewRepository implements IReviewRepository {
  async create(
    data: ICreateReviewInput & { revieweeId: string },
    session?: ClientSession
  ): Promise<IReviewEntity> {
    const docs = await ReviewModel.create(
      [
        {
          jobId: new Types.ObjectId(data.jobId),
          reviewerId: new Types.ObjectId(data.reviewerId),
          revieweeId: new Types.ObjectId(data.revieweeId),
          rating: data.rating,
          quality: data.quality ?? null,
          punctuality: data.punctuality ?? null,
          communication: data.communication ?? null,
          comment: data.comment ? data.comment.trim() : null,
          createdAt: new Date(),
        },
      ],
      { session }
    );

    return toReviewEntity(docs[0]!);
  }

  async findById(id: string): Promise<IReviewEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await ReviewModel.findById(id).exec();
    return doc ? toReviewEntity(doc) : null;
  }

  async findByJobAndReviewer(jobId: string, reviewerId: string): Promise<IReviewEntity | null> {
    if (!Types.ObjectId.isValid(jobId) || !Types.ObjectId.isValid(reviewerId)) return null;
    const doc = await ReviewModel.findOne({
      jobId: new Types.ObjectId(jobId),
      reviewerId: new Types.ObjectId(reviewerId),
    }).exec();
    return doc ? toReviewEntity(doc) : null;
  }

  async listReviewsCursor(filters: ListReviewsFilters): Promise<CursorPage<IReviewEntity>> {
    const limit = Math.min(Math.max(1, filters.limit ?? 20), 50);
    const query: FilterQuery<IReviewDocument> = {};

    if (filters.revieweeId && Types.ObjectId.isValid(filters.revieweeId)) {
      query.revieweeId = new Types.ObjectId(filters.revieweeId);
    }
    if (filters.reviewerId && Types.ObjectId.isValid(filters.reviewerId)) {
      query.reviewerId = new Types.ObjectId(filters.reviewerId);
    }
    if (filters.jobId && Types.ObjectId.isValid(filters.jobId)) {
      query.jobId = new Types.ObjectId(filters.jobId);
    }

    if (filters.cursor) {
      try {
        const decoded = JSON.parse(
          Buffer.from(filters.cursor, 'base64url').toString('utf8')
        ) as { createdAt: string; id: string };

        const cursorDate = new Date(decoded.createdAt);
        const cursorId = new Types.ObjectId(decoded.id);

        query.$or = [
          { createdAt: { $lt: cursorDate } },
          { createdAt: cursorDate, _id: { $lt: cursorId } },
        ];
      } catch {
        // Fallback to first page
      }
    }

    const docs = await ReviewModel.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = docs.length > limit;
    if (hasMore) {
      docs.pop();
    }

    let nextCursor: string | null = null;
    if (hasMore && docs.length > 0) {
      const last = docs[docs.length - 1];
      if (last) {
        nextCursor = Buffer.from(
          JSON.stringify({
            createdAt: last.createdAt.toISOString(),
            id: last._id.toString(),
          })
        ).toString('base64url');
      }
    }

    return {
      items: docs.map(toReviewEntity),
      nextCursor,
      hasMore,
    };
  }

  async aggregateRatingForUser(userId: string): Promise<{ average: number; count: number }> {
    if (!Types.ObjectId.isValid(userId)) {
      return { average: 0, count: 0 };
    }

    const result = await ReviewModel.aggregate([
      { $match: { revieweeId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalCount: { $sum: 1 },
        },
      },
    ]).exec();

    if (!result || result.length === 0) {
      return { average: 0, count: 0 };
    }

    const rawAvg = result[0].avgRating ?? 0;
    const count = result[0].totalCount ?? 0;
    const average = Math.round(rawAvg * 10) / 10; // Round to 1 decimal place (e.g. 4.8)

    return { average, count };
  }
}

export const reviewRepository = new ReviewRepository();
