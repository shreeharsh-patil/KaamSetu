import { Request, Response } from 'express';
import { notificationService } from './notification.service.js';
import { BadRequestError, UnauthorizedError } from '../../errors/index.js';
import { UserRole } from '@kaamsetu/types';

function requireUser(req: Request): { id: string; role: UserRole } {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  return { id: req.user.id, role: req.user.role };
}

export async function listNotifications(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const limit = req.query['limit'] ? Number(req.query['limit']) : 20;

  const notifications = await notificationService.getUserNotifications(user.id, limit);
  res.status(200).json({ success: true, data: { notifications } });
}

export async function markNotificationRead(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const rawId = req.params['id'];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) {
    throw new BadRequestError('Notification ID is required');
  }

  const notification = await notificationService.markAsRead(id, user.id);
  res.status(200).json({ success: true, data: { notification } });
}

export async function markAllNotificationsRead(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const result = await notificationService.markAllAsRead(user.id);
  res.status(200).json({ success: true, data: result });
}
