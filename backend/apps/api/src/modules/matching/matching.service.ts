import { Types } from 'mongoose';
import {
  UserRole,
  JobStatus,
  JobOfferStatus,
  WorkerAvailability,
  type IJobOfferEntity,
  type IWorkerProfileEntity,
  type IJobEntity,
  type MatchingConfig,
  type MatchingOutcome,
  type JobMatchingStatusDto,
} from '@kaamsetu/types';
import { WorkerProfileModel, mapWorkerDocumentToEntity } from '../worker-profiles/worker-profile.model.js';
import { UserModel } from '../users/user.model.js';
import { JobStateMachine } from '../jobs/job-state-machine.js';
import { jobRepository, IJobRepository } from '../jobs/job.repository.js';
import { jobOfferRepository, IJobOfferRepository } from '../job-offers/job-offer.repository.js';
import { jobEventRepository, IJobEventRepository } from '../job-events/job-event.repository.js';
import { ScoringService, scoringService, calculateHaversineDistanceKm, CalculatedMatch } from './scoring.service.js';
import { DEFAULT_MATCHING_CONFIG } from './matching.config.js';
import { matchingQueue } from './queue/matching.queue.js';
import { NotFoundError, BadRequestError } from '../../errors/index.js';
import { RealtimeGateway, realtimeGateway } from '../../realtime/index.js';
import { logger } from '../../config/index.js';

export interface RankedWorkerCandidate {
  worker: IWorkerProfileEntity;
  distanceKm: number;
  matchScore: number;
  scoreBreakdown: CalculatedMatch['scoreBreakdown'];
}

export interface MatchAndDispatchResult {
  outcome: MatchingOutcome;
  offers: IJobOfferEntity[];
  candidatesCount: number;
  waveNumber?: number;
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
      const serviceLocation = worker.serviceLocation;
      if (!serviceLocation?.coordinates) {
        continue;
      }
      const workerCoords = serviceLocation.coordinates;
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
   * Initiates the matching lifecycle for a job.
   * Sets authoritative deadline and begins wave 1.
   */
  async startMatching(
    jobId: string,
    customConfig?: Partial<MatchingConfig>
  ): Promise<MatchAndDispatchResult> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new BadRequestError('Invalid job ID format');
    }

    const job = await this.jobRepo.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (job.status !== JobStatus.OPEN && job.status !== JobStatus.MATCHING) {
      return {
        outcome: 'JOB_TERMINAL_OR_ASSIGNED',
        offers: [],
        candidatesCount: 0,
      };
    }

    const cfg: MatchingConfig = {
      ...this.config,
      ...customConfig,
      weights: { ...this.config.weights, ...customConfig?.weights },
    };

    const totalSeconds = cfg.totalMatchingTimeoutSeconds ?? 90;
    const matchingExpiresAt = new Date(Date.now() + totalSeconds * 1000);

    if (job.status === JobStatus.OPEN) {
      JobStateMachine.validateTransition(JobStatus.OPEN, JobStatus.MATCHING);
      await this.jobRepo.updateStatus(jobId, JobStatus.MATCHING, { matchingExpiresAt });
      await this.eventRepo.create({
        jobId,
        actorId: job.customerId,
        actorRole: UserRole.CUSTOMER,
        eventType: 'MATCHING_STARTED',
        previousState: JobStatus.OPEN,
        newState: JobStatus.MATCHING,
        metadata: {
          totalTimeoutSeconds: totalSeconds,
          matchingExpiresAt: matchingExpiresAt.toISOString(),
        },
      });
      this.emitStatusChanged(jobId, job.customerId, JobStatus.OPEN, JobStatus.MATCHING);
    } else if (!job.matchingExpiresAt) {
      await this.jobRepo.updateStatus(jobId, JobStatus.MATCHING, { matchingExpiresAt });
    }

    // Schedule overall matching deadline
    await matchingQueue.enqueueExpireJobMatching(
      jobId,
      totalSeconds * 1000,
      () => this.expireMatchingJob(jobId, 'MATCHING_TIMEOUT').then(() => {})
    );

    logger.info({ jobId, totalSeconds, matchingExpiresAt }, 'Matching lifecycle started');
    return this.matchAndDispatchWave(jobId, cfg, 1);
  }

  /**
   * Matches eligible workers, dispatches a wave of job offers, and manages state progression.
   */
  async matchAndDispatchWave(
    jobId: string,
    customConfig?: Partial<MatchingConfig>,
    waveNumber = 1
  ): Promise<MatchAndDispatchResult> {
    const job = await this.jobRepo.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // Guard: ignore if job is assigned or in a terminal state
    if (
      job.assignedWorkerId ||
      job.status === JobStatus.ACCEPTED ||
      job.status === JobStatus.EN_ROUTE ||
      job.status === JobStatus.ARRIVED ||
      job.status === JobStatus.IN_PROGRESS ||
      job.status === JobStatus.COMPLETED ||
      job.status === JobStatus.CANCELLED ||
      job.status === JobStatus.DISPUTED ||
      job.status === JobStatus.EXPIRED
    ) {
      return {
        outcome: 'JOB_TERMINAL_OR_ASSIGNED',
        offers: [],
        candidatesCount: 0,
        waveNumber,
      };
    }

    const cfg: MatchingConfig = {
      ...this.config,
      ...customConfig,
      weights: { ...this.config.weights, ...customConfig?.weights },
    };

    // Check overall matching deadline
    if (job.matchingExpiresAt && new Date() >= new Date(job.matchingExpiresAt)) {
      await this.expireMatchingJob(jobId, 'MATCHING_TIMEOUT');
      return {
        outcome: 'EXPIRED',
        offers: [],
        candidatesCount: 0,
        waveNumber,
      };
    }

    // Transition state from OPEN -> MATCHING if needed
    if (job.status === JobStatus.OPEN) {
      const totalSeconds = cfg.totalMatchingTimeoutSeconds ?? 90;
      const matchingExpiresAt = new Date(Date.now() + totalSeconds * 1000);
      JobStateMachine.validateTransition(job.status, JobStatus.MATCHING);
      await this.jobRepo.updateStatus(jobId, JobStatus.MATCHING, { matchingExpiresAt });
      await this.eventRepo.create({
        jobId,
        actorId: job.customerId,
        actorRole: UserRole.CUSTOMER,
        eventType: 'MATCHING_STARTED',
        previousState: JobStatus.OPEN,
        newState: JobStatus.MATCHING,
        metadata: {
          totalTimeoutSeconds: totalSeconds,
          matchingExpiresAt: matchingExpiresAt.toISOString(),
        },
      });
      this.emitStatusChanged(jobId, job.customerId, JobStatus.OPEN, JobStatus.MATCHING);

      await matchingQueue.enqueueExpireJobMatching(
        jobId,
        totalSeconds * 1000,
        () => this.expireMatchingJob(jobId, 'MATCHING_TIMEOUT').then(() => {})
      );
    } else if (job.status === JobStatus.OFFERED) {
      // Transition back to MATCHING while computing and dispatching the next wave
      JobStateMachine.validateTransition(JobStatus.OFFERED, JobStatus.MATCHING);
      await this.jobRepo.updateStatus(jobId, JobStatus.MATCHING);
      await this.eventRepo.create({
        jobId,
        actorId: job.customerId,
        actorRole: 'SYSTEM',
        eventType: 'STATUS_CHANGED',
        previousState: JobStatus.OFFERED,
        newState: JobStatus.MATCHING,
        metadata: { waveNumber },
      });
      this.emitStatusChanged(jobId, job.customerId, JobStatus.OFFERED, JobStatus.MATCHING);
    }

    const candidates = await this.findRankedCandidates(jobId, cfg);
    const existingWorkerIds = await this.offerRepo.findExistingWorkerIdsForJob(jobId);

    // ================= EMPTY CANDIDATES CASES =================
    if (candidates.length === 0) {
      if (existingWorkerIds.length === 0) {
        // CASE 1: Immediate zero eligible workers found on wave 1
        JobStateMachine.validateTransition(JobStatus.MATCHING, JobStatus.EXPIRED);
        await this.jobRepo.updateStatus(jobId, JobStatus.EXPIRED);
        await this.eventRepo.create({
          jobId,
          actorId: job.customerId,
          actorRole: 'SYSTEM',
          eventType: 'STATUS_CHANGED',
          previousState: JobStatus.MATCHING,
          newState: JobStatus.EXPIRED,
          reason: 'NO_ELIGIBLE_WORKERS',
          metadata: { reason: 'NO_ELIGIBLE_WORKERS' },
        });
        this.emitStatusChanged(jobId, job.customerId, JobStatus.MATCHING, JobStatus.EXPIRED);
        logger.info({ jobId }, 'Matching expired immediately: NO_ELIGIBLE_WORKERS');
        return {
          outcome: 'NO_ELIGIBLE_WORKERS',
          offers: [],
          candidatesCount: 0,
          waveNumber,
        };
      }

      // CASE 2: Offers were previously sent, check if any remain pending
      const pendingOffersCount = await this.offerRepo.countPendingOffersForJob(jobId);
      if (pendingOffersCount > 0) {
        // Still awaiting response on previous wave offers
        return {
          outcome: 'OFFERS_DISPATCHED',
          offers: [],
          candidatesCount: 0,
          waveNumber,
        };
      }

      // CASE 3: No pending offers and no remaining eligible workers exist
      JobStateMachine.validateTransition(JobStatus.MATCHING, JobStatus.EXPIRED);
      await this.jobRepo.updateStatus(jobId, JobStatus.EXPIRED);
      await this.eventRepo.create({
        jobId,
        actorId: job.customerId,
        actorRole: 'SYSTEM',
        eventType: 'STATUS_CHANGED',
        previousState: JobStatus.MATCHING,
        newState: JobStatus.EXPIRED,
        reason: 'ALL_ELIGIBLE_WORKERS_EXHAUSTED',
        metadata: { reason: 'ALL_ELIGIBLE_WORKERS_EXHAUSTED' },
      });
      this.emitStatusChanged(jobId, job.customerId, JobStatus.MATCHING, JobStatus.EXPIRED);
      logger.info({ jobId }, 'Matching expired: ALL_ELIGIBLE_WORKERS_EXHAUSTED');
      return {
        outcome: 'ALL_ELIGIBLE_WORKERS_EXHAUSTED',
        offers: [],
        candidatesCount: 0,
        waveNumber,
      };
    }

    // ================= DISPATCH WAVE =================
    const wave = candidates.slice(0, cfg.waveSize);
    const expirySeconds = cfg.offerExpirySeconds ?? (cfg.offerExpiryMinutes * 60);
    let expiresAt = new Date(Date.now() + expirySeconds * 1000);
    if (job.matchingExpiresAt && expiresAt > new Date(job.matchingExpiresAt)) {
      expiresAt = new Date(job.matchingExpiresAt);
    }

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
        waveNumber,
        offersCount: createdOffers.length,
        waveSize: cfg.waveSize,
      },
    });
    this.emitStatusChanged(jobId, job.customerId, JobStatus.MATCHING, JobStatus.OFFERED);

    // Dispatch realtime notifications & schedule per-offer BullMQ expiration
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
          waveNumber,
        },
      });

      this.realtime.emitToUser(offer.workerId, 'job.offer.created', {
        offerId: offer.id,
        jobId: offer.jobId,
        workerId: offer.workerId,
        matchScore: offer.matchScore,
        expiresAt: offer.expiresAt.toISOString(),
      });

      // Schedule delayed BullMQ offer expiration
      await matchingQueue.enqueueExpireJobOffer(
        jobId,
        offer.id,
        expirySeconds * 1000,
        () => this.expireOffer(jobId, offer.id)
      );
    }

    // Schedule delayed BullMQ next wave attempt
    await matchingQueue.enqueueDispatchNextWave(
      jobId,
      waveNumber,
      expirySeconds * 1000,
      () => this.matchAndDispatchWave(jobId, cfg, waveNumber + 1).then(() => {})
    );

    logger.info(
      { jobId, waveNumber, offersCount: createdOffers.length, candidatesRemaining: candidates.length - wave.length },
      'Matching wave dispatched'
    );

    return {
      outcome: 'OFFERS_DISPATCHED',
      offers: createdOffers,
      candidatesCount: candidates.length,
      waveNumber,
    };
  }

  /**
   * Idempotently expires a single offer when its window closes.
   * If all offers in the wave have terminated, triggers the next wave.
   */
  async expireOffer(jobId: string, offerId: string): Promise<void> {
    const expired = await this.offerRepo.expireOfferAtomic(offerId);
    if (!expired) return;

    await this.eventRepo.create({
      jobId,
      actorId: expired.workerId,
      actorRole: 'SYSTEM',
      eventType: 'OFFER_WITHDRAWN',
      previousState: JobStatus.OFFERED,
      newState: JobStatus.OFFERED,
      reason: 'OFFER_EXPIRED',
      metadata: { offerId, reason: 'OFFER_EXPIRED' },
    });

    const pendingCount = await this.offerRepo.countPendingOffersForJob(jobId);
    if (pendingCount === 0) {
      await this.matchAndDispatchWave(jobId);
    }
  }

  /**
   * Invoked when all offers in a wave have been rejected before timeout.
   */
  async handleWaveExhausted(jobId: string): Promise<void> {
    await this.matchAndDispatchWave(jobId);
  }

  /**
   * Transitions a matching/offered job to EXPIRED cleanly.
   */
  async expireMatchingJob(
    jobId: string,
    reason = 'MATCHING_TIMEOUT'
  ): Promise<IJobEntity | null> {
    if (!Types.ObjectId.isValid(jobId)) return null;

    const job = await this.jobRepo.findById(jobId);
    if (!job) return null;

    // Do NOT expire assigned or already terminal jobs
    if (
      job.assignedWorkerId ||
      job.status === JobStatus.ACCEPTED ||
      job.status === JobStatus.EN_ROUTE ||
      job.status === JobStatus.ARRIVED ||
      job.status === JobStatus.IN_PROGRESS ||
      job.status === JobStatus.COMPLETED ||
      job.status === JobStatus.CANCELLED ||
      job.status === JobStatus.DISPUTED ||
      job.status === JobStatus.EXPIRED
    ) {
      return job;
    }

    // Expire any remaining pending offers
    await this.offerRepo.expireAllPendingOffersForJob(jobId);

    const previousStatus = job.status;
    JobStateMachine.validateTransition(previousStatus, JobStatus.EXPIRED);
    const updated = await this.jobRepo.updateStatus(jobId, JobStatus.EXPIRED);

    await this.eventRepo.create({
      jobId,
      actorId: job.customerId,
      actorRole: 'SYSTEM',
      eventType: 'STATUS_CHANGED',
      previousState: previousStatus,
      newState: JobStatus.EXPIRED,
      reason,
      metadata: { reason },
    });

    this.emitStatusChanged(jobId, job.customerId, previousStatus, JobStatus.EXPIRED);
    logger.info({ jobId, previousStatus, reason }, 'Job matching expired');
    return updated;
  }

  /**
   * Realtime status broadcast helper.
   */
  emitStatusChanged(
    jobId: string,
    customerId: string,
    previousStatus: JobStatus,
    newStatus: JobStatus
  ): void {
    const updatedAt = new Date().toISOString();
    this.realtime.emitToJob(jobId, 'job.status.changed', {
      jobId,
      previousStatus,
      newStatus,
      updatedAt,
    });
    this.realtime.emitToUser(customerId, 'job.status.changed', {
      jobId,
      previousStatus,
      newStatus,
      updatedAt,
    });
  }

  /**
   * Provides safe, customer-facing matching progress and diagnostics.
   */
  async getMatchingStatus(jobId: string): Promise<JobMatchingStatusDto> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new BadRequestError('Invalid job ID format');
    }

    let job = await this.jobRepo.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // Passive expiration on read
    if (
      (job.status === JobStatus.OPEN ||
        job.status === JobStatus.MATCHING ||
        job.status === JobStatus.OFFERED) &&
      job.matchingExpiresAt &&
      new Date() >= new Date(job.matchingExpiresAt)
    ) {
      const expired = await this.expireMatchingJob(jobId, 'MATCHING_TIMEOUT');
      if (expired) job = expired;
    }

    const [offers, events] = await Promise.all([
      this.offerRepo.findByJobId(jobId),
      this.eventRepo.findByJobId(jobId),
    ]);

    const matchingStartedEvent = events.find((e) => e.eventType === 'MATCHING_STARTED');
    const startedAt = matchingStartedEvent
      ? matchingStartedEvent.createdAt.toISOString()
      : job.createdAt.toISOString();
    const expiresAt = job.matchingExpiresAt ? job.matchingExpiresAt.toISOString() : null;

    let remainingSeconds: number | undefined;
    if (
      job.matchingExpiresAt &&
      (job.status === JobStatus.OPEN ||
        job.status === JobStatus.MATCHING ||
        job.status === JobStatus.OFFERED)
    ) {
      remainingSeconds = Math.max(
        0,
        Math.floor((new Date(job.matchingExpiresAt).getTime() - Date.now()) / 1000)
      );
    }

    const pendingOffers = offers.filter((o) => o.status === JobOfferStatus.PENDING).length;
    const waveEvents = events.filter(
      (e) => e.eventType === 'STATUS_CHANGED' && e.newState === JobStatus.OFFERED
    );
    const currentWave = Math.max(1, waveEvents.length);
    const totalTimeout = this.config.totalMatchingTimeoutSeconds ?? 90;
    const waveExpiry = this.config.offerExpirySeconds ?? 30;

    let outcomeReason: string | null = null;
    if (job.status === JobStatus.EXPIRED) {
      const expiredEvent = [...events].reverse().find(
        (e) => e.eventType === 'STATUS_CHANGED' && e.newState === JobStatus.EXPIRED
      );
      outcomeReason = expiredEvent?.reason ?? 'NO_ELIGIBLE_WORKERS';
    }

    return {
      jobId: job.id,
      status: job.status,
      matching: {
        startedAt,
        expiresAt,
        remainingSeconds,
        candidatesFound: offers.length,
        offersSent: offers.length,
        pendingOffers,
        currentWave,
        maxWaves: Math.ceil(totalTimeout / waveExpiry),
      },
      outcomeReason,
    };
  }
}

export const matchingService = new MatchingService();
