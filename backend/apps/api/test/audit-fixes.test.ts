import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../src/app.js';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { userRepository } from '../src/modules/users/user.repository.js';
import { serviceCategoryRepository } from '../src/modules/service-categories/service-category.repository.js';
import { skillRepository } from '../src/modules/skills/skill.repository.js';
import { sessionRepository } from '../src/modules/sessions/session.repository.js';
import { jobRepository } from '../src/modules/jobs/job.repository.js';
import { transactionRepository } from '../src/modules/transactions/transaction.repository.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { SessionModel } from '../src/modules/sessions/session.model.js';
import { JobModel } from '../src/modules/jobs/job.model.js';
import { JobEventModel } from '../src/modules/job-events/job-event.model.js';
import { JobOfferModel } from '../src/modules/job-offers/job-offer.model.js';
import { TransactionModel } from '../src/modules/transactions/transaction.model.js';
import { ExpenseModel } from '../src/modules/expenses/expense.model.js';
import { ServiceCategoryModel } from '../src/modules/service-categories/service-category.model.js';
import { SkillModel } from '../src/modules/skills/skill.model.js';
import {
  UserRole,
  JobStatus,
  JobUrgency,
  JobOfferStatus,
  TransactionType,
} from '@kaamsetu/types';
import { signAccessToken } from '../src/modules/auth/token.util.js';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

const PHONE_PREFIX = '+9198765'; // isolated prefix (5 digits) + 5-digit suffix = valid 10 digits
const SLUG_PREFIX = 'auditfix-'; // unique prefix — must not overlap other suites' slug cleanup patterns

describe('Audit fixes regression suite', () => {
  let customer: { id: string; token: string };
  let worker1: { id: string; token: string };
  let worker2: { id: string; token: string };
  let categoryId: string;
  let skillId: string;

  beforeAll(async () => {
    await connectMongoDB({ uri: TEST_MONGODB_URI });
    await UserModel.syncIndexes();
    await SessionModel.syncIndexes();
    await JobModel.syncIndexes();
    await JobEventModel.syncIndexes();
    await JobOfferModel.syncIndexes();
    await TransactionModel.syncIndexes();
    await ExpenseModel.syncIndexes();
    await ServiceCategoryModel.syncIndexes();
    await SkillModel.syncIndexes();

    // Precise cleanup scoped to this suite's phone prefix
    const staleUsers = await UserModel.find({
      phoneNumber: { $regex: `^\\${PHONE_PREFIX}` },
    })
      .select('_id')
      .lean();
    const staleIds = staleUsers.map((u) => u._id);
    if (staleIds.length > 0) {
      // Native collection calls bypass the ledger immutability hooks (test cleanup only)
      await TransactionModel.collection.deleteMany({ workerId: { $in: staleIds } });
      await ExpenseModel.deleteMany({ workerId: { $in: staleIds } });
      await JobEventModel.deleteMany({ actorId: { $in: staleIds } });
      await JobOfferModel.deleteMany({ workerId: { $in: staleIds } });
      await JobModel.deleteMany({ customerId: { $in: staleIds } });
      await SessionModel.deleteMany({ userId: { $in: staleIds } });
    }
    await UserModel.deleteMany({ phoneNumber: { $regex: `^\\${PHONE_PREFIX}` } });
    await ServiceCategoryModel.deleteMany({ slug: { $regex: `^${SLUG_PREFIX}` } });
    await SkillModel.deleteMany({ slug: { $regex: `^${SLUG_PREFIX}` } });

    const cat = await serviceCategoryRepository.create({
      name: 'Phase9 Audit Category',
      slug: `${SLUG_PREFIX}audit`,
      active: true,
    });
    categoryId = cat.id;

    const sk = await skillRepository.create({
      name: 'Phase9 Audit Skill',
      slug: `${SLUG_PREFIX}audit-skill`,
      categoryId,
      active: true,
    });
    skillId = sk.id;

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
      return { id: u.id, token };
    }

    customer = await createUserAndToken('00001', UserRole.CUSTOMER);
    worker1 = await createUserAndToken('00002', UserRole.WORKER);
    worker2 = await createUserAndToken('00003', UserRole.WORKER);
  });

  afterAll(async () => {
    const ids = [customer?.id, worker1?.id, worker2?.id].filter(
      (v): v is string => Boolean(v)
    );
    if (ids.length > 0) {
      const oid = ids.map((id) => new Types.ObjectId(id));
      await TransactionModel.collection.deleteMany({ workerId: { $in: oid } });
      await ExpenseModel.deleteMany({ workerId: { $in: oid } });
      await JobEventModel.deleteMany({ actorId: { $in: oid } });
      await JobOfferModel.deleteMany({ workerId: { $in: oid } });
      await JobModel.deleteMany({ customerId: { $in: oid } });
      await SessionModel.deleteMany({ userId: { $in: oid } });
    }
    await UserModel.deleteMany({ phoneNumber: { $regex: `^\\${PHONE_PREFIX}` } });
    await ServiceCategoryModel.deleteMany({ slug: { $regex: `^${SLUG_PREFIX}` } });
    await SkillModel.deleteMany({ slug: { $regex: `^${SLUG_PREFIX}` } });
    await disconnectMongoDB();
  });

  function jobDocInput(overrides: Record<string, unknown> = {}) {
    return {
      customerId: new Types.ObjectId(customer.id),
      categoryId: new Types.ObjectId(categoryId),
      requiredSkills: [new Types.ObjectId(skillId)],
      title: 'Phase9 audit job',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      address: {
        line: 'MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
      },
      preferredTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      urgency: JobUrgency.TODAY,
      status: JobStatus.OPEN,
      ...overrides,
    } as const;
  }

  describe('Bug 1: worker job listings are scoped to OPEN or assigned jobs only', () => {
    let openJobId: string;
    let assignedJobId: string;

    beforeAll(async () => {
      const openJob = await JobModel.create(jobDocInput());
      openJobId = openJob._id.toString();

      const assignedJob = await JobModel.create(
        jobDocInput({ status: JobStatus.DRAFT })
      );
      assignedJobId = assignedJob._id.toString();

      // Assign the second job to worker1 and move it past OPEN
      const updated = await jobRepository.updateStatus(
        assignedJobId,
        JobStatus.ACCEPTED,
        { assignedWorkerId: worker1.id }
      );
      expect(updated?.assignedWorkerId).toBe(worker1.id);
    });

    it('worker requesting ?status=ACCEPTED only sees jobs assigned to them', async () => {
      const res = await request(app)
        .get('/api/v1/jobs?status=ACCEPTED')
        .set('Authorization', `Bearer ${worker1.token}`);

      expect(res.status).toBe(200);
      const jobs = res.body.data.jobs;
      for (const job of jobs) {
        expect(job.assignedWorkerId).toBe(worker1.id);
      }
      expect(jobs.some((j: { id: string }) => j.id === assignedJobId)).toBe(true);
      expect(jobs.some((j: { id: string }) => j.id === openJobId)).toBe(false);
    });

    it('worker default listing returns only OPEN jobs', async () => {
      const res = await request(app)
        .get('/api/v1/jobs')
        .set('Authorization', `Bearer ${worker1.token}`);

      expect(res.status).toBe(200);
      const jobs = res.body.data.jobs;
      expect(jobs.some((j: { id: string }) => j.id === openJobId)).toBe(true);
      expect(jobs.some((j: { id: string }) => j.id === assignedJobId)).toBe(false);
    });

    it('worker ?status=ASSIGNED returns only their assigned jobs; other workers see none', async () => {
      const res1 = await request(app)
        .get('/api/v1/jobs?status=ASSIGNED')
        .set('Authorization', `Bearer ${worker1.token}`);

      expect(res1.status).toBe(200);
      const jobs1 = res1.body.data.jobs;
      expect(jobs1).toHaveLength(1);
      expect(jobs1[0].id).toBe(assignedJobId);
      expect(jobs1[0].assignedWorkerId).toBe(worker1.id);

      const res2 = await request(app)
        .get('/api/v1/jobs?status=ASSIGNED')
        .set('Authorization', `Bearer ${worker2.token}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.jobs).toHaveLength(0);
    });

    it('customer passing ?status=ASSIGNED still sees only their own jobs', async () => {
      const res = await request(app)
        .get('/api/v1/jobs?status=ASSIGNED')
        .set('Authorization', `Bearer ${customer.token}`);

      expect(res.status).toBe(200);
      for (const job of res.body.data.jobs) {
        expect(job.customerId).toBe(customer.id);
      }
    });
  });

  describe('Bug 2: expense update/delete keeps the immutable ledger in sync', () => {
    let expenseId: string;

    async function ledgerSumForExpense(id: string): Promise<number> {
      const txs = await TransactionModel.find({
        'metadata.expenseId': id,
        type: TransactionType.EXPENSE,
      })
        .lean()
        .exec();
      return txs.reduce((sum, tx) => sum + tx.amount, 0);
    }

    it('createExpense writes a matching positive EXPENSE ledger entry', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${worker1.token}`)
        .send({ category: 'FUEL', amount: 10000 });

      expect(res.status).toBe(201);
      expenseId = res.body.data.id;

      const sum = await ledgerSumForExpense(expenseId);
      expect(sum).toBe(10000);
    });

    it('updateExpense appends an offsetting delta so the ledger total tracks the new amount', async () => {
      const res = await request(app)
        .patch(`/api/v1/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${worker1.token}`)
        .send({ amount: 6000 });

      expect(res.status).toBe(200);
      expect(res.body.data.amount).toBe(6000);

      const sum = await ledgerSumForExpense(expenseId);
      expect(sum).toBe(6000); // 10000 original + (-4000) delta
    });

    it('deleteExpense voids the ledger so the expense no longer counts against earnings', async () => {
      const res = await request(app)
        .delete(`/api/v1/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${worker1.token}`);

      expect(res.status).toBe(200);

      const sum = await ledgerSumForExpense(expenseId);
      expect(sum).toBe(0); // 6000 + (-6000) void entry

      // Soft-deleted expense no longer appears in listings
      const list = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${worker1.token}`);
      expect(
        list.body.data.items.some((e: { id: string }) => e.id === expenseId)
      ).toBe(false);
    });
  });

  describe('Bug 3: OFFER_ACCEPTED event records the true previous job state', () => {
    it('accepting an offer on an OPEN job logs previousState=OPEN', async () => {
      const job = await JobModel.create(jobDocInput()); // status OPEN, unassigned
      const offer = await JobOfferModel.create({
        jobId: job._id,
        workerId: new Types.ObjectId(worker2.id),
        distanceKm: 2,
        matchScore: 80,
        scoreBreakdown: {
          skillScore: 100,
          distanceScore: 90,
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
        .post(`/api/v1/offers/${offer._id}/accept`)
        .set('Authorization', `Bearer ${worker2.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.job.status).toBe(JobStatus.ACCEPTED);

      const event = await JobEventModel.findOne({
        jobId: job._id,
        eventType: 'OFFER_ACCEPTED',
      });
      expect(event).toBeDefined();
      expect(event?.previousState).toBe(JobStatus.OPEN);
      expect(event?.newState).toBe(JobStatus.ACCEPTED);
    });
  });

  describe('Bug 4: completing a job records the JOB_REVENUE ledger entry', () => {
    it('job completion writes an integer-paise revenue entry with a stable referenceId', async () => {
      const job = await JobModel.create(
        jobDocInput({
          status: JobStatus.IN_PROGRESS,
          assignedWorkerId: new Types.ObjectId(worker1.id),
          estimatedPrice: 123.45,
        })
      );

      const res = await request(app)
        .post(`/api/v1/jobs/${job._id}/complete`)
        .set('Authorization', `Bearer ${worker1.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.job.status).toBe(JobStatus.COMPLETED);

      const revenue = await TransactionModel.findOne({
        referenceId: `job:${job._id.toString()}:revenue`,
      });
      expect(revenue).toBeDefined();
      expect(revenue?.type).toBe(TransactionType.JOB_REVENUE);
      expect(revenue?.amount).toBe(12345); // integer paise, never float
    });
  });

  describe('Bug 5: expense aggregation sums signed deltas and excludes platform fees', () => {
    it('aggregateWorkerExpenses sums signed EXPENSE entries and ignores PLATFORM_FEE entries', async () => {
      await transactionRepository.create({
        workerId: worker2.id,
        type: TransactionType.EXPENSE,
        amount: 5000,
        currency: 'INR',
        referenceId: `expense:p9-suite-1-${Date.now()}`,
      });
      await transactionRepository.create({
        workerId: worker2.id,
        type: TransactionType.EXPENSE,
        amount: -2000, // offsetting correction delta
        currency: 'INR',
        referenceId: `expense:p9-suite-2-${Date.now()}`,
      });
      await transactionRepository.create({
        workerId: worker2.id,
        type: TransactionType.PLATFORM_FEE,
        amount: 3000,
        currency: 'INR',
        referenceId: `fee:p9-suite-1-${Date.now()}`,
      });

      const total = await transactionRepository.aggregateWorkerExpenses(worker2.id);
      expect(total).toBe(3000); // 5000 + (-2000), PLATFORM_FEE excluded
    });
  });
});
