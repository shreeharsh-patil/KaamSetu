import type { Request, Response, CookieOptions } from 'express';
import { authService } from './auth.service.js';
import { sessionService } from '../sessions/session.service.js';
import { verifyRefreshToken } from './token.util.js';
import {
  requestOtpSchema,
  verifyOtpSchema,
  signupRequestOtpSchema,
  signupVerifyOtpSchema,
  completeProfileSchema,
  refreshTokenSchema,
} from '@kaamsetu/validation';
import { UnauthorizedError } from '../../errors/index.js';
import { env } from '../../config/index.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

function getCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

export async function requestOtp(req: Request, res: Response): Promise<void> {
  const parsed = requestOtpSchema.parse(req.body);
  const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';

  const identifier = parsed.identifier || parsed.phone!;
  const result = await authService.requestOtp(identifier, ip);
  res.status(200).json({
    success: true,
    data: result,
    message: result.message,
    cooldownSeconds: result.cooldownSeconds,
    phone: result.phone,
    devHint: result.devHint,
  });
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const parsed = verifyOtpSchema.parse(req.body);
  const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
  const userAgent = req.headers['user-agent'];

  const result = await authService.verifyOtp(parsed.phone, parsed.otp, {
    ipAddress: ip,
    userAgent,
    deviceName: parsed.deviceName,
  });

  // Set rotating Refresh Token in HttpOnly cookie
  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());

  res.status(200).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
      requiresProfileCompletion: result.requiresProfileCompletion,
    },
    user: result.user,
    accessToken: result.accessToken,
    requiresProfileCompletion: result.requiresProfileCompletion,
  });
}

export async function signupRequestOtp(req: Request, res: Response): Promise<void> {
  const parsed = signupRequestOtpSchema.parse(req.body);
  const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';

  const result = await authService.signupRequestOtp(parsed, ip);
  res.status(200).json({
    success: true,
    data: result,
    message: result.message,
    cooldownSeconds: result.cooldownSeconds,
    phone: result.phone,
    devHint: result.devHint,
  });
}

export async function signupVerifyOtp(req: Request, res: Response): Promise<void> {
  const parsed = signupVerifyOtpSchema.parse(req.body);
  const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
  const userAgent = req.headers['user-agent'];

  const result = await authService.signupVerifyOtp(parsed.phone, parsed.otp, {
    ipAddress: ip,
    userAgent,
    deviceName: parsed.deviceName,
  });

  // Set rotating Refresh Token in HttpOnly cookie
  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());

  res.status(200).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
      requiresProfileCompletion: false,
    },
    user: result.user,
    accessToken: result.accessToken,
    requiresProfileCompletion: false,
  });
}

export async function completeProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const parsed = completeProfileSchema.parse(req.body);
  const updatedUser = await authService.completeProfile(req.user.id, parsed);

  res.status(200).json({
    success: true,
    data: {
      user: updatedUser,
    },
    user: updatedUser,
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME];
  const bodyResult = refreshTokenSchema.safeParse(req.body);
  const bodyToken = bodyResult.success ? bodyResult.data.refreshToken : undefined;

  const token = cookieToken || bodyToken;
  if (!token) {
    throw new UnauthorizedError('Refresh token required');
  }

  const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
  const userAgent = req.headers['user-agent'];

  const result = await authService.refreshToken(token, {
    ipAddress: ip,
    userAgent,
  });

  // Rotate cookie with new refresh token
  res.cookie(REFRESH_COOKIE_NAME, result.newRefreshToken, getCookieOptions());

  res.status(200).json({
    success: true,
    data: {
      accessToken: result.accessToken,
    },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  let sessionId = req.sessionId;

  // If not authenticated via bearer, try extracting sessionId from refresh token
  if (!sessionId) {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    if (token) {
      try {
        const payload = verifyRefreshToken(token);
        sessionId = payload.sessionId;
      } catch {
        // ignore malformed token on logout
      }
    }
  }

  if (sessionId) {
    await authService.logout(sessionId);
  }

  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
  });

  res.status(200).json({
    success: true,
    data: {
      message: 'Logged out successfully',
    },
  });
}

export async function logoutAll(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  await authService.logoutAll(req.user.id);

  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
  });

  res.status(200).json({
    success: true,
    data: {
      message: 'All sessions logged out successfully',
    },
  });
}

export async function getSessions(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const sessions = await sessionService.getUserSessions(req.user.id, req.sessionId);

  res.status(200).json({
    success: true,
    data: {
      sessions,
    },
  });
}

export async function deleteSession(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const rawSessionId = req.params['sessionId'];
  const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;
  if (!sessionId) {
    throw new UnauthorizedError('Session ID parameter is required');
  }

  await sessionService.revokeSession(req.user.id, sessionId);

  res.status(200).json({
    success: true,
    data: {
      message: 'Session revoked successfully',
    },
  });
}
