import { Types, ClientSession } from 'mongoose';
import type { IJobEventEntity, ICreateJobEventInput } from '@kaamsetu/types';
import { JobEventModel, toJobEventEntity } from './job-event.model.js';

export interface IJobEventRepository {
  create(data: ICreateJobEventInput, session?: ClientSession): Promise<IJobEventEntity>;
  findByJobId(jobId: string): Promise<IJobEventEntity[]>;
}

export class MongoJobEventRepository implements IJobEventRepository {
  async create(data: ICreateJobEventInput, session?: ClientSession): Promise<IJobEventEntity> {
    const docData = {
      jobId: new Types.ObjectId(data.jobId),
      actorId: new Types.ObjectId(data.actorId),
      actorRole: data.actorRole ?? null,
      eventType: data.eventType,
      previousState: data.previousState ?? null,
      newState: data.newState ?? null,
      reason: data.reason ?? null,
      metadata: data.metadata,
    };

    if (session) {
      const [created] = await JobEventModel.create([docData], { session });
      if (!created) {
        throw new Error('Failed to create JobEvent record in transaction');
      }
      return toJobEventEntity(created);
    }

    const created = await JobEventModel.create(docData);
    return toJobEventEntity(created);
  }

  async findByJobId(jobId: string): Promise<IJobEventEntity[]> {
    const docs = await JobEventModel.find({ jobId: new Types.ObjectId(jobId) })
      .sort({ createdAt: 1 })
      .lean();

    return docs.map((doc) => ({
      id: doc._id.toString(),
      jobId: doc.jobId.toString(),
      actorId: doc.actorId.toString(),
      actorRole: doc.actorRole ?? undefined,
      eventType: doc.eventType,
      previousState: doc.previousState ?? null,
      newState: doc.newState ?? null,
      reason: doc.reason ?? undefined,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
    }));
  }
}

export const jobEventRepository = new MongoJobEventRepository();
