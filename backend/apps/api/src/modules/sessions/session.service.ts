import { ISessionRepository, sessionRepository } from './session.repository.js';
import type { ISessionEntity } from '@kaamsetu/types';
import { NotFoundError, ForbiddenError } from '../../errors/index.js';

export class SessionService {
  constructor(private readonly sessionRepo: ISessionRepository = sessionRepository) {}

  async getUserSessions(userId: string, currentSessionId?: string): Promise<ISessionEntity[]> {
    return this.sessionRepo.findActiveByUserId(userId, currentSessionId);
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenError('You do not have permission to revoke this session');
    }

    await this.sessionRepo.revoke(sessionId);
  }

  async revokeAllUserSessions(userId: string): Promise<number> {
    return this.sessionRepo.revokeAllForUser(userId);
  }
}

export const sessionService = new SessionService();
