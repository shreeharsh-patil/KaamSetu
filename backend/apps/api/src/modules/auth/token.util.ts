import jwt from 'jsonwebtoken';
import { createHash, randomUUID } from 'crypto';
import { env } from '../../config/index.js';
import type { TokenPayload } from '@kaamsetu/types';
import { UnauthorizedError } from '../../errors/index.js';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'kaamsetu-api',
    jwtid: randomUUID(),
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: 'kaamsetu-api',
    }) as TokenPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Access token has expired');
    }
    throw new UnauthorizedError('Invalid access token');
  }
}

export function signRefreshToken(payload: {
  userId: string;
  sessionId: string;
  familyId: string;
}): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'kaamsetu-api',
    jwtid: randomUUID(),
  });
}

export function verifyRefreshToken(token: string): {
  userId: string;
  sessionId: string;
  familyId: string;
} {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'kaamsetu-api',
    }) as { userId: string; sessionId: string; familyId: string };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Refresh token has expired');
    }
    throw new UnauthorizedError('Invalid refresh token');
  }
}
