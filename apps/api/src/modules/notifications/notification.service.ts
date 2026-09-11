import { Types } from 'mongoose';
import {
  type INotificationEntity,
  type ICreateNotificationInput,
} from '@kaamsetu/types';
import {
  notificationRepository,
  INotificationRepository,
} from './notification.repository.js';
import {
  notificationProviderRegistry,
  NotificationProviderRegistry,
} from './providers/provider.registry.js';
import { notificationQueue, NotificationQueue } from './queue/notification.queue.js';
import { BadRequestError, NotFoundError } from '../../errors/index.js';
import { logger } from '../../config/index.js';

export class NotificationService {
  constructor(
    private readonly repo: INotificationRepository = notificationRepository,
    private readonly registry: NotificationProviderRegistry = notificationProviderRegistry,
    private readonly queue: NotificationQueue = notificationQueue
  ) {}

  /**
   * Creates a notification record and dispatches delivery via BullMQ.
   * If queueing fails or is unavailable, falls back gracefully to immediate delivery.
   */
  async sendNotification(input: ICreateNotificationInput): Promise<INotificationEntity> {
    if (!Types.ObjectId.isValid(input.userId)) {
      throw new BadRequestError('Invalid user ID format');
    }

    const notification = await this.repo.create(input);

    // Try enqueuing to BullMQ
    const jobId = await this.queue.enqueue(notification);

    // If queue is not active or enqueuing was bypassed, deliver directly
    if (!jobId) {
      try {
        const provider = this.registry.getProvider(notification.channel);
        await provider.send(notification);
        await this.repo.markAsDelivered(notification.id);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.error({ err: errorMsg, notificationId: notification.id }, 'Direct notification delivery failed');
        await this.repo.markAsFailed(notification.id, errorMsg);
      }
    }

    return notification;
  }

  async getUserNotifications(userId: string, limit: number = 20): Promise<INotificationEntity[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestError('Invalid user ID format');
    }
    return this.repo.findByUserId(userId, limit);
  }

  async markAsRead(id: string, userId: string): Promise<INotificationEntity> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestError('Invalid ID format');
    }
    const updated = await this.repo.markAsRead(id, userId);
    if (!updated) {
      throw new NotFoundError('Notification not found');
    }
    return updated;
  }

  async markAllAsRead(userId: string): Promise<{ markedCount: number }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestError('Invalid user ID format');
    }
    const count = await this.repo.markAllAsRead(userId);
    return { markedCount: count };
  }
}

export const notificationService = new NotificationService();
