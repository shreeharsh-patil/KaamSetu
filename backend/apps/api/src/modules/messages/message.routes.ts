import { Router } from 'express';
import {
  getMessages,
  sendMessage,
  markAsRead,
} from './message.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router: Router = Router();

// GET /api/v1/conversations/:id/messages
router.get('/:id/messages', authenticate(), asyncHandler(getMessages));

// POST /api/v1/conversations/:id/messages
router.post('/:id/messages', authenticate(), asyncHandler(sendMessage));

// POST or PATCH /api/v1/conversations/:id/read
router.post('/:id/read', authenticate(), asyncHandler(markAsRead));
router.patch('/:id/read', authenticate(), asyncHandler(markAsRead));

export const messageRoutes: Router = router;
