import { NotificationChannel } from '@kaamsetu/types';
import type { INotificationProvider } from './notification-provider.interface.js';
import { inAppNotificationProvider } from './in-app.provider.js';
import { pushNotificationProvider } from './push.provider.js';
import { smsNotificationProvider } from './sms.provider.js';
import { emailNotificationProvider } from './email.provider.js';

export class NotificationProviderRegistry {
  private readonly providers = new Map<NotificationChannel, INotificationProvider>();

  constructor() {
    this.register(inAppNotificationProvider);
    this.register(pushNotificationProvider);
    this.register(smsNotificationProvider);
    this.register(emailNotificationProvider);
  }

  register(provider: INotificationProvider): void {
    this.providers.set(provider.channel, provider);
  }

  getProvider(channel: NotificationChannel): INotificationProvider {
    const provider = this.providers.get(channel);
    if (!provider) {
      throw new Error(`No notification provider registered for channel: ${channel}`);
    }
    return provider;
  }
}

export const notificationProviderRegistry = new NotificationProviderRegistry();
