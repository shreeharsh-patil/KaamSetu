import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import {
  TransactionType,
  type IExpenseEntity,
  type CursorPage,
} from '@kaamsetu/types';
import type {
  CreateExpenseInputDto,
  UpdateExpenseInputDto,
  ListExpensesQueryDto,
} from '@kaamsetu/validation';
import { expenseRepository, IExpenseRepository } from './expense.repository.js';
import { transactionRepository, ITransactionRepository } from '../transactions/transaction.repository.js';
import { jobRepository, IJobRepository } from '../jobs/job.repository.js';
import { withTransaction } from '../../database/transaction.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../errors/index.js';

export class ExpenseService {
  constructor(
    private readonly expenseRepo: IExpenseRepository = expenseRepository,
    private readonly transactionRepo: ITransactionRepository = transactionRepository,
    private readonly jobRepo: IJobRepository = jobRepository
  ) {}

  /**
   * Worker logs a business expense.
   * Atomically records the expense document and writes an immutable entry into the ledger.
   */
  async createExpense(
    workerId: string,
    input: CreateExpenseInputDto
  ): Promise<IExpenseEntity> {
    if (!Types.ObjectId.isValid(workerId)) {
      throw new BadRequestError('Invalid worker ID format');
    }

    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      throw new BadRequestError('Expense amount must be a positive integer representing paise (never float)');
    }

    if (input.jobId) {
      if (!Types.ObjectId.isValid(input.jobId)) {
        throw new BadRequestError('Invalid job ID format');
      }
      const job = await this.jobRepo.findById(input.jobId);
      if (!job) {
        throw new NotFoundError('Referenced job not found');
      }
      if (job.assignedWorkerId !== workerId) {
        throw new ForbiddenError('You can only log expenses against jobs assigned to you');
      }
    }

    // Atomic transaction: create expense record and ledger entry
    return withTransaction(async (session) => {
      const expense = await this.expenseRepo.create(
        {
          workerId,
          jobId: input.jobId,
          category: input.category,
          amount: Math.round(input.amount),
          currency: input.currency || 'INR',
          note: input.note,
          receipt: input.receipt,
        },
        session ?? undefined
      );

      // Write immutable ledger entry
      await this.transactionRepo.create(
        {
          workerId,
          jobId: input.jobId,
          type: TransactionType.EXPENSE,
          amount: expense.amount,
          currency: expense.currency,
          referenceId: `expense:${expense.id}`,
          metadata: {
            expenseId: expense.id,
            category: expense.category,
            note: expense.note,
          },
        },
        session ?? undefined
      );

      return expense;
    });
  }

  /**
   * Worker lists their expenses with cursor pagination.
   */
  async listExpenses(
    workerId: string,
    query: ListExpensesQueryDto
  ): Promise<CursorPage<IExpenseEntity>> {
    if (!Types.ObjectId.isValid(workerId)) {
      throw new BadRequestError('Invalid worker ID format');
    }

    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    return this.expenseRepo.listExpensesCursor({
      workerId,
      jobId: query.jobId,
      category: query.category,
      startDate,
      endDate,
      cursor: query.cursor,
      limit: query.limit,
    });
  }

  /**
   * Worker updates an existing expense.
   */
  async updateExpense(
    expenseId: string,
    workerId: string,
    input: UpdateExpenseInputDto
  ): Promise<IExpenseEntity> {
    if (!Types.ObjectId.isValid(expenseId) || !Types.ObjectId.isValid(workerId)) {
      throw new BadRequestError('Invalid ID format');
    }

    if (input.amount !== undefined && (!Number.isInteger(input.amount) || input.amount <= 0)) {
      throw new BadRequestError('Amount must be a positive integer representing paise');
    }

    const existing = await this.expenseRepo.findById(expenseId);
    if (!existing || existing.deletedAt) {
      throw new NotFoundError('Expense not found');
    }

    if (existing.workerId !== workerId) {
      throw new ForbiddenError('You can only update your own expenses');
    }

    // Keep the immutable ledger consistent with the expense document. The ledger
    // forbids in-place modification, so apply the delta as an ADJUSTMENT entry.
    return withTransaction(async (session) => {
      const updated = await this.expenseRepo.update(expenseId, workerId, input, session ?? undefined);
      if (!updated) {
        throw new NotFoundError('Expense not found');
      }

      if (input.amount !== undefined && input.amount !== existing.amount) {
        // Append a signed EXPENSE delta so sum(EXPENSE entries) always equals
        // the expense's current amount (the ledger itself is append-only).
        const delta = input.amount - existing.amount;
        await this.transactionRepo.create(
          {
            workerId,
            jobId: updated.jobId,
            type: TransactionType.EXPENSE,
            amount: delta, // positive = increased expense, negative = decreased expense
            currency: updated.currency,
            referenceId: `expense:${expenseId}:adjust:${randomUUID()}`,
            metadata: {
              expenseId,
              reason: 'EXPENSE_AMOUNT_CORRECTION',
              previousAmount: existing.amount,
              newAmount: input.amount,
            },
          },
          session ?? undefined
        );
      }

      return updated;
    });
  }

  /**
   * Worker soft-deletes an expense.
   */
  async deleteExpense(expenseId: string, workerId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(expenseId) || !Types.ObjectId.isValid(workerId)) {
      throw new BadRequestError('Invalid ID format');
    }

    const existing = await this.expenseRepo.findById(expenseId);
    if (!existing || existing.deletedAt) {
      throw new NotFoundError('Expense not found');
    }

    if (existing.workerId !== workerId) {
      throw new ForbiddenError('You can only delete your own expenses');
    }

    // Ledger entries are immutable; void the original EXPENSE entry with an
    // offsetting negative ADJUSTMENT so earnings reflect the deletion.
    return withTransaction(async (session) => {
      const deleted = await this.expenseRepo.softDelete(expenseId, workerId, session ?? undefined);
      if (!deleted) {
        throw new NotFoundError('Expense not found');
      }

      await this.transactionRepo.create(
        {
          workerId,
          jobId: existing.jobId,
          type: TransactionType.EXPENSE,
          amount: -existing.amount,
          currency: existing.currency,
          referenceId: `expense:${expenseId}:void:${randomUUID()}`,
          metadata: {
            expenseId,
            reason: 'EXPENSE_DELETED',
            voidedAmount: existing.amount,
          },
        },
        session ?? undefined
      );

      return true;
    });
  }
}

export const expenseService = new ExpenseService();
