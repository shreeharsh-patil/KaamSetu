import { Schema, model, Document, Types } from 'mongoose';
import { UserRole, type IAuditLogEntity } from '@kaamsetu/types';

export interface IAuditLogDocument extends Document {
  _id: Types.ObjectId;
  actorId: Types.ObjectId;
  actorRole: UserRole;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor ID is required'],
      index: true,
    },
    actorRole: {
      type: String,
      enum: Object.values(UserRole),
      required: [true, 'Actor role is required'],
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      trim: true,
      index: true,
    },
    targetType: {
      type: String,
      required: [true, 'Target type is required'],
      trim: true,
      index: true,
    },
    targetId: {
      type: String,
      required: [true, 'Target ID is required'],
      trim: true,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });

export function toAuditLogEntity(doc: IAuditLogDocument): IAuditLogEntity {
  return {
    id: doc._id.toString(),
    actorId: doc.actorId.toString(),
    actorRole: doc.actorRole,
    action: doc.action,
    targetType: doc.targetType,
    targetId: doc.targetId,
    details: doc.details,
    createdAt: doc.createdAt,
  };
}

export const AuditLogModel = model<IAuditLogDocument>('AuditLog', auditLogSchema);
