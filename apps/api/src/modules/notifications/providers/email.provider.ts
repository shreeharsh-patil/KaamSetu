import { NotificationChannel, type INotificationEntity } from '@kaamsetu/types';
import type { INotificationProvider } from './notification-provider.interface.js';
import { logger } from '../../../config/index.js';

export interface IEmailDriver {
  sendEmail(to: string, subject: string, body: string, data?: Record<string, unknown>): Promise<boolean>;
}

export class MockEmailDriver implements IEmailDriver {
  async sendEmail(
    to: string,
    subject: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<boolean> {
    logger.info(
      { recipient: to, subject, body, data },
      '[EmailDriver:Mock] Email notification dispatched'
    );
    return true;
  }
}

export class EmailNotificationProvider implements INotificationProvider {
  readonly channel = NotificationChannel.EMAIL;

  constructor(private readonly driver: IEmailDriver = new MockEmailDriver()) {}

  async send(notification: INotificationEntity): Promise<boolean> {
    logger.debug(
      { userId: notification.userId, subject: notification.title },
      'Dispatching Email notification'
    );
    return this.driver.sendEmail(
      notification.userId,
      notification.title,
      notification.body,
      notification.data
    );
  }
}

export const emailNotificationProvider = new EmailNotificationProvider();
