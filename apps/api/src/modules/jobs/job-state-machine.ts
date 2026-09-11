import { JobStatus } from '@kaamsetu/types';
import { InvalidStateTransitionError } from '../../errors/index.js';

export const JOB_TRANSITIONS: Readonly<Record<JobStatus, readonly JobStatus[]>> = {
  [JobStatus.DRAFT]: [JobStatus.OPEN, JobStatus.CANCELLED],
  [JobStatus.OPEN]: [JobStatus.MATCHING, JobStatus.CANCELLED, JobStatus.EXPIRED],
  [JobStatus.MATCHING]: [
    JobStatus.OFFERED,
    JobStatus.OPEN,
    JobStatus.CANCELLED,
    JobStatus.EXPIRED,
  ],
  [JobStatus.OFFERED]: [
    JobStatus.ACCEPTED,
    JobStatus.OPEN,
    JobStatus.MATCHING,
    JobStatus.CANCELLED,
    JobStatus.EXPIRED,
  ],
  [JobStatus.ACCEPTED]: [JobStatus.EN_ROUTE, JobStatus.CANCELLED, JobStatus.DISPUTED],
  [JobStatus.EN_ROUTE]: [JobStatus.ARRIVED, JobStatus.CANCELLED, JobStatus.DISPUTED],
  [JobStatus.ARRIVED]: [JobStatus.IN_PROGRESS, JobStatus.CANCELLED, JobStatus.DISPUTED],
  [JobStatus.IN_PROGRESS]: [JobStatus.COMPLETED, JobStatus.DISPUTED, JobStatus.CANCELLED],
  [JobStatus.COMPLETED]: [],
  [JobStatus.CANCELLED]: [],
  [JobStatus.DISPUTED]: [JobStatus.COMPLETED, JobStatus.CANCELLED],
  [JobStatus.EXPIRED]: [],
};

export const ALLOWED_JOB_TRANSITIONS = JOB_TRANSITIONS;

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  if (from === to) return false;
  const targets = JOB_TRANSITIONS[from];
  return targets ? targets.includes(to) : false;
}

export class JobStateMachine {
  validateTransition(from: JobStatus, to: JobStatus): void {
    JobStateMachine.validateTransition(from, to);
  }

  canTransition(from: JobStatus, to: JobStatus): boolean {
    return canTransition(from, to);
  }

  static canTransition(from: JobStatus, to: JobStatus): boolean {
    return canTransition(from, to);
  }

  static validateTransition(from: JobStatus, to: JobStatus): void {
    if (from === to) {
      throw new InvalidStateTransitionError(
        from,
        to,
        `Job is already in state ${from}`
      );
    }
    if (!canTransition(from, to)) {
      throw new InvalidStateTransitionError(from, to);
    }
  }

  static isJobEditable(status: JobStatus): boolean {
    return status === JobStatus.DRAFT || status === JobStatus.OPEN;
  }
}
