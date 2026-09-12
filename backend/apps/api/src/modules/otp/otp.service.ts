import { createHash, randomInt } from 'crypto';
import { getRedisClient } from '../../database/redis.js';
import { getOTPProvider, IOTPProvider } from './otp.provider.js';
import { BadRequestError } from '../../errors/index.js';
import { env, logger } from '../../config/index.js';
import { normalizePhoneNumber } from '@kaamsetu/validation';

export interface OTPState {
  codeHash: string;
  attempts: number;
  expiresAt: number;
}

const OTP_TTL_SECONDS = 300; // 5 minutes
const OTP_COOLDOWN_SECONDS = 60; // 60 seconds
const MAX_ATTEMPTS = 3;
const MAX_REQUESTS_PER_PHONE_PER_HOUR = 5;
const MAX_REQUESTS_PER_IP_PER_HOUR = 25;

export class OTPService {
  // Fallback in-memory store when Redis is unavailable (e.g. local offline test runs)
  private memoryStore: Map<string, { value: string; expiresAt: number }> = new Map();

  constructor(private readonly provider: IOTPProvider = getOTPProvider()) {}

  private hashOTP(otp: string): string {
    return createHash('sha256').update(otp).digest('hex');
  }

  private async get(key: string): Promise<string | null> {
    const redis = getRedisClient();
    if (redis && redis.status === 'ready') {
      try {
        return await redis.get(key);
      } catch {
        // Fall back to memoryStore
      }
    }

    const item = this.memoryStore.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return item.value;
  }

  private async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    const redis = getRedisClient();
    if (redis && redis.status === 'ready') {
      try {
        await redis.set(key, value, 'EX', ttlSeconds);
        return;
      } catch {
        // Fall back to memoryStore
      }
    }

    this.memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  private async del(key: string): Promise<void> {
    const redis = getRedisClient();
    if (redis && redis.status === 'ready') {
      try {
        await redis.del(key);
      } catch {
        // Ignore
      }
    }
    this.memoryStore.delete(key);
  }

  private async incr(key: string, ttlSeconds: number): Promise<number> {
    const redis = getRedisClient();
    if (redis && redis.status === 'ready') {
      try {
        const count = await redis.incr(key);
        if (count === 1) {
          await redis.expire(key, ttlSeconds);
        }
        return count;
      } catch {
        // Fall back to memoryStore
      }
    }

    const item = this.memoryStore.get(key);
    let count = 1;
    if (item && Date.now() <= item.expiresAt) {
      count = parseInt(item.value, 10) + 1;
    }
    this.memoryStore.set(key, {
      value: count.toString(),
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return count;
  }

  /**
   * Generates and dispatches a secure 6-digit OTP.
   */
  async requestOTP(
    phoneNumber: string,
    ipAddress = '127.0.0.1'
  ): Promise<{ cooldownSeconds: number }> {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // 1. Rate limiting per IP
    const ipKey = `otp:ratelimit:ip:${ipAddress}`;
    const ipCount = await this.incr(ipKey, 3600);
    if (ipCount > MAX_REQUESTS_PER_IP_PER_HOUR) {
      throw new BadRequestError('Too many OTP requests from this IP address. Please try again later.');
    }

    // 2. Rate limiting per Phone Number
    const phoneRateKey = `otp:ratelimit:phone:${normalizedPhone}`;
    const phoneCount = await this.incr(phoneRateKey, 3600);
    if (phoneCount > MAX_REQUESTS_PER_PHONE_PER_HOUR) {
      throw new BadRequestError('Too many OTP requests for this phone number. Please try again in an hour.');
    }

    // 3. Resend cooldown check
    const cooldownKey = `otp:cooldown:${normalizedPhone}`;
    const inCooldown = await this.get(cooldownKey);
    if (inCooldown) {
      throw new BadRequestError('Please wait before requesting another OTP.');
    }

    // Keep local development and tests easy to exercise, but never use a
    // predictable OTP in production.
    const otp =
      env.NODE_ENV === 'production'
        ? randomInt(100000, 1000000).toString()
        : '123456';
    const codeHash = this.hashOTP(otp);

    const state: OTPState = {
      codeHash,
      attempts: 0,
      expiresAt: Date.now() + OTP_TTL_SECONDS * 1000,
    };

    // 5. Store OTP state and cooldown
    const stateKey = `otp:state:${normalizedPhone}`;
    await this.set(stateKey, JSON.stringify(state), OTP_TTL_SECONDS);
    await this.set(cooldownKey, '1', OTP_COOLDOWN_SECONDS);

    // 6. Send OTP via configured provider (never log the actual OTP)
    await this.provider.sendOTP(normalizedPhone, otp);

    logger.info(
      { phoneNumber: normalizedPhone },
      'OTP generated and dispatched successfully'
    );

    return { cooldownSeconds: OTP_COOLDOWN_SECONDS };
  }

  /**
   * Verifies the OTP, checks attempts, and removes state upon success (replay prevention).
   */
  async verifyOTP(phoneNumber: string, inputOtp: string): Promise<boolean> {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const stateKey = `otp:state:${normalizedPhone}`;

    const rawState = await this.get(stateKey);
    if (!rawState) {
      throw new BadRequestError('OTP has expired or was not requested. Please request a new OTP.');
    }

    const state: OTPState = JSON.parse(rawState);

    // 1. Check expiration
    if (Date.now() > state.expiresAt) {
      await this.del(stateKey);
      throw new BadRequestError('OTP has expired. Please request a new OTP.');
    }

    // 2. Check maximum attempts
    if (state.attempts >= MAX_ATTEMPTS) {
      await this.del(stateKey);
      throw new BadRequestError('Too many failed attempts. This OTP has been invalidated. Please request a new one.');
    }

    const inputHash = this.hashOTP(inputOtp.trim());

    // 3. Verify hash match
    if (state.codeHash !== inputHash) {
      state.attempts += 1;
      const remaining = MAX_ATTEMPTS - state.attempts;

      if (remaining <= 0) {
        await this.del(stateKey);
        throw new BadRequestError('Too many failed attempts. This OTP has been invalidated. Please request a new one.');
      } else {
        await this.set(stateKey, JSON.stringify(state), Math.max(1, Math.floor((state.expiresAt - Date.now()) / 1000)));
        throw new BadRequestError(`Invalid OTP. You have ${remaining} attempt(s) remaining.`);
      }
    }

    // 4. Successful verification: Delete OTP and cooldown to complete flow and prevent replay attacks!
    await this.del(stateKey);
    await this.del(`otp:cooldown:${normalizedPhone}`);

    logger.info(
      { phoneNumber: normalizedPhone },
      'OTP verified successfully'
    );

    return true;
  }
}

export const otpService = new OTPService();
