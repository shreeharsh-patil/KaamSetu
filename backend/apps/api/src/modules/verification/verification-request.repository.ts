import { Types, ClientSession, FilterQuery } from 'mongoose';
import {
  VerificationRequestModel,
  toVerificationRequestEntity,
  IVerificationRequestDocument,
} from './verification-request.model.js';
import type {
  IVerificationRequestEntity,
  ICreateVerificationRequestInput,
  IReviewVerificationRequestInput,
  ListVerificationRequestsFilters,
  CursorPage,
} from '@kaamsetu/types';

export interface IVerificationRequestRepository {
  create(
    data: ICreateVerificationRequestInput,
    session?: ClientSession
  ): Promise<IVerificationRequestEntity>;
  findById(id: string): Promise<IVerificationRequestEntity | null>;
  listRequestsCursor(
    filters: ListVerificationRequestsFilters
  ): Promise<CursorPage<IVerificationRequestEntity>>;
  updateReview(
    id: string,
    data: IReviewVerificationRequestInput,
    session?: ClientSession
  ): Promise<IVerificationRequestEntity | null>;
}

export class VerificationRequestRepository implements IVerificationRequestRepository {
  async create(
    data: ICreateVerificationRequestInput,
    session?: ClientSession
  ): Promise<IVerificationRequestEntity> {
    const docs = await VerificationRequestModel.create(
      [
        {
          workerId: new Types.ObjectId(data.workerId),
          type: data.type,
          documents: data.documents.map((d) => ({
            key: d.key,
            url: d.url,
            mimeType: d.mimeType,
            documentType: d.documentType,
            uploadedAt: d.uploadedAt ?? new Date(),
          })),
        },
      ],
      { session }
    );

    return toVerificationRequestEntity(docs[0]!);
  }

  async findById(id: string): Promise<IVerificationRequestEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await VerificationRequestModel.findById(id).exec();
    return doc ? toVerificationRequestEntity(doc) : null;
  }

  async listRequestsCursor(
    filters: ListVerificationRequestsFilters
  ): Promise<CursorPage<IVerificationRequestEntity>> {
    const limit = Math.min(Math.max(1, filters.limit ?? 20), 50);
    const query: FilterQuery<IVerificationRequestDocument> = {};

    if (filters.workerId && Types.ObjectId.isValid(filters.workerId)) {
      query.workerId = new Types.ObjectId(filters.workerId);
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.type) {
      query.type = filters.type;
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

    const docs = await VerificationRequestModel.find(query)
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
      items: docs.map(toVerificationRequestEntity),
      nextCursor,
      hasMore,
    };
  }

  async updateReview(
    id: string,
    data: IReviewVerificationRequestInput,
    session?: ClientSession
  ): Promise<IVerificationRequestEntity | null> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(data.reviewerId)) return null;

    const doc = await VerificationRequestModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: data.status,
          reviewerId: new Types.ObjectId(data.reviewerId),
          reason: data.reason ?? null,
          reviewedAt: new Date(),
        },
      },
      { new: true, session }
    ).exec();

    return doc ? toVerificationRequestEntity(doc) : null;
  }
}

export const verificationRequestRepository = new VerificationRequestRepository();
