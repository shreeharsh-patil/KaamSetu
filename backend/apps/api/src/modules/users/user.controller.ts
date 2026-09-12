import type { Request, Response } from 'express';
import { UnauthorizedError } from '../../errors/index.js';
import { userService } from './user.service.js';

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError('Authentication required');
  const user = await userService.getUserById(req.user.id);
  res.status(200).json({ success: true, data: { user } });
}
