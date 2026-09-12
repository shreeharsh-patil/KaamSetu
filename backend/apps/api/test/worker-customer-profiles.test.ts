import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { userRepository } from '../src/modules/users/user.repository.js';
import { serviceCategoryRepository } from '../src/modules/service-categories/service-category.repository.js';
import { skillRepository } from '../src/modules/skills/skill.repository.js';
import { workerProfileService } from '../src/modules/worker-profiles/worker-profile.service.js';
import { customerProfileService } from '../src/modules/customer-profiles/customer-profile.service.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { ServiceCategoryModel } from '../src/modules/service-categories/service-category.model.js';
import { SkillModel } from '../src/modules/skills/skill.model.js';
import { WorkerProfileModel } from '../src/modules/worker-profiles/worker-profile.model.js';
import { CustomerProfileModel } from '../src/modules/customer-profiles/customer-profile.model.js';
import { UserRole, WorkerAvailability } from '@kaamsetu/types';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

describe('Worker and Customer Profiles (Phase 1)', () => {
  let workerUser: { id: string };
  let customerUser: { id: string };
  let category: { id: string };
  let skill: { id: string };

  beforeAll(async () => {
    await connectMongoDB({ uri: TEST_MONGODB_URI });
    await UserModel.syncIndexes();
    await ServiceCategoryModel.syncIndexes();
    await SkillModel.syncIndexes();
    await WorkerProfileModel.syncIndexes();
    await CustomerProfileModel.syncIndexes();

    // Clean up any stale data from previous aborted runs
    await UserModel.deleteMany({ phoneNumber: /^\+9199998/ });
    await ServiceCategoryModel.deleteMany({ slug: 'wcp-home-appliance' });

    // Setup base user & category
    workerUser = await userRepository.create({
      phoneNumber: '9999800001',
      role: UserRole.WORKER,
    });

    customerUser = await userRepository.create({
      phoneNumber: '9999800002',
      role: UserRole.CUSTOMER,
    });

    category = await serviceCategoryRepository.create({
      name: 'Home Appliance',
      slug: 'wcp-home-appliance',
    });

    skill = await skillRepository.create({
      name: 'AC Repair',
      slug: 'wcp-ac-repair',
      categoryId: category.id,
      active: true,
    });
  });

  afterAll(async () => {
    if (workerUser?.id) {
      await WorkerProfileModel.deleteMany({ userId: workerUser.id });
    }
    if (customerUser?.id) {
      await CustomerProfileModel.deleteMany({ userId: customerUser.id });
    }
    await UserModel.deleteMany({ phoneNumber: /^\+9199998/ });
    await ServiceCategoryModel.deleteMany({ slug: 'wcp-home-appliance' });
    await SkillModel.deleteMany({ slug: /^wcp-/ });
    await disconnectMongoDB();
  });

  it('should create a worker profile with GeoJSON coordinates', async () => {
    // Pune coordinates: 73.8567 E, 18.5204 N
    const profile = await workerProfileService.createProfile({
      userId: workerUser.id,
      fullName: 'Ramesh Sharma',
      bio: 'Certified AC and refrigerator technician with 7 years experience',
      primaryCategoryId: category.id,
      skills: [{ skillId: skill.id, experienceYears: 7, level: 'EXPERT' as const }],
      // findNearby only returns matching-ready workers (onboardingComplete + skills)
      onboardingComplete: true,
      serviceArea: {
        type: 'Point',
        coordinates: [73.8567, 18.5204],
        radiusKm: 10,
        city: 'Pune',
        pincode: '411001',
      },
      hourlyRate: 350,
      isAvailable: true,
    });

    expect(profile).toBeDefined();
    expect(profile.id).toBeDefined();
    expect(profile.fullName).toBe('Ramesh Sharma');
    expect(profile.serviceArea.coordinates).toEqual([73.8567, 18.5204]);
    expect(profile.hourlyRate).toBe(350);
  });

  it('should find nearby workers using geospatial index', async () => {
    // Query location near Pune center: 73.8580 E, 18.5210 N (~200 meters away)
    const nearby = await workerProfileService.findNearbyWorkers(
      73.858,
      18.521,
      15, // 15 km radius
      category.id
    );

    expect(nearby.length).toBeGreaterThanOrEqual(1);
    expect(nearby.some((w) => w.fullName === 'Ramesh Sharma')).toBe(true);

    // Query distant location (Mumbai: ~120km away) with 10km radius -> should NOT find the worker
    const distant = await workerProfileService.findNearbyWorkers(
      72.8777,
      19.076,
      10,
      category.id
    );
    expect(distant.some((w) => w.fullName === 'Ramesh Sharma')).toBe(false);
  });

  it('does not make an incomplete worker matchable or available', async () => {
    const incompleteUser = await userRepository.create({
      phoneNumber: '9999800098',
      role: UserRole.WORKER,
    });
    const profile = await workerProfileService.getOrCreateMyProfile(incompleteUser.id);
    expect(profile.onboardingComplete).toBe(false);
    expect(profile.serviceLocation).toBeUndefined();
    expect(profile.availabilityStatus).toBe(WorkerAvailability.OFFLINE);
    await expect(
      workerProfileService.updateAvailability(incompleteUser.id, WorkerAvailability.AVAILABLE)
    ).rejects.toThrow(/Complete onboarding/);

    const nearby = await workerProfileService.findNearbyWorkers(73.8567, 18.5204, 20);
    expect(nearby.some((worker) => worker.userId === incompleteUser.id)).toBe(false);
  });

  it('transactionally enrolls a customer with real taxonomy and location data', async () => {
    const result = await workerProfileService.enroll(customerUser.id, {
      displayName: 'Sunita Patil',
      primaryCategoryId: category.id,
      skills: [{ skillId: skill.id, experienceYears: 4, level: 'EXPERT' }],
      bio: 'Appliance technician',
      languages: ['en', 'mr'],
      serviceLocation: { type: 'Point', coordinates: [73.9, 18.55] },
      serviceArea: { city: 'Pune', pincode: '411001' },
      serviceRadiusKm: 12,
      pricing: { hourlyRate: 450, currency: 'INR' },
      availabilityStatus: WorkerAvailability.AVAILABLE,
    });

    expect(result.user?.role).toBe(UserRole.WORKER);
    expect(result.profile.onboardingComplete).toBe(true);
    expect(result.profile.serviceLocation?.coordinates).toEqual([73.9, 18.55]);
    expect(result.profile.skills[0]?.skillId).toBe(skill.id);
  });

  it('should create a customer profile with multiple structured addresses', async () => {
    const profile = await customerProfileService.createProfile({
      userId: customerUser.id,
      fullName: 'Sunita Patil',
      addresses: [
        {
          label: 'Home',
          addressLine: 'Flat 402, Shiv Shanti Heights, Kothrud',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411038',
          isDefault: true,
        },
        {
          label: 'Office',
          addressLine: 'Tech Park Tower B, Hinjawadi Phase 1',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411057',
          isDefault: false,
        },
      ],
    });

    expect(profile).toBeDefined();
    expect(profile.userId).toBe(customerUser.id);
    expect(profile.fullName).toBe('Sunita Patil');
    expect(profile.addresses).toHaveLength(2);
    expect(profile.addresses[0]?.label).toBe('Home');
    expect(profile.addresses[0]?.isDefault).toBe(true);
    expect(profile.addresses[1]?.label).toBe('Office');
  });

  it('should prevent creating duplicate worker profile for the same user', async () => {
    await expect(
      workerProfileService.createProfile({
        userId: workerUser.id,
        fullName: 'Duplicate Profile',
        primaryCategoryId: category.id,
        serviceArea: {
          type: 'Point',
          coordinates: [73.85, 18.52],
        },
      })
    ).rejects.toThrow();
  });
});
