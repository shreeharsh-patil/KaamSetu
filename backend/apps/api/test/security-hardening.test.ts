import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { SessionModel } from '../src/modules/sessions/session.model.js';
import { JobModel } from '../src/modules/jobs/job.model.js';
import { ExpenseModel } from '../src/modules/expenses/expense.model.js';
import { UploadModel } from '../src/modules/uploads/upload.model.js';
import { ServiceCategoryModel } from '../src/modules/service-categories/service-category.model.js';
import { SkillModel } from '../src/modules/skills/skill.model.js';
import { userRepository } from '../src/modules/users/user.repository.js';
import { sessionRepository } from '../src/modules/sessions/session.repository.js';
import { jobService } from '../src/modules/jobs/job.service.js';
import { expenseRepository } from '../src/modules/expenses/expense.repository.js';
import { uploadService } from '../src/modules/uploads/upload.service.js';
import { DevOTPProvider } from '../src/modules/otp/otp.provider.js';
import { signAccessToken } from '../src/modules/auth/token.util.js';
import { createRateLimiter } from '../src/middlewares/rate-limiter.js';
import {
  UserRole,
  UserStatus,
  JobStatus,
  UploadPurpose,
  ExpenseCategory,
} from '@kaamsetu/types';
import express, { Express } from 'express';
import { errorHandlerMiddleware } from '../src/middlewares/error-handler.js';
import { applySecurityMiddlewares } from '../src/middlewares/security.js';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

const PHONE_PREFIX = '+91961111'; // Isolated prefix (6 digits) + 4-digit suffix = 10 digits
const SLUG_PREFIX = 'phase13-sec-';

describe('Security Hardening & Protection Suite (Phase 13)', () => {
  let customer1: { id: string; token: string; sessionId: string; familyId: string };
  let customer2: { id: string; token: string; sessionId: string; familyId: string };
  let worker1: { id: string; token: string; sessionId: string; familyId: string };
  let worker2: { id: string; token: string; sessionId: string; familyId: string };
  let supportUser: { id: string; token: string };
  let adminUser: { id: string; token: string };

  let categoryId: string;
  let skillId: string;
  let customer1JobId: string;
  let worker1ExpenseId: string;
  let customer1UploadId: string;

  beforeAll(async () => {
    await connectMongoDB({ uri: TEST_MONGODB_URI });
    await UserModel.syncIndexes();
    await SessionModel.syncIndexes();
    await JobModel.syncIndexes();
    await ExpenseModel.syncIndexes();
    await UploadModel.syncIndexes();
    await ServiceCategoryModel.syncIndexes();
    await SkillModel.syncIndexes();

    // Isolated cleanup for this test suite
    const staleUsers = await UserModel.find({
      phoneNumber: { $regex: `^\\${PHONE_PREFIX}` },
    })
      .select('_id')
      .lean();
    const staleIds = staleUsers.map((u) => u._id);
    if (staleIds.length > 0) {
      await JobModel.deleteMany({ customerId: { $in: staleIds } });
      await ExpenseModel.deleteMany({ workerId: { $in: staleIds } });
      await UploadModel.deleteMany({ userId: { $in: staleIds } });
      await SessionModel.deleteMany({ userId: { $in: staleIds } });
      await UserModel.deleteMany({ _id: { $in: staleIds } });
    }
    await ServiceCategoryModel.deleteMany({ slug: { $regex: `^${SLUG_PREFIX}` } });
    await SkillModel.deleteMany({ slug: { $regex: `^${SLUG_PREFIX}` } });

    // 1. Create Service Category & Skill
    const cat = await ServiceCategoryModel.create({
      name: 'Security Test Category',
      slug: `${SLUG_PREFIX}cat`,
      active: true,
    });
    categoryId = cat._id.toString();

    const sk = await SkillModel.create({
      name: 'Security Test Skill',
      slug: `${SLUG_PREFIX}skill`,
      categoryId: cat._id,
      active: true,
    });
    skillId = sk._id.toString();

    // 2. Helper to create user & token
    async function createUser(suffix: string, role: UserRole) {
      const u = await userRepository.create({
        phoneNumber: `${PHONE_PREFIX}${suffix}`,
        role,
      });
      const familyId = `family-${suffix}-${Date.now()}`;
      const sess = await sessionRepository.create({
        userId: u.id,
        familyId,
        refreshTokenHash: `hash-${suffix}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      const token = signAccessToken({
        userId: u.id,
        role: u.role,
        sessionId: sess.id,
        familyId,
      });
      return { id: u.id, token, sessionId: sess.id, familyId };
    }

    customer1 = await createUser('0001', UserRole.CUSTOMER);
    customer2 = await createUser('0002', UserRole.CUSTOMER);
    worker1 = await createUser('0003', UserRole.WORKER);
    worker2 = await createUser('0004', UserRole.WORKER);
    supportUser = await createUser('0005', UserRole.SUPPORT);
    adminUser = await createUser('0006', UserRole.ADMIN);

    // 3. Create a job owned by customer1
    const job = await jobService.createJob(customer1.id, UserRole.CUSTOMER, {
      categoryId,
      requiredSkills: [skillId],
      title: 'Customer1 Private Job',
      description: 'Private house cleaning job description',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      address: {
        line: '123 Test Street',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
      },
      preferredTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    customer1JobId = job.id;

    // 4. Create an expense owned by worker1
    const expense = await expenseRepository.create({
      workerId: worker1.id,
      category: ExpenseCategory.FUEL,
      amount: 45000,
      currency: 'INR',
      note: 'Petrol for commute',
    });
    worker1ExpenseId = expense.id;

    // 5. Create a private verification document upload owned by customer1
    const presign = await uploadService.createPresignedUpload(customer1.id, {
      purpose: UploadPurpose.VERIFICATION_DOCUMENT,
      filename: 'my-aadhaar.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2000000,
    });
    await uploadService.completeUpload(customer1.id, presign.uploadId);
    customer1UploadId = presign.uploadId;
  });

  afterAll(async () => {
    const userIds = [
      customer1?.id,
      customer2?.id,
      worker1?.id,
      worker2?.id,
      supportUser?.id,
      adminUser?.id,
    ].filter(Boolean);

    if (userIds.length > 0) {
      await JobModel.deleteMany({ customerId: { $in: userIds } });
      await ExpenseModel.deleteMany({ workerId: { $in: userIds } });
      await UploadModel.deleteMany({ userId: { $in: userIds } });
      await SessionModel.deleteMany({ userId: { $in: userIds } });
      await UserModel.deleteMany({ _id: { $in: userIds } });
    }
    await ServiceCategoryModel.deleteMany({ slug: { $regex: `^${SLUG_PREFIX}` } });
    await SkillModel.deleteMany({ slug: { $regex: `^${SLUG_PREFIX}` } });
    await disconnectMongoDB();
  });

  // =============================================================
  // 1. Unauthorized Access & Token Validation
  // =============================================================
  describe('1. Unauthorized Access & Token Validation', () => {
    it('blocks request with missing Authorization header (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/v1/customers/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('blocks request with malformed non-Bearer scheme (401 Unauthorized)', async () => {
      const res = await request(app)
        .get('/api/v1/customers/me')
        .set('Authorization', 'Basic dXNlcjpwYXNz');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('blocks request with corrupted / garbage JWT string (401 Unauthorized)', async () => {
      const res = await request(app)
        .get('/api/v1/customers/me')
        .set('Authorization', 'Bearer not-a-valid-jwt-token-string');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('blocks request with JWT signed with wrong secret key (401 Unauthorized)', async () => {
      const forgedToken = jwt.sign(
        { userId: customer1.id, role: UserRole.CUSTOMER, sessionId: customer1.sessionId },
        'attacker-unauthorized-secret-key-32-chars!!',
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/v1/customers/me')
        .set('Authorization', `Bearer ${forgedToken}`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('blocks request with expired JWT token (401 Unauthorized)', async () => {
      const expiredToken = jwt.sign(
        { userId: customer1.id, role: UserRole.CUSTOMER, sessionId: customer1.sessionId },
        process.env['JWT_ACCESS_SECRET'] || 'test-jwt-access-secret-at-least-32-chars!!',
        { expiresIn: -10 } // Expired 10 seconds ago
      );

      const res = await request(app)
        .get('/api/v1/customers/me')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('blocks request when underlying session is revoked in database (401 Unauthorized)', async () => {
      // Create a dedicated session and immediately revoke it
      const sess = await sessionRepository.create({
        userId: customer1.id,
        refreshTokenHash: 'revoked-test-hash',
        expiresAt: new Date(Date.now() + 3600000),
      });
      await sessionRepository.revoke(sess.id);

      const token = signAccessToken({
        userId: customer1.id,
        role: UserRole.CUSTOMER,
        sessionId: sess.id,
      });

      const res = await request(app)
        .get('/api/v1/customers/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(401);
      expect(res.body.error.message).toContain('revoked');
    });
  });

  // =============================================================
  // 2. Token Replay & Refresh Token Reuse Detection
  // =============================================================
  describe('2. Token Replay & Refresh Token Reuse Detection', () => {
    it('detects refresh token reuse and revokes entire compromised session family', async () => {
      const authPhone = '9611100099';
      await request(app)
        .post('/api/v1/auth/request-otp')
        .send({ phone: authPhone });

      const otp = DevOTPProvider.getLastSentOTP(`+91${authPhone}`)!;
      const loginRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone: authPhone, otp, deviceName: 'iPhone 15' });

      expect(loginRes.status).toBe(200);

      // Extract refresh cookie
      const setCookie = loginRes.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
      const originalRefreshToken = cookieStr.split(';')[0];

      // 1st Refresh: valid, rotates refresh token
      const refresh1 = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', originalRefreshToken);

      expect(refresh1.status).toBe(200);
      expect(refresh1.body.success).toBe(true);
      const newAccessToken = refresh1.body.data.accessToken;

      // 2nd Refresh using the OLD originalRefreshToken (REPLAY ATTACK!)
      const replayAttempt = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', originalRefreshToken);

      expect(replayAttempt.status).toBe(401);
      expect(replayAttempt.body.error.message).toContain('revoked');

      // Now the legitimate newAccessToken must ALSO be revoked because the entire family was nuked!
      const blockedRes = await request(app)
        .get('/api/v1/customers/me')
        .set('Authorization', `Bearer ${newAccessToken}`);

      expect(blockedRes.status).toBe(401);
    });
  });

  // =============================================================
  // 3. Horizontal Privilege Escalation (IDOR) & Object Ownership
  // =============================================================
  describe('3. Horizontal Privilege Escalation (IDOR) & Ownership Protection', () => {
    it('blocks Customer 2 from modifying Customer 1 job (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/jobs/${customer1JobId}`)
        .set('Authorization', `Bearer ${customer2.token}`)
        .send({ title: 'Hijacked Job Title' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks Customer 2 from canceling Customer 1 job (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${customer1JobId}/cancel`)
        .set('Authorization', `Bearer ${customer2.token}`)
        .send({ reason: 'Malicious cancellation' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks Worker 2 from editing Worker 1 expense (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/expenses/${worker1ExpenseId}`)
        .set('Authorization', `Bearer ${worker2.token}`)
        .send({ amount: 99999 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks Worker 2 from deleting Worker 1 expense (403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/v1/expenses/${worker1ExpenseId}`)
        .set('Authorization', `Bearer ${worker2.token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks Customer 2 from accessing Customer 1 private document download URL (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/v1/uploads/${customer1UploadId}/download-url`)
        .set('Authorization', `Bearer ${customer2.token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks Customer 2 from deleting Customer 1 uploaded file (403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/v1/uploads/${customer1UploadId}`)
        .set('Authorization', `Bearer ${customer2.token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  // =============================================================
  // 4. Vertical Privilege Escalation & Admin Boundary
  // =============================================================
  describe('4. Vertical Privilege Escalation & Admin Boundary', () => {
    it('blocks WORKER from accessing admin users list (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${worker1.token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks CUSTOMER from accessing admin audit logs (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${customer1.token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks SUPPORT user from performing destructive admin actions like user suspension (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${customer2.id}/suspend`)
        .set('Authorization', `Bearer ${supportUser.token}`)
        .send({ reason: 'Unauthorized support suspension attempt' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks SUPPORT user from creating financial adjustments (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/financial-adjustments')
        .set('Authorization', `Bearer ${supportUser.token}`)
        .send({
          workerId: worker1.id,
          amountPaise: 50000,
          reason: 'Unauthorized bonus credit',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows ADMIN full access to administrative actions', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // =============================================================
  // 5. NoSQL Injection & Query Sanitization
  // =============================================================
  describe('5. NoSQL Injection & Query Sanitization', () => {
    it('blocks request body containing $ne operator with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/auth/request-otp')
        .send({
          phone: { $ne: null },
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Prohibited NoSQL query operator');
    });

    it('blocks request body containing $gt operator with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/auth/request-otp')
        .send({
          phone: { $gt: '' },
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Prohibited NoSQL query operator');
    });

    it('blocks request body containing deeply nested $where operator with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({
          categoryId,
          requiredSkills: [skillId],
          title: 'Malicious Job',
          description: 'Testing injection',
          metadata: {
            deeply: {
              nested: {
                $where: 'sleep(5000)',
              },
            },
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Prohibited NoSQL query operator');
    });

    it('blocks query string containing MongoDB operator ($ne) with 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/v1/jobs?status[$ne]=COMPLETED')
        .set('Authorization', `Bearer ${customer1.token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Prohibited NoSQL query operator');
    });
  });

  // =============================================================
  // 6. HTTP Parameter Pollution (HPP)
  // =============================================================
  describe('6. HTTP Parameter Pollution (HPP)', () => {
    it('coerces polluted repeated query parameters into a single scalar value', async () => {
      // Sending repeated status parameters: ?status=OPEN&status=DRAFT
      const res = await request(app)
        .get('/api/v1/jobs?status=OPEN&status=DRAFT')
        .set('Authorization', `Bearer ${customer1.token}`);

      // Does not throw validation error because HPP converted array to scalar
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // =============================================================
  // 7. Oversized Request & Payload Limits (413)
  // =============================================================
  describe('7. Oversized Request & Payload Limits', () => {
    it('rejects oversized JSON request payloads with 413 Payload Too Large', async () => {
      // Create a test app instance with a tight body limit (50KB) to safely test 413
      const miniApp: Express = express();
      applySecurityMiddlewares(miniApp);
      miniApp.post('/test-payload-limit', (_req, res) => {
        res.status(200).json({ success: true });
      });
      miniApp.use(errorHandlerMiddleware);

      // Send payload exceeding 1MB (1.5MB string)
      const oversizedPayload = {
        data: 'A'.repeat(1.5 * 1024 * 1024),
      };

      const res = await request(miniApp)
        .post('/test-payload-limit')
        .send(oversizedPayload);

      expect(res.status).toBe(413);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    });
  });

  // =============================================================
  // 8. Distributed Rate Limiting & Abuse Prevention
  // =============================================================
  describe('8. Distributed Rate Limiting & Abuse Prevention', () => {
    it('sets standard rate limit headers on responses', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.headers['ratelimit-limit']).toBeDefined();
      expect(res.headers['ratelimit-remaining']).toBeDefined();
      expect(res.headers['ratelimit-reset']).toBeDefined();
    });

    it('enforces rate limit threshold and returns 429 Too Many Requests with Retry-After', async () => {
      const rateLimitedApp: Express = express();
      const testLimiter = createRateLimiter({
        windowMs: 5000,
        max: 2, // Only 2 requests allowed
        prefix: 'test-limiter',
        keyGenerator: () => 'rate-limit-test-key',
      });

      rateLimitedApp.use(testLimiter);
      rateLimitedApp.get('/test-rate-limit', (_req, res) => {
        res.status(200).json({ ok: true });
      });
      rateLimitedApp.use(errorHandlerMiddleware);

      // Request 1: OK
      const res1 = await request(rateLimitedApp).get('/test-rate-limit');
      expect(res1.status).toBe(200);

      // Request 2: OK
      const res2 = await request(rateLimitedApp).get('/test-rate-limit');
      expect(res2.status).toBe(200);

      // Request 3: Exceeded limit -> 429 Too Many Requests
      const res3 = await request(rateLimitedApp).get('/test-rate-limit');
      expect(res3.status).toBe(429);
      expect(res3.body.error.code).toBe('TOO_MANY_REQUESTS');
      expect(res3.headers['retry-after']).toBeDefined();
    });

    it('enforces OTP cooldown to prevent SMS spam and flooding', async () => {
      const floodPhone = '9611100088';

      // 1st OTP Request: succeeds
      const req1 = await request(app)
        .post('/api/v1/auth/request-otp')
        .send({ phone: floodPhone });
      expect(req1.status).toBe(200);

      // 2nd immediate OTP Request: blocked by cooldown
      const req2 = await request(app)
        .post('/api/v1/auth/request-otp')
        .send({ phone: floodPhone });
      expect(req2.status).toBe(400);
      expect(req2.body.error.message).toContain('wait before requesting another OTP');
    });
  });

  // =============================================================
  // 9. Security Headers & Strict CORS
  // =============================================================
  describe('9. Security Headers & Strict CORS Policy', () => {
    it('sets protective Helmet and permission policy headers on responses', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['content-security-policy']).toBeDefined();
      expect(res.headers['permissions-policy']).toContain('camera=()');
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    it('rejects requests from untrusted origins with 403 Forbidden (CORS Policy)', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .set('Origin', 'https://malicious-attacker-phishing.com');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toContain('CORS origin not allowed');
    });
  });

  // =============================================================
  // 10. Malicious File Metadata & Path Traversal Neutralization
  // =============================================================
  describe('10. Malicious File Metadata & Path Traversal Neutralization', () => {
    it('neutralizes path traversal attempts in filenames by generating a safe random key', async () => {
      const res = await request(app)
        .post('/api/v1/uploads/presign')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({
          purpose: UploadPurpose.PROFILE_PHOTO,
          filename: '../../../../etc/shadow.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 200000,
        });

      expect(res.status).toBe(200);
      const generatedKey = res.body.data.key;
      // Must not contain ../ and must be contained inside uploads/profile_photo/<userId>/
      expect(generatedKey).not.toContain('..');
      expect(generatedKey).not.toContain('/etc');
      expect(generatedKey.startsWith(`uploads/profile_photo/${customer1.id}/`)).toBe(true);
    });

    it('rejects uploads with mismatched spoofed MIME type and extension with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/uploads/presign')
        .set('Authorization', `Bearer ${customer1.token}`)
        .send({
          purpose: UploadPurpose.PROFILE_PHOTO,
          filename: 'malicious_payload.exe',
          mimeType: 'image/jpeg', // Spoofed image MIME with executable extension
          sizeBytes: 200000,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Invalid file extension');
    });
  });
});
