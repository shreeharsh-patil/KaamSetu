import { AppError } from './app-error.js';

export class RequestTimeoutError extends AppError {
  constructor(message = 'Request processing timed out.') {
    super(message, 408, 'REQUEST_TIMEOUT', true);
  }
}
