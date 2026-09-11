import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import http from 'http';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { app } from '../src/app.js';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { SessionModel } from '../src/modules/sessions/session.model.js';
import { WorkerProfileModel } from '../src/modules/worker-profiles/worker-profile.model.js';
import { JobModel } from '../src/modules/jobs/job.model.js';
import { JobOfferModel } from '../src/modules/job-offers/job-offer.model.js';
import { JobEventModel } from '../src/modules/job-events/job-event.model.js';
import { ServiceCategoryModel } from '../src/modules/service-categories/service-category.model.js';
import { SkillModel } from '../src/modules/skills/skill.model.js';
import { userRepository } from '../src/modules/users/user.repository.js';
import { sessionRepository } from '../src/modules/sessions/session.repository.js';
import { serviceCategoryRepository } from '../src/modules/service-categories/service-category.repository.js';
import { skillRepository } from '../src/modules/skills/skill.repository.js';
import { workerProfileRepository } from '../src/modules/worker-profiles/worker-profile.repository.js';
import { jobOfferRepository } from '../src/modules/job-offers/job-offer.repository.js';
import { realtimeGateway } from '../src/realtime/index.js';
import {
  UserRole,
  JobStatus,
  JobOfferStatus,
  WorkerAvailability,
  WorkerVerificationStatus,
  SkillLevel,
} from '@kaamsetu/types';
import { signAccessToken } from '../src/modules/auth/token.util.js';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

const PHONE_PREFIX = '+91933333';

describe('Job Execution Lifecycle & Realtime Gateway (Phase 6)', () => {
  let customerUser: { id: string; token: string };
  let workerUser: { id: string; token: string };
  let otherWorkerUser: { id: string; token: string };
  let categoryId: string;
  let skillId: string;
  let httpServer: http.Server;
  let serverPort: number;

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
    await UserModel.deleteMany({ phoneNumber: /^\+91933333/ });
    await ServiceCategoryModel.deleteMany({ slug: /^phase6-/ });
    await SkillModel.deleteMany({ slug: /^phase6-/ });

    // 1. Create Category and Skill
    const cat = await serviceCategoryRepository.create({
      name: 'Phase6 Plumbing Repair',
      slug: 'phase6-plumbing-repair',
      active: true,
    });
    categoryId = cat.id;

    const sk = await skillRepository.create({
      name: 'Pipe Replacement',
      slug: 'phase6-pipe-replacement',
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
        refreshTokenHash: `p6-hash-${phoneSuffix}`,
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
    workerUser = await createUserAndToken('0002', UserRole.WORKER);
    otherWorkerUser = await createUserAndToken('0003', UserRole.WORKER);

    // 3. Worker profile
    await workerProfileRepository.create({
      userId: workerUser.id,
      displayName: 'Plumber Raju',
      serviceLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      serviceRadiusKm: 20,
      availabilityStatus: WorkerAvailability.AVAILABLE,
      verificationStatus: WorkerVerificationStatus.VERIFIED,
      skills: [
        {
          skillId,
          skillName: 'Pipe Replacement',
          experienceYears: 5,
          level: SkillLevel.EXPERT,
          verified: true,
        },
      ],
      pricing: { hourlyRate: 400 },
    });

    // 4. Initialize HTTP server + Realtime Socket gateway on dynamic port for testing
    httpServer = http.createServer(app);
    realtimeGateway.initialize(httpServer, '*');

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        if (typeof addr === 'object' && addr !== null) {
          serverPort = addr.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await realtimeGateway.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));

    await JobOfferModel.deleteMany({
      workerId: { $in: [workerUser?.id, otherWorkerUser?.id] },
    });
    await JobModel.deleteMany({ customerId: customerUser?.id });
    await JobEventModel.deleteMany({
      actorId: { $in: [customerUser?.id, workerUser?.id, otherWorkerUser?.id] },
    });
    await SessionModel.deleteMany({
      userId: { $in: [customerUser?.id, workerUser?.id, otherWorkerUser?.id] },
    });
    await WorkerProfileModel.deleteMany({
      userId: { $in: [workerUser?.id, otherWorkerUser?.id] },
    });
    await UserModel.deleteMany({ phoneNumber: /^\+91933333/ });
    await ServiceCategoryModel.deleteMany({ slug: /^phase6-/ });
    await SkillModel.deleteMany({ slug: /^phase6-/ });
    await disconnectMongoDB();
  });

  describe('Job Execution Lifecycle Endpoints', () => {
    let testJobId: string;

    beforeAll(async () => {
      // Create a job directly in ACCEPTED status assigned to workerUser
      const jobDoc = await JobModel.create({
        customerId: customerUser.id,
        categoryId,
        requiredSkills: [skillId],
        title: 'Emergency pipe burst in kitchen',
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        address: { line: 'Brigade Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
        preferredTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        status: JobStatus.ACCEPTED,
        assignedWorkerId: workerUser.id,
        estimatedPrice: 500,
      });
      testJobId = jobDoc._id.toString();

      // Offer in ACCEPTED state
      await jobOfferRepository.create({
        jobId: testJobId,
        workerId: workerUser.id,
        distanceKm: 2,
        matchScore: 95,
        scoreBreakdown: {
          skillScore: 100,
          distanceScore: 90,
          availabilityScore: 100,
          ratingScore: 70,
          completionRateScore: 80,
          acceptanceRateScore: 85,
          priceScore: 100,
        },
        status: JobOfferStatus.ACCEPTED,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
    });

    it('POST /api/v1/jobs/:id/start-travel — assigned worker starts travel (ACCEPTED -> EN_ROUTE)', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${testJobId}/start-travel`)
        .set('Authorization', `Bearer ${workerUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.job.status).toBe(JobStatus.EN_ROUTE);

      // Verify audit event
      const event = await JobEventModel.findOne({
        jobId: testJobId,
        eventType: 'TRAVEL_STARTED',
      });
      expect(event).toBeDefined();
      expect(event?.actorId.toString()).toBe(workerUser.id);
      expect(event?.previousState).toBe(JobStatus.ACCEPTED);
      expect(event?.newState).toBe(JobStatus.EN_ROUTE);
    });

    it('POST /api/v1/jobs/:id/start-travel — rejects unassigned worker with 403', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${testJobId}/start-travel`)
        .set('Authorization', `Bearer ${otherWorkerUser.token}`);

      expect(res.status).toBe(403);
    });

    it('POST /api/v1/jobs/:id/start-travel — rejects customer with 403', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${testJobId}/start-travel`)
        .set('Authorization', `Bearer ${customerUser.token}`);

      expect(res.status).toBe(403);
    });

    it('POST /api/v1/jobs/:id/arrive — assigned worker arrives at site (EN_ROUTE -> ARRIVED)', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${testJobId}/arrive`)
        .set('Authorization', `Bearer ${workerUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.job.status).toBe(JobStatus.ARRIVED);

      // Verify audit event
      const event = await JobEventModel.findOne({
        jobId: testJobId,
        eventType: 'WORKER_ARRIVED',
      });
      expect(event).toBeDefined();
      expect(event?.previousState).toBe(JobStatus.EN_ROUTE);
      expect(event?.newState).toBe(JobStatus.ARRIVED);
    });

    it('POST /api/v1/jobs/:id/start — assigned worker starts service (ARRIVED -> IN_PROGRESS)', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${testJobId}/start`)
        .set('Authorization', `Bearer ${workerUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.job.status).toBe(JobStatus.IN_PROGRESS);

      // Verify audit event
      const event = await JobEventModel.findOne({
        jobId: testJobId,
        eventType: 'JOB_STARTED',
      });
      expect(event).toBeDefined();
      expect(event?.previousState).toBe(JobStatus.ARRIVED);
      expect(event?.newState).toBe(JobStatus.IN_PROGRESS);
    });

    it('POST /api/v1/jobs/:id/complete — assigned worker completes service (IN_PROGRESS -> COMPLETED)', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${testJobId}/complete`)
        .set('Authorization', `Bearer ${workerUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.job.status).toBe(JobStatus.COMPLETED);

      // Verify audit event
      const event = await JobEventModel.findOne({
        jobId: testJobId,
        eventType: 'JOB_COMPLETED',
      });
      expect(event).toBeDefined();
      expect(event?.previousState).toBe(JobStatus.IN_PROGRESS);
      expect(event?.newState).toBe(JobStatus.COMPLETED);
    });

    it('POST /api/v1/jobs/:id/complete — rejects repeating completion on terminal state with 409', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${testJobId}/complete`)
        .set('Authorization', `Bearer ${workerUser.token}`);

      expect(res.status).toBe(409);
    });
  });

  describe('Realtime Socket.IO Gateway', () => {
    let socketUrl: string;
    let realtimeJobId: string;

    beforeAll(async () => {
      socketUrl = `http://localhost:${serverPort}`;

      // Create a dedicated job for socket events
      const jobDoc = await JobModel.create({
        customerId: customerUser.id,
        categoryId,
        requiredSkills: [skillId],
        title: 'Socket realtime test job',
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        address: { line: 'Test Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
        preferredTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
        status: JobStatus.ACCEPTED,
        assignedWorkerId: workerUser.id,
        estimatedPrice: 300,
      });
      realtimeJobId = jobDoc._id.toString();
    });

    it('should reject connection without token', async () => {
      const client = ioClient(socketUrl, {
        autoConnect: false,
        reconnection: false,
      });

      const connectPromise = new Promise<{ connected: boolean; err?: string }>((resolve) => {
        client.on('connect', () => {
          client.disconnect();
          resolve({ connected: true });
        });
        client.on('connect_error', (err) => {
          resolve({ connected: false, err: err.message });
        });
      });

      client.connect();
      const result = await connectPromise;

      expect(result.connected).toBe(false);
      expect(result.err).toMatch(/missing token/i);
    });

    it('should reject connection with invalid token', async () => {
      const client = ioClient(socketUrl, {
        auth: { token: 'invalid.jwt.token' },
        autoConnect: false,
        reconnection: false,
      });

      const connectPromise = new Promise<{ connected: boolean; err?: string }>((resolve) => {
        client.on('connect', () => {
          client.disconnect();
          resolve({ connected: true });
        });
        client.on('connect_error', (err) => {
          resolve({ connected: false, err: err.message });
        });
      });

      client.connect();
      const result = await connectPromise;

      expect(result.connected).toBe(false);
      expect(result.err).toMatch(/invalid/i);
    });

    it('should connect successfully with valid access token', async () => {
      const client = ioClient(socketUrl, {
        auth: { token: customerUser.token },
        autoConnect: false,
        reconnection: false,
      });

      const connectPromise = new Promise<boolean>((resolve) => {
        client.on('connect', () => resolve(true));
        client.on('connect_error', () => resolve(false));
      });

      client.connect();
      const connected = await connectPromise;
      expect(connected).toBe(true);
      client.disconnect();
    });

    it('should allow job customer to join job room and forbid unrelated worker', async () => {
      const customerClient = ioClient(socketUrl, {
        auth: { token: customerUser.token },
        autoConnect: false,
        reconnection: false,
      });
      const otherWorkerClient = ioClient(socketUrl, {
        auth: { token: otherWorkerUser.token },
        autoConnect: false,
        reconnection: false,
      });

      await new Promise<void>((resolve) => {
        customerClient.on('connect', () => resolve());
        customerClient.connect();
      });
      await new Promise<void>((resolve) => {
        otherWorkerClient.on('connect', () => resolve());
        otherWorkerClient.connect();
      });

      // Customer joins job room -> should succeed
      const customerJoinRes: any = await new Promise((resolve) => {
        customerClient.emit('join:job', { jobId: realtimeJobId }, resolve);
      });
      expect(customerJoinRes.success).toBe(true);

      // Unrelated worker joins job room -> should fail
      const otherWorkerJoinRes: any = await new Promise((resolve) => {
        otherWorkerClient.emit('join:job', { jobId: realtimeJobId }, resolve);
      });
      expect(otherWorkerJoinRes.success).toBe(false);
      expect(otherWorkerJoinRes.error).toMatch(/unauthorized/i);

      customerClient.disconnect();
      otherWorkerClient.disconnect();
    });

    it('should stream worker location updates to customer in job room', async () => {
      const customerClient = ioClient(socketUrl, {
        auth: { token: customerUser.token },
        autoConnect: false,
        reconnection: false,
      });
      const workerClient = ioClient(socketUrl, {
        auth: { token: workerUser.token },
        autoConnect: false,
        reconnection: false,
      });

      await new Promise<void>((resolve) => {
        customerClient.on('connect', () => resolve());
        customerClient.connect();
      });
      await new Promise<void>((resolve) => {
        workerClient.on('connect', () => resolve());
        workerClient.connect();
      });

      // Customer joins job room
      await new Promise((resolve) => {
        customerClient.emit('join:job', { jobId: realtimeJobId }, resolve);
      });

      // Customer sets up listener for worker.location.updated
      const locationPromise = new Promise<any>((resolve) => {
        customerClient.on('worker.location.updated', (payload) => {
          resolve(payload);
        });
      });

      // Worker streams location
      const ack: any = await new Promise((resolve) => {
        workerClient.emit(
          'worker.location.update',
          {
            jobId: realtimeJobId,
            coordinates: [77.6000, 12.9700],
          },
          resolve
        );
      });
      expect(ack.success).toBe(true);

      // Verify customer received realtime update
      const received = await locationPromise;
      expect(received.jobId).toBe(realtimeJobId);
      expect(received.workerId).toBe(workerUser.id);
      expect(received.coordinates).toEqual([77.6000, 12.9700]);
      expect(received.updatedAt).toBeDefined();

      customerClient.disconnect();
      workerClient.disconnect();
    });

    it('should broadcast job.status.changed and job.completed when execution endpoints are called', async () => {
      const customerClient = ioClient(socketUrl, {
        auth: { token: customerUser.token },
        autoConnect: false,
        reconnection: false,
      });

      await new Promise<void>((resolve) => {
        customerClient.on('connect', () => resolve());
        customerClient.connect();
      });

      // Join job room
      await new Promise((resolve) => {
        customerClient.emit('join:job', { jobId: realtimeJobId }, resolve);
      });

      // Listen for status changes
      const statusChanges: any[] = [];
      customerClient.on('job.status.changed', (payload) => {
        statusChanges.push(payload);
      });

      const completedPromise = new Promise<any>((resolve) => {
        customerClient.on('job.completed', (payload) => {
          resolve(payload);
        });
      });

      // Worker transitions job through entire lifecycle
      await request(app)
        .post(`/api/v1/jobs/${realtimeJobId}/start-travel`)
        .set('Authorization', `Bearer ${workerUser.token}`);

      await request(app)
        .post(`/api/v1/jobs/${realtimeJobId}/arrive`)
        .set('Authorization', `Bearer ${workerUser.token}`);

      await request(app)
        .post(`/api/v1/jobs/${realtimeJobId}/start`)
        .set('Authorization', `Bearer ${workerUser.token}`);

      await request(app)
        .post(`/api/v1/jobs/${realtimeJobId}/complete`)
        .set('Authorization', `Bearer ${workerUser.token}`);

      const completedEvent = await completedPromise;

      expect(completedEvent.jobId).toBe(realtimeJobId);
      expect(completedEvent.workerId).toBe(workerUser.id);
      expect(completedEvent.customerId).toBe(customerUser.id);

      // Verify status changes were received in order
      const statuses = statusChanges.map((s) => s.newStatus);
      expect(statuses).toContain(JobStatus.EN_ROUTE);
      expect(statuses).toContain(JobStatus.ARRIVED);
      expect(statuses).toContain(JobStatus.IN_PROGRESS);
      expect(statuses).toContain(JobStatus.COMPLETED);

      customerClient.disconnect();
    });
  });
});
