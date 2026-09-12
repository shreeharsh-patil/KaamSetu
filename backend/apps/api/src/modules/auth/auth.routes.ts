import { Router } from 'express';
import {
  requestOtp,
  verifyOtp,
  signupRequestOtp,
  signupVerifyOtp,
  completeProfile,
  refresh,
  logout,
  logoutAll,
  getSessions,
  deleteSession,
} from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authRateLimiter } from '../../middlewares/rate-limiter.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router: Router = Router();

router.post('/request-otp', authRateLimiter, asyncHandler(requestOtp));
router.post('/verify-otp', authRateLimiter, asyncHandler(verifyOtp));
router.post('/signup/request-otp', authRateLimiter, asyncHandler(signupRequestOtp));
router.post('/signup/verify-otp', authRateLimiter, asyncHandler(signupVerifyOtp));
router.post('/complete-profile', authenticate(), asyncHandler(completeProfile));
router.post('/refresh', authRateLimiter, asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));
router.post('/logout-all', authenticate(), asyncHandler(logoutAll));
router.get('/sessions', authenticate(), asyncHandler(getSessions));
router.delete('/sessions/:sessionId', authenticate(), asyncHandler(deleteSession));

export const authRoutes: Router = router;
