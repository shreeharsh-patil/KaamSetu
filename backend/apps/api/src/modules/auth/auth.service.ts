import { randomUUID } from 'crypto';
import { IUserRepository, userRepository } from '../users/user.repository.js';
import { ISessionRepository, sessionRepository } from '../sessions/session.repository.js';
import { OTPService, otpService } from '../otp/otp.service.js';
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './token.util.js';
import {
  UserRole,
  UserStatus,
  RequestOtpResponse,
  VerifyOtpResponse,
} from '@kaamsetu/types';
import {
  ForbiddenError,
  UnauthorizedError,
} from '../../errors/index.js';
import { logger } from '../../config/index.js';
import { normalizePhoneNumber } from '@kaamsetu/validation';

export interface AuthMetadata {
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceName?: string | null;
}

export class AuthService {
  constructor(
    private readonly userRepo: IUserRepository = userRepository,
    private readonly sessionRepo: ISessionRepository = sessionRepository,
    private readonly otpSvc: OTPService = otpService
  ) {}

  async requestOtp(phoneNumber: string, ipAddress = '127.0.0.1'): Promise<RequestOtpResponse> {
    const result = await this.otpSvc.requestOTP(phoneNumber, ipAddress);
    return {
      message: 'OTP sent successfully',
      cooldownSeconds: result.cooldownSeconds,
    };
  }

  async verifyOtp(
    phoneNumber: string,
    otp: string,
    metadata: AuthMetadata = {}
  ): Promise<VerifyOtpResponse & { refreshToken: string }> {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // 1. Verify OTP with replay protection and attempt tracking
    await this.otpSvc.verifyOTP(normalizedPhone, otp);

    // 2. Lookup or create user
    let user = await this.userRepo.findByPhone(normalizedPhone, true);

    if (user) {
      // Security: verify user status
      if (user.status === UserStatus.SUSPENDED) {
        logger.warn({ userId: user.id, phoneNumber: normalizedPhone }, 'Suspended user blocked from login');
        throw new ForbiddenError('Your account has been suspended. Please contact customer support.');
      }
      if (user.status === UserStatus.DELETED || user.deletedAt) {
        throw new ForbiddenError('This account has been deactivated.');
      }

      // Mark phone verified and update lastLoginAt
      const updated = await this.userRepo.update(user.id, {
        phoneVerified: true,
        lastLoginAt: new Date(),
      });
      if (updated) {
        user = updated;
      }
    } else {
      // First-time registration: Create default CUSTOMER account
      user = await this.userRepo.create({
        phoneNumber: normalizedPhone,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        phoneVerified: true,
        preferredLanguage: 'en',
      });
      logger.info({ userId: user.id }, 'New user registered via phone OTP');
    }

    // 3. Create Session with rotating token family
    const familyId = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Temporary placeholder hash for session creation
    const tempHash = hashToken(randomUUID());
    const session = await this.sessionRepo.create({
      userId: user.id,
      refreshTokenHash: tempHash,
      familyId,
      deviceName: metadata.deviceName ?? null,
      ipAddress: metadata.ipAddress ?? null,
      userAgent: metadata.userAgent ?? null,
      expiresAt,
    });

    // 4. Generate Refresh Token and store its SHA-256 hash
    const refreshToken = signRefreshToken({
      userId: user.id,
      sessionId: session.id,
      familyId,
    });
    const realHash = hashToken(refreshToken);
    await this.sessionRepo.update(session.id, { refreshTokenHash: realHash });

    // 5. Generate Access Token
    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
      sessionId: session.id,
      familyId,
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(
    oldRefreshToken: string,
    metadata: AuthMetadata = {}
  ): Promise<{ accessToken: string; newRefreshToken: string }> {
    // 1. Verify token signature
    const payload = verifyRefreshToken(oldRefreshToken);

    // 2. Fetch raw session from database
    const session = await this.sessionRepo.findRawById(payload.sessionId);
    const now = new Date();

    if (!session || session.revokedAt !== null || session.expiresAt <= now) {
      // If token family exists, revoke it all to prevent unauthorized access
      if (payload.familyId) {
        await this.sessionRepo.revokeFamily(payload.familyId);
      }
      throw new UnauthorizedError('Session has expired or been revoked. Please log in again.');
    }

    // 3. Refresh Token Reuse Detection
    const incomingHash = hashToken(oldRefreshToken);
    if (session.refreshTokenHash !== incomingHash) {
      // Compromised token family detected! Revoke all sessions in this family!
      await this.sessionRepo.revokeFamily(session.familyId);
      logger.error(
        {
          userId: session.userId,
          sessionId: session._id,
          familyId: session.familyId,
        },
        'SECURITY ALERT: Refresh token reuse detected! Compromised family revoked.'
      );
      throw new UnauthorizedError(
        'Suspicious authentication activity detected. All sessions have been revoked. Please log in again.'
      );
    }

    // 4. Verify user is still active
    const user = await this.userRepo.findById(session.userId.toString());
    if (!user || user.status === UserStatus.SUSPENDED || user.deletedAt) {
      await this.sessionRepo.revoke(session._id.toString());
      throw new ForbiddenError('Account is suspended or deactivated.');
    }

    // 5. Rotate: Issue NEW Refresh Token and NEW Access Token
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const newRefreshToken = signRefreshToken({
      userId: user.id,
      sessionId: session._id.toString(),
      familyId: session.familyId,
    });

    const newHash = hashToken(newRefreshToken);

    await this.sessionRepo.update(session._id.toString(), {
      refreshTokenHash: newHash,
      lastUsedAt: new Date(),
      expiresAt: newExpiresAt,
      ...(metadata.ipAddress !== undefined && { ipAddress: metadata.ipAddress }),
      ...(metadata.userAgent !== undefined && { userAgent: metadata.userAgent }),
    });

    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
      sessionId: session._id.toString(),
      familyId: session.familyId,
    });

    return {
      accessToken,
      newRefreshToken,
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionRepo.revoke(sessionId);
  }

  async logoutAll(userId: string): Promise<number> {
    return this.sessionRepo.revokeAllForUser(userId);
  }
}

export const authService = new AuthService();
