import { Types } from 'mongoose';
import {
  UserRole,
  TransactionType,
  type ITransactionEntity,
  type CursorPage,
} from '@kaamsetu/types';
import type {
  ListTransactionsQueryDto,
  CreateAdjustmentInputDto,
} from '@kaamsetu/validation';
import {
  ITransactionRepository,
  transactionRepository,
} from './transaction.repository.js';
import { BadRequestError } from '../../errors/index.js';

export class TransactionService {
  constructor(
    private readonly transactionRepo: ITransactionRepository = transactionRepository
  ) {}

  /**
   * List transactions with cursor pagination.
   * Workers can only query their own ledger; Admins can query any or all.
   */
  async listTransactions(
    user: { id: string; role: UserRole },
    query: ListTransactionsQueryDto
  ): Promise<CursorPage<ITransactionEntity>> {
    const workerId =
      user.role === UserRole.WORKER
        ? user.id
        : undefined;

    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    return this.transactionRepo.listTransactionsCursor({
      workerId,
      type: query.type as TransactionType | undefined,
      startDate,
      endDate,
      cursor: query.cursor,
      limit: query.limit,
    });
  }

  /**
   * Privileged admin adjustment workflow.
   * Creates an immutable ledger adjustment entry for corrections/disputes.
   */
  async createAdjustment(
    adminId: string,
    input: CreateAdjustmentInputDto
  ): Promise<ITransactionEntity> {
    if (!Types.ObjectId.isValid(input.workerId)) {
      throw new BadRequestError('Invalid worker ID format');
    }

    if (!Number.isInteger(input.amount) || input.amount === 0) {
      throw new BadRequestError('Adjustment amount must be a non-zero integer in paise');
    }

    const referenceId =
      input.referenceId ?? `adj:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;

    return this.transactionRepo.create({
      workerId: input.workerId,
      jobId: input.jobId,
      type: TransactionType.ADJUSTMENT,
      amount: Math.round(input.amount),
      currency: 'INR',
      referenceId,
      metadata: {
        adminId,
        reason: input.reason,
      },
    });
  }
}

export const transactionService = new TransactionService();
