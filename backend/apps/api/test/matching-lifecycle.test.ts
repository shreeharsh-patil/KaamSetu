import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { userRepository } from '../src/modules/users/user.repository.js';
import { serviceCategoryRepository } from '../src/modules/service-categories/service-category.repository.js';
import { skillRepository } from '../src/modules/skills/skill.repository.js';
import { sessionRepository } from '../src/modules/sessions/session.repository.js';
import { workerProfileRepository } from '../src/modules/worker-profiles/worker-profile.repository.js';
import { matchingService } from '../src/modules/matching/matching.service.js';
import { jobOfferService } from '../src/modules/job-offers/job-offer.service.js';
import { repairStuckMatchingJobs } from '../src/scripts/repair-stuck-matching.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { SessionModel } from '../src/modules/sessions/session.model.js';
import { WorkerProfileModel } from '../src/modules/worker-profiles/worker-profile.model.js';
import { JobModel } from '../src/modules/jobs/job.model.js';
import { JobOfferModel } from '../src/modules/job-offers/job-offer.model.js';
import { JobEventModel } from '../src/modules/job-events/job-event.model.js';
import { ServiceCategoryModel } from '../src/modules/service-categories/service-category.model.js';
import { SkillModel } from '../src/modules/skills/skill.model.js';
import {
  UserRole,
  WorkerAvailability,
  WorkerVerificationStatus,
  SkillLevel,
  JobStatus,
  JobUrgency,
  JobOfferStatus,
} from '@kaamsetu/types';
import { signAccessToken } from '../src/modules/auth/token.util.js';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

const PHONE_PREFIX = '+9196666';

describe('End-to-End Matching Lifecycle & Anti-Stall Guarantees', () => {
  let customerA: { id: string; token: string };
  let customerB: { id: string; token: string };
  let worker1: { id: string; token: string };
  let worker2: { id: string; token: string };
  let categoryWithWorkersId: string;
  let skillElectricalId: string;
  let categoryEmptyId: string;
  let skillEmptyId: string;

  beforeAll(async () => {
    await connectMongoDB({ uri: TEST_MONGODB_URI });
    await UserModel.syncIndexes();
    await SessionModel.syncIndexes();
    await WorkerProfileModel.syncIndexes();
    await JobModel.syncIndexes();
    await JobOfferModel.syncIndexes();
    await JobEventModel.syncIndexes();
    await ServiceCategoryModel.syncIndexes();
    await SkillModel.syncIndexes();

    // Suite cleanup
    await UserModel.deleteMany({ phoneNumber: /^\+9196666/ });
    await ServiceCategoryModel.deleteMany({ slug: /^mlife-/ });
    await SkillModel.deleteMany({ slug: /^mlife-/ });

    // 1. Categories and Skills
    const catWithWorkers = await serviceCategoryRepository.create({
      name: 'Lifecycle Electrical',
      slug: 'mlife-electrical',
      active: true,
    });
    categoryWithWorkersId = catWithWorkers.id;

    const sk1 = await skillRepository.create({
      name: 'Wiring Fix',
      slug: 'mlife-wiring-fix',
      categoryId: categoryWithWorkersId,
      active: true,
    });
    skillElectricalId = sk1.id;

    const catEmpty = await serviceCategoryRepository.create({
      name: 'Lifecycle Solar Roofing',
      slug: 'mlife-solar-roofing',
      active: true,
    });
    categoryEmptyId = catEmpty.id;

    const skEmpty = await skillRepository.create({
      name: 'Solar Panel Maintenance',
      slug: 'mlife-solar-panel',
      categoryId: categoryEmptyId,
      active: true,
    });
    skillEmptyId = skEmpty.id;

    // 2. Users and Tokens
    async function createUser(phoneSuffix: string, role: UserRole) {
      const u = await userRepository.create({
        phoneNumber: `${PHONE_PREFIX}${phoneSuffix}`,
        role,
      });
      const sess = await sessionRepository.create({
        userId: u.id,
        refreshTokenHash: `mlife-hash-${phoneSuffix}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      const token = signAccessToken({
        userId: u.id,
        role: u.role,
        sessionId: sess.id,
        familyId: sess.familyId,
      });
      return { id: u.id, token };
    }

    customerA = await createUser('00001', UserRole.CUSTOMER);
    customerB = await createUser('00002', UserRole.CUSTOMER);
    worker1 = await createUser('00003', UserRole.WORKER);
    worker2 = await createUser('00004', UserRole.WORKER);

    // 3. Worker Profiles (active and nearby)
    await workerProfileRepository.create({
      userId: worker1.id,
      displayName: 'Pro Worker One',
      serviceLocation: { type: 'Point', coordinates: [77.6387, 12.9784] }, // Indiranagar
      serviceRadiusKm: 20,
      availabilityStatus: WorkerAvailability.AVAILABLE,
      verificationStatus: WorkerVerificationStatus.VERIFIED,
      skills: [
        {
          skillId: skillElectricalId,
          skillName: 'Wiring Fix',
          experienceYears: 5,
          level: SkillLevel.EXPERT,
          verified: true,
        },
      ],
      pricing: { hourlyRate: 400 },
    });

    await workerProfileRepository.create({
      userId: worker2.id,
      displayName: 'Pro Worker Two',
      serviceLocation: { type: 'Point', coordinates: [77.6245, 12.9352] }, // Koramangala
      serviceRadiusKm: 20,
      availabilityStatus: WorkerAvailability.AVAILABLE,
      verificationStatus: WorkerVerificationStatus.VERIFIED,
      skills: [
        {
          skillId: skillElectricalId,
          skillName: 'Wiring Fix',
          experienceYears: 3,
          level: SkillLevel.INTERMEDIATE,
          verified: true,
        },
      ],
      pricing: { hourlyRate: 350 },
    });
  });

  afterAll(async () => {
    await UserModel.deleteMany({ phoneNumber: /^\+9196666/ });
    await ServiceCategoryModel.deleteMany({ slug: /^mlife-/ });
    await SkillModel.deleteMany({ slug: /^mlife-/ });
    await disconnectMongoDB();
  });

  // Helper to create test job in DB
  async function createTestJob(opts: {
    categoryId: string;
    requiredSkills: string[];
    customerId?: string;
  }) {
    return JobModel.create({
      customerId: opts.customerId ?? customerA.id,
      categoryId: opts.categoryId,
      requiredSkills: opts.requiredSkills,
      title: 'Lifecycle Test Job',
      description: 'Testing matching lifecycle',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] }, // MG Road
      address: { line: '123 MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
      preferredTime: new Date(Date.now() + 3600 * 1000),
      urgency: JobUrgency.TODAY,
      status: JobStatus.OPEN,
    });
  }

  // =========================================================================
  // SCENARIO 1: Zero Candidates -> Immediate EXPIRED (NO_ELIGIBLE_WORKERS)
  // =========================================================================
  it('Scenario 1: Immediately transitions OPEN -> EXPIRED when no eligible workers exist', async () => {
    const jobDoc = await createTestJob({
      categoryId: categoryEmptyId,
      requiredSkills: [skillEmptyId],
    });
    const jobId = jobDoc._id.toString();

    // Start matching
    const result = await matchingService.startMatching(jobId);

    expect(result.outcome).toBe('NO_ELIGIBLE_WORKERS');
    expect(result.offers).toHaveLength(0);
    expect(result.candidatesCount).toBe(0);

    // Verify DB state
    const updatedJob = await JobModel.findById(jobId);
    expect(updatedJob?.status).toBe(JobStatus.EXPIRED);

    // Verify audit events
    const events = await JobEventModel.find({ jobId }).sort({ createdAt: 1 });
    const eventTypes = events.map((e) => e.eventType);
    expect(eventTypes).toContain('MATCHING_STARTED');
    expect(eventTypes).toContain('STATUS_CHANGED');

    const expiredEvent = events.find((e) => e.newState === JobStatus.EXPIRED);
    expect(expiredEvent?.reason).toBe('NO_ELIGIBLE_WORKERS');
  });

  // =========================================================================
  // SCENARIO 2: Multi-Wave Rejection -> Advances Waves -> Exhausted EXPIRED
  // =========================================================================
  it('Scenario 2: Multi-wave rejection advances to next candidate and expires cleanly when exhausted', async () => {
    const jobDoc = await createTestJob({
      categoryId: categoryWithWorkersId,
      requiredSkills: [skillElectricalId],
    });
    const jobId = jobDoc._id.toString();

    // Dispatch Wave 1 with waveSize = 1
    const wave1 = await matchingService.startMatching(jobId, { waveSize: 1 });
    expect(wave1.outcome).toBe('OFFERS_DISPATCHED');
    expect(wave1.offers).toHaveLength(1);
    const offer1 = wave1.offers[0]!;

    const jobAfterWave1 = await JobModel.findById(jobId);
    expect(jobAfterWave1?.status).toBe(JobStatus.OFFERED);

    // Worker 1 rejects offer
    await jobOfferService.rejectOffer(offer1.id, offer1.workerId, 'Busy with other project');

    // Rejecting the only pending offer should have triggered wave 2
    const jobAfterWave2 = await JobModel.findById(jobId);
    expect(jobAfterWave2?.status).toBe(JobStatus.OFFERED);

    const allOffers = await JobOfferModel.find({ jobId }).sort({ createdAt: 1 });
    expect(allOffers).toHaveLength(2);
    const offer2 = allOffers[1]!;
    expect(offer2.status).toBe(JobOfferStatus.PENDING);
    expect(offer2.workerId).not.toBe(offer1.workerId);

    // Worker 2 also rejects offer
    await jobOfferService.rejectOffer(offer2._id.toString(), offer2.workerId.toString(), 'Too far');

    // All candidates are now exhausted -> must cleanly transition to EXPIRED
    const jobFinal = await JobModel.findById(jobId);
    expect(jobFinal?.status).toBe(JobStatus.EXPIRED);

    const events = await JobEventModel.find({ jobId }).sort({ createdAt: 1 });
    const expiredEvent = [...events].reverse().find((e) => e.newState === JobStatus.EXPIRED);
    expect(expiredEvent?.reason).toBe('ALL_ELIGIBLE_WORKERS_EXHAUSTED');
  });

  // =========================================================================
  // SCENARIO 3: Offer Expiration Window -> Expires Offer and Transitions
  // =========================================================================
  it('Scenario 3: Single candidate timeout expires the offer and marks job EXPIRED', async () => {
    const jobDoc = await createTestJob({
      categoryId: categoryWithWorkersId,
      requiredSkills: [skillElectricalId],
    });
    const jobId = jobDoc._id.toString();

    // Wave size 2 dispatches to both worker1 and worker2
    const res = await matchingService.startMatching(jobId, { waveSize: 2 });
    expect(res.offers).toHaveLength(2);

    // Expire offer 1
    await matchingService.expireOffer(jobId, res.offers[0]!.id);
    const o1 = await JobOfferModel.findById(res.offers[0]!.id);
    expect(o1?.status).toBe(JobOfferStatus.EXPIRED);

    // Job should still be OFFERED because offer 2 is still pending
    let currentJob = await JobModel.findById(jobId);
    expect(currentJob?.status).toBe(JobStatus.OFFERED);

    // Expire offer 2
    await matchingService.expireOffer(jobId, res.offers[1]!.id);
    const o2 = await JobOfferModel.findById(res.offers[1]!.id);
    expect(o2?.status).toBe(JobOfferStatus.EXPIRED);

    // Both offers expired, no remaining candidates -> transitions to EXPIRED
    currentJob = await JobModel.findById(jobId);
    expect(currentJob?.status).toBe(JobStatus.EXPIRED);
  });

  // =========================================================================
  // SCENARIO 4: Acceptance Before Expiration -> Job ACCEPTED, Immune to Expiry
  // =========================================================================
  it('Scenario 4: Worker acceptance transitions job to ACCEPTED and subsequent timeouts are harmless', async () => {
    const jobDoc = await createTestJob({
      categoryId: categoryWithWorkersId,
      requiredSkills: [skillElectricalId],
    });
    const jobId = jobDoc._id.toString();

    const res = await matchingService.startMatching(jobId, { waveSize: 2 });
    expect(res.offers).toHaveLength(2);

    const winningOffer = res.offers[0]!;
    const acceptResult = await jobOfferService.acceptOffer(winningOffer.id, winningOffer.workerId);

    expect(acceptResult.job.status).toBe(JobStatus.ACCEPTED);
    expect(acceptResult.job.assignedWorkerId).toBe(winningOffer.workerId);

    // The other pending offer must have been withdrawn
    const otherOffer = await JobOfferModel.findById(res.offers[1]!.id);
    expect(otherOffer?.status).toBe(JobOfferStatus.WITHDRAWN);

    // If timeout or background expire matching fires later, it must NEVER overwrite ACCEPTED
    await matchingService.expireMatchingJob(jobId, 'MATCHING_TIMEOUT');
    await matchingService.expireOffer(jobId, winningOffer.id);

    const jobCheck = await JobModel.findById(jobId);
    expect(jobCheck?.status).toBe(JobStatus.ACCEPTED);
    expect(jobCheck?.assignedWorkerId?.toString()).toBe(winningOffer.workerId.toString());
  });

  // =========================================================================
  // SCENARIO 5: Atomic Concurrent Accept & Expire
  // =========================================================================
  it('Scenario 5: Concurrent accept and expire calls resolve atomically without race corruption', async () => {
    const jobDoc = await createTestJob({
      categoryId: categoryWithWorkersId,
      requiredSkills: [skillElectricalId],
    });
    const jobId = jobDoc._id.toString();

    const res = await matchingService.startMatching(jobId, { waveSize: 1 });
    const offer = res.offers[0]!;

    // Race acceptOffer vs expireOffer simultaneously
    const [acceptRes, expireRes] = await Promise.allSettled([
      jobOfferService.acceptOffer(offer.id, offer.workerId),
      matchingService.expireOffer(jobId, offer.id),
    ]);

    const finalJob = await JobModel.findById(jobId);
    const finalOffer = await JobOfferModel.findById(offer.id);

    // Exactly one winner: either ACCEPTED or EXPIRED, never in an intermediate or duplicate state
    if (acceptRes.status === 'fulfilled') {
      expect(finalJob?.status).toBe(JobStatus.ACCEPTED);
      expect(finalOffer?.status).toBe(JobOfferStatus.ACCEPTED);
    } else {
      expect(finalOffer?.status).toBe(JobOfferStatus.EXPIRED);
      expect([JobStatus.OFFERED, JobStatus.EXPIRED]).toContain(finalJob?.status);
    }
  });

  // =========================================================================
  // SCENARIO 6: Passive Expiration on Read
  // =========================================================================
  it('Scenario 6: Passive expiration on read cleanly updates expired matching status', async () => {
    const pastDate = new Date(Date.now() - 10 * 1000);
    const jobDoc = await JobModel.create({
      customerId: customerA.id,
      categoryId: categoryWithWorkersId,
      requiredSkills: [skillElectricalId],
      title: 'Stale Matching Job',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      address: { line: 'MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
      preferredTime: new Date(Date.now() + 3600 * 1000),
      urgency: JobUrgency.TODAY,
      status: JobStatus.MATCHING,
      matchingExpiresAt: pastDate,
    });
    const jobId = jobDoc._id.toString();

    // Calling getMatchingStatus triggers passive expiration on read
    const statusDto = await matchingService.getMatchingStatus(jobId);

    expect(statusDto.status).toBe(JobStatus.EXPIRED);
    expect(statusDto.outcomeReason).toBe('MATCHING_TIMEOUT');
    expect(statusDto.matching.remainingSeconds ?? 0).toBe(0);

    // Verify DB was updated
    const updated = await JobModel.findById(jobId);
    expect(updated?.status).toBe(JobStatus.EXPIRED);
  });

  // =========================================================================
  // SCENARIO 7: HTTP Endpoint GET /api/v1/jobs/:id/matching-status
  // =========================================================================
  it('Scenario 7: GET /api/v1/jobs/:id/matching-status returns full diagnostic DTO', async () => {
    const jobDoc = await createTestJob({
      categoryId: categoryWithWorkersId,
      requiredSkills: [skillElectricalId],
    });
    const jobId = jobDoc._id.toString();

    // Dispatch offers
    await matchingService.startMatching(jobId, { waveSize: 2 });

    // 1. Owner customer can query status
    const res = await request(app)
      .get(`/api/v1/jobs/${jobId}/matching-status`)
      .set('Authorization', `Bearer ${customerA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.jobId).toBe(jobId);
    expect(res.body.data.status).toBe(JobStatus.OFFERED);
    expect(res.body.data.matching).toBeDefined();
    expect(res.body.data.matching.candidatesFound).toBe(2);
    expect(res.body.data.matching.offersSent).toBe(2);
    expect(res.body.data.matching.pendingOffers).toBe(2);
    expect(res.body.data.matching.currentWave).toBe(1);

    // 2. Another customer cannot query (403 Forbidden)
    const forbiddenRes = await request(app)
      .get(`/api/v1/jobs/${jobId}/matching-status`)
      .set('Authorization', `Bearer ${customerB.token}`);

    expect(forbiddenRes.status).toBe(403);
  });

  // =========================================================================
  // SCENARIO 8: Maintenance Repair Script (pnpm repair:stuck-matching)
  // =========================================================================
  it('Scenario 8: repairStuckMatchingJobs detects and cleanly expires legacy stuck jobs', async () => {
    const twoMinutesAgo = new Date(Date.now() - 120 * 1000);

    // Create a legacy stuck job in OFFERED state with matchingExpiresAt in past
    const stuckJob1 = await JobModel.create({
      customerId: customerA.id,
      categoryId: categoryWithWorkersId,
      requiredSkills: [skillElectricalId],
      title: 'Legacy Stuck Job 1',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      address: { line: 'MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
      preferredTime: new Date(Date.now() + 3600 * 1000),
      urgency: JobUrgency.TODAY,
      status: JobStatus.OFFERED,
      matchingExpiresAt: twoMinutesAgo,
    });

    // Create a legacy stuck job with null matchingExpiresAt but older than 90s
    const stuckJob2 = await JobModel.create({
      customerId: customerA.id,
      categoryId: categoryWithWorkersId,
      requiredSkills: [skillElectricalId],
      title: 'Legacy Stuck Job 2',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      address: { line: 'MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
      preferredTime: new Date(Date.now() + 3600 * 1000),
      urgency: JobUrgency.TODAY,
      status: JobStatus.MATCHING,
      matchingExpiresAt: null,
      createdAt: twoMinutesAgo,
    });

    // Run repair routine
    const report = await repairStuckMatchingJobs();
    expect(report.scanned).toBeGreaterThanOrEqual(2);
    expect(report.repaired).toBeGreaterThanOrEqual(2);

    const reloaded1 = await JobModel.findById(stuckJob1._id);
    const reloaded2 = await JobModel.findById(stuckJob2._id);

    expect(reloaded1?.status).toBe(JobStatus.EXPIRED);
    expect(reloaded2?.status).toBe(JobStatus.EXPIRED);
  });
});
