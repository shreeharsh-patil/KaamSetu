import { Router } from 'express';
import { getHealth, getReady, getMetrics } from './health.controller.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';
import { UserRole } from '@kaamsetu/types';

const router: Router = Router();

router.get('/health', asyncHandler(getHealth));
router.get('/ready', asyncHandler(getReady));
router.get(
  '/metrics',
  authenticate(),
  requireRole(UserRole.ADMIN),
  asyncHandler(getMetrics)
);

export const healthRoutes: Router = router;
