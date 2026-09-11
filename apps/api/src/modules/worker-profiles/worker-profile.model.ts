import { Schema, model, Document, Types } from 'mongoose';
import {
  IWorkerProfileEntity,
  WorkerAvailability,
  WorkerVerificationStatus,
  SkillLevel,
} from '@kaamsetu/types';

export interface IWorkerProfileDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  displayName: string;
  bio?: string | null;
  primaryCategoryId?: Types.ObjectId;
  skills: Array<{
    skillId: Types.ObjectId;
    experienceYears: number;
    level: SkillLevel;
    verified: boolean;
  }>;
  languages: string[];
  serviceLocation: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  serviceRadiusKm: number;
  availabilityStatus: WorkerAvailability;
  pricing: {
    hourlyRate?: number | null;
    customRateDescription?: string | null;
    currency?: string;
  };
  portfolio: Array<{
    _id: Types.ObjectId;
    title: string;
    description?: string | null;
    imageUrl: string;
    createdAt: Date;
  }>;
  rating: {
    average: number;
    count: number;
  };
  stats: {
    completedJobs: number;
    cancelledJobs: number;
    responseTimeMinutes?: number | null;
  };
  verificationStatus: WorkerVerificationStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const workerSkillSubSchema = new Schema(
  {
    skillId: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Skill ID is required'],
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: [0, 'Experience years cannot be negative'],
    },
    level: {
      type: String,
      enum: Object.values(SkillLevel),
      default: SkillLevel.INTERMEDIATE,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const workerPortfolioSubSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Portfolio title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Portfolio image URL is required'],
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

export const workerProfileSchema = new Schema<IWorkerProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
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
      default: undefined,
      index: true,
    },
    skills: {
      type: [workerSkillSubSchema],
      default: [],
    },
    languages: {
      type: [String],
      default: ['en'],
    },
    serviceLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Coordinates [longitude, latitude] are required'],
      },
    },
    serviceRadiusKm: {
      type: Number,
      default: 15,
      min: [1, 'Service radius must be at least 1 km'],
      max: [100, 'Service radius cannot exceed 100 km'],
    },
    availabilityStatus: {
      type: String,
      enum: Object.values(WorkerAvailability),
      default: WorkerAvailability.AVAILABLE,
      index: true,
    },
    pricing: {
      hourlyRate: {
        type: Number,
        default: null,
        min: 0,
      },
      customRateDescription: {
        type: String,
        default: null,
        trim: true,
      },
      currency: {
        type: String,
        default: 'INR',
      },
    },
    portfolio: {
      type: [workerPortfolioSubSchema],
      default: [],
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    stats: {
      completedJobs: {
        type: Number,
        default: 0,
        min: 0,
      },
      cancelledJobs: {
        type: Number,
        default: 0,
        min: 0,
      },
      responseTimeMinutes: {
        type: Number,
        default: null,
      },
    },
    verificationStatus: {
      type: String,
      enum: Object.values(WorkerVerificationStatus),
      default: WorkerVerificationStatus.UNVERIFIED,
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

// Explicit 2dsphere index on GeoJSON serviceLocation for geospatial search
workerProfileSchema.index({ serviceLocation: '2dsphere' });
workerProfileSchema.index({ 'skills.skillId': 1 });
workerProfileSchema.index({ availabilityStatus: 1, verificationStatus: 1 });

export function mapWorkerDocumentToEntity(doc: IWorkerProfileDocument): IWorkerProfileEntity {
  const coordinates: [number, number] = [
    doc.serviceLocation?.coordinates?.[0] ?? 0,
    doc.serviceLocation?.coordinates?.[1] ?? 0,
  ];

  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    displayName: doc.displayName,
    fullName: doc.displayName,
    bio: doc.bio ?? null,
    primaryCategoryId: doc.primaryCategoryId ? doc.primaryCategoryId.toString() : undefined,
    skillIds: (doc.skills || []).map((s) => s.skillId.toString()),
    skills: (doc.skills || []).map((s) => ({
      skillId: s.skillId.toString(),
      experienceYears: s.experienceYears,
      level: s.level,
      verified: s.verified,
    })),
    languages: doc.languages || ['en'],
    serviceLocation: {
      type: 'Point',
      coordinates,
    },
    serviceArea: {
      type: 'Point',
      coordinates,
      radiusKm: doc.serviceRadiusKm,
    },
    serviceRadiusKm: doc.serviceRadiusKm,
    availabilityStatus: doc.availabilityStatus,
    isAvailable: doc.availabilityStatus === WorkerAvailability.AVAILABLE,
    pricing: {
      hourlyRate: doc.pricing?.hourlyRate ?? null,
      customRateDescription: doc.pricing?.customRateDescription ?? null,
      currency: doc.pricing?.currency ?? 'INR',
    },
    hourlyRate: doc.pricing?.hourlyRate ?? null,
    portfolio: (doc.portfolio || []).map((p) => ({
      id: p._id ? p._id.toString() : '',
      title: p.title,
      description: p.description ?? null,
      imageUrl: p.imageUrl,
    })),
    rating: {
      average: doc.rating?.average ?? 0,
      count: doc.rating?.count ?? 0,
    },
    ratingAverage: doc.rating?.average ?? 0,
    ratingCount: doc.rating?.count ?? 0,
    stats: {
      completedJobs: doc.stats?.completedJobs ?? 0,
      cancelledJobs: doc.stats?.cancelledJobs ?? 0,
      responseTimeMinutes: doc.stats?.responseTimeMinutes ?? null,
    },
    completedJobsCount: doc.stats?.completedJobs ?? 0,
    verificationStatus: doc.verificationStatus,
    kycStatus:
      doc.verificationStatus === WorkerVerificationStatus.UNVERIFIED
        ? 'NOT_SUBMITTED'
        : (doc.verificationStatus as 'PENDING' | 'VERIFIED' | 'REJECTED'),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt ?? null,
  };
}

export const WorkerProfileModel = model<IWorkerProfileDocument>(
  'WorkerProfile',
  workerProfileSchema
);
