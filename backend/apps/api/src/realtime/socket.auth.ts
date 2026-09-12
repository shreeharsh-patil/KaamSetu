import type { Socket } from 'socket.io';
import { verifyAccessToken } from '../modules/auth/token.util.js';
import { sessionRepository, ISessionRepository } from '../modules/sessions/session.repository.js';
import { logger } from '../config/index.js';
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from './socket.types.js';

export type CustomSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

/**
 * Socket.IO handshake authentication middleware.
 * Verifies JWT access token and ensures the backing session is active.
 * Sets verified user data in `socket.data.user`. Never trusts client-reported identity.
 */
export function createSocketAuthMiddleware(sessionRepo: ISessionRepository = sessionRepository) {
  return async (socket: CustomSocket, next: (err?: Error) => void): Promise<void> => {
    try {
      // 1. Extract token from auth payload or handshake headers
      let token: string | undefined = socket.handshake.auth?.['token'] as string | undefined;

      if (!token && socket.handshake.headers.authorization) {
        const parts = socket.handshake.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }

      if (!token) {
        logger.warn({ socketId: socket.id }, 'Socket connection rejected: No authentication token provided');
        return next(new Error('Authentication failed: Missing token'));
      }

      // 2. Verify JWT signature, expiry, and claims
      const payload = verifyAccessToken(token);

      // 3. Verify session exists and is not revoked in DB
      const session = await sessionRepo.findById(payload.sessionId);
      if (!session) {
        logger.warn({ socketId: socket.id, sessionId: payload.sessionId }, 'Socket connection rejected: Session not found');
        return next(new Error('Authentication failed: Session not found'));
      }

      if (session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
        logger.warn({ socketId: socket.id, sessionId: payload.sessionId }, 'Socket connection rejected: Session expired or revoked');
        return next(new Error('Authentication failed: Session expired or revoked'));
      }

      // 4. Attach verified user payload to socket
      socket.data.user = {
        userId: payload.userId,
        role: payload.role,
        sessionId: payload.sessionId,
      };

      return next();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      logger.warn({ socketId: socket.id, err: message }, 'Socket handshake authentication error');
      return next(new Error(`Authentication failed: ${message}`));
    }
  };
}
