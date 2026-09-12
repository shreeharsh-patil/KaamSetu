import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Request ID Middleware', () => {
  it('should generate a new x-request-id header when not provided', async () => {
    const res = await request(app).get('/health');

    expect(res.headers).toHaveProperty('x-request-id');
    expect(res.headers['x-request-id']).toMatch(/^req_[a-f0-9-]+$/);
  });

  it('should propagate existing x-request-id header if provided by client', async () => {
    const customId = 'client-custom-req-id-12345';
    const res = await request(app)
      .get('/health')
      .set('x-request-id', customId);

    expect(res.headers['x-request-id']).toBe(customId);
  });
});
