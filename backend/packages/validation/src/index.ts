import { z, ZodSchema } from 'zod';
import type { ErrorDetails } from '@kaamsetu/types';
import {
  UserRole,
  UserStatus,
  WorkerAvailability,
  WorkerVerificationStatus,
  SkillLevel,
  JobUrgency,
  JobStatus,
  JobOfferStatus,
  ExpenseCategory,
  TransactionType,
  VerificationType,
  VerificationRequestStatus,
  ReportTargetType,
  ReportReason,
  ReportStatus,
  DisputeReason,
  DisputeStatus,
  UploadPurpose,
} from '@kaamsetu/types';

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

/** Complete, controlled CUSTOMER -> WORKER enrollment payload. */
export const enrollWorkerSchema = z.object({
  displayName: z.string().min(2).max(100),
  primaryCategoryId: objectIdSchema,
  skills: z
    .array(
      z.object({
        skillId: objectIdSchema,
        experienceYears: z.number().min(0).max(50),
        level: z.nativeEnum(SkillLevel).default(SkillLevel.INTERMEDIATE),
      })
    )
    .min(1, 'At least one skill is required')
    .max(20),
  bio: z.string().max(1000).nullable().optional(),
  languages: z.array(z.string().min(2).max(10)).min(1).max(10),
  serviceLocation: z.object({
    type: z.literal('Point').default('Point'),
    coordinates: coordinatesSchema.refine(([lng, lat]) => !(lng === 0 && lat === 0), {
      message: 'A real service location is required',
    }),
  }),
  serviceArea: z.object({
    city: z.string().min(2).max(100),
    pincode: z.string().regex(/^\d{6}$/, 'Invalid Indian 6-digit pincode'),
  }),
  serviceRadiusKm: serviceRadiusSchema,
  pricing: workerPricingSchema.refine(
    (pricing) => pricing.hourlyRate != null || Boolean(pricing.customRateDescription),
    { message: 'An hourly rate or custom rate description is required' }
  ),
  availabilityStatus: z.nativeEnum(WorkerAvailability).default(WorkerAvailability.OFFLINE),
});
export type EnrollWorkerInputDto = z.infer<typeof enrollWorkerSchema>;

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

/**
 * Status filter accepts all persisted job statuses plus the request-level
 * sentinel 'ASSIGNED' ("jobs assigned to the requesting worker"). Services must
 * rewrite 'ASSIGNED' into an assignedWorkerId filter before querying the store.
 */
export const listJobsQuerySchema = z.object({
  status: z.union([z.nativeEnum(JobStatus), z.literal('ASSIGNED')]).optional(),
  categoryId: objectIdSchema.optional(),
  cursor: z.string().max(256).optional(),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(50)),
});

export type ListJobsQueryDto = z.infer<typeof listJobsQuerySchema>;

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

// ---------------- Messaging & Notifications Schemas (Phase 7) ----------------
export const messageAttachmentSchema = z.object({
  key: z.string().max(500).optional(),
  url: z.string().url().max(1000).optional(),
  mimeType: z.string().max(100).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  sizeBytes: z.number().int().positive().optional(),
  coordinates: z
    .tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90),
    ])
    .optional(),
  address: z.string().max(500).optional(),
});
export type MessageAttachmentDto = z.infer<typeof messageAttachmentSchema>;

export const createMessageSchema = z
  .object({
    type: z.enum(['TEXT', 'IMAGE', 'LOCATION']), // Note: SYSTEM messages are blocked from client submission
    content: z.string().max(2000).default(''),
    attachment: messageAttachmentSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'TEXT' && (!data.content || data.content.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Content is required for TEXT messages',
        path: ['content'],
      });
    }
    if (data.type === 'IMAGE' && (!data.attachment || (!data.attachment.key && !data.attachment.url))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Attachment with key or url is required for IMAGE messages',
        path: ['attachment'],
      });
    }
    if (data.type === 'LOCATION' && (!data.attachment || !data.attachment.coordinates)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Attachment with coordinates is required for LOCATION messages',
        path: ['attachment', 'coordinates'],
      });
    }
  });
export type CreateMessageInputDto = z.infer<typeof createMessageSchema>;

export const listMessagesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListMessagesQueryDto = z.infer<typeof listMessagesQuerySchema>;

export const createNotificationSchema = z.object({
  userId: objectIdSchema,
  type: z.string().min(1).max(100),
  channel: z.enum(['IN_APP', 'PUSH', 'SMS', 'EMAIL']),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  data: z.record(z.unknown()).optional(),
});
export type CreateNotificationInputDto = z.infer<typeof createNotificationSchema>;

// ---------------- Earnings, Expenses & Ledger Schemas (Phase 8) ----------------
export const expenseReceiptSchema = z.object({
  key: z.string().max(500).optional(),
  url: z.string().url().max(1000).optional(),
  mimeType: z.string().max(100).optional(),
  sizeBytes: z.number().int().positive().optional(),
});
export type ExpenseReceiptDto = z.infer<typeof expenseReceiptSchema>;

export const createExpenseSchema = z.object({
  jobId: objectIdSchema.optional(),
  category: z.nativeEnum(ExpenseCategory),
  amount: z
    .number({ required_error: 'Amount is required' })
    .int('Amount must be an integer in paise (smallest currency unit, never float)')
    .positive('Amount must be greater than 0 paise'),
  currency: z.string().default('INR'),
  note: z.string().max(500).optional(),
  receipt: expenseReceiptSchema.optional(),
});
export type CreateExpenseInputDto = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = z.object({
  jobId: objectIdSchema.optional().nullable(),
  category: z.nativeEnum(ExpenseCategory).optional(),
  amount: z
    .number()
    .int('Amount must be an integer in paise')
    .positive('Amount must be greater than 0 paise')
    .optional(),
  currency: z.string().optional(),
  note: z.string().max(500).optional().nullable(),
  receipt: expenseReceiptSchema.optional().nullable(),
});
export type UpdateExpenseInputDto = z.infer<typeof updateExpenseSchema>;

export const listExpensesQuerySchema = z.object({
  jobId: objectIdSchema.optional(),
  category: z.nativeEnum(ExpenseCategory).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListExpensesQueryDto = z.infer<typeof listExpensesQuerySchema>;

export const listTransactionsQuerySchema = z.object({
  type: z.nativeEnum(TransactionType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListTransactionsQueryDto = z.infer<typeof listTransactionsQuerySchema>;

export const earningsSummaryQuerySchema = z.object({
  timeRange: z.enum(['today', 'week', 'month', 'custom']).default('month'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
export type EarningsSummaryQueryDto = z.infer<typeof earningsSummaryQuerySchema>;

export const createAdjustmentSchema = z.object({
  workerId: objectIdSchema,
  jobId: objectIdSchema.optional(),
  amount: z
    .number({ required_error: 'Amount is required' })
    .int('Amount must be an integer in paise (positive for credit, negative for debit)'),
  reason: z.string().min(3, 'Reason must be at least 3 characters').max(500),
  referenceId: z.string().max(100).optional(),
});
export type CreateAdjustmentInputDto = z.infer<typeof createAdjustmentSchema>;

// ---------------- Reviews, Verification, Reports & Disputes (Phase 9) ----------------

// Reviews
export const createReviewSchema = z.object({
  jobId: objectIdSchema,
  rating: z.coerce.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  quality: z.coerce.number().int().min(1).max(5).optional(),
  punctuality: z.coerce.number().int().min(1).max(5).optional(),
  communication: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
});
export type CreateReviewInputDto = z.infer<typeof createReviewSchema>;

export const listReviewsQuerySchema = z.object({
  revieweeId: objectIdSchema.optional(),
  reviewerId: objectIdSchema.optional(),
  jobId: objectIdSchema.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListReviewsQueryDto = z.infer<typeof listReviewsQuerySchema>;

// Verification Requests
export const verificationDocumentSchema = z.object({
  key: z.string().max(500).optional(),
  url: z.string().url().max(1000),
  mimeType: z.string().max(100).optional(),
  documentType: z.string().max(100).optional(),
});
export type VerificationDocumentDto = z.infer<typeof verificationDocumentSchema>;

export const createVerificationRequestSchema = z.object({
  type: z.nativeEnum(VerificationType),
  documents: z.array(verificationDocumentSchema).min(1, 'At least one document is required'),
});
export type CreateVerificationRequestInputDto = z.infer<typeof createVerificationRequestSchema>;

export const reviewVerificationRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'REQUIRES_MORE_INFO']),
  reason: z.string().max(500).optional(),
});
export type ReviewVerificationRequestInputDto = z.infer<typeof reviewVerificationRequestSchema>;

export const listVerificationRequestsQuerySchema = z.object({
  workerId: objectIdSchema.optional(),
  status: z.nativeEnum(VerificationRequestStatus).optional(),
  type: z.nativeEnum(VerificationType).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListVerificationRequestsQueryDto = z.infer<typeof listVerificationRequestsQuerySchema>;

// Reports
export const createReportSchema = z.object({
  targetType: z.nativeEnum(ReportTargetType),
  targetId: objectIdSchema,
  reason: z.nativeEnum(ReportReason),
  description: z.string().min(5, 'Description must be at least 5 characters').max(2000),
  evidence: z.array(z.string().url().max(1000)).optional(),
});
export type CreateReportInputDto = z.infer<typeof createReportSchema>;

export const updateReportSchema = z.object({
  status: z.enum(['INVESTIGATING', 'RESOLVED', 'DISMISSED']),
  resolutionNotes: z.string().max(1000).optional(),
});
export type UpdateReportInputDto = z.infer<typeof updateReportSchema>;

export const listReportsQuerySchema = z.object({
  targetType: z.nativeEnum(ReportTargetType).optional(),
  status: z.nativeEnum(ReportStatus).optional(),
  reporterId: objectIdSchema.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListReportsQueryDto = z.infer<typeof listReportsQuerySchema>;

// Disputes
export const createDisputeSchema = z.object({
  jobId: objectIdSchema,
  reason: z.nativeEnum(DisputeReason),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  evidence: z.array(z.string().url().max(1000)).optional(),
});
export type CreateDisputeInputDto = z.infer<typeof createDisputeSchema>;

export const resolveDisputeSchema = z.object({
  status: z.enum(['RESOLVED', 'REJECTED']),
  summary: z.string().min(5, 'Resolution summary must be at least 5 characters').max(1000),
  refundPaise: z.number().int().min(0).optional(),
  actionTaken: z.string().max(500).optional(),
});
export type ResolveDisputeInputDto = z.infer<typeof resolveDisputeSchema>;

export const listDisputesQuerySchema = z.object({
  jobId: objectIdSchema.optional(),
  status: z.nativeEnum(DisputeStatus).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListDisputesQueryDto = z.infer<typeof listDisputesQuerySchema>;

// ---------------- AI & Speech Provider Validation (Phase 11) ----------------

// AI Structured Output Validation Schemas
export const jobClassificationOutputSchema = z.object({
  categorySlug: z.string().optional(),
  suggestedCategoryName: z.string().optional(),
  suggestedSkills: z.array(z.string()).default([]),
  urgency: z.nativeEnum(JobUrgency).optional(),
  estimatedPrice: z.number().positive().optional(),
  confidence: z.number().min(0).max(1).default(0.8),
});
export type JobClassificationOutputDto = z.infer<typeof jobClassificationOutputSchema>;

export const extractedProfileOutputSchema = z.object({
  suggestedSkills: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  bio: z.string().optional(),
  experienceYears: z.number().min(0).max(60).optional(),
  confidence: z.number().min(0).max(1).default(0.8),
});
export type ExtractedProfileOutputDto = z.infer<typeof extractedProfileOutputSchema>;

export const simplifiedJobDescriptionOutputSchema = z.object({
  simplifiedText: z.string().min(1),
  keyTasks: z.array(z.string()).default([]),
  language: z.string().default('en'),
});
export type SimplifiedJobDescriptionOutputDto = z.infer<typeof simplifiedJobDescriptionOutputSchema>;

export const translationOutputSchema = z.object({
  translatedText: z.string(),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  isFallback: z.boolean().default(false),
});
export type TranslationOutputDto = z.infer<typeof translationOutputSchema>;

// Speech Structured Output Validation Schemas
export const speechToTextOutputSchema = z.object({
  transcript: z.string(),
  detectedLanguage: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0.9),
});
export type SpeechToTextOutputDto = z.infer<typeof speechToTextOutputSchema>;

export const textToSpeechOutputSchema = z.object({
  audioBase64: z.string(),
  mimeType: z.string().default('audio/mp3'),
  durationMs: z.number().positive().optional(),
});
export type TextToSpeechOutputDto = z.infer<typeof textToSpeechOutputSchema>;

export const languageDetectionOutputSchema = z.object({
  languageCode: z.string(),
  confidence: z.number().min(0).max(1).default(0.9),
});
export type LanguageDetectionOutputDto = z.infer<typeof languageDetectionOutputSchema>;

// API Request Input Schemas
export const classifyJobInputSchema = z.object({
  text: z.string().min(3, 'Job text must be at least 3 characters').max(2000),
});
export type ClassifyJobInputDto = z.infer<typeof classifyJobInputSchema>;

export const simplifyDescriptionInputSchema = z.object({
  description: z.string().min(5, 'Description must be at least 5 characters').max(3000),
  targetLanguage: z.string().max(10).optional().default('en'),
});
export type SimplifyDescriptionInputDto = z.infer<typeof simplifyDescriptionInputSchema>;

export const translateTextInputSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').max(5000),
  targetLanguage: z.string().min(2).max(10),
  sourceLanguage: z.string().min(2).max(10).optional(),
});
export type TranslateTextInputDto = z.infer<typeof translateTextInputSchema>;

export const extractProfileInputSchema = z.object({
  text: z.string().min(5, 'Profile text must be at least 5 characters').max(3000),
});
export type ExtractProfileInputDto = z.infer<typeof extractProfileInputSchema>;

export const transcribeAudioInputSchema = z.object({
  audio: z.string().min(10, 'Audio base64 string is required'),
  mimeType: z.string().max(100).optional().default('audio/wav'),
  language: z.string().max(10).optional(),
  hintText: z.string().optional(),
});
export type TranscribeAudioInputDto = z.infer<typeof transcribeAudioInputSchema>;

export const synthesizeSpeechInputSchema = z.object({
  text: z.string().min(1, 'Text is required').max(2000),
  language: z.string().max(10).optional().default('en'),
});
export type SynthesizeSpeechInputDto = z.infer<typeof synthesizeSpeechInputSchema>;

// ---------------- Authentication Schemas (Phase 2) ----------------
export const requestOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit numeric code'),
  // Device metadata is non-essential; normalize browser-provided values so
  // long User-Agent strings cannot block OTP verification.
  deviceName: z.string().transform((value) => value.trim().slice(0, 100)).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token is required').optional(),
});

// ---------------- Admin & Immutable Audit Schemas (Phase 12) ----------------

export const suspendUserSchema = z.object({
  reason: z.string().min(3, 'Reason must be at least 3 characters').max(500),
});
export type SuspendUserInputDto = z.infer<typeof suspendUserSchema>;

export const restoreUserSchema = z.object({
  reason: z.string().max(500).optional(),
});
export type RestoreUserInputDto = z.infer<typeof restoreUserSchema>;

export const changeUserRoleSchema = z.object({
  newRole: z.enum(['CUSTOMER', 'WORKER', 'SUPPORT', 'ADMIN']),
});
export type ChangeUserRoleInputDto = z.infer<typeof changeUserRoleSchema>;

export const rejectVerificationAdminSchema = z.object({
  rejectionReason: z.string().min(3, 'Rejection reason must be at least 3 characters').max(500),
});
export type RejectVerificationAdminInputDto = z.infer<typeof rejectVerificationAdminSchema>;

export const financialAdjustmentSchema = z.object({
  workerId: objectIdSchema,
  amountPaise: z.number().int().min(1, 'Amount must be positive integer in paise'),
  reason: z.string().min(3, 'Reason must be at least 3 characters').max(500),
  referenceId: z.string().max(100).optional(),
  jobId: objectIdSchema.optional(),
  type: z.enum(['CREDIT', 'DEBIT']).optional().default('CREDIT'),
});
export type FinancialAdjustmentInputDto = z.infer<typeof financialAdjustmentSchema>;

export const createCategoryAdminSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(1000).optional(),
  icon: z.string().max(200).optional(),
  basePricePaise: z.number().int().min(0).optional(),
});
export type CreateCategoryAdminInputDto = z.infer<typeof createCategoryAdminSchema>;

export const updateCategoryAdminSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  icon: z.string().max(200).optional(),
  basePricePaise: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});
export type UpdateCategoryAdminInputDto = z.infer<typeof updateCategoryAdminSchema>;

export const createSkillAdminSchema = z.object({
  categoryId: objectIdSchema,
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  aliases: z.array(z.string().max(100)).optional(),
});
export type CreateSkillAdminInputDto = z.infer<typeof createSkillAdminSchema>;

export const updateSkillAdminSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  aliases: z.array(z.string().max(100)).optional(),
  active: z.boolean().optional(),
});
export type UpdateSkillAdminInputDto = z.infer<typeof updateSkillAdminSchema>;

export const adminUserListQuerySchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  search: z.string().max(100).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type AdminUserListQueryDto = z.infer<typeof adminUserListQuerySchema>;

export const adminWorkerListQuerySchema = z.object({
  verificationStatus: z.nativeEnum(WorkerVerificationStatus).optional(),
  availabilityStatus: z.nativeEnum(WorkerAvailability).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type AdminWorkerListQueryDto = z.infer<typeof adminWorkerListQuerySchema>;

export const adminJobListQuerySchema = z.object({
  status: z.nativeEnum(JobStatus).optional(),
  customerId: objectIdSchema.optional(),
  workerId: objectIdSchema.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type AdminJobListQueryDto = z.infer<typeof adminJobListQuerySchema>;

export const adminReportListQuerySchema = z.object({
  status: z.nativeEnum(ReportStatus).optional(),
  targetType: z.nativeEnum(ReportTargetType).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type AdminReportListQueryDto = z.infer<typeof adminReportListQuerySchema>;

export const adminDisputeListQuerySchema = z.object({
  status: z.nativeEnum(DisputeStatus).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type AdminDisputeListQueryDto = z.infer<typeof adminDisputeListQuerySchema>;

export const adminAuditLogListQuerySchema = z.object({
  actorId: objectIdSchema.optional(),
  action: z.string().max(100).optional(),
  resourceType: z.string().max(100).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type AdminAuditLogListQueryDto = z.infer<typeof adminAuditLogListQuerySchema>;

// ---------------- File Upload & Storage Schemas (Phase 10) ----------------

export const presignUploadSchema = z.object({
  purpose: z.nativeEnum(UploadPurpose),
  filename: z.string().min(1, 'Filename is required').max(255),
  mimeType: z.string().min(3, 'MIME type is required').max(100),
  sizeBytes: z
    .number()
    .int()
    .positive('Size must be positive')
    .max(50 * 1024 * 1024, 'File exceeds maximum upload size limit (50MB)'),
});
export type PresignUploadInputDto = z.infer<typeof presignUploadSchema>;

export const completeUploadSchema = z.object({
  uploadId: objectIdSchema,
});
export type CompleteUploadInputDto = z.infer<typeof completeUploadSchema>;

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
