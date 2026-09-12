import 'express';
import type { IUserEntity } from '@kaamsetu/types';

declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: IUserEntity;
      sessionId?: string;
    }
  }
}
