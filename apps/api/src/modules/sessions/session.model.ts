import { Schema, model, Document, Types } from 'mongoose';
import type { ISessionEntity } from '@kaamsetu/types';

export interface ISessionDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  refreshTokenHash: string;
  familyId: string;
  deviceName?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const sessionSchema = new Schema<ISessionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: [true, 'Refresh token hash is required'],
    },
    familyId: {
      type: String,
      required: [true, 'Token family ID is required'],
      index: true,
    },
    deviceName: {
      type: String,
      default: null,
      trim: true,
    },
    ipAddress: {
      type: String,
      default: null,
      trim: true,
    },
    userAgent: {
      type: String,
      default: null,
      trim: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Explicit Compound Indexes for fast session queries
sessionSchema.index({ userId: 1, revokedAt: 1 });
sessionSchema.index({ familyId: 1, revokedAt: 1 });

export function mapSessionDocumentToEntity(
  doc: ISessionDocument,
  currentSessionId?: string
): ISessionEntity {
  const idStr = doc._id.toString();
  return {
    id: idStr,
    userId: doc.userId.toString(),
    familyId: doc.familyId,
    deviceName: doc.deviceName ?? null,
    ipAddress: doc.ipAddress ?? null,
    userAgent: doc.userAgent ?? null,
    lastUsedAt: doc.lastUsedAt,
    expiresAt: doc.expiresAt,
    revokedAt: doc.revokedAt ?? null,
    isCurrent: currentSessionId ? idStr === currentSessionId : undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const SessionModel = model<ISessionDocument>('Session', sessionSchema);
