import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../src/app.js';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { SessionModel } from '../src/modules/sessions/session.model.js';
import { WorkerProfileModel } from '../src/modules/worker-profiles/worker-profile.model.js';
import { JobModel } from '../src/modules/jobs/job.model.js';
import { JobEventModel } from '../src/modules/job-events/job-event.model.js';
import { ReviewModel } from '../src/modules/reviews/review.model.js';
import { VerificationRequestModel } from '../src/modules/verification/verification-request.model.js';
import { ReportModel } from '../src/modules/reports/report.model.js';
import { DisputeModel } from '../src/modules/disputes/dispute.model.js';
import { AuditLogModel } from '../src/modules/audit-logs/audit-log.model.js';
import { TransactionModel } from '../src/modules/transactions/transaction.model.js';
import { ServiceCategoryModel } from '../src/modules/service-categories/service-category.model.js';
import { SkillModel } from '../src/modules/skills/skill.model.js';
import { userRepository } from '../src/modules/users/user.repository.js';
import { sessionRepository } from '../src/modules/sessions/session.repository.js';
import { serviceCategoryRepository } from '../src/modules/service-categories/service-category.repository.js';
import { skillRepository } from '../src/modules/skills/skill.repository.js';
import { jobService } from '../src/modules/jobs/job.service.js';
import {
  UserRole,
  JobStatus,
  WorkerVerificationStatus,
  VerificationRequestStatus,
  ReportTargetType,
  ReportReason,
  ReportStatus,
  DisputeReason,
  DisputeStatus,
} from '@kaamsetu/types';
import { signAccessToken } from '../src/modules/auth/token.util.js';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

const PHONE_PREFIX = '+91900000';

describe('Trust, Reviews, Verification & Safety (Phase 9)', () => {
  let customerUser: { id: string; token: string };
  let workerUser1: { id: string; token: string };
  let workerUser2: { id: string; token: string };
  let supportUser: { id: string; token: string };
  let adminUser: { id: string; token: string };
  let categoryId: string;
  let skillId: string;
  let completedJobId: string;
  let openJobId: string;
  let activeDisputeJobId: string;

  beforeAll(async () => {
    await connectMongoDB({ uri: TEST_MONGODB_URI });
    await UserModel.syncIndexes();
    await SessionModel.syncIndexes();
    await WorkerProfileModel.syncIndexes();
    await JobModel.syncIndexes();
    await JobEventModel.syncIndexes();
    await ReviewModel.syncIndexes();
    await VerificationRequestModel.syncIndexes();
    await ReportModel.syncIndexes();
    await DisputeModel.syncIndexes();
    await AuditLogModel.syncIndexes();
    await ServiceCategoryModel.syncIndexes();
    await SkillModel.syncIndexes();

    // Isolated test cleanup
    const staleUsers = await UserModel.find({ phoneNumber: /^\+91900000/ }).select('_id').lean();
    const staleIds = staleUsers.map((u) => u._id);
    if (staleIds.length > 0) {
      await ReviewModel.deleteMany({ $or: [{ reviewerId: { $in: staleIds } }, { revieweeId: { $in: staleIds } }] });
      await VerificationRequestModel.deleteMany({ workerId: { $in: staleIds } });
      await ReportModel.deleteMany({ $or: [{ reporterId: { $in: staleIds } }, { targetId: { $in: staleIds.map(String) } }] });
      await DisputeModel.deleteMany({ $or: [{ initiatorId: { $in: staleIds } }, { respondentId: { $in: staleIds } }] });
      await AuditLogModel.deleteMany({ actorId: { $in: staleIds.map(String) } });
      await UserModel.deleteMany({ _id: { $in: staleIds } });
    }
    await ServiceCategoryModel.deleteMany({ slug: /^phase9-/ });
    await SkillModel.deleteMany({ slug: /^phase9-/ });

    // 1. Create Category and Skill
    const cat = await serviceCategoryRepository.create({
      name: 'Phase9 Home Cleaning',
      slug: 'phase9-home-cleaning',
      active: true,
    });
    categoryId = cat.id;

    const sk = await skillRepository.create({
      name: 'Deep Cleaning',
      slug: 'phase9-deep-cleaning',
      categoryId,
      active: true,
    });
    skillId = sk.id;

    // 2. Helper to create user, session, and token
    async function createUserAndToken(phoneSuffix: string, role: UserRole) {
      const u = await userRepository.create({
        phoneNumber: `${PHONE_PREFIX}${phoneSuffix}`,
        role,
      });
      const sess = await sessionRepository.create({
        userId: u.id,
        refreshTokenHash: `p9-hash-${phoneSuffix}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      const token = signAccessToken({
        userId: u.id,
        role: u.role,
        sessionId: sess.id,
        familyId: sess.familyId,
      });
      return { id: u.id, token, sessionId: sess.id };
    }

    customerUser = await createUserAndToken('0001', UserRole.CUSTOMER);
    workerUser1 = await createUserAndToken('0002', UserRole.WORKER);
    workerUser2 = await createUserAndToken('0003', UserRole.WORKER);
    supportUser = await createUserAndToken('0004', UserRole.SUPPORT);
    adminUser = await createUserAndToken('0005', UserRole.ADMIN);

    // Create worker profile for worker 1
    await WorkerProfileModel.create({
      userId: workerUser1.id,
      displayName: 'Kiran Cleaner',
      skills: [{ skillId, level: 'EXPERT', verified: true }],
      languages: ['hi', 'en'],
      serviceLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      serviceRadiusKm: 20,
      availabilityStatus: 'AVAILABLE',
      rating: { average: 0, count: 0 },
      pricing: { hourlyRate: 35000 },
      verificationStatus: WorkerVerificationStatus.UNVERIFIED,
    });

    // 3. Create a completed job (for review testing)
    const job1 = await jobService.createJob(customerUser.id, UserRole.CUSTOMER, {
      categoryId,
      requiredSkills: [skillId],
      title: 'Full House Deep Cleaning',
      description: 'Living room, 2 bedrooms, kitchen',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      address: { line: 'Apartment 101', city: 'Bengaluru', state: 'Karnataka', pincode: '560100' },
      preferredTime: new Date(Date.now() + 3600000).toISOString(),
      estimatedPrice: 1200,
    });
    await jobService.publishJob(job1.id, { id: customerUser.id, role: UserRole.CUSTOMER });
    await JobModel.updateOne(
      { _id: job1.id },
      { $set: { assignedWorkerId: workerUser1.id, status: JobStatus.ACCEPTED } }
    );
    await jobService.startTravel(job1.id, workerUser1.id);
    await jobService.arrive(job1.id, workerUser1.id);
    await jobService.startJob(job1.id, workerUser1.id);
    const completed = await jobService.completeJob(job1.id, workerUser1.id);
    completedJobId = completed.id;

    // 4. Create an OPEN job (not completed, for invalid review testing)
    const job2 = await jobService.createJob(customerUser.id, UserRole.CUSTOMER, {
      categoryId,
      requiredSkills: [skillId],
      title: 'Balcony Washing',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      address: { line: 'Apartment 101', city: 'Bengaluru', state: 'Karnataka', pincode: '560100' },
      preferredTime: new Date(Date.now() + 7200000).toISOString(),
    });
    await jobService.publishJob(job2.id, { id: customerUser.id, role: UserRole.CUSTOMER });
    openJobId = job2.id;

    // 5. Create an active IN_PROGRESS job for dispute testing
    const job3 = await jobService.createJob(customerUser.id, UserRole.CUSTOMER, {
      categoryId,
      requiredSkills: [skillId],
      title: 'Sofa Shampooing',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      address: { line: 'Apartment 101', city: 'Bengaluru', state: 'Karnataka', pincode: '560100' },
      preferredTime: new Date(Date.now() + 10800000).toISOString(),
      estimatedPrice: 800,
    });
    await jobService.publishJob(job3.id, { id: customerUser.id, role: UserRole.CUSTOMER });
    await JobModel.updateOne(
      { _id: job3.id },
      { $set: { assignedWorkerId: workerUser1.id, status: JobStatus.ACCEPTED } }
    );
    await jobService.startTravel(job3.id, workerUser1.id);
    await jobService.arrive(job3.id, workerUser1.id);
    await jobService.startJob(job3.id, workerUser1.id);
    activeDisputeJobId = job3.id;
  });

  afterAll(async () => {
    const userIds = [customerUser?.id, workerUser1?.id, workerUser2?.id, supportUser?.id, adminUser?.id].filter(Boolean);
    if (userIds.length > 0) {
      await ReviewModel.deleteMany({ $or: [{ reviewerId: { $in: userIds } }, { revieweeId: { $in: userIds } }] });
      await VerificationRequestModel.deleteMany({ workerId: { $in: userIds } });
      await ReportModel.deleteMany({ $or: [{ reporterId: { $in: userIds } }, { targetId: { $in: userIds } }] });
      await DisputeModel.deleteMany({ $or: [{ initiatorId: { $in: userIds } }, { respondentId: { $in: userIds } }] });
      await AuditLogModel.deleteMany({ actorId: { $in: userIds } });
      await UserModel.deleteMany({ _id: { $in: userIds } });
    }
    await ServiceCategoryModel.deleteMany({ slug: /^phase9-/ });
    await SkillModel.deleteMany({ slug: /^phase9-/ });
    await TransactionModel.collection.deleteMany({
      referenceId: { $regex: /^dispute:/ },
    });
    await disconnectMongoDB();
  });

  describe('1. Reviews & Rating Recalculation', () => {
    it('blocks reviews on jobs that are not completed (ConflictError 409)', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({
          jobId: openJobId,
          rating: 5,
          comment: 'Job was not done yet',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('blocks users who are not participants in the job from submitting reviews (ForbiddenError 403)', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${workerUser2.token}`) // workerUser2 was not involved in completedJobId
        .send({
          jobId: completedJobId,
          rating: 4,
          comment: 'Unauthorized review attempt',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid rating values outside 1-5', async () => {
      const resZero = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({
          jobId: completedJobId,
          rating: 0,
        });
      expect([400, 422]).toContain(resZero.status);

      const resSix = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({
          jobId: completedJobId,
          rating: 6,
        });
      expect([400, 422]).toContain(resSix.status);
    });

    it('allows customer to review completed job and recalculates worker aggregate rating safely', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({
          jobId: completedJobId,
          rating: 5,
          quality: 5,
          punctuality: 4,
          communication: 5,
          comment: 'Exceptional deep cleaning service! Very polite and thorough.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.reviewerId).toBe(customerUser.id);
      expect(res.body.data.revieweeId).toBe(workerUser1.id);

      // Verify worker aggregate rating was updated concurrency-safely
      const updatedProfile = await WorkerProfileModel.findOne({ userId: workerUser1.id });
      expect(updatedProfile?.rating.average).toBe(5);
      expect(updatedProfile?.rating.count).toBe(1);
    });

    it('prevents duplicate reviews for the same job and reviewer (ConflictError 409)', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({
          jobId: completedJobId,
          rating: 4,
          comment: 'Attempting duplicate review',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toContain('already submitted a review');
    });

    it('lists reviews for a worker with cursor pagination', async () => {
      const res = await request(app).get(`/api/v1/reviews/workers/${workerUser1.id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].rating).toBe(5);
    });

    it('lists reviews for a job', async () => {
      const res = await request(app).get(`/api/v1/reviews/jobs/${completedJobId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].jobId).toBe(completedJobId);
    });
  });

  describe('2. Worker Verification Requests & Self-Approval Prevention', () => {
    let verificationRequestId: string;

    it('allows worker to submit KYC / verification documents', async () => {
      const res = await request(app)
        .post('/api/v1/verification/requests')
        .set('Authorization', `Bearer ${workerUser1.token}`)
        .send({
          type: 'GOVERNMENT_ID',
          documents: [
            {
              url: 'https://cdn.kaamsetu.com/kyc/aadhar_front.jpg',
              mimeType: 'image/jpeg',
              documentType: 'AADHAAR_CARD',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(VerificationRequestStatus.PENDING);
      expect(res.body.data.workerId).toBe(workerUser1.id);

      verificationRequestId = res.body.data.id;

      // Verify worker profile status set to PENDING
      const profile = await WorkerProfileModel.findOne({ userId: workerUser1.id });
      expect(profile?.verificationStatus).toBe(WorkerVerificationStatus.PENDING);
    });

    it('CRITICAL RULE: worker CANNOT approve or review their own verification request', async () => {
      const res = await request(app)
        .patch(`/api/v1/verification/requests/${verificationRequestId}/review`)
        .set('Authorization', `Bearer ${workerUser1.token}`) // workerUser1 tries to review their own
        .send({
          status: 'APPROVED',
          reason: 'Self approval attempt',
        });

      expect(res.status).toBe(403);
    });

    it('customer role cannot review verification requests (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/verification/requests/${verificationRequestId}/review`)
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({
          status: 'APPROVED',
        });

      expect(res.status).toBe(403);
    });

    it('support agent can review and request more info', async () => {
      const res = await request(app)
        .patch(`/api/v1/verification/requests/${verificationRequestId}/review`)
        .set('Authorization', `Bearer ${supportUser.token}`)
        .send({
          status: 'REQUIRES_MORE_INFO',
          reason: 'Please provide back side of the Aadhaar card.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(VerificationRequestStatus.REQUIRES_MORE_INFO);
      expect(res.body.data.reason).toBe('Please provide back side of the Aadhaar card.');

      // Audit log was created
      const audit = await AuditLogModel.findOne({
        targetId: verificationRequestId,
        action: 'VERIFICATION_REQUIRES_MORE_INFO',
      });
      expect(audit).toBeDefined();
      expect(audit?.actorId.toString()).toBe(supportUser.id);
    });

    it('administrator can approve verification and update worker profile to VERIFIED', async () => {
      const res = await request(app)
        .patch(`/api/v1/verification/requests/${verificationRequestId}/review`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          status: 'APPROVED',
          reason: 'All credentials and background checks verified successfully.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(VerificationRequestStatus.APPROVED);

      // Verify worker profile updated to VERIFIED
      const profile = await WorkerProfileModel.findOne({ userId: workerUser1.id });
      expect(profile?.verificationStatus).toBe(WorkerVerificationStatus.VERIFIED);

      // Audit log was created with ADMIN role
      const audit = await AuditLogModel.findOne({
        targetId: verificationRequestId,
        action: 'VERIFICATION_APPROVED',
      });
      expect(audit).toBeDefined();
      expect(audit?.actorRole).toBe(UserRole.ADMIN);
    });

    it('worker can view their own verification requests', async () => {
      const res = await request(app)
        .get('/api/v1/verification/requests/me')
        .set('Authorization', `Bearer ${workerUser1.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].id).toBe(verificationRequestId);
    });
  });

  describe('3. Trust & Safety Reports', () => {
    let reportId: string;

    it('allows any authenticated user to submit a report against a user, job, message, or review', async () => {
      const res = await request(app)
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({
          targetType: ReportTargetType.USER,
          targetId: workerUser2.id,
          reason: ReportReason.INAPPROPRIATE_BEHAVIOR,
          description: 'User used abusive language during customer care chat.',
          evidence: ['https://cdn.kaamsetu.com/reports/chat_screenshot.png'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reporterId).toBe(customerUser.id);
      expect(res.body.data.targetType).toBe(ReportTargetType.USER);
      expect(res.body.data.status).toBe(ReportStatus.PENDING);

      reportId = res.body.data.id;
    });

    it('allows reporter to view reports they submitted', async () => {
      const res = await request(app)
        .get('/api/v1/reports/me')
        .set('Authorization', `Bearer ${customerUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].id).toBe(reportId);
    });

    it('blocks other non-admin users from viewing another user’s report', async () => {
      const res = await request(app)
        .get(`/api/v1/reports/${reportId}`)
        .set('Authorization', `Bearer ${workerUser1.token}`);

      expect(res.status).toBe(403);
    });

    it('allows support staff to investigate and resolve a report with resolution notes', async () => {
      const res = await request(app)
        .patch(`/api/v1/reports/${reportId}`)
        .set('Authorization', `Bearer ${supportUser.token}`)
        .send({
          status: 'RESOLVED',
          resolutionNotes: 'User was warned and temporarily restricted from chat.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(ReportStatus.RESOLVED);
      expect(res.body.data.resolutionNotes).toBe('User was warned and temporarily restricted from chat.');

      // Audit log created
      const audit = await AuditLogModel.findOne({
        targetId: reportId,
        action: 'REPORT_RESOLVED',
      });
      expect(audit).toBeDefined();
    });

    it('admin can list all reports with filtering', async () => {
      const res = await request(app)
        .get('/api/v1/reports?status=RESOLVED')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });
  });

  describe('4. Disputes & Resolution Workflow', () => {
    let disputeId: string;

    it('allows job participant to raise a dispute and transitions active job to DISPUTED state', async () => {
      const res = await request(app)
        .post('/api/v1/disputes')
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({
          jobId: activeDisputeJobId,
          reason: DisputeReason.POOR_QUALITY,
          description: 'Cleaner left sofa half cleaned with liquid stains.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.jobId).toBe(activeDisputeJobId);
      expect(res.body.data.status).toBe(DisputeStatus.OPEN);

      disputeId = res.body.data.id;

      // Verify job state machine transitioned to DISPUTED
      const updatedJob = await JobModel.findById(activeDisputeJobId);
      expect(updatedJob?.status).toBe(JobStatus.DISPUTED);

      // Verify JobEvent DISPUTE_RAISED was recorded
      const events = await JobEventModel.find({ jobId: activeDisputeJobId, eventType: 'DISPUTE_RAISED' });
      expect(events.length).toBe(1);
      expect(events[0]?.previousState).toBe(JobStatus.IN_PROGRESS);
      expect(events[0]?.newState).toBe(JobStatus.DISPUTED);
    });

    it('blocks non-participants from creating disputes on a job', async () => {
      const res = await request(app)
        .post('/api/v1/disputes')
        .set('Authorization', `Bearer ${workerUser2.token}`)
        .send({
          jobId: activeDisputeJobId,
          reason: DisputeReason.OTHER,
          description: 'Unauthorized dispute',
        });

      expect(res.status).toBe(403);
    });

    it('participants can view their disputes', async () => {
      const res = await request(app)
        .get('/api/v1/disputes/me')
        .set('Authorization', `Bearer ${customerUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].id).toBe(disputeId);
    });

    it('allows admin to resolve dispute with refund and transitions job to COMPLETED', async () => {
      const res = await request(app)
        .patch(`/api/v1/disputes/${disputeId}/resolve`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          status: 'RESOLVED',
          summary: 'Partial refund granted for incomplete sofa cleaning.',
          refundPaise: 40000, // ₹400 = 40000 paise
          actionTaken: 'Refund processed to customer wallet.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(DisputeStatus.RESOLVED);
      expect(res.body.data.resolution.refundPaise).toBe(40000);

      // Verify REFUND transaction was recorded in ledger
      const refundTx = await TransactionModel.findOne({ referenceId: `dispute:${disputeId}:refund` });
      expect(refundTx).toBeDefined();
      expect(refundTx?.amount).toBe(40000);

      // Verify job was transitioned from DISPUTED to COMPLETED
      const resolvedJob = await JobModel.findById(activeDisputeJobId);
      expect(resolvedJob?.status).toBe(JobStatus.COMPLETED);

      // Verify audit log created
      const audit = await AuditLogModel.findOne({
        targetId: disputeId,
        action: 'DISPUTE_RESOLVED',
      });
      expect(audit).toBeDefined();
    });

    it('regular users cannot resolve disputes (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/disputes/${disputeId}/resolve`)
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({
          status: 'RESOLVED',
          summary: 'Illegal resolve attempt',
        });

      expect(res.status).toBe(403);
    });
  });
});
