import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { userRepository } from '../src/modules/users/user.repository.js';
import { serviceCategoryRepository } from '../src/modules/service-categories/service-category.repository.js';
import { workerProfileService } from '../src/modules/worker-profiles/worker-profile.service.js';
import { customerProfileService } from '../src/modules/customer-profiles/customer-profile.service.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { ServiceCategoryModel } from '../src/modules/service-categories/service-category.model.js';
import { WorkerProfileModel } from '../src/modules/worker-profiles/worker-profile.model.js';
import { CustomerProfileModel } from '../src/modules/customer-profiles/customer-profile.model.js';
import { UserRole } from '@kaamsetu/types';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

describe('Worker and Customer Profiles (Phase 1)', () => {
  let workerUser: { id: string };
  let customerUser: { id: string };
  let category: { id: string };

  beforeAll(async () => {
    await connectMongoDB({ uri: TEST_MONGODB_URI });
    try {
      await UserModel.collection.dropIndex('email_1');
    } catch {
      // ignore
    }
    await UserModel.syncIndexes();
    await ServiceCategoryModel.syncIndexes();
    await WorkerProfileModel.syncIndexes();
    await CustomerProfileModel.syncIndexes();

    // Clean up any stale data from previous aborted runs
    await UserModel.deleteMany({ phoneNumber: /^\+9199998/ });
    await ServiceCategoryModel.deleteMany({ slug: 'test-home-appliance' });

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
      slug: 'test-home-appliance',
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
    await ServiceCategoryModel.deleteMany({ slug: 'test-home-appliance' });
    await disconnectMongoDB();
  });

  it('should create a worker profile with GeoJSON coordinates', async () => {
    // Pune coordinates: 73.8567 E, 18.5204 N
    const profile = await workerProfileService.createProfile({
      userId: workerUser.id,
      fullName: 'Ramesh Sharma',
      bio: 'Certified AC and refrigerator technician with 7 years experience',
      primaryCategoryId: category.id,
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
