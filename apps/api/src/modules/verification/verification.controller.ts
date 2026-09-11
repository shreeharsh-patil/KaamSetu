import { Request, Response } from 'express';
import { verificationService } from './verification.service.js';
import {
  createVerificationRequestSchema,
  reviewVerificationRequestSchema,
  listVerificationRequestsQuerySchema,
} from '@kaamsetu/validation';
import { UnauthorizedError, BadRequestError, ForbiddenError } from '../../errors/index.js';
import { UserRole } from '@kaamsetu/types';

export async function submitVerification(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const validatedData = createVerificationRequestSchema.parse(req.body);
  const result = await verificationService.submitRequest(req.user.id, validatedData);

  res.status(201).json({
    success: true,
    data: result,
  });
}

export async function getMyVerificationRequests(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const validatedQuery = listVerificationRequestsQuerySchema.parse(req.query);
  const result = await verificationService.getMyRequests(req.user.id, validatedQuery);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function listVerificationRequests(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const validatedQuery = listVerificationRequestsQuerySchema.parse(req.query);
  const result = await verificationService.listRequests(validatedQuery);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getVerificationRequestById(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) {
    throw new BadRequestError('Request ID parameter is required');
  }

  const result = await verificationService.getRequestById(id);

  // Worker can only view their own; Admin/Support can view any
  if (
    req.user.role !== UserRole.ADMIN &&
    req.user.role !== UserRole.SUPPORT &&
    result.workerId !== req.user.id
  ) {
    throw new ForbiddenError('You do not have permission to view this verification request');
  }

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function reviewVerificationRequest(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) {
    throw new BadRequestError('Request ID parameter is required');
  }

  const validatedData = reviewVerificationRequestSchema.parse(req.body);
  const result = await verificationService.reviewRequest(
    { id: req.user.id, role: req.user.role },
    id,
    validatedData
  );

  res.status(200).json({
    success: true,
    data: result,
  });
}
