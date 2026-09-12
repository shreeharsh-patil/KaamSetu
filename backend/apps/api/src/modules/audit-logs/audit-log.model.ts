import { Schema, model, Document, Types } from 'mongoose';
import { UserRole, type IAuditLogEntity } from '@kaamsetu/types';

export interface IAuditLogDocument extends Document {
  _id: Types.ObjectId;
  actorId: Types.ObjectId;
  actorRole: UserRole;
  action: string;
  resourceType: string;
  resourceId: string;
  targetType?: string;
  targetId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipAddress?: string | null;
  requestId?: string | null;
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
    resourceType: {
      type: String,
      required: [true, 'Resource type is required'],
      trim: true,
      index: true,
    },
    resourceId: {
      type: String,
      required: [true, 'Resource ID is required'],
      trim: true,
      index: true,
    },
    targetType: {
      type: String,
      trim: true,
      index: true,
    },
    targetId: {
      type: String,
      trim: true,
      index: true,
    },
    before: {
      type: Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
      trim: true,
    },
    requestId: {
      type: String,
      default: null,
      trim: true,
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

// Immutability Guard: Reject any mutation on audit records
auditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function () {
  throw new Error('Audit records are immutable and cannot be updated');
});

auditLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('Audit records are immutable and cannot be updated'));
  }
  next();
});

// Indexes for high-performance operational lookups and cursor pagination
auditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1, _id: -1 });

export function toAuditLogEntity(doc: IAuditLogDocument): IAuditLogEntity {
  return {
    id: doc._id.toString(),
    actorId: doc.actorId.toString(),
    actorRole: doc.actorRole,
    action: doc.action,
    resourceType: doc.resourceType || doc.targetType || 'UNKNOWN',
    resourceId: doc.resourceId || doc.targetId || 'UNKNOWN',
    targetType: doc.targetType || doc.resourceType,
    targetId: doc.targetId || doc.resourceId,
    before: doc.before ?? null,
    after: doc.after ?? null,
    ipAddress: doc.ipAddress ?? null,
    requestId: doc.requestId ?? null,
    details: doc.details,
    createdAt: doc.createdAt,
  };
}

export const AuditLogModel = model<IAuditLogDocument>('AuditLog', auditLogSchema);
