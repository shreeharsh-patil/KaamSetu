import { Types, ClientSession, FilterQuery } from 'mongoose';
import {
  type IJobEntity,
  type ICreateJobInput,
  type IUpdateJobInput,
  type ListJobsFilters,
  type CursorPage,
  JobStatus,
} from '@kaamsetu/types';
import { JobModel, toJobEntity, IJobDocument } from './job.model.js';

export interface IJobRepository {
  findById(id: string): Promise<IJobEntity | null>;
  create(
    data: ICreateJobInput & { status?: JobStatus },
    session?: ClientSession
  ): Promise<IJobEntity>;
  update(
    id: string,
    data: IUpdateJobInput,
    session?: ClientSession
  ): Promise<IJobEntity | null>;
  updateStatus(
    id: string,
    newStatus: JobStatus,
    extra?: { assignedWorkerId?: string | null },
    session?: ClientSession
  ): Promise<IJobEntity | null>;
  listJobsWithCursor(filters: ListJobsFilters): Promise<CursorPage<IJobEntity>>;
}

export class MongoJobRepository implements IJobRepository {
  async findById(id: string): Promise<IJobEntity | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const doc = await JobModel.findOne({ _id: new Types.ObjectId(id), deletedAt: null }).exec();
    return doc ? toJobEntity(doc) : null;
  }

  async create(
    data: ICreateJobInput & { status?: JobStatus },
    session?: ClientSession
  ): Promise<IJobEntity> {
    const jobDoc = {
      customerId: new Types.ObjectId(data.customerId),
      categoryId: new Types.ObjectId(data.categoryId),
      requiredSkills: (data.requiredSkills || []).map((id) => new Types.ObjectId(id)),
      title: data.title.trim(),
      description: data.description ? data.description.trim() : null,
      source: data.source ?? 'APP',
      location: {
        type: 'Point',
        coordinates: data.location.coordinates,
      },
      address: {
        line: data.address.line.trim(),
        city: data.address.city.trim(),
        state: data.address.state.trim(),
        pincode: data.address.pincode.trim(),
      },
      preferredTime: data.preferredTime,
      urgency: data.urgency,
      estimatedPrice: data.estimatedPrice ?? null,
      status: data.status ?? JobStatus.DRAFT,
      images: (data.images || []).map((img) => ({
        key: img.key,
        width: img.width,
        height: img.height,
        mimeType: img.mimeType,
      })),
    };

    if (session) {
      const [created] = await JobModel.create([jobDoc], { session });
      if (!created) {
        throw new Error('Failed to create Job document in transaction');
      }
      return toJobEntity(created);
    }

    const created = await JobModel.create(jobDoc);
    return toJobEntity(created);
  }

  async update(
    id: string,
    data: IUpdateJobInput,
    session?: ClientSession
  ): Promise<IJobEntity | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const updateFields: Record<string, unknown> = {};

    if (data.title !== undefined) updateFields['title'] = data.title.trim();
    if (data.description !== undefined)
      updateFields['description'] = data.description ? data.description.trim() : null;
    if (data.categoryId !== undefined)
      updateFields['categoryId'] = new Types.ObjectId(data.categoryId);
    if (data.requiredSkills !== undefined)
      updateFields['requiredSkills'] = data.requiredSkills.map((sid) => new Types.ObjectId(sid));
    if (data.preferredTime !== undefined) updateFields['preferredTime'] = data.preferredTime;
    if (data.urgency !== undefined) updateFields['urgency'] = data.urgency;
    if (data.estimatedPrice !== undefined) updateFields['estimatedPrice'] = data.estimatedPrice;
    if (data.location !== undefined) {
      updateFields['location'] = {
        type: 'Point',
        coordinates: data.location.coordinates,
      };
    }
    if (data.address !== undefined) {
      updateFields['address'] = {
        line: data.address.line.trim(),
        city: data.address.city.trim(),
        state: data.address.state.trim(),
        pincode: data.address.pincode.trim(),
      };
    }
    if (data.images !== undefined) {
      updateFields['images'] = data.images.map((img) => ({
        key: img.key,
        width: img.width,
        height: img.height,
        mimeType: img.mimeType,
      }));
    }

    const updated = await JobModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), deletedAt: null },
      { $set: updateFields },
      { new: true, session }
    ).exec();

    return updated ? toJobEntity(updated) : null;
  }

  async updateStatus(
    id: string,
    newStatus: JobStatus,
    extra?: { assignedWorkerId?: string | null },
    session?: ClientSession
  ): Promise<IJobEntity | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const setFields: Record<string, unknown> = {
      status: newStatus,
    };

    if (extra?.assignedWorkerId !== undefined) {
      setFields['assignedWorkerId'] = extra.assignedWorkerId
        ? new Types.ObjectId(extra.assignedWorkerId)
        : null;
    }

    const updated = await JobModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), deletedAt: null },
      { $set: setFields },
      { new: true, session }
    ).exec();

    return updated ? toJobEntity(updated) : null;
  }

  async listJobsWithCursor(filters: ListJobsFilters): Promise<CursorPage<IJobEntity>> {
    const limit = Math.min(filters.limit ?? 20, 50);
    const query: FilterQuery<IJobDocument> = {
      deletedAt: null,
    };

    if (filters.customerId) {
      query.customerId = new Types.ObjectId(filters.customerId);
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.categoryId) {
      query.categoryId = new Types.ObjectId(filters.categoryId);
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
        // Invalid cursor is ignored, queries first page
      }
    }

    // Fetch 1 extra to check if there is a next page
    const docs = await JobModel.find(query)
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
      items: docs.map(toJobEntity),
      nextCursor,
      hasMore,
    };
  }
}

export const jobRepository = new MongoJobRepository();
