import { Router } from 'express';
import {
  requestOtp,
  verifyOtp,
  refresh,
  logout,
  logoutAll,
  getSessions,
  deleteSession,
} from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router: Router = Router();

router.post('/request-otp', asyncHandler(requestOtp));
router.post('/verify-otp', asyncHandler(verifyOtp));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));
router.post('/logout-all', authenticate(), asyncHandler(logoutAll));
router.get('/sessions', authenticate(), asyncHandler(getSessions));
router.delete('/sessions/:sessionId', authenticate(), asyncHandler(deleteSession));

export const authRoutes: Router = router;
