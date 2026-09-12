import { Schema, model, Document, Types } from 'mongoose';
import {
  JobStatus,
  JobUrgency,
  type JobSource,
  type IJobEntity,
  type JobImage,
} from '@kaamsetu/types';

export interface IJobDocument extends Document {
  _id: Types.ObjectId;
  customerId: Types.ObjectId;
  categoryId: Types.ObjectId;
  requiredSkills: Types.ObjectId[];
  title: string;
  description?: string | null;
  source: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  address: {
    line: string;
    city: string;
    state: string;
    pincode: string;
  };
  preferredTime: Date;
  urgency: string;
  estimatedPrice?: number | null;
  status: string;
  assignedWorkerId?: Types.ObjectId | null;
  images: JobImage[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const jobSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: [true, 'Category ID is required'],
      index: true,
    },
    requiredSkills: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Skill',
      },
    ],
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      minlength: [5, 'Job title must be at least 5 characters'],
      maxlength: [120, 'Job title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: null,
    },
    source: {
      type: String,
      enum: ['APP', 'VOICE', 'SUPPORT'],
      default: 'APP',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    address: {
      line: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },
    preferredTime: {
      type: Date,
      required: [true, 'Preferred time is required'],
    },
    urgency: {
      type: String,
      enum: Object.values(JobUrgency),
      default: JobUrgency.FLEXIBLE,
    },
    estimatedPrice: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.DRAFT,
      index: true,
    },
    assignedWorkerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    images: [
      {
        key: { type: String, required: true, trim: true },
        width: { type: Number, default: null },
        height: { type: Number, default: null },
        mimeType: { type: String, default: null },
      },
    ],
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
jobSchema.index({ location: '2dsphere' });
jobSchema.index({ customerId: 1, createdAt: -1 });
jobSchema.index({ status: 1, categoryId: 1, createdAt: -1 });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ assignedWorkerId: 1, status: 1 });

export function toJobEntity(doc: IJobDocument): IJobEntity {
  return {
    id: doc._id.toString(),
    customerId: doc.customerId.toString(),
    categoryId: doc.categoryId.toString(),
    requiredSkills: doc.requiredSkills ? doc.requiredSkills.map((s) => s.toString()) : [],
    title: doc.title,
    description: doc.description ?? null,
    source: doc.source as JobSource,
    location: {
      type: 'Point',
      coordinates: [doc.location.coordinates[0] ?? 0, doc.location.coordinates[1] ?? 0],
    },
    address: {
      line: doc.address.line,
      city: doc.address.city,
      state: doc.address.state,
      pincode: doc.address.pincode,
    },
    preferredTime: doc.preferredTime,
    urgency: doc.urgency as JobUrgency,
    estimatedPrice: doc.estimatedPrice ?? null,
    status: doc.status as JobStatus,
    assignedWorkerId: doc.assignedWorkerId ? doc.assignedWorkerId.toString() : null,
    images: (doc.images || []).map((img) => ({
      key: img.key,
      width: img.width ?? undefined,
      height: img.height ?? undefined,
      mimeType: img.mimeType ?? undefined,
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const JobModel = model<IJobDocument>('Job', jobSchema, 'jobs');
