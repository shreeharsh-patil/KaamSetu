import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { getMe } from './user.controller.js';

export const userRoutes = Router();
userRoutes.get('/me', authenticate(), asyncHandler(getMe));
