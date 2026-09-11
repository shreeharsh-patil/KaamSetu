import { NotificationChannel, type INotificationEntity } from '@kaamsetu/types';
import type { INotificationProvider } from './notification-provider.interface.js';
import { logger } from '../../../config/index.js';

export interface ISmsDriver {
  sendSms(userIdOrPhone: string, message: string): Promise<boolean>;
}

export class MockSmsDriver implements ISmsDriver {
  async sendSms(userIdOrPhone: string, message: string): Promise<boolean> {
    logger.info(
      { recipient: userIdOrPhone, message },
      '[SmsDriver:Mock] SMS notification dispatched'
    );
    return true;
  }
}

export class SmsNotificationProvider implements INotificationProvider {
  readonly channel = NotificationChannel.SMS;

  constructor(private readonly driver: ISmsDriver = new MockSmsDriver()) {}

  async send(notification: INotificationEntity): Promise<boolean> {
    logger.debug(
      { userId: notification.userId, title: notification.title },
      'Dispatching SMS notification'
    );
    const text = `${notification.title}: ${notification.body}`;
    return this.driver.sendSms(notification.userId, text);
  }
}

export const smsNotificationProvider = new SmsNotificationProvider();
