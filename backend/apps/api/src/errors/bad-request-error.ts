import { AppError } from './app-error.js';
import type { ErrorDetails } from '@kaamsetu/types';

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details?: ErrorDetails[]) {
    super(message, 400, 'BAD_REQUEST', true, details);
  }
}
