import { Router } from 'express';
import {
  classifyJob,
  simplifyDescription,
  translateText,
  extractProfile,
  getAIStatus,
  explainMatches,
} from './ai.controller.js';
import { optionalAuth } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const aiRoutes = Router();

// AI endpoints (optionalAuth allows guest & authenticated users)
aiRoutes.post('/classify-job', optionalAuth(), asyncHandler(classifyJob));
aiRoutes.post('/simplify-description', optionalAuth(), asyncHandler(simplifyDescription));
aiRoutes.post('/translate', optionalAuth(), asyncHandler(translateText));
aiRoutes.post('/extract-profile', optionalAuth(), asyncHandler(extractProfile));
aiRoutes.post('/matching/best-match', optionalAuth(), asyncHandler(explainMatches));

// AI provider & circuit breaker health status
aiRoutes.get('/status', asyncHandler(getAIStatus));

