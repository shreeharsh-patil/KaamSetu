import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { env, logger } from '../../../config/index.js';
import type { INotificationEntity, NotificationJobData } from '@kaamsetu/types';

export const NOTIFICATIONS_QUEUE_NAME = 'notifications';

export class NotificationQueue {
  private queue: Queue<NotificationJobData> | null = null;
  private connection: Redis | null = null;

  private getQueue(): Queue<NotificationJobData> {
    if (!this.queue) {
      this.connection = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });

      this.queue = new Queue<NotificationJobData>(NOTIFICATIONS_QUEUE_NAME, {
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
        logger.error({ err: err.message }, 'Notification BullMQ Queue error');
      });
    }

    return this.queue;
  }

  async enqueue(notification: INotificationEntity, requestId?: string): Promise<string | undefined> {
    try {
      const q = this.getQueue();
      const job = await q.add(
        `notify:${notification.channel}:${notification.id}`,
        {
          notificationId: notification.id,
          userId: notification.userId,
          channel: notification.channel,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          requestId,
        }
      );
      return job.id;
    } catch (err) {
      logger.warn(
        { err: err instanceof Error ? err.message : String(err), notificationId: notification.id },
        'Failed to enqueue notification to BullMQ, falling back to direct delivery'
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

export const notificationQueue = new NotificationQueue();
