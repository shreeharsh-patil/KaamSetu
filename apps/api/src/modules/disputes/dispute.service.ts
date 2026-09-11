import { Types } from 'mongoose';
import {
  UserRole,
  JobStatus,
  DisputeStatus,
  TransactionType,
  type IDisputeEntity,
  type CursorPage,
} from '@kaamsetu/types';
import type {
  CreateDisputeInputDto,
  ResolveDisputeInputDto,
  ListDisputesQueryDto,
} from '@kaamsetu/validation';
import { IDisputeRepository, disputeRepository } from './dispute.repository.js';
import { IJobRepository, jobRepository } from '../jobs/job.repository.js';
import { IJobEventRepository, jobEventRepository } from '../job-events/job-event.repository.js';
import { ITransactionRepository, transactionRepository } from '../transactions/transaction.repository.js';
import { auditLogRepository } from '../audit-logs/audit-log.repository.js';
import { realtimeGateway, RealtimeGateway } from '../../realtime/index.js';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '../../errors/index.js';

export class DisputeService {
  constructor(
    private readonly disputeRepo: IDisputeRepository = disputeRepository,
    private readonly jobRepo: IJobRepository = jobRepository,
    private readonly jobEventRepo: IJobEventRepository = jobEventRepository,
    private readonly transactionRepo: ITransactionRepository = transactionRepository,
    private readonly realtime: RealtimeGateway = realtimeGateway
  ) {}

  /**
   * Job participant (Customer or assigned Worker) raises a dispute on a job.
   */
  async createDispute(
    initiatorId: string,
    input: CreateDisputeInputDto
  ): Promise<IDisputeEntity> {
    if (!Types.ObjectId.isValid(initiatorId) || !Types.ObjectId.isValid(input.jobId)) {
      throw new BadRequestError('Invalid ID format');
    }

    const job = await this.jobRepo.findById(input.jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    const isCustomer = job.customerId === initiatorId;
    const isWorker = job.assignedWorkerId === initiatorId;

    if (!isCustomer && !isWorker) {
      throw new ForbiddenError('Only participants involved in this job can raise a dispute');
    }

    const respondentId = isCustomer ? job.assignedWorkerId : job.customerId;
    if (!respondentId) {
      throw new BadRequestError('No respondent found for this job');
    }

    const dispute = await this.disputeRepo.create({
      jobId: job.id,
      initiatorId,
      respondentId,
      reason: input.reason,
      description: input.description,
      evidence: input.evidence,
    });

    // If job is in active execution state, transition status to DISPUTED
    const activeStates = [
      JobStatus.ACCEPTED,
      JobStatus.EN_ROUTE,
      JobStatus.ARRIVED,
      JobStatus.IN_PROGRESS,
    ];

    if (activeStates.includes(job.status)) {
      await this.jobRepo.updateStatus(job.id, JobStatus.DISPUTED);
      await this.jobEventRepo.create({
        jobId: job.id,
        actorId: initiatorId,
        actorRole: isCustomer ? UserRole.CUSTOMER : UserRole.WORKER,
        eventType: 'DISPUTE_RAISED',
        previousState: job.status,
        newState: JobStatus.DISPUTED,
        reason: input.reason,
        metadata: { disputeId: dispute.id },
      });

      const payload = {
        jobId: job.id,
        previousStatus: job.status,
        newStatus: JobStatus.DISPUTED,
        disputeId: dispute.id,
        updatedAt: new Date().toISOString(),
      };
      this.realtime.emitToJob(job.id, 'job.status.changed', payload);
      this.realtime.emitToUser(job.customerId, 'job.status.changed', payload);
      if (job.assignedWorkerId) {
        this.realtime.emitToUser(job.assignedWorkerId, 'job.status.changed', payload);
      }
    }

    return dispute;
  }

  /**
   * Admin or Support agent reviews and resolves/rejects a dispute.
   * May issue a financial refund transaction and creates an audit log.
   */
  async resolveDispute(
    resolver: { id: string; role: UserRole },
    disputeId: string,
    input: ResolveDisputeInputDto
  ): Promise<IDisputeEntity> {
    if (!Types.ObjectId.isValid(disputeId)) {
      throw new BadRequestError('Invalid dispute ID format');
    }

    if (resolver.role !== UserRole.ADMIN && resolver.role !== UserRole.SUPPORT) {
      throw new ForbiddenError('Only Admin or Support staff can resolve disputes');
    }

    const dispute = await this.disputeRepo.findById(disputeId);
    if (!dispute) {
      throw new NotFoundError('Dispute not found');
    }

    const updated = await this.disputeRepo.updateResolution(disputeId, {
      resolvedBy: resolver.id,
      status: input.status as DisputeStatus.RESOLVED | DisputeStatus.REJECTED,
      resolution: {
        summary: input.summary,
        refundPaise: input.refundPaise,
        actionTaken: input.actionTaken,
      },
    });

    if (!updated) {
      throw new NotFoundError('Failed to resolve dispute');
    }

    // If a monetary refund is issued, record an immutable REFUND transaction
    if (input.refundPaise && input.refundPaise > 0) {
      try {
        await this.transactionRepo.create({
          workerId: dispute.respondentId, // Worker ledger adjustment / deduction
          jobId: dispute.jobId,
          type: TransactionType.REFUND,
          amount: input.refundPaise,
          currency: 'INR',
          referenceId: `dispute:${dispute.id}:refund`,
          metadata: {
            disputeId: dispute.id,
            resolvedBy: resolver.id,
            summary: input.summary,
          },
        });
      } catch {
        // Idempotency: duplicate ignored
      }
    }

    // If job was in DISPUTED state, transition to COMPLETED or CANCELLED
    const job = await this.jobRepo.findById(dispute.jobId);
    if (job && job.status === JobStatus.DISPUTED) {
      const targetJobStatus =
        input.status === 'RESOLVED' ? JobStatus.COMPLETED : JobStatus.CANCELLED;
      await this.jobRepo.updateStatus(job.id, targetJobStatus);
      await this.jobEventRepo.create({
        jobId: job.id,
        actorId: resolver.id,
        actorRole: resolver.role,
        eventType: 'DISPUTE_RESOLVED',
        previousState: JobStatus.DISPUTED,
        newState: targetJobStatus,
        metadata: { disputeId, resolution: input.summary },
      });
    }

    // Write audit log
    await auditLogRepository.create({
      actorId: resolver.id,
      actorRole: resolver.role,
      action: `DISPUTE_${input.status}`,
      targetType: 'DISPUTE',
      targetId: disputeId,
      details: {
        jobId: dispute.jobId,
        status: input.status,
        resolution: input.summary,
        refundPaise: input.refundPaise,
      },
    });

    return updated;
  }

  /**
   * User lists disputes where they are initiator or respondent.
   */
  async getMyDisputes(
    userId: string,
    query: ListDisputesQueryDto
  ): Promise<CursorPage<IDisputeEntity>> {
    return this.disputeRepo.listDisputesCursor({
      ...query,
      userId,
    });
  }

  /**
   * Admin / Support lists all disputes.
   */
  async listDisputes(query: ListDisputesQueryDto): Promise<CursorPage<IDisputeEntity>> {
    return this.disputeRepo.listDisputesCursor(query);
  }

  /**
   * Get single dispute.
   */
  async getDisputeById(id: string): Promise<IDisputeEntity> {
    const dispute = await this.disputeRepo.findById(id);
    if (!dispute) {
      throw new NotFoundError('Dispute not found');
    }
    return dispute;
  }
}

export const disputeService = new DisputeService();
