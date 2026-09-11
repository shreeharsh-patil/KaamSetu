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

// Worker Profile Entity
export interface IWorkerProfileEntity {
  id: string;
  userId: string;
  fullName: string;
  bio?: string | null | undefined;
  primaryCategoryId: string;
  skillIds: string[];
  serviceArea: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    radiusKm: number;
    address?: string | null | undefined;
    city?: string | null | undefined;
    pincode?: string | null | undefined;
  };
  hourlyRate?: number | null | undefined;
  isAvailable: boolean;
  ratingAverage: number;
  ratingCount: number;
  completedJobsCount: number;
  kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null | undefined;
}

export interface ICreateWorkerProfileInput {
  userId: string;
  fullName: string;
  bio?: string | null | undefined;
  primaryCategoryId: string;
  skillIds?: string[] | undefined;
  serviceArea: {
    type?: 'Point' | undefined;
    coordinates: [number, number];
    radiusKm?: number | undefined;
    address?: string | null | undefined;
    city?: string | null | undefined;
    pincode?: string | null | undefined;
  };
  hourlyRate?: number | null | undefined;
  isAvailable?: boolean | undefined;
}

export interface IUpdateWorkerProfileInput {
  fullName?: string | undefined;
  bio?: string | null | undefined;
  primaryCategoryId?: string | undefined;
  skillIds?: string[] | undefined;
  serviceArea?: Partial<IWorkerProfileEntity['serviceArea']> | undefined;
  hourlyRate?: number | null | undefined;
  isAvailable?: boolean | undefined;
  ratingAverage?: number | undefined;
  ratingCount?: number | undefined;
  completedJobsCount?: number | undefined;
  kycStatus?: 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | undefined;
  deletedAt?: Date | null | undefined;
}

// Customer Profile Entity
export interface ICustomerProfileEntity {
  id: string;
  userId: string;
  fullName: string;
  addresses: Array<{
    id?: string | undefined;
    label: string; // e.g. "Home", "Office"
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    coordinates?: [number, number] | undefined;
    isDefault: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null | undefined;
}

export interface ICreateCustomerProfileInput {
  userId: string;
  fullName: string;
  addresses?: ICustomerProfileEntity['addresses'] | undefined;
}

export interface IUpdateCustomerProfileInput {
  fullName?: string | undefined;
  addresses?: ICustomerProfileEntity['addresses'] | undefined;
  deletedAt?: Date | null | undefined;
}
