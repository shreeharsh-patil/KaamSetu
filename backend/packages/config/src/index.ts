import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from workspace root or current directory
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1024).max(65535)),
  APP_VERSION: z.string().default('1.0.0'),
  API_PREFIX: z.string().default('/api/v1'),
  MONGODB_URI: z
    .string({
      required_error: 'MONGODB_URI is required',
    })
    .min(1, 'MONGODB_URI cannot be empty')
    .refine(
      (val) => val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'),
      {
        message: 'MONGODB_URI must start with mongodb:// or mongodb+srv://',
      }
    ),
  REDIS_URL: z
    .string({
      required_error: 'REDIS_URL is required',
    })
    .min(1, 'REDIS_URL cannot be empty')
    .refine(
      (val) => val.startsWith('redis://') || val.startsWith('rediss://'),
      {
        message: 'REDIS_URL must start with redis:// or rediss://',
      }
    ),
  JWT_ACCESS_SECRET: z
    .string({
      required_error: 'JWT_ACCESS_SECRET is required',
    })
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters for security'),
  JWT_REFRESH_SECRET: z
    .string({
      required_error: 'JWT_REFRESH_SECRET is required',
    })
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters for security'),
  CORS_ORIGINS: z
    .string({
      required_error: 'CORS_ORIGINS is required (comma-separated origins)',
    })
    .default('http://localhost:3000')
    .transform((val) =>
      val
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  BODY_SIZE_LIMIT: z.string().default('1mb'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('ap-south-1'),
  S3_BUCKET: z.string().default('kaamsetu-uploads'),
  S3_ACCESS_KEY_ID: z.string().default('test-access-key'),
  S3_SECRET_ACCESS_KEY: z.string().default('test-secret-key'),
  S3_FORCE_PATH_STYLE: z
    .string()
    .optional()
    .transform((val) => val === 'true' || val === undefined)
    .default('true'),
  CDN_BASE_URL: z.string().optional(),
  STORAGE_PROVIDER: z.enum(['s3', 'mock']).default('mock'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(300),
  REQUEST_TIMEOUT_MS: z.coerce.number().default(30000),
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().default(process.env['NODE_ENV'] || 'development'),
  METRICS_ENABLED: z.coerce.boolean().default(true),
  WORKER_HEALTH_PORT: z.coerce.number().default(5001),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  GEMINI_BACKUP_MODEL: z.string().default('gemini-3.5-flash'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(customEnv?: Record<string, unknown>): EnvConfig {
  const source = customEnv ?? process.env;
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - [${issue.path.join('.')}]: ${issue.message}`)
      .join('\n');

    const errorMessage = `\n❌ Environment Variable Validation Failed:\n${errorDetails}\n`;
    
    // In test environment, throw error directly so tests can catch it
    throw new Error(errorMessage);
  }

  return result.data;
}

export { envSchema };
