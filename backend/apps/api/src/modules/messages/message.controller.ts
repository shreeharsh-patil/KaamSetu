import { Request, Response } from 'express';
import { messageService } from './message.service.js';
import { BadRequestError, UnauthorizedError } from '../../errors/index.js';
import { createMessageSchema, listMessagesQuerySchema } from '@kaamsetu/validation';
import { UserRole } from '@kaamsetu/types';

function requireUser(req: Request): { id: string; role: UserRole } {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  return { id: req.user.id, role: req.user.role };
}

/** GET /api/v1/conversations/:id/messages */
export async function getMessages(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const rawId = req.params['id'];
  const conversationId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!conversationId) {
    throw new BadRequestError('Conversation ID is required');
  }

  const query = listMessagesQuerySchema.parse(req.query);
  const result = await messageService.getMessages(
    conversationId,
    user,
    query.cursor,
    query.limit
  );

  res.status(200).json({
    success: true,
    data: {
      messages: result.items,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    },
  });
}

/** POST /api/v1/conversations/:id/messages */
export async function sendMessage(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const rawId = req.params['id'];
  const conversationId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!conversationId) {
    throw new BadRequestError('Conversation ID is required');
  }

  const input = createMessageSchema.parse(req.body);
  const message = await messageService.sendMessage(conversationId, user, input);

  res.status(201).json({ success: true, data: { message } });
}

/** POST /api/v1/conversations/:id/read */
export async function markAsRead(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const rawId = req.params['id'];
  const conversationId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!conversationId) {
    throw new BadRequestError('Conversation ID is required');
  }

  const result = await messageService.markAsRead(conversationId, user);
  res.status(200).json({ success: true, data: result });
}
