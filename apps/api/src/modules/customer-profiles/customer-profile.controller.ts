import { Request, Response } from 'express';
import { customerProfileService } from './customer-profile.service.js';
import {
  patchCustomerMeSchema,
  addCustomerAddressSchema,
  updateCustomerAddressSchema,
} from '@kaamsetu/validation';
import { UnauthorizedError, BadRequestError } from '../../errors/index.js';

export async function getMyCustomerProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const profile = await customerProfileService.getMyProfile(req.user.id);

  res.status(200).json({
    success: true,
    data: profile,
  });
}

export async function updateMyCustomerProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const validatedData = patchCustomerMeSchema.parse(req.body);
  const updated = await customerProfileService.updateMyProfile(req.user.id, validatedData);

  res.status(200).json({
    success: true,
    data: updated,
  });
}

export async function addCustomerAddress(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const validatedAddress = addCustomerAddressSchema.parse(req.body);
  const updated = await customerProfileService.addAddress(req.user.id, validatedAddress);

  res.status(201).json({
    success: true,
    data: updated,
  });
}

export async function updateCustomerAddress(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const rawAddressId = req.params['id'];
  const addressId = Array.isArray(rawAddressId) ? rawAddressId[0] : rawAddressId;
  if (!addressId) {
    throw new BadRequestError('Address ID parameter is required');
  }

  const validatedData = updateCustomerAddressSchema.parse(req.body);
  const updated = await customerProfileService.updateAddress(req.user.id, addressId, validatedData);

  res.status(200).json({
    success: true,
    data: updated,
  });
}

export async function deleteCustomerAddress(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const rawAddressId = req.params['id'];
  const addressId = Array.isArray(rawAddressId) ? rawAddressId[0] : rawAddressId;
  if (!addressId) {
    throw new BadRequestError('Address ID parameter is required');
  }

  const updated = await customerProfileService.deleteAddress(req.user.id, addressId);

  res.status(200).json({
    success: true,
    data: updated,
  });
}
