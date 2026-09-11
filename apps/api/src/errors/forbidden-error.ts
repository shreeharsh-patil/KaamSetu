import { AppError } from './app-error.js';

export class ForbiddenError extends AppError {
  constructor(message = 'Permission denied') {
    super(message, 403, 'FORBIDDEN', true);
  }
}
