import { ClientSession, FilterQuery, Types } from 'mongoose';
import { TransactionModel, toTransactionEntity, ITransactionDocument } from './transaction.model.js';
import type {
  ITransactionEntity,
  ICreateTransactionInput,
  ListTransactionsFilters,
  CursorPage,
} from '@kaamsetu/types';
import { TransactionType } from '@kaamsetu/types';

export interface ITransactionRepository {
  create(data: ICreateTransactionInput, session?: ClientSession): Promise<ITransactionEntity>;
  findById(id: string): Promise<ITransactionEntity | null>;
  findByReferenceId(referenceId: string): Promise<ITransactionEntity | null>;
  listTransactionsCursor(filters: ListTransactionsFilters): Promise<CursorPage<ITransactionEntity>>;
  aggregateWorkerRevenue(workerId: string, startDate?: Date, endDate?: Date): Promise<number>;
  aggregateWorkerExpenses(workerId: string, startDate?: Date, endDate?: Date): Promise<number>;
}

export class TransactionRepository implements ITransactionRepository {
  async create(data: ICreateTransactionInput, session?: ClientSession): Promise<ITransactionEntity> {
    const docs = await TransactionModel.create(
      [
        {
          workerId: new Types.ObjectId(data.workerId),
          jobId: data.jobId && Types.ObjectId.isValid(data.jobId) ? new Types.ObjectId(data.jobId) : null,
          type: data.type,
          amount: Math.round(data.amount), // Ensure integer paise
          currency: (data.currency || 'INR').toUpperCase(),
          referenceId: data.referenceId,
          metadata: data.metadata ? { ...data.metadata } : undefined,
          createdAt: new Date(),
        },
      ],
      { session }
    );

    return toTransactionEntity(docs[0]!);
  }

  async findById(id: string): Promise<ITransactionEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await TransactionModel.findById(id).exec();
    return doc ? toTransactionEntity(doc) : null;
  }

  async findByReferenceId(referenceId: string): Promise<ITransactionEntity | null> {
    const doc = await TransactionModel.findOne({ referenceId }).exec();
    return doc ? toTransactionEntity(doc) : null;
  }

  async listTransactionsCursor(filters: ListTransactionsFilters): Promise<CursorPage<ITransactionEntity>> {
    const limit = Math.min(Math.max(1, filters.limit ?? 20), 50);
    const query: FilterQuery<ITransactionDocument> = {};

    if (filters.workerId && Types.ObjectId.isValid(filters.workerId)) {
      query.workerId = new Types.ObjectId(filters.workerId);
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.createdAt.$lte = filters.endDate;
      }
    }

    if (filters.cursor) {
      try {
        const decoded = JSON.parse(
          Buffer.from(filters.cursor, 'base64url').toString('utf8')
        ) as { createdAt: string; id: string };

        const cursorDate = new Date(decoded.createdAt);
        const cursorId = new Types.ObjectId(decoded.id);

        query.$or = [
          { createdAt: { $lt: cursorDate } },
          { createdAt: cursorDate, _id: { $lt: cursorId } },
        ];
      } catch {
        // Fallback to first page on corrupted cursor
      }
    }

    const docs = await TransactionModel.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = docs.length > limit;
    if (hasMore) {
      docs.pop();
    }

    let nextCursor: string | null = null;
    if (hasMore && docs.length > 0) {
      const lastDoc = docs[docs.length - 1];
      if (lastDoc) {
        nextCursor = Buffer.from(
          JSON.stringify({
            createdAt: lastDoc.createdAt.toISOString(),
            id: lastDoc._id.toString(),
          })
        ).toString('base64url');
      }
    }

    return {
      items: docs.map(toTransactionEntity),
      nextCursor,
      hasMore,
    };
  }

  async aggregateWorkerRevenue(
    workerId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    if (!Types.ObjectId.isValid(workerId)) return 0;

    const match: FilterQuery<ITransactionDocument> = {
      workerId: new Types.ObjectId(workerId),
      type: { $in: [TransactionType.JOB_REVENUE] },
    };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }

    const result = await TransactionModel.aggregate([
      { $match: match },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
    ]).exec();

    return result.length > 0 && typeof result[0].totalRevenue === 'number'
      ? Math.round(result[0].totalRevenue)
      : 0;
  }

  async aggregateWorkerExpenses(
    workerId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    if (!Types.ObjectId.isValid(workerId)) return 0;

    const match: FilterQuery<ITransactionDocument> = {
      workerId: new Types.ObjectId(workerId),
      type: { $in: [TransactionType.EXPENSE, TransactionType.PLATFORM_FEE] },
    };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }

    const result = await TransactionModel.aggregate([
      { $match: match },
      { $group: { _id: null, totalExpense: { $sum: '$amount' } } },
    ]).exec();

    return result.length > 0 && typeof result[0].totalExpense === 'number'
      ? Math.round(result[0].totalExpense)
      : 0;
  }
}

export const transactionRepository = new TransactionRepository();
