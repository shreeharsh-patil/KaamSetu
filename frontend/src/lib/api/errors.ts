export interface ApiErrorPayload {
  success?: boolean;
  message?: string;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  errors?: Array<{ field: string; message: string }>;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly requestId?: string;

  constructor(
    message: string,
    status = 500,
    code = "INTERNAL_SERVER_ERROR",
    details?: unknown,
    requestId?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;

    // Maintains proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  public isUnauthorized(): boolean {
    return this.status === 401;
  }

  public isForbidden(): boolean {
    return this.status === 403;
  }

  public isNotFound(): boolean {
    return this.status === 404;
  }

  public isValidationError(): boolean {
    return this.status === 400 || this.status === 422;
  }

  public isRateLimited(): boolean {
    return this.status === 429;
  }

  public isNetworkError(): boolean {
    return this.status === 0;
  }
}
