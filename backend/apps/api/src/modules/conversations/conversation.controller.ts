import { Request, Response } from 'express';
import { conversationService } from './conversation.service.js';
import { BadRequestError, UnauthorizedError } from '../../errors/index.js';
import { UserRole } from '@kaamsetu/types';

function requireUser(req: Request): { id: string; role: UserRole } {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  return { id: req.user.id, role: req.user.role };
}

/** GET /api/v1/conversations */
export async function listConversations(req: Request, res: Response): Promise<void> {
  const actor = requireUser(req);

  const conversations = await conversationService.listConversationsForUser(actor);
  res.status(200).json({ success: true, data: { conversations } });
}

/** GET /api/v1/jobs/:jobId/conversation */
export async function getJobConversation(req: Request, res: Response): Promise<void> {
  const actor = requireUser(req);
  const rawJobId = req.params['jobId'];
  const jobId = Array.isArray(rawJobId) ? rawJobId[0] : rawJobId;

  if (!jobId) {
    throw new BadRequestError('Job ID is required');
  }

  const conversation = await conversationService.getConversationForJob(jobId, actor);
  res.status(200).json({ success: true, data: { conversation } });
}

/** GET /api/v1/conversations/:id */
export async function getConversation(req: Request, res: Response): Promise<void> {
  const actor = requireUser(req);
  const rawId = req.params['id'];
  const conversationId = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!conversationId) {
    throw new BadRequestError('Conversation ID is required');
  }

  const conversation = await conversationService.getConversationSummary(conversationId, actor);
  res.status(200).json({ success: true, data: { conversation } });
}
