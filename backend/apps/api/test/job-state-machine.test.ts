import { describe, it, expect } from 'vitest';
import {
  JOB_TRANSITIONS,
  JobStateMachine,
  canTransition,
} from '../src/modules/jobs/job-state-machine.js';
import { InvalidStateTransitionError } from '../src/errors/index.js';
import { JobStatus } from '@kaamsetu/types';

const ALL_STATUSES = Object.values(JobStatus);
const stateMachine = new JobStateMachine();

describe('JobStateMachine (Phase 4)', () => {
  describe('transition table completeness', () => {
    it('defines an entry for every job status', () => {
      for (const status of ALL_STATUSES) {
        expect(Array.isArray(JOB_TRANSITIONS[status])).toBe(true);
      }
      expect(Object.keys(JOB_TRANSITIONS).length).toBe(ALL_STATUSES.length);
    });

    it('only transitions into known statuses', () => {
      for (const [, targets] of Object.entries(JOB_TRANSITIONS)) {
        for (const target of targets) {
          expect(ALL_STATUSES).toContain(target);
        }
      }
    });

    it('never allows a status to transition to itself', () => {
      for (const status of ALL_STATUSES) {
        expect(canTransition(status, status)).toBe(false);
      }
    });

    it('marks terminal states as having no outgoing transitions', () => {
      expect(JOB_TRANSITIONS[JobStatus.COMPLETED]).toEqual([]);
      expect(JOB_TRANSITIONS[JobStatus.CANCELLED]).toEqual([]);
      expect(JOB_TRANSITIONS[JobStatus.EXPIRED]).toEqual([]);
    });
  });

  describe('every valid transition succeeds', () => {
    const validPairs: Array<[JobStatus, JobStatus]> = [];
    for (const [from, targets] of Object.entries(JOB_TRANSITIONS)) {
      for (const to of targets) {
        validPairs.push([from as JobStatus, to]);
      }
    }

    it.each(validPairs)('allows %s -> %s', (from, to) => {
      expect(() => stateMachine.validateTransition(from, to)).not.toThrow();
      expect(canTransition(from, to)).toBe(true);
    });

    it('covers the documented happy path end to end', () => {
      const happyPath: JobStatus[] = [
        JobStatus.DRAFT,
        JobStatus.OPEN,
        JobStatus.MATCHING,
        JobStatus.OFFERED,
        JobStatus.ACCEPTED,
        JobStatus.EN_ROUTE,
        JobStatus.ARRIVED,
        JobStatus.IN_PROGRESS,
        JobStatus.COMPLETED,
      ];

      for (let i = 0; i < happyPath.length - 1; i++) {
        expect(() =>
          stateMachine.validateTransition(happyPath[i]!, happyPath[i + 1]!)
        ).not.toThrow();
      }
    });
  });

  describe('every invalid transition is rejected', () => {
    const invalidPairs: Array<[JobStatus, JobStatus]> = [];
    for (const from of ALL_STATUSES) {
      for (const to of ALL_STATUSES) {
        if (!canTransition(from, to)) {
          invalidPairs.push([from, to]);
        }
      }
    }

    it.each(invalidPairs)('rejects %s -> %s', (from, to) => {
      expect(() => stateMachine.validateTransition(from, to)).toThrow(
        InvalidStateTransitionError
      );
    });

    it('reports from and to states in the error details', () => {
      try {
        stateMachine.validateTransition(JobStatus.DRAFT, JobStatus.COMPLETED);
        expect.unreachable('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidStateTransitionError);
        const details = (err as InvalidStateTransitionError).details;
        expect(details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'from', message: JobStatus.DRAFT }),
            expect.objectContaining({ field: 'to', message: JobStatus.COMPLETED }),
          ])
        );
      }
    });

    it('gives a specific message when from === to', () => {
      expect(() =>
        stateMachine.validateTransition(JobStatus.OPEN, JobStatus.OPEN)
      ).toThrow(/already in state OPEN/);
    });
  });

  it('is pure — repeated validation of the same pair gives the same result', () => {
    for (let i = 0; i < 3; i++) {
      expect(() =>
        stateMachine.validateTransition(JobStatus.ACCEPTED, JobStatus.EN_ROUTE)
      ).not.toThrow();
      expect(() =>
        stateMachine.validateTransition(JobStatus.ACCEPTED, JobStatus.COMPLETED)
      ).toThrow(InvalidStateTransitionError);
    }
  });
});
