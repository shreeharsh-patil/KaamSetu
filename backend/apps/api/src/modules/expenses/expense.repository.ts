import { ClientSession, FilterQuery, Types } from 'mongoose';
import { ExpenseModel, toExpenseEntity, IExpenseDocument } from './expense.model.js';
import type {
  IExpenseEntity,
  ICreateExpenseInput,
  IUpdateExpenseInput,
  ListExpensesFilters,
  CursorPage,
} from '@kaamsetu/types';

export interface IExpenseRepository {
  create(data: ICreateExpenseInput, session?: ClientSession): Promise<IExpenseEntity>;
  findById(id: string, includeDeleted?: boolean): Promise<IExpenseEntity | null>;
  listExpensesCursor(filters: ListExpensesFilters): Promise<CursorPage<IExpenseEntity>>;
  update(
    id: string,
    workerId: string,
    data: IUpdateExpenseInput,
    session?: ClientSession
  ): Promise<IExpenseEntity | null>;
  softDelete(id: string, workerId: string, session?: ClientSession): Promise<boolean>;
  aggregateWorkerExpenses(
    workerId: string,
    startDate?: Date,
    endDate?: Date,
    jobId?: string
  ): Promise<number>;
}

export class ExpenseRepository implements IExpenseRepository {
  async create(data: ICreateExpenseInput, session?: ClientSession): Promise<IExpenseEntity> {
    const docs = await ExpenseModel.create(
      [
        {
          workerId: new Types.ObjectId(data.workerId),
          jobId: data.jobId && Types.ObjectId.isValid(data.jobId) ? new Types.ObjectId(data.jobId) : null,
          category: data.category,
          amount: Math.round(data.amount), // Ensure integer paise
          currency: (data.currency || 'INR').toUpperCase(),
          note: data.note ?? null,
          receipt: data.receipt ? { ...data.receipt } : undefined,
          deletedAt: null,
        },
      ],
      { session }
    );

    return toExpenseEntity(docs[0]!);
  }

  async findById(id: string, includeDeleted: boolean = false): Promise<IExpenseEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const query: FilterQuery<IExpenseDocument> = { _id: new Types.ObjectId(id) };
    if (!includeDeleted) {
      query.deletedAt = null;
    }
    const doc = await ExpenseModel.findOne(query).exec();
    return doc ? toExpenseEntity(doc) : null;
  }

  async listExpensesCursor(filters: ListExpensesFilters): Promise<CursorPage<IExpenseEntity>> {
    const limit = Math.min(Math.max(1, filters.limit ?? 20), 50);
    const query: FilterQuery<IExpenseDocument> = {
      workerId: new Types.ObjectId(filters.workerId),
      deletedAt: null,
    };

    if (filters.jobId && Types.ObjectId.isValid(filters.jobId)) {
      query.jobId = new Types.ObjectId(filters.jobId);
    }

    if (filters.category) {
      query.category = filters.category;
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
        // Ignore corrupted cursor, query first page
      }
    }

    const docs = await ExpenseModel.find(query)
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
      items: docs.map(toExpenseEntity),
      nextCursor,
      hasMore,
    };
  }

  async update(
    id: string,
    workerId: string,
    data: IUpdateExpenseInput,
    session?: ClientSession
  ): Promise<IExpenseEntity | null> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(workerId)) return null;

    const updateFields: Record<string, unknown> = {};
    if (data.category !== undefined) updateFields['category'] = data.category;
    if (data.amount !== undefined) updateFields['amount'] = Math.round(data.amount);
    if (data.currency !== undefined) updateFields['currency'] = data.currency.toUpperCase();
    if (data.note !== undefined) updateFields['note'] = data.note;
    if (data.receipt !== undefined) updateFields['receipt'] = data.receipt;
    if (data.jobId !== undefined) {
      updateFields['jobId'] = data.jobId && Types.ObjectId.isValid(data.jobId) ? new Types.ObjectId(data.jobId) : null;
    }

    const doc = await ExpenseModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), workerId: new Types.ObjectId(workerId), deletedAt: null },
      { $set: updateFields },
      { new: true, session }
    ).exec();

    return doc ? toExpenseEntity(doc) : null;
  }

  async softDelete(id: string, workerId: string, session?: ClientSession): Promise<boolean> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(workerId)) return false;

    const res = await ExpenseModel.updateOne(
      { _id: new Types.ObjectId(id), workerId: new Types.ObjectId(workerId), deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { session }
    ).exec();

    return res.modifiedCount > 0;
  }

  async aggregateWorkerExpenses(
    workerId: string,
    startDate?: Date,
    endDate?: Date,
    jobId?: string
  ): Promise<number> {
    if (!Types.ObjectId.isValid(workerId)) return 0;

    const match: FilterQuery<IExpenseDocument> = {
      workerId: new Types.ObjectId(workerId),
      deletedAt: null,
    };

    if (jobId && Types.ObjectId.isValid(jobId)) {
      match.jobId = new Types.ObjectId(jobId);
    }

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }

    const result = await ExpenseModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
        },
      },
    ]).exec();

    return result.length > 0 && typeof result[0].totalAmount === 'number'
      ? Math.round(result[0].totalAmount)
      : 0;
  }
}

export const expenseRepository = new ExpenseRepository();
