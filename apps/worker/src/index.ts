import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { validateEnv } from '@kaamsetu/config';
import { createLogger } from '@kaamsetu/logger';

const env = validateEnv();
const logger = createLogger({
  level: env.LOG_LEVEL,
  isProduction: env.NODE_ENV === 'production',
  serviceName: 'kaamsetu-worker',
});

logger.info('Initializing KaamSetu background worker...');

// Shared Redis connection for BullMQ
const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

export const DEFAULT_QUEUE_NAME = 'default';

export const defaultQueue = new Queue(DEFAULT_QUEUE_NAME, { connection });

export function createJobWorker<T = unknown, R = unknown>(
  queueName: string,
  processor: (job: Job<T, R>) => Promise<R>
): Worker<T, R> {
  const worker = new Worker<T, R>(queueName, processor, {
    connection,
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, queue: queueName }, 'Job completed successfully');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, queue: queueName, err: err.message }, 'Job failed');
  });

  return worker;
}

// Graceful shutdown
async function shutdownWorker(): Promise<void> {
  logger.info('Shutting down background workers...');
  await defaultQueue.close();
  await connection.quit();
  logger.info('Worker connections closed cleanly');
  process.exit(0);
}

process.on('SIGTERM', () => void shutdownWorker());
process.on('SIGINT', () => void shutdownWorker());

logger.info('Worker foundation initialized successfully');
