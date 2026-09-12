import { AppError } from './app-error.js';

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(message, 429, 'TOO_MANY_REQUESTS', true);
  }
}
