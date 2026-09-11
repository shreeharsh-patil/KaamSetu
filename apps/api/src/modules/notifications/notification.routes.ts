import { Router } from 'express';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './notification.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router: Router = Router();

router.get('/', authenticate(), asyncHandler(listNotifications));
router.patch('/:id/read', authenticate(), asyncHandler(markNotificationRead));
router.post('/read-all', authenticate(), asyncHandler(markAllNotificationsRead));

export const notificationRoutes: Router = router;
