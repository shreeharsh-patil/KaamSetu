import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { SessionModel } from '../src/modules/sessions/session.model.js';
import { WorkerProfileModel } from '../src/modules/worker-profiles/worker-profile.model.js';
import { JobModel } from '../src/modules/jobs/job.model.js';
import { JobEventModel } from '../src/modules/job-events/job-event.model.js';
import { ExpenseModel } from '../src/modules/expenses/expense.model.js';
import { TransactionModel } from '../src/modules/transactions/transaction.model.js';
import { ServiceCategoryModel } from '../src/modules/service-categories/service-category.model.js';
import { SkillModel } from '../src/modules/skills/skill.model.js';
import { userRepository } from '../src/modules/users/user.repository.js';
import { sessionRepository } from '../src/modules/sessions/session.repository.js';
import { serviceCategoryRepository } from '../src/modules/service-categories/service-category.repository.js';
import { skillRepository } from '../src/modules/skills/skill.repository.js';
import { jobService } from '../src/modules/jobs/job.service.js';
import { Types } from 'mongoose';
import {
  UserRole,
  JobStatus,
  ExpenseCategory,
  TransactionType,
} from '@kaamsetu/types';
import { signAccessToken } from '../src/modules/auth/token.util.js';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

const PHONE_PREFIX = '+91911111';

describe('Earnings, Expenses & Financial Ledger (Phase 8)', () => {
  let customerUser: { id: string; token: string };
  let workerUser1: { id: string; token: string };
  let workerUser2: { id: string; token: string };
  let adminUser: { id: string; token: string };
  let categoryId: string;
  let skillId: string;
  let completedJobId: string;

  beforeAll(async () => {
    await connectMongoDB({ uri: TEST_MONGODB_URI });
    await UserModel.syncIndexes();
    await SessionModel.syncIndexes();
    await WorkerProfileModel.syncIndexes();
    await JobModel.syncIndexes();
    await JobEventModel.syncIndexes();
    await ExpenseModel.syncIndexes();
    await TransactionModel.syncIndexes();
    await ServiceCategoryModel.syncIndexes();
    await SkillModel.syncIndexes();

    // Isolated test cleanup
    await UserModel.deleteMany({ phoneNumber: /^\+91911111/ });
    await ServiceCategoryModel.deleteMany({ slug: /^phase8-/ });
    await SkillModel.deleteMany({ slug: /^phase8-/ });
    await TransactionModel.collection.deleteMany({
      referenceId: { $regex: /^(job|expense|bonus|mock|adj)/ },
    });

    // 1. Create Category and Skill
    const cat = await serviceCategoryRepository.create({
      name: 'Phase8 Plumbing Services',
      slug: 'phase8-plumbing',
      active: true,
    });
    categoryId = cat.id;

    const sk = await skillRepository.create({
      name: 'Pipe Leakage Fix',
      slug: 'phase8-pipe-fix',
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
        refreshTokenHash: `p8-hash-${phoneSuffix}`,
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
    adminUser = await createUserAndToken('0004', UserRole.ADMIN);

    // Create worker profile for worker 1
    await WorkerProfileModel.create({
      userId: workerUser1.id,
      displayName: 'Ramesh Plumber',
      skills: [{ skillId, level: 'EXPERT', verified: true }],
      languages: ['hi', 'en'],
      serviceLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      serviceRadiusKm: 15,
      availabilityStatus: 'AVAILABLE',
      rating: { average: 4.8, count: 25 },
      pricing: { hourlyRate: 40000 },
      verificationStatus: 'VERIFIED',
    });

    // 3. Create, start, and complete a job for worker1 to test job completion revenue integration
    const draftJob = await jobService.createJob(customerUser.id, UserRole.CUSTOMER, {
      categoryId,
      requiredSkills: [skillId],
      title: 'Kitchen Tap Burst Repair',
      description: 'Urgent tap repair needed in kitchen',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      address: {
        line: 'Flat 402, Green Glen',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560103',
      },
      preferredTime: new Date(Date.now() + 3600000).toISOString(),
      estimatedPrice: 750, // ₹750 = 75000 paise
    });

    await jobService.publishJob(draftJob.id, { id: customerUser.id, role: UserRole.CUSTOMER });

    // Assign to workerUser1 and advance state machine to COMPLETED
    await JobModel.updateOne(
      { _id: draftJob.id },
      { $set: { assignedWorkerId: workerUser1.id, status: JobStatus.ACCEPTED } }
    );

    await jobService.startTravel(draftJob.id, workerUser1.id);
    await jobService.arrive(draftJob.id, workerUser1.id);
    await jobService.startJob(draftJob.id, workerUser1.id);

    // Complete job - triggers JOB_REVENUE transaction
    const completedJob = await jobService.completeJob(draftJob.id, workerUser1.id);
    completedJobId = completedJob.id;
  });

  afterAll(async () => {
    // Cleanup records created for this suite
    await UserModel.deleteMany({ phoneNumber: /^\+91911111/ });
    await ServiceCategoryModel.deleteMany({ slug: /^phase8-/ });
    await SkillModel.deleteMany({ slug: /^phase8-/ });
    await ExpenseModel.deleteMany({ workerId: { $in: [workerUser1.id, workerUser2.id] } });
    // Bypass Mongoose immutability hook for test tear-down cleanup via raw collection
    await TransactionModel.collection.deleteMany({
      workerId: {
        $in: [new Types.ObjectId(workerUser1.id), new Types.ObjectId(workerUser2.id)],
      },
    });
    if (completedJobId) {
      await JobModel.deleteOne({ _id: completedJobId });
      await JobEventModel.deleteMany({ jobId: completedJobId });
    }
    await disconnectMongoDB();
  });

  describe('1. Monetary Representation & Zero Floating-Point Accumulation', () => {
    it('stores amounts strictly as integer paise and rejects floating-point amounts', async () => {
      // 499.99 should fail validation because paise must be an integer
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${workerUser1.token}`)
        .send({
          category: 'FUEL',
          amount: 499.99, // Floating point amount
          note: 'Fuel for bike',
        });

      expect([400, 422]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('rejects zero and negative amounts', async () => {
      const resZero = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${workerUser1.token}`)
        .send({
          category: 'FUEL',
          amount: 0,
        });
      expect([400, 422]).toContain(resZero.status);

      const resNegative = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${workerUser1.token}`)
        .send({
          category: 'FUEL',
          amount: -5000,
        });
      expect([400, 422]).toContain(resNegative.status);
    });

    it('successfully accepts integer paise (e.g. ₹499.99 = 49999 paise)', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${workerUser1.token}`)
        .send({
          category: 'MATERIAL',
          amount: 49999, // ₹499.99 in integer paise
          currency: 'INR',
          note: 'Brass valve replacement',
          receipt: {
            url: 'https://cdn.kaamsetu.com/receipts/rec_01.jpg',
            mimeType: 'image/jpeg',
            sizeBytes: 104200,
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(49999);
      expect(Number.isInteger(res.body.data.amount)).toBe(true);
      expect(res.body.data.currency).toBe('INR');
      expect(res.body.data.category).toBe(ExpenseCategory.MATERIAL);
      expect(res.body.data.receipt.url).toBe('https://cdn.kaamsetu.com/receipts/rec_01.jpg');
    });
  });

  describe('2. Expense Logging & Automatic Ledger Synchronization', () => {
    let createdExpenseId: string;

    it('logs an expense against an assigned job and writes an immutable ledger entry', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${workerUser1.token}`)
        .send({
          jobId: completedJobId,
          category: 'TOOL',
          amount: 15000, // ₹150.00
          note: 'Pipe wrench grip replacement',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workerId).toBe(workerUser1.id);
      expect(res.body.data.jobId).toBe(completedJobId);
      expect(res.body.data.amount).toBe(15000);

      createdExpenseId = res.body.data.id;

      // Verify that an immutable ledger transaction was atomically created
      const tx = await TransactionModel.findOne({
        referenceId: `expense:${createdExpenseId}`,
      });
      expect(tx).toBeDefined();
      expect(tx?.workerId.toString()).toBe(workerUser1.id);
      expect(tx?.type).toBe(TransactionType.EXPENSE);
      expect(tx?.amount).toBe(15000);
      expect(tx?.metadata?.['expenseId']).toBe(createdExpenseId);
    });

    it('blocks a worker from logging an expense against another worker’s job', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${workerUser2.token}`) // workerUser2 is not assigned to completedJobId
        .send({
          jobId: completedJobId,
          category: 'FUEL',
          amount: 5000,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('lists expenses with cursor pagination and category filtering', async () => {
      // Create additional expenses for worker1
      await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${workerUser1.token}`)
        .send({ category: 'PARKING', amount: 3000, note: 'Parking fee' });

      await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${workerUser1.token}`)
        .send({ category: 'FUEL', amount: 12000, note: 'Petrol' });

      // List all expenses
      const listRes = await request(app)
        .get('/api/v1/expenses?limit=10')
        .set('Authorization', `Bearer ${workerUser1.token}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      expect(listRes.body.data.items.length).toBeGreaterThanOrEqual(3);

      // Filter by category
      const filterRes = await request(app)
        .get('/api/v1/expenses?category=FUEL')
        .set('Authorization', `Bearer ${workerUser1.token}`);

      expect(filterRes.status).toBe(200);
      expect(filterRes.body.data.items.every((e: { category: string }) => e.category === 'FUEL')).toBe(true);
    });

    it('enforces worker access isolation on listing expenses', async () => {
      // workerUser2 should not see any of workerUser1’s expenses
      const res = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${workerUser2.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(0);
    });

    it('updates an existing expense note, category, or amount', async () => {
      const res = await request(app)
        .patch(`/api/v1/expenses/${createdExpenseId}`)
        .set('Authorization', `Bearer ${workerUser1.token}`)
        .send({
          note: 'Updated pipe wrench grip replacement note',
          amount: 17500, // ₹175.00
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.note).toBe('Updated pipe wrench grip replacement note');
      expect(res.body.data.amount).toBe(17500);
    });

    it('prevents another worker from updating an expense', async () => {
      const res = await request(app)
        .patch(`/api/v1/expenses/${createdExpenseId}`)
        .set('Authorization', `Bearer ${workerUser2.token}`)
        .send({ note: 'Malicious update attempt' });

      expect(res.status).toBe(403);
    });

    it('soft deletes an expense and excludes it from future queries', async () => {
      // Create temporary expense to delete
      const createRes = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${workerUser1.token}`)
        .send({ category: 'OTHER', amount: 2500, note: 'To be deleted' });

      const expenseToDeleteId = createRes.body.data.id;

      // Soft delete
      const delRes = await request(app)
        .delete(`/api/v1/expenses/${expenseToDeleteId}`)
        .set('Authorization', `Bearer ${workerUser1.token}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.message).toBe('Expense deleted successfully');

      // Verify it is not in the active expenses list
      const listRes = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${workerUser1.token}`);

      const found = listRes.body.data.items.some((e: { id: string }) => e.id === expenseToDeleteId);
      expect(found).toBe(false);

      // Verify soft delete flag in DB
      const dbDoc = await ExpenseModel.findById(expenseToDeleteId);
      expect(dbDoc?.deletedAt).not.toBeNull();
    });

    it('prevents another worker from deleting an expense', async () => {
      const res = await request(app)
        .delete(`/api/v1/expenses/${createdExpenseId}`)
        .set('Authorization', `Bearer ${workerUser2.token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('3. Financial Ledger Immutability & Access Control', () => {
    it('verifies that job completion automatically generated an immutable JOB_REVENUE ledger entry', async () => {
      const tx = await TransactionModel.findOne({
        workerId: workerUser1.id,
        jobId: completedJobId,
        type: TransactionType.JOB_REVENUE,
      });

      expect(tx).toBeDefined();
      expect(tx?.amount).toBe(75000); // ₹750 = 75000 paise
      expect(tx?.referenceId).toBe(`job:${completedJobId}:revenue`);
      expect(tx?.currency).toBe('INR');
    });

    it('STRICT IMMUTABILITY: blocks direct update operations at Mongoose schema level', async () => {
      const tx = await TransactionModel.findOne({ workerId: workerUser1.id });
      expect(tx).toBeDefined();

      await expect(
        TransactionModel.updateOne({ _id: tx?._id }, { $set: { amount: 999999 } })
      ).rejects.toThrow('Financial ledger entries are strictly immutable');

      await expect(
        TransactionModel.findOneAndUpdate({ _id: tx?._id }, { $set: { amount: 999999 } })
      ).rejects.toThrow('Financial ledger entries are strictly immutable');
    });

    it('STRICT IMMUTABILITY: blocks direct delete operations at Mongoose schema level', async () => {
      const tx = await TransactionModel.findOne({ workerId: workerUser1.id });
      expect(tx).toBeDefined();

      await expect(
        TransactionModel.deleteOne({ _id: tx?._id })
      ).rejects.toThrow('Financial ledger entries are strictly immutable');

      await expect(
        TransactionModel.findOneAndDelete({ _id: tx?._id })
      ).rejects.toThrow('Financial ledger entries are strictly immutable');
    });

    it('GET /api/v1/transactions: worker views their own ledger history with cursor pagination', async () => {
      const res = await request(app)
        .get('/api/v1/transactions?limit=20')
        .set('Authorization', `Bearer ${workerUser1.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);

      // Verify all transactions belong to workerUser1
      expect(
        res.body.data.items.every((tx: { workerId: string }) => tx.workerId === workerUser1.id)
      ).toBe(true);

      // Verify transaction types present (JOB_REVENUE, EXPENSE)
      const types = res.body.data.items.map((t: { type: string }) => t.type);
      expect(types).toContain(TransactionType.JOB_REVENUE);
      expect(types).toContain(TransactionType.EXPENSE);
    });

    it('workerUser2 cannot view workerUser1 transactions (strict tenant isolation)', async () => {
      const res = await request(app)
        .get('/api/v1/transactions')
        .set('Authorization', `Bearer ${workerUser2.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(0);
    });
  });

  describe('4. Privileged Admin Adjustment Workflow', () => {
    it('blocks non-admin users from creating adjustments', async () => {
      const res = await request(app)
        .post('/api/v1/transactions/adjustment')
        .set('Authorization', `Bearer ${workerUser1.token}`)
        .send({
          workerId: workerUser1.id,
          amount: 5000,
          reason: 'Unauthorized adjustment attempt',
        });

      expect(res.status).toBe(403);
    });

    it('allows administrator to post an adjustment transaction (e.g. bonus or dispute resolution)', async () => {
      const res = await request(app)
        .post('/api/v1/transactions/adjustment')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          workerId: workerUser1.id,
          amount: 10000, // ₹100.00 credit bonus
          reason: 'Excellent customer service performance incentive',
          referenceId: `bonus:${Date.now()}`,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workerId).toBe(workerUser1.id);
      expect(res.body.data.type).toBe(TransactionType.ADJUSTMENT);
      expect(res.body.data.amount).toBe(10000);
      expect(res.body.data.metadata.reason).toBe('Excellent customer service performance incentive');
    });

    it('admin can list all transactions across workers', async () => {
      const res = await request(app)
        .get('/api/v1/transactions')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });
  });

  describe('5. Worker Earnings Summary & Zero Floating-Point Accumulation', () => {
    it('calculates earnings summary correctly with zero floating point accumulation for time ranges', async () => {
      // Worker 1 has:
      // - Job revenue: ₹750 = 75000 paise
      // - Active expenses: 49999 + 17500 + 3000 + 12000 = 82499 paise
      // Let's create an additional completed job to make net earnings positive and verify exact paise math:
      // Payout ₹2000 = 200000 paise
      await TransactionModel.create({
        workerId: workerUser1.id,
        type: TransactionType.JOB_REVENUE,
        amount: 200000, // ₹2000.00
        currency: 'INR',
        referenceId: `job:mock-payout-2-${Date.now()}:revenue`,
        createdAt: new Date(),
      });

      const res = await request(app)
        .get('/api/v1/earnings/summary?timeRange=month')
        .set('Authorization', `Bearer ${workerUser1.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.currency).toBe('INR');
      expect(data.timeRange).toBe('month');

      // Gross revenue = 75000 + 200000 = 275000 paise
      expect(data.grossRevenue).toBe(275000);
      expect(Number.isInteger(data.grossRevenue)).toBe(true);

      // Total active expenses = 49999 + 17500 + 3000 + 12000 = 82499 paise
      expect(data.totalExpenses).toBe(82499);
      expect(Number.isInteger(data.totalExpenses)).toBe(true);

      // Net earnings = 275000 - 82499 = 192501 paise (Exact integer!)
      expect(data.netEarnings).toBe(192501);
      expect(Number.isInteger(data.netEarnings)).toBe(true);

      // Total jobs completed = 1
      expect(data.totalJobs).toBe(1);

      // Hours worked > 0
      expect(data.hoursWorked).toBeGreaterThan(0);

      // Earnings per hour should be an integer in paise/hr
      expect(Number.isInteger(data.earningsPerHour)).toBe(true);
      expect(data.earningsPerHour).toBeGreaterThan(0);
    });

    it('calculates earnings summary for "today", "week", and "custom" time ranges', async () => {
      // today
      const resToday = await request(app)
        .get('/api/v1/earnings/summary?timeRange=today')
        .set('Authorization', `Bearer ${workerUser1.token}`);
      expect(resToday.status).toBe(200);
      expect(resToday.body.data.timeRange).toBe('today');
      expect(resToday.body.data.grossRevenue).toBe(275000);

      // week
      const resWeek = await request(app)
        .get('/api/v1/earnings/summary?timeRange=week')
        .set('Authorization', `Bearer ${workerUser1.token}`);
      expect(resWeek.status).toBe(200);
      expect(resWeek.body.data.timeRange).toBe('week');

      // custom range
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const resCustom = await request(app)
        .get(`/api/v1/earnings/summary?timeRange=custom&startDate=${yesterday}&endDate=${tomorrow}`)
        .set('Authorization', `Bearer ${workerUser1.token}`);
      expect(resCustom.status).toBe(200);
      expect(resCustom.body.data.timeRange).toBe('custom');
      expect(resCustom.body.data.grossRevenue).toBe(275000);
    });

    it('returns zero earnings cleanly for worker with no activity', async () => {
      const res = await request(app)
        .get('/api/v1/earnings/summary?timeRange=month')
        .set('Authorization', `Bearer ${workerUser2.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.grossRevenue).toBe(0);
      expect(res.body.data.totalExpenses).toBe(0);
      expect(res.body.data.netEarnings).toBe(0);
      expect(res.body.data.totalJobs).toBe(0);
      expect(res.body.data.hoursWorked).toBe(0);
      expect(res.body.data.earningsPerHour).toBe(0);
    });
  });

  describe('6. Job-Level Earnings Breakdown', () => {
    it('lists completed jobs with financial breakdown (revenue, job-specific expenses, net)', async () => {
      const res = await request(app)
        .get('/api/v1/earnings/jobs?limit=10')
        .set('Authorization', `Bearer ${workerUser1.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(1);

      const jobItem = res.body.data.items[0];
      expect(jobItem.jobId).toBe(completedJobId);
      expect(jobItem.title).toBe('Kitchen Tap Burst Repair');
      expect(jobItem.revenue).toBe(75000); // ₹750 = 75000 paise
      expect(jobItem.expenses).toBe(17500); // Expense logged against this jobId
      expect(jobItem.netEarnings).toBe(75000 - 17500); // 57500 paise
      expect(jobItem.durationHours).toBeGreaterThan(0);
    });

    it('returns empty list for worker with no completed jobs', async () => {
      const res = await request(app)
        .get('/api/v1/earnings/jobs')
        .set('Authorization', `Bearer ${workerUser2.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(0);
    });
  });
});
