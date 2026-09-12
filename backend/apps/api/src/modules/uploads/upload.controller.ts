import { Request, Response } from 'express';
import { uploadService } from './upload.service.js';
import {
  presignUploadSchema,
  completeUploadSchema,
} from '@kaamsetu/validation';
import { UnauthorizedError } from '../../errors/index.js';

function getParamId(req: Request, paramName: string = 'id'): string {
  const val = req.params[paramName];
  if (Array.isArray(val)) {
    return val[0]!;
  }
  return val as string;
}

export async function presignUpload(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const validatedData = presignUploadSchema.parse(req.body);
  const result = await uploadService.createPresignedUpload(req.user.id, validatedData);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function completeUpload(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const validatedData = completeUploadSchema.parse(req.body);
  const result = await uploadService.completeUpload(req.user.id, validatedData.uploadId);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function deleteUpload(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const id = getParamId(req);
  const result = await uploadService.deleteUpload(req.user.id, req.user.role, id);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getDownloadUrl(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const id = getParamId(req);
  const result = await uploadService.getDownloadUrl(req.user.id, req.user.role, id);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getUploadById(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const id = getParamId(req);
  const result = await uploadService.getUploadById(req.user.id, req.user.role, id);

  res.status(200).json({
    success: true,
    data: result,
  });
}
