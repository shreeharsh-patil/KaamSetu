import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { app } from '../src/app.js';
import {
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
} from '../src/errors/index.js';
import {
  requestIdMiddleware,
  notFoundMiddleware,
  errorHandlerMiddleware,
} from '../src/middlewares/index.js';

describe('Error Handler Middleware & 404', () => {
  it('should return 404 with standardized error format for unknown routes on main app', async () => {
    const res = await request(app).get('/api/v1/non-existent-route-xyz');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toEqual({
      code: 'NOT_FOUND',
      message: 'Route GET /api/v1/non-existent-route-xyz not found',
      requestId: expect.any(String),
    });
  });

  it('should format custom AppError correctly with status code and code string', async () => {
    const testApp = express();
    testApp.use(requestIdMiddleware);
    testApp.get('/test-bad-request', () => {
      throw new BadRequestError('Invalid input provided');
    });
    testApp.use(errorHandlerMiddleware);

    const res = await request(testApp).get('/test-bad-request');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid input provided',
        requestId: expect.any(String),
      },
    });
  });

  it('should format ValidationError with details array', async () => {
    const testApp = express();
    testApp.use(requestIdMiddleware);
    testApp.get('/test-validation-error', () => {
      throw new ValidationError('Validation failed', [
        { field: 'phone', message: 'Invalid phone number' },
      ]);
    });
    testApp.use(errorHandlerMiddleware);

    const res = await request(testApp).get('/test-validation-error');

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual([
      { field: 'phone', message: 'Invalid phone number' },
    ]);
  });

  it('should handle UnauthorizedError with 401 status', async () => {
    const testApp = express();
    testApp.use(requestIdMiddleware);
    testApp.get('/test-unauthorized', () => {
      throw new UnauthorizedError('Token expired');
    });
    testApp.use(errorHandlerMiddleware);

    const res = await request(testApp).get('/test-unauthorized');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should handle NotFoundError explicitly', async () => {
    const testApp = express();
    testApp.use(requestIdMiddleware);
    testApp.get('/test-not-found', () => {
      throw new NotFoundError('Worker profile not found');
    });
    testApp.use(errorHandlerMiddleware);

    const res = await request(testApp).get('/test-not-found');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toBe('Worker profile not found');
  });

  it('should handle unhandled unexpected errors without crashing', async () => {
    const testApp = express();
    testApp.use(requestIdMiddleware);
    testApp.get('/test-unhandled', () => {
      throw new Error('Database disk crashed unexpectedly');
    });
    testApp.use(errorHandlerMiddleware);

    const res = await request(testApp).get('/test-unhandled');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(res.body.error.requestId).toBeDefined();
    expect(res.body).not.toHaveProperty('stack');
  });
});
