import { z, ZodSchema } from 'zod';
import type { ErrorDetails } from '@kaamsetu/types';
import { UserRole, UserStatus, WorkerAvailability, WorkerVerificationStatus, SkillLevel, JobUrgency, JobStatus, JobOfferStatus } from '@kaamsetu/types';

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

export const longitudeSchema = z
  .number()
  .min(-180, 'Longitude must be between -180 and 180 degrees')
  .max(180, 'Longitude must be between -180 and 180 degrees');

export const latitudeSchema = z
  .number()
  .min(-90, 'Latitude must be between -90 and 90 degrees')
  .max(90, 'Latitude must be between -90 and 90 degrees');

export const coordinatesSchema = z.tuple([longitudeSchema, latitudeSchema]);

export const serviceRadiusSchema = z
  .number()
  .min(1, 'Service radius must be at least 1 km')
  .max(100, 'Service radius cannot exceed 100 km');

export const updateWorkerLocationSchema = z.object({
  coordinates: coordinatesSchema,
});

export const updateWorkerAvailabilitySchema = z.object({
  availabilityStatus: z.nativeEnum(WorkerAvailability),
});

export const workerVerificationStatusSchema = z.nativeEnum(WorkerVerificationStatus);

export const updateWorkerServiceRadiusSchema = z.object({
  radiusKm: serviceRadiusSchema,
});

export const addWorkerSkillSchema = z.object({
  skillId: objectIdSchema,
  experienceYears: z.number().min(0, 'Experience years cannot be negative').max(50, 'Experience cannot exceed 50 years'),
  level: z.nativeEnum(SkillLevel).default(SkillLevel.INTERMEDIATE),
});

export const workerPricingSchema = z.object({
  hourlyRate: z.number().min(0, 'Hourly rate cannot be negative').max(100000, 'Hourly rate is too high').nullable().optional(),
  customRateDescription: z.string().max(250).nullable().optional(),
  currency: z.string().default('INR').optional(),
});

export const workerPortfolioItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).nullable().optional(),
  imageUrl: z.string().url('Image URL must be valid'),
});

export const patchWorkerMeSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(100).optional(),
  fullName: z.string().min(2).max(100).optional(),
  bio: z.string().max(1000, 'Bio cannot exceed 1000 characters').nullable().optional(),
  languages: z.array(z.string().min(2).max(10)).max(10).optional(),
  pricing: workerPricingSchema.optional(),
  hourlyRate: z.number().min(0).max(100000).nullable().optional(),
  portfolio: z.array(workerPortfolioItemSchema).max(20).optional(),
});

// Customer Profile Validation Schemas
export const customerAddressSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'Address label is required').max(50),
  addressLine: z.string().min(3, 'Address line must be at least 3 characters').max(255),
  city: z.string().min(2, 'City is required').max(100),
  state: z.string().min(2, 'State is required').max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid Indian 6-digit pincode'),
  coordinates: coordinatesSchema.optional(),
  isDefault: z.boolean().optional().default(false),
});

export const addCustomerAddressSchema = customerAddressSchema.omit({ id: true });
export const updateCustomerAddressSchema = addCustomerAddressSchema.partial();

export const patchCustomerMeSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(100).optional(),
  fullName: z.string().min(2).max(100).optional(),
});

export const createCustomerProfileSchema = z.object({
  userId: objectIdSchema,
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  displayName: z.string().min(2).max(100).optional(),
  addresses: z.array(customerAddressSchema).optional().default([]),
});

export const updateCustomerProfileSchema = createCustomerProfileSchema.partial();

// ---------------- Job Lifecycle Validation (Phase 4) ----------------

export const geoPointSchema = z.object({
  type: z.literal('Point').optional().default('Point'),
  coordinates: z
    .tuple([
      z.number().min(-180).max(180), // Longitude
      z.number().min(-90).max(90), // Latitude
    ])
    .refine(([lng, lat]) => !(lng === 0 && lat === 0), {
      message: 'Null island (0, 0) is not a valid job location',
    }),
});

export const jobImageSchema = z.object({
  key: z.string().min(1).max(512),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  mimeType: z.string().max(100).optional(),
});

export const createJobSchema = z.object({
  categoryId: objectIdSchema,
  requiredSkills: z.array(objectIdSchema).max(10).optional().default([]),
  title: z.string().min(5, 'Title must be at least 5 characters').max(120),
  description: z.string().max(2000).nullable().optional(),
  source: z.enum(['APP', 'VOICE', 'SUPPORT']).optional().default('APP'),
  location: geoPointSchema,
  address: z.object({
    line: z.string().min(5, 'Address line must be at least 5 characters').max(255),
    city: z.string().min(2).max(100),
    state: z.string().min(2).max(100),
    pincode: z.string().regex(/^\d{6}$/, 'Invalid Indian 6-digit pincode'),
  }),
  preferredTime: z.coerce
    .date()
    .refine((d) => d.getTime() > Date.now() - 60_000, {
      message: 'Preferred time must be in the future',
    })
    .refine((d) => d.getTime() < Date.now() + 1000 * 60 * 60 * 24 * 90, {
      message: 'Preferred time cannot be more than 90 days in the future',
    }),
  urgency: z.nativeEnum(JobUrgency),
  estimatedPrice: z.number().positive().max(10_000_000).nullable().optional(),
  images: z.array(jobImageSchema).max(5).optional().default([]),
  publishImmediately: z.boolean().optional().default(false),
});

export type CreateJobInputDto = z.infer<typeof createJobSchema>;

/** Only editable fields; status is deliberately absent — changes go through the state machine. */
export const updateJobSchema = z
  .object({
    title: createJobSchema.shape.title.optional(),
    description: createJobSchema.shape.description.optional(),
    categoryId: objectIdSchema.optional(),
    requiredSkills: createJobSchema.shape.requiredSkills.optional(),
    preferredTime: createJobSchema.shape.preferredTime.optional(),
    urgency: createJobSchema.shape.urgency.optional(),
    estimatedPrice: createJobSchema.shape.estimatedPrice.optional(),
    location: geoPointSchema.optional(),
    address: createJobSchema.shape.address.optional(),
    images: createJobSchema.shape.images.optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'At least one editable field must be provided' }
  );

export type UpdateJobInputDto = z.infer<typeof updateJobSchema>;

export const cancelJobSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason must be at least 3 characters').max(500),
});

export type CancelJobInputDto = z.infer<typeof cancelJobSchema>;

export const listJobsQuerySchema = z.object({
  status: z.nativeEnum(JobStatus).optional(),
  categoryId: objectIdSchema.optional(),
  cursor: z.string().max(256).optional(),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(50)),
});

// ---------------- Job Offers Validation (Phase 5) ----------------
export const rejectOfferSchema = z.object({
  reason: z.string().max(500).optional(),
});
export type RejectOfferInputDto = z.infer<typeof rejectOfferSchema>;

export const listJobOffersQuerySchema = z.object({
  status: z.nativeEnum(JobOfferStatus).optional(),
  cursor: z.string().max(256).optional(),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(50)),
});
export type ListJobOffersQueryDto = z.infer<typeof listJobOffersQuerySchema>;

// ---------------- Realtime Socket Schemas (Phase 6) ----------------
export const workerLocationSocketSchema = z.object({
  jobId: objectIdSchema,
  coordinates: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90),
  ]),
});
export type WorkerLocationSocketDto = z.infer<typeof workerLocationSocketSchema>;

// ---------------- Authentication Schemas (Phase 2) ----------------
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
