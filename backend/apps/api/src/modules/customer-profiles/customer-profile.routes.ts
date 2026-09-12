import { Router } from 'express';
import {
  getMyCustomerProfile,
  updateMyCustomerProfile,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
} from './customer-profile.controller.js';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { UserRole } from '@kaamsetu/types';

export const customerRoutes = Router();

customerRoutes.get('/me', authenticate(), requireRole(UserRole.CUSTOMER), asyncHandler(getMyCustomerProfile));
customerRoutes.patch('/me', authenticate(), requireRole(UserRole.CUSTOMER), asyncHandler(updateMyCustomerProfile));

customerRoutes.post(
  '/me/addresses',
  authenticate(),
  requireRole(UserRole.CUSTOMER),
  asyncHandler(addCustomerAddress)
);
customerRoutes.patch(
  '/me/addresses/:id',
  authenticate(),
  requireRole(UserRole.CUSTOMER),
  asyncHandler(updateCustomerAddress)
);
customerRoutes.delete(
  '/me/addresses/:id',
  authenticate(),
  requireRole(UserRole.CUSTOMER),
  asyncHandler(deleteCustomerAddress)
);
