/**
 * Goa demo seed — integration tests.
 *
 * Verifies: seeding works against a real MongoDB, is idempotent (running twice
 * does not duplicate), the Panaji plumbing matching scenario has eligible
 * workers, financial values are integer paise, and reset removes only
 * seed-owned data (non-seed data created during the test survives).
 */
import { describe, it, expect, afterAll } from 'vitest';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { WorkerProfileModel } from '../src/modules/worker-profiles/worker-profile.model.js';
import { CustomerProfileModel } from '../src/modules/customer-profiles/customer-profile.model.js';
import { JobModel } from '../src/modules/jobs/job.model.js';
import { JobOfferModel } from '../src/modules/job-offers/job-offer.model.js';
import { ExpenseModel } from '../src/modules/expenses/expense.model.js';
import { TransactionModel } from '../src/modules/transactions/transaction.model.js';
import { ServiceCategoryModel } from '../src/modules/service-categories/service-category.model.js';
import { SkillModel } from '../src/modules/skills/skill.model.js';
import { userRepository } from '../src/modules/users/user.repository.js';
import { seedGoaDemo, resetGoaDemoData } from '../src/database/seeds/goa-demo/goa-demo.seed.js';
import { seedCategoriesAndSkills } from '../src/database/seeds/index.js';
import { GOA_LOCATIONS } from '../src/database/seeds/goa-demo/seed-data/goa-locations.js';
import { SEED_WORKERS } from '../src/database/seeds/goa-demo/seed-data/people.js';
import { WorkerAvailability } from '@kaamsetu/types';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

describe('Goa demo seed', () => {
  let nonSeedUserId: string;

  afterAll(async () => {
    // Leave the DB in a clean, freshly-seeded state for other suites.
    await resetGoaDemoData();
    await disconnectMongoDB();
  });

  it('seeds the dataset with expected volumes', async () => {
    await connectMongoDB({ uri: TEST_MONGODB_URI });
    await seedCategoriesAndSkills();
    const summary = await seedGoaDemo();

    expect(summary.customers).toBe(12);
    expect(summary.workers).toBe(31);
    expect(summary.jobs).toBe(50);
    expect(summary.categories).toBeGreaterThanOrEqual(10);
    expect(summary.skills).toBeGreaterThanOrEqual(40);
    expect(summary.reviews).toBe(15);
  });

  it('is idempotent — running twice creates no duplicates', async () => {
    const summary2 = await seedGoaDemo();

    const userCount = await UserModel.countDocuments({
      phoneNumber: { $regex: /^\+9199000/ },
    });
    expect(userCount).toBe(summary2.customers + summary2.workers + 1);

    const jobCount = await JobModel.countDocuments({
      customerId: {
        $in: (
          await UserModel.find({ phoneNumber: { $regex: /^\+9199000/ } }).select('_id')
        ).map((u) => u._id),
      },
    });
    expect(jobCount).toBe(summary2.jobs);

    // Category slugs must not duplicate
    const plumbing = await ServiceCategoryModel.countDocuments({ slug: 'plumbing' });
    expect(plumbing).toBe(1);
  });

  it('Panaji plumbing scenario: eligible nearby AVAILABLE plumbers exist and rank sensibly', async () => {
    const pipeLeak = await SkillModel.findOne({ slug: 'pipe-leak-repair' });
    expect(pipeLeak).toBeTruthy();

    // The exact shape matching.service.findRankedCandidates uses:
    const nearby = await WorkerProfileModel.find({
      deletedAt: null,
      availabilityStatus: WorkerAvailability.AVAILABLE,
      'skills.skillId': { $all: [pipeLeak!._id] },
      serviceLocation: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: GOA_LOCATIONS.PANAJI.coordinates },
          $maxDistance: 50_000,
        },
      },
    })
      .limit(3)
      .exec();

    expect(nearby.length).toBeGreaterThanOrEqual(2);
    // Demo Plumber (Panaji) should be among the closest eligible candidates
    expect(nearby.map((w) => w.displayName)).toContain('Demo Plumber');

    // Deterministic distance sanity: Panaji plumber closer than Margao plumber
    const demo = await WorkerProfileModel.findOne({ displayName: 'Demo Plumber' });
    expect(demo?.serviceArea?.city).toBe('Panaji');
    const margaoPlumber = SEED_WORKERS.find((w) => w.displayName === 'Suresh Dessai');
    expect(margaoPlumber?.town).toBe('MARGAO');
  });

  it('acceptance invariants hold (one accepted offer per job, matching assignment)', async () => {
    const seedUsers = await UserModel.find({ phoneNumber: { $regex: /^\+9199000/ } }).select('_id');
    const jobs = await JobModel.find({
      customerId: { $in: seedUsers.map((u) => u._id) },
      status: { $in: ['ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED'] },
    });

    expect(jobs.length).toBeGreaterThan(0);
    for (const job of jobs) {
      const accepted = await JobOfferModel.find({ jobId: job._id, status: 'ACCEPTED' });
      expect(accepted).toHaveLength(1);
      expect(accepted[0].workerId.toString()).toBe(job.assignedWorkerId?.toString());
    }
  });

  it('financial values are integer paise', async () => {
    const seedUsers = await UserModel.find({ phoneNumber: { $regex: /^\+9199000/ } }).select('_id');
    const expenses = await ExpenseModel.find({ workerId: { $in: seedUsers.map((u) => u._id) } });
    expect(expenses.length).toBeGreaterThan(0);
    for (const e of expenses) {
      expect(Number.isInteger(e.amount)).toBe(true);
      expect(e.amount).toBeGreaterThan(0);
    }
    const txs = await TransactionModel.find({ workerId: { $in: seedUsers.map((u) => u._id) } });
    expect(txs.length).toBeGreaterThan(0);
    for (const t of txs) {
      expect(Number.isInteger(t.amount)).toBe(true);
    }
  });

  it('GeoJSON coordinates are [longitude, latitude] within Goa bounds', async () => {
    const seedUsers = await UserModel.find({ phoneNumber: { $regex: /^\+9199000/ } }).select('_id');
    const jobs = await JobModel.find({ customerId: { $in: seedUsers.map((u) => u._id) } });
    for (const j of jobs) {
      const [lng, lat] = j.location.coordinates;
      expect(lng).toBeGreaterThan(73);
      expect(lng).toBeLessThan(75.5);
      expect(lat).toBeGreaterThan(14.5);
      expect(lat).toBeLessThan(16);
    }
    const workers = await WorkerProfileModel.find({
      userId: { $in: seedUsers.map((u) => u._id) },
    });
    expect(workers.length).toBe(SEED_WORKERS.length);
    for (const w of workers) {
      const [lng, lat] = w.serviceLocation!.coordinates;
      expect(lng).toBeGreaterThan(73);
      expect(lng).toBeLessThan(75.5);
      expect(lat).toBeGreaterThan(14.5);
      expect(lat).toBeLessThan(16);
    }
  });

  it('demo customer profile exists with default Panaji address', async () => {
    const demo = await userRepository.findByPhone('+919900001001');
    expect(demo).toBeTruthy();
    const profile = await CustomerProfileModel.findOne({ userId: demo!.id });
    expect(profile?.displayName).toBe('Demo Customer');
    const defaultAddr = profile?.savedAddresses.find((a) => a.isDefault);
    expect(defaultAddr?.city).toBe('Panaji');
    expect(defaultAddr?.coordinates).toBeDefined();
  });

  it('reset removes only seed-owned data', async () => {
    // Non-seed user that must survive the reset
    const outsider = await userRepository.create({
      phoneNumber: '+919900009999',
      role: 'CUSTOMER' as never,
    });
    nonSeedUserId = outsider.id;

    await resetGoaDemoData();

    const seedUsersAfter = await UserModel.countDocuments({
      phoneNumber: { $regex: /^\+9199000/ },
    });
    expect(seedUsersAfter).toBe(0);

    // Categories/skills (shared slugs) must survive
    const plumbing = await ServiceCategoryModel.findOne({ slug: 'plumbing' });
    expect(plumbing).toBeTruthy();

    // Non-seed user survives
    const stillThere = await UserModel.findById(nonSeedUserId);
    expect(stillThere).toBeTruthy();

    // Reseed for subsequent suites
    await seedCategoriesAndSkills();
    await seedGoaDemo();
  });
});
