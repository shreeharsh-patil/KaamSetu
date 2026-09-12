import { Request, Response } from 'express';
import { expenseService } from './expense.service.js';
import {
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesQuerySchema,
} from '@kaamsetu/validation';
import { UnauthorizedError, BadRequestError } from '../../errors/index.js';

export async function createExpense(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const validatedData = createExpenseSchema.parse(req.body);
  const expense = await expenseService.createExpense(req.user.id, validatedData);

  res.status(201).json({
    success: true,
    data: expense,
  });
}

export async function listExpenses(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const validatedQuery = listExpensesQuerySchema.parse(req.query);
  const result = await expenseService.listExpenses(req.user.id, validatedQuery);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function updateExpense(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) {
    throw new BadRequestError('Expense ID parameter is required');
  }

  const validatedData = updateExpenseSchema.parse(req.body);
  const updated = await expenseService.updateExpense(id, req.user.id, validatedData);

  res.status(200).json({
    success: true,
    data: updated,
  });
}

export async function deleteExpense(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) {
    throw new BadRequestError('Expense ID parameter is required');
  }

  await expenseService.deleteExpense(id, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Expense deleted successfully',
  });
}
