import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { SessionModel } from '../src/modules/sessions/session.model.js';
import { sessionRepository } from '../src/modules/sessions/session.repository.js';
import { WorkerProfileModel } from '../src/modules/worker-profiles/worker-profile.model.js';
import { CustomerProfileModel } from '../src/modules/customer-profiles/customer-profile.model.js';
import { ServiceCategoryModel } from '../src/modules/service-categories/service-category.model.js';
import { SkillModel } from '../src/modules/skills/skill.model.js';
import { VerificationRequestModel } from '../src/modules/verification/verification-request.model.js';
import { TransactionModel } from '../src/modules/transactions/transaction.model.js';
import { JobModel } from '../src/modules/jobs/job.model.js';
import { ReportModel } from '../src/modules/reports/report.model.js';
import { DisputeModel } from '../src/modules/disputes/dispute.model.js';
import { AuditLogModel } from '../src/modules/audit-logs/audit-log.model.js';
import { adminService } from '../src/modules/admin/admin.service.js';
import { redactSensitiveData } from '../src/modules/audit-logs/redact.util.js';
import {
  UserRole,
  UserStatus,
  WorkerVerificationStatus,
  WorkerAvailability,
  JobStatus,
  JobUrgency,
  ReportTargetType,
  ReportReason,
  ReportStatus,
  DisputeReason,
  DisputeStatus,
  VerificationType,
  VerificationRequestStatus,
  TransactionType,
} from '@kaamsetu/types';
import { signAccessToken } from '../src/modules/auth/token.util.js';
import { Types } from 'mongoose';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

const PHONE_PREFIX = '+91912345';

describe('Admin Backend & Immutable Audit System (Phase 12)', () => {
  let adminUser: { id: string; token: string };
  let supportUser: { id: string; token: string };
  let customerUser: { id: string; token: string };
  let workerUser: { id: string; token: string };

  let testCategory: { id: string; slug: string };
  let testSkill: { id: string; slug: string };
  let testJobId: string;
  let testReportId: string;
  let testDisputeId: string;
  let testVerificationId: string;

  beforeAll(async () => {
    await connectMongoDB({ uri: TEST_MONGODB_URI });
    await UserModel.syncIndexes();
    await SessionModel.syncIndexes();
    await AuditLogModel.syncIndexes();

    // Clean up isolated test namespace
    await UserModel.deleteMany({ phoneNumber: /^\+91912345/ });
    await ServiceCategoryModel.deleteMany({ slug: /^phase12-/ });
    await SkillModel.deleteMany({ slug: /^phase12-/ });

    // 1. Create Admin User
    const adminDoc = await UserModel.create({
      phoneNumber: `${PHONE_PREFIX}0001`,
      role: UserRole.ADMIN,
      phoneVerified: true,
      status: UserStatus.ACTIVE,
    });
    const adminSess = await sessionRepository.create({
      userId: adminDoc._id.toString(),
      refreshTokenHash: 'p12-admin-hash',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    adminUser = {
      id: adminDoc._id.toString(),
      token: signAccessToken({
        userId: adminDoc._id.toString(),
        role: adminDoc.role,
        sessionId: adminSess.id,
        familyId: adminSess.familyId,
      }),
    };

    // 2. Create Support User
    const supportDoc = await UserModel.create({
      phoneNumber: `${PHONE_PREFIX}0002`,
      role: UserRole.SUPPORT,
      phoneVerified: true,
      status: UserStatus.ACTIVE,
    });
    const supportSess = await sessionRepository.create({
      userId: supportDoc._id.toString(),
      refreshTokenHash: 'p12-support-hash',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    supportUser = {
      id: supportDoc._id.toString(),
      token: signAccessToken({
        userId: supportDoc._id.toString(),
        role: supportDoc.role,
        sessionId: supportSess.id,
        familyId: supportSess.familyId,
      }),
    };

    // 3. Create Customer User
    const customerDoc = await UserModel.create({
      phoneNumber: `${PHONE_PREFIX}0003`,
      role: UserRole.CUSTOMER,
      phoneVerified: true,
      status: UserStatus.ACTIVE,
    });
    const customerSess = await sessionRepository.create({
      userId: customerDoc._id.toString(),
      refreshTokenHash: 'p12-customer-hash',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    customerUser = {
      id: customerDoc._id.toString(),
      token: signAccessToken({
        userId: customerDoc._id.toString(),
        role: customerDoc.role,
        sessionId: customerSess.id,
        familyId: customerSess.familyId,
      }),
    };
    await CustomerProfileModel.create({
      userId: customerDoc._id,
      displayName: 'Customer Test',
      savedAddresses: [],
    });

    // 4. Create Worker User
    const workerDoc = await UserModel.create({
      phoneNumber: `${PHONE_PREFIX}0004`,
      role: UserRole.WORKER,
      phoneVerified: true,
      status: UserStatus.ACTIVE,
    });
    const workerSess = await sessionRepository.create({
      userId: workerDoc._id.toString(),
      refreshTokenHash: 'p12-worker-hash',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    workerUser = {
      id: workerDoc._id.toString(),
      token: signAccessToken({
        userId: workerDoc._id.toString(),
        role: workerDoc.role,
        sessionId: workerSess.id,
        familyId: workerSess.familyId,
      }),
    };
    await WorkerProfileModel.create({
      userId: workerDoc._id,
      displayName: 'Worker Test',
      bio: 'Expert Electrician',
      languages: ['en', 'hi'],
      serviceLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      serviceRadiusKm: 15,
      availabilityStatus: WorkerAvailability.AVAILABLE,
      verificationStatus: WorkerVerificationStatus.PENDING,
      skills: [],
      portfolio: [],
      rating: { average: 4.8, count: 12 },
      stats: { completedJobs: 12, cancelledJobs: 0 },
      pricing: { hourlyRate: 35000 },
    });

    // 5. Seed Category & Skill
    const cat = await ServiceCategoryModel.create({
      name: 'Phase12 Electrical Services',
      slug: 'phase12-electrical',
      description: 'Electrical and wiring work',
      translations: {},
      active: true,
      displayOrder: 1,
    });
    testCategory = { id: cat._id.toString(), slug: cat.slug };

    const sk = await SkillModel.create({
      name: 'Phase12 Wiring',
      slug: 'phase12-wiring',
      categoryId: cat._id,
      active: true,
      translations: {},
    });
    testSkill = { id: sk._id.toString(), slug: sk.slug };

    // 6. Seed Job
    const job = await JobModel.create({
      customerId: customerDoc._id,
      categoryId: cat._id,
      requiredSkills: [sk._id],
      title: 'Fix Main Circuit Breaker',
      description: 'The main circuit breaker keeps tripping',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      address: {
        line: '123 Test Street',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
      },
      preferredTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      urgency: JobUrgency.EMERGENCY,
      status: JobStatus.OPEN,
    });
    testJobId = job._id.toString();

    // 7. Seed Report
    const report = await ReportModel.create({
      reporterId: customerDoc._id,
      targetType: ReportTargetType.USER,
      targetId: workerDoc._id.toString(),
      reason: ReportReason.INAPPROPRIATE_BEHAVIOR,
      description: 'Test report behavior',
      status: ReportStatus.PENDING,
    });
    testReportId = report._id.toString();

    // 8. Seed Dispute
    const dispute = await DisputeModel.create({
      jobId: job._id,
      initiatorId: customerDoc._id,
      respondentId: workerDoc._id,
      reason: DisputeReason.PAYMENT_ISSUE,
      description: 'Test dispute regarding billing',
      status: DisputeStatus.OPEN,
    });
    testDisputeId = dispute._id.toString();

    // 9. Seed Verification Request
    const vReq = await VerificationRequestModel.create({
      workerId: workerDoc._id,
      type: VerificationType.GOVERNMENT_ID,
      documents: [
        {
          url: 'https://cdn.kaamsetu.test/docs/aadhaar.pdf',
          mimeType: 'application/pdf',
          documentType: 'GOVERNMENT_ID',
        },
      ],
      status: VerificationRequestStatus.PENDING,
    });
    testVerificationId = vReq._id.toString();
  });

  afterAll(async () => {
    await UserModel.deleteMany({ phoneNumber: /^\+91912345/ });
    await ServiceCategoryModel.deleteMany({ slug: /^phase12-/ });
    await SkillModel.deleteMany({ slug: /^phase12-/ });
    await disconnectMongoDB();
  });

  // =============================================================
  // 1. RBAC & Strict Role Hierarchy (ADMIN vs SUPPORT vs Customers/Workers)
  // =============================================================
  describe('1. Role-Based Access Control (RBAC) & Permission Boundary', () => {
    it('blocks unauthenticated requests with 401 Unauthorized', async () => {
      const endpoints = [
        { method: 'get', url: '/api/v1/admin/users' },
        { method: 'get', url: '/api/v1/admin/workers' },
        { method: 'get', url: '/api/v1/admin/jobs' },
        { method: 'get', url: '/api/v1/admin/reports' },
        { method: 'get', url: '/api/v1/admin/disputes' },
        { method: 'get', url: '/api/v1/admin/audit-logs' },
      ];

      for (const ep of endpoints) {
        const res = await request(app).get(ep.url);
        expect(res.status).toBe(401);
      }
    });

    it('blocks normal CUSTOMER users from all admin endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${customerUser.token}`);

      expect(res.status).toBe(403);
    });

    it('blocks normal WORKER users from all admin endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${workerUser.token}`);

      expect(res.status).toBe(403);
    });

    it('allows SUPPORT users to access read/monitoring endpoints', async () => {
      const readEndpoints = [
        '/api/v1/admin/users',
        `/api/v1/admin/users/${workerUser.id}`,
        '/api/v1/admin/workers',
        '/api/v1/admin/jobs',
        '/api/v1/admin/reports',
        '/api/v1/admin/disputes',
      ];

      for (const url of readEndpoints) {
        const res = await request(app)
          .get(url)
          .set('Authorization', `Bearer ${supportUser.token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });

    it('STRICT INVARIANT: blocks SUPPORT users from all write/administrative operations with 403 Forbidden', async () => {
      // 1. Suspend user
      const resSuspend = await request(app)
        .post(`/api/v1/admin/users/${workerUser.id}/suspend`)
        .set('Authorization', `Bearer ${supportUser.token}`)
        .send({ reason: 'Attempted by support' });
      expect(resSuspend.status).toBe(403);

      // 2. Restore user
      const resRestore = await request(app)
        .post(`/api/v1/admin/users/${workerUser.id}/restore`)
        .set('Authorization', `Bearer ${supportUser.token}`)
        .send({ reason: 'Attempted by support' });
      expect(resRestore.status).toBe(403);

      // 3. Change role
      const resRole = await request(app)
        .post(`/api/v1/admin/users/${workerUser.id}/role`)
        .set('Authorization', `Bearer ${supportUser.token}`)
        .send({ newRole: UserRole.SUPPORT });
      expect(resRole.status).toBe(403);

      // 4. Approve verification
      const resApprove = await request(app)
        .post(`/api/v1/admin/verifications/${testVerificationId}/approve`)
        .set('Authorization', `Bearer ${supportUser.token}`);
      expect(resApprove.status).toBe(403);

      // 5. Reject verification
      const resReject = await request(app)
        .post(`/api/v1/admin/verifications/${testVerificationId}/reject`)
        .set('Authorization', `Bearer ${supportUser.token}`)
        .send({ rejectionReason: 'Attempted by support' });
      expect(resReject.status).toBe(403);

      // 6. Financial adjustment
      const resFin = await request(app)
        .post('/api/v1/admin/financial-adjustments')
        .set('Authorization', `Bearer ${supportUser.token}`)
        .send({
          workerId: workerUser.id,
          amountPaise: 50000,
          reason: 'Bonus',
        });
      expect(resFin.status).toBe(403);

      // 7. Create category
      const resCat = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${supportUser.token}`)
        .send({ name: 'Support Category' });
      expect(resCat.status).toBe(403);

      // 8. Create skill
      const resSkill = await request(app)
        .post('/api/v1/admin/skills')
        .set('Authorization', `Bearer ${supportUser.token}`)
        .send({ categoryId: testCategory.id, name: 'Support Skill' });
      expect(resSkill.status).toBe(403);

      // 9. View Audit Logs (Support cannot view immutable audit log trail)
      const resAudit = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${supportUser.token}`);
      expect(resAudit.status).toBe(403);
    });

    it('allows ADMIN users full access to both read and administrative operations', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  // =============================================================
  // 2. Service Layer Defense-in-Depth Enforcement
  // =============================================================
  describe('2. Service Layer Authorization Enforcement', () => {
    it('throws ForbiddenError when assertAdmin is called with non-admin role', () => {
      expect(() => adminService.assertAdmin(UserRole.SUPPORT)).toThrow(
        'Administrative privilege required for this action'
      );
      expect(() => adminService.assertAdmin(UserRole.WORKER)).toThrow(
        'Administrative privilege required for this action'
      );
      expect(() => adminService.assertAdmin(UserRole.CUSTOMER)).toThrow(
        'Administrative privilege required for this action'
      );
    });

    it('throws ForbiddenError when assertAdminOrSupport is called with customer or worker', () => {
      expect(() => adminService.assertAdminOrSupport(UserRole.WORKER)).toThrow(
        'Admin or Support privilege required'
      );
      expect(() => adminService.assertAdminOrSupport(UserRole.CUSTOMER)).toThrow(
        'Admin or Support privilege required'
      );
    });

    it('service methods reject non-admin actor even when bypassed at HTTP layer', async () => {
      const supportActor = {
        actorId: supportUser.id,
        actorRole: UserRole.SUPPORT,
      };

      await expect(
        adminService.suspendUser(supportActor, workerUser.id, { reason: 'Test' })
      ).rejects.toThrow('Administrative privilege required');

      await expect(
        adminService.approveVerification(supportActor, testVerificationId)
      ).rejects.toThrow('Administrative privilege required');

      await expect(
        adminService.listAuditLogs(supportActor, {})
      ).rejects.toThrow('Administrative privilege required');
    });
  });

  // =============================================================
  // 3. User Suspension, Restoration & Role Changes with Audit Logs
  // =============================================================
  describe('3. User Operational Management & Lifecycle Audit Logging', () => {
    let targetUserId: string;

    beforeAll(async () => {
      const targetDoc = await UserModel.create({
        phoneNumber: `${PHONE_PREFIX}0099`,
        role: UserRole.CUSTOMER,
        phoneVerified: true,
        status: UserStatus.ACTIVE,
      });
      targetUserId = targetDoc._id.toString();
    });

    it('suspends active user and records immutable audit log with before/after state', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${targetUserId}/suspend`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .set('x-request-id', 'req-suspend-001')
        .send({ reason: 'Suspicious duplicate accounts detected' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(UserStatus.SUSPENDED);

      // Verify database state
      const updatedUser = await UserModel.findById(targetUserId);
      expect(updatedUser?.status).toBe(UserStatus.SUSPENDED);

      // Verify Audit Log
      const audit = await AuditLogModel.findOne({
        resourceType: 'USER',
        resourceId: targetUserId,
        action: 'USER_SUSPENDED',
      });
      expect(audit).toBeTruthy();
      expect(audit?.actorId.toString()).toBe(adminUser.id);
      expect(audit?.actorRole).toBe(UserRole.ADMIN);
      expect(audit?.before).toEqual({ status: UserStatus.ACTIVE });
      expect(audit?.after).toEqual({ status: UserStatus.SUSPENDED });
      expect(audit?.details).toMatchObject({
        reason: 'Suspicious duplicate accounts detected',
      });
      expect(audit?.requestId).toBe('req-suspend-001');
    });

    it('rejects suspending an already suspended user with 400 Bad Request', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${targetUserId}/suspend`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({ reason: 'Already suspended' });

      expect(res.status).toBe(400);
    });

    it('restores suspended user and records immutable audit log', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${targetUserId}/restore`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .set('x-request-id', 'req-restore-001')
        .send({ reason: 'Identity verified successfully upon appeal' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(UserStatus.ACTIVE);

      // Verify database state
      const updatedUser = await UserModel.findById(targetUserId);
      expect(updatedUser?.status).toBe(UserStatus.ACTIVE);

      // Verify Audit Log
      const audit = await AuditLogModel.findOne({
        resourceType: 'USER',
        resourceId: targetUserId,
        action: 'USER_RESTORED',
      });
      expect(audit).toBeTruthy();
      expect(audit?.before).toEqual({ status: UserStatus.SUSPENDED });
      expect(audit?.after).toEqual({ status: UserStatus.ACTIVE });
      expect(audit?.details).toMatchObject({
        reason: 'Identity verified successfully upon appeal',
      });
    });

    it('changes user role and records immutable audit log', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${targetUserId}/role`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({ newRole: UserRole.SUPPORT });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe(UserRole.SUPPORT);

      const audit = await AuditLogModel.findOne({
        resourceType: 'USER',
        resourceId: targetUserId,
        action: 'USER_ROLE_CHANGED',
      });
      expect(audit).toBeTruthy();
      expect(audit?.before).toEqual({ role: UserRole.CUSTOMER });
      expect(audit?.after).toEqual({ role: UserRole.SUPPORT });
    });
  });

  // =============================================================
  // 4. Worker Verification Decisions & Audit Trails
  // =============================================================
  describe('4. Worker Verification Decisions & Audit Trails', () => {
    it('approves verification request and updates worker profile with audit log', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/verifications/${testVerificationId}/approve`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .set('x-request-id', 'req-verify-approve-001');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');

      // Verify worker profile is updated to VERIFIED
      const workerProfile = await WorkerProfileModel.findOne({
        userId: new Types.ObjectId(workerUser.id),
      });
      expect(workerProfile?.verificationStatus).toBe(WorkerVerificationStatus.VERIFIED);

      // Verify audit log
      const audit = await AuditLogModel.findOne({
        resourceType: 'VERIFICATION_REQUEST',
        resourceId: testVerificationId,
        action: 'VERIFICATION_APPROVED',
      });
      expect(audit).toBeTruthy();
      expect(audit?.actorId.toString()).toBe(adminUser.id);
      expect(audit?.after).toMatchObject({ status: 'APPROVED' });
    });

    it('rejects verification request with reason and records audit log', async () => {
      // Create another verification request for rejection test
      const vReq = await VerificationRequestModel.create({
        workerId: new Types.ObjectId(workerUser.id),
        type: VerificationType.POLICE_CLEARANCE,
        documents: [{ url: 'https://cdn.kaamsetu.test/docs/police.pdf' }],
        status: VerificationRequestStatus.PENDING,
      });

      const res = await request(app)
        .post(`/api/v1/admin/verifications/${vReq._id}/reject`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({ rejectionReason: 'Document illegible and expired' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('REJECTED');
      expect(res.body.data.rejectionReason).toBe('Document illegible and expired');

      // Verify audit log
      const audit = await AuditLogModel.findOne({
        resourceType: 'VERIFICATION_REQUEST',
        resourceId: vReq._id.toString(),
        action: 'VERIFICATION_REJECTED',
      });
      expect(audit).toBeTruthy();
      expect(audit?.after).toMatchObject({ status: 'REJECTED' });
      expect(audit?.details).toMatchObject({
        rejectionReason: 'Document illegible and expired',
      });
    });
  });

  // =============================================================
  // 5. Financial Adjustments & Immutable Ledger
  // =============================================================
  describe('5. Financial Adjustments & Immutable Ledger Integration', () => {
    it('creates financial adjustment in paise and records immutable audit log', async () => {
      const res = await request(app)
        .post('/api/v1/admin/financial-adjustments')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          workerId: workerUser.id,
          amountPaise: 25000, // 250.00 INR
          reason: 'Good performance incentive bonus',
          type: 'CREDIT',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(25000);
      expect(res.body.data.type).toBe(TransactionType.ADJUSTMENT);

      // Verify ledger transaction was persisted
      const tx = await TransactionModel.findById(res.body.data.id);
      expect(tx).toBeTruthy();
      expect(tx?.amount).toBe(25000);
      expect(tx?.type).toBe(TransactionType.ADJUSTMENT);

      // Verify audit log
      const audit = await AuditLogModel.findOne({
        resourceType: 'TRANSACTION',
        resourceId: res.body.data.id,
        action: 'FINANCIAL_ADJUSTMENT',
      });
      expect(audit).toBeTruthy();
      expect(audit?.after).toMatchObject({ amountPaise: 25000 });
      expect(audit?.details).toMatchObject({
        reason: 'Good performance incentive bonus',
      });
    });
  });

  // =============================================================
  // 6. Service Categories & Skills Taxonomy Management
  // =============================================================
  describe('6. Service Categories & Skills Administration', () => {
    let createdCatId: string;
    let createdSkillId: string;

    it('creates service category and writes audit record', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          name: 'Phase12 Carpentry Services',
          description: 'Woodworking and furniture repair',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('phase12-carpentry-services');
      createdCatId = res.body.data.id;

      const audit = await AuditLogModel.findOne({
        resourceType: 'SERVICE_CATEGORY',
        resourceId: createdCatId,
        action: 'CATEGORY_CREATED',
      });
      expect(audit).toBeTruthy();
      expect(audit?.after).toMatchObject({ slug: 'phase12-carpentry-services' });
    });

    it('updates service category and writes audit record with before and after states', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/categories/${createdCatId}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          name: 'Phase12 Master Carpentry',
          description: 'Custom furniture and restoration',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const audit = await AuditLogModel.findOne({
        resourceType: 'SERVICE_CATEGORY',
        resourceId: createdCatId,
        action: 'CATEGORY_UPDATED',
      });
      expect(audit).toBeTruthy();
      expect(audit?.before).toMatchObject({ name: 'Phase12 Carpentry Services' });
      expect(audit?.after).toMatchObject({ name: 'Phase12 Master Carpentry' });
    });

    it('creates skill under category and writes audit record', async () => {
      const res = await request(app)
        .post('/api/v1/admin/skills')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          categoryId: createdCatId,
          name: 'Phase12 Furniture Assembly',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      createdSkillId = res.body.data.id;

      const audit = await AuditLogModel.findOne({
        resourceType: 'SKILL',
        resourceId: createdSkillId,
        action: 'SKILL_CREATED',
      });
      expect(audit).toBeTruthy();
      expect(audit?.after).toMatchObject({
        name: 'Phase12 Furniture Assembly',
        categoryId: createdCatId,
      });
    });

    it('updates skill and writes audit record', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/skills/${createdSkillId}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          name: 'Phase12 Advanced Furniture Assembly',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const audit = await AuditLogModel.findOne({
        resourceType: 'SKILL',
        resourceId: createdSkillId,
        action: 'SKILL_UPDATED',
      });
      expect(audit).toBeTruthy();
      expect(audit?.before).toMatchObject({ name: 'Phase12 Furniture Assembly' });
      expect(audit?.after).toMatchObject({ name: 'Phase12 Advanced Furniture Assembly' });
    });
  });

  // =============================================================
  // 7. Sensitive Values Redaction
  // =============================================================
  describe('7. Sensitive Values Redaction', () => {
    it('redacts passwords, tokens, pins, and secrets deeply from objects', () => {
      const input = {
        username: 'worker1',
        password: 'superSecretPassword',
        refreshTokenHash: 'sha256$somehashvalue',
        nested: {
          secretKey: 'jwt_secret',
          pin: '1234',
          publicInfo: 'visible',
          items: [{ token: 'abc-123' }, { name: 'safe-item' }],
        },
      };

      const redacted = redactSensitiveData(input) as any;

      expect(redacted.username).toBe('worker1');
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.refreshTokenHash).toBe('[REDACTED]');
      expect(redacted.nested.secretKey).toBe('[REDACTED]');
      expect(redacted.nested.pin).toBe('[REDACTED]');
      expect(redacted.nested.publicInfo).toBe('visible');
      expect(redacted.nested.items[0].token).toBe('[REDACTED]');
      expect(redacted.nested.items[1].name).toBe('safe-item');
    });

    it('redacts sensitive credentials when admin inspects user via GET /admin/users/:id', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/users/${workerUser.id}`)
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.refreshTokenHash).toBeUndefined();
      expect(res.body.data.password).toBeUndefined();
    });
  });

  // =============================================================
  // 8. Audit Records Immutability
  // =============================================================
  describe('8. Audit Records Strict Immutability & Retention Rules', () => {
    it('blocks modification on existing audit log document at the schema level', async () => {
      const doc = await AuditLogModel.create({
        actorId: new Types.ObjectId(adminUser.id),
        actorRole: UserRole.ADMIN,
        action: 'TEST_IMMUTABILITY',
        resourceType: 'TEST',
        resourceId: 'test-123',
        before: { val: 1 },
        after: { val: 2 },
      });

      // Attempting to update existing doc via .save() must throw
      doc.action = 'TAMPERED_ACTION';
      await expect(doc.save()).rejects.toThrow(
        'Audit records are immutable and cannot be updated'
      );

      // Attempting update via updateOne must throw
      await expect(
        AuditLogModel.updateOne(
          { _id: doc._id },
          { $set: { action: 'TAMPERED_ACTION' } }
        )
      ).rejects.toThrow('Audit records are immutable and cannot be updated');
    });

    it('verifies that no DELETE endpoint exists on /api/v1/admin/audit-logs', async () => {
      const res = await request(app)
        .delete('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(res.status).toBe(404);
    });
  });

  // =============================================================
  // 9. Cursor Pagination and Filtering on Admin List Endpoints
  // =============================================================
  describe('9. Cursor Pagination and Filtering on Admin List Endpoints', () => {
    it('paginates audit logs with cursor, limit, and hasMore', async () => {
      const resPage1 = await request(app)
        .get('/api/v1/admin/audit-logs?limit=2')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(resPage1.status).toBe(200);
      expect(resPage1.body.success).toBe(true);
      expect(resPage1.body.data.items.length).toBeLessThanOrEqual(2);

      if (resPage1.body.data.hasMore) {
        expect(resPage1.body.data.nextCursor).toBeTruthy();

        const resPage2 = await request(app)
          .get(`/api/v1/admin/audit-logs?limit=2&cursor=${resPage1.body.data.nextCursor}`)
          .set('Authorization', `Bearer ${adminUser.token}`);

        expect(resPage2.status).toBe(200);
        expect(resPage2.body.success).toBe(true);
        // IDs must not overlap between pages
        const page1Ids = resPage1.body.data.items.map((i: any) => i.id);
        const page2Ids = resPage2.body.data.items.map((i: any) => i.id);
        for (const id of page2Ids) {
          expect(page1Ids).not.toContain(id);
        }
      }
    });

    it('filters users by role and status with cursor pagination', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?role=WORKER&status=ACTIVE')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      for (const u of res.body.data.items) {
        expect(u.role).toBe(UserRole.WORKER);
        expect(u.status).toBe(UserStatus.ACTIVE);
      }
    });

    it('filters workers by availabilityStatus', async () => {
      const res = await request(app)
        .get('/api/v1/admin/workers?availabilityStatus=AVAILABLE')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('lists jobs, reports, and disputes with pagination', async () => {
      const resJobs = await request(app)
        .get('/api/v1/admin/jobs?limit=10')
        .set('Authorization', `Bearer ${adminUser.token}`);
      expect(resJobs.status).toBe(200);
      expect(Array.isArray(resJobs.body.data.items)).toBe(true);

      const resReports = await request(app)
        .get('/api/v1/admin/reports?limit=10')
        .set('Authorization', `Bearer ${adminUser.token}`);
      expect(resReports.status).toBe(200);
      expect(Array.isArray(resReports.body.data.items)).toBe(true);

      const resDisputes = await request(app)
        .get('/api/v1/admin/disputes?limit=10')
        .set('Authorization', `Bearer ${adminUser.token}`);
      expect(resDisputes.status).toBe(200);
      expect(Array.isArray(resDisputes.body.data.items)).toBe(true);
    });
  });
});
