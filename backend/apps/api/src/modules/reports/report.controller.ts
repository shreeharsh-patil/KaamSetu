import { Request, Response } from 'express';
import { reportService } from './report.service.js';
import {
  createReportSchema,
  updateReportSchema,
  listReportsQuerySchema,
} from '@kaamsetu/validation';
import { UnauthorizedError, BadRequestError, ForbiddenError } from '../../errors/index.js';
import { UserRole } from '@kaamsetu/types';

export async function createReport(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const validatedData = createReportSchema.parse(req.body);
  const report = await reportService.createReport(req.user.id, validatedData);

  res.status(201).json({
    success: true,
    data: report,
  });
}

export async function getMyReports(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const validatedQuery = listReportsQuerySchema.parse(req.query);
  const result = await reportService.getMyReports(req.user.id, validatedQuery);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function listReports(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const validatedQuery = listReportsQuerySchema.parse(req.query);
  const result = await reportService.listReports(validatedQuery);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getReportById(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) {
    throw new BadRequestError('Report ID parameter is required');
  }

  const report = await reportService.getReportById(id);

  if (
    req.user.role !== UserRole.ADMIN &&
    req.user.role !== UserRole.SUPPORT &&
    report.reporterId !== req.user.id
  ) {
    throw new ForbiddenError('You do not have permission to view this report');
  }

  res.status(200).json({
    success: true,
    data: report,
  });
}

export async function updateReport(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) {
    throw new BadRequestError('Report ID parameter is required');
  }

  const validatedData = updateReportSchema.parse(req.body);
  const report = await reportService.updateReport(
    { id: req.user.id, role: req.user.role },
    id,
    validatedData
  );

  res.status(200).json({
    success: true,
    data: report,
  });
}
