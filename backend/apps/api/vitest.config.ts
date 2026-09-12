import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // The race suite intentionally drives 50 authenticated writes through Mongo.
    // Five seconds is too short on CI and can leave timed-out requests running
    // into the next assertion, so use a realistic integration-test budget.
    testTimeout: 30_000,
    include: ['test/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      PORT: '5000',
      APP_VERSION: '1.0.0',
      API_PREFIX: '/api/v1',
      MONGODB_URI: 'mongodb://localhost:27017/kaamsetu_test',
      REDIS_URL: 'redis://localhost:6379',
      JWT_ACCESS_SECRET: 'test_jwt_access_secret_key_minimum_32_characters_long',
      JWT_REFRESH_SECRET: 'test_jwt_refresh_secret_key_minimum_32_characters_long',
      CORS_ORIGINS: 'http://localhost:3000',
      LOG_LEVEL: 'fatal',
      // Hermetic tests: pin the AI/speech key to empty so the provider
      // registries keep the deterministic mock providers active. Without
      // this, dotenv (via @kaamsetu/config) loads a developer's real
      // GEMINI_API_KEY and the suite silently hits the live Gemini API —
      // slow, non-deterministic, and failing the mock-output assertions.
      GEMINI_API_KEY: '',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/types/**/*'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
