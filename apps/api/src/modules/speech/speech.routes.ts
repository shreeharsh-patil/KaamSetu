import { Router } from 'express';
import {
  transcribeAudio,
  synthesizeSpeech,
  detectLanguage,
  getSpeechStatus,
} from './speech.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const speechRoutes = Router();

// Speech processing endpoints (authenticated)
speechRoutes.post('/transcribe', authenticate(), asyncHandler(transcribeAudio));
speechRoutes.post('/synthesize', authenticate(), asyncHandler(synthesizeSpeech));
speechRoutes.post('/detect-language', authenticate(), asyncHandler(detectLanguage));

// Speech status
speechRoutes.get('/status', asyncHandler(getSpeechStatus));
