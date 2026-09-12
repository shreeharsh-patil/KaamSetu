import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { env, logger } from '../../../config/index.js';

export const MATCHING_QUEUE_NAME = 'matching-jobs';

export interface MatchingJobData {
  type: 'expire-job-offer' | 'dispatch-next-matching-wave' | 'expire-job-matching';
  jobId: string;
  offerId?: string;
  waveNumber?: number;
}

export class MatchingQueue {
  private queue: Queue<MatchingJobData> | null = null;
  private connection: Redis | null = null;
  private fallbackTimers: Map<string, NodeJS.Timeout> = new Map();

  private getQueue(): Queue<MatchingJobData> | null {
    if (!env.REDIS_URL) {
      return null;
    }

    if (!this.queue) {
      try {
        this.connection = new Redis(env.REDIS_URL, {
          maxRetriesPerRequest: null,
          lazyConnect: true,
          connectTimeout: env.NODE_ENV === 'production' ? 10_000 : 1_000,
          retryStrategy: env.NODE_ENV === 'production' ? undefined : () => null,
        });

        this.queue = new Queue<MatchingJobData>(MATCHING_QUEUE_NAME, {
          connection: this.connection,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
            removeOnComplete: true,
            removeOnFail: false,
          },
        });

        this.queue.on('error', (err) => {
          logger.warn({ err: err.message }, 'Matching BullMQ Queue error');
        });
      } catch (err) {
        logger.warn({ err: err instanceof Error ? err.message : String(err) }, 'Failed to initialize BullMQ MatchingQueue, falling back to local timers');
        this.queue = null;
      }
    }

    return this.queue;
  }

  /**
   * Schedules delayed job offer expiration.
   */
  async enqueueExpireJobOffer(
    jobId: string,
    offerId: string,
    delayMs: number,
    fallbackHandler?: () => Promise<void>
  ): Promise<string | undefined> {
    try {
      const q = this.getQueue();
      if (q) {
        const job = await q.add(
          `expire-offer:${offerId}`,
          { type: 'expire-job-offer', jobId, offerId },
          { delay: Math.max(0, delayMs), jobId: `expire-offer-${offerId}` }
        );
        return job.id;
      }
    } catch (err) {
      logger.warn(
        { err: err instanceof Error ? err.message : String(err), offerId, jobId },
        'Could not enqueue offer expiration to BullMQ, using fallback timer'
      );
    }

    // Fallback: in-memory timer
    if (fallbackHandler) {
      const timerKey = `offer:${offerId}`;
      const existing = this.fallbackTimers.get(timerKey);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        this.fallbackTimers.delete(timerKey);
        void fallbackHandler().catch((e) => {
          logger.error({ err: e instanceof Error ? e.message : String(e), offerId }, 'Fallback offer expiry error');
        });
      }, Math.max(0, delayMs));

      if (typeof timer.unref === 'function') timer.unref();
      this.fallbackTimers.set(timerKey, timer);
    }
    return undefined;
  }

  /**
   * Schedules delayed wave dispatch (if previous wave expired/no-acceptance).
   */
  async enqueueDispatchNextWave(
    jobId: string,
    waveNumber: number,
    delayMs: number,
    fallbackHandler?: () => Promise<void>
  ): Promise<string | undefined> {
    try {
      const q = this.getQueue();
      if (q) {
        const job = await q.add(
          `dispatch-wave:${jobId}:${waveNumber}`,
          { type: 'dispatch-next-matching-wave', jobId, waveNumber },
          { delay: Math.max(0, delayMs), jobId: `dispatch-wave-${jobId}-${waveNumber}` }
        );
        return job.id;
      }
    } catch (err) {
      logger.warn(
        { err: err instanceof Error ? err.message : String(err), jobId, waveNumber },
        'Could not enqueue next wave to BullMQ, using fallback timer'
      );
    }

    // Fallback: in-memory timer
    if (fallbackHandler) {
      const timerKey = `wave:${jobId}:${waveNumber}`;
      const existing = this.fallbackTimers.get(timerKey);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        this.fallbackTimers.delete(timerKey);
        void fallbackHandler().catch((e) => {
          logger.error({ err: e instanceof Error ? e.message : String(e), jobId, waveNumber }, 'Fallback wave dispatch error');
        });
      }, Math.max(0, delayMs));

      if (typeof timer.unref === 'function') timer.unref();
      this.fallbackTimers.set(timerKey, timer);
    }
    return undefined;
  }

  /**
   * Schedules overall matching timeout expiration.
   */
  async enqueueExpireJobMatching(
    jobId: string,
    delayMs: number,
    fallbackHandler?: () => Promise<void>
  ): Promise<string | undefined> {
    try {
      const q = this.getQueue();
      if (q) {
        const job = await q.add(
          `expire-matching:${jobId}`,
          { type: 'expire-job-matching', jobId },
          { delay: Math.max(0, delayMs), jobId: `expire-matching-${jobId}` }
        );
        return job.id;
      }
    } catch (err) {
      logger.warn(
        { err: err instanceof Error ? err.message : String(err), jobId },
        'Could not enqueue matching expiration to BullMQ, using fallback timer'
      );
    }

    // Fallback: in-memory timer
    if (fallbackHandler) {
      const timerKey = `matching:${jobId}`;
      const existing = this.fallbackTimers.get(timerKey);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        this.fallbackTimers.delete(timerKey);
        void fallbackHandler().catch((e) => {
          logger.error({ err: e instanceof Error ? e.message : String(e), jobId }, 'Fallback matching expiry error');
        });
      }, Math.max(0, delayMs));

      if (typeof timer.unref === 'function') timer.unref();
      this.fallbackTimers.set(timerKey, timer);
    }
    return undefined;
  }

  clearFallbackTimer(key: string): void {
    const timer = this.fallbackTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.fallbackTimers.delete(key);
    }
  }

  async close(): Promise<void> {
    for (const [, timer] of this.fallbackTimers) {
      clearTimeout(timer);
    }
    this.fallbackTimers.clear();

    if (this.queue) {
      try {
        await this.queue.close();
      } catch {
        // ignore
      }
      this.queue = null;
    }
    if (this.connection) {
      try {
        this.connection.disconnect();
      } catch {
        // ignore
      }
      this.connection = null;
    }
  }
}

export const matchingQueue = new MatchingQueue();
