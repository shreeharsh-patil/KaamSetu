import {
  IWorkerProfileRepository,
  workerProfileRepository,
} from './worker-profile.repository.js';
import { IUserRepository, userRepository } from '../users/user.repository.js';
import {
  IServiceCategoryRepository,
  serviceCategoryRepository,
} from '../service-categories/service-category.repository.js';
import type {
  IWorkerProfileEntity,
  ICreateWorkerProfileInput,
  IUpdateWorkerProfileInput,
} from '@kaamsetu/types';
import { UserRole } from '@kaamsetu/types';
import { NotFoundError, ConflictError } from '../../errors/index.js';

export class WorkerProfileService {
  constructor(
    private readonly workerRepo: IWorkerProfileRepository = workerProfileRepository,
    private readonly userRepo: IUserRepository = userRepository,
    private readonly categoryRepo: IServiceCategoryRepository = serviceCategoryRepository
  ) {}

  async getProfileById(id: string): Promise<IWorkerProfileEntity> {
    const profile = await this.workerRepo.findById(id);
    if (!profile) {
      throw new NotFoundError(`Worker profile with ID ${id} not found`);
    }
    return profile;
  }

  async getProfileByUserId(userId: string): Promise<IWorkerProfileEntity> {
    const profile = await this.workerRepo.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError(`Worker profile for user ID ${userId} not found`);
    }
    return profile;
  }

  async findNearbyWorkers(
    longitude: number,
    latitude: number,
    radiusKm?: number,
    categoryId?: string
  ): Promise<IWorkerProfileEntity[]> {
    return this.workerRepo.findNearby(longitude, latitude, radiusKm, categoryId);
  }

  async createProfile(input: ICreateWorkerProfileInput): Promise<IWorkerProfileEntity> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      throw new NotFoundError(`User with ID ${input.userId} does not exist`);
    }

    const existingProfile = await this.workerRepo.findByUserId(input.userId);
    if (existingProfile) {
      throw new ConflictError(`Worker profile already exists for user ID ${input.userId}`);
    }

    const category = await this.categoryRepo.findById(input.primaryCategoryId);
    if (!category) {
      throw new NotFoundError(`Category with ID ${input.primaryCategoryId} does not exist`);
    }

    // Ensure user role is updated to WORKER if not already
    if (user.role !== UserRole.WORKER) {
      await this.userRepo.update(input.userId, { role: UserRole.WORKER });
    }

    return this.workerRepo.create(input);
  }

  async updateProfile(
    id: string,
    input: IUpdateWorkerProfileInput
  ): Promise<IWorkerProfileEntity> {
    await this.getProfileById(id);

    if (input.primaryCategoryId) {
      const category = await this.categoryRepo.findById(input.primaryCategoryId);
      if (!category) {
        throw new NotFoundError(`Category with ID ${input.primaryCategoryId} does not exist`);
      }
    }

    const updated = await this.workerRepo.update(id, input);
    if (!updated) {
      throw new NotFoundError(`Worker profile with ID ${id} not found`);
    }
    return updated;
  }

  async softDeleteProfile(id: string): Promise<void> {
    await this.getProfileById(id);
    await this.workerRepo.softDelete(id);
  }
}

export const workerProfileService = new WorkerProfileService();
