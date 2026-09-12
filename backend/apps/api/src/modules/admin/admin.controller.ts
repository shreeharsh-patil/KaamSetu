import { Request, Response } from 'express';
import { adminService } from './admin.service.js';
import {
  adminUserListQuerySchema,
  suspendUserSchema,
  restoreUserSchema,
  changeUserRoleSchema,
  adminWorkerListQuerySchema,
  rejectVerificationAdminSchema,
  adminJobListQuerySchema,
  adminReportListQuerySchema,
  adminDisputeListQuerySchema,
  financialAdjustmentSchema,
  createCategoryAdminSchema,
  updateCategoryAdminSchema,
  createSkillAdminSchema,
  updateSkillAdminSchema,
  adminAuditLogListQuerySchema,
} from '@kaamsetu/validation';
import { UnauthorizedError } from '../../errors/index.js';
import {
  UserRole,
  type IAdminActionContext,
  type IAdminJobListQuery,
} from '@kaamsetu/types';

function getParamId(req: Request, paramName: string = 'id'): string {
  const val = req.params[paramName];
  if (Array.isArray(val)) {
    return val[0]!;
  }
  return val as string;
}

function extractActorContext(req: Request, res: Response): IAdminActionContext {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const rawIp =
    (req.headers['x-forwarded-for'] as string) ||
    req.socket.remoteAddress ||
    req.ip ||
    null;
  const ipAddress = typeof rawIp === 'string' ? rawIp.split(',')[0]!.trim() : null;
  const requestId =
    (req.headers['x-request-id'] as string) ||
    (res.getHeader('x-request-id') as string) ||
    null;

  return {
    actorId: req.user.id,
    actorRole: req.user.role,
    ipAddress,
    requestId,
  };
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const actor = extractActorContext(req, res);
  const validatedQuery = adminUserListQuerySchema.parse(req.query);
  const result = await adminService.listUsers(actor, validatedQuery);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  const actor = extractActorContext(req, res);
  const result = await adminService.getUserById(actor, getParamId(req));

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function suspendUser(req: Request, res: Response): Promise<void> {
  const actor = extractActorContext(req, res);
  const validatedBody = suspendUserSchema.parse(req.body);
  const result = await adminService.suspendUser(actor, getParamId(req), validatedBody);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function restoreUser(req: Request, res: Response): Promise<void> {
  const actor = extractActorContext(req, res);
  const validatedBody = restoreUserSchema.parse(req.body || {});
  const result = await adminService.restoreUser(actor, getParamId(req), validatedBody);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function changeUserRole(req: Request, res: Response): Promise<void> {
  const actor = extractActorContext(req, res);
  const validatedBody = changeUserRoleSchema.parse(req.body);
  const result = await adminService.changeUserRole(actor, getParamId(req), {
    newRole: validatedBody.newRole as UserRole,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function listWorkers(req: Request, res: Response): Promise<void> {
  const actor = extractActorContext(req, res);
  const validatedQuery = adminWorkerListQuerySchema.parse(req.query);
  const result = await adminService.listWorkers(actor, validatedQuery);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function approveVerification(req: Request, res: Response): Promise<void> {
  const actor = extractActorContext(req, res);
  const result = await adminService.approveVerification(actor, getParamId(req));

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function rejectVerification(req: Request, res: Response): Promise<void> {
  const actor = extractActorContext(req, res);
  const validatedBody = rejectVerificationAdminSchema.parse(req.body);
  const result = await adminService.rejectVerification(actor, getParamId(req), validatedBody);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function listJobs(req: Request, res: Response): Promise<void> {
  const actor = extractActorContext(req, res);
  const validatedQuery = adminJobListQuerySchema.parse(req.query);
  const result = await adminService.listJobs(actor, validatedQuery as IAdminJobListQuery);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function listReports(req: Request, res: Response): Promise<void> {
  const actor = extractActorContext(req, res);
  const validatedQuery = adminReportListQuerySchema.parse(req.query);
  const result = await adminService.listReports(actor, validatedQuery);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function listDisputes(req: Request, res: Response): Promise<void> {
  const actor = extractActorContext(req, res);
  const validatedQuery = adminDisputeListQuerySchema.parse(req.query);
  const result = await adminService.listDisputes(actor, validatedQuery);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function createFinancialAdjustment(req: Request, res: Response): Promise<void> {
  const actor = extractActorContext(req, res);
  const validatedBody = financialAdjustmentSchema.parse(req.body);
  const result = await adminService.createFinancialAdjustment(actor, validatedBody);

  res.status(201).json({
    success: true,
    data: result,
  });
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const actor = extractActorContext(req, res);
  const validatedBody = createCategoryAdminSchema.parse(req.body);
  const result = await adminService.createCategory(actor, validatedBody);

  res.status(201).json({
    success: true,
    data: result,
  });
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  const actor = extractActorContext(req, res);
  const validatedBody = updateCategoryAdminSchema.parse(req.body);
  const result = await adminService.updateCategory(actor, getParamId(req), validatedBody);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function createSkill(req: Request, res: Response): Promise<void> {
  const actor = extractActorContext(req, res);
  const validatedBody = createSkillAdminSchema.parse(req.body);
  const result = await adminService.createSkill(actor, validatedBody);

  res.status(201).json({
    success: true,
    data: result,
  });
}

export async function updateSkill(req: Request, res: Response): Promise<void> {
  const actor = extractActorContext(req, res);
  const validatedBody = updateSkillAdminSchema.parse(req.body);
  const result = await adminService.updateSkill(actor, getParamId(req), validatedBody);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  const actor = extractActorContext(req, res);
  const validatedQuery = adminAuditLogListQuerySchema.parse(req.query);
  const result = await adminService.listAuditLogs(actor, validatedQuery);

  res.status(200).json({
    success: true,
    data: result,
  });
}
