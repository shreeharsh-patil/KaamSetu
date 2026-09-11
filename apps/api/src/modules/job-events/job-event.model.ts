import { Schema, model, Document, Types } from 'mongoose';
import type { IJobEventEntity, JobEventType, JobStatus } from '@kaamsetu/types';

export interface IJobEventDocument extends Document {
  _id: Types.ObjectId;
  jobId: Types.ObjectId;
  actorId: Types.ObjectId;
  actorRole?: string | null;
  eventType: JobEventType;
  previousState: JobStatus | null;
  newState: JobStatus | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const jobEventSchema = new Schema(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor ID is required'],
    },
    actorRole: {
      type: String,
      trim: true,
      default: null,
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: [
        'CREATED',
        'UPDATED',
        'PUBLISHED',
        'CANCELLED',
        'STATUS_CHANGED',
        'WORKER_ASSIGNED',
        'OFFER_CREATED',
        'OFFER_ACCEPTED',
        'OFFER_REJECTED',
        'OFFER_WITHDRAWN',
        'MATCHING_STARTED',
        'TRAVEL_STARTED',
        'WORKER_ARRIVED',
        'JOB_STARTED',
        'JOB_COMPLETED',
        'DISPUTE_RAISED',
        'DISPUTE_RESOLVED',
      ],
    },
    previousState: {
      type: String,
      default: null,
    },
    newState: {
      type: String,
      default: null,
    },
    reason: {
      type: String,
      trim: true,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

jobEventSchema.index({ jobId: 1, createdAt: -1 });

export function toJobEventEntity(doc: IJobEventDocument): IJobEventEntity {
  return {
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
  };
}

export const JobEventModel = model<IJobEventDocument>('JobEvent', jobEventSchema, 'jobEvents');
