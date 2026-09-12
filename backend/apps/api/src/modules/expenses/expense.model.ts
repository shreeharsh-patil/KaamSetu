import { Schema, model, Document, Types } from 'mongoose';
import {
  ExpenseCategory,
  type IExpenseEntity,
  type IExpenseReceipt,
} from '@kaamsetu/types';

export interface IExpenseDocument extends Document {
  _id: Types.ObjectId;
  workerId: Types.ObjectId;
  jobId?: Types.ObjectId | null;
  category: ExpenseCategory;
  amount: number; // Integer paise
  currency: string;
  note?: string | null;
  receipt?: IExpenseReceipt | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const expenseReceiptSubSchema = new Schema(
  {
    key: { type: String, trim: true, default: undefined },
    url: { type: String, trim: true, default: undefined },
    mimeType: { type: String, trim: true, default: undefined },
    sizeBytes: { type: Number, default: undefined },
  },
  { _id: false }
);

const expenseSchema = new Schema(
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
    category: {
      type: String,
      enum: Object.values(ExpenseCategory),
      required: [true, 'Expense category is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [1, 'Amount must be at least 1 paise'],
      validate: {
        validator: Number.isInteger,
        message: 'Amount must be an integer representing paise (never float)',
      },
    },
    currency: {
      type: String,
      default: 'INR',
      required: true,
      trim: true,
      uppercase: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    receipt: {
      type: expenseReceiptSubSchema,
      default: undefined,
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

expenseSchema.index({ workerId: 1, createdAt: -1 });
expenseSchema.index({ workerId: 1, category: 1, createdAt: -1 });
expenseSchema.index({ workerId: 1, jobId: 1 });

export function toExpenseEntity(doc: IExpenseDocument): IExpenseEntity {
  return {
    id: doc._id.toString(),
    workerId: doc.workerId.toString(),
    jobId: doc.jobId ? doc.jobId.toString() : null,
    category: doc.category,
    amount: doc.amount,
    currency: doc.currency,
    note: doc.note ?? null,
    receipt: doc.receipt ?? undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt ?? null,
  };
}

export const ExpenseModel = model<IExpenseDocument>(
  'Expense',
  expenseSchema,
  'expenses'
);
