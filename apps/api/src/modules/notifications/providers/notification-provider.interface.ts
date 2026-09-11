import type { NotificationChannel, INotificationEntity } from '@kaamsetu/types';

export interface INotificationProvider {
  readonly channel: NotificationChannel;
  send(notification: INotificationEntity): Promise<boolean>;
}
