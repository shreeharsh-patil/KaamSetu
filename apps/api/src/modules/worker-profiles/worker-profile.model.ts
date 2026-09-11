import { Schema, model, Document, Types } from 'mongoose';
import type { IWorkerProfileEntity } from '@kaamsetu/types';

export interface IWorkerProfileDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  fullName: string;
  bio?: string | null;
  primaryCategoryId: Types.ObjectId;
  skillIds: Types.ObjectId[];
  serviceArea: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    radiusKm: number;
    address?: string | null;
    city?: string | null;
    pincode?: string | null;
  };
  hourlyRate?: number | null;
  isAvailable: boolean;
  ratingAverage: number;
  ratingCount: number;
  completedJobsCount: number;
  kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export const workerProfileSchema = new Schema<IWorkerProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    bio: {
      type: String,
      default: null,
      trim: true,
    },
    primaryCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: [true, 'Primary category is required'],
      index: true,
    },
    skillIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Skill',
      },
    ],
    serviceArea: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      radiusKm: {
        type: Number,
        default: 15,
      },
      address: {
        type: String,
        default: null,
      },
      city: {
        type: String,
        default: null,
      },
      pincode: {
        type: String,
        default: null,
      },
    },
    hourlyRate: {
      type: Number,
      default: null,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedJobsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    kycStatus: {
      type: String,
      enum: ['NOT_SUBMITTED', 'PENDING', 'VERIFIED', 'REJECTED'],
      default: 'NOT_SUBMITTED',
      index: true,
    },
    deletedAt: {
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

// Explicit 2dsphere index for geospatial queries
workerProfileSchema.index({ 'serviceArea.coordinates': '2dsphere' });
workerProfileSchema.index({ primaryCategoryId: 1, isAvailable: 1 });

export function mapWorkerDocumentToEntity(doc: IWorkerProfileDocument): IWorkerProfileEntity {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    fullName: doc.fullName,
    bio: doc.bio ?? null,
    primaryCategoryId: doc.primaryCategoryId.toString(),
    skillIds: (doc.skillIds || []).map((id) => id.toString()),
    serviceArea: {
      type: 'Point',
      coordinates: [doc.serviceArea.coordinates[0] ?? 0, doc.serviceArea.coordinates[1] ?? 0],
      radiusKm: doc.serviceArea.radiusKm,
      address: doc.serviceArea.address ?? null,
      city: doc.serviceArea.city ?? null,
      pincode: doc.serviceArea.pincode ?? null,
    },
    hourlyRate: doc.hourlyRate ?? null,
    isAvailable: doc.isAvailable,
    ratingAverage: doc.ratingAverage,
    ratingCount: doc.ratingCount,
    completedJobsCount: doc.completedJobsCount,
    kycStatus: doc.kycStatus,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt ?? null,
  };
}

export const WorkerProfileModel = model<IWorkerProfileDocument>(
  'WorkerProfile',
  workerProfileSchema
);
