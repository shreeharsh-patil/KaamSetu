import { Router } from 'express';
import { getHealth, getReady } from './health.controller.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router: Router = Router();

router.get('/health', asyncHandler(getHealth));
router.get('/ready', asyncHandler(getReady));

export const healthRoutes: Router = router;
