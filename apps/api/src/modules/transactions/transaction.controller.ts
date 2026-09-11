import { Request, Response } from 'express';
import { transactionService } from './transaction.service.js';
import {
  listTransactionsQuerySchema,
  createAdjustmentSchema,
} from '@kaamsetu/validation';
import { UnauthorizedError, ForbiddenError } from '../../errors/index.js';
import { UserRole } from '@kaamsetu/types';

export async function listTransactions(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const validatedQuery = listTransactionsQuerySchema.parse(req.query);
  const result = await transactionService.listTransactions(
    { id: req.user.id, role: req.user.role },
    validatedQuery
  );

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function createAdjustment(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (req.user.role !== UserRole.ADMIN) {
    throw new ForbiddenError('Only administrators can create ledger adjustments');
  }

  const validatedData = createAdjustmentSchema.parse(req.body);
  const transaction = await transactionService.createAdjustment(req.user.id, validatedData);

  res.status(201).json({
    success: true,
    data: transaction,
  });
}
