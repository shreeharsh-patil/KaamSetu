import { AppError } from './app-error.js';

export class InternalServerError extends AppError {
  constructor(message = 'An unexpected internal error occurred') {
    super(message, 500, 'INTERNAL_SERVER_ERROR', false);
  }
}
