import { Router } from 'express';
import { getJobConversation, listConversations } from './conversation.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router: Router = Router();

// GET /api/v1/conversations — conversations the user participates in
router.get('/', authenticate(), asyncHandler(listConversations));

// GET /api/v1/jobs/:jobId/conversation
router.get(
  '/jobs/:jobId/conversation',
  authenticate(),
  asyncHandler(getJobConversation)
);

export const conversationRoutes: Router = router;
