import { Router } from 'express';
import { listConversations, getConversation } from './conversation.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router: Router = Router();

// GET /api/v1/conversations — conversations the user participates in
router.get('/', authenticate(), asyncHandler(listConversations));

// GET /api/v1/conversations/:id
router.get('/:id', authenticate(), asyncHandler(getConversation));

export const conversationRoutes: Router = router;
