import { Router } from 'express';
import {
  classifyJob,
  simplifyDescription,
  translateText,
  extractProfile,
  getAIStatus,
} from './ai.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const aiRoutes = Router();

// AI endpoints (authenticated)
aiRoutes.post('/classify-job', authenticate(), asyncHandler(classifyJob));
aiRoutes.post('/simplify-description', authenticate(), asyncHandler(simplifyDescription));
aiRoutes.post('/translate', authenticate(), asyncHandler(translateText));
aiRoutes.post('/extract-profile', authenticate(), asyncHandler(extractProfile));

// AI provider & circuit breaker health status
aiRoutes.get('/status', asyncHandler(getAIStatus));
