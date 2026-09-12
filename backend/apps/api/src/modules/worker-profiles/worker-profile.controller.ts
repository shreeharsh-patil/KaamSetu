import { Request, Response } from 'express';
import { workerProfileService } from './worker-profile.service.js';
import {
  patchWorkerMeSchema,
  updateWorkerLocationSchema,
  updateWorkerAvailabilitySchema,
  updateWorkerServiceRadiusSchema,
  addWorkerSkillSchema,
} from '@kaamsetu/validation';
import { UnauthorizedError, BadRequestError } from '../../errors/index.js';

export async function getMyWorkerProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const profile = await workerProfileService.getMyProfile(req.user.id);

  res.status(200).json({
    success: true,
    data: profile,
  });
}

export async function updateMyWorkerProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const validatedData = patchWorkerMeSchema.parse(req.body);
  const updated = await workerProfileService.updateMyProfile(req.user.id, validatedData);

  res.status(200).json({
    success: true,
    data: updated,
  });
}

export async function updateWorkerLocation(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const { coordinates } = updateWorkerLocationSchema.parse(req.body);
  const updated = await workerProfileService.updateLocation(req.user.id, coordinates);

  res.status(200).json({
    success: true,
    data: updated,
  });
}

export async function updateWorkerAvailability(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const { availabilityStatus } = updateWorkerAvailabilitySchema.parse(req.body);
  const updated = await workerProfileService.updateAvailability(req.user.id, availabilityStatus);

  res.status(200).json({
    success: true,
    data: updated,
  });
}

export async function updateWorkerServiceRadius(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const { radiusKm } = updateWorkerServiceRadiusSchema.parse(req.body);
  const updated = await workerProfileService.updateServiceRadius(req.user.id, radiusKm);

  res.status(200).json({
    success: true,
    data: updated,
  });
}

export async function addWorkerSkill(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const validatedSkill = addWorkerSkillSchema.parse(req.body);
  const updated = await workerProfileService.addSkill(req.user.id, validatedSkill);

  res.status(201).json({
    success: true,
    data: updated,
  });
}

export async function removeWorkerSkill(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const rawSkillId = req.params['skillId'];
  const skillId = Array.isArray(rawSkillId) ? rawSkillId[0] : rawSkillId;
  if (!skillId) {
    throw new BadRequestError('Skill ID parameter is required');
  }

  const updated = await workerProfileService.removeSkill(req.user.id, skillId);

  res.status(200).json({
    success: true,
    data: updated,
  });
}

export async function getPublicWorkerProfile(req: Request, res: Response): Promise<void> {
  const rawWorkerId = req.params['workerId'];
  const workerId = Array.isArray(rawWorkerId) ? rawWorkerId[0] : rawWorkerId;
  if (!workerId) {
    throw new BadRequestError('Worker ID parameter is required');
  }

  const publicProfile = await workerProfileService.getPublicProfile(workerId);

  res.status(200).json({
    success: true,
    data: publicProfile,
  });
}
