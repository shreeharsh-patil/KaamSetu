import { Schema, model, Document, Types } from 'mongoose';
import {
  VerificationType,
  VerificationRequestStatus,
  type IVerificationRequestEntity,
  type IVerificationDocument,
} from '@kaamsetu/types';

export interface IVerificationRequestDocument extends Document {
  _id: Types.ObjectId;
  workerId: Types.ObjectId;
  type: VerificationType;
  documents: IVerificationDocument[];
  status: VerificationRequestStatus;
  reviewerId?: Types.ObjectId | null;
  reason?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const verificationDocumentSubSchema = new Schema(
  {
    key: { type: String, trim: true, default: undefined },
    url: { type: String, required: true, trim: true },
    mimeType: { type: String, trim: true, default: undefined },
    documentType: { type: String, trim: true, default: undefined },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const verificationRequestSchema = new Schema(
  {
    workerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Worker ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(VerificationType),
      required: [true, 'Verification type is required'],
      index: true,
    },
    documents: {
      type: [verificationDocumentSubSchema],
      required: [true, 'Verification documents are required'],
      validate: {
        validator: (docs: unknown[]) => Array.isArray(docs) && docs.length > 0,
        message: 'At least one verification document is required',
      },
    },
    status: {
      type: String,
      enum: Object.values(VerificationRequestStatus),
      default: VerificationRequestStatus.PENDING,
      index: true,
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

verificationRequestSchema.index({ workerId: 1, createdAt: -1 });
verificationRequestSchema.index({ status: 1, createdAt: -1 });

export function toVerificationRequestEntity(
  doc: IVerificationRequestDocument
): IVerificationRequestEntity {
  return {
    id: doc._id.toString(),
    workerId: doc.workerId.toString(),
    type: doc.type,
    documents: doc.documents,
    status: doc.status,
    reviewerId: doc.reviewerId ? doc.reviewerId.toString() : null,
    reason: doc.reason ?? null,
    reviewedAt: doc.reviewedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const VerificationRequestModel = model<IVerificationRequestDocument>(
  'VerificationRequest',
  verificationRequestSchema
);
