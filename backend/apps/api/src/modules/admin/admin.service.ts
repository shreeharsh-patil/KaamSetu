import { Types, FilterQuery } from 'mongoose';
import {
  UserRole,
  UserStatus,
  WorkerVerificationStatus,
  WorkerAvailability,
  TransactionType,
  VerificationRequestStatus,
  type IAdminActionContext,
  type IAdminUserListQuery,
  type IAdminWorkerListQuery,
  type IAdminJobListQuery,
  type IAdminReportListQuery,
  type IAdminDisputeListQuery,
  type IAdminAuditLogListQuery,
  type ISuspendUserInput,
  type IRestoreUserInput,
  type IRoleChangeInput,
  type IFinancialAdjustmentInput,
  type ICreateCategoryAdminInput,
  type IUpdateCategoryAdminInput,
  type ICreateSkillAdminInput,
  type IUpdateSkillAdminInput,
  type IPaginatedResult,
  type IAuditLogEntity,
} from '@kaamsetu/types';
import { UserModel, IUserDocument } from '../users/user.model.js';
import { WorkerProfileModel, IWorkerProfileDocument } from '../worker-profiles/worker-profile.model.js';
import { CustomerProfileModel } from '../customer-profiles/customer-profile.model.js';
import { JobModel, IJobDocument } from '../jobs/job.model.js';
import { ReportModel, IReportDocument } from '../reports/report.model.js';
import { DisputeModel, IDisputeDocument } from '../disputes/dispute.model.js';
import { VerificationRequestModel } from '../verification/verification-request.model.js';
import { TransactionModel } from '../transactions/transaction.model.js';
import { ServiceCategoryModel } from '../service-categories/service-category.model.js';
import { SkillModel } from '../skills/skill.model.js';
import { auditLogRepository } from '../audit-logs/audit-log.repository.js';
import { redactSensitiveData } from '../audit-logs/redact.util.js';
import {
  ForbiddenError,
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '../../errors/index.js';
import crypto from 'crypto';

export class AdminService {
  /**
   * Service-level defense-in-depth: enforces strict ADMIN role.
   */
  assertAdmin(actorRole: UserRole): void {
    if (actorRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Administrative privilege required for this action');
    }
  }

  /**
   * Service-level defense-in-depth: enforces ADMIN or SUPPORT role.
   */
  assertAdminOrSupport(actorRole: UserRole): void {
    if (actorRole !== UserRole.ADMIN && actorRole !== UserRole.SUPPORT) {
      throw new ForbiddenError('Admin or Support privilege required for this action');
    }
  }

  // -------------------------------------------------------------
  // 1. User Management
  // -------------------------------------------------------------

  async listUsers(
    actor: IAdminActionContext,
    query: IAdminUserListQuery
  ): Promise<IPaginatedResult<Record<string, unknown>>> {
    this.assertAdminOrSupport(actor.actorRole);

    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const filter: FilterQuery<IUserDocument> = {};

    if (query.role) {
      filter.role = query.role;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ phoneNumber: searchRegex }, { email: searchRegex }];
    }

    if (query.cursor) {
      try {
        const decoded = JSON.parse(
          Buffer.from(query.cursor, 'base64url').toString('utf8')
        ) as { id: string; createdAt: string };
        const cursorDate = new Date(decoded.createdAt);
        const cursorId = new Types.ObjectId(decoded.id);

        filter.$and = [
          ...(filter.$and || []),
          {
            $or: [
              { createdAt: { $lt: cursorDate } },
              { createdAt: cursorDate, _id: { $lt: cursorId } },
            ],
          },
        ];
      } catch {
        // Fall back to first page on invalid cursor
      }
    }

    const docs = await UserModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;

    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const last = items[items.length - 1]!;
      nextCursor = Buffer.from(
        JSON.stringify({
          id: last._id.toString(),
          createdAt: last.createdAt.toISOString(),
        })
      ).toString('base64url');
    }

    const sanitizedItems = items.map((doc) => {
      const plain = doc.toObject();
      return redactSensitiveData({
        id: plain._id.toString(),
        role: plain.role,
        phoneNumber: plain.phoneNumber,
        phoneVerified: plain.phoneVerified,
        email: plain.email ?? null,
        emailVerified: plain.emailVerified,
        preferredLanguage: plain.preferredLanguage,
        status: plain.status,
        profilePhotoUrl: plain.profilePhotoUrl ?? null,
        lastLoginAt: plain.lastLoginAt ?? null,
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
      }) as Record<string, unknown>;
    });

    return {
      items: sanitizedItems,
      nextCursor,
      hasMore,
    };
  }

  async getUserById(
    actor: IAdminActionContext,
    userId: string
  ): Promise<Record<string, unknown>> {
    this.assertAdminOrSupport(actor.actorRole);

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestError('Invalid user ID format');
    }

    const user = await UserModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundError('User not found');
    }

    let profile: Record<string, unknown> | null = null;
    if (user.role === UserRole.WORKER) {
      const worker = await WorkerProfileModel.findOne({ userId: user._id }).exec();
      if (worker) {
        profile = worker.toObject() as unknown as Record<string, unknown>;
      }
    } else if (user.role === UserRole.CUSTOMER) {
      const customer = await CustomerProfileModel.findOne({ userId: user._id }).exec();
      if (customer) {
        profile = customer.toObject() as unknown as Record<string, unknown>;
      }
    }

    const userObj = user.toObject();
    return redactSensitiveData({
      id: userObj._id.toString(),
      role: userObj.role,
      phoneNumber: userObj.phoneNumber,
      phoneVerified: userObj.phoneVerified,
      email: userObj.email ?? null,
      emailVerified: userObj.emailVerified,
      preferredLanguage: userObj.preferredLanguage,
      status: userObj.status,
      profilePhotoUrl: userObj.profilePhotoUrl ?? null,
      lastLoginAt: userObj.lastLoginAt ?? null,
      createdAt: userObj.createdAt,
      updatedAt: userObj.updatedAt,
      profile,
    }) as Record<string, unknown>;
  }

  async suspendUser(
    actor: IAdminActionContext,
    userId: string,
    input: ISuspendUserInput
  ): Promise<Record<string, unknown>> {
    this.assertAdmin(actor.actorRole);

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestError('Invalid user ID format');
    }

    const user = await UserModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new BadRequestError('User is already suspended');
    }

    const beforeState = { status: user.status };
    user.status = UserStatus.SUSPENDED;
    await user.save();

    // If user is a worker, mark them offline immediately
    if (user.role === UserRole.WORKER) {
      await WorkerProfileModel.updateOne(
        { userId: user._id },
        { $set: { availabilityStatus: WorkerAvailability.OFFLINE } }
      ).exec();
    }

    const afterState = { status: user.status };

    // Record immutable audit log
    await auditLogRepository.create({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: 'USER_SUSPENDED',
      resourceType: 'USER',
      resourceId: userId,
      before: beforeState,
      after: afterState,
      ipAddress: actor.ipAddress,
      requestId: actor.requestId,
      details: { reason: input.reason },
    });

    return {
      id: user._id.toString(),
      status: user.status,
      message: 'User suspended successfully',
    };
  }

  async restoreUser(
    actor: IAdminActionContext,
    userId: string,
    input?: IRestoreUserInput
  ): Promise<Record<string, unknown>> {
    this.assertAdmin(actor.actorRole);

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestError('Invalid user ID format');
    }

    const user = await UserModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestError('User is already active');
    }

    const beforeState = { status: user.status };
    user.status = UserStatus.ACTIVE;
    await user.save();

    const afterState = { status: user.status };

    // Record immutable audit log
    await auditLogRepository.create({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: 'USER_RESTORED',
      resourceType: 'USER',
      resourceId: userId,
      before: beforeState,
      after: afterState,
      ipAddress: actor.ipAddress,
      requestId: actor.requestId,
      details: input?.reason ? { reason: input.reason } : undefined,
    });

    return {
      id: user._id.toString(),
      status: user.status,
      message: 'User restored successfully',
    };
  }

  async changeUserRole(
    actor: IAdminActionContext,
    userId: string,
    input: IRoleChangeInput
  ): Promise<Record<string, unknown>> {
    this.assertAdmin(actor.actorRole);

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestError('Invalid user ID format');
    }

    const user = await UserModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const previousRole = user.role;
    user.role = input.newRole;
    await user.save();

    await auditLogRepository.create({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: 'USER_ROLE_CHANGED',
      resourceType: 'USER',
      resourceId: userId,
      before: { role: previousRole },
      after: { role: user.role },
      ipAddress: actor.ipAddress,
      requestId: actor.requestId,
    });

    return {
      id: user._id.toString(),
      role: user.role,
      message: 'User role updated successfully',
    };
  }

  // -------------------------------------------------------------
  // 2. Workers & Verification
  // -------------------------------------------------------------

  async listWorkers(
    actor: IAdminActionContext,
    query: IAdminWorkerListQuery
  ): Promise<IPaginatedResult<Record<string, unknown>>> {
    this.assertAdminOrSupport(actor.actorRole);

    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const filter: FilterQuery<IWorkerProfileDocument> = {};

    if (query.verificationStatus) {
      filter.verificationStatus = query.verificationStatus;
    }
    if (query.availabilityStatus) {
      filter.availabilityStatus = query.availabilityStatus;
    }

    if (query.cursor) {
      try {
        const decoded = JSON.parse(
          Buffer.from(query.cursor, 'base64url').toString('utf8')
        ) as { id: string; createdAt: string };
        const cursorDate = new Date(decoded.createdAt);
        const cursorId = new Types.ObjectId(decoded.id);

        filter.$and = [
          ...(filter.$and || []),
          {
            $or: [
              { createdAt: { $lt: cursorDate } },
              { createdAt: cursorDate, _id: { $lt: cursorId } },
            ],
          },
        ];
      } catch {
        // Fall back
      }
    }

    const docs = await WorkerProfileModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;

    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const last = items[items.length - 1]!;
      nextCursor = Buffer.from(
        JSON.stringify({
          id: last._id.toString(),
          createdAt: last.createdAt.toISOString(),
        })
      ).toString('base64url');
    }

    const sanitizedItems = items.map((doc) => {
      const plain = doc.toObject();
      return redactSensitiveData({
        id: plain._id.toString(),
        userId: plain.userId.toString(),
        displayName: plain.displayName,
        bio: plain.bio,
        skills: plain.skills,
        languages: plain.languages,
        serviceLocation: plain.serviceLocation,
        serviceRadiusKm: plain.serviceRadiusKm,
        availabilityStatus: plain.availabilityStatus,
        verificationStatus: plain.verificationStatus,
        rating: plain.rating,
        stats: plain.stats,
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
      }) as Record<string, unknown>;
    });

    return {
      items: sanitizedItems,
      nextCursor,
      hasMore,
    };
  }

  async approveVerification(
    actor: IAdminActionContext,
    requestId: string
  ): Promise<Record<string, unknown>> {
    this.assertAdmin(actor.actorRole);

    if (!Types.ObjectId.isValid(requestId)) {
      throw new BadRequestError('Invalid verification request ID format');
    }

    const reqDoc = await VerificationRequestModel.findById(requestId).exec();
    if (!reqDoc) {
      throw new NotFoundError('Verification request not found');
    }

    const beforeState = {
      status: reqDoc.status,
      reviewerId: reqDoc.reviewerId?.toString() ?? null,
    };

    reqDoc.status = VerificationRequestStatus.APPROVED;
    reqDoc.reviewerId = new Types.ObjectId(actor.actorId);
    reqDoc.reviewedAt = new Date();
    await reqDoc.save();

    // Update worker profile
    await WorkerProfileModel.updateOne(
      { userId: reqDoc.workerId },
      { $set: { verificationStatus: WorkerVerificationStatus.VERIFIED } }
    ).exec();

    const afterState = {
      status: reqDoc.status,
      reviewerId: actor.actorId,
    };

    // Immutable audit log
    await auditLogRepository.create({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: 'VERIFICATION_APPROVED',
      resourceType: 'VERIFICATION_REQUEST',
      resourceId: requestId,
      before: beforeState,
      after: afterState,
      ipAddress: actor.ipAddress,
      requestId: actor.requestId,
      details: {
        workerId: reqDoc.workerId.toString(),
        verificationType: reqDoc.type,
      },
    });

    return {
      id: reqDoc._id.toString(),
      status: reqDoc.status,
      message: 'Worker verification approved successfully',
    };
  }

  async rejectVerification(
    actor: IAdminActionContext,
    requestId: string,
    input: { rejectionReason: string }
  ): Promise<Record<string, unknown>> {
    this.assertAdmin(actor.actorRole);

    if (!Types.ObjectId.isValid(requestId)) {
      throw new BadRequestError('Invalid verification request ID format');
    }

    const reqDoc = await VerificationRequestModel.findById(requestId).exec();
    if (!reqDoc) {
      throw new NotFoundError('Verification request not found');
    }

    const beforeState = {
      status: reqDoc.status,
      reviewerId: reqDoc.reviewerId?.toString() ?? null,
    };

    reqDoc.status = VerificationRequestStatus.REJECTED;
    reqDoc.reviewerId = new Types.ObjectId(actor.actorId);
    reqDoc.reason = input.rejectionReason;
    reqDoc.reviewedAt = new Date();
    await reqDoc.save();

    // Update worker profile
    await WorkerProfileModel.updateOne(
      { userId: reqDoc.workerId },
      { $set: { verificationStatus: WorkerVerificationStatus.REJECTED } }
    ).exec();

    const afterState = {
      status: reqDoc.status,
      reviewerId: actor.actorId,
      rejectionReason: input.rejectionReason,
    };

    // Immutable audit log
    await auditLogRepository.create({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: 'VERIFICATION_REJECTED',
      resourceType: 'VERIFICATION_REQUEST',
      resourceId: requestId,
      before: beforeState,
      after: afterState,
      ipAddress: actor.ipAddress,
      requestId: actor.requestId,
      details: {
        workerId: reqDoc.workerId.toString(),
        verificationType: reqDoc.type,
        rejectionReason: input.rejectionReason,
      },
    });

    return {
      id: reqDoc._id.toString(),
      status: reqDoc.status,
      rejectionReason: input.rejectionReason,
      message: 'Worker verification rejected successfully',
    };
  }

  // -------------------------------------------------------------
  // 3. Jobs, Reports & Disputes
  // -------------------------------------------------------------

  async listJobs(
    actor: IAdminActionContext,
    query: IAdminJobListQuery
  ): Promise<IPaginatedResult<Record<string, unknown>>> {
    this.assertAdminOrSupport(actor.actorRole);

    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const filter: FilterQuery<IJobDocument> = {};

    if (query.status) {
      filter.status = query.status;
    }
    if (query.customerId && Types.ObjectId.isValid(query.customerId)) {
      filter.customerId = new Types.ObjectId(query.customerId);
    }
    if (query.workerId && Types.ObjectId.isValid(query.workerId)) {
      filter.assignedWorkerId = new Types.ObjectId(query.workerId);
    }

    if (query.cursor) {
      try {
        const decoded = JSON.parse(
          Buffer.from(query.cursor, 'base64url').toString('utf8')
        ) as { id: string; createdAt: string };
        const cursorDate = new Date(decoded.createdAt);
        const cursorId = new Types.ObjectId(decoded.id);

        filter.$and = [
          ...(filter.$and || []),
          {
            $or: [
              { createdAt: { $lt: cursorDate } },
              { createdAt: cursorDate, _id: { $lt: cursorId } },
            ],
          },
        ];
      } catch {
        // Fall back
      }
    }

    const docs = await JobModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;

    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const last = items[items.length - 1]!;
      nextCursor = Buffer.from(
        JSON.stringify({
          id: last._id.toString(),
          createdAt: last.createdAt.toISOString(),
        })
      ).toString('base64url');
    }

    const sanitizedItems = items.map((doc) => {
      const plain = doc.toObject();
      return {
        id: plain._id.toString(),
        customerId: plain.customerId.toString(),
        categoryId: plain.categoryId.toString(),
        title: plain.title,
        description: plain.description,
        status: plain.status,
        assignedWorkerId: plain.assignedWorkerId?.toString() ?? null,
        location: plain.location,
        urgency: plain.urgency,
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
      };
    });

    return {
      items: sanitizedItems,
      nextCursor,
      hasMore,
    };
  }

  async listReports(
    actor: IAdminActionContext,
    query: IAdminReportListQuery
  ): Promise<IPaginatedResult<Record<string, unknown>>> {
    this.assertAdminOrSupport(actor.actorRole);

    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const filter: FilterQuery<IReportDocument> = {};

    if (query.status) {
      filter.status = query.status;
    }
    if (query.targetType) {
      filter.targetType = query.targetType;
    }

    if (query.cursor) {
      try {
        const decoded = JSON.parse(
          Buffer.from(query.cursor, 'base64url').toString('utf8')
        ) as { id: string; createdAt: string };
        const cursorDate = new Date(decoded.createdAt);
        const cursorId = new Types.ObjectId(decoded.id);

        filter.$and = [
          ...(filter.$and || []),
          {
            $or: [
              { createdAt: { $lt: cursorDate } },
              { createdAt: cursorDate, _id: { $lt: cursorId } },
            ],
          },
        ];
      } catch {
        // Fall back
      }
    }

    const docs = await ReportModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;

    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const last = items[items.length - 1]!;
      nextCursor = Buffer.from(
        JSON.stringify({
          id: last._id.toString(),
          createdAt: last.createdAt.toISOString(),
        })
      ).toString('base64url');
    }

    const sanitizedItems = items.map((doc) => {
      const plain = doc.toObject();
      return {
        id: plain._id.toString(),
        reporterId: plain.reporterId.toString(),
        targetType: plain.targetType,
        targetId: plain.targetId,
        reason: plain.reason,
        description: plain.description,
        status: plain.status,
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
      };
    });

    return {
      items: sanitizedItems,
      nextCursor,
      hasMore,
    };
  }

  async listDisputes(
    actor: IAdminActionContext,
    query: IAdminDisputeListQuery
  ): Promise<IPaginatedResult<Record<string, unknown>>> {
    this.assertAdminOrSupport(actor.actorRole);

    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const filter: FilterQuery<IDisputeDocument> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.cursor) {
      try {
        const decoded = JSON.parse(
          Buffer.from(query.cursor, 'base64url').toString('utf8')
        ) as { id: string; createdAt: string };
        const cursorDate = new Date(decoded.createdAt);
        const cursorId = new Types.ObjectId(decoded.id);

        filter.$and = [
          ...(filter.$and || []),
          {
            $or: [
              { createdAt: { $lt: cursorDate } },
              { createdAt: cursorDate, _id: { $lt: cursorId } },
            ],
          },
        ];
      } catch {
        // Fall back
      }
    }

    const docs = await DisputeModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;

    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const last = items[items.length - 1]!;
      nextCursor = Buffer.from(
        JSON.stringify({
          id: last._id.toString(),
          createdAt: last.createdAt.toISOString(),
        })
      ).toString('base64url');
    }

    const sanitizedItems = items.map((doc) => {
      const plain = doc.toObject();
      return {
        id: plain._id.toString(),
        jobId: plain.jobId.toString(),
        initiatorId: plain.initiatorId.toString(),
        respondentId: plain.respondentId.toString(),
        reason: plain.reason,
        description: plain.description,
        status: plain.status,
        resolution: plain.resolution,
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
      };
    });

    return {
      items: sanitizedItems,
      nextCursor,
      hasMore,
    };
  }

  // -------------------------------------------------------------
  // 4. Financial Adjustments
  // -------------------------------------------------------------

  async createFinancialAdjustment(
    actor: IAdminActionContext,
    input: IFinancialAdjustmentInput
  ): Promise<Record<string, unknown>> {
    this.assertAdmin(actor.actorRole);

    if (!Types.ObjectId.isValid(input.workerId)) {
      throw new BadRequestError('Invalid worker ID format');
    }

    const worker = await UserModel.findById(input.workerId).exec();
    if (!worker) {
      throw new NotFoundError('Worker not found');
    }

    const referenceId =
      input.referenceId ??
      `adj-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const existingTx = await TransactionModel.findOne({ referenceId }).exec();
    if (existingTx) {
      throw new ConflictError(`Transaction with reference ${referenceId} already exists`);
    }

    // Ledger transactions are immutable and store amounts strictly as integer paise
    const tx = await TransactionModel.create({
      workerId: new Types.ObjectId(input.workerId),
      jobId: input.jobId && Types.ObjectId.isValid(input.jobId) ? new Types.ObjectId(input.jobId) : null,
      type: TransactionType.ADJUSTMENT,
      amount: input.amountPaise,
      currency: 'INR',
      referenceId,
      metadata: {
        reason: input.reason,
        adjustmentType: input.type ?? 'CREDIT',
        adjustedBy: actor.actorId,
      },
      createdAt: new Date(),
    });

    // Record immutable audit log
    await auditLogRepository.create({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: 'FINANCIAL_ADJUSTMENT',
      resourceType: 'TRANSACTION',
      resourceId: tx._id.toString(),
      before: null,
      after: {
        amountPaise: tx.amount,
        type: tx.type,
        referenceId: tx.referenceId,
      },
      ipAddress: actor.ipAddress,
      requestId: actor.requestId,
      details: {
        workerId: input.workerId,
        reason: input.reason,
        adjustmentType: input.type ?? 'CREDIT',
      },
    });

    return {
      id: tx._id.toString(),
      workerId: tx.workerId.toString(),
      amount: tx.amount,
      type: tx.type,
      referenceId: tx.referenceId,
      createdAt: tx.createdAt,
    };
  }

  // -------------------------------------------------------------
  // 5. Service Categories & Skills
  // -------------------------------------------------------------

  async createCategory(
    actor: IAdminActionContext,
    input: ICreateCategoryAdminInput
  ): Promise<Record<string, unknown>> {
    this.assertAdmin(actor.actorRole);

    const slug = input.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await ServiceCategoryModel.findOne({ slug }).exec();
    if (existing) {
      throw new ConflictError(`Service category with slug "${slug}" already exists`);
    }

    const cat = await ServiceCategoryModel.create({
      name: input.name,
      slug,
      description: input.description ?? null,
      icon: input.icon ?? null,
      translations: {},
      active: true,
      displayOrder: 0,
    });

    await auditLogRepository.create({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: 'CATEGORY_CREATED',
      resourceType: 'SERVICE_CATEGORY',
      resourceId: cat._id.toString(),
      before: null,
      after: {
        name: cat.name,
        slug: cat.slug,
        active: cat.active,
      },
      ipAddress: actor.ipAddress,
      requestId: actor.requestId,
    });

    return {
      id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
      active: cat.active,
    };
  }

  async updateCategory(
    actor: IAdminActionContext,
    categoryId: string,
    input: IUpdateCategoryAdminInput
  ): Promise<Record<string, unknown>> {
    this.assertAdmin(actor.actorRole);

    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestError('Invalid category ID format');
    }

    const cat = await ServiceCategoryModel.findById(categoryId).exec();
    if (!cat) {
      throw new NotFoundError('Category not found');
    }

    const beforeState = {
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      active: cat.active,
    };

    if (input.name !== undefined) cat.name = input.name;
    if (input.description !== undefined) cat.description = input.description;
    if (input.icon !== undefined) cat.icon = input.icon;
    if (input.active !== undefined) cat.active = input.active;

    await cat.save();

    const afterState = {
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      active: cat.active,
    };

    await auditLogRepository.create({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: 'CATEGORY_UPDATED',
      resourceType: 'SERVICE_CATEGORY',
      resourceId: categoryId,
      before: beforeState,
      after: afterState,
      ipAddress: actor.ipAddress,
      requestId: actor.requestId,
    });

    return {
      id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
      active: cat.active,
    };
  }

  async createSkill(
    actor: IAdminActionContext,
    input: ICreateSkillAdminInput
  ): Promise<Record<string, unknown>> {
    this.assertAdmin(actor.actorRole);

    if (!Types.ObjectId.isValid(input.categoryId)) {
      throw new BadRequestError('Invalid category ID format');
    }

    const category = await ServiceCategoryModel.findById(input.categoryId).exec();
    if (!category) {
      throw new NotFoundError('Service category not found');
    }

    const slug = input.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await SkillModel.findOne({ slug }).exec();
    if (existing) {
      throw new ConflictError(`Skill with slug "${slug}" already exists`);
    }

    const skill = await SkillModel.create({
      name: input.name,
      slug,
      categoryId: new Types.ObjectId(input.categoryId),
      description: input.description ?? null,
      translations: {},
      active: true,
    });

    await auditLogRepository.create({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: 'SKILL_CREATED',
      resourceType: 'SKILL',
      resourceId: skill._id.toString(),
      before: null,
      after: {
        name: skill.name,
        slug: skill.slug,
        categoryId: input.categoryId,
        active: skill.active,
      },
      ipAddress: actor.ipAddress,
      requestId: actor.requestId,
    });

    return {
      id: skill._id.toString(),
      name: skill.name,
      slug: skill.slug,
      categoryId: skill.categoryId.toString(),
      active: skill.active,
    };
  }

  async updateSkill(
    actor: IAdminActionContext,
    skillId: string,
    input: IUpdateSkillAdminInput
  ): Promise<Record<string, unknown>> {
    this.assertAdmin(actor.actorRole);

    if (!Types.ObjectId.isValid(skillId)) {
      throw new BadRequestError('Invalid skill ID format');
    }

    const skill = await SkillModel.findById(skillId).exec();
    if (!skill) {
      throw new NotFoundError('Skill not found');
    }

    const beforeState = {
      name: skill.name,
      active: skill.active,
    };

    if (input.name !== undefined) skill.name = input.name;
    if (input.active !== undefined) skill.active = input.active;

    await skill.save();

    const afterState = {
      name: skill.name,
      active: skill.active,
    };

    await auditLogRepository.create({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: 'SKILL_UPDATED',
      resourceType: 'SKILL',
      resourceId: skillId,
      before: beforeState,
      after: afterState,
      ipAddress: actor.ipAddress,
      requestId: actor.requestId,
    });

    return {
      id: skill._id.toString(),
      name: skill.name,
      slug: skill.slug,
      active: skill.active,
    };
  }

  // -------------------------------------------------------------
  // 6. Immutable Audit Logs
  // -------------------------------------------------------------

  async listAuditLogs(
    actor: IAdminActionContext,
    query: IAdminAuditLogListQuery
  ): Promise<IPaginatedResult<IAuditLogEntity>> {
    // Audit log access is strictly restricted to ADMIN! SUPPORT gets 403.
    this.assertAdmin(actor.actorRole);

    return auditLogRepository.listAuditLogsCursor({
      actorId: query.actorId,
      action: query.action,
      resourceType: query.resourceType,
      cursor: query.cursor,
      limit: query.limit,
    });
  }
}

export const adminService = new AdminService();
