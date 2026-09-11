import { Types, ClientSession, FilterQuery } from 'mongoose';
import {
  type IJobOfferEntity,
  type ICreateJobOfferInput,
  type ListJobOffersFilters,
  type CursorPage,
  JobOfferStatus,
} from '@kaamsetu/types';
import { JobOfferModel, toJobOfferEntity, IJobOfferDocument } from './job-offer.model.js';

export interface IJobOfferRepository {
  create(data: ICreateJobOfferInput, session?: ClientSession): Promise<IJobOfferEntity>;
  createMany(dataList: ICreateJobOfferInput[], session?: ClientSession): Promise<IJobOfferEntity[]>;
  findById(id: string): Promise<IJobOfferEntity | null>;
  findByJobId(jobId: string): Promise<IJobOfferEntity[]>;
  findWorkerOffers(filters: ListJobOffersFilters): Promise<CursorPage<IJobOfferEntity>>;
  findExistingWorkerIdsForJob(jobId: string): Promise<string[]>;
  acceptOfferAtomic(
    offerId: string,
    workerId: string,
    session?: ClientSession
  ): Promise<IJobOfferEntity | null>;
  withdrawOtherOffersForJob(
    jobId: string,
    winningOfferId: string,
    session?: ClientSession
  ): Promise<number>;
  rejectOffer(
    offerId: string,
    workerId: string,
    session?: ClientSession
  ): Promise<IJobOfferEntity | null>;
}

export class MongoJobOfferRepository implements IJobOfferRepository {
  async create(data: ICreateJobOfferInput, session?: ClientSession): Promise<IJobOfferEntity> {
    const docData = {
      jobId: new Types.ObjectId(data.jobId),
      workerId: new Types.ObjectId(data.workerId),
      distanceKm: data.distanceKm,
      matchScore: data.matchScore,
      scoreBreakdown: data.scoreBreakdown,
      status: data.status ?? JobOfferStatus.PENDING,
      expiresAt: data.expiresAt,
    };

    if (session) {
      const [created] = await JobOfferModel.create([docData], { session });
      if (!created) {
        throw new Error('Failed to create JobOffer in transaction');
      }
      return toJobOfferEntity(created);
    }

    const created = await JobOfferModel.create(docData);
    return toJobOfferEntity(created);
  }

  async createMany(
    dataList: ICreateJobOfferInput[],
    session?: ClientSession
  ): Promise<IJobOfferEntity[]> {
    if (dataList.length === 0) return [];

    const docsData = dataList.map((d) => ({
      jobId: new Types.ObjectId(d.jobId),
      workerId: new Types.ObjectId(d.workerId),
      distanceKm: d.distanceKm,
      matchScore: d.matchScore,
      scoreBreakdown: d.scoreBreakdown,
      status: d.status ?? JobOfferStatus.PENDING,
      expiresAt: d.expiresAt,
    }));

    if (session) {
      const created = await JobOfferModel.create(docsData, { session });
      return created.map(toJobOfferEntity);
    }

    const created = await JobOfferModel.create(docsData);
    return created.map(toJobOfferEntity);
  }

  async findById(id: string): Promise<IJobOfferEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const doc = await JobOfferModel.findById(new Types.ObjectId(id)).exec();
    return doc ? toJobOfferEntity(doc) : null;
  }

  async findByJobId(jobId: string): Promise<IJobOfferEntity[]> {
    if (!Types.ObjectId.isValid(jobId)) return [];

    const docs = await JobOfferModel.find({ jobId: new Types.ObjectId(jobId) })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map(toJobOfferEntity);
  }

  async findExistingWorkerIdsForJob(jobId: string): Promise<string[]> {
    if (!Types.ObjectId.isValid(jobId)) return [];

    const docs = await JobOfferModel.find({ jobId: new Types.ObjectId(jobId) }, { workerId: 1 })
      .lean()
      .exec();

    return docs.map((d) => d.workerId.toString());
  }

  async findWorkerOffers(filters: ListJobOffersFilters): Promise<CursorPage<IJobOfferEntity>> {
    const limit = Math.min(filters.limit ?? 20, 50);
    const query: FilterQuery<IJobOfferDocument> = {};

    if (filters.workerId) {
      query.workerId = new Types.ObjectId(filters.workerId);
    }

    if (filters.jobId) {
      query.jobId = new Types.ObjectId(filters.jobId);
    }

    if (filters.status) {
      query.status = filters.status;
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
        // Invalid cursor falls back to first page
      }
    }

    const docs = await JobOfferModel.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = docs.length > limit;
    if (hasMore) {
      docs.pop();
    }

    let nextCursor: string | null = null;
    if (hasMore && docs.length > 0) {
      const lastDoc = docs[docs.length - 1];
      if (lastDoc) {
        nextCursor = Buffer.from(
          JSON.stringify({
            createdAt: lastDoc.createdAt.toISOString(),
            id: lastDoc._id.toString(),
          })
        ).toString('base64url');
      }
    }

    return {
      items: docs.map(toJobOfferEntity),
      nextCursor,
      hasMore,
    };
  }

  async acceptOfferAtomic(
    offerId: string,
    workerId: string,
    session?: ClientSession
  ): Promise<IJobOfferEntity | null> {
    if (!Types.ObjectId.isValid(offerId) || !Types.ObjectId.isValid(workerId)) {
      return null;
    }

    const now = new Date();
    const updated = await JobOfferModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(offerId),
        workerId: new Types.ObjectId(workerId),
        status: JobOfferStatus.PENDING,
        expiresAt: { $gt: now },
      },
      {
        $set: {
          status: JobOfferStatus.ACCEPTED,
          respondedAt: now,
        },
      },
      { new: true, session }
    ).exec();

    return updated ? toJobOfferEntity(updated) : null;
  }

  async withdrawOtherOffersForJob(
    jobId: string,
    winningOfferId: string,
    session?: ClientSession
  ): Promise<number> {
    if (!Types.ObjectId.isValid(jobId) || !Types.ObjectId.isValid(winningOfferId)) {
      return 0;
    }

    const res = await JobOfferModel.updateMany(
      {
        jobId: new Types.ObjectId(jobId),
        _id: { $ne: new Types.ObjectId(winningOfferId) },
        status: JobOfferStatus.PENDING,
      },
      {
        $set: {
          status: JobOfferStatus.WITHDRAWN,
        },
      },
      { session }
    ).exec();

    return res.modifiedCount;
  }

  async rejectOffer(
    offerId: string,
    workerId: string,
    session?: ClientSession
  ): Promise<IJobOfferEntity | null> {
    if (!Types.ObjectId.isValid(offerId) || !Types.ObjectId.isValid(workerId)) {
      return null;
    }

    const now = new Date();
    const updated = await JobOfferModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(offerId),
        workerId: new Types.ObjectId(workerId),
        status: JobOfferStatus.PENDING,
      },
      {
        $set: {
          status: JobOfferStatus.REJECTED,
          respondedAt: now,
        },
      },
      { new: true, session }
    ).exec();

    return updated ? toJobOfferEntity(updated) : null;
  }
}

export const jobOfferRepository = new MongoJobOfferRepository();
