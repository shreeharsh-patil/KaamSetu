import { validateEnv, EnvConfig } from '@kaamsetu/config';
import { createLogger, Logger } from '@kaamsetu/logger';

// Validate environment variables on application startup.
// Will throw an error and halt execution immediately if invalid.
export const env: EnvConfig = validateEnv();

export const logger: Logger = createLogger({
  level: env.LOG_LEVEL,
  isProduction: env.NODE_ENV === 'production',
  serviceName: 'kaamsetu-api',
});

export const APP_CONFIG = {
  name: 'KaamSetu API',
  version: env.APP_VERSION,
  prefix: env.API_PREFIX,
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
} as const;
