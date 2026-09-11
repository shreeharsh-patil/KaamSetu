import type {
  CircuitBreakerState,
  CircuitBreakerStatus,
} from '@kaamsetu/types';
import { logger } from '../../config/index.js';

export interface CircuitBreakerOptions {
  name?: string;
  failureThreshold?: number; // Consecutive failures before tripping to OPEN (default: 3)
  cooldownPeriodMs?: number; // Time to remain OPEN before trying HALF_OPEN (default: 30000)
  timeoutMs?: number; // Timeout per operation in ms (default: 5000)
  halfOpenMaxSuccesses?: number; // Consecutive successes needed in HALF_OPEN to transition to CLOSED (default: 2)
}

export class CircuitBreakerError extends Error {
  constructor(public readonly breakerName: string, message: string) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount: number = 0;
  private consecutiveSuccesses: number = 0;
  private lastFailureTime: Date | null = null;
  private lastStateChange: Date = new Date();

  public readonly name: string;
  private readonly failureThreshold: number;
  private readonly cooldownPeriodMs: number;
  private readonly timeoutMs: number;
  private readonly halfOpenMaxSuccesses: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.name = options.name ?? 'CircuitBreaker';
    this.failureThreshold = options.failureThreshold ?? 3;
    this.cooldownPeriodMs = options.cooldownPeriodMs ?? 30000;
    this.timeoutMs = options.timeoutMs ?? 5000;
    this.halfOpenMaxSuccesses = options.halfOpenMaxSuccesses ?? 2;
  }

  /**
   * Execute an operation guarded by the circuit breaker, with timeout and optional fallback.
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: (error: Error) => Promise<T> | T
  ): Promise<T> {
    this.checkStateTransition();

    if (this.state === 'OPEN') {
      const openErr = new CircuitBreakerError(
        this.name,
        `Circuit breaker [${this.name}] is OPEN. Requests are temporarily short-circuited.`
      );
      if (fallback) {
        logger.warn({ breaker: this.name }, 'Circuit breaker OPEN, executing fallback');
        return fallback(openErr);
      }
      throw openErr;
    }

    try {
      const result = await this.withTimeout(operation(), this.timeoutMs);
      this.onSuccess();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.onFailure(error);

      if (fallback) {
        logger.warn(
          { breaker: this.name, err: error.message },
          'Operation failed, executing circuit breaker fallback'
        );
        return fallback(error);
      }

      throw error;
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new CircuitBreakerError(
            this.name,
            `Operation timed out after ${ms}ms in [${this.name}]`
          )
        );
      }, ms);

      promise
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.consecutiveSuccesses++;
      if (this.consecutiveSuccesses >= this.halfOpenMaxSuccesses) {
        this.setState('CLOSED');
        this.failureCount = 0;
        this.consecutiveSuccesses = 0;
        logger.info({ breaker: this.name }, 'Circuit breaker recovered and transitioned to CLOSED');
      }
    } else if (this.state === 'CLOSED') {
      this.failureCount = 0;
    }
  }

  private onFailure(err: Error): void {
    this.lastFailureTime = new Date();

    if (this.state === 'HALF_OPEN') {
      // Any failure during trial immediately re-trips to OPEN
      this.setState('OPEN');
      this.consecutiveSuccesses = 0;
      logger.warn({ breaker: this.name, err: err.message }, 'Half-open test failed; re-tripped to OPEN');
    } else if (this.state === 'CLOSED') {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.setState('OPEN');
        logger.warn(
          { breaker: this.name, failures: this.failureCount, err: err.message },
          'Failure threshold reached; circuit breaker tripped to OPEN'
        );
      }
    }
  }

  private checkStateTransition(): void {
    if (this.state === 'OPEN' && this.lastFailureTime) {
      const timeSinceFailure = Date.now() - this.lastFailureTime.getTime();
      if (timeSinceFailure >= this.cooldownPeriodMs) {
        this.setState('HALF_OPEN');
        this.consecutiveSuccesses = 0;
        logger.info({ breaker: this.name }, 'Cooldown elapsed; circuit breaker entered HALF_OPEN state');
      }
    }
  }

  private setState(newState: CircuitBreakerState): void {
    this.state = newState;
    this.lastStateChange = new Date();
  }

  public getStatus(): CircuitBreakerStatus {
    this.checkStateTransition();
    return {
      state: this.state,
      failureCount: this.failureCount,
      consecutiveSuccesses: this.consecutiveSuccesses,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
    };
  }

  public reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = null;
    this.lastStateChange = new Date();
  }

  public trip(): void {
    this.state = 'OPEN';
    this.lastFailureTime = new Date();
    this.lastStateChange = new Date();
  }
}
