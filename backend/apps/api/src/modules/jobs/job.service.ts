import {
  UserRole,
  JobStatus,
  TransactionType,
  type IJobEntity,
  type IJobEventEntity,
  type CursorPage,
  type ListJobsFilters,
} from '@kaamsetu/types';
import type {
  CreateJobInputDto,
  UpdateJobInputDto,
} from '@kaamsetu/validation';
import { IJobRepository, jobRepository } from './job.repository.js';
import {
  IJobEventRepository,
  jobEventRepository,
} from '../job-events/job-event.repository.js';
import {
  IServiceCategoryRepository,
  serviceCategoryRepository,
} from '../service-categories/service-category.repository.js';
import {
  ISkillRepository,
  skillRepository,
} from '../skills/skill.repository.js';
import {
  ITransactionRepository,
  transactionRepository,
} from '../transactions/transaction.repository.js';
import { JobStateMachine } from './job-state-machine.js';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
} from '../../errors/index.js';
import { logger } from '../../config/index.js';
import { RealtimeGateway, realtimeGateway } from '../../realtime/index.js';
import { matchingService } from '../matching/matching.service.js';

export class JobService {
  constructor(
    private readonly jobRepo: IJobRepository = jobRepository,
    private readonly jobEventRepo: IJobEventRepository = jobEventRepository,
    private readonly categoryRepo: IServiceCategoryRepository = serviceCategoryRepository,
    private readonly skillRepo: ISkillRepository = skillRepository,
    private readonly realtime: RealtimeGateway = realtimeGateway,
    private readonly transactionRepo: ITransactionRepository = transactionRepository
  ) {}

  /**
   * Validate that the category exists and is active.
   */
  private async validateCategory(categoryId: string): Promise<void> {
    const category = await this.categoryRepo.findById(categoryId);
    if (!category || !category.active) {
      throw new NotFoundError('Category does not exist or is inactive');
    }
  }

  /**
   * Validate that all specified skills exist and are active.
   */
  private async validateSkills(skillIds: string[]): Promise<void> {
    if (!skillIds || skillIds.length === 0) return;

    const skills = await this.skillRepo.findByIds(skillIds);
    if (skills.length !== skillIds.length) {
      throw new BadRequestError('One or more required skills do not exist');
    }

    const inactiveSkill = skills.find((s) => !s.active);
    if (inactiveSkill) {
      throw new BadRequestError(`Skill '${inactiveSkill.name}' is inactive`);
    }
  }

  /**
   * Create a new job document and record immutable creation event.
   */
  async createJob(
    customerId: string,
    customerRole: UserRole,
    input: CreateJobInputDto
  ): Promise<IJobEntity> {
    if (customerRole !== UserRole.CUSTOMER && customerRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Only customers or admins can create jobs');
    }

    await this.validateCategory(input.categoryId);
    if (input.requiredSkills && input.requiredSkills.length > 0) {
      await this.validateSkills(input.requiredSkills);
    }

    const initialStatus = input.publishImmediately ? JobStatus.OPEN : JobStatus.DRAFT;

    const job = await this.jobRepo.create({
      customerId,
      categoryId: input.categoryId,
      requiredSkills: input.requiredSkills ?? [],
      title: input.title,
      description: input.description,
      source: input.source,
      location: input.location,
      address: input.address,
      preferredTime: input.preferredTime,
      urgency: input.urgency,
      estimatedPrice: input.estimatedPrice,
      images: input.images,
      status: initialStatus,
    });

    // Record creation event
    await this.jobEventRepo.create({
      jobId: job.id,
      actorId: customerId,
      actorRole: customerRole,
      eventType: 'CREATED',
      previousState: null,
      newState: initialStatus,
      metadata: {
        source: job.source,
        publishImmediately: input.publishImmediately ?? false,
      },
    });

    // If published immediately, log the publication event too
    if (input.publishImmediately) {
      await this.jobEventRepo.create({
        jobId: job.id,
        actorId: customerId,
        actorRole: customerRole,
        eventType: 'PUBLISHED',
        previousState: JobStatus.DRAFT,
        newState: JobStatus.OPEN,
        metadata: {
          immediate: true,
        },
      });

      // Automatically kick off matching in the background (skipped in test runner for determinism)
      if (process.env.NODE_ENV !== 'test') {
        void matchingService.startMatching(job.id).catch((err) => {
          logger.error(
            { err: err instanceof Error ? err.message : String(err), jobId: job.id },
            'Background matching auto-start failed on createJob'
          );
        });
      }
    }

    return job;
  }

  /**
   * Retrieve a job by ID with ownership/access control.
   */
  async getJobById(
    jobId: string,
    user: { id: string; role: UserRole }
  ): Promise<IJobEntity> {
    let job = await this.jobRepo.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // Passive expiration on read if matching window has elapsed
    if (
      process.env.NODE_ENV !== 'test' &&
      (job.status === JobStatus.OPEN ||
        job.status === JobStatus.MATCHING ||
        job.status === JobStatus.OFFERED) &&
      job.matchingExpiresAt &&
      new Date() >= new Date(job.matchingExpiresAt)
    ) {
      const expired = await matchingService.expireMatchingJob(jobId, 'MATCHING_TIMEOUT');
      if (expired) {
        job = expired;
      }
    }

    if (user.role === UserRole.CUSTOMER) {
      if (job.customerId !== user.id) {
        throw new ForbiddenError('You do not have permission to view this job');
      }
    } else if (user.role === UserRole.WORKER) {
      // Workers can view OPEN jobs or jobs assigned to them
      const isAssigned = job.assignedWorkerId === user.id;
      const isOpen = job.status === JobStatus.OPEN;
      if (!isAssigned && !isOpen) {
        throw new ForbiddenError('You do not have permission to view this job');
      }
    }

    return job;
  }

  /**
   * List jobs with cursor pagination and role-based filtering.
   */
  async listJobs(
    user: { id: string; role: UserRole },
    filters: ListJobsFilters
  ): Promise<CursorPage<IJobEntity>> {
    const effectiveFilters: ListJobsFilters = { ...filters };

    if (user.role === UserRole.CUSTOMER) {
      // Customers can only see their own jobs
      effectiveFilters.customerId = user.id;
    } else if (user.role === UserRole.WORKER) {
      // Workers may only ever see OPEN jobs or jobs assigned to them. They can
      // never list other workers' assignments or other customers' private jobs.
      if (effectiveFilters.status === 'ASSIGNED') {
        // Rewrite the request-level sentinel into an assignment filter.
        effectiveFilters.status = undefined;
        effectiveFilters.assignedWorkerId = user.id;
      } else if (!effectiveFilters.status) {
        effectiveFilters.status = JobStatus.OPEN;
      } else if (effectiveFilters.status !== JobStatus.OPEN) {
        // Any non-OPEN status requested by a worker MUST be scoped to their assigned jobs
        effectiveFilters.assignedWorkerId = user.id;
      }
    }

    return this.jobRepo.listJobsWithCursor(effectiveFilters);
  }

  /**
   * Update editable fields on a job (DRAFT or OPEN state only).
   */
  async updateJob(
    jobId: string,
    user: { id: string; role: UserRole },
    input: UpdateJobInputDto
  ): Promise<IJobEntity> {
    const job = await this.jobRepo.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (user.role !== UserRole.ADMIN && job.customerId !== user.id) {
      throw new ForbiddenError('You do not have permission to update this job');
    }

    if (job.status !== JobStatus.DRAFT) {
      throw new ConflictError(
        `Job is in state '${job.status}' and is no longer editable. Only DRAFT jobs can be updated.`
      );
    }

    if (input.categoryId) {
      await this.validateCategory(input.categoryId);
    }

    if (input.requiredSkills && input.requiredSkills.length > 0) {
      await this.validateSkills(input.requiredSkills);
    }

    const updated = await this.jobRepo.update(jobId, input);
    if (!updated) {
      throw new NotFoundError('Job not found');
    }

    await this.jobEventRepo.create({
      jobId: job.id,
      actorId: user.id,
      actorRole: user.role,
      eventType: 'UPDATED',
      previousState: job.status,
      newState: job.status,
      metadata: {
        updatedFields: Object.keys(input),
      },
    });

    return updated;
  }

  /**
   * Transition job from DRAFT -> OPEN.
   */
  async publishJob(
    jobId: string,
    user: { id: string; role: UserRole }
  ): Promise<IJobEntity> {
    const job = await this.jobRepo.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (user.role !== UserRole.ADMIN && job.customerId !== user.id) {
      throw new ForbiddenError('You do not have permission to publish this job');
    }

    JobStateMachine.validateTransition(job.status, JobStatus.OPEN);

    const updated = await this.jobRepo.updateStatus(jobId, JobStatus.OPEN);
    if (!updated) {
      throw new NotFoundError('Job not found');
    }

    await this.jobEventRepo.create({
      jobId: job.id,
      actorId: user.id,
      actorRole: user.role,
      eventType: 'PUBLISHED',
      previousState: job.status,
      newState: JobStatus.OPEN,
    });

    // Automatically kick off matching in the background (skipped in test runner for determinism)
    if (process.env.NODE_ENV !== 'test') {
      void matchingService.startMatching(jobId).catch((err) => {
        logger.error(
          { err: err instanceof Error ? err.message : String(err), jobId },
          'Background matching auto-start failed on publishJob'
        );
      });
    }

    return updated;
  }

  /**
   * Transition job to CANCELLED with cancellation reason.
   */
  async cancelJob(
    jobId: string,
    user: { id: string; role: UserRole },
    reason: string
  ): Promise<IJobEntity> {
    const job = await this.jobRepo.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (user.role === UserRole.CUSTOMER && job.customerId !== user.id) {
      throw new ForbiddenError('You do not have permission to cancel this job');
    } else if (
      user.role === UserRole.WORKER &&
      job.assignedWorkerId !== user.id
    ) {
      throw new ForbiddenError('You are not assigned to this job');
    }

    JobStateMachine.validateTransition(job.status, JobStatus.CANCELLED);

    const updated = await this.jobRepo.updateStatus(jobId, JobStatus.CANCELLED);
    if (!updated) {
      throw new NotFoundError('Job not found');
    }

    await this.jobEventRepo.create({
      jobId: job.id,
      actorId: user.id,
      actorRole: user.role,
      eventType: 'CANCELLED',
      previousState: job.status,
      newState: JobStatus.CANCELLED,
      reason,
      metadata: reason ? { reason } : undefined,
    });

    return updated;
  }

  /**
   * Retrieve immutable event history for a job.
   */
  async getJobHistory(
    jobId: string,
    user: { id: string; role: UserRole }
  ): Promise<IJobEventEntity[]> {
    await this.getJobById(jobId, user);
    return this.jobEventRepo.findByJobId(jobId);
  }

  /**
   * Worker starts travel to customer site: ACCEPTED -> EN_ROUTE.
   */
  async startTravel(jobId: string, workerId: string): Promise<IJobEntity> {
    const job = await this.jobRepo.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (job.assignedWorkerId !== workerId) {
      throw new ForbiddenError('Only the assigned worker can start travel for this job');
    }

    JobStateMachine.validateTransition(job.status, JobStatus.EN_ROUTE);

    const updated = await this.jobRepo.updateStatus(jobId, JobStatus.EN_ROUTE);
    if (!updated) {
      throw new NotFoundError('Job not found');
    }

    await this.jobEventRepo.create({
      jobId: job.id,
      actorId: workerId,
      actorRole: UserRole.WORKER,
      eventType: 'TRAVEL_STARTED',
      previousState: job.status,
      newState: JobStatus.EN_ROUTE,
    });

    const payload = {
      jobId: job.id,
      previousStatus: job.status,
      newStatus: JobStatus.EN_ROUTE,
      updatedAt: new Date().toISOString(),
    };
    this.realtime.emitToJob(job.id, 'job.status.changed', payload);
    this.realtime.emitToUser(job.customerId, 'job.status.changed', payload);

    return updated;
  }

  /**
   * Worker arrives at customer location: EN_ROUTE -> ARRIVED.
   */
  async arrive(jobId: string, workerId: string): Promise<IJobEntity> {
    const job = await this.jobRepo.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (job.assignedWorkerId !== workerId) {
      throw new ForbiddenError('Only the assigned worker can update arrival for this job');
    }

    JobStateMachine.validateTransition(job.status, JobStatus.ARRIVED);

    const updated = await this.jobRepo.updateStatus(jobId, JobStatus.ARRIVED);
    if (!updated) {
      throw new NotFoundError('Job not found');
    }

    await this.jobEventRepo.create({
      jobId: job.id,
      actorId: workerId,
      actorRole: UserRole.WORKER,
      eventType: 'WORKER_ARRIVED',
      previousState: job.status,
      newState: JobStatus.ARRIVED,
    });

    const payload = {
      jobId: job.id,
      previousStatus: job.status,
      newStatus: JobStatus.ARRIVED,
      updatedAt: new Date().toISOString(),
    };
    this.realtime.emitToJob(job.id, 'job.status.changed', payload);
    this.realtime.emitToUser(job.customerId, 'job.status.changed', payload);

    return updated;
  }

  /**
   * Worker begins service execution: ARRIVED -> IN_PROGRESS.
   */
  async startJob(jobId: string, workerId: string): Promise<IJobEntity> {
    const job = await this.jobRepo.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (job.assignedWorkerId !== workerId) {
      throw new ForbiddenError('Only the assigned worker can start work on this job');
    }

    JobStateMachine.validateTransition(job.status, JobStatus.IN_PROGRESS);

    const updated = await this.jobRepo.updateStatus(jobId, JobStatus.IN_PROGRESS);
    if (!updated) {
      throw new NotFoundError('Job not found');
    }

    await this.jobEventRepo.create({
      jobId: job.id,
      actorId: workerId,
      actorRole: UserRole.WORKER,
      eventType: 'JOB_STARTED',
      previousState: job.status,
      newState: JobStatus.IN_PROGRESS,
    });

    const payload = {
      jobId: job.id,
      previousStatus: job.status,
      newStatus: JobStatus.IN_PROGRESS,
      updatedAt: new Date().toISOString(),
    };
    this.realtime.emitToJob(job.id, 'job.status.changed', payload);
    this.realtime.emitToUser(job.customerId, 'job.status.changed', payload);

    return updated;
  }

  /**
   * Worker completes service execution: IN_PROGRESS -> COMPLETED.
   */
  async completeJob(jobId: string, workerId: string): Promise<IJobEntity> {
    const job = await this.jobRepo.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (job.assignedWorkerId !== workerId) {
      throw new ForbiddenError('Only the assigned worker can complete this job');
    }

    JobStateMachine.validateTransition(job.status, JobStatus.COMPLETED);

    const updated = await this.jobRepo.updateStatus(jobId, JobStatus.COMPLETED);
    if (!updated) {
      throw new NotFoundError('Job not found');
    }

    await this.jobEventRepo.create({
      jobId: job.id,
      actorId: workerId,
      actorRole: UserRole.WORKER,
      eventType: 'JOB_COMPLETED',
      previousState: job.status,
      newState: JobStatus.COMPLETED,
    });

    const completedAt = new Date().toISOString();
    const statusPayload = {
      jobId: job.id,
      previousStatus: job.status,
      newStatus: JobStatus.COMPLETED,
      updatedAt: completedAt,
    };
    this.realtime.emitToJob(job.id, 'job.status.changed', statusPayload);
    this.realtime.emitToUser(job.customerId, 'job.status.changed', statusPayload);

    const completedPayload = {
      jobId: job.id,
      workerId,
      customerId: job.customerId,
      completedAt,
    };
    this.realtime.emitToJob(job.id, 'job.completed', completedPayload);
    this.realtime.emitToUser(job.customerId, 'job.completed', completedPayload);

    // Record immutable ledger entry for job revenue if price is set
    if (job.estimatedPrice && job.estimatedPrice > 0) {
      const referenceId = `job:${job.id}:revenue`;
      const existingRevenue = await this.transactionRepo.findByReferenceId(referenceId);
      if (existingRevenue) {
        logger.debug({ jobId: job.id, referenceId }, 'JOB_REVENUE ledger entry already recorded; skipping');
      } else {
        try {
          await this.transactionRepo.create({
            workerId,
            jobId: job.id,
            type: TransactionType.JOB_REVENUE,
            amount: Math.round(job.estimatedPrice * 100),
            currency: 'INR',
            referenceId,
            metadata: {
              jobTitle: job.title,
              completedAt,
            },
          });
        } catch (err) {
          // E11000 duplicate key = concurrent completion raced past the check above; safe to ignore.
          if ((err as { code?: number }).code === 11000) {
            logger.warn(
              { jobId: job.id, referenceId },
              'JOB_REVENUE duplicate key on concurrent completion; ledger already has entry'
            );
          } else {
            logger.error(
              {
                err: err instanceof Error ? err.message : String(err),
                jobId: job.id,
                workerId,
                referenceId,
                amountPaise: Math.round(job.estimatedPrice * 100),
              },
              'FAILED to record JOB_REVENUE ledger entry on job completion'
            );
          }
        }
      }
    }

    return updated;
  }
}

export const jobService = new JobService();
