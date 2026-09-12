import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { env, logger } from '../../../config/index.js';
import type { NotificationJobData } from '@kaamsetu/types';
import { NOTIFICATIONS_QUEUE_NAME } from './notification.queue.js';
import { notificationProviderRegistry } from '../providers/provider.registry.js';
import { notificationRepository } from '../notification.repository.js';
import { metricsService } from '../../../observability/metrics.service.js';
import { sentryService } from '../../../observability/sentry.service.js';

export class NotificationWorker {
  private worker: Worker<NotificationJobData> | null = null;
  private connection: Redis | null = null;

  start(): Worker<NotificationJobData> {
    if (this.worker) return this.worker;

    this.connection = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });

    this.worker = new Worker<NotificationJobData>(
      NOTIFICATIONS_QUEUE_NAME,
      async (job: Job<NotificationJobData>) => {
        const { notificationId, channel, requestId } = job.data;
        logger.info(
          { jobId: job.id, notificationId, channel, requestId, attempt: job.attemptsMade + 1 },
          'Processing notification delivery job'
        );

        const notification = await notificationRepository.findById(notificationId);
        if (!notification) {
          logger.warn({ notificationId, requestId }, 'Notification document not found for BullMQ job');
          return;
        }

        try {
          const provider = notificationProviderRegistry.getProvider(channel);
          await provider.send(notification);
          await notificationRepository.markAsDelivered(notificationId);
          metricsService.recordNotification('sent');
          logger.info({ notificationId, channel, requestId }, 'Notification delivered successfully');
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          metricsService.recordNotification('failed');
          logger.error(
            { notificationId, channel, requestId, attempt: job.attemptsMade + 1, err: errorMsg },
            'Notification delivery failed, will retry if attempts remain'
          );
          await notificationRepository.markAsFailed(notificationId, errorMsg);
          // Re-throw so BullMQ initiates configured exponential backoff retry
          throw err;
        }
      },
      {
        connection: this.connection,
        concurrency: 5,
      }
    );

    this.worker.on('failed', (job, err) => {
      metricsService.recordFailedBackgroundJob();
      sentryService.captureException(err, {
        requestId: job?.data?.requestId,
        extra: { jobId: job?.id, attemptsMade: job?.attemptsMade },
      });
      logger.error(
        { jobId: job?.id, requestId: job?.data?.requestId, attemptsMade: job?.attemptsMade, err: err.message },
        'Notification job failed in BullMQ'
      );
    });

    return this.worker;
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

export const notificationWorker = new NotificationWorker();
