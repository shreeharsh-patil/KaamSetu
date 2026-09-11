import { NotificationChannel, type INotificationEntity } from '@kaamsetu/types';
import type { INotificationProvider } from './notification-provider.interface.js';
import { RealtimeGateway, realtimeGateway } from '../../../realtime/index.js';
import { logger } from '../../../config/index.js';

export class InAppNotificationProvider implements INotificationProvider {
  readonly channel = NotificationChannel.IN_APP;

  constructor(private readonly realtime: RealtimeGateway = realtimeGateway) {}

  async send(notification: INotificationEntity): Promise<boolean> {
    logger.debug(
      { userId: notification.userId, type: notification.type },
      'Sending in-app notification via realtime gateway'
    );
    // Broadcast via socket to user's personal room
    this.realtime.emitToUser(notification.userId, 'notification.created', notification);
    return true;
  }
}

export const inAppNotificationProvider = new InAppNotificationProvider();
