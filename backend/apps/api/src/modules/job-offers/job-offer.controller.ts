import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { jobOfferService } from './job-offer.service.js';
import {
  listJobOffersQuerySchema,
  rejectOfferSchema,
} from '@kaamsetu/validation';
import { UnauthorizedError, BadRequestError } from '../../errors/index.js';
import { UserRole } from '@kaamsetu/types';
import { jobViewService } from '../jobs/job-view.service.js';

function requireUser(req: Request): { id: string; role: UserRole } {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  return { id: req.user.id, role: req.user.role };
}

/**
 * GET /api/v1/worker/offers — get pending/active offers for authenticated worker.
 */
export async function getWorkerOffers(req: Request, res: Response): Promise<void> {
  const actor = requireUser(req);
  const query = listJobOffersQuerySchema.parse(req.query);

  const page = await jobOfferService.getOfferViewsForWorker(actor.id, query);

  res.status(200).json({
    success: true,
    data: {
      offers: page.items,
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    },
  });
}

/**
 * GET /api/v1/offers/:id — get job offer details.
 */
export async function getOfferById(req: Request, res: Response): Promise<void> {
  const actor = requireUser(req);
  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid or missing offer ID');
  }

  const offer = await jobOfferService.getOfferViewById(id, actor);

  res.status(200).json({
    success: true,
    data: { offer },
  });
}

/**
 * POST /api/v1/offers/:id/accept — worker accepts a job offer.
 */
export async function acceptOffer(req: Request, res: Response): Promise<void> {
  const actor = requireUser(req);
  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid or missing offer ID');
  }

  const result = await jobOfferService.acceptOffer(id, actor.id);

  res.status(200).json({
    success: true,
    data: {
      offer: result.offer,
      job: await jobViewService.toView(result.job, actor),
    },
  });
}

/**
 * POST /api/v1/offers/:id/reject — worker rejects a job offer.
 */
export async function rejectOffer(req: Request, res: Response): Promise<void> {
  const actor = requireUser(req);
  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid or missing offer ID');
  }

  const input = rejectOfferSchema.parse(req.body);
  const rejected = await jobOfferService.rejectOffer(id, actor.id, input.reason);

  res.status(200).json({
    success: true,
    data: { offer: rejected },
  });
}
