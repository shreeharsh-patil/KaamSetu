import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from workspace root or current directory
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

// Shared schema: common configuration across all services
export const sharedEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  APP_VERSION: z.string().default('1.0.0'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  MONGODB_URI: z
    .string({
      required_error: 'MONGODB_URI is required (e.g. mongodb+srv://user:pass@cluster.mongodb.net/kaamsetu)',
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
      required_error: 'REDIS_URL is required (e.g. redis://host:6379 or rediss://... for TLS)',
    })
    .min(1, 'REDIS_URL cannot be empty')
    .refine(
      (val) => val.startsWith('redis://') || val.startsWith('rediss://'),
      {
        message: 'REDIS_URL must start with redis:// or rediss://',
      }
    ),
  REQUIRE_REDIS: z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .default('false'),
  STORAGE_PROVIDER: z.enum(['s3', 'mock']).default('mock'),
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
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().default(process.env['NODE_ENV'] || 'development'),
  METRICS_ENABLED: z.coerce.boolean().default(true),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  GEMINI_BACKUP_MODEL: z.string().default('gemini-3.5-flash'),
});

// Helper to normalize and clean CORS origins string into string[]
const parseCorsOrigins = (val: string): string[] => {
  return val
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
};

// API schema: specific to HTTP REST API & WebSockets server
export const apiEnvSchema = sharedEnvSchema.extend({
  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10))
    .pipe(
      z
        .number()
        .int()
        .min(1024, 'PORT must be between 1024 and 65535')
        .max(65535, 'PORT must be between 1024 and 65535')
    ),
  API_PREFIX: z.string().default('/api/v1'),
  JWT_ACCESS_SECRET: z
    .string({
      required_error: 'JWT_ACCESS_SECRET is required to sign user authentication tokens',
    })
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters for security'),
  JWT_REFRESH_SECRET: z
    .string({
      required_error: 'JWT_REFRESH_SECRET is required to issue refresh tokens',
    })
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters for security'),
  CORS_ORIGINS: z
    .string({
      required_error: 'CORS_ORIGINS is required (comma-separated origins, e.g. https://your-frontend.vercel.app)',
    })
    .default('http://localhost:3000')
    .transform(parseCorsOrigins),
  BODY_SIZE_LIMIT: z.string().default('1mb'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(300),
  REQUEST_TIMEOUT_MS: z.coerce.number().default(30000),
  WORKER_HEALTH_PORT: z.coerce.number().default(5001),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production' && data.CORS_ORIGINS.includes('*')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['CORS_ORIGINS'],
      message: 'CORS_ORIGINS cannot contain wildcard "*" in production when credentials are enabled',
    });
  }
});

// Worker schema: specific to BullMQ background workers
export const workerEnvSchema = sharedEnvSchema.extend({
  WORKER_HEALTH_PORT: z.coerce.number().default(5001),
  WORKER_CONCURRENCY: z.coerce.number().default(10),
});

// Backward-compatible schema definition
export const envSchema = apiEnvSchema;

export type SharedEnvConfig = z.infer<typeof sharedEnvSchema>;
export type ApiEnvConfig = z.infer<typeof apiEnvSchema>;
export type WorkerEnvConfig = z.infer<typeof workerEnvSchema>;
export type EnvConfig = ApiEnvConfig;

function formatValidationError(issues: z.ZodIssue[], context: string): string {
  const errorDetails = issues
    .map((issue) => `  - [${issue.path.join('.')}]: ${issue.message}`)
    .join('\n');

  return `\n❌ ${context} Environment Variable Validation Failed:\n${errorDetails}\n`;
}

export function validateApiEnv(customEnv?: Record<string, unknown>): ApiEnvConfig {
  const source = customEnv ?? process.env;
  const result = apiEnvSchema.safeParse(source);

  if (!result.success) {
    throw new Error(formatValidationError(result.error.issues, 'API'));
  }

  return result.data;
}

export function validateWorkerEnv(customEnv?: Record<string, unknown>): WorkerEnvConfig {
  const source = customEnv ?? process.env;
  const result = workerEnvSchema.safeParse(source);

  if (!result.success) {
    throw new Error(formatValidationError(result.error.issues, 'Worker'));
  }

  return result.data;
}

export function validateEnv(customEnv?: Record<string, unknown>): EnvConfig {
  return validateApiEnv(customEnv);
}
