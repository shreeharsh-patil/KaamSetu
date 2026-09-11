import { Types, ClientSession, FilterQuery } from 'mongoose';
import { DisputeModel, toDisputeEntity, IDisputeDocument } from './dispute.model.js';
import type {
  IDisputeEntity,
  ICreateDisputeInput,
  IResolveDisputeInput,
  ListDisputesFilters,
  CursorPage,
} from '@kaamsetu/types';

export interface IDisputeRepository {
  create(
    data: ICreateDisputeInput & { respondentId: string },
    session?: ClientSession
  ): Promise<IDisputeEntity>;
  findById(id: string): Promise<IDisputeEntity | null>;
  findByJobId(jobId: string): Promise<IDisputeEntity[]>;
  listDisputesCursor(filters: ListDisputesFilters): Promise<CursorPage<IDisputeEntity>>;
  updateResolution(
    id: string,
    data: IResolveDisputeInput,
    session?: ClientSession
  ): Promise<IDisputeEntity | null>;
}

export class DisputeRepository implements IDisputeRepository {
  async create(
    data: ICreateDisputeInput & { respondentId: string },
    session?: ClientSession
  ): Promise<IDisputeEntity> {
    const docs = await DisputeModel.create(
      [
        {
          jobId: new Types.ObjectId(data.jobId),
          initiatorId: new Types.ObjectId(data.initiatorId),
          respondentId: new Types.ObjectId(data.respondentId),
          reason: data.reason,
          description: data.description.trim(),
          evidence: data.evidence ?? undefined,
        },
      ],
      { session }
    );

    return toDisputeEntity(docs[0]!);
  }

  async findById(id: string): Promise<IDisputeEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await DisputeModel.findById(id).exec();
    return doc ? toDisputeEntity(doc) : null;
  }

  async findByJobId(jobId: string): Promise<IDisputeEntity[]> {
    if (!Types.ObjectId.isValid(jobId)) return [];
    const docs = await DisputeModel.find({ jobId: new Types.ObjectId(jobId) })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map(toDisputeEntity);
  }

  async listDisputesCursor(filters: ListDisputesFilters): Promise<CursorPage<IDisputeEntity>> {
    const limit = Math.min(Math.max(1, filters.limit ?? 20), 50);
    const query: FilterQuery<IDisputeDocument> = {};

    if (filters.jobId && Types.ObjectId.isValid(filters.jobId)) {
      query.jobId = new Types.ObjectId(filters.jobId);
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.userId && Types.ObjectId.isValid(filters.userId)) {
      const uId = new Types.ObjectId(filters.userId);
      query.$or = [{ initiatorId: uId }, { respondentId: uId }];
    }

    if (filters.cursor) {
      try {
        const decoded = JSON.parse(
          Buffer.from(filters.cursor, 'base64url').toString('utf8')
        ) as { createdAt: string; id: string };

        const cursorDate = new Date(decoded.createdAt);
        const cursorId = new Types.ObjectId(decoded.id);

        const andConditions = query.$or ? [{ $or: query.$or }] : [];
        query.$and = [
          ...andConditions,
          {
            $or: [
              { createdAt: { $lt: cursorDate } },
              { createdAt: cursorDate, _id: { $lt: cursorId } },
            ],
          },
        ];
        delete query.$or;
      } catch {
        // Fallback to first page
      }
    }

    const docs = await DisputeModel.find(query)
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
      items: docs.map(toDisputeEntity),
      nextCursor,
      hasMore,
    };
  }

  async updateResolution(
    id: string,
    data: IResolveDisputeInput,
    session?: ClientSession
  ): Promise<IDisputeEntity | null> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(data.resolvedBy)) return null;

    const doc = await DisputeModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: data.status,
          resolution: {
            summary: data.resolution.summary,
            refundPaise: data.resolution.refundPaise,
            actionTaken: data.resolution.actionTaken,
          },
          resolvedBy: new Types.ObjectId(data.resolvedBy),
          resolvedAt: new Date(),
        },
      },
      { new: true, session }
    ).exec();

    return doc ? toDisputeEntity(doc) : null;
  }
}

export const disputeRepository = new DisputeRepository();
