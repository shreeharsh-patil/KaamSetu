import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { env, logger } from '../../../config/index.js';
import { AI_QUEUE_NAME, type AIJobPayload } from './ai.queue.js';
import { aiService } from '../ai.service.js';
import { speechService } from '../../speech/speech.service.js';

export class AIWorker {
  private worker: Worker<AIJobPayload> | null = null;
  private connection: Redis | null = null;

  start(): void {
    if (this.worker) return;

    this.connection = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });

    this.worker = new Worker<AIJobPayload>(
      AI_QUEUE_NAME,
      async (job: Job<AIJobPayload>) => {
        const { jobType, data } = job.data;
        logger.info({ jobId: job.id, jobType }, 'Processing AI background job');

        switch (jobType) {
          case 'AUDIO_TRANSCRIPTION': {
            const audio = String(data['audio'] || '');
            const mimeType = String(data['mimeType'] || 'audio/wav');
            return await speechService.speechToText(audio, mimeType);
          }
          case 'BATCH_TRANSLATION': {
            const text = String(data['text'] || '');
            const targetLanguage = String(data['targetLanguage'] || 'en');
            const sourceLanguage = String(data['sourceLanguage'] || 'en');
            return await aiService.translateText(text, targetLanguage, sourceLanguage);
          }
          case 'ASYNC_PROFILE_EXTRACTION': {
            const text = String(data['text'] || '');
            return await aiService.extractWorkerProfile(text);
          }
          default:
            logger.warn({ jobType }, 'Unknown AI job type encountered in worker');
            return null;
        }
      },
      {
        connection: this.connection,
        concurrency: 3,
      }
    );

    this.worker.on('completed', (job) => {
      logger.info({ jobId: job.id, jobType: job.data.jobType }, 'AI background job completed');
    });

    this.worker.on('failed', (job, err) => {
      logger.error(
        { jobId: job?.id, jobType: job?.data.jobType, err: err.message },
        'AI background job failed'
      );
    });
  }

  async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    if (this.connection) {
      await this.connection.quit();
      this.connection = null;
    }
  }
}

export const aiWorker = new AIWorker();
