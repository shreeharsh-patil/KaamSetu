import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { userRepository } from '../src/modules/users/user.repository.js';
import { sessionRepository } from '../src/modules/sessions/session.repository.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { SessionModel } from '../src/modules/sessions/session.model.js';
import { UserRole } from '@kaamsetu/types';
import { signAccessToken } from '../src/modules/auth/token.util.js';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

const PHONE_PREFIX = '+9188123';

describe('Operational metrics endpoint security', () => {
  let admin: { id: string; token: string };
  let customer: { id: string; token: string };

  beforeAll(async () => {
    await connectMongoDB({ uri: TEST_MONGODB_URI });
    await UserModel.syncIndexes();
    await SessionModel.syncIndexes();

    const staleIds = (
      await UserModel.find({ phoneNumber: { $regex: `^\\${PHONE_PREFIX}` } })
        .select('_id')
        .lean()
    ).map((u) => u._id);
    if (staleIds.length > 0) {
      await SessionModel.deleteMany({ userId: { $in: staleIds } });
    }
    await UserModel.deleteMany({ phoneNumber: { $regex: `^\\${PHONE_PREFIX}` } });

    async function createUserAndToken(phoneSuffix: string, role: UserRole) {
      const u = await userRepository.create({
        phoneNumber: `${PHONE_PREFIX}${phoneSuffix}`,
        role,
      });
      const sess = await sessionRepository.create({
        userId: u.id,
        refreshTokenHash: `metrics-hash-${phoneSuffix}`,
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

    admin = await createUserAndToken('00001', UserRole.ADMIN);
    customer = await createUserAndToken('00002', UserRole.CUSTOMER);
  });

  afterAll(async () => {
    const ids = (
      await UserModel.find({ phoneNumber: { $regex: `^\\${PHONE_PREFIX}` } })
        .select('_id')
        .lean()
    ).map((u) => u._id);
    if (ids.length > 0) {
      await SessionModel.deleteMany({ userId: { $in: ids } });
    }
    await UserModel.deleteMany({ phoneNumber: { $regex: `^\\${PHONE_PREFIX}` } });
    await disconnectMongoDB();
  });

  it('/health and /ready remain public (infra probes)', async () => {
    expect((await request(app).get('/health')).status).toBe(200);
  });

  it('/metrics is 401 without a token (was previously world-readable)', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('/metrics is 403 for non-admin users', async () => {
    const res = await request(app)
      .get('/metrics')
      .set('Authorization', `Bearer ${customer.token}`);
    expect(res.status).toBe(403);
  });

  it('/metrics returns 200 with snapshot data for admins', async () => {
    const res = await request(app)
      .get('/metrics')
      .set('Authorization', `Bearer ${admin.token}`)
      .set('Accept', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('http');
  });

  it('/metrics also protected under /api/v1/metrics', async () => {
    expect((await request(app).get('/api/v1/metrics')).status).toBe(401);
    const res = await request(app)
      .get('/api/v1/metrics')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
  });
});
