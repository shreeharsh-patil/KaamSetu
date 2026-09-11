import { z, ZodSchema } from 'zod';
import type { ErrorDetails } from '@kaamsetu/types';
import { UserRole, UserStatus } from '@kaamsetu/types';

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId format');

/**
 * Normalizes phone numbers to standard E.164 format (+91XXXXXXXXXX)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) {
    throw new Error('Phone number is required');
  }

  // Remove spaces, hyphens, parentheses, etc.
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Check Indian mobile number patterns
  // Pattern 1: +919876543210
  // Pattern 2: 919876543210
  // Pattern 3: 09876543210
  // Pattern 4: 9876543210
  const match = cleaned.match(/^(?:\+91|91|0)?([6-9]\d{9})$/);
  if (!match || !match[1]) {
    throw new Error('Invalid Indian mobile number format. Must be a 10-digit number starting with 6-9');
  }

  return `+91${match[1]}`;
}

export const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .transform((val, ctx) => {
    try {
      return normalizePhoneNumber(val);
    } catch (err) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err instanceof Error ? err.message : 'Invalid phone number',
      });
      return z.NEVER;
    }
  });

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100)),
});

// User Validation Schemas
export const createUserSchema = z.object({
  phoneNumber: phoneSchema,
  role: z.nativeEnum(UserRole).optional().default(UserRole.CUSTOMER),
  phoneVerified: z.boolean().optional().default(false),
  email: z.string().email('Invalid email address').nullable().optional(),
  emailVerified: z.boolean().optional().default(false),
  preferredLanguage: z.string().optional().default('en'),
  status: z.nativeEnum(UserStatus).optional().default(UserStatus.ACTIVE),
  profilePhotoUrl: z.string().url('Invalid URL').nullable().optional(),
});

export const updateUserSchema = createUserSchema.partial().extend({
  lastLoginAt: z.date().optional(),
  deletedAt: z.date().nullable().optional(),
});

// Service Category Validation Schemas
export const createServiceCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lower-kebab-case (e.g. home-cleaning)'),
  description: z.string().max(1000).nullable().optional(),
  translations: z.record(z.string(), z.string()).optional().default({}),
  icon: z.string().nullable().optional(),
  active: z.boolean().optional().default(true),
  displayOrder: z.number().int().optional().default(0),
});

export const updateServiceCategorySchema = createServiceCategorySchema.partial();

// Skill Validation Schemas
export const createSkillSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lower-kebab-case'),
  categoryId: objectIdSchema,
  active: z.boolean().optional().default(true),
  translations: z.record(z.string(), z.string()).optional().default({}),
});

export const updateSkillSchema = createSkillSchema.partial();

// Worker Profile Validation Schemas
export const createWorkerProfileSchema = z.object({
  userId: objectIdSchema,
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  bio: z.string().max(2000).nullable().optional(),
  primaryCategoryId: objectIdSchema,
  skillIds: z.array(objectIdSchema).optional().default([]),
  serviceArea: z.object({
    type: z.literal('Point').optional().default('Point'),
    coordinates: z
      .tuple([
        z.number().min(-180).max(180), // Longitude
        z.number().min(-90).max(90),   // Latitude
      ]),
    radiusKm: z.number().positive().max(100).optional().default(15),
    address: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    pincode: z.string().nullable().optional(),
  }),
  hourlyRate: z.number().positive().nullable().optional(),
  isAvailable: z.boolean().optional().default(true),
});

export const updateWorkerProfileSchema = createWorkerProfileSchema.partial();

// Customer Profile Validation Schemas
export const customerAddressSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1).max(50),
  addressLine: z.string().min(5).max(255),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid Indian 6-digit pincode'),
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]).optional(),
  isDefault: z.boolean().optional().default(false),
});

export const createCustomerProfileSchema = z.object({
  userId: objectIdSchema,
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  addresses: z.array(customerAddressSchema).optional().default([]),
});

export const updateCustomerProfileSchema = createCustomerProfileSchema.partial();

// Auth Validation Schemas (Phase 2)
export const requestOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit numeric code'),
  deviceName: z.string().max(100).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token is required').optional(),
});

export function formatZodIssues(error: z.ZodError): ErrorDetails[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}

export function validateData<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ErrorDetails[] } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: formatZodIssues(result.error),
    };
  }
  return {
    success: true,
    data: result.data,
  };
}

export { z };
