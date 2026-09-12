import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { userRepository } from '../src/modules/users/user.repository.js';
import { serviceCategoryRepository } from '../src/modules/service-categories/service-category.repository.js';
import { skillRepository } from '../src/modules/skills/skill.repository.js';
import { sessionRepository } from '../src/modules/sessions/session.repository.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { ServiceCategoryModel } from '../src/modules/service-categories/service-category.model.js';
import { SkillModel } from '../src/modules/skills/skill.model.js';
import { WorkerProfileModel } from '../src/modules/worker-profiles/worker-profile.model.js';
import { CustomerProfileModel } from '../src/modules/customer-profiles/customer-profile.model.js';
import { SessionModel } from '../src/modules/sessions/session.model.js';
import {
  UserRole,
  WorkerAvailability,
  WorkerVerificationStatus,
  SkillLevel,
} from '@kaamsetu/types';
import { signAccessToken } from '../src/modules/auth/token.util.js';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

describe('Worker and Customer Profiles (Phase 3)', () => {
  let workerUser: { id: string; role: UserRole };
  let customerUser: { id: string; role: UserRole };
  let anotherCustomerUser: { id: string; role: UserRole };

  let workerToken: string;
  let customerToken: string;
  let anotherCustomerToken: string;

  let testCategory: { id: string };
  let activeSkill: { id: string };
  let inactiveSkill: { id: string };

  beforeAll(async () => {
    await connectMongoDB({ uri: TEST_MONGODB_URI });
    await UserModel.syncIndexes();
    await WorkerProfileModel.syncIndexes();
    await CustomerProfileModel.syncIndexes();
    await ServiceCategoryModel.syncIndexes();
    await SkillModel.syncIndexes();

    // Clean up test collections for our specific phone numbers
    await UserModel.deleteMany({ phoneNumber: /^\+9197777/ });
    await ServiceCategoryModel.deleteMany({ slug: 'phase3-home-repair' });
    await SkillModel.deleteMany({ slug: /phase3-/ });

    // Seed test users
    const wUser = await userRepository.create({
      phoneNumber: '9777700001',
      role: UserRole.WORKER,
    });
    workerUser = { id: wUser.id, role: UserRole.WORKER };

    const cUser = await userRepository.create({
      phoneNumber: '9777700002',
      role: UserRole.CUSTOMER,
    });
    customerUser = { id: cUser.id, role: UserRole.CUSTOMER };

    const cUser2 = await userRepository.create({
      phoneNumber: '9777700003',
      role: UserRole.CUSTOMER,
    });
    anotherCustomerUser = { id: cUser2.id, role: UserRole.CUSTOMER };

    // Clean up profiles for these users
    await WorkerProfileModel.deleteMany({ userId: workerUser.id });
    await CustomerProfileModel.deleteMany({
      userId: { $in: [customerUser.id, anotherCustomerUser.id] },
    });
    await SessionModel.deleteMany({
      userId: { $in: [workerUser.id, customerUser.id, anotherCustomerUser.id] },
    });

    // Create real DB sessions so authenticate() middleware finds them active
    const workerSession = await sessionRepository.create({
      userId: workerUser.id,
      refreshTokenHash: 'worker-session-hash-123',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const customerSession = await sessionRepository.create({
      userId: customerUser.id,
      refreshTokenHash: 'customer-session-hash-123',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const anotherCustomerSession = await sessionRepository.create({
      userId: anotherCustomerUser.id,
      refreshTokenHash: 'another-customer-hash-123',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Generate JWT tokens with actual session IDs
    workerToken = signAccessToken({
      userId: workerUser.id,
      role: UserRole.WORKER,
      sessionId: workerSession.id,
      familyId: workerSession.familyId,
    });

    customerToken = signAccessToken({
      userId: customerUser.id,
      role: UserRole.CUSTOMER,
      sessionId: customerSession.id,
      familyId: customerSession.familyId,
    });

    anotherCustomerToken = signAccessToken({
      userId: anotherCustomerUser.id,
      role: UserRole.CUSTOMER,
      sessionId: anotherCustomerSession.id,
      familyId: anotherCustomerSession.familyId,
    });

    // Seed test category and skills
    testCategory = await serviceCategoryRepository.create({
      name: 'Phase 3 Home Repair',
      slug: 'phase3-home-repair',
    });

    activeSkill = await skillRepository.create({
      name: 'Electrical Wiring',
      slug: 'phase3-electrical-wiring',
      categoryId: testCategory.id,
      active: true,
    });

    inactiveSkill = await skillRepository.create({
      name: 'Solar Inverter Repair',
      slug: 'phase3-solar-inverter',
      categoryId: testCategory.id,
      active: false,
    });
  });

  afterAll(async () => {
    await UserModel.deleteMany({ phoneNumber: /^\+9197777/ });
    await WorkerProfileModel.deleteMany({ userId: workerUser.id });
    await CustomerProfileModel.deleteMany({
      userId: { $in: [customerUser.id, anotherCustomerUser.id] },
    });
    await ServiceCategoryModel.deleteMany({ slug: 'phase3-home-repair' });
    await SkillModel.deleteMany({ slug: /phase3-/ });
    await SessionModel.deleteMany({
      userId: { $in: [workerUser.id, customerUser.id, anotherCustomerUser.id] },
    });
    await disconnectMongoDB();
  });

  describe('Worker Profile Endpoints', () => {
    it('GET /api/v1/workers/me - should auto-create and return worker profile for authenticated worker', async () => {
      const res = await request(app)
        .get('/api/v1/workers/me')
        .set('Authorization', `Bearer ${workerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(workerUser.id);
      expect(res.body.data.displayName).toBe('Skilled Worker');
      // A fresh auto-created profile has no location yet (privacy: never invent coordinates);
      // the worker explicitly sets it via PUT /workers/me/location (tested below).
      expect(res.body.data.serviceLocation).toBeUndefined();
      expect(res.body.data.serviceRadiusKm).toBe(15);
      // New workers start OFFLINE (never surface in matching until they opt in via PUT /me/availability)
      expect(res.body.data.availabilityStatus).toBe(WorkerAvailability.OFFLINE);
      expect(res.body.data.verificationStatus).toBe(WorkerVerificationStatus.UNVERIFIED);
    });

    it('GET /api/v1/workers/me - should reject customer attempting to access worker endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/workers/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Forbidden.*role/i);
    });

    it('PATCH /api/v1/workers/me - should update profile and prevent editing verificationStatus or rating', async () => {
      const res = await request(app)
        .patch('/api/v1/workers/me')
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          displayName: 'Vikram Rajput',
          bio: 'Master Electrician with 10 years experience',
          languages: ['hi', 'en', 'mr'],
          pricing: {
            hourlyRate: 500,
            customRateDescription: '₹500/hr + parts extra',
            currency: 'INR',
          },
          portfolio: [
            {
              title: 'Substation Installation',
              imageUrl: 'https://example.com/portfolio1.jpg',
            },
          ],
          // Malicious attempt to self-verify or forge ratings
          verificationStatus: 'VERIFIED',
          rating: { average: 5, count: 999 },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.displayName).toBe('Vikram Rajput');
      expect(res.body.data.bio).toBe('Master Electrician with 10 years experience');
      expect(res.body.data.languages).toEqual(['hi', 'en', 'mr']);
      expect(res.body.data.pricing.hourlyRate).toBe(500);
      expect(res.body.data.portfolio).toHaveLength(1);
      expect(res.body.data.portfolio[0].title).toBe('Substation Installation');

      // Security assertion: verification status MUST remain UNVERIFIED
      expect(res.body.data.verificationStatus).toBe(WorkerVerificationStatus.UNVERIFIED);
      expect(res.body.data.rating.count).toBe(0);
    });

    it('PUT /api/v1/workers/me/location - should update coordinates and enforce valid latitude/longitude', async () => {
      // Valid coordinates for Mumbai: 72.8777 E, 19.0760 N
      const validRes = await request(app)
        .put('/api/v1/workers/me/location')
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          coordinates: [72.8777, 19.076],
        });

      expect(validRes.status).toBe(200);
      expect(validRes.body.data.serviceLocation.coordinates).toEqual([72.8777, 19.076]);

      // Invalid latitude (> 90)
      const invalidLatRes = await request(app)
        .put('/api/v1/workers/me/location')
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          coordinates: [72.8777, 95.0],
        });

      expect(invalidLatRes.status).toBe(422);

      // Invalid longitude (> 180)
      const invalidLngRes = await request(app)
        .put('/api/v1/workers/me/location')
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          coordinates: [185.0, 19.076],
        });

      expect(invalidLngRes.status).toBe(422);
    });

    it('PUT /api/v1/workers/me/availability - should update availability status', async () => {
      const busyRes = await request(app)
        .put('/api/v1/workers/me/availability')
        .set('Authorization', `Bearer ${workerToken}`)
        .send({ availabilityStatus: WorkerAvailability.BUSY });

      expect(busyRes.status).toBe(200);
      expect(busyRes.body.data.availabilityStatus).toBe(WorkerAvailability.BUSY);

      const offlineRes = await request(app)
        .put('/api/v1/workers/me/availability')
        .set('Authorization', `Bearer ${workerToken}`)
        .send({ availabilityStatus: WorkerAvailability.OFFLINE });

      expect(offlineRes.status).toBe(200);
      expect(offlineRes.body.data.availabilityStatus).toBe(WorkerAvailability.OFFLINE);

      // Invalid status
      const invalidRes = await request(app)
        .put('/api/v1/workers/me/availability')
        .set('Authorization', `Bearer ${workerToken}`)
        .send({ availabilityStatus: 'SLEEPING' });

      expect(invalidRes.status).toBe(422);
    });

    it('PUT /api/v1/workers/me/service-radius - should update radius within 1-100 km constraints', async () => {
      const validRes = await request(app)
        .put('/api/v1/workers/me/service-radius')
        .set('Authorization', `Bearer ${workerToken}`)
        .send({ radiusKm: 30 });

      expect(validRes.status).toBe(200);
      expect(validRes.body.data.serviceRadiusKm).toBe(30);

      // Below minimum (0 km)
      const zeroRes = await request(app)
        .put('/api/v1/workers/me/service-radius')
        .set('Authorization', `Bearer ${workerToken}`)
        .send({ radiusKm: 0 });

      expect(zeroRes.status).toBe(422);

      // Above maximum (150 km)
      const excessRes = await request(app)
        .put('/api/v1/workers/me/service-radius')
        .set('Authorization', `Bearer ${workerToken}`)
        .send({ radiusKm: 150 });

      expect(excessRes.status).toBe(422);
    });

    it('POST /api/v1/workers/me/skills - should validate skill exists, active, and add to profile', async () => {
      // 1. Add active skill
      const addSkillRes = await request(app)
        .post('/api/v1/workers/me/skills')
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          skillId: activeSkill.id,
          experienceYears: 6,
          level: SkillLevel.EXPERT,
        });

      expect(addSkillRes.status).toBe(201);
      expect(addSkillRes.body.data.skills).toHaveLength(1);
      expect(addSkillRes.body.data.skills[0].skillId).toBe(activeSkill.id);
      expect(addSkillRes.body.data.skills[0].skillName).toBe('Electrical Wiring');
      expect(addSkillRes.body.data.skills[0].level).toBe(SkillLevel.EXPERT);
      expect(addSkillRes.body.data.skills[0].verified).toBe(false);

      // 2. Reject inactive skill
      const inactiveRes = await request(app)
        .post('/api/v1/workers/me/skills')
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          skillId: inactiveSkill.id,
          experienceYears: 2,
          level: SkillLevel.BEGINNER,
        });

      expect(inactiveRes.status).toBe(400);
      expect(inactiveRes.body.error.message).toMatch(/inactive|does not exist/i);

      // 3. Reject nonexistent skill
      const nonExistentRes = await request(app)
        .post('/api/v1/workers/me/skills')
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          skillId: '65f1a2b3c4d5e6f7a8b9c0d1',
          experienceYears: 3,
          level: SkillLevel.INTERMEDIATE,
        });

      expect(nonExistentRes.status).toBe(400);
      expect(nonExistentRes.body.error.message).toMatch(/inactive|does not exist/i);
    });

    it('DELETE /api/v1/workers/me/skills/:skillId - should remove skill from profile', async () => {
      const deleteRes = await request(app)
        .delete(`/api/v1/workers/me/skills/${activeSkill.id}`)
        .set('Authorization', `Bearer ${workerToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.skills).toHaveLength(0);
    });

    it('GET /api/v1/workers/:workerId - should return sanitized public profile', async () => {
      // Re-add skill for complete public profile check
      await request(app)
        .post('/api/v1/workers/me/skills')
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          skillId: activeSkill.id,
          experienceYears: 6,
          level: SkillLevel.EXPERT,
        });

      const profileRes = await request(app)
        .get('/api/v1/workers/me')
        .set('Authorization', `Bearer ${workerToken}`);
      const workerId = profileRes.body.data.id;

      const publicRes = await request(app).get(`/api/v1/workers/${workerId}`);

      expect(publicRes.status).toBe(200);
      expect(publicRes.body.success).toBe(true);
      expect(publicRes.body.data.id).toBe(workerId);
      expect(publicRes.body.data.displayName).toBe('Vikram Rajput');
      // Privacy: exact coordinates must NOT be exposed publicly; only service area summary
      expect(publicRes.body.data.serviceLocation).toBeUndefined();
      expect(publicRes.body.data.serviceArea.radiusKm).toBeDefined();
      expect(publicRes.body.data.skills[0].skillName).toBe('Electrical Wiring');

      // Sanitization: Ensure internal sensitive fields are not exposed in public profile
      expect(publicRes.body.data.userId).toBeUndefined();
      expect(publicRes.body.data.deletedAt).toBeUndefined();

      // Non-existent worker ID
      const notFoundRes = await request(app).get('/api/v1/workers/65f1a2b3c4d5e6f7a8b9c0d1');
      expect(notFoundRes.status).toBe(404);
    });
  });

  describe('Customer Profile Endpoints', () => {
    let createdAddressId: string;

    it('GET /api/v1/customers/me - should auto-create and return customer profile', async () => {
      const res = await request(app)
        .get('/api/v1/customers/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(customerUser.id);
      expect(res.body.data.displayName).toBe('Customer');
      expect(res.body.data.savedAddresses).toEqual([]);
      expect(res.body.data.rating.count).toBe(0);
      expect(res.body.data.jobStats.totalBookings).toBe(0);
    });

    it('PATCH /api/v1/customers/me - should update customer displayName', async () => {
      const res = await request(app)
        .patch('/api/v1/customers/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ displayName: 'Priya Deshmukh' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.displayName).toBe('Priya Deshmukh');
    });

    it('POST /api/v1/customers/me/addresses - should add address and set first address as default', async () => {
      const res = await request(app)
        .post('/api/v1/customers/me/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          label: 'Home',
          addressLine: 'Flat 402, Shivam Heights, Baner Road',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411045',
          coordinates: [73.7898, 18.5596],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.savedAddresses).toHaveLength(1);
      expect(res.body.data.savedAddresses[0].label).toBe('Home');
      expect(res.body.data.savedAddresses[0].isDefault).toBe(true);
      expect(res.body.data.defaultAddress.label).toBe('Home');

      createdAddressId = res.body.data.savedAddresses[0].id;
      expect(createdAddressId).toBeDefined();
    });

    it('POST /api/v1/customers/me/addresses - should add second address with isDefault: true and unset previous default', async () => {
      const res = await request(app)
        .post('/api/v1/customers/me/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          label: 'Office',
          addressLine: 'Tower B, Tech Park, Hinjawadi Phase 1',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411057',
          coordinates: [73.7299, 18.5913],
          isDefault: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.savedAddresses).toHaveLength(2);

      const homeAddr = res.body.data.savedAddresses.find((a: any) => a.label === 'Home');
      const officeAddr = res.body.data.savedAddresses.find((a: any) => a.label === 'Office');

      expect(homeAddr.isDefault).toBe(false);
      expect(officeAddr.isDefault).toBe(true);
      expect(res.body.data.defaultAddress.label).toBe('Office');
    });

    it('PATCH /api/v1/customers/me/addresses/:id - should update address fields and reassign default', async () => {
      const res = await request(app)
        .patch(`/api/v1/customers/me/addresses/${createdAddressId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          label: 'Home Sweet Home',
          isDefault: true,
        });

      expect(res.status).toBe(200);
      const homeAddr = res.body.data.savedAddresses.find(
        (a: any) => a.id === createdAddressId
      );
      expect(homeAddr.label).toBe('Home Sweet Home');
      expect(homeAddr.isDefault).toBe(true);

      const officeAddr = res.body.data.savedAddresses.find((a: any) => a.label === 'Office');
      expect(officeAddr.isDefault).toBe(false);
    });

    it('PATCH /api/v1/customers/me/addresses/:id - should prevent customer from updating another customer address', async () => {
      const res = await request(app)
        .patch(`/api/v1/customers/me/addresses/${createdAddressId}`)
        .set('Authorization', `Bearer ${anotherCustomerToken}`)
        .send({ label: 'Hacked Address' });

      expect(res.status).toBe(404);
      expect(res.body.error.message).toMatch(/not found/i);
    });

    it('DELETE /api/v1/customers/me/addresses/:id - should delete address and promote remaining address to default', async () => {
      // Delete the current default address (Home Sweet Home)
      const res = await request(app)
        .delete(`/api/v1/customers/me/addresses/${createdAddressId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.savedAddresses).toHaveLength(1);
      // The remaining address (Office) must now be promoted to default
      expect(res.body.data.savedAddresses[0].label).toBe('Office');
      expect(res.body.data.savedAddresses[0].isDefault).toBe(true);
      expect(res.body.data.defaultAddress.label).toBe('Office');
    });

    it('DELETE /api/v1/customers/me/addresses/:id - should return 404 when deleting nonexistent address', async () => {
      const res = await request(app)
        .delete('/api/v1/customers/me/addresses/65f1a2b3c4d5e6f7a8b9c0d1')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.message).toMatch(/not found/i);
    });
  });
});
