import { AppError } from './app-error.js';
import type { ErrorDetails } from '@kaamsetu/types';

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: ErrorDetails[]) {
    super(message, 422, 'VALIDATION_ERROR', true, details);
  }
}
