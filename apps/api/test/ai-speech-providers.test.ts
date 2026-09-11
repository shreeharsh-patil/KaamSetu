import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { SessionModel } from '../src/modules/sessions/session.model.js';
import { userRepository } from '../src/modules/users/user.repository.js';
import { sessionRepository } from '../src/modules/sessions/session.repository.js';
import { aiService } from '../src/modules/ai/ai.service.js';
import { speechService } from '../src/modules/speech/speech.service.js';
import { mockAIProvider } from '../src/modules/ai/providers/mock-ai.provider.js';
import { mockSpeechProvider } from '../src/modules/speech/providers/mock-speech.provider.js';
import { CircuitBreaker } from '../src/modules/ai/circuit-breaker.js';
import { retrySafeOperation } from '../src/modules/ai/retry.util.js';
import {
  UserRole,
  JobUrgency,
} from '@kaamsetu/types';
import { signAccessToken } from '../src/modules/auth/token.util.js';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

const PHONE_PREFIX = '+91966666';

describe('AI & Speech Provider Layer (Phase 11)', () => {
  let customerUser: { id: string; token: string };

  beforeAll(async () => {
    await connectMongoDB({ uri: TEST_MONGODB_URI });
    await UserModel.syncIndexes();
    await SessionModel.syncIndexes();

    await UserModel.deleteMany({ phoneNumber: /^\+91966666/ });

    const u = await userRepository.create({
      phoneNumber: `${PHONE_PREFIX}0001`,
      role: UserRole.CUSTOMER,
    });
    const sess = await sessionRepository.create({
      userId: u.id,
      refreshTokenHash: `p11-hash-0001`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    const token = signAccessToken({
      userId: u.id,
      role: u.role,
      sessionId: sess.id,
      familyId: sess.familyId,
    });
    customerUser = { id: u.id, token };
  });

  afterAll(async () => {
    await UserModel.deleteMany({ phoneNumber: /^\+91966666/ });
    await disconnectMongoDB();
  });

  beforeEach(() => {
    // Reset test fault hooks and circuit breakers before each test
    mockAIProvider.setSimulatedFailures(0);
    mockAIProvider.setShouldTimeout(false);
    mockAIProvider.setReturnInvalidOutput(false);

    mockSpeechProvider.setSimulatedFailures(0);
    mockSpeechProvider.setShouldTimeout(false);

    aiService.getCircuitBreaker().reset();
    speechService.getCircuitBreaker().reset();
  });

  describe('1. Zod Output Validation & AI Structured Responses', () => {
    it('classifies job and strictly validates structured output against Zod schema', async () => {
      const res = await request(app)
        .post('/api/v1/ai/classify-job')
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({ text: 'My bathroom pipe is leaking and water is flooding urgently' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.categorySlug).toBe('plumbing');
      expect(data.suggestedSkills).toContain('Pipe Repair');
      expect(data.urgency).toBe(JobUrgency.EMERGENCY);
      expect(data.confidence).toBeGreaterThan(0.7);
      expect(typeof data.estimatedPrice).toBe('number');
    });

    it('extracts worker profile suggestions with skills, languages, and experience', async () => {
      const res = await request(app)
        .post('/api/v1/ai/extract-profile')
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({ text: 'I am a plumber with 8 years of experience. I speak Hindi and Kannada.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.suggestedSkills).toContain('Plumbing');
      expect(data.languages).toContain('hi');
      expect(data.languages).toContain('kn');
      expect(data.experienceYears).toBe(8);
      expect(data.confidence).toBeGreaterThan(0.7);
    });

    it('simplifies job description for workers', async () => {
      const res = await request(app)
        .post('/api/v1/ai/simplify-description')
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({
          description:
            'The client requires comprehensive maintenance of water conduits. Ensure all joints are sealed. Clean debris from the drain.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.simplifiedText).toBeTruthy();
      expect(Array.isArray(data.keyTasks)).toBe(true);
      expect(data.keyTasks.length).toBeGreaterThan(0);
    });

    it('translates text into regional languages with validation', async () => {
      const res = await request(app)
        .post('/api/v1/ai/translate')
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({
          text: 'kitchen tap burst repair',
          targetLanguage: 'hi',
          sourceLanguage: 'en',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.translatedText).toContain('रसोई के नल');
      expect(res.body.data.targetLanguage).toBe('hi');
      expect(res.body.data.isFallback).toBe(false);
    });
  });

  describe('2. Timeouts & Safe Retries', () => {
    it('retries safe idempotent operations with exponential backoff on transient failure', async () => {
      let attempts = 0;
      const result = await retrySafeOperation(
        async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Temporary gateway timeout 504');
          }
          return 'success-after-retries';
        },
        { maxRetries: 3, baseDelayMs: 20 }
      );

      expect(attempts).toBe(3);
      expect(result).toBe('success-after-retries');
    });

    it('respects timeout and triggers fallback when provider hangs', async () => {
      // Create a test circuit breaker with short timeout
      const breaker = new CircuitBreaker({ name: 'TimeoutTest', timeoutMs: 50 });

      const fallbackValue = { translatedText: 'original', sourceLanguage: 'en', targetLanguage: 'hi', isFallback: true };

      const result = await breaker.execute(
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return { translatedText: 'late', sourceLanguage: 'en', targetLanguage: 'hi', isFallback: false };
        },
        () => fallbackValue
      );

      expect(result).toEqual(fallbackValue);
    });
  });

  describe('3. Circuit Breaker Protection & State Transitions', () => {
    it('trips from CLOSED to OPEN after reaching failure threshold and executes fallbacks', async () => {
      const breaker = new CircuitBreaker({
        name: 'FaultTestBreaker',
        failureThreshold: 3,
        cooldownPeriodMs: 100,
      });

      expect(breaker.getStatus().state).toBe('CLOSED');

      // Induce 3 consecutive failures
      for (let i = 0; i < 3; i++) {
        await breaker.execute(
          async () => {
            throw new Error('Downstream provider 500');
          },
          () => 'fallback'
        );
      }

      // Breaker is now OPEN
      expect(breaker.getStatus().state).toBe('OPEN');
      expect(breaker.getStatus().failureCount).toBe(3);

      // In OPEN state, calls short-circuit to fallback immediately
      let providerCalled = false;
      const res = await breaker.execute(
        async () => {
          providerCalled = true;
          return 'from-provider';
        },
        () => 'fast-fallback'
      );

      expect(res).toBe('fast-fallback');
      expect(providerCalled).toBe(false); // Provider was never invoked!
    });

    it('transitions from OPEN to HALF_OPEN after cooldown and recovers to CLOSED on successes', async () => {
      const breaker = new CircuitBreaker({
        name: 'RecoveryBreaker',
        failureThreshold: 2,
        cooldownPeriodMs: 50, // Short cooldown for test
        halfOpenMaxSuccesses: 2,
      });

      // Trip to OPEN
      await breaker.execute(async () => { throw new Error('Err1'); }, () => 'fb');
      await breaker.execute(async () => { throw new Error('Err2'); }, () => 'fb');
      expect(breaker.getStatus().state).toBe('OPEN');

      // Wait for cooldown
      await new Promise((resolve) => setTimeout(resolve, 60));

      // First successful call in HALF_OPEN
      await breaker.execute(async () => 'success1');
      expect(breaker.getStatus().state).toBe('HALF_OPEN');

      // Second successful call recovers to CLOSED
      await breaker.execute(async () => 'success2');
      expect(breaker.getStatus().state).toBe('CLOSED');
      expect(breaker.getStatus().failureCount).toBe(0);
    });
  });

  describe('4. Graceful Fallback Behavior', () => {
    it('translation failure returns canonical original content with isFallback: true', async () => {
      // Simulate 10 failures to trip circuit breaker
      mockAIProvider.setSimulatedFailures(10);

      const res = await request(app)
        .post('/api/v1/ai/translate')
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({
          text: 'Plumbing tap replacement needed urgently',
          targetLanguage: 'hi',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Canonical fallback returned
      expect(res.body.data.translatedText).toBe('Plumbing tap replacement needed urgently');
      expect(res.body.data.isFallback).toBe(true);
    });

    it('job classification returns safe empty suggestions when AI is disabled/failing', async () => {
      mockAIProvider.setSimulatedFailures(10);

      const res = await request(app)
        .post('/api/v1/ai/classify-job')
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({ text: 'Some broken text' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.suggestedSkills).toEqual([]);
      expect(res.body.data.confidence).toBe(0);
    });

    it('profile extraction falls back to raw text input when AI fails', async () => {
      mockAIProvider.setSimulatedFailures(10);

      const res = await request(app)
        .post('/api/v1/ai/extract-profile')
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({ text: 'Carpenter with 5 years experience' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bio).toBe('Carpenter with 5 years experience');
      expect(res.body.data.confidence).toBe(0);
    });
  });

  describe('5. Safety Guardrails: Prohibiting Autonomous Administrative Actions', () => {
    it('STRICT INVARIANT: AI cannot approve worker verification', () => {
      expect(() => {
        aiService.assertNoDirectAdministrativeAction('APPROVE_VERIFICATION');
      }).toThrow('Security Policy Violation: AI is strictly prohibited from executing');
    });

    it('STRICT INVARIANT: AI cannot assign workers to jobs', () => {
      expect(() => {
        aiService.assertNoDirectAdministrativeAction('ASSIGN_WORKER');
      }).toThrow('Security Policy Violation');
    });

    it('STRICT INVARIANT: AI cannot modify financial ledger', () => {
      expect(() => {
        aiService.assertNoDirectAdministrativeAction('MODIFY_FINANCIAL_LEDGER');
      }).toThrow('Security Policy Violation');
    });

    it('STRICT INVARIANT: AI cannot ban or suspend users', () => {
      expect(() => {
        aiService.assertNoDirectAdministrativeAction('BAN_USER');
      }).toThrow('Security Policy Violation');
    });

    it('STRICT INVARIANT: AI cannot resolve disputes', () => {
      expect(() => {
        aiService.assertNoDirectAdministrativeAction('RESOLVE_DISPUTE');
      }).toThrow('Security Policy Violation');
    });
  });

  describe('6. Speech Provider Capabilities', () => {
    it('transcribes speech audio to text with language detection', async () => {
      const res = await request(app)
        .post('/api/v1/speech/transcribe')
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({
          audio: Buffer.from('mock audio samples containing hindi keyword नल').toString('base64'),
          mimeType: 'audio/wav',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.transcript).toContain('नल');
      expect(res.body.data.detectedLanguage).toBe('hi');
      expect(res.body.data.confidence).toBeGreaterThan(0.8);
    });

    it('synthesizes text to speech audio', async () => {
      const res = await request(app)
        .post('/api/v1/speech/synthesize')
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({
          text: 'Your booking has been confirmed',
          language: 'en',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.audioBase64).toBeTruthy();
      expect(res.body.data.mimeType).toBe('audio/mp3');
      expect(res.body.data.durationMs).toBeGreaterThan(0);
    });

    it('detects Indic languages from text scripts', async () => {
      // Devanagari (Hindi)
      const resHi = await request(app)
        .post('/api/v1/speech/detect-language')
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({ text: 'नमस्ते, मुझे काम चाहिए' });

      expect(resHi.status).toBe(200);
      expect(resHi.body.data.languageCode).toBe('hi');

      // Kannada
      const resKn = await request(app)
        .post('/api/v1/speech/detect-language')
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({ text: 'ನಮಸ್ಕಾರ, ನನಗೆ ಕೆಲಸ ಬೇಕು' });

      expect(resKn.status).toBe(200);
      expect(resKn.body.data.languageCode).toBe('kn');
    });
  });

  describe('7. Health & Provider Status', () => {
    it('returns AI provider and circuit breaker status', async () => {
      const res = await request(app).get('/api/v1/ai/status');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.providerName).toBe('mock-ai');
      expect(res.body.data.available).toBe(true);
      expect(res.body.data.circuitBreaker.state).toBe('CLOSED');
    });

    it('returns speech provider status', async () => {
      const res = await request(app).get('/api/v1/speech/status');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.providerName).toBe('mock-speech');
      expect(res.body.data.available).toBe(true);
    });
  });
});
