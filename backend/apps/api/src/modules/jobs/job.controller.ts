import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { jobService } from './job.service.js';
import {
  createJobSchema,
  updateJobSchema,
  listJobsQuerySchema,
} from '@kaamsetu/validation';
import { UnauthorizedError, BadRequestError } from '../../errors/index.js';
import { UserRole } from '@kaamsetu/types';
import { jobViewService } from './job-view.service.js';

function requireUser(req: Request): { id: string; role: UserRole } {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  return { id: req.user.id, role: req.user.role };
}

/**
 * POST /api/v1/jobs — create a job in DRAFT (or OPEN if publishImmediately).
 */
export async function createJob(req: Request, res: Response): Promise<void> {
  const actor = requireUser(req);
  const input = createJobSchema.parse(req.body);

  const job = await jobService.createJob(actor.id, actor.role, input);

  res.status(201).json({ success: true, data: { job: await jobViewService.toView(job, actor) } });
}

/**
 * GET /api/v1/jobs — cursor paginated list with status/category filters.
 */
export async function listJobs(req: Request, res: Response): Promise<void> {
  const actor = requireUser(req);
  const query = listJobsQuerySchema.parse(req.query);

  const page = await jobService.listJobs(
    actor,
    {
      status: query.status,
      categoryId: query.categoryId,
      cursor: query.cursor,
      limit: query.limit,
    }
  );

  res.status(200).json({
    success: true,
    data: {
      jobs: await jobViewService.toViews(page.items, actor),
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    },
  });
}

/** GET /api/v1/jobs/:id */
export async function getJob(req: Request, res: Response): Promise<void> {
  const actor = requireUser(req);
  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid or missing job ID');
  }

  const job = await jobService.getJobById(id, actor);

  res.status(200).json({ success: true, data: { job: await jobViewService.toView(job, actor) } });
}

export const getJobById = getJob;

/**
 * PATCH /api/v1/jobs/:id — editable fields only.
 */
export async function updateJob(req: Request, res: Response): Promise<void> {
  const actor = requireUser(req);
  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid or missing job ID');
  }

  const input = updateJobSchema.parse(req.body);
  const job = await jobService.updateJob(id, actor, input);

  res.status(200).json({ success: true, data: { job: await jobViewService.toView(job, actor) } });
}

/** POST /api/v1/jobs/:id/publish — DRAFT -> OPEN via the state machine */
export async function publishJob(req: Request, res: Response): Promise<void> {
  const actor = requireUser(req);
  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid or missing job ID');
  }

  const job = await jobService.publishJob(id, actor);

  res.status(200).json({ success: true, data: { job: await jobViewService.toView(job, actor) } });
}

/** POST /api/v1/jobs/:id/cancel — active -> CANCELLED via the state machine */
export async function cancelJob(req: Request, res: Response): Promise<void> {
  const actor = requireUser(req);
  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid or missing job ID');
  }

  const reason = typeof req.body?.reason === 'string' ? req.body.reason : undefined;
  const job = await jobService.cancelJob(id, actor, reason ?? '');

  res.status(200).json({ success: true, data: { job: await jobViewService.toView(job, actor) } });
}

/** GET /api/v1/jobs/:id/events — immutable audit trail */
export async function getJobEvents(req: Request, res: Response): Promise<void> {
  const actor = requireUser(req);
  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid or missing job ID');
  }

  const events = await jobService.getJobHistory(id, actor);

  res.status(200).json({ success: true, data: { events } });
}

/** POST /api/v1/jobs/:id/start-travel — assigned worker starts traveling */
export async function startTravel(req: Request, res: Response): Promise<void> {
  const actor = requireUser(req);
  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid or missing job ID');
  }

  const job = await jobService.startTravel(id, actor.id);
  res.status(200).json({ success: true, data: { job: await jobViewService.toView(job, actor) } });
}

/** POST /api/v1/jobs/:id/arrive — assigned worker arrives at job location */
export async function arrive(req: Request, res: Response): Promise<void> {
  const actor = requireUser(req);
  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid or missing job ID');
  }

  const job = await jobService.arrive(id, actor.id);
  res.status(200).json({ success: true, data: { job: await jobViewService.toView(job, actor) } });
}

/** POST /api/v1/jobs/:id/start — assigned worker starts work */
export async function startJob(req: Request, res: Response): Promise<void> {
  const actor = requireUser(req);
  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid or missing job ID');
  }

  const job = await jobService.startJob(id, actor.id);
  res.status(200).json({ success: true, data: { job: await jobViewService.toView(job, actor) } });
}

/** POST /api/v1/jobs/:id/complete — assigned worker completes work */
export async function completeJob(req: Request, res: Response): Promise<void> {
  const actor = requireUser(req);
  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid or missing job ID');
  }

  const job = await jobService.completeJob(id, actor.id);
  res.status(200).json({ success: true, data: { job: await jobViewService.toView(job, actor) } });
}
