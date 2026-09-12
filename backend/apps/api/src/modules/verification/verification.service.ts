import { Types } from 'mongoose';
import {
  UserRole,
  WorkerVerificationStatus,
  VerificationRequestStatus,
  type IVerificationRequestEntity,
  type CursorPage,
} from '@kaamsetu/types';
import type {
  CreateVerificationRequestInputDto,
  ReviewVerificationRequestInputDto,
  ListVerificationRequestsQueryDto,
} from '@kaamsetu/validation';
import {
  IVerificationRequestRepository,
  verificationRequestRepository,
} from './verification-request.repository.js';
import { WorkerProfileModel } from '../worker-profiles/worker-profile.model.js';
import { auditLogRepository } from '../audit-logs/audit-log.repository.js';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '../../errors/index.js';

export class VerificationService {
  constructor(
    private readonly verificationRepo: IVerificationRequestRepository = verificationRequestRepository
  ) {}

  /**
   * Worker submits verification documents for KYC / credential vetting.
   */
  async submitRequest(
    workerId: string,
    input: CreateVerificationRequestInputDto
  ): Promise<IVerificationRequestEntity> {
    if (!Types.ObjectId.isValid(workerId)) {
      throw new BadRequestError('Invalid worker ID format');
    }

    const profile = await WorkerProfileModel.findOne({
      userId: new Types.ObjectId(workerId),
    }).exec();
    if (!profile) {
      throw new NotFoundError('Worker profile not found');
    }

    const request = await this.verificationRepo.create({
      workerId,
      type: input.type,
      documents: input.documents,
    });

    // Update worker profile status to PENDING
    await WorkerProfileModel.updateOne(
      { userId: new Types.ObjectId(workerId) },
      { $set: { verificationStatus: WorkerVerificationStatus.PENDING } }
    ).exec();

    return request;
  }

  /**
   * Admin or Support agent reviews verification request.
   * Rule: Worker cannot approve their own verification!
   * Rule: Admin actions create audit log.
   */
  async reviewRequest(
    reviewer: { id: string; role: UserRole },
    requestId: string,
    input: ReviewVerificationRequestInputDto
  ): Promise<IVerificationRequestEntity> {
    if (!Types.ObjectId.isValid(requestId)) {
      throw new BadRequestError('Invalid request ID format');
    }

    if (reviewer.role !== UserRole.ADMIN && reviewer.role !== UserRole.SUPPORT) {
      throw new ForbiddenError('Only Admin or Support staff can review verification requests');
    }

    const request = await this.verificationRepo.findById(requestId);
    if (!request) {
      throw new NotFoundError('Verification request not found');
    }

    // Critical rule: Worker cannot approve own verification
    if (request.workerId === reviewer.id) {
      throw new ForbiddenError('Workers cannot approve or review their own verification requests');
    }

    const targetStatus = input.status as VerificationRequestStatus;
    const updated = await this.verificationRepo.updateReview(requestId, {
      reviewerId: reviewer.id,
      status: targetStatus,
      reason: input.reason,
    });

    if (!updated) {
      throw new NotFoundError('Failed to update verification request');
    }

    // Update worker profile status
    let newProfileStatus: WorkerVerificationStatus;
    if (targetStatus === VerificationRequestStatus.APPROVED) {
      newProfileStatus = WorkerVerificationStatus.VERIFIED;
    } else if (targetStatus === VerificationRequestStatus.REJECTED) {
      newProfileStatus = WorkerVerificationStatus.REJECTED;
    } else {
      newProfileStatus = WorkerVerificationStatus.PENDING;
    }

    await WorkerProfileModel.updateOne(
      { userId: new Types.ObjectId(request.workerId) },
      { $set: { verificationStatus: newProfileStatus } }
    ).exec();

    // Critical rule: Admin actions create audit log
    await auditLogRepository.create({
      actorId: reviewer.id,
      actorRole: reviewer.role,
      action: `VERIFICATION_${targetStatus}`,
      targetType: 'VERIFICATION_REQUEST',
      targetId: requestId,
      details: {
        workerId: request.workerId,
        type: request.type,
        status: targetStatus,
        reason: input.reason,
      },
    });

    return updated;
  }

  /**
   * Worker gets their verification requests.
   */
  async getMyRequests(
    workerId: string,
    query: ListVerificationRequestsQueryDto
  ): Promise<CursorPage<IVerificationRequestEntity>> {
    return this.verificationRepo.listRequestsCursor({
      ...query,
      workerId,
    });
  }

  /**
   * Admin / Support lists all verification requests.
   */
  async listRequests(
    query: ListVerificationRequestsQueryDto
  ): Promise<CursorPage<IVerificationRequestEntity>> {
    return this.verificationRepo.listRequestsCursor(query);
  }

  /**
   * Get single verification request.
   */
  async getRequestById(id: string): Promise<IVerificationRequestEntity> {
    const request = await this.verificationRepo.findById(id);
    if (!request) {
      throw new NotFoundError('Verification request not found');
    }
    return request;
  }
}

export const verificationService = new VerificationService();
