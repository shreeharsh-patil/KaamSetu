import { Schema, model, Document, Types } from 'mongoose';
import {
  DisputeReason,
  DisputeStatus,
  type IDisputeEntity,
  type IDisputeResolution,
} from '@kaamsetu/types';

export interface IDisputeDocument extends Document {
  _id: Types.ObjectId;
  jobId: Types.ObjectId;
  initiatorId: Types.ObjectId;
  respondentId: Types.ObjectId;
  reason: DisputeReason;
  description: string;
  evidence?: string[];
  status: DisputeStatus;
  resolution?: IDisputeResolution | null;
  resolvedBy?: Types.ObjectId | null;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const disputeResolutionSubSchema = new Schema(
  {
    summary: { type: String, required: true, trim: true },
    refundPaise: { type: Number, min: 0, default: undefined },
    actionTaken: { type: String, trim: true, default: undefined },
  },
  { _id: false }
);

const disputeSchema = new Schema(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
      index: true,
    },
    initiatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Initiator ID is required'],
      index: true,
    },
    respondentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Respondent ID is required'],
      index: true,
    },
    reason: {
      type: String,
      enum: Object.values(DisputeReason),
      required: [true, 'Dispute reason is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Dispute description is required'],
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    evidence: {
      type: [String],
      default: undefined,
    },
    status: {
      type: String,
      enum: Object.values(DisputeStatus),
      default: DisputeStatus.OPEN,
      index: true,
    },
    resolution: {
      type: disputeResolutionSubSchema,
      default: null,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

disputeSchema.index({ jobId: 1, createdAt: -1 });
disputeSchema.index({ initiatorId: 1, createdAt: -1 });
disputeSchema.index({ respondentId: 1, createdAt: -1 });
disputeSchema.index({ status: 1, createdAt: -1 });

export function toDisputeEntity(doc: IDisputeDocument): IDisputeEntity {
  return {
    id: doc._id.toString(),
    jobId: doc.jobId.toString(),
    initiatorId: doc.initiatorId.toString(),
    respondentId: doc.respondentId.toString(),
    reason: doc.reason,
    description: doc.description,
    evidence: doc.evidence,
    status: doc.status,
    resolution: doc.resolution ?? null,
    resolvedBy: doc.resolvedBy ? doc.resolvedBy.toString() : null,
    resolvedAt: doc.resolvedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const DisputeModel = model<IDisputeDocument>('Dispute', disputeSchema);
