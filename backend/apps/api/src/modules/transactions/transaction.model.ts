import { Schema, model, Document, Types } from 'mongoose';
import { TransactionType, type ITransactionEntity } from '@kaamsetu/types';

export interface ITransactionDocument extends Document {
  _id: Types.ObjectId;
  workerId: Types.ObjectId;
  jobId?: Types.ObjectId | null;
  type: TransactionType;
  amount: number; // Integer paise
  currency: string;
  referenceId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const transactionSchema = new Schema(
  {
    workerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Worker ID is required'],
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: [true, 'Transaction type is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      validate: {
        validator: Number.isInteger,
        message: 'Transaction amount must be an integer representing paise (never float)',
      },
    },
    currency: {
      type: String,
      default: 'INR',
      required: true,
      trim: true,
      uppercase: true,
    },
    referenceId: {
      type: String,
      required: [true, 'Reference ID is required for idempotency and traceability'],
      unique: true,
      trim: true,
      index: true,
    },
    metadata: {
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

// Indexes
transactionSchema.index({ workerId: 1, createdAt: -1 });
transactionSchema.index({ workerId: 1, type: 1, createdAt: -1 });

// Critical rule: Financial ledger entries are strictly immutable once written
const IMMUTABLE_ERROR = 'Financial ledger entries are strictly immutable and cannot be modified or deleted.';
transactionSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function (next) {
  next(new Error(IMMUTABLE_ERROR));
});
transactionSchema.pre(['deleteOne', 'deleteMany', 'findOneAndDelete'], function (next) {
  next(new Error(IMMUTABLE_ERROR));
});

export function toTransactionEntity(doc: ITransactionDocument): ITransactionEntity {
  return {
    id: doc._id.toString(),
    workerId: doc.workerId.toString(),
    jobId: doc.jobId ? doc.jobId.toString() : null,
    type: doc.type,
    amount: doc.amount,
    currency: doc.currency,
    referenceId: doc.referenceId,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
  };
}

export const TransactionModel = model<ITransactionDocument>(
  'Transaction',
  transactionSchema,
  'transactions'
);
