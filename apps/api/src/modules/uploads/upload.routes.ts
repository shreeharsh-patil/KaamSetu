import { Router } from 'express';
import {
  presignUpload,
  completeUpload,
  deleteUpload,
  getDownloadUrl,
  getUploadById,
} from './upload.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { uploadRateLimiter } from '../../middlewares/rate-limiter.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const uploadRoutes = Router();

// Request presigned upload URL (Phase 10)
uploadRoutes.post('/presign', authenticate(), uploadRateLimiter, asyncHandler(presignUpload));

// Confirm direct upload completion (Phase 10)
uploadRoutes.post('/complete', authenticate(), asyncHandler(completeUpload));

// Generate secure signed download URL for private documents (Phase 10)
uploadRoutes.get('/:id/download-url', authenticate(), asyncHandler(getDownloadUrl));

// Retrieve upload metadata (Phase 10)
uploadRoutes.get('/:id', authenticate(), asyncHandler(getUploadById));

// Delete uploaded file and record (Phase 10)
uploadRoutes.delete('/:id', authenticate(), asyncHandler(deleteUpload));
