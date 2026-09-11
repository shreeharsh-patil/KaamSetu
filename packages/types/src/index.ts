export type Environment = 'development' | 'production' | 'test';

export interface ErrorDetails {
  field?: string;
  message: string;
  [key: string]: unknown;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  requestId: string;
  details?: ErrorDetails[];
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    requestId?: string;
    [key: string]: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
  version: string;
}

export type ServiceConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'degraded';

export interface ReadyResponse {
  status: 'ready' | 'not_ready';
  timestamp: string;
  services: {
    database: ServiceConnectionStatus;
    redis: ServiceConnectionStatus;
  };
}

export enum CommonErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

// ---------------- Domain Models & Entities (Phase 1) ----------------

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  WORKER = 'WORKER',
  SUPPORT = 'SUPPORT',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  DELETED = 'DELETED',
}

export type TranslationMap = Record<string, string>;

// User Entity
export interface IUserEntity {
  id: string;
  role: UserRole;
  phoneNumber: string;
  phoneVerified: boolean;
  email?: string | null | undefined;
  emailVerified: boolean;
  preferredLanguage: string;
  status: UserStatus;
  profilePhotoUrl?: string | null | undefined;
  lastLoginAt?: Date | null | undefined;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null | undefined;
}

export interface ICreateUserInput {
  role?: UserRole | undefined;
  phoneNumber: string;
  phoneVerified?: boolean | undefined;
  email?: string | null | undefined;
  emailVerified?: boolean | undefined;
  preferredLanguage?: string | undefined;
  status?: UserStatus | undefined;
  profilePhotoUrl?: string | null | undefined;
}

export interface IUpdateUserInput {
  role?: UserRole | undefined;
  phoneNumber?: string | undefined;
  phoneVerified?: boolean | undefined;
  email?: string | null | undefined;
  emailVerified?: boolean | undefined;
  preferredLanguage?: string | undefined;
  status?: UserStatus | undefined;
  profilePhotoUrl?: string | null | undefined;
  lastLoginAt?: Date | null | undefined;
  deletedAt?: Date | null | undefined;
}

// Service Category Entity
export interface IServiceCategoryEntity {
  id: string;
  name: string;
  slug: string;
  description?: string | null | undefined;
  translations: TranslationMap;
  icon?: string | null | undefined;
  active: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null | undefined;
}

export interface ICreateServiceCategoryInput {
  name: string;
  slug: string;
  description?: string | null | undefined;
  translations?: TranslationMap | undefined;
  icon?: string | null | undefined;
  active?: boolean | undefined;
  displayOrder?: number | undefined;
}

export interface IUpdateServiceCategoryInput {
  name?: string | undefined;
  slug?: string | undefined;
  description?: string | null | undefined;
  translations?: TranslationMap | undefined;
  icon?: string | null | undefined;
  active?: boolean | undefined;
  displayOrder?: number | undefined;
  deletedAt?: Date | null | undefined;
}

// Skill Entity
export interface ISkillEntity {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  active: boolean;
  translations: TranslationMap;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null | undefined;
}

export interface ICreateSkillInput {
  name: string;
  slug: string;
  categoryId: string;
  active?: boolean | undefined;
  translations?: TranslationMap | undefined;
}

export interface IUpdateSkillInput {
  name?: string | undefined;
  slug?: string | undefined;
  categoryId?: string | undefined;
  active?: boolean | undefined;
  translations?: TranslationMap | undefined;
  deletedAt?: Date | null | undefined;
}

// ---------------- Worker Profile Enums & Interfaces (Phase 3) ----------------

export enum WorkerAvailability {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  OFFLINE = 'OFFLINE',
}

export enum WorkerVerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum SkillLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  EXPERT = 'EXPERT',
}

export interface IGeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IAggregateRating {
  average: number;
  count: number;
}

export interface IWorkerSkillItem {
  skillId: string;
  skillName?: string | undefined;
  experienceYears: number;
  level: SkillLevel;
  verified: boolean;
}

export interface IWorkerPricing {
  hourlyRate?: number | null | undefined;
  customRateDescription?: string | null | undefined;
  currency?: string | undefined;
}

export interface IWorkerPortfolioItem {
  id?: string | undefined;
  title: string;
  description?: string | null | undefined;
  imageUrl: string;
}

export interface IWorkerStats {
  completedJobs: number;
  cancelledJobs: number;
  responseTimeMinutes?: number | null | undefined;
}

// Worker Profile Entity
export interface IWorkerProfileEntity {
  id: string;
  userId: string;
  displayName: string;
  fullName?: string | undefined; // backward compat alias
  bio?: string | null | undefined;
  primaryCategoryId?: string | undefined;
  skillIds?: string[] | undefined;
  skills: IWorkerSkillItem[];
  languages: string[];
  serviceLocation: IGeoPoint;
  serviceArea?: {
    type: 'Point';
    coordinates: [number, number];
    radiusKm: number;
    address?: string | null | undefined;
    city?: string | null | undefined;
    pincode?: string | null | undefined;
  } | undefined;
  serviceRadiusKm: number;
  availabilityStatus: WorkerAvailability;
  isAvailable?: boolean | undefined;
  pricing: IWorkerPricing;
  hourlyRate?: number | null | undefined;
  portfolio: IWorkerPortfolioItem[];
  rating: IAggregateRating;
  ratingAverage?: number | undefined;
  ratingCount?: number | undefined;
  stats: IWorkerStats;
  completedJobsCount?: number | undefined;
  verificationStatus: WorkerVerificationStatus;
  kycStatus?: 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | undefined;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null | undefined;
}

export interface ICreateWorkerProfileInput {
  userId: string;
  displayName?: string | undefined;
  fullName?: string | undefined;
  bio?: string | null | undefined;
  primaryCategoryId?: string | undefined;
  skillIds?: string[] | undefined;
  skills?: IWorkerSkillItem[] | undefined;
  languages?: string[] | undefined;
  serviceLocation?: IGeoPoint | undefined;
  serviceArea?: {
    type?: 'Point' | undefined;
    coordinates: [number, number];
    radiusKm?: number | undefined;
    address?: string | null | undefined;
    city?: string | null | undefined;
    pincode?: string | null | undefined;
  } | undefined;
  serviceRadiusKm?: number | undefined;
  availabilityStatus?: WorkerAvailability | undefined;
  pricing?: IWorkerPricing | undefined;
  hourlyRate?: number | null | undefined;
  isAvailable?: boolean | undefined;
  portfolio?: IWorkerPortfolioItem[] | undefined;
}

export interface IUpdateWorkerProfileInput {
  displayName?: string | undefined;
  fullName?: string | undefined;
  bio?: string | null | undefined;
  primaryCategoryId?: string | undefined;
  skillIds?: string[] | undefined;
  skills?: IWorkerSkillItem[] | undefined;
  languages?: string[] | undefined;
  serviceLocation?: IGeoPoint | undefined;
  serviceArea?: Partial<IWorkerProfileEntity['serviceArea']> | undefined;
  serviceRadiusKm?: number | undefined;
  availabilityStatus?: WorkerAvailability | undefined;
  pricing?: IWorkerPricing | undefined;
  portfolio?: IWorkerPortfolioItem[] | undefined;
  hourlyRate?: number | null | undefined;
  isAvailable?: boolean | undefined;
  ratingAverage?: number | undefined;
  ratingCount?: number | undefined;
  completedJobsCount?: number | undefined;
  kycStatus?: 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | undefined;
  verificationStatus?: WorkerVerificationStatus | undefined;
  deletedAt?: Date | null | undefined;
}

export interface IPublicWorkerProfile {
  id: string;
  displayName: string;
  bio?: string | null | undefined;
  skills: Array<{
    skillId: string;
    skillName?: string | undefined;
    experienceYears: number;
    level: SkillLevel;
    verified: boolean;
  }>;
  languages: string[];
  serviceLocation: IGeoPoint;
  serviceRadiusKm: number;
  availabilityStatus: WorkerAvailability;
  pricing: IWorkerPricing;
  portfolio: IWorkerPortfolioItem[];
  rating: IAggregateRating;
  stats: {
    completedJobs: number;
  };
  verificationStatus: WorkerVerificationStatus;
  createdAt: Date;
}

// ---------------- Customer Profile Types (Phase 3) ----------------

export interface ICustomerAddress {
  id: string;
  label: string; // e.g. "Home", "Office"
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  coordinates?: [number, number] | undefined;
  isDefault: boolean;
}

export interface ICustomerJobStats {
  totalBookings: number;
  activeBookings: number;
  cancelledBookings: number;
}

// Customer Profile Entity
export interface ICustomerProfileEntity {
  id: string;
  userId: string;
  displayName: string;
  fullName?: string | undefined; // backward compat alias
  savedAddresses: ICustomerAddress[];
  addresses?: ICustomerAddress[] | undefined; // backward compat alias
  defaultAddress?: ICustomerAddress | null | undefined;
  rating: IAggregateRating;
  jobStats: ICustomerJobStats;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null | undefined;
}

export interface ICreateCustomerProfileInput {
  userId: string;
  displayName?: string | undefined;
  fullName?: string | undefined;
  savedAddresses?: ICustomerAddress[] | undefined;
  addresses?: ICustomerAddress[] | undefined;
}

export interface IUpdateCustomerProfileInput {
  displayName?: string | undefined;
  fullName?: string | undefined;
  savedAddresses?: ICustomerAddress[] | undefined;
  addresses?: ICustomerAddress[] | undefined;
  deletedAt?: Date | null | undefined;
}

// ---------------- Job Lifecycle (Phase 4) ----------------

export enum JobStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  MATCHING = 'MATCHING',
  OFFERED = 'OFFERED',
  ACCEPTED = 'ACCEPTED',
  EN_ROUTE = 'EN_ROUTE',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
  EXPIRED = 'EXPIRED',
}

export enum JobUrgency {
  FLEXIBLE = 'FLEXIBLE',
  TODAY = 'TODAY',
  EMERGENCY = 'EMERGENCY',
}

/** How the job was input: structured form or AI/voice assisted */
export type JobSource = 'APP' | 'VOICE' | 'SUPPORT';

export type JobEventType =
  | 'CREATED'
  | 'UPDATED'
  | 'PUBLISHED'
  | 'CANCELLED'
  | 'STATUS_CHANGED'
  | 'WORKER_ASSIGNED';

export interface JobImage {
  key: string; // storage key / object path (URL is generated at read time)
  width?: number | undefined;
  height?: number | undefined;
  mimeType?: string | undefined;
}

export interface IJobEntity {
  id: string;
  customerId: string;
  categoryId: string;
  requiredSkills: string[];
  title: string;
  description?: string | null | undefined;
  source: JobSource;
  location: { type: 'Point'; coordinates: [number, number] }; // GeoJSON [lng, lat]
  address: {
    line: string;
    city: string;
    state: string;
    pincode: string;
  };
  preferredTime: Date;
  urgency: JobUrgency;
  estimatedPrice?: number | null | undefined;
  status: JobStatus;
  assignedWorkerId?: string | null | undefined;
  images: JobImage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateJobInput {
  customerId: string;
  categoryId: string;
  requiredSkills?: string[] | undefined;
  title: string;
  description?: string | null | undefined;
  source?: JobSource | undefined;
  location: { type?: 'Point' | undefined; coordinates: [number, number] };
  address: IJobEntity['address'];
  preferredTime: Date;
  urgency: JobUrgency;
  estimatedPrice?: number | null | undefined;
  images?: JobImage[] | undefined;
  publishImmediately?: boolean | undefined;
}

export interface IUpdateJobInput {
  title?: string | undefined;
  description?: string | null | undefined;
  categoryId?: string | undefined;
  requiredSkills?: string[] | undefined;
  preferredTime?: Date | undefined;
  urgency?: JobUrgency | undefined;
  estimatedPrice?: number | null | undefined;
  location?: IJobEntity['location'] | undefined;
  address?: IJobEntity['address'] | undefined;
  images?: JobImage[] | undefined;
}

export interface IJobEventEntity {
  id: string;
  jobId: string;
  actorId: string;
  actorRole?: string | undefined;
  eventType: JobEventType;
  previousState: JobStatus | null;
  newState: JobStatus | null;
  reason?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  createdAt: Date;
}

export interface ICreateJobEventInput {
  jobId: string;
  actorId: string;
  actorRole?: string | undefined;
  eventType: JobEventType;
  previousState?: JobStatus | null | undefined;
  newState?: JobStatus | null | undefined;
  reason?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

/** Cursor-based pagination envelope (opaque base64url cursor) */
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ListJobsFilters {
  customerId?: string | undefined;
  status?: JobStatus | undefined;
  categoryId?: string | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

// ---------------- Authentication & Session Entities (Phase 2) ----------------

export interface ISessionEntity {
  id: string;
  userId: string;
  familyId: string;
  deviceName?: string | null | undefined;
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null | undefined;
  isCurrent?: boolean | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateSessionInput {
  userId: string;
  refreshTokenHash: string;
  familyId?: string | undefined;
  deviceName?: string | null | undefined;
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
  expiresAt: Date;
}

export interface IUpdateSessionInput {
  refreshTokenHash?: string | undefined;
  lastUsedAt?: Date | undefined;
  expiresAt?: Date | undefined;
  revokedAt?: Date | null | undefined;
}

export interface TokenPayload {
  userId: string;
  role: UserRole;
  sessionId: string;
  familyId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RequestOtpResponse {
  message: string;
  cooldownSeconds: number;
}

export interface VerifyOtpResponse {
  user: IUserEntity;
  accessToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}
