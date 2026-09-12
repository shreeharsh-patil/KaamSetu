import {
  ICustomerProfileRepository,
  customerProfileRepository,
} from './customer-profile.repository.js';
import { IUserRepository, userRepository } from '../users/user.repository.js';
import type {
  ICustomerProfileEntity,
  ICreateCustomerProfileInput,
  IUpdateCustomerProfileInput,
  ICustomerAddress,
} from '@kaamsetu/types';
import { NotFoundError, ConflictError } from '../../errors/index.js';

export class CustomerProfileService {
  constructor(
    private readonly customerRepo: ICustomerProfileRepository = customerProfileRepository,
    private readonly userRepo: IUserRepository = userRepository
  ) {}

  async getOrCreateMyProfile(userId: string): Promise<ICustomerProfileEntity> {
    let profile = await this.customerRepo.findByUserId(userId);
    if (!profile) {
      const user = await this.userRepo.findById(userId);
      if (!user) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      profile = await this.customerRepo.create({
        userId,
        displayName: 'Customer',
        savedAddresses: [],
      });
    }
    return profile;
  }

  async getMyProfile(userId: string): Promise<ICustomerProfileEntity> {
    return this.getOrCreateMyProfile(userId);
  }

  async updateMyProfile(
    userId: string,
    input: { displayName?: string; fullName?: string }
  ): Promise<ICustomerProfileEntity> {
    await this.getOrCreateMyProfile(userId);

    const updateData: IUpdateCustomerProfileInput = {};
    if (input.displayName) updateData.displayName = input.displayName;
    if (input.fullName) updateData.displayName = input.fullName;

    const updated = await this.customerRepo.updateByUserId(userId, updateData);
    if (!updated) {
      throw new NotFoundError('Customer profile not found');
    }
    return updated;
  }

  async addAddress(
    userId: string,
    address: Omit<ICustomerAddress, 'id'>
  ): Promise<ICustomerProfileEntity> {
    await this.getOrCreateMyProfile(userId);

    const updated = await this.customerRepo.addAddress(userId, address);
    if (!updated) {
      throw new NotFoundError('Customer profile not found');
    }
    return updated;
  }

  async updateAddress(
    userId: string,
    addressId: string,
    addressData: Partial<Omit<ICustomerAddress, 'id'>>
  ): Promise<ICustomerProfileEntity> {
    await this.getOrCreateMyProfile(userId);

    const updated = await this.customerRepo.updateAddress(userId, addressId, addressData);
    if (!updated) {
      throw new NotFoundError(`Address with ID ${addressId} not found for this user`);
    }
    return updated;
  }

  async deleteAddress(userId: string, addressId: string): Promise<ICustomerProfileEntity> {
    await this.getOrCreateMyProfile(userId);

    const updated = await this.customerRepo.deleteAddress(userId, addressId);
    if (!updated) {
      throw new NotFoundError(`Address with ID ${addressId} not found for this user`);
    }
    return updated;
  }

  // --- Legacy Phase 1 methods for backwards compatibility ---

  async getProfileById(id: string): Promise<ICustomerProfileEntity> {
    const profile = await this.customerRepo.findById(id);
    if (!profile) {
      throw new NotFoundError(`Customer profile with ID ${id} not found`);
    }
    return profile;
  }

  async getProfileByUserId(userId: string): Promise<ICustomerProfileEntity> {
    const profile = await this.customerRepo.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError(`Customer profile for user ID ${userId} not found`);
    }
    return profile;
  }

  async createProfile(input: ICreateCustomerProfileInput): Promise<ICustomerProfileEntity> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      throw new NotFoundError(`User with ID ${input.userId} does not exist`);
    }

    const existingProfile = await this.customerRepo.findByUserId(input.userId);
    if (existingProfile) {
      throw new ConflictError(`Customer profile already exists for user ID ${input.userId}`);
    }

    return this.customerRepo.create(input);
  }

  async updateProfile(
    id: string,
    input: IUpdateCustomerProfileInput
  ): Promise<ICustomerProfileEntity> {
    await this.getProfileById(id);

    const updated = await this.customerRepo.update(id, input);
    if (!updated) {
      throw new NotFoundError(`Customer profile with ID ${id} not found`);
    }
    return updated;
  }

  async softDeleteProfile(id: string): Promise<void> {
    await this.getProfileById(id);
    await this.customerRepo.softDelete(id);
  }
}

export const customerProfileService = new CustomerProfileService();

