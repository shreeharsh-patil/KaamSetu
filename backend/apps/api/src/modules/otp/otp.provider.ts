import { logger, env } from '../../config/index.js';
import { InternalServerError } from '../../errors/index.js';

export interface IOTPProvider {
  sendOTP(phoneNumber: string, otp: string): Promise<boolean>;
}

/**
 * Development & Testing OTP Provider
 * Used in local development and automated test suites.
 */
export class DevOTPProvider implements IOTPProvider {
  // In-memory store accessible for tests to verify OTP without plaintext logging
  private static lastSentOtpByPhone: Map<string, string> = new Map();

  async sendOTP(phoneNumber: string, otp: string): Promise<boolean> {
    DevOTPProvider.lastSentOtpByPhone.set(phoneNumber, otp);

    if (env.NODE_ENV === 'development' || env.AUTH_MOCK_OTP_ENABLED) {
      logger.info(
        {
          phoneNumber,
          hint: 'Dev mode: OTP stored in memory for testing',
        },
        'OTP dispatched via DevOTPProvider'
      );
    }

    return true;
  }

  static getLastSentOTP(phoneNumber: string): string | undefined {
    return DevOTPProvider.lastSentOtpByPhone.get(phoneNumber);
  }

  static clear(): void {
    DevOTPProvider.lastSentOtpByPhone.clear();
  }
}

export function getOTPProvider(): IOTPProvider {
  const isMockAllowed = env.AUTH_MOCK_OTP_ENABLED || env.NODE_ENV !== 'production';
  if (isMockAllowed) {
    return new DevOTPProvider();
  }

  // Pluggable SMS provider interface for production (MSG91, Twilio, AWS SNS, Fast2SMS)
  throw new InternalServerError('SMS provider is not configured for production environment');
}
