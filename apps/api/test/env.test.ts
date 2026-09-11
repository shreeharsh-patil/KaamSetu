import { describe, it, expect } from 'vitest';
import { validateEnv } from '@kaamsetu/config';

describe('Environment Variable Validation', () => {
  const validEnv = {
    NODE_ENV: 'development',
    PORT: '5000',
    APP_VERSION: '1.0.0',
    API_PREFIX: '/api/v1',
    MONGODB_URI: 'mongodb://localhost:27017/kaamsetu_test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'this_is_a_32_character_jwt_access_secret_key!',
    JWT_REFRESH_SECRET: 'this_is_a_32_character_jwt_refresh_secret_key!',
    CORS_ORIGINS: 'http://localhost:3000,http://localhost:5173',
  };

  it('should succeed when all required variables are valid', () => {
    const config = validateEnv(validEnv);
    expect(config.NODE_ENV).toBe('development');
    expect(config.PORT).toBe(5000);
    expect(config.CORS_ORIGINS).toEqual([
      'http://localhost:3000',
      'http://localhost:5173',
    ]);
  });

  it('should fail and throw an error when MONGODB_URI is missing', () => {
    const invalid = { ...validEnv };
    delete (invalid as Record<string, unknown>)['MONGODB_URI'];

    expect(() => validateEnv(invalid)).toThrowError(
      /Environment Variable Validation Failed/
    );
  });

  it('should fail when REDIS_URL is invalid protocol', () => {
    const invalid = { ...validEnv, REDIS_URL: 'http://localhost:6379' };

    expect(() => validateEnv(invalid)).toThrowError(
      /REDIS_URL must start with redis:\/\/ or rediss:\/\//
    );
  });

  it('should fail when JWT secret is shorter than 32 characters', () => {
    const invalid = { ...validEnv, JWT_ACCESS_SECRET: 'too_short' };

    expect(() => validateEnv(invalid)).toThrowError(
      /JWT_ACCESS_SECRET must be at least 32 characters/
    );
  });

  it('should fail when PORT is outside allowable range', () => {
    const invalid = { ...validEnv, PORT: '80' };

    expect(() => validateEnv(invalid)).toThrowError();
  });
});
