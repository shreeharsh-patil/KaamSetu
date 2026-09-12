import { NotificationChannel, type INotificationEntity } from '@kaamsetu/types';
import type { INotificationProvider } from './notification-provider.interface.js';
import { logger } from '../../../config/index.js';

export interface IPushDriver {
  sendPush(tokenOrUserId: string, title: string, body: string, data?: Record<string, unknown>): Promise<boolean>;
}

export class MockPushDriver implements IPushDriver {
  async sendPush(
    tokenOrUserId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<boolean> {
    logger.info(
      { recipient: tokenOrUserId, title, body, data },
      '[PushDriver:Mock] Push notification delivered'
    );
    return true;
  }
}

export class PushNotificationProvider implements INotificationProvider {
  readonly channel = NotificationChannel.PUSH;

  constructor(private readonly driver: IPushDriver = new MockPushDriver()) {}

  async send(notification: INotificationEntity): Promise<boolean> {
    logger.debug(
      { userId: notification.userId, title: notification.title },
      'Dispatching push notification'
    );
    return this.driver.sendPush(
      notification.userId,
      notification.title,
      notification.body,
      notification.data
    );
  }
}

export const pushNotificationProvider = new PushNotificationProvider();
