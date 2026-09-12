import { AppError } from './app-error.js';

export class InvalidStateTransitionError extends AppError {
  constructor(
    from: string,
    to: string,
    message = `Invalid state transition: ${from} -> ${to}`
  ) {
    super(message, 409, 'INVALID_STATE_TRANSITION', true, [
      { field: 'from', message: from },
      { field: 'to', message: to },
    ]);
  }
}
