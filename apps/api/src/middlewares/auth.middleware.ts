import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyAccessToken } from '../modules/auth/token.util.js';
import { userRepository } from '../modules/users/user.repository.js';
import { sessionRepository } from '../modules/sessions/session.repository.js';
import { UserRole, UserStatus } from '@kaamsetu/types';
import { UnauthorizedError, ForbiddenError } from '../errors/index.js';

export function authenticate(): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Authentication required. Missing or malformed Bearer token.'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new UnauthorizedError('Authentication required. Missing token.'));
    }

    try {
      // 1. Verify cryptographic signature & expiration
      const payload = verifyAccessToken(token);

      // 2. Verify Session exists and is not revoked
      const session = await sessionRepository.findById(payload.sessionId);
      if (!session || session.revokedAt !== null || session.expiresAt <= new Date()) {
        return next(new UnauthorizedError('Session has been revoked or expired. Please log in again.'));
      }

      // 3. Verify User exists and is not suspended
      const user = await userRepository.findById(payload.userId);
      if (!user || user.deletedAt !== null) {
        return next(new UnauthorizedError('User account no longer exists.'));
      }

      if (user.status === UserStatus.SUSPENDED) {
        return next(new ForbiddenError('Your account has been suspended. Please contact customer support.'));
      }

      // 4. Attach to Request context
      req.user = user;
      req.sessionId = session.id;

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Forbidden. Requires one of roles: [${roles.join(', ')}], current role is: ${req.user.role}`
        )
      );
    }

    next();
  };
}

export function optionalAuth(): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }

    try {
      const payload = verifyAccessToken(token);
      const session = await sessionRepository.findById(payload.sessionId);
      if (session && session.revokedAt === null && session.expiresAt > new Date()) {
        const user = await userRepository.findById(payload.userId);
        if (user && user.status !== UserStatus.SUSPENDED && !user.deletedAt) {
          req.user = user;
          req.sessionId = session.id;
        }
      }
    } catch {
      // Intentionally ignore token errors for optional authentication
    }

    next();
  };
}
