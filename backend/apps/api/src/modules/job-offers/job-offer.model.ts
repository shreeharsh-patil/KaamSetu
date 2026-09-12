import { Schema, model, Document, Types } from 'mongoose';
import { JobOfferStatus, type IJobOfferEntity, type ScoreBreakdown } from '@kaamsetu/types';

export interface IJobOfferDocument extends Document {
  _id: Types.ObjectId;
  jobId: Types.ObjectId;
  workerId: Types.ObjectId;
  distanceKm: number;
  matchScore: number;
  scoreBreakdown: ScoreBreakdown;
  status: JobOfferStatus;
  expiresAt: Date;
  respondedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const scoreBreakdownSchema = new Schema(
  {
    skillScore: { type: Number, required: true, min: 0, max: 100 },
    distanceScore: { type: Number, required: true, min: 0, max: 100 },
    availabilityScore: { type: Number, required: true, min: 0, max: 100 },
    ratingScore: { type: Number, required: true, min: 0, max: 100 },
    completionRateScore: { type: Number, required: true, min: 0, max: 100 },
    acceptanceRateScore: { type: Number, required: true, min: 0, max: 100 },
    priceScore: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const jobOfferSchema = new Schema(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
      index: true,
    },
    workerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Worker ID is required'],
      index: true,
    },
    distanceKm: {
      type: Number,
      required: [true, 'Distance in km is required'],
      min: 0,
    },
    matchScore: {
      type: Number,
      required: [true, 'Match score is required'],
      min: 0,
      max: 100,
    },
    scoreBreakdown: {
      type: scoreBreakdownSchema,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(JobOfferStatus),
      default: JobOfferStatus.PENDING,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Offer expiration time is required'],
      index: true,
    },
    respondedAt: {
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
jobOfferSchema.index({ jobId: 1, workerId: 1 }, { unique: true });
jobOfferSchema.index({ workerId: 1, status: 1, createdAt: -1 });
jobOfferSchema.index({ jobId: 1, status: 1 });
jobOfferSchema.index({ expiresAt: 1, status: 1 });

export function toJobOfferEntity(doc: IJobOfferDocument): IJobOfferEntity {
  return {
    id: doc._id.toString(),
    jobId: doc.jobId.toString(),
    workerId: doc.workerId.toString(),
    distanceKm: Math.round(doc.distanceKm * 100) / 100,
    matchScore: Math.round(doc.matchScore * 100) / 100,
    scoreBreakdown: {
      skillScore: Math.round(doc.scoreBreakdown.skillScore * 100) / 100,
      distanceScore: Math.round(doc.scoreBreakdown.distanceScore * 100) / 100,
      availabilityScore: Math.round(doc.scoreBreakdown.availabilityScore * 100) / 100,
      ratingScore: Math.round(doc.scoreBreakdown.ratingScore * 100) / 100,
      completionRateScore: Math.round(doc.scoreBreakdown.completionRateScore * 100) / 100,
      acceptanceRateScore: Math.round(doc.scoreBreakdown.acceptanceRateScore * 100) / 100,
      priceScore: Math.round(doc.scoreBreakdown.priceScore * 100) / 100,
    },
    status: doc.status,
    expiresAt: doc.expiresAt,
    respondedAt: doc.respondedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const JobOfferModel = model<IJobOfferDocument>('JobOffer', jobOfferSchema, 'jobOffers');
