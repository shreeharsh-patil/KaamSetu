import { Types, ClientSession } from 'mongoose';
import {
  UserRole,
  JobStatus,
  JobOfferStatus,
  type IJobOfferEntity,
  type IJobEntity,
  type CursorPage,
  type ListJobOffersFilters,
} from '@kaamsetu/types';
import { IJobOfferRepository, jobOfferRepository } from './job-offer.repository.js';
import { IJobRepository, jobRepository } from '../jobs/job.repository.js';
import { IJobEventRepository, jobEventRepository } from '../job-events/job-event.repository.js';
import { JobModel, toJobEntity } from '../jobs/job.model.js';
import { withTransaction } from '../../database/transaction.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
} from '../../errors/index.js';
import { RealtimeGateway, realtimeGateway } from '../../realtime/index.js';

export interface AcceptOfferResult {
  offer: IJobOfferEntity;
  job: IJobEntity;
}

export class JobOfferService {
  constructor(
    private readonly jobOfferRepo: IJobOfferRepository = jobOfferRepository,
    private readonly jobRepo: IJobRepository = jobRepository,
    private readonly jobEventRepo: IJobEventRepository = jobEventRepository,
    private readonly realtime: RealtimeGateway = realtimeGateway
  ) {}

  /**
   * Get offers directed to a worker with cursor pagination.
   */
  async getOffersForWorker(
    workerId: string,
    filters: ListJobOffersFilters
  ): Promise<CursorPage<IJobOfferEntity>> {
    return this.jobOfferRepo.findWorkerOffers({
      ...filters,
      workerId,
    });
  }

  /**
   * Get offer details with permission check.
   */
  async getOfferById(
    offerId: string,
    user: { id: string; role: UserRole }
  ): Promise<IJobOfferEntity> {
    const offer = await this.jobOfferRepo.findById(offerId);
    if (!offer) {
      throw new NotFoundError('Job offer not found');
    }

    if (user.role === UserRole.WORKER && offer.workerId !== user.id) {
      throw new ForbiddenError('You do not have permission to view this offer');
    } else if (user.role === UserRole.CUSTOMER) {
      const job = await this.jobRepo.findById(offer.jobId);
      if (!job || job.customerId !== user.id) {
        throw new ForbiddenError('You do not have permission to view this offer');
      }
    }

    return offer;
  }

  /**
   * Concurrency-safe atomic offer acceptance.
   * Ensures two workers can never accept the same job simultaneously.
   */
  async acceptOffer(offerId: string, workerId: string): Promise<AcceptOfferResult> {
    if (!Types.ObjectId.isValid(offerId) || !Types.ObjectId.isValid(workerId)) {
      throw new BadRequestError('Invalid offer ID or worker ID');
    }

    const offer = await this.jobOfferRepo.findById(offerId);
    if (!offer) {
      throw new NotFoundError('Job offer not found');
    }

    if (offer.workerId !== workerId) {
      throw new ForbiddenError('You are not the recipient of this job offer');
    }

    if (offer.status !== JobOfferStatus.PENDING) {
      throw new ConflictError(`Offer is no longer pending (current status: ${offer.status})`);
    }

    if (new Date(offer.expiresAt) <= new Date()) {
      throw new ConflictError('Job offer has expired');
    }

    // Use transaction with atomic conditional updates
    const result = await withTransaction<AcceptOfferResult>(async (session: ClientSession | null) => {
      const sess = session ?? undefined;

      // 1. Atomic job acquisition: Only succeed if status is OFFERED/MATCHING/OPEN and unassigned
      const assignedJobDoc = await JobModel.findOneAndUpdate(
        {
          _id: new Types.ObjectId(offer.jobId),
          status: { $in: [JobStatus.OPEN, JobStatus.MATCHING, JobStatus.OFFERED] },
          assignedWorkerId: null,
          deletedAt: null,
        },
        {
          $set: {
            status: JobStatus.ACCEPTED,
            assignedWorkerId: new Types.ObjectId(workerId),
          },
        },
        { new: true, session: sess }
      ).exec();

      if (!assignedJobDoc) {
        throw new ConflictError(
          'This job has already been accepted by another worker or is no longer available'
        );
      }

      // 2. Atomic offer state transition
      const acceptedOffer = await this.jobOfferRepo.acceptOfferAtomic(offerId, workerId, sess);
      if (!acceptedOffer) {
        throw new ConflictError('Offer could not be accepted; it may have expired or already updated');
      }

      // 3. Withdraw all remaining pending offers for this job
      await this.jobOfferRepo.withdrawOtherOffersForJob(offer.jobId, offerId, sess);

      // 4. Log state change event
      await this.jobEventRepo.create(
        {
          jobId: offer.jobId,
          actorId: workerId,
          actorRole: UserRole.WORKER,
          eventType: 'OFFER_ACCEPTED',
          previousState: JobStatus.OFFERED,
          newState: JobStatus.ACCEPTED,
          metadata: {
            offerId,
            matchScore: offer.matchScore,
            distanceKm: offer.distanceKm,
          },
        },
        sess
      );

      return {
        offer: acceptedOffer,
        job: toJobEntity(assignedJobDoc),
      };
    });

    // Emit realtime notifications to job room and customer
    const acceptedAt = new Date().toISOString();
    this.realtime.emitToJob(offer.jobId, 'job.accepted', {
      jobId: offer.jobId,
      workerId,
      acceptedAt,
    });
    this.realtime.emitToUser(result.job.customerId, 'job.accepted', {
      jobId: offer.jobId,
      workerId,
      acceptedAt,
    });
    this.realtime.emitToJob(offer.jobId, 'job.status.changed', {
      jobId: offer.jobId,
      previousStatus: JobStatus.OFFERED,
      newStatus: JobStatus.ACCEPTED,
      updatedAt: acceptedAt,
    });
    this.realtime.emitToUser(result.job.customerId, 'job.status.changed', {
      jobId: offer.jobId,
      previousStatus: JobStatus.OFFERED,
      newStatus: JobStatus.ACCEPTED,
      updatedAt: acceptedAt,
    });

    return result;
  }

  /**
   * Reject a pending job offer.
   */
  async rejectOffer(
    offerId: string,
    workerId: string,
    reason?: string
  ): Promise<IJobOfferEntity> {
    if (!Types.ObjectId.isValid(offerId) || !Types.ObjectId.isValid(workerId)) {
      throw new BadRequestError('Invalid offer ID or worker ID');
    }

    const offer = await this.jobOfferRepo.findById(offerId);
    if (!offer) {
      throw new NotFoundError('Job offer not found');
    }

    if (offer.workerId !== workerId) {
      throw new ForbiddenError('You are not the recipient of this job offer');
    }

    if (offer.status !== JobOfferStatus.PENDING) {
      throw new ConflictError(`Offer is no longer pending (current status: ${offer.status})`);
    }

    const rejected = await this.jobOfferRepo.rejectOffer(offerId, workerId);
    if (!rejected) {
      throw new ConflictError('Offer could not be rejected; it may have already changed status');
    }

    await this.jobEventRepo.create({
      jobId: offer.jobId,
      actorId: workerId,
      actorRole: UserRole.WORKER,
      eventType: 'OFFER_REJECTED',
      previousState: JobStatus.OFFERED,
      newState: JobStatus.OFFERED,
      reason,
      metadata: {
        offerId,
        reason,
      },
    });

    return rejected;
  }
}

export const jobOfferService = new JobOfferService();
