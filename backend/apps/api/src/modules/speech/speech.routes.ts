import { Router } from 'express';
import {
  transcribeAudio,
  synthesizeSpeech,
  detectLanguage,
  getSpeechStatus,
} from './speech.controller.js';
import { optionalAuth } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const speechRoutes = Router();

// Speech processing endpoints (optionalAuth allows guest voice interactions)
speechRoutes.post('/transcribe', optionalAuth(), asyncHandler(transcribeAudio));
speechRoutes.post('/synthesize', optionalAuth(), asyncHandler(synthesizeSpeech));
speechRoutes.post('/detect-language', optionalAuth(), asyncHandler(detectLanguage));

// Speech status
speechRoutes.get('/status', asyncHandler(getSpeechStatus));
