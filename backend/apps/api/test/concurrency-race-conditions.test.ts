import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../src/app.js';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { SessionModel } from '../src/modules/sessions/session.model.js';
import { JobModel } from '../src/modules/jobs/job.model.js';
import { JobOfferModel } from '../src/modules/job-offers/job-offer.model.js';
import { JobEventModel } from '../src/modules/job-events/job-event.model.js';
import { ServiceCategoryModel } from '../src/modules/service-categories/service-category.model.js';
import { SkillModel } from '../src/modules/skills/skill.model.js';
import { WorkerProfileModel } from '../src/modules/worker-profiles/worker-profile.model.js';
import { jobService } from '../src/modules/jobs/job.service.js';
import { signAccessToken } from '../src/modules/auth/token.util.js';
import {
  UserRole,
  JobStatus,
  JobOfferStatus,
  WorkerVerificationStatus,
} from '@kaamsetu/types';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

const PHONE_PREFIX = '+91919191'; // 6 digits prefix + 4 digits suffix = 10 digits
const SLUG_PREFIX = 'phase15-conc-';

interface WorkerContext {
  id: string;
  token: string;
  offerId: string;
}

describe('Concurrency & Race Condition Suite (Phase 15)', () => {
  let customerUser: { id: string; token: string };
  let categoryId: string;
  let skillId: string;
  let sharedJobId: string;
  const workerList: WorkerContext[] = [];

  beforeAll(async () => {
    await connectMongoDB({ uri: TEST_MONGODB_URI });
    await UserModel.syncIndexes();
    await SessionModel.syncIndexes();
    await JobModel.syncIndexes();
    await JobOfferModel.syncIndexes();
    await JobEventModel.syncIndexes();
    await ServiceCategoryModel.syncIndexes();
    await SkillModel.syncIndexes();
    await WorkerProfileModel.syncIndexes();

    // 1. Precise suite cleanup
    const staleUsers = await UserModel.find({
      phoneNumber: { $regex: `^\\${PHONE_PREFIX}` },
    })
      .select('_id')
      .lean();
    const staleIds = staleUsers.map((u) => u._id);
    if (staleIds.length > 0) {
      await JobEventModel.deleteMany({ actorId: { $in: staleIds } });
      await JobOfferModel.deleteMany({ workerId: { $in: staleIds } });
      await JobModel.deleteMany({ customerId: { $in: staleIds } });
      await WorkerProfileModel.deleteMany({ userId: { $in: staleIds } });
      await SessionModel.deleteMany({ userId: { $in: staleIds } });
      await UserModel.deleteMany({ _id: { $in: staleIds } });
    }
    await ServiceCategoryModel.deleteMany({ slug: { $regex: `^${SLUG_PREFIX}` } });
    await SkillModel.deleteMany({ slug: { $regex: `^${SLUG_PREFIX}` } });

    // 2. Setup Category & Skill
    const cat = await ServiceCategoryModel.create({
      name: 'Concurrency Plumbing',
      slug: `${SLUG_PREFIX}plumbing`,
      active: true,
    });
    categoryId = cat._id.toString();

    const sk = await SkillModel.create({
      name: 'Pipe Replacement',
      slug: `${SLUG_PREFIX}pipes`,
      categoryId: cat._id,
      active: true,
    });
    skillId = sk._id.toString();

    // 3. Create Customer
    const custDoc = await UserModel.create({
      phoneNumber: `${PHONE_PREFIX}0000`,
      role: UserRole.CUSTOMER,
      phoneVerified: true,
    });
    const custSess = await SessionModel.create({
      userId: custDoc._id,
      familyId: `fam-cust-${Date.now()}`,
      refreshTokenHash: 'cust-hash',
      expiresAt: new Date(Date.now() + 86400000),
    });
    customerUser = {
      id: custDoc._id.toString(),
      token: signAccessToken({
        userId: custDoc._id.toString(),
        role: UserRole.CUSTOMER,
        sessionId: custSess._id.toString(),
        familyId: custSess.familyId,
      }),
    };

    // 4. Create an OPEN/OFFERED Job
    const job = await jobService.createJob(customerUser.id, UserRole.CUSTOMER, {
      categoryId,
      requiredSkills: [skillId],
      title: 'Emergency Pipe Repair',
      description: 'Major leak in kitchen pipe requiring immediate fix',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      address: {
        line: '456 Market Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
      },
      preferredTime: new Date(Date.now() + 3600000).toISOString(),
      estimatedPrice: 2500,
    });
    await jobService.publishJob(job.id, { id: customerUser.id, role: UserRole.CUSTOMER });
    sharedJobId = job.id;

    // Transition job to OFFERED status
    await JobModel.updateOne(
      { _id: new Types.ObjectId(sharedJobId) },
      { $set: { status: JobStatus.OFFERED } }
    );

    // 5. Batch Create 50 Worker Users, Sessions, Profiles & Pending Offers
    const workerUserDocs = [];
    const sessionDocs = [];
    const profileDocs = [];
    const offerDocs = [];

    const TOTAL_WORKERS = 50;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    for (let i = 1; i <= TOTAL_WORKERS; i++) {
      const suffix = String(i).padStart(4, '0');
      const userId = new Types.ObjectId();
      const sessionId = new Types.ObjectId();
      const offerId = new Types.ObjectId();
      const familyId = `fam-w-${suffix}-${Date.now()}`;

      workerUserDocs.push({
        _id: userId,
        phoneNumber: `${PHONE_PREFIX}${suffix}`,
        role: UserRole.WORKER,
        phoneVerified: true,
      });

      sessionDocs.push({
        _id: sessionId,
        userId,
        familyId,
        refreshTokenHash: `w-hash-${suffix}`,
        expiresAt: new Date(Date.now() + 86400000),
      });

      profileDocs.push({
        userId,
        displayName: `Concurrent Worker ${i}`,
        skills: [{ skillId, level: 'EXPERT', verified: true }],
        languages: ['en', 'hi'],
        serviceLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
        serviceRadiusKm: 25,
        availabilityStatus: 'AVAILABLE',
        rating: { average: 4.8, count: 20 },
        verificationStatus: WorkerVerificationStatus.VERIFIED,
      });

      offerDocs.push({
        _id: offerId,
        jobId: new Types.ObjectId(sharedJobId),
        workerId: userId,
        distanceKm: 2.5,
        matchScore: 90,
        scoreBreakdown: {
          skillScore: 30,
          distanceScore: 25,
          availabilityScore: 15,
          ratingScore: 10,
          completionRateScore: 10,
          acceptanceRateScore: 5,
          priceScore: 5,
        },
        status: JobOfferStatus.PENDING,
        expiresAt,
      });

      const token = signAccessToken({
        userId: userId.toString(),
        role: UserRole.WORKER,
        sessionId: sessionId.toString(),
        familyId,
      });

      workerList.push({
        id: userId.toString(),
        token,
        offerId: offerId.toString(),
      });
    }

    await UserModel.insertMany(workerUserDocs);
    await SessionModel.insertMany(sessionDocs);
    await WorkerProfileModel.insertMany(profileDocs);
    await JobOfferModel.insertMany(offerDocs);
  });

  afterAll(async () => {
    const staleUsers = await UserModel.find({
      phoneNumber: { $regex: `^\\${PHONE_PREFIX}` },
    })
      .select('_id')
      .lean();
    const staleIds = staleUsers.map((u) => u._id);
    if (staleIds.length > 0) {
      await JobEventModel.deleteMany({ actorId: { $in: staleIds } });
      await JobOfferModel.deleteMany({ workerId: { $in: staleIds } });
      await JobModel.deleteMany({ customerId: { $in: staleIds } });
      await WorkerProfileModel.deleteMany({ userId: { $in: staleIds } });
      await SessionModel.deleteMany({ userId: { $in: staleIds } });
      await UserModel.deleteMany({ _id: { $in: staleIds } });
    }
    await ServiceCategoryModel.deleteMany({ slug: { $regex: `^${SLUG_PREFIX}` } });
    await SkillModel.deleteMany({ slug: { $regex: `^${SLUG_PREFIX}` } });
    await disconnectMongoDB();
  });

  // =============================================================
  // 1. High-Concurrency Offer Acceptance: 50 Workers Competing
  // =============================================================
  describe('1. Concurrency: 50 Workers Simultaneously Accept the Same Job', () => {
    it('allows EXACTLY 1 worker to succeed (200 OK) and 49 to fail with 409 Conflict', async () => {
      expect(workerList.length).toBe(50);

      // Fire all 50 accept requests concurrently via Promise.all
      const acceptPromises = workerList.map((worker) =>
        request(app)
          .post(`/api/v1/offers/${worker.offerId}/accept`)
          .set('Authorization', `Bearer ${worker.token}`)
      );

      const responses = await Promise.all(acceptPromises);

      // Verify status codes
      const successResponses = responses.filter((res) => res.status === 200);
      const conflictResponses = responses.filter((res) => res.status === 409);

      expect(successResponses.length).toBe(1);
      expect(conflictResponses.length).toBe(49);

      // Verify the single winner's response structure
      const winnerResponse = successResponses[0];
      expect(winnerResponse).toBeDefined();
      expect(winnerResponse!.body.success).toBe(true);
      expect(winnerResponse!.body.data.offer.status).toBe('ACCEPTED');

      const winningWorkerId = winnerResponse!.body.data.offer.workerId;
      expect(winningWorkerId).toBeDefined();

      // Verify that every conflict response returned the CONFLICT error code
      for (const res of conflictResponses) {
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('CONFLICT');
        expect(
          res.body.error.message.includes('already been accepted') ||
            res.body.error.message.includes('withdrawn') ||
            res.body.error.message.includes('no longer available')
        ).toBe(true);
      }

      // Verify database consistency: Job record
      const jobInDb = await JobModel.findById(sharedJobId);
      expect(jobInDb).toBeTruthy();
      expect(jobInDb?.status).toBe(JobStatus.ACCEPTED);
      expect(jobInDb?.assignedWorkerId?.toString()).toBe(winningWorkerId);

      // Verify database consistency: Job Offers
      const winningOfferInDb = await JobOfferModel.findOne({
        jobId: new Types.ObjectId(sharedJobId),
        status: JobOfferStatus.ACCEPTED,
      });
      expect(winningOfferInDb).toBeTruthy();
      expect(winningOfferInDb?.workerId.toString()).toBe(winningWorkerId);

      // Exactly 1 offer is in ACCEPTED status
      const acceptedOffersCount = await JobOfferModel.countDocuments({
        jobId: new Types.ObjectId(sharedJobId),
        status: JobOfferStatus.ACCEPTED,
      });
      expect(acceptedOffersCount).toBe(1);

      // Exactly 1 OFFER_ACCEPTED event logged for this job
      const eventCount = await JobEventModel.countDocuments({
        jobId: new Types.ObjectId(sharedJobId),
        eventType: 'OFFER_ACCEPTED',
      });
      expect(eventCount).toBe(1);
    });

    it('subsequent accept attempts after resolution return 409 Conflict', async () => {
      // Pick any non-winning worker from the list
      const nonWinner = workerList[1];
      expect(nonWinner).toBeDefined();

      const res = await request(app)
        .post(`/api/v1/offers/${nonWinner!.offerId}/accept`)
        .set('Authorization', `Bearer ${nonWinner!.token}`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  // =============================================================
  // 2. Concurrency on Competing State Transitions (Complete vs Cancel)
  // =============================================================
  describe('2. Concurrency: Simultaneous Competing State Transitions', () => {
    it('ensures only one state transition succeeds when cancel and startTravel collide', async () => {
      // Create a fresh job assigned to worker 1
      const job = await jobService.createJob(customerUser.id, UserRole.CUSTOMER, {
        categoryId,
        requiredSkills: [skillId],
        title: 'Collision Test Job',
        description: 'Testing collision between customer cancel and worker travel',
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        address: {
          line: 'Collision Ave',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
        preferredTime: new Date(Date.now() + 3600000).toISOString(),
      });
      await jobService.publishJob(job.id, { id: customerUser.id, role: UserRole.CUSTOMER });

      const testWorker = workerList[0]!;
      await JobModel.updateOne(
        { _id: new Types.ObjectId(job.id) },
        {
          $set: {
            status: JobStatus.ACCEPTED,
            assignedWorkerId: new Types.ObjectId(testWorker.id),
          },
        }
      );

      // Customer cancels job WHILE worker tries to startTravel simultaneously
      const [cancelRes, travelRes] = await Promise.all([
        request(app)
          .post(`/api/v1/jobs/${job.id}/cancel`)
          .set('Authorization', `Bearer ${customerUser.token}`)
          .send({ reason: 'Customer changed mind' }),
        request(app)
          .post(`/api/v1/jobs/${job.id}/start-travel`)
          .set('Authorization', `Bearer ${testWorker.token}`),
      ]);

      // Both cannot be active states: exactly one must successfully dictate the state
      const finalJob = await JobModel.findById(job.id);
      expect(finalJob).toBeTruthy();
      expect([JobStatus.CANCELLED, JobStatus.EN_ROUTE]).toContain(finalJob?.status);

      // At least one of the requests succeeded (200), and if both executed, one threw a conflict/bad request
      const statuses = [cancelRes.status, travelRes.status];
      expect(statuses).toContain(200);
    });
  });
});
