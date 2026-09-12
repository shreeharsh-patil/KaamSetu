import { Schema, model, Document, Types } from 'mongoose';
import {
  UploadPurpose,
  UploadStatus,
  type IUploadEntity,
} from '@kaamsetu/types';

export interface IUploadDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  purpose: UploadPurpose;
  key: string;
  originalFilename?: string | null;
  mimeType: string;
  sizeBytes: number;
  status: UploadStatus;
  isPublic: boolean;
  publicUrl?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const uploadSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    purpose: {
      type: String,
      enum: Object.values(UploadPurpose),
      required: [true, 'Upload purpose is required'],
      index: true,
    },
    key: {
      type: String,
      required: [true, 'Storage object key is required'],
      unique: true,
      trim: true,
      index: true,
    },
    originalFilename: {
      type: String,
      default: null,
      trim: true,
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      trim: true,
    },
    sizeBytes: {
      type: Number,
      required: [true, 'File size in bytes is required'],
      min: [1, 'Size must be at least 1 byte'],
    },
    status: {
      type: String,
      enum: Object.values(UploadStatus),
      default: UploadStatus.PENDING,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    publicUrl: {
      type: String,
      default: null,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

uploadSchema.index({ userId: 1, purpose: 1, createdAt: -1 });

export function toUploadEntity(doc: IUploadDocument): IUploadEntity {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    purpose: doc.purpose,
    key: doc.key,
    originalFilename: doc.originalFilename ?? null,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    status: doc.status,
    isPublic: doc.isPublic,
    publicUrl: doc.publicUrl ?? null,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const UploadModel = model<IUploadDocument>('Upload', uploadSchema);
