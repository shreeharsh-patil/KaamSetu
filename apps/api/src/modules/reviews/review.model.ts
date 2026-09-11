import { Schema, model, Document, Types } from 'mongoose';
import type { IReviewEntity } from '@kaamsetu/types';

export interface IReviewDocument extends Document {
  _id: Types.ObjectId;
  jobId: Types.ObjectId;
  reviewerId: Types.ObjectId;
  revieweeId: Types.ObjectId;
  rating: number; // 1 to 5
  quality?: number | null;
  punctuality?: number | null;
  communication?: number | null;
  comment?: string | null;
  createdAt: Date;
}

const reviewSchema = new Schema(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
      index: true,
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer ID is required'],
      index: true,
    },
    revieweeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewee ID is required'],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer between 1 and 5',
      },
      index: true,
    },
    quality: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    punctuality: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      default: null,
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

// One review per reviewer per job (unique compound index)
reviewSchema.index({ jobId: 1, reviewerId: 1 }, { unique: true });
reviewSchema.index({ revieweeId: 1, createdAt: -1 });

export function toReviewEntity(doc: IReviewDocument): IReviewEntity {
  return {
    id: doc._id.toString(),
    jobId: doc.jobId.toString(),
    reviewerId: doc.reviewerId.toString(),
    revieweeId: doc.revieweeId.toString(),
    rating: doc.rating,
    quality: doc.quality ?? undefined,
    punctuality: doc.punctuality ?? undefined,
    communication: doc.communication ?? undefined,
    comment: doc.comment ?? null,
    createdAt: doc.createdAt,
  };
}

export const ReviewModel = model<IReviewDocument>('Review', reviewSchema);
