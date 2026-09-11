import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { DevOTPProvider } from '../src/modules/otp/otp.provider.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { SessionModel } from '../src/modules/sessions/session.model.js';
import { ServiceCategoryModel } from '../src/modules/service-categories/service-category.model.js';
import { SkillModel } from '../src/modules/skills/skill.model.js';
import { JobModel } from '../src/modules/jobs/job.model.js';
import { JobEventModel } from '../src/modules/job-events/job-event.model.js';
import { JobStatus } from '@kaamsetu/types';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

const PHONE_PREFIX = '+9197777';

describe('Job Lifecycle (Phase 4)', () => {
  let customerA: { id: string; token: string };
  let customerB: { id: string; token: string };
  let categoryId: string;
  let skillId: string;

  async function login(phoneSuffix: string): Promise<{ id: string; token: string }> {
    const phone = `${PHONE_PREFIX}${phoneSuffix}`;

    await request(app).post('/api/v1/auth/request-otp').send({ phone });
    const otp = DevOTPProvider.getLastSentOTP(phone)!;
    const res = await request(app).post('/api/v1/auth/verify-otp').send({ phone, otp });

    expect(res.status).toBe(200);
    return { id: res.body.data.user.id, token: res.body.data.accessToken };
  }

  function validJobBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      categoryId,
      requiredSkills: [skillId],
      title: 'Fix leaking kitchen tap',
      description: 'Water is leaking under the sink, need urgent repair',
      location: { type: 'Point', coordinates: [73.8567, 18.5204] },
      address: {
        line: 'Flat 402, Shiv Shanti Heights, Kothrud',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411038',
      },
      preferredTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      urgency: 'TODAY',
      estimatedPrice: 450,
      ...overrides,
    };
  }

  async function createJob(token: string, overrides: Record<string, unknown> = {}) {
    return request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send(validJobBody(overrides));
  }

  beforeAll(async () => {
    await connectMongoDB({ uri: TEST_MONGODB_URI });
    await UserModel.syncIndexes();
    await SessionModel.syncIndexes();
    await ServiceCategoryModel.syncIndexes();
    await SkillModel.syncIndexes();
    await JobModel.syncIndexes();
    await JobEventModel.syncIndexes();

    // Stale data cleanup from earlier aborted runs
    await JobEventModel.deleteMany({});
    await JobModel.deleteMany({});
    await SessionModel.deleteMany({});
    await UserModel.deleteMany({ phoneNumber: { $regex: `^${PHONE_PREFIX}` } });
    await ServiceCategoryModel.deleteMany({ slug: /^test-phase4/ });
    await SkillModel.deleteMany({ slug: /^test-phase4/ });

    const category = await ServiceCategoryModel.create({
      name: 'Phase4 Plumbing',
      slug: 'test-phase4-plumbing',
    });
    categoryId = category._id.toString();

    const skill = await SkillModel.create({
      name: 'Tap Repair',
      slug: 'test-phase4-tap-repair',
      categoryId: category._id,
    });
    skillId = skill._id.toString();

    customerA = await login('0001');
    customerB = await login('0002');
  });

  afterAll(async () => {
    await JobEventModel.deleteMany({});
    await JobModel.deleteMany({});
    await SessionModel.deleteMany({});
    await UserModel.deleteMany({ phoneNumber: { $regex: `^${PHONE_PREFIX}` } });
    await ServiceCategoryModel.deleteMany({ slug: /^test-phase4/ });
    await SkillModel.deleteMany({ slug: /^test-phase4/ });
    await disconnectMongoDB();
  });

  beforeEach(() => {
    DevOTPProvider.clear();
  });

  describe('POST /api/v1/jobs', () => {
    it('creates a job in DRAFT with a CREATED event', async () => {
      const res = await createJob(customerA.token);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(JobStatus.DRAFT);
      expect(res.body.data.customerId).toBe(customerA.id);
      expect(res.body.data.location.type).toBe('Point');
      expect(res.body.data.location.coordinates).toEqual([73.8567, 18.5204]);
      expect(res.body.data.requiredSkills).toEqual([skillId]);

      const events = await JobEventModel.find({ jobId: res.body.data.id });
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('CREATED');
      expect(events[0].newState).toBe(JobStatus.DRAFT);
    });

    it('creates a job directly OPEN when publishImmediately is set, with both events', async () => {
      const res = await createJob(customerA.token, { publishImmediately: true });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe(JobStatus.OPEN);

      const events = await JobEventModel.find({ jobId: res.body.data.id }).sort({
        createdAt: 1,
      });
      expect(events.map((e) => e.eventType)).toEqual(['CREATED', 'PUBLISHED']);
    });

    it('ignores a spoofed customerId from the payload', async () => {
      const res = await createJob(customerA.token, { customerId: customerB.id });

      expect(res.status).toBe(201);
      expect(res.body.data.customerId).toBe(customerA.id);
    });

    it('rejects creation with invalid category', async () => {
      const res = await createJob(customerA.token, {
        categoryId: '507f1f77bcf86cd799439011',
      });

      expect(res.status).toBe(400);
    });

    it('rejects invalid pincode and past preferredTime', async () => {
      const res = await createJob(customerA.token, {
        address: {
          line: 'Flat 402, Some Street',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '12',
        },
      });
      expect(res.status).toBe(422);

      const past = await createJob(customerA.token, {
        preferredTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      });
      expect(past.status).toBe(422);
    });

    it('requires authentication', async () => {
      const res = await request(app).post('/api/v1/jobs').send(validJobBody());
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/jobs/:id', () => {
    let draftJobId: string;

    beforeEach(async () => {
      const res = await createJob(customerA.token);
      draftJobId = res.body.data.id;
    });

    it('updates editable fields while in DRAFT', async () => {
      const res = await request(app)
        .patch(`/api/v1/jobs/${draftJobId}`)
        .set('Authorization', `Bearer ${customerA.token}`)
        .send({ title: 'Fixed leaking kitchen tap urgently', estimatedPrice: 600 });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Fixed leaking kitchen tap urgently');
      expect(res.body.data.estimatedPrice).toBe(600);
      expect(res.body.data.status).toBe(JobStatus.DRAFT);
    });

    it('rejects direct status changes through PATCH with an explicit error', async () => {
      const res = await request(app)
        .patch(`/api/v1/jobs/${draftJobId}`)
        .set('Authorization', `Bearer ${customerA.token}`)
        .send({ status: JobStatus.COMPLETED });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/status.*not allowed|lifecycle/i);

      const job = await JobModel.findById(draftJobId);
      expect(job?.status).toBe(JobStatus.DRAFT);
    });

    it('rejects an empty PATCH body', async () => {
      const res = await request(app)
        .patch(`/api/v1/jobs/${draftJobId}`)
        .set('Authorization', `Bearer ${customerA.token}`)
        .send({});

      expect(res.status).toBe(422);
    });

    it('enforces ownership — another customer cannot patch', async () => {
      const res = await request(app)
        .patch(`/api/v1/jobs/${draftJobId}`)
        .set('Authorization', `Bearer ${customerB.token}`)
        .send({ title: 'Hijacked title' });

      expect(res.status).toBe(403);
    });

    it('blocks edits once the job has entered MATCHING', async () => {
      // Publish twice: DRAFT -> OPEN -> MATCHING is valid per the transition map
      await request(app)
        .post(`/api/v1/jobs/${draftJobId}/publish`)
        .set('Authorization', `Bearer ${customerA.token}`);

      const res = await request(app)
        .patch(`/api/v1/jobs/${draftJobId}`)
        .set('Authorization', `Bearer ${customerA.token}`)
        .send({ title: 'Too late to edit' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/DRAFT and OPEN|cannot be updated/i);
    });
  });

  describe('publish and cancel transitions', () => {
    it('publishes DRAFT -> OPEN and logs PUBLISHED event', async () => {
      const created = await createJob(customerA.token);
      const jobId = created.body.data.id;

      const res = await request(app)
        .post(`/api/v1/jobs/${jobId}/publish`)
        .set('Authorization', `Bearer ${customerA.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(JobStatus.OPEN);

      const events = await JobEventModel.find({ jobId }).sort({ createdAt: 1 });
      expect(events).toHaveLength(2);
      expect(events[1].eventType).toBe('PUBLISHED');
      expect(events[1].previousState).toBe(JobStatus.DRAFT);
      expect(events[1].newState).toBe(JobStatus.OPEN);
    });

    it('rejects publishing twice', async () => {
      const created = await createJob(customerA.token);
      const jobId = created.body.data.id;

      await request(app)
        .post(`/api/v1/jobs/${jobId}/publish`)
        .set('Authorization', `Bearer ${customerA.token}`);

      const res = await request(app)
        .post(`/api/v1/jobs/${jobId}/publish`)
        .set('Authorization', `Bearer ${customerA.token}`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('INVALID_STATE_TRANSITION');
    });

    it('cancels an OPEN job with reason and logs CANCELLED event', async () => {
      const created = await createJob(customerA.token);
      const jobId = created.body.data.id;
      await request(app)
        .post(`/api/v1/jobs/${jobId}/publish`)
        .set('Authorization', `Bearer ${customerA.token}`);

      const res = await request(app)
        .post(`/api/v1/jobs/${jobId}/cancel`)
        .set('Authorization', `Bearer ${customerA.token}`)
        .send({ reason: 'Found someone locally' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(JobStatus.CANCELLED);

      const events = await JobEventModel.find({ jobId }).sort({ createdAt: 1 });
      const last = events[events.length - 1];
      expect(last.eventType).toBe('CANCELLED');
      expect(last.reason).toBe('Found someone locally');
    });

    it('requires a reason when cancelling', async () => {
      const created = await createJob(customerA.token);
      const jobId = created.body.data.id;

      const res = await request(app)
        .post(`/api/v1/jobs/${jobId}/cancel`)
        .set('Authorization', `Bearer ${customerA.token}`)
        .send({});

      expect(res.status).toBe(422);
    });

    it('rejects cancelling a terminal job', async () => {
      const created = await createJob(customerA.token);
      const jobId = created.body.data.id;
      await request(app)
        .post(`/api/v1/jobs/${jobId}/cancel`)
        .set('Authorization', `Bearer ${customerA.token}`)
        .send({ reason: 'Changed my mind' });

      const res = await request(app)
        .post(`/api/v1/jobs/${jobId}/cancel`)
        .set('Authorization', `Bearer ${customerA.token}`)
        .send({ reason: 'Trying again' });

      expect(res.status).toBe(409);
    });

    it('enforces ownership on publish and cancel', async () => {
      const created = await createJob(customerA.token);
      const jobId = created.body.data.id;

      const res1 = await request(app)
        .post(`/api/v1/jobs/${jobId}/publish`)
        .set('Authorization', `Bearer ${customerB.token}`);
      expect(res1.status).toBe(403);

      await request(app)
        .post(`/api/v1/jobs/${jobId}/publish`)
        .set('Authorization', `Bearer ${customerA.token}`);

      const res2 = await request(app)
        .post(`/api/v1/jobs/${jobId}/cancel`)
        .set('Authorization', `Bearer ${customerB.token}`)
        .send({ reason: 'Not my job' });
      expect(res2.status).toBe(403);
    });
  });

  describe('GET /api/v1/jobs/:id', () => {
    it('returns a job for its owner', async () => {
      const created = await createJob(customerA.token);
      const jobId = created.body.data.id;

      const res = await request(app)
        .get(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${customerA.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(jobId);
    });

    it('hides other customers jobs', async () => {
      const created = await createJob(customerA.token);

      const res = await request(app)
        .get(`/api/v1/jobs/${created.body.data.id}`)
        .set('Authorization', `Bearer ${customerB.token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 404 for unknown ids', async () => {
      const res = await request(app)
        .get('/api/v1/jobs/507f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${customerA.token}`);

      expect(res.status).toBe(404);
    });

    it('returns 400 for malformed ids', async () => {
      const res = await request(app)
        .get('/api/v1/jobs/not-an-objectid')
        .set('Authorization', `Bearer ${customerA.token}`);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/jobs (list, filters, cursor pagination)', () => {
    const phoneSuffix = '0003';
    let lister: { id: string; token: string };

    beforeAll(async () => {
      lister = await login(phoneSuffix);

      // 3 DRAFT, 2 OPEN — staggered createdAt via small delays
      for (let i = 0; i < 5; i++) {
        const res = await createJob(lister.token, {
          title: `Phase4 lister job number ${i}`,
        });
        expect(res.status).toBe(201);
        if (i >= 3) {
          await request(app)
            .post(`/api/v1/jobs/${res.body.data.id}/publish`)
            .set('Authorization', `Bearer ${lister.token}`);
        }
        await new Promise((r) => setTimeout(r, 15));
      }
    });

    it('returns only the customer own jobs, newest first', async () => {
      const res = await request(app)
        .get('/api/v1/jobs')
        .set('Authorization', `Bearer ${lister.token}`);

      expect(res.status).toBe(200);
      const jobs = res.body.data;

      expect(jobs.length).toBeGreaterThanOrEqual(5);
      expect(jobs.every((j: { customerId: string }) => j.customerId === lister.id)).toBe(true);

      const dates = jobs.map((j: { createdAt: string }) => new Date(j.createdAt).getTime());
      expect(dates).toEqual([...dates].sort((a, b) => b - a));
    });

    it('filters by status', async () => {
      const res = await request(app)
        .get('/api/v1/jobs?status=OPEN')
        .set('Authorization', `Bearer ${lister.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(
        res.body.data.every((j: { status: string }) => j.status === JobStatus.OPEN)
      ).toBe(true);
    });

    it('filters by category', async () => {
      const res = await request(app)
        .get(`/api/v1/jobs?categoryId=${categoryId}`)
        .set('Authorization', `Bearer ${lister.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
      expect(
        res.body.data.every((j: { categoryId: string }) => j.categoryId === categoryId)
      ).toBe(true);
    });

    it('paginates with an opaque cursor and no duplicates', async () => {
      const page1 = await request(app)
        .get('/api/v1/jobs?limit=2')
        .set('Authorization', `Bearer ${lister.token}`);

      expect(page1.status).toBe(200);
      expect(page1.body.data).toHaveLength(2);
      expect(page1.body.pagination.hasMore).toBe(true);
      expect(page1.body.pagination.nextCursor).toBeTruthy();

      const page2 = await request(app)
        .get(
          `/api/v1/jobs?limit=2&cursor=${encodeURIComponent(page1.body.pagination.nextCursor)}`
        )
        .set('Authorization', `Bearer ${lister.token}`);

      expect(page2.status).toBe(200);
      expect(page2.body.data).toHaveLength(2);

      const ids = new Set([
        ...page1.body.data.map((j: { id: string }) => j.id),
        ...page2.body.data.map((j: { id: string }) => j.id),
      ]);
      expect(ids.size).toBe(4);

      const page3 = await request(app)
        .get(
          `/api/v1/jobs?limit=2&cursor=${encodeURIComponent(page2.body.pagination.nextCursor)}`
        )
        .set('Authorization', `Bearer ${lister.token}`);
      expect(page3.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('rejects invalid filter values', async () => {
      const badStatus = await request(app)
        .get('/api/v1/jobs?status=NOT_A_STATUS')
        .set('Authorization', `Bearer ${lister.token}`);
      expect(badStatus.status).toBe(422);

      const badLimit = await request(app)
        .get('/api/v1/jobs?limit=999')
        .set('Authorization', `Bearer ${lister.token}`);
      expect(badLimit.status).toBe(422);
    });
  });

  describe('GET /api/v1/jobs/:id/events', () => {
    it('returns the full chronological audit trail', async () => {
      const created = await createJob(customerA.token);
      const jobId = created.body.data.id;

      await request(app)
        .patch(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${customerA.token}`)
        .send({ estimatedPrice: 500 });
      await request(app)
        .post(`/api/v1/jobs/${jobId}/publish`)
        .set('Authorization', `Bearer ${customerA.token}`);
      await request(app)
        .post(`/api/v1/jobs/${jobId}/cancel`)
        .set('Authorization', `Bearer ${customerA.token}`)
        .send({ reason: 'Plan changed' });

      const res = await request(app)
        .get(`/api/v1/jobs/${jobId}/events`)
        .set('Authorization', `Bearer ${customerA.token}`);

      expect(res.status).toBe(200);
      const events = res.body.data;
      expect(events).toHaveLength(4);
      expect(events.map((e: { eventType: string }) => e.eventType)).toEqual([
        'CREATED',
        'UPDATED',
        'PUBLISHED',
        'CANCELLED',
      ]);

      // Chain integrity: each event's previousState matches the prior newState
      for (let i = 1; i < events.length; i++) {
        expect(events[i].previousState).toBe(events[i - 1].newState);
      }
      expect(events[0].previousState).toBeNull();
    });

    it('enforces ownership on the event history', async () => {
      const created = await createJob(customerA.token);

      const res = await request(app)
        .get(`/api/v1/jobs/${created.body.data.id}/events`)
        .set('Authorization', `Bearer ${customerB.token}`);

      expect(res.status).toBe(403);
    });
  });
});
