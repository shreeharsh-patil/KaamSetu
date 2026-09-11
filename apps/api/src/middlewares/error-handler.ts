import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';
import { logger, env } from '../config/index.js';
import type { ApiErrorResponse, ErrorDetails } from '@kaamsetu/types';

export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = String(req.id || (req.headers['x-request-id'] as string) || 'unknown');

  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected internal error occurred';
  let details: ErrorDetails[] | undefined;

  // 1. Handled AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  }
  // 2. Zod validation errors
  else if (
    err instanceof ZodError ||
    (typeof err === 'object' && err !== null && (err as { name?: string }).name === 'ZodError')
  ) {
    const zodErr = err as ZodError;
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = zodErr.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));
  }
  // 3. Body parser JSON syntax errors
  else if (err instanceof SyntaxError && 'status' in err && (err as { status?: number }).status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'BAD_REQUEST';
    message = 'Malformed JSON in request body';
  }
  // 4. Mongoose specific errors
  else if (typeof err === 'object' && err !== null && 'name' in err) {
    const errorObj = err as { name: string; code?: number; errors?: Record<string, { message: string; path?: string }>; message?: string };

    if (errorObj.name === 'CastError') {
      statusCode = 400;
      code = 'BAD_REQUEST';
      message = 'Invalid resource identifier format';
    } else if (errorObj.name === 'ValidationError' && errorObj.errors) {
      statusCode = 422;
      code = 'VALIDATION_ERROR';
      message = 'Database validation failed';
      details = Object.values(errorObj.errors).map((e) => ({
        field: e.path || 'unknown',
        message: e.message,
      }));
    } else if (errorObj.code === 11000) {
      statusCode = 409;
      code = 'CONFLICT';
      message = 'A duplicate resource already exists';
    } else if (err instanceof Error) {
      if (env.NODE_ENV !== 'production') {
        message = err.message;
      }
    }
  } else if (err instanceof Error) {
    if (env.NODE_ENV !== 'production') {
      message = err.message;
    }
  }

  // Structured log of the failure
  if (statusCode >= 500) {
    logger.error(
      {
        err: err instanceof Error ? { message: err.message, stack: err.stack } : err,
        requestId,
        url: req.originalUrl,
        method: req.method,
      },
      `Internal server error handling request [${requestId}]`
    );
  } else {
    logger.warn(
      {
        code,
        statusCode,
        message,
        requestId,
        url: req.originalUrl,
        method: req.method,
      },
      `Client error handling request [${requestId}]: ${message}`
    );
  }

  const responseBody: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      requestId,
      ...(details ? { details } : {}),
    },
  };

  res.status(statusCode).json(responseBody);
}
