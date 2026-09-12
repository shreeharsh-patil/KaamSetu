import { Schema, model, Document, Types } from 'mongoose';
import {
  ReportTargetType,
  ReportReason,
  ReportStatus,
  type IReportEntity,
} from '@kaamsetu/types';

export interface IReportDocument extends Document {
  _id: Types.ObjectId;
  reporterId: Types.ObjectId;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description: string;
  evidence?: string[];
  status: ReportStatus;
  resolutionNotes?: string | null;
  resolvedBy?: Types.ObjectId | null;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter ID is required'],
      index: true,
    },
    targetType: {
      type: String,
      enum: Object.values(ReportTargetType),
      required: [true, 'Target type is required'],
      index: true,
    },
    targetId: {
      type: String,
      required: [true, 'Target ID is required'],
      trim: true,
      index: true,
    },
    reason: {
      type: String,
      enum: Object.values(ReportReason),
      required: [true, 'Report reason is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: 5,
      maxlength: 2000,
    },
    evidence: {
      type: [String],
      default: undefined,
    },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.PENDING,
      index: true,
    },
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
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

reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ reporterId: 1, createdAt: -1 });
reportSchema.index({ status: 1, createdAt: -1 });

export function toReportEntity(doc: IReportDocument): IReportEntity {
  return {
    id: doc._id.toString(),
    reporterId: doc.reporterId.toString(),
    targetType: doc.targetType,
    targetId: doc.targetId,
    reason: doc.reason,
    description: doc.description,
    evidence: doc.evidence,
    status: doc.status,
    resolutionNotes: doc.resolutionNotes ?? null,
    resolvedBy: doc.resolvedBy ? doc.resolvedBy.toString() : null,
    resolvedAt: doc.resolvedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const ReportModel = model<IReportDocument>('Report', reportSchema);
