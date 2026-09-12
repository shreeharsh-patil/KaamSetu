import { Router } from 'express';
import { getHealth, getReady, getMetrics } from './health.controller.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router: Router = Router();

router.get('/health', asyncHandler(getHealth));
router.get('/ready', asyncHandler(getReady));
router.get('/metrics', asyncHandler(getMetrics));

export const healthRoutes: Router = router;
