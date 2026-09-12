import { AppError } from './app-error.js';

export class PayloadTooLargeError extends AppError {
  constructor(message = 'Request payload exceeds maximum allowed size.') {
    super(message, 413, 'PAYLOAD_TOO_LARGE', true);
  }
}
