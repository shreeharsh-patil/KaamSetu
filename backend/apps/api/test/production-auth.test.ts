import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { DevOTPProvider } from '../src/modules/otp/otp.provider.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { SessionModel } from '../src/modules/sessions/session.model.js';
import { UserRole, UserStatus } from '@kaamsetu/types';
import { otpService } from '../src/modules/otp/otp.service.js';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

describe('Production Authentication & Identity Management', () => {
  beforeAll(async () => {
    await connectMongoDB({ uri: TEST_MONGODB_URI });
    await UserModel.syncIndexes();
    await SessionModel.syncIndexes();
  });

  afterAll(async () => {
    const authUsers = await UserModel.find({ phoneNumber: /^\+9198889/ }).select('_id');
    const authUserIds = authUsers.map((u) => u._id);
    await SessionModel.deleteMany({ userId: { $in: authUserIds } });
    await UserModel.deleteMany({ phoneNumber: /^\+9198889/ });
    await UserModel.deleteMany({ email: /@prodauthtest\.com$/ });
    await disconnectMongoDB();
  });

  beforeEach(async () => {
    DevOTPProvider.clear();
    await otpService.clearForTest();
    const authUsers = await UserModel.find({ phoneNumber: /^\+9198889/ }).select('_id');
    const authUserIds = authUsers.map((u) => u._id);
    await SessionModel.deleteMany({ userId: { $in: authUserIds } });
    await UserModel.deleteMany({ phoneNumber: /^\+9198889/ });
    await UserModel.deleteMany({ email: /@prodauthtest\.com$/ });
  });

  describe('1. Registration / Signup Flow', () => {
    it('should successfully request OTP for new user with complete details', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup/request-otp')
        .send({
          firstName: 'Aarav',
          lastName: 'Sharma',
          email: 'aarav@prodauthtest.com',
          phone: '9888900001',
          role: 'CUSTOMER',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('OTP sent successfully');
      expect(res.body.data.phone).toBe('+919888900001');
      expect(res.body.data.devHint).toContain('123456');

      const sentOtp = DevOTPProvider.getLastSentOTP('+919888900001');
      expect(sentOtp).toBe('123456');
    });

    it('should reject signup with invalid or missing fields', async () => {
      // Missing first name
      const res1 = await request(app)
        .post('/api/v1/auth/signup/request-otp')
        .send({
          firstName: '',
          lastName: 'Sharma',
          email: 'aarav@prodauthtest.com',
          phone: '9888900001',
        });
      expect(res1.status).toBe(422);

      // Invalid email
      const res2 = await request(app)
        .post('/api/v1/auth/signup/request-otp')
        .send({
          firstName: 'Aarav',
          lastName: 'Sharma',
          email: 'not-an-email',
          phone: '9888900001',
        });
      expect(res2.status).toBe(422);

      // Invalid Indian phone number (starts with 1)
      const res3 = await request(app)
        .post('/api/v1/auth/signup/request-otp')
        .send({
          firstName: 'Aarav',
          lastName: 'Sharma',
          email: 'aarav@prodauthtest.com',
          phone: '1234567890',
        });
      expect(res3.status).toBe(422);
    });

    it('should reject signup if phone number is already registered (409 Conflict)', async () => {
      // Pre-create user with phone
      await UserModel.create({
        phoneNumber: '+919888900002',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      });

      const res = await request(app)
        .post('/api/v1/auth/signup/request-otp')
        .send({
          firstName: 'Neha',
          lastName: 'Patel',
          email: 'neha@prodauthtest.com',
          phone: '9888900002',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toMatch(/phone number already exists/i);
    });

    it('should reject signup if email is already registered (409 Conflict)', async () => {
      // Pre-create user with email
      await UserModel.create({
        phoneNumber: '+919888900003',
        email: 'priya@prodauthtest.com',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      });

      const res = await request(app)
        .post('/api/v1/auth/signup/request-otp')
        .send({
          firstName: 'Priya',
          lastName: 'Singh',
          email: 'priya@prodauthtest.com',
          phone: '9888900004',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toMatch(/email address already exists/i);
    });

    it('should verify OTP and provision fully configured user with name, email, and phoneVerifiedAt', async () => {
      // 1. Request signup OTP
      await request(app)
        .post('/api/v1/auth/signup/request-otp')
        .send({
          firstName: 'Vikram',
          lastName: 'Malhotra',
          email: 'vikram@prodauthtest.com',
          phone: '9888900005',
          role: 'WORKER',
        });

      const otp = DevOTPProvider.getLastSentOTP('+919888900005')!;
      expect(otp).toBeDefined();

      // 2. Verify signup OTP
      const res = await request(app)
        .post('/api/v1/auth/signup/verify-otp')
        .send({
          phone: '9888900005',
          otp,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const user = res.body.data.user;
      expect(user.firstName).toBe('Vikram');
      expect(user.lastName).toBe('Malhotra');
      expect(user.fullName).toBe('Vikram Malhotra');
      expect(user.email).toBe('vikram@prodauthtest.com');
      expect(user.phoneVerified).toBe(true);
      expect(user.phoneVerifiedAt).toBeDefined();
      expect(user.role).toBe('WORKER');
      expect(user.requiresProfileCompletion).toBe(false);

      expect(res.body.data.accessToken).toBeDefined();

      // Check DB persisted correctly
      const dbUser = await UserModel.findOne({ phoneNumber: '+919888900005' });
      expect(dbUser).toBeDefined();
      expect(dbUser!.firstName).toBe('Vikram');
      expect(dbUser!.lastName).toBe('Malhotra');
      expect(dbUser!.email).toBe('vikram@prodauthtest.com');
      expect(dbUser!.phoneVerified).toBe(true);
      expect(dbUser!.phoneVerifiedAt).toBeInstanceOf(Date);
    });
  });

  describe('2. Multi-Identifier Sign-In (Email or Phone)', () => {
    it('should allow requesting login OTP via phone number', async () => {
      const res = await request(app)
        .post('/api/v1/auth/request-otp')
        .send({ identifier: '9888900010' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phone).toBe('+919888900010');

      const otp = DevOTPProvider.getLastSentOTP('+919888900010');
      expect(otp).toBe('123456');
    });

    it('should allow requesting login OTP via registered email address', async () => {
      // Pre-create user with email and phone
      await UserModel.create({
        firstName: 'Ananya',
        lastName: 'Deshmukh',
        phoneNumber: '+919888900011',
        email: 'ananya@prodauthtest.com',
        phoneVerified: true,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      });

      const res = await request(app)
        .post('/api/v1/auth/request-otp')
        .send({ identifier: 'ananya@prodauthtest.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('OTP sent to registered phone number');
      expect(res.body.data.phone).toBe('+919888900011');

      const otp = DevOTPProvider.getLastSentOTP('+919888900011');
      expect(otp).toBe('123456');
    });

    it('should return 404 when requesting OTP for non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/request-otp')
        .send({ identifier: 'nonexistent@prodauthtest.com' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(res.body.error.message).toMatch(/no account found with this email/i);
    });
  });

  describe('3. Legacy User Flow & Profile Completion', () => {
    it('should flag requiresProfileCompletion: true for legacy phone-only users on login', async () => {
      // 1. Create a legacy phone-only account (firstName, lastName, email all null)
      await UserModel.create({
        phoneNumber: '+919888900020',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        phoneVerified: true,
      });

      // 2. Request OTP and verify
      await request(app)
        .post('/api/v1/auth/request-otp')
        .send({ phone: '9888900020' });

      const otp = DevOTPProvider.getLastSentOTP('+919888900020')!;
      const loginRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone: '9888900020', otp });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.user.requiresProfileCompletion).toBe(true);
      expect(loginRes.body.requiresProfileCompletion).toBe(true);
    });

    it('should allow legacy user to complete profile with firstName, lastName, and email', async () => {
      // 1. Create legacy user
      const userDoc = await UserModel.create({
        phoneNumber: '+919888900021',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        phoneVerified: true,
      });

      // 2. Log in to get accessToken
      await request(app).post('/api/v1/auth/request-otp').send({ phone: '9888900021' });
      const otp = DevOTPProvider.getLastSentOTP('+919888900021')!;
      const loginRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone: '9888900021', otp });

      const accessToken = loginRes.body.data.accessToken;

      // 3. Complete profile
      const completeRes = await request(app)
        .post('/api/v1/auth/complete-profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'Suresh',
          lastName: 'Raina',
          email: 'suresh@prodauthtest.com',
        });

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.success).toBe(true);
      expect(completeRes.body.data.user.firstName).toBe('Suresh');
      expect(completeRes.body.data.user.lastName).toBe('Raina');
      expect(completeRes.body.data.user.fullName).toBe('Suresh Raina');
      expect(completeRes.body.data.user.email).toBe('suresh@prodauthtest.com');
      expect(completeRes.body.data.user.requiresProfileCompletion).toBe(false);

      // Verify in DB
      const updatedUser = await UserModel.findById(userDoc._id);
      expect(updatedUser!.firstName).toBe('Suresh');
      expect(updatedUser!.lastName).toBe('Raina');
      expect(updatedUser!.email).toBe('suresh@prodauthtest.com');
    });

    it('should reject complete-profile if email is already used by another account (409 Conflict)', async () => {
      // User 1 already has the email
      await UserModel.create({
        firstName: 'Existing',
        lastName: 'User',
        phoneNumber: '+919888900022',
        email: 'taken@prodauthtest.com',
        role: UserRole.CUSTOMER,
      });

      // User 2 tries to take it
      await UserModel.create({
        phoneNumber: '+919888900023',
        role: UserRole.CUSTOMER,
      });

      await request(app).post('/api/v1/auth/request-otp').send({ phone: '9888900023' });
      const otp = DevOTPProvider.getLastSentOTP('+919888900023')!;
      const loginRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone: '9888900023', otp });

      const accessToken = loginRes.body.data.accessToken;

      const res = await request(app)
        .post('/api/v1/auth/complete-profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'New',
          lastName: 'Name',
          email: 'taken@prodauthtest.com',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toMatch(/already in use/i);
    });
  });

  describe('4. Security & OTP Replay Protection', () => {
    it('should prevent replay of verified signup OTP', async () => {
      await request(app)
        .post('/api/v1/auth/signup/request-otp')
        .send({
          firstName: 'Karan',
          lastName: 'Verma',
          email: 'karan@prodauthtest.com',
          phone: '9888900030',
        });

      const otp = DevOTPProvider.getLastSentOTP('+919888900030')!;

      // First verification succeeds
      const res1 = await request(app)
        .post('/api/v1/auth/signup/verify-otp')
        .send({ phone: '9888900030', otp });
      expect(res1.status).toBe(200);

      // Second verification attempt with same OTP MUST fail
      const res2 = await request(app)
        .post('/api/v1/auth/signup/verify-otp')
        .send({ phone: '9888900030', otp });
      expect(res2.status).toBe(400);
      expect(res2.body.error.message).toMatch(/expired or was not requested/i);
    });

    it('should prevent replay of verified login OTP', async () => {
      await request(app)
        .post('/api/v1/auth/request-otp')
        .send({ phone: '9888900031' });

      const otp = DevOTPProvider.getLastSentOTP('+919888900031')!;

      // First verification succeeds
      const res1 = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone: '9888900031', otp });
      expect(res1.status).toBe(200);

      // Second verification attempt with same OTP MUST fail
      const res2 = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone: '9888900031', otp });
      expect(res2.status).toBe(400);
      expect(res2.body.error.message).toMatch(/expired or was not requested/i);
    });
  });
});
