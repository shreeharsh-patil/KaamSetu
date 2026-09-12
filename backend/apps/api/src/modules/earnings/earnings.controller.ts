import { Request, Response } from 'express';
import { earningsService } from './earnings.service.js';
import { earningsSummaryQuerySchema } from '@kaamsetu/validation';
import { UnauthorizedError } from '../../errors/index.js';

export async function getEarningsSummary(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const validatedQuery = earningsSummaryQuerySchema.parse(req.query);
  const summary = await earningsService.getEarningsSummary(req.user.id, validatedQuery);

  res.status(200).json({
    success: true,
    data: summary,
  });
}

export async function getEarningsJobs(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const cursor = typeof req.query['cursor'] === 'string' ? req.query['cursor'] : undefined;
  const limit = req.query['limit'] ? Number(req.query['limit']) : 20;

  const result = await earningsService.getEarningsJobs(req.user.id, cursor, limit);

  res.status(200).json({
    success: true,
    data: result,
  });
}
