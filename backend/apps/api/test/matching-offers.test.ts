import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { userRepository } from '../src/modules/users/user.repository.js';
import { serviceCategoryRepository } from '../src/modules/service-categories/service-category.repository.js';
import { skillRepository } from '../src/modules/skills/skill.repository.js';
import { sessionRepository } from '../src/modules/sessions/session.repository.js';
import { workerProfileRepository } from '../src/modules/worker-profiles/worker-profile.repository.js';
import { matchingService } from '../src/modules/matching/matching.service.js';
import { scoringService, calculateHaversineDistanceKm } from '../src/modules/matching/scoring.service.js';
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
  UserStatus,
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

const PHONE_PREFIX = '+9194444';

describe('Geospatial Matching & Job Offers (Phase 5)', () => {
  let customerUser: { id: string; token: string };
  let worker1: { id: string; token: string };
  let worker2: { id: string; token: string };
  let workerFar: { id: string; token: string };
  let categoryId: string;
  let skillElectricalId: string;
  let skillPlumbingId: string;

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

    // Isolated cleanup
    await UserModel.deleteMany({ phoneNumber: /^\+9194444/ });
    await ServiceCategoryModel.deleteMany({ slug: /^phase5-/ });
    await SkillModel.deleteMany({ slug: /^phase5-/ });

    // 1. Create Category and Skills
    const cat = await serviceCategoryRepository.create({
      name: 'Phase5 Electrical & Plumbing',
      slug: 'phase5-electric-plumb',
      active: true,
    });
    categoryId = cat.id;

    const sk1 = await skillRepository.create({
      name: 'Wiring Repair',
      slug: 'phase5-wiring-repair',
      categoryId,
      active: true,
    });
    skillElectricalId = sk1.id;

    const sk2 = await skillRepository.create({
      name: 'Leak Detection',
      slug: 'phase5-leak-detect',
      categoryId,
      active: true,
    });
    skillPlumbingId = sk2.id;

    // 2. Helper to create user, session, and token
    async function createUserAndToken(phoneSuffix: string, role: UserRole) {
      const u = await userRepository.create({
        phoneNumber: `${PHONE_PREFIX}${phoneSuffix}`,
        role,
      });
      const sess = await sessionRepository.create({
        userId: u.id,
        refreshTokenHash: `p5-hash-${phoneSuffix}`,
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

    customerUser = await createUserAndToken('00001', UserRole.CUSTOMER);
    worker1 = await createUserAndToken('00002', UserRole.WORKER);
    worker2 = await createUserAndToken('00003', UserRole.WORKER);
    workerFar = await createUserAndToken('00004', UserRole.WORKER);

    // 3. Create Worker Profiles:
    // Reference point: Bangalore MG Road: [77.5946, 12.9716]

    // Worker 1: 2 km away from MG Road (Indiranagar: [77.6387, 12.9784]), has Electrical skill
    await workerProfileRepository.create({
      userId: worker1.id,
      displayName: 'Electrician Ramesh',
      serviceLocation: { type: 'Point', coordinates: [77.6387, 12.9784] },
      serviceRadiusKm: 15,
      availabilityStatus: WorkerAvailability.AVAILABLE,
      verificationStatus: WorkerVerificationStatus.VERIFIED,
      skills: [
        {
          skillId: skillElectricalId,
          skillName: 'Wiring Repair',
          experienceYears: 6,
          level: SkillLevel.EXPERT,
          verified: true,
        },
      ],
      pricing: { hourlyRate: 350 },
    });

    // Worker 2: 4 km away from MG Road (Koramangala: [77.6245, 12.9352]), has Electrical skill
    await workerProfileRepository.create({
      userId: worker2.id,
      displayName: 'Electrician Suresh',
      serviceLocation: { type: 'Point', coordinates: [77.6245, 12.9352] },
      serviceRadiusKm: 15,
      availabilityStatus: WorkerAvailability.AVAILABLE,
      verificationStatus: WorkerVerificationStatus.VERIFIED,
      skills: [
        {
          skillId: skillElectricalId,
          skillName: 'Wiring Repair',
          experienceYears: 3,
          level: SkillLevel.INTERMEDIATE,
          verified: true,
        },
      ],
      pricing: { hourlyRate: 300 },
    });

    // Worker Far: 40 km away (Hosur: [77.8283, 12.7409]), radius 10 km (too far for MG Road job)
    await workerProfileRepository.create({
      userId: workerFar.id,
      displayName: 'Electrician Hosur',
      serviceLocation: { type: 'Point', coordinates: [77.8283, 12.7409] },
      serviceRadiusKm: 10,
      availabilityStatus: WorkerAvailability.AVAILABLE,
      verificationStatus: WorkerVerificationStatus.VERIFIED,
      skills: [
        {
          skillId: skillElectricalId,
          skillName: 'Wiring Repair',
          experienceYears: 5,
          level: SkillLevel.EXPERT,
          verified: true,
        },
      ],
      pricing: { hourlyRate: 250 },
    });
  });

  afterAll(async () => {
    await JobOfferModel.deleteMany({
      workerId: { $in: [worker1?.id, worker2?.id, workerFar?.id] },
    });
    await JobModel.deleteMany({ customerId: customerUser?.id });
    await JobEventModel.deleteMany({
      actorId: { $in: [customerUser?.id, worker1?.id, worker2?.id, workerFar?.id] },
    });
    await SessionModel.deleteMany({
      userId: { $in: [customerUser?.id, worker1?.id, worker2?.id, workerFar?.id] },
    });
    await WorkerProfileModel.deleteMany({
      userId: { $in: [worker1?.id, worker2?.id, workerFar?.id] },
    });
    await UserModel.deleteMany({ phoneNumber: /^\+9194444/ });
    await ServiceCategoryModel.deleteMany({ slug: /^phase5-/ });
    await SkillModel.deleteMany({ slug: /^phase5-/ });
    await disconnectMongoDB();
  });

  describe('ScoringService & Distance Calculation', () => {
    it('should accurately calculate distance using Haversine formula', () => {
      // Distance between Bangalore [77.5946, 12.9716] and Mumbai [72.8777, 19.0760] is ~840 km
      const distance = calculateHaversineDistanceKm([77.5946, 12.9716], [72.8777, 19.076]);
      expect(distance).toBeGreaterThan(800);
      expect(distance).toBeLessThan(900);
    });

    it('should produce higher distance score for closer worker', () => {
      const mockJob: any = {
        requiredSkills: [skillElectricalId],
        estimatedPrice: 400,
      };

      const workerNear: any = {
        skills: [{ skillId: skillElectricalId }],
        availabilityStatus: WorkerAvailability.AVAILABLE,
        rating: { average: 4.5, count: 10 },
        stats: { completedJobs: 20, cancelledJobs: 1 },
      };

      const weights = {
        skill: 0.3,
        distance: 0.25,
        availability: 0.15,
        rating: 0.1,
        completionRate: 0.1,
        acceptanceRate: 0.05,
        priceCompatibility: 0.05,
      };

      const score2km = scoringService.calculateScore(workerNear, mockJob, 2, weights, 30);
      const score15km = scoringService.calculateScore(workerNear, mockJob, 15, weights, 30);

      expect(score2km.matchScore).toBeGreaterThan(score15km.matchScore);
      expect(score2km.scoreBreakdown.distanceScore).toBeGreaterThan(
        score15km.scoreBreakdown.distanceScore
      );
    });
  });

  describe('MatchingService (Geospatial Candidate Filtering & Waves)', () => {
    let testJobId: string;

    beforeAll(async () => {
      // Create an OPEN job at MG Road [77.5946, 12.9716] requiring Electrical skill
      const jobDoc = await JobModel.create({
        customerId: customerUser.id,
        categoryId,
        requiredSkills: [skillElectricalId],
        title: 'Fix short circuit in main switchboard',
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        address: { line: 'MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
        preferredTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
        urgency: JobUrgency.TODAY,
        status: JobStatus.OPEN,
        estimatedPrice: 400,
      });
      testJobId = jobDoc._id.toString();
    });

    it('should find and rank nearby eligible candidates while excluding far workers', async () => {
      const candidates = await matchingService.findRankedCandidates(testJobId);

      // WorkerFar is 40km away with 10km radius, so must be excluded
      const candidateUserIds = candidates.map((c) => c.worker.userId);
      expect(candidateUserIds).toContain(worker1.id);
      expect(candidateUserIds).toContain(worker2.id);
      expect(candidateUserIds).not.toContain(workerFar.id);

      // Ramesh (worker1, 2km away) should rank higher than Suresh (worker2, 4km away)
      expect(candidates[0]?.worker.userId).toBe(worker1.id);
      expect(candidates[0]?.matchScore).toBeGreaterThan(candidates[1]?.matchScore ?? 0);
    });

    it('should dispatch offers in wave and transition job from OPEN to MATCHING to OFFERED', async () => {
      const result = await matchingService.matchAndDispatchWave(testJobId, { waveSize: 2 });

      expect(result.offers.length).toBe(2);
      expect(result.offers.map((o) => o.workerId)).toEqual(
        expect.arrayContaining([worker1.id, worker2.id])
      );

      // Verify Job Status transitioned to OFFERED
      const updatedJob = await JobModel.findById(testJobId);
      expect(updatedJob?.status).toBe(JobStatus.OFFERED);

      // Verify each offer has PENDING status and valid expiresAt
      result.offers.forEach((offer) => {
        expect(offer.status).toBe(JobOfferStatus.PENDING);
        expect(new Date(offer.expiresAt).getTime()).toBeGreaterThan(Date.now());
      });

      // Verify audit events created: MATCHING_STARTED, STATUS_CHANGED, OFFER_CREATED
      const events = await JobEventModel.find({ jobId: testJobId });
      const eventTypes = events.map((e) => e.eventType);
      expect(eventTypes).toContain('MATCHING_STARTED');
      expect(eventTypes).toContain('STATUS_CHANGED');
      expect(eventTypes).toContain('OFFER_CREATED');
    });
  });

  describe('Job Offers Endpoints', () => {
    let offerWorker1Id: string;
    let offerWorker2Id: string;
    let testJobId: string;

    beforeAll(async () => {
      // Create new job for endpoint testing
      const jobDoc = await JobModel.create({
        customerId: customerUser.id,
        categoryId,
        requiredSkills: [skillElectricalId],
        title: 'Emergency wiring spark repair',
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        address: { line: 'MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
        preferredTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
        urgency: JobUrgency.EMERGENCY,
        status: JobStatus.OPEN,
      });
      testJobId = jobDoc._id.toString();

      // Dispatch offers to worker1 and worker2
      const res = await matchingService.matchAndDispatchWave(testJobId, { waveSize: 2 });
      const o1 = res.offers.find((o) => o.workerId === worker1.id)!;
      const o2 = res.offers.find((o) => o.workerId === worker2.id)!;
      offerWorker1Id = o1.id;
      offerWorker2Id = o2.id;
    });

    it('GET /api/v1/worker/offers should return pending offers for authenticated worker', async () => {
      const res = await request(app)
        .get('/api/v1/worker/offers')
        .set('Authorization', `Bearer ${worker1.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.offers)).toBe(true);
      expect(res.body.data.offers.some((o: any) => o.id === offerWorker1Id)).toBe(true);
    });

    it('GET /api/v1/offers/:id should return offer details to the recipient worker', async () => {
      const res = await request(app)
        .get(`/api/v1/offers/${offerWorker1Id}`)
        .set('Authorization', `Bearer ${worker1.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.offer.id).toBe(offerWorker1Id);
      // Privacy view: recipient verified implicitly (owner-only access), no raw internal IDs
      expect(res.body.data.offer.jobId).toBeDefined();
      expect(res.body.data.offer.job.title).toBeDefined();
      expect(res.body.data.offer.job.approximateLocality).toBeDefined();
    });

    it('GET /api/v1/offers/:id should forbid worker from viewing another workers offer', async () => {
      const res = await request(app)
        .get(`/api/v1/offers/${offerWorker1Id}`)
        .set('Authorization', `Bearer ${worker2.token}`);

      expect(res.status).toBe(403);
    });

    it('POST /api/v1/offers/:id/reject should allow worker to reject an offer', async () => {
      // Create an offer to reject
      const tempOffer = await JobOfferModel.create({
        jobId: testJobId,
        workerId: workerFar.id,
        distanceKm: 30,
        matchScore: 60,
        scoreBreakdown: {
          skillScore: 100,
          distanceScore: 0,
          availabilityScore: 100,
          ratingScore: 70,
          completionRateScore: 80,
          acceptanceRateScore: 80,
          priceScore: 100,
        },
        status: JobOfferStatus.PENDING,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });

      const res = await request(app)
        .post(`/api/v1/offers/${tempOffer._id}/reject`)
        .set('Authorization', `Bearer ${workerFar.token}`)
        .send({ reason: 'Too far away to travel' });

      expect(res.status).toBe(200);
      expect(res.body.data.offer.status).toBe(JobOfferStatus.REJECTED);

      const dbOffer = await JobOfferModel.findById(tempOffer._id);
      expect(dbOffer?.status).toBe(JobOfferStatus.REJECTED);
    });

    it('CRITICAL CONCURRENCY: Simultaneous acceptance by two workers results in exactly ONE winner', async () => {
      // Both worker1 and worker2 attempt to accept offers for testJobId at the exact same moment
      const [res1, res2] = await Promise.all([
        request(app)
          .post(`/api/v1/offers/${offerWorker1Id}/accept`)
          .set('Authorization', `Bearer ${worker1.token}`),
        request(app)
          .post(`/api/v1/offers/${offerWorker2Id}/accept`)
          .set('Authorization', `Bearer ${worker2.token}`),
      ]);

      const statuses = [res1.status, res2.status];
      // Exactly one must succeed (200) and one must be rejected (409 Conflict)
      expect(statuses).toContain(200);
      expect(statuses).toContain(409);

      // The winner must be assigned to the job
      const finalJob = await JobModel.findById(testJobId);
      expect(finalJob?.status).toBe(JobStatus.ACCEPTED);
      expect(finalJob?.assignedWorkerId).toBeTruthy();

      const winningWorkerId = finalJob!.assignedWorkerId!.toString();
      expect([worker1.id, worker2.id]).toContain(winningWorkerId);

      // Verify winner offer is ACCEPTED
      const winningOffer = await JobOfferModel.findOne({
        jobId: testJobId,
        workerId: winningWorkerId,
      });
      expect(winningOffer?.status).toBe(JobOfferStatus.ACCEPTED);

      // Verify the losing offer was WITHDRAWN
      const losingWorkerId = winningWorkerId === worker1.id ? worker2.id : worker1.id;
      const losingOffer = await JobOfferModel.findOne({
        jobId: testJobId,
        workerId: losingWorkerId,
      });
      expect(losingOffer?.status).toBe(JobOfferStatus.WITHDRAWN);

      // Verify audit event OFFER_ACCEPTED was created
      const acceptEvent = await JobEventModel.findOne({
        jobId: testJobId,
        eventType: 'OFFER_ACCEPTED',
      });
      expect(acceptEvent).toBeDefined();
      expect(acceptEvent?.actorId.toString()).toBe(winningWorkerId);
      expect(acceptEvent?.newState).toBe(JobStatus.ACCEPTED);
    });
  });
});
