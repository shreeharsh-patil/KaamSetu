import { Types } from 'mongoose';
import {
  UserRole,
  JobStatus,
  WorkerAvailability,
  type IJobOfferEntity,
  type IWorkerProfileEntity,
  type MatchingConfig,
} from '@kaamsetu/types';
import { WorkerProfileModel, mapWorkerDocumentToEntity } from '../worker-profiles/worker-profile.model.js';
import { UserModel } from '../users/user.model.js';
import { JobStateMachine } from '../jobs/job-state-machine.js';
import { jobRepository, IJobRepository } from '../jobs/job.repository.js';
import { jobOfferRepository, IJobOfferRepository } from '../job-offers/job-offer.repository.js';
import { jobEventRepository, IJobEventRepository } from '../job-events/job-event.repository.js';
import { ScoringService, scoringService, calculateHaversineDistanceKm, CalculatedMatch } from './scoring.service.js';
import { DEFAULT_MATCHING_CONFIG } from './matching.config.js';
import { NotFoundError, BadRequestError, ConflictError } from '../../errors/index.js';
import { RealtimeGateway, realtimeGateway } from '../../realtime/index.js';

export interface RankedWorkerCandidate {
  worker: IWorkerProfileEntity;
  distanceKm: number;
  matchScore: number;
  scoreBreakdown: CalculatedMatch['scoreBreakdown'];
}

export class MatchingService {
  constructor(
    private readonly jobRepo: IJobRepository = jobRepository,
    private readonly offerRepo: IJobOfferRepository = jobOfferRepository,
    private readonly eventRepo: IJobEventRepository = jobEventRepository,
    private readonly scorer: ScoringService = scoringService,
    private readonly config: MatchingConfig = DEFAULT_MATCHING_CONFIG,
    private readonly realtime: RealtimeGateway = realtimeGateway
  ) {}

  /**
   * Finds, filters, and deterministically ranks eligible workers for a job.
   */
  async findRankedCandidates(
    jobId: string,
    customConfig?: Partial<MatchingConfig>
  ): Promise<RankedWorkerCandidate[]> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new BadRequestError('Invalid job ID format');
    }

    const job = await this.jobRepo.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    const cfg = {
      ...this.config,
      ...customConfig,
      weights: { ...this.config.weights, ...customConfig?.weights },
    };

    const [jobLng, jobLat] = job.location.coordinates;
    const maxDistanceMeters = cfg.maxSearchRadiusKm * 1000;

    // 1. Fetch existing offer recipient worker IDs to avoid duplicate offers
    const existingWorkerIds = await this.offerRepo.findExistingWorkerIdsForJob(jobId);
    const excludedUserObjectIds = existingWorkerIds.map((id) => new Types.ObjectId(id));

    // 2. Query Worker Profiles near job location using 2dsphere index
    const candidateQuery: Record<string, unknown> = {
      deletedAt: null,
      availabilityStatus: WorkerAvailability.AVAILABLE,
      userId: { $nin: excludedUserObjectIds },
      serviceLocation: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [jobLng, jobLat],
          },
          $maxDistance: maxDistanceMeters,
        },
      },
    };

    const requiredSkillObjectIds = (job.requiredSkills || [])
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    if (requiredSkillObjectIds.length > 0) {
      candidateQuery['skills.skillId'] = { $all: requiredSkillObjectIds };
    }

    const candidateDocs = await WorkerProfileModel.find(candidateQuery)
      .limit(100)
      .exec();

    if (candidateDocs.length === 0) {
      return [];
    }

    // 3. Verify user account status (active, not suspended)
    const userIds = candidateDocs.map((d) => d.userId);
    const activeUsers = await UserModel.find({
      _id: { $in: userIds },
      deletedAt: null,
      status: 'ACTIVE',
    })
      .select('_id')
      .lean()
      .exec();

    const activeUserSet = new Set(activeUsers.map((u) => u._id.toString()));

    const eligibleCandidates: RankedWorkerCandidate[] = [];

    for (const doc of candidateDocs) {
      const worker = mapWorkerDocumentToEntity(doc);

      // Filter: Account active
      if (!activeUserSet.has(worker.userId)) {
        continue;
      }

      // Filter: Distance must be within worker's own declared service radius
      const workerCoords = worker.serviceLocation.coordinates;
      const distanceKm = calculateHaversineDistanceKm(
        [jobLng, jobLat],
        [workerCoords[0], workerCoords[1]]
      );

      const workerRadius = worker.serviceRadiusKm ?? 15;
      if (distanceKm > workerRadius) {
        continue;
      }

      // Filter: Must possess all required skills
      const requiredSkills = job.requiredSkills || [];
      if (requiredSkills.length > 0) {
        const workerSkills = (worker.skills || []).map((s) => s.skillId);
        const hasAllSkills = requiredSkills.every((req) => workerSkills.includes(req));
        if (!hasAllSkills) {
          continue;
        }
      }

      // 4. Calculate deterministic match score
      const calculation = this.scorer.calculateScore(
        worker,
        job,
        distanceKm,
        cfg.weights,
        cfg.maxSearchRadiusKm
      );

      eligibleCandidates.push({
        worker,
        distanceKm,
        matchScore: calculation.matchScore,
        scoreBreakdown: calculation.scoreBreakdown,
      });
    }

    // 5. Rank by match score descending; break ties deterministically by
    // shorter distance, then by userId so the ordering is stable across runs.
    eligibleCandidates.sort(
      (a, b) =>
        b.matchScore - a.matchScore ||
        a.distanceKm - b.distanceKm ||
        a.worker.userId.localeCompare(b.worker.userId)
    );

    return eligibleCandidates;
  }

  /**
   * Matches eligible workers, dispatches a wave of job offers, and transitions the job state.
   */
  async matchAndDispatchWave(
    jobId: string,
    customConfig?: Partial<MatchingConfig>
  ): Promise<{ offers: IJobOfferEntity[]; candidatesCount: number }> {
    const job = await this.jobRepo.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (job.status !== JobStatus.OPEN && job.status !== JobStatus.MATCHING && job.status !== JobStatus.OFFERED) {
      throw new ConflictError(
        `Job in status '${job.status}' cannot enter matching. Must be OPEN, MATCHING, or OFFERED.`
      );
    }

    const cfg = {
      ...this.config,
      ...customConfig,
      weights: { ...this.config.weights, ...customConfig?.weights },
    };

    // Transition state from OPEN -> MATCHING if needed
    if (job.status === JobStatus.OPEN) {
      JobStateMachine.validateTransition(job.status, JobStatus.MATCHING);
      await this.jobRepo.updateStatus(jobId, JobStatus.MATCHING);
      await this.eventRepo.create({
        jobId,
        actorId: job.customerId,
        actorRole: UserRole.CUSTOMER,
        eventType: 'MATCHING_STARTED',
        previousState: JobStatus.OPEN,
        newState: JobStatus.MATCHING,
      });
    }

    const candidates = await this.findRankedCandidates(jobId, cfg);
    if (candidates.length === 0) {
      return { offers: [], candidatesCount: 0 };
    }

    // Select top wave candidates
    const wave = candidates.slice(0, cfg.waveSize);
    const expiresAt = new Date(Date.now() + cfg.offerExpiryMinutes * 60 * 1000);

    const offersToCreate = wave.map((cand) => ({
      jobId,
      workerId: cand.worker.userId,
      distanceKm: cand.distanceKm,
      matchScore: cand.matchScore,
      scoreBreakdown: cand.scoreBreakdown,
      expiresAt,
    }));

    const createdOffers = await this.offerRepo.createMany(offersToCreate);

    // Transition state to OFFERED
    if (job.status !== JobStatus.OFFERED) {
      JobStateMachine.validateTransition(JobStatus.MATCHING, JobStatus.OFFERED);
      await this.jobRepo.updateStatus(jobId, JobStatus.OFFERED);
      await this.eventRepo.create({
        jobId,
        actorId: job.customerId,
        actorRole: 'SYSTEM',
        eventType: 'STATUS_CHANGED',
        previousState: JobStatus.MATCHING,
        newState: JobStatus.OFFERED,
        metadata: {
          offersCount: createdOffers.length,
          waveSize: cfg.waveSize,
        },
      });
    }

    // Log offer created events and emit realtime notifications to workers
    for (const offer of createdOffers) {
      await this.eventRepo.create({
        jobId,
        actorId: offer.workerId,
        actorRole: 'SYSTEM',
        eventType: 'OFFER_CREATED',
        previousState: JobStatus.OFFERED,
        newState: JobStatus.OFFERED,
        metadata: {
          offerId: offer.id,
          workerId: offer.workerId,
          matchScore: offer.matchScore,
        },
      });

      this.realtime.emitToUser(offer.workerId, 'job.offer.created', {
        offerId: offer.id,
        jobId: offer.jobId,
        workerId: offer.workerId,
        matchScore: offer.matchScore,
        expiresAt: offer.expiresAt.toISOString(),
      });
    }

    return {
      offers: createdOffers,
      candidatesCount: candidates.length,
    };
  }
}

export const matchingService = new MatchingService();
