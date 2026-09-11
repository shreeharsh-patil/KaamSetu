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
