import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { DevOTPProvider } from '../src/modules/otp/otp.provider.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { SessionModel } from '../src/modules/sessions/session.model.js';
import { UserRole, UserStatus } from '@kaamsetu/types';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/index.js';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

describe('Authentication & Session Management (Phase 2)', () => {
  beforeAll(async () => {
    await connectMongoDB({ uri: TEST_MONGODB_URI });
    await UserModel.syncIndexes();
    await SessionModel.syncIndexes();
  });

  afterAll(async () => {
    const authUsers = await UserModel.find({ phoneNumber: /^\+9198888/ }).select('_id');
    const authUserIds = authUsers.map((u) => u._id);
    await SessionModel.deleteMany({ userId: { $in: authUserIds } });
    await UserModel.deleteMany({ phoneNumber: /^\+9198888/ });
    await disconnectMongoDB();
  });

  beforeEach(async () => {
    DevOTPProvider.clear();
    const authUsers = await UserModel.find({ phoneNumber: /^\+9198888/ }).select('_id');
    const authUserIds = authUsers.map((u) => u._id);
    await SessionModel.deleteMany({ userId: { $in: authUserIds } });
    await UserModel.deleteMany({ phoneNumber: /^\+9198888/ });
  });

  it('should request OTP and return cooldownSeconds', async () => {
    const res = await request(app)
      .post('/api/v1/auth/request-otp')
      .send({ phone: '9888800001' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('OTP sent successfully');
    expect(res.body.data.cooldownSeconds).toBe(60);

    const sentOtp = DevOTPProvider.getLastSentOTP('+919888800001');
    expect(sentOtp).toBeDefined();
    expect(sentOtp).toMatch(/^\d{6}$/);
  });

  it('should block resending OTP during cooldown period', async () => {
    await request(app)
      .post('/api/v1/auth/request-otp')
      .send({ phone: '9888800002' });

    // Immediate second request
    const res2 = await request(app)
      .post('/api/v1/auth/request-otp')
      .send({ phone: '9888800002' });

    expect(res2.status).toBe(400);
    expect(res2.body.success).toBe(false);
    expect(res2.body.error.message).toMatch(/wait before requesting another OTP/i);
  });

  it('should verify valid OTP, register new user, and return tokens + HttpOnly cookie', async () => {
    // 1. Request OTP
    await request(app)
      .post('/api/v1/auth/request-otp')
      .send({ phone: '9888800003' });

    const otp = DevOTPProvider.getLastSentOTP('+919888800003')!;

    // 2. Verify OTP
    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        phone: '9888800003',
        otp,
        deviceName: 'Pixel 8 Chrome',
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.user.phoneNumber).toBe('+919888800003');
    expect(verifyRes.body.data.user.role).toBe(UserRole.CUSTOMER);
    expect(verifyRes.body.data.accessToken).toBeDefined();

    // Check HttpOnly refresh token cookie
    const cookies = verifyRes.headers['set-cookie'] as string[] | undefined;
    expect(cookies).toBeDefined();
    const refreshCookie = cookies?.find((c) => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toMatch(/HttpOnly/i);

    // Verify session was created in DB
    const session = await SessionModel.findOne({
      userId: verifyRes.body.data.user.id,
    });
    expect(session).not.toBeNull();
    expect(session?.deviceName).toBe('Pixel 8 Chrome');
    expect(session?.revokedAt).toBeNull();
  });

  it('should reject wrong OTP and decrement attempts remaining', async () => {
    await request(app)
      .post('/api/v1/auth/request-otp')
      .send({ phone: '9888800004' });

    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        phone: '9888800004',
        otp: '000000',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/Invalid OTP.*2 attempt\(s\) remaining/i);
  });

  it('should invalidate OTP after exceeding maximum allowed attempts (3 attempts)', async () => {
    await request(app)
      .post('/api/v1/auth/request-otp')
      .send({ phone: '9888800005' });

    const validOtp = DevOTPProvider.getLastSentOTP('+919888800005')!;

    // Attempt 1: wrong
    await request(app).post('/api/v1/auth/verify-otp').send({ phone: '9888800005', otp: '111111' });
    // Attempt 2: wrong
    await request(app).post('/api/v1/auth/verify-otp').send({ phone: '9888800005', otp: '222222' });
    // Attempt 3: wrong -> should invalidate
    const res3 = await request(app).post('/api/v1/auth/verify-otp').send({ phone: '9888800005', otp: '333333' });
    expect(res3.status).toBe(400);
    expect(res3.body.error.message).toMatch(/Too many failed attempts/i);

    // Attempt 4: Even with the correct OTP now, it must be rejected
    const res4 = await request(app).post('/api/v1/auth/verify-otp').send({ phone: '9888800005', otp: validOtp });
    expect(res4.status).toBe(400);
    expect(res4.body.error.message).toMatch(/expired or was not requested/i);
  });

  it('should prevent OTP replay attack (cannot reuse OTP once verified)', async () => {
    await request(app).post('/api/v1/auth/request-otp').send({ phone: '9888800006' });
    const otp = DevOTPProvider.getLastSentOTP('+919888800006')!;

    // First verification: success
    const res1 = await request(app).post('/api/v1/auth/verify-otp').send({ phone: '9888800006', otp });
    expect(res1.status).toBe(200);

    // Second verification attempt with same OTP: rejected
    const res2 = await request(app).post('/api/v1/auth/verify-otp').send({ phone: '9888800006', otp });
    expect(res2.status).toBe(400);
  });

  it('should reject suspended users from logging in', async () => {
    // 1. Create suspended user in DB
    await UserModel.create({
      phoneNumber: '+919888800007',
      role: UserRole.CUSTOMER,
      status: UserStatus.SUSPENDED,
    });

    // 2. Request and get OTP
    await request(app).post('/api/v1/auth/request-otp').send({ phone: '9888800007' });
    const otp = DevOTPProvider.getLastSentOTP('+919888800007')!;

    // 3. Verify OTP -> should be 403 Forbidden
    const res = await request(app).post('/api/v1/auth/verify-otp').send({ phone: '9888800007', otp });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toMatch(/suspended/i);
  });

  it('should rotate refresh token and issue new access token on /auth/refresh', async () => {
    // 1. Login
    await request(app).post('/api/v1/auth/request-otp').send({ phone: '9888800008' });
    const otp = DevOTPProvider.getLastSentOTP('+919888800008')!;
    const loginRes = await request(app).post('/api/v1/auth/verify-otp').send({ phone: '9888800008', otp });

    const cookies = loginRes.headers['set-cookie'] as string[];
    const firstRefreshTokenCookie = cookies.find((c) => c.startsWith('refreshToken='))!;
    const firstAccessToken = loginRes.body.data.accessToken;

    // 2. Refresh token
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', firstRefreshTokenCookie);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    expect(refreshRes.body.data.accessToken).not.toBe(firstAccessToken);

    const newCookies = refreshRes.headers['set-cookie'] as string[];
    const secondRefreshTokenCookie = newCookies.find((c) => c.startsWith('refreshToken='))!;
    expect(secondRefreshTokenCookie).toBeDefined();
    expect(secondRefreshTokenCookie).not.toBe(firstRefreshTokenCookie);
  });

  it('should detect refresh token reuse and revoke the entire token family', async () => {
    // 1. Login
    await request(app).post('/api/v1/auth/request-otp').send({ phone: '9888800009' });
    const otp = DevOTPProvider.getLastSentOTP('+919888800009')!;
    const loginRes = await request(app).post('/api/v1/auth/verify-otp').send({ phone: '9888800009', otp });

    const cookies = loginRes.headers['set-cookie'] as string[];
    const firstRefreshTokenCookie = cookies.find((c) => c.startsWith('refreshToken='))!;

    // 2. Legitimate refresh
    const legitimateRefreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', firstRefreshTokenCookie);
    expect(legitimateRefreshRes.status).toBe(200);

    const secondCookies = legitimateRefreshRes.headers['set-cookie'] as string[];
    const secondRefreshTokenCookie = secondCookies.find((c) => c.startsWith('refreshToken='))!;

    // 3. MALICIOUS ATTACK / REUSE: Attacker attempts to use the old firstRefreshToken
    const reuseAttackRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', firstRefreshTokenCookie);

    expect(reuseAttackRes.status).toBe(401);
    expect(reuseAttackRes.body.error.message).toMatch(/Suspicious.*revoked/i);

    // 4. Verification: The legitimate secondRefreshToken must now ALSO be invalidated
    // because the entire compromised family was revoked!
    const subsequentLegitRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', secondRefreshTokenCookie);

    expect(subsequentLegitRes.status).toBe(401);
  });

  it('should successfully logout and revoke session', async () => {
    await request(app).post('/api/v1/auth/request-otp').send({ phone: '9888800010' });
    const otp = DevOTPProvider.getLastSentOTP('+919888800010')!;
    const loginRes = await request(app).post('/api/v1/auth/verify-otp').send({ phone: '9888800010', otp });

    const accessToken = loginRes.body.data.accessToken;
    const cookies = loginRes.headers['set-cookie'] as string[];
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='))!;

    // Logout
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', refreshCookie);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.data.message).toBe('Logged out successfully');

    // Trying to refresh after logout must fail
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(refreshRes.status).toBe(401);
  });

  it('should logout all sessions for a user', async () => {
    // Session 1 (Device A)
    await request(app).post('/api/v1/auth/request-otp').send({ phone: '9888800011' });
    const otp1 = DevOTPProvider.getLastSentOTP('+919888800011')!;
    const login1 = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '9888800011', otp: otp1, deviceName: 'iPhone 15' });

    // Request new OTP after clear
    DevOTPProvider.clear();
    await request(app).post('/api/v1/auth/request-otp').send({ phone: '9888800011' });
    const otp2 = DevOTPProvider.getLastSentOTP('+919888800011')!;
    const login2 = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '9888800011', otp: otp2, deviceName: 'MacBook Air' });

    const token2 = login2.body.data.accessToken;

    // Logout-all from device 2
    const logoutAllRes = await request(app)
      .post('/api/v1/auth/logout-all')
      .set('Authorization', `Bearer ${token2}`);

    expect(logoutAllRes.status).toBe(200);
    expect(logoutAllRes.body.data.message).toMatch(/All sessions logged out/i);

    // Verification: Both sessions must be revoked
    const sessions = await SessionModel.find({
      userId: login1.body.data.user.id,
      revokedAt: null,
    });
    expect(sessions).toHaveLength(0);
  });

  it('should list sessions and delete a specific session', async () => {
    await request(app).post('/api/v1/auth/request-otp').send({ phone: '9888800012' });
    const otp = DevOTPProvider.getLastSentOTP('+919888800012')!;
    const login = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '9888800012', otp, deviceName: 'Chrome Laptop' });

    const accessToken = login.body.data.accessToken;

    // Get sessions
    const listRes = await request(app)
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.sessions).toHaveLength(1);
    expect(listRes.body.data.sessions[0].deviceName).toBe('Chrome Laptop');
    expect(listRes.body.data.sessions[0].isCurrent).toBe(true);

    const sessionId = listRes.body.data.sessions[0].id;

    // Delete session
    const deleteRes = await request(app)
      .delete(`/api/v1/auth/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.message).toBe('Session revoked successfully');
  });

  it('should reject invalid or tampered access tokens in authenticate()', async () => {
    // 1. Missing header
    const res1 = await request(app).get('/api/v1/auth/sessions');
    expect(res1.status).toBe(401);

    // 2. Tampered token
    const res2 = await request(app)
      .get('/api/v1/auth/sessions')
      .set('Authorization', 'Bearer invalid.tampered.token');
    expect(res2.status).toBe(401);

    // 3. Expired token
    const expiredToken = jwt.sign(
      { userId: '507f1f77bcf86cd799439011', role: UserRole.CUSTOMER, sessionId: '507f1f77bcf86cd799439012' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '-1s', issuer: 'kaamsetu-api' }
    );
    const res3 = await request(app)
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res3.status).toBe(401);
    expect(res3.body.error.message).toMatch(/expired/i);
  });
});
