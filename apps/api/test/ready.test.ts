import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as mongodbModule from '../src/database/mongodb.js';
import * as redisModule from '../src/database/redis.js';

describe('GET /ready', () => {
  it('should return 200 when both database and redis are connected', async () => {
    vi.spyOn(mongodbModule, 'getMongoDBStatus').mockReturnValue('connected');
    vi.spyOn(redisModule, 'getRedisStatus').mockResolvedValue('connected');

    const res = await request(app).get('/ready');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ready');
    expect(res.body.services).toEqual({
      database: 'connected',
      redis: 'connected',
    });
  });

  it('should return 503 when database is disconnected', async () => {
    vi.spyOn(mongodbModule, 'getMongoDBStatus').mockReturnValue('disconnected');
    vi.spyOn(redisModule, 'getRedisStatus').mockResolvedValue('connected');

    const res = await request(app).get('/ready');

    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty('status', 'not_ready');
    expect(res.body.services.database).toBe('disconnected');
  });

  it('should return 503 when redis is disconnected', async () => {
    vi.spyOn(mongodbModule, 'getMongoDBStatus').mockReturnValue('connected');
    vi.spyOn(redisModule, 'getRedisStatus').mockResolvedValue('disconnected');

    const res = await request(app).get('/ready');

    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty('status', 'not_ready');
    expect(res.body.services.redis).toBe('disconnected');
  });
});
