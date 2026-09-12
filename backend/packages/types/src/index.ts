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
  serviceLocation?: IGeoPoint | undefined;
  serviceArea?: {
    type: 'Point';
    coordinates: [number, number];
    radiusKm: number;
    address?: string | null | undefined;
    city?: string | null | undefined;
    pincode?: string | null | undefined;
  } | undefined;
  serviceRadiusKm: number;
  onboardingComplete: boolean;
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
  onboardingComplete?: boolean | undefined;
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
  onboardingComplete?: boolean | undefined;
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
  serviceArea: {
    city?: string | null | undefined;
    pincode?: string | null | undefined;
    radiusKm: number;
  };
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

export interface IWorkerEnrollmentInput {
  displayName: string;
  primaryCategoryId: string;
  skills: Array<{
    skillId: string;
    experienceYears: number;
    level: SkillLevel;
  }>;
  bio?: string | null | undefined;
  languages: string[];
  serviceLocation: IGeoPoint;
  serviceArea: {
    city: string;
    pincode: string;
  };
  serviceRadiusKm: number;
  pricing: IWorkerPricing;
  availabilityStatus: WorkerAvailability;
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
  | 'WORKER_ASSIGNED'
  | 'OFFER_CREATED'
  | 'OFFER_ACCEPTED'
  | 'OFFER_REJECTED'
  | 'OFFER_WITHDRAWN'
  | 'MATCHING_STARTED'
  | 'TRAVEL_STARTED'
  | 'WORKER_ARRIVED'
  | 'JOB_STARTED'
  | 'JOB_COMPLETED'
  | 'DISPUTE_RAISED'
  | 'DISPUTE_RESOLVED';

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

/** Explicit API read model; components do not depend on Mongoose documents. */
export interface IJobView extends IJobEntity {
  category: {
    id: string;
    name: string;
    slug: string;
  };
  customer: {
    id: string;
    displayName: string;
    phoneNumber?: string | undefined;
  };
  assignedWorker?: {
    id: string;
    displayName: string;
    phoneNumber?: string | undefined;
    profilePhotoUrl?: string | null | undefined;
    rating: IAggregateRating;
    skills: string[];
    verificationStatus: WorkerVerificationStatus;
  } | null | undefined;
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

/**
 * Status filter for job listings. The pseudo-value 'ASSIGNED' is a request-level
 * sentinel (never persisted) meaning "jobs assigned to the requesting worker";
 * services must rewrite it into an assignedWorkerId filter before querying.
 */
export type JobsListStatusFilter = JobStatus | 'ASSIGNED';

export interface ListJobsFilters {
  customerId?: string | undefined;
  status?: JobsListStatusFilter | undefined;
  categoryId?: string | undefined;
  assignedWorkerId?: string | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

// ---------------- Geospatial Matching & Job Offers (Phase 5) ----------------

export enum JobOfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  WITHDRAWN = 'WITHDRAWN',
}

export interface ScoreBreakdown {
  skillScore: number;          // 0 - 100
  distanceScore: number;       // 0 - 100
  availabilityScore: number;   // 0 - 100
  ratingScore: number;         // 0 - 100
  completionRateScore: number; // 0 - 100
  acceptanceRateScore: number; // 0 - 100
  priceScore: number;          // 0 - 100
}

export interface IJobOfferEntity {
  id: string;
  jobId: string;
  workerId: string;
  distanceKm: number;
  matchScore: number;          // 0 - 100
  scoreBreakdown: ScoreBreakdown;
  status: JobOfferStatus;
  expiresAt: Date;
  respondedAt?: Date | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

/** Worker-facing offer DTO. Exact job coordinates, street address, and customer data are omitted. */
export interface IJobOfferView {
  id: string;
  jobId: string;
  distanceKm: number;
  matchScore: number;
  scoreBreakdown: ScoreBreakdown;
  status: JobOfferStatus;
  expiresAt: Date;
  createdAt: Date;
  job: {
    category: { id: string; name: string; slug: string };
    title: string;
    description?: string | null | undefined;
    urgency: JobUrgency;
    approximateLocality: string;
    preferredTime: Date;
    estimatedAmount?: number | null | undefined;
  };
}

export interface ICreateJobOfferInput {
  jobId: string;
  workerId: string;
  distanceKm: number;
  matchScore: number;
  scoreBreakdown: ScoreBreakdown;
  expiresAt: Date;
  status?: JobOfferStatus | undefined;
}

export interface MatchingWeights {
  skill: number;              // default 0.30 (30%)
  distance: number;           // default 0.25 (25%)
  availability: number;       // default 0.15 (15%)
  rating: number;             // default 0.10 (10%)
  completionRate: number;     // default 0.10 (10%)
  acceptanceRate: number;     // default 0.05 (5%)
  priceCompatibility: number; // default 0.05 (5%)
}

export interface MatchingConfig {
  weights: MatchingWeights;
  waveSize: number;             // default 3
  offerExpiryMinutes: number;   // default 5
  maxSearchRadiusKm: number;    // default 30
}

export interface ListJobOffersFilters {
  workerId?: string | undefined;
  jobId?: string | undefined;
  status?: JobOfferStatus | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

// ---------------- Realtime Socket Events (Phase 6) ----------------

export interface SocketUserPayload {
  userId: string;
  role: UserRole;
  sessionId: string;
}

export interface WorkerLocationUpdatePayload {
  jobId: string;
  coordinates: [number, number]; // [lng, lat]
}

export interface WorkerLocationUpdatedPayload {
  jobId: string;
  workerId: string;
  coordinates: [number, number]; // [lng, lat]
  updatedAt: string;
}

export interface JobStatusChangedPayload {
  jobId: string;
  previousStatus: JobStatus;
  newStatus: JobStatus;
  updatedAt: string;
}

export interface JobOfferCreatedPayload {
  offerId: string;
  jobId: string;
  workerId: string;
  matchScore: number;
  expiresAt: string;
}

export interface JobAcceptedPayload {
  jobId: string;
  workerId: string;
  acceptedAt: string;
}

export interface JobCompletedPayload {
  jobId: string;
  workerId: string;
  customerId: string;
  completedAt: string;
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

// ---------------- Messaging & Conversations (Phase 7) ----------------

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  SYSTEM = 'SYSTEM',
  LOCATION = 'LOCATION',
}

export interface IMessageAttachment {
  key?: string | undefined;
  url?: string | undefined;
  mimeType?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  sizeBytes?: number | undefined;
  coordinates?: [number, number] | undefined; // [lng, lat]
  address?: string | undefined;
}

export interface IConversationEntity {
  id: string;
  jobId: string;
  participants: string[];
  lastMessageAt?: Date | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateConversationInput {
  jobId: string;
  participants: string[];
}

export interface IMessageEntity {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  attachment?: IMessageAttachment | null | undefined;
  readAt?: Date | null | undefined;
  createdAt: Date;
}

export interface ICreateMessageInput {
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  attachment?: IMessageAttachment | null | undefined;
}

export interface ListMessagesFilters {
  conversationId: string;
  cursor?: string | undefined;
  limit?: number | undefined;
}

// ---------------- Notifications (Phase 7) ----------------

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  PUSH = 'PUSH',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
}

export enum NotificationType {
  JOB_OFFER = 'JOB_OFFER',
  JOB_STATUS = 'JOB_STATUS',
  JOB_ACCEPTED = 'JOB_ACCEPTED',
  JOB_COMPLETED = 'JOB_COMPLETED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  SYSTEM = 'SYSTEM',
}

export interface INotificationEntity {
  id: string;
  userId: string;
  type: NotificationType | string;
  channel: NotificationChannel;
  title: string;
  body: string;
  data?: Record<string, unknown> | undefined;
  readAt?: Date | null | undefined;
  deliveredAt?: Date | null | undefined;
  failedAt?: Date | null | undefined;
  failureReason?: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateNotificationInput {
  userId: string;
  type: NotificationType | string;
  channel: NotificationChannel;
  title: string;
  body: string;
  data?: Record<string, unknown> | undefined;
}

export interface NotificationJobData {
  notificationId: string;
  userId: string;
  channel: NotificationChannel;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | undefined;
  requestId?: string | undefined;
}

export interface NewMessageSocketPayload {
  conversationId: string;
  jobId: string;
  message: IMessageEntity;
}

export interface MessageReadSocketPayload {
  conversationId: string;
  readerId: string;
  readAt: string;
}

// ---------------- Earnings, Expenses & Financial Ledger (Phase 8) ----------------

export enum ExpenseCategory {
  FUEL = 'FUEL',
  MATERIAL = 'MATERIAL',
  PARKING = 'PARKING',
  TOOL = 'TOOL',
  PLATFORM_FEE = 'PLATFORM_FEE',
  OTHER = 'OTHER',
}

export enum TransactionType {
  JOB_REVENUE = 'JOB_REVENUE',
  EXPENSE = 'EXPENSE',
  PLATFORM_FEE = 'PLATFORM_FEE',
  REFUND = 'REFUND',
  ADJUSTMENT = 'ADJUSTMENT',
}

export interface IExpenseReceipt {
  key?: string | undefined;
  url?: string | undefined;
  mimeType?: string | undefined;
  sizeBytes?: number | undefined;
}

export interface IExpenseEntity {
  id: string;
  workerId: string;
  jobId?: string | null | undefined;
  category: ExpenseCategory;
  amount: number; // Integer paise (₹1 = 100 paise)
  currency: string; // Default 'INR'
  note?: string | null | undefined;
  receipt?: IExpenseReceipt | null | undefined;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null | undefined;
}

export interface ICreateExpenseInput {
  workerId: string;
  jobId?: string | null | undefined;
  category: ExpenseCategory;
  amount: number; // Integer paise > 0
  currency?: string | undefined;
  note?: string | null | undefined;
  receipt?: IExpenseReceipt | null | undefined;
}

export interface IUpdateExpenseInput {
  jobId?: string | null | undefined;
  category?: ExpenseCategory | undefined;
  amount?: number | undefined; // Integer paise > 0
  currency?: string | undefined;
  note?: string | null | undefined;
  receipt?: IExpenseReceipt | null | undefined;
}

export interface ListExpensesFilters {
  workerId: string;
  jobId?: string | undefined;
  category?: ExpenseCategory | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface ITransactionEntity {
  id: string;
  workerId: string;
  jobId?: string | null | undefined;
  type: TransactionType;
  amount: number; // Integer paise
  currency: string; // Default 'INR'
  referenceId: string; // Idempotency reference or entity link
  metadata?: Record<string, unknown> | undefined;
  createdAt: Date;
}

export interface ICreateTransactionInput {
  workerId: string;
  jobId?: string | null | undefined;
  type: TransactionType;
  amount: number; // Integer paise
  currency?: string | undefined;
  referenceId: string;
  metadata?: Record<string, unknown> | undefined;
}

export interface ListTransactionsFilters {
  workerId?: string | undefined;
  type?: TransactionType | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface IEarningsSummary {
  timeRange: 'today' | 'week' | 'month' | 'custom';
  startDate: string;
  endDate: string;
  grossRevenue: number; // Integer paise
  totalExpenses: number; // Integer paise
  netEarnings: number; // Integer paise
  totalJobs: number;
  hoursWorked: number; // Float rounded to 2 decimal places
  earningsPerHour: number; // Integer paise per hour
  currency: string;
}

export interface IEarningsJobItem {
  jobId: string;
  title: string;
  completedAt: Date;
  revenue: number; // Integer paise
  expenses: number; // Integer paise
  netEarnings: number; // Integer paise
  durationHours: number;
}

// ---------------- Phase 9: Reviews, Verification, Reports & Disputes ----------------

// Reviews
export interface IReviewEntity {
  id: string;
  jobId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number; // 1 to 5
  quality?: number | undefined; // 1 to 5
  punctuality?: number | undefined; // 1 to 5
  communication?: number | undefined; // 1 to 5
  comment?: string | null | undefined;
  createdAt: Date;
}

export interface ICreateReviewInput {
  jobId: string;
  reviewerId: string;
  rating: number;
  quality?: number | undefined;
  punctuality?: number | undefined;
  communication?: number | undefined;
  comment?: string | undefined;
}

export interface ListReviewsFilters {
  revieweeId?: string | undefined;
  reviewerId?: string | undefined;
  jobId?: string | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

// Verification Requests
export enum VerificationType {
  GOVERNMENT_ID = 'GOVERNMENT_ID',
  POLICE_CLEARANCE = 'POLICE_CLEARANCE',
  TRADE_CERTIFICATE = 'TRADE_CERTIFICATE',
  ADDRESS_PROOF = 'ADDRESS_PROOF',
  OTHER = 'OTHER',
}

export enum VerificationRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REQUIRES_MORE_INFO = 'REQUIRES_MORE_INFO',
}

export interface IVerificationDocument {
  key?: string | undefined;
  url: string;
  mimeType?: string | undefined;
  documentType?: string | undefined;
  uploadedAt?: Date | undefined;
}

export interface IVerificationRequestEntity {
  id: string;
  workerId: string;
  type: VerificationType;
  documents: IVerificationDocument[];
  status: VerificationRequestStatus;
  reviewerId?: string | null | undefined;
  reason?: string | null | undefined;
  reviewedAt?: Date | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateVerificationRequestInput {
  workerId: string;
  type: VerificationType;
  documents: IVerificationDocument[];
}

export interface IReviewVerificationRequestInput {
  reviewerId: string;
  status: VerificationRequestStatus;
  reason?: string | undefined;
}

export interface ListVerificationRequestsFilters {
  workerId?: string | undefined;
  status?: VerificationRequestStatus | undefined;
  type?: VerificationType | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

// Reports
export enum ReportTargetType {
  USER = 'USER',
  JOB = 'JOB',
  MESSAGE = 'MESSAGE',
  REVIEW = 'REVIEW',
}

export enum ReportReason {
  INAPPROPRIATE_BEHAVIOR = 'INAPPROPRIATE_BEHAVIOR',
  FRAUD = 'FRAUD',
  SPAM = 'SPAM',
  HARASSMENT = 'HARASSMENT',
  SAFETY_CONCERN = 'SAFETY_CONCERN',
  POOR_SERVICE = 'POOR_SERVICE',
  OTHER = 'OTHER',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export interface IReportEntity {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description: string;
  evidence?: string[] | undefined;
  status: ReportStatus;
  resolutionNotes?: string | null | undefined;
  resolvedBy?: string | null | undefined;
  resolvedAt?: Date | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateReportInput {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description: string;
  evidence?: string[] | undefined;
}

export interface IUpdateReportInput {
  status: ReportStatus;
  resolutionNotes?: string | undefined;
  resolvedBy: string;
}

export interface ListReportsFilters {
  reporterId?: string | undefined;
  targetType?: ReportTargetType | undefined;
  status?: ReportStatus | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

// Disputes
export enum DisputeReason {
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  POOR_QUALITY = 'POOR_QUALITY',
  NO_SHOW = 'NO_SHOW',
  PROPERTY_DAMAGE = 'PROPERTY_DAMAGE',
  UNPROFESSIONAL_BEHAVIOUR = 'UNPROFESSIONAL_BEHAVIOUR',
  OTHER = 'OTHER',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export interface IDisputeResolution {
  summary: string;
  refundPaise?: number | undefined;
  actionTaken?: string | undefined;
}

export interface IDisputeEntity {
  id: string;
  jobId: string;
  initiatorId: string;
  respondentId: string;
  reason: DisputeReason;
  description: string;
  evidence?: string[] | undefined;
  status: DisputeStatus;
  resolution?: IDisputeResolution | null | undefined;
  resolvedBy?: string | null | undefined;
  resolvedAt?: Date | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateDisputeInput {
  jobId: string;
  initiatorId: string;
  reason: DisputeReason;
  description: string;
  evidence?: string[] | undefined;
}

export interface IResolveDisputeInput {
  resolvedBy: string;
  status: DisputeStatus.RESOLVED | DisputeStatus.REJECTED;
  resolution: IDisputeResolution;
}

export interface ListDisputesFilters {
  jobId?: string | undefined;
  userId?: string | undefined;
  status?: DisputeStatus | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

// Audit Logs (Phase 9 & Phase 12)
export interface IAuditLogEntity {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  resourceType: string;
  resourceId: string;
  targetType?: string | undefined; // backward compatibility
  targetId?: string | undefined;   // backward compatibility
  before?: Record<string, unknown> | null | undefined;
  after?: Record<string, unknown> | null | undefined;
  ipAddress?: string | null | undefined;
  requestId?: string | null | undefined;
  details?: Record<string, unknown> | undefined;
  createdAt: Date;
}

export interface ICreateAuditLogInput {
  actorId: string;
  actorRole: UserRole;
  action: string;
  resourceType?: string | undefined;
  resourceId?: string | undefined;
  targetType?: string | undefined; // backward compatibility
  targetId?: string | undefined;   // backward compatibility
  before?: Record<string, unknown> | null | undefined;
  after?: Record<string, unknown> | null | undefined;
  ipAddress?: string | null | undefined;
  requestId?: string | null | undefined;
  details?: Record<string, unknown> | undefined;
}

// ---------------- Phase 12: Admin Backend & Audit System ----------------

export interface IAdminActionContext {
  actorId: string;
  actorRole: UserRole;
  ipAddress?: string | null | undefined;
  requestId?: string | null | undefined;
}

export interface IAdminUserListQuery {
  role?: UserRole | undefined;
  status?: UserStatus | undefined;
  search?: string | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface IAdminWorkerListQuery {
  verificationStatus?: WorkerVerificationStatus | undefined;
  availabilityStatus?: WorkerAvailability | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface IAdminJobListQuery {
  status?: JobStatus | undefined;
  customerId?: string | undefined;
  workerId?: string | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface IAdminReportListQuery {
  status?: ReportStatus | undefined;
  targetType?: ReportTargetType | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface IAdminDisputeListQuery {
  status?: DisputeStatus | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface IAdminAuditLogListQuery {
  actorId?: string | undefined;
  action?: string | undefined;
  resourceType?: string | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface ISuspendUserInput {
  reason: string;
}

export interface IRestoreUserInput {
  reason?: string | undefined;
}

export interface IRoleChangeInput {
  newRole: UserRole;
}

export interface IFinancialAdjustmentInput {
  workerId: string;
  amountPaise: number;
  reason: string;
  referenceId?: string | undefined;
  jobId?: string | undefined;
  type?: 'CREDIT' | 'DEBIT' | undefined;
}

export interface ICreateCategoryAdminInput {
  name: string;
  description?: string | undefined;
  icon?: string | undefined;
  basePricePaise?: number | undefined;
}

export interface IUpdateCategoryAdminInput {
  name?: string | undefined;
  description?: string | undefined;
  icon?: string | undefined;
  basePricePaise?: number | undefined;
  active?: boolean | undefined;
}

export interface ICreateSkillAdminInput {
  categoryId: string;
  name: string;
  description?: string | undefined;
  aliases?: string[] | undefined;
}

export interface IUpdateSkillAdminInput {
  name?: string | undefined;
  description?: string | undefined;
  aliases?: string[] | undefined;
  active?: boolean | undefined;
}

export interface IPaginatedResult<T> {
  items: T[];
  nextCursor?: string | null | undefined;
  hasMore: boolean;
  total?: number | undefined;
}

// ---------------- Phase 11: AI & Speech Provider Layer ----------------

export interface AIRequestOptions {
  timeoutMs?: number | undefined;
  temperature?: number | undefined;
  maxTokens?: number | undefined;
}

export interface JobClassificationResult {
  categorySlug?: string | undefined;
  suggestedCategoryName?: string | undefined;
  suggestedSkills: string[];
  urgency?: JobUrgency | undefined;
  estimatedPrice?: number | undefined;
  confidence: number; // 0 to 1
}

export interface ExtractedProfileResult {
  suggestedSkills: string[];
  languages: string[];
  bio?: string | undefined;
  experienceYears?: number | undefined;
  confidence: number; // 0 to 1
}

export interface SimplifiedJobDescriptionResult {
  simplifiedText: string;
  keyTasks: string[];
  language: string;
}

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  isFallback: boolean;
}

export interface IAIProvider {
  readonly name: string;
  classifyJob(text: string, options?: AIRequestOptions): Promise<JobClassificationResult>;
  extractWorkerProfile(textOrTranscript: string, options?: AIRequestOptions): Promise<ExtractedProfileResult>;
  simplifyJobDescription(rawText: string, options?: AIRequestOptions): Promise<SimplifiedJobDescriptionResult>;
  translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string,
    options?: AIRequestOptions
  ): Promise<TranslationResult>;
}

export interface SpeechRequestOptions {
  timeoutMs?: number | undefined;
  audioFormat?: string | undefined;
}

export interface SpeechToTextResult {
  transcript: string;
  detectedLanguage?: string | undefined;
  confidence: number;
}

export interface TextToSpeechResult {
  audioBase64: string;
  mimeType: string;
  durationMs?: number | undefined;
}

export interface LanguageDetectionResult {
  languageCode: string;
  confidence: number;
}

export interface ISpeechProvider {
  readonly name: string;
  speechToText(
    audioData: Uint8Array | string,
    mimeType?: string,
    options?: SpeechRequestOptions
  ): Promise<SpeechToTextResult>;
  textToSpeech(
    text: string,
    language: string,
    options?: SpeechRequestOptions
  ): Promise<TextToSpeechResult>;
  detectLanguage(
    input: string | Uint8Array,
    options?: SpeechRequestOptions
  ): Promise<LanguageDetectionResult>;
}

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerStatus {
  state: CircuitBreakerState;
  failureCount: number;
  consecutiveSuccesses: number;
  lastFailureTime: Date | null;
  lastStateChange: Date;
}

export interface AIProviderStatus {
  providerName: string;
  available: boolean;
  circuitBreaker: CircuitBreakerStatus;
}

// ---------------- Phase 10: File Upload & Storage Layer ----------------

export enum UploadPurpose {
  PROFILE_PHOTO = 'PROFILE_PHOTO',
  WORKER_PORTFOLIO = 'WORKER_PORTFOLIO',
  JOB_IMAGE = 'JOB_IMAGE',
  EXPENSE_RECEIPT = 'EXPENSE_RECEIPT',
  VERIFICATION_DOCUMENT = 'VERIFICATION_DOCUMENT',
}

export enum UploadStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface IUploadEntity {
  id: string;
  userId: string;
  purpose: UploadPurpose;
  key: string;
  originalFilename?: string | null | undefined;
  mimeType: string;
  sizeBytes: number;
  status: UploadStatus;
  isPublic: boolean;
  publicUrl?: string | null | undefined;
  expiresAt?: Date | null | undefined;
  metadata?: Record<string, unknown> | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPresignedUploadResult {
  uploadId: string;
  uploadUrl: string;
  key: string;
  expiresInSeconds: number;
  requiredHeaders?: Record<string, string> | undefined;
}

export interface IPresignedDownloadResult {
  downloadUrl: string;
  expiresInSeconds: number;
}

export interface IStorageProvider {
  readonly name: string;
  createPresignedUploadUrl(
    key: string,
    mimeType: string,
    maxSizeBytes: number,
    expiresInSeconds?: number
  ): Promise<{
    uploadUrl: string;
    expiresInSeconds: number;
    requiredHeaders?: Record<string, string> | undefined;
  }>;

  createPresignedDownloadUrl(
    key: string,
    expiresInSeconds?: number
  ): Promise<{
    downloadUrl: string;
    expiresInSeconds: number;
  }>;

  verifyObjectMetadata(
    key: string
  ): Promise<{
    exists: boolean;
    sizeBytes?: number | undefined;
    mimeType?: string | undefined;
  }>;

  deleteObject(key: string): Promise<void>;

  getPublicUrl(key: string): string;
}


