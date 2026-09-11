import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { env, logger } from '../../../config/index.js';

export const AI_QUEUE_NAME = 'ai-audio-jobs';

export type AIJobType =
  | 'AUDIO_TRANSCRIPTION'
  | 'BATCH_TRANSLATION'
  | 'ASYNC_PROFILE_EXTRACTION';

export interface AIJobPayload {
  jobType: AIJobType;
  userId?: string;
  data: Record<string, unknown>;
}

export class AIQueue {
  private queue: Queue<AIJobPayload> | null = null;
  private connection: Redis | null = null;

  private getQueue(): Queue<AIJobPayload> {
    if (!this.queue) {
      this.connection = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });

      this.queue = new Queue<AIJobPayload>(AI_QUEUE_NAME, {
        connection: this.connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1500,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      });

      this.queue.on('error', (err) => {
        logger.error({ err: err.message }, 'BullMQ AIQueue error');
      });
    }

    return this.queue;
  }

  async enqueue(payload: AIJobPayload): Promise<string | undefined> {
    try {
      const q = this.getQueue();
      const job = await q.add(`ai:${payload.jobType}:${Date.now()}`, payload);
      logger.info({ jobId: job.id, type: payload.jobType }, 'Enqueued AI background job');
      return job.id;
    } catch (err) {
      logger.warn(
        { err: err instanceof Error ? err.message : String(err), type: payload.jobType },
        'Failed to enqueue AI job to BullMQ, falling back'
      );
      return undefined;
    }
  }

  async close(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
      this.queue = null;
    }
    if (this.connection) {
      await this.connection.quit();
      this.connection = null;
    }
  }
}

export const aiQueue = new AIQueue();
