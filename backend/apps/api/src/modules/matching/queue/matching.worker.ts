import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { env, logger } from '../../../config/index.js';
import { MATCHING_QUEUE_NAME, type MatchingJobData } from './matching.queue.js';
import { matchingService } from '../matching.service.js';

export class MatchingWorker {
  private worker: Worker<MatchingJobData> | null = null;
  private connection: Redis | null = null;

  start(): Worker<MatchingJobData> | null {
    if (this.worker) return this.worker;
    if (!env.REDIS_URL) return null;

    try {
      this.connection = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });

      this.worker = new Worker<MatchingJobData>(
        MATCHING_QUEUE_NAME,
        async (job: Job<MatchingJobData>) => {
          const { type, jobId, offerId, waveNumber } = job.data;
          logger.info(
            { jobId, type, offerId, waveNumber, bullmqJobId: job.id },
            'Processing background matching task'
          );

          switch (type) {
            case 'expire-job-offer': {
              if (offerId) {
                await matchingService.expireOffer(jobId, offerId);
              }
              break;
            }
            case 'dispatch-next-matching-wave': {
              await matchingService.matchAndDispatchWave(jobId, undefined, (waveNumber ?? 1) + 1);
              break;
            }
            case 'expire-job-matching': {
              await matchingService.expireMatchingJob(jobId, 'MATCHING_TIMEOUT');
              break;
            }
            default: {
              logger.warn({ type }, 'Unknown matching job type');
            }
          }
        },
        {
          connection: this.connection,
          concurrency: 5,
        }
      );

      this.worker.on('error', (err) => {
        logger.warn({ err: err.message }, 'MatchingWorker BullMQ error');
      });

      return this.worker;
    } catch (err) {
      logger.warn(
        { err: err instanceof Error ? err.message : String(err) },
        'Could not start BullMQ MatchingWorker'
      );
      return null;
    }
  }

  async close(): Promise<void> {
    if (this.worker) {
      try {
        await this.worker.close();
      } catch {
        // ignore
      }
      this.worker = null;
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

export const matchingWorker = new MatchingWorker();
