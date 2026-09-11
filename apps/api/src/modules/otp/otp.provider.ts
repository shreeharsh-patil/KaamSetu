import { logger, env } from '../../config/index.js';

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

    if (env.NODE_ENV === 'development') {
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
  // Can be expanded with TwilioOTPProvider, MSG91OTPProvider, etc.
  return new DevOTPProvider();
}
