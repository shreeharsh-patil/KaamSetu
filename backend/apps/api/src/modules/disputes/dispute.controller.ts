import { Request, Response } from 'express';
import { disputeService } from './dispute.service.js';
import {
  createDisputeSchema,
  resolveDisputeSchema,
  listDisputesQuerySchema,
} from '@kaamsetu/validation';
import { UnauthorizedError, BadRequestError, ForbiddenError } from '../../errors/index.js';
import { UserRole } from '@kaamsetu/types';

export async function createDispute(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const validatedData = createDisputeSchema.parse(req.body);
  const dispute = await disputeService.createDispute(req.user.id, validatedData);

  res.status(201).json({
    success: true,
    data: dispute,
  });
}

export async function getMyDisputes(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const validatedQuery = listDisputesQuerySchema.parse(req.query);
  const result = await disputeService.getMyDisputes(req.user.id, validatedQuery);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function listDisputes(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const validatedQuery = listDisputesQuerySchema.parse(req.query);
  const result = await disputeService.listDisputes(validatedQuery);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getDisputeById(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) {
    throw new BadRequestError('Dispute ID parameter is required');
  }

  const dispute = await disputeService.getDisputeById(id);

  if (
    req.user.role !== UserRole.ADMIN &&
    req.user.role !== UserRole.SUPPORT &&
    dispute.initiatorId !== req.user.id &&
    dispute.respondentId !== req.user.id
  ) {
    throw new ForbiddenError('You do not have permission to view this dispute');
  }

  res.status(200).json({
    success: true,
    data: dispute,
  });
}

export async function resolveDispute(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) {
    throw new BadRequestError('Dispute ID parameter is required');
  }

  const validatedData = resolveDisputeSchema.parse(req.body);
  const dispute = await disputeService.resolveDispute(
    { id: req.user.id, role: req.user.role },
    id,
    validatedData
  );

  res.status(200).json({
    success: true,
    data: dispute,
  });
}
