import http from 'http';
import mongoose from 'mongoose';
import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { validateWorkerEnv } from '@kaamsetu/config';
import { createLogger } from '@kaamsetu/logger';

const env = validateWorkerEnv();
const logger = createLogger({
  level: env.LOG_LEVEL,
  isProduction: env.NODE_ENV === 'production',
  serviceName: 'kaamsetu-worker',
});

logger.info(
  { env: env.NODE_ENV, healthPort: env.WORKER_HEALTH_PORT },
  'Starting KaamSetu background worker process...'
);

// 1. Shared Redis Connection for BullMQ
const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  connectTimeout: 10000,
  retryStrategy(times: number) {
    if (times > 10) {
      logger.warn({ times }, 'Worker Redis retry limit reached (10 attempts). Pausing retries.');
      return null;
    }
    const delay = Math.min(times * 200, 3000);
    logger.warn({ times, delay }, 'Worker reconnecting to Redis...');
    return delay;
  },
});

redisConnection.on('error', (err) => {
  logger.error({ err: err.message }, 'Redis connection error in background worker');
});

// 2. MongoDB Connection
async function initMongo(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    logger.info('Background worker connected to MongoDB');
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : String(err) },
      'Background worker MongoDB connection failure'
    );
  }
}

void initMongo();

// 3. Queue Names & Registry
export const NOTIFICATIONS_QUEUE_NAME = 'notifications';
export const AI_QUEUE_NAME = 'ai-audio-jobs';
export const DEFAULT_QUEUE_NAME = 'default';

export const defaultQueue = new Queue(DEFAULT_QUEUE_NAME, { connection: redisConnection });
export const notificationsQueue = new Queue(NOTIFICATIONS_QUEUE_NAME, { connection: redisConnection });
export const aiQueue = new Queue(AI_QUEUE_NAME, { connection: redisConnection });

const workers: Worker[] = [];

// 4. Notification Job Worker
// The dedicated worker deployment exclusively owns notification consumption.
const notificationWorker = new Worker(
  NOTIFICATIONS_QUEUE_NAME,
  async (job: Job) => {
    const { notificationId, channel, title, recipientId, requestId } = job.data || {};
    logger.info(
      { jobId: job.id, notificationId, channel, recipientId, requestId, attempt: job.attemptsMade + 1 },
      'Processing background notification delivery'
    );

    // Simulated / provider dispatch
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Bookkeeping: if this consumer won the job, mark the notification record
    // delivered so it never remains stuck in PENDING. Mirrors the API's
    // notificationWorker markAsDelivered semantics.
    if (notificationId && mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.collection('notifications').updateOne(
          { _id: new mongoose.Types.ObjectId(notificationId) },
          { $set: { deliveredAt: new Date(), failedAt: null, failureReason: null } }
        );
      } catch (err) {
        logger.warn(
          { err: err instanceof Error ? err.message : String(err), notificationId },
          'Could not update notification delivery status in background worker'
        );
      }
    }

    logger.info(
      { jobId: job.id, notificationId, channel, title },
      'Notification dispatched successfully by background worker'
    );
    return { success: true, deliveredAt: new Date().toISOString() };
  },
  {
    connection: redisConnection,
    concurrency: 10,
  }
);

notificationWorker.on('completed', (job) => {
  logger.info({ jobId: job.id, queue: NOTIFICATIONS_QUEUE_NAME }, 'Notification job completed');
});

notificationWorker.on('failed', (job, err) => {
  logger.error(
    { jobId: job?.id, queue: NOTIFICATIONS_QUEUE_NAME, err: err.message, attempts: job?.attemptsMade },
    'Notification job failed'
  );
});

workers.push(notificationWorker);

// 5. AI Audio & Translation Job Worker
const aiWorker = new Worker(
  AI_QUEUE_NAME,
  async (job: Job) => {
    const { jobType, userId, data } = job.data || {};
    logger.info(
      { jobId: job.id, jobType, userId, attempt: job.attemptsMade + 1 },
      'Processing async AI / Speech background task'
    );

    switch (jobType) {
      case 'AUDIO_TRANSCRIPTION':
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { success: true, transcription: 'Voice message processed' };
      case 'BATCH_TRANSLATION':
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { success: true, count: Array.isArray(data?.items) ? data.items.length : 0 };
      case 'ASYNC_PROFILE_EXTRACTION':
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { success: true, extracted: true };
      default:
        logger.warn({ jobType }, 'Unknown AI job type received');
        return { success: false, reason: 'unknown_job_type' };
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

aiWorker.on('completed', (job) => {
  logger.info({ jobId: job.id, queue: AI_QUEUE_NAME }, 'AI background job completed');
});

aiWorker.on('failed', (job, err) => {
  logger.error(
    { jobId: job?.id, queue: AI_QUEUE_NAME, err: err.message, attempts: job?.attemptsMade },
    'AI background job failed'
  );
});

workers.push(aiWorker);

// 6. Default Background Maintenance Worker
const defaultWorker = new Worker(
  DEFAULT_QUEUE_NAME,
  async (job: Job) => {
    logger.info({ jobId: job.id, name: job.name }, 'Processing general background job');
    return { success: true };
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

workers.push(defaultWorker);

// 7. Internal HTTP Health Check Server (for container probes & monitoring)
const healthServer = http.createServer(async (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'healthy',
        service: 'kaamsetu-worker',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  if (req.url === '/ready') {
    let redisReady = false;
    try {
      const pong = await redisConnection.ping();
      redisReady = pong === 'PONG';
    } catch {
      redisReady = false;
    }

    const mongoReady = mongoose.connection.readyState === 1;
    const isReady = redisReady && mongoReady;

    res.writeHead(isReady ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ready: isReady,
        redis: redisReady ? 'connected' : 'disconnected',
        mongodb: mongoReady ? 'connected' : 'disconnected',
        activeWorkers: workers.length,
      })
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

const healthPort = env.WORKER_HEALTH_PORT;
healthServer.listen(healthPort, () => {
  logger.info({ port: healthPort }, `Worker health probe server listening on port ${healthPort}`);
});

// 8. Graceful Shutdown
let isShuttingDown = false;

async function shutdown(): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info('Initiating graceful shutdown of KaamSetu background workers...');

  const forceTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out after 10s, forcing exit');
    process.exit(1);
  }, 10000);
  forceTimeout.unref();

  try {
    // Stop accepting health requests
    await new Promise<void>((resolve) => healthServer.close(() => resolve()));
    logger.info('Health check server closed');

    // Pause and close all BullMQ workers
    await Promise.all(workers.map((w) => w.close()));
    logger.info('All BullMQ workers closed');

    // Close queues
    await defaultQueue.close();
    await notificationsQueue.close();
    await aiQueue.close();
    logger.info('All BullMQ queues closed');

    // Disconnect Redis and MongoDB
    await redisConnection.quit();
    await mongoose.disconnect();
    logger.info('Database and cache connections closed cleanly');

    clearTimeout(forceTimeout);
    logger.info('Worker shutdown completed successfully');
    process.exit(0);
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : String(err) },
      'Error during worker graceful shutdown'
    );
    process.exit(1);
  }
}

process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());

export { notificationWorker, aiWorker, defaultWorker };
