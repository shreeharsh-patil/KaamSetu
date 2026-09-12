import {
  IWorkerProfileRepository,
  workerProfileRepository,
} from './worker-profile.repository.js';
import { IUserRepository, userRepository } from '../users/user.repository.js';
import {
  IServiceCategoryRepository,
  serviceCategoryRepository,
} from '../service-categories/service-category.repository.js';
import { ISkillRepository, skillRepository } from '../skills/skill.repository.js';
import {
  IWorkerProfileEntity,
  ICreateWorkerProfileInput,
  IUpdateWorkerProfileInput,
  IPublicWorkerProfile,
  WorkerAvailability,
  SkillLevel,
  UserRole,
} from '@kaamsetu/types';
import { NotFoundError, ConflictError, BadRequestError } from '../../errors/index.js';

export class WorkerProfileService {
  constructor(
    private readonly workerRepo: IWorkerProfileRepository = workerProfileRepository,
    private readonly userRepo: IUserRepository = userRepository,
    private readonly categoryRepo: IServiceCategoryRepository = serviceCategoryRepository,
    private readonly skillRepo: ISkillRepository = skillRepository
  ) {}

  private async populateSkillNames(profile: IWorkerProfileEntity): Promise<IWorkerProfileEntity> {
    if (!profile.skills || profile.skills.length === 0) return profile;

    const populatedSkills = await Promise.all(
      profile.skills.map(async (s) => {
        const skillDoc = await this.skillRepo.findById(s.skillId);
        return {
          ...s,
          skillName: skillDoc?.name || undefined,
        };
      })
    );

    return {
      ...profile,
      skills: populatedSkills,
    };
  }

  async getOrCreateMyProfile(userId: string): Promise<IWorkerProfileEntity> {
    let profile = await this.workerRepo.findByUserId(userId);
    if (!profile) {
      const user = await this.userRepo.findById(userId);
      if (!user) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      profile = await this.workerRepo.create({
        userId,
        displayName: 'Skilled Worker',
        serviceLocation: {
          type: 'Point',
          coordinates: [73.8567, 18.5204],
        },
        serviceRadiusKm: 15,
        availabilityStatus: WorkerAvailability.AVAILABLE,
      });
    }

    return this.populateSkillNames(profile);
  }

  async getMyProfile(userId: string): Promise<IWorkerProfileEntity> {
    return this.getOrCreateMyProfile(userId);
  }

  async updateMyProfile(
    userId: string,
    input: {
      displayName?: string;
      fullName?: string;
      bio?: string | null;
      languages?: string[];
      pricing?: IWorkerProfileEntity['pricing'];
      hourlyRate?: number | null;
      portfolio?: IWorkerProfileEntity['portfolio'];
    }
  ): Promise<IWorkerProfileEntity> {
    // Ensure profile exists first
    await this.getOrCreateMyProfile(userId);

    // Strictly whitelist editable fields to prevent workers from self-modifying verificationStatus, rating, stats
    const sanitizedUpdate: IUpdateWorkerProfileInput = {
      ...(input.displayName !== undefined && { displayName: input.displayName }),
      ...(input.fullName !== undefined && { displayName: input.fullName }),
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.languages !== undefined && { languages: input.languages }),
      ...(input.pricing !== undefined && { pricing: input.pricing }),
      ...(input.hourlyRate !== undefined && { hourlyRate: input.hourlyRate }),
      ...(input.portfolio !== undefined && { portfolio: input.portfolio }),
    };

    const updated = await this.workerRepo.updateByUserId(userId, sanitizedUpdate);
    if (!updated) {
      throw new NotFoundError('Worker profile not found');
    }

    return this.populateSkillNames(updated);
  }

  async updateLocation(
    userId: string,
    coordinates: [number, number]
  ): Promise<IWorkerProfileEntity> {
    await this.getOrCreateMyProfile(userId);
    const updated = await this.workerRepo.updateLocation(userId, coordinates);
    if (!updated) {
      throw new NotFoundError('Worker profile not found');
    }
    return this.populateSkillNames(updated);
  }

  async updateAvailability(
    userId: string,
    availabilityStatus: WorkerAvailability
  ): Promise<IWorkerProfileEntity> {
    await this.getOrCreateMyProfile(userId);
    const updated = await this.workerRepo.updateAvailability(userId, availabilityStatus);
    if (!updated) {
      throw new NotFoundError('Worker profile not found');
    }
    return this.populateSkillNames(updated);
  }

  async updateServiceRadius(
    userId: string,
    radiusKm: number
  ): Promise<IWorkerProfileEntity> {
    await this.getOrCreateMyProfile(userId);
    const updated = await this.workerRepo.updateServiceRadius(userId, radiusKm);
    if (!updated) {
      throw new NotFoundError('Worker profile not found');
    }
    return this.populateSkillNames(updated);
  }

  async addSkill(
    userId: string,
    input: {
      skillId: string;
      experienceYears: number;
      level: SkillLevel;
    }
  ): Promise<IWorkerProfileEntity> {
    await this.getOrCreateMyProfile(userId);

    // Validate that the skill exists and is active!
    const skill = await this.skillRepo.findById(input.skillId);
    if (!skill || !skill.active || skill.deletedAt) {
      throw new BadRequestError('Skill does not exist or is currently inactive');
    }

    const updated = await this.workerRepo.addSkill(userId, {
      skillId: input.skillId,
      experienceYears: input.experienceYears,
      level: input.level,
      verified: false, // newly added skills must undergo admin verification
    });

    if (!updated) {
      throw new NotFoundError('Worker profile not found');
    }

    return this.populateSkillNames(updated);
  }

  async removeSkill(userId: string, skillId: string): Promise<IWorkerProfileEntity> {
    await this.getOrCreateMyProfile(userId);
    const updated = await this.workerRepo.removeSkill(userId, skillId);
    if (!updated) {
      throw new NotFoundError('Worker profile not found');
    }
    return this.populateSkillNames(updated);
  }

  async getPublicProfile(workerId: string): Promise<IPublicWorkerProfile> {
    const profile = await this.workerRepo.findById(workerId);
    if (!profile) {
      throw new NotFoundError(`Worker with ID ${workerId} not found`);
    }

    const populated = await this.populateSkillNames(profile);

    // Sanitized public profile: no internal/private user details
    return {
      id: populated.id,
      displayName: populated.displayName,
      bio: populated.bio ?? null,
      skills: populated.skills.map((s) => ({
        skillId: s.skillId,
        skillName: s.skillName,
        experienceYears: s.experienceYears,
        level: s.level,
        verified: s.verified,
      })),
      languages: populated.languages,
      serviceLocation: populated.serviceLocation,
      serviceRadiusKm: populated.serviceRadiusKm,
      availabilityStatus: populated.availabilityStatus,
      pricing: populated.pricing,
      portfolio: populated.portfolio,
      rating: populated.rating,
      stats: {
        completedJobs: populated.stats.completedJobs,
      },
      verificationStatus: populated.verificationStatus,
      createdAt: populated.createdAt,
    };
  }

  // --- Legacy Phase 1 methods for backwards compatibility ---

  async getProfileById(id: string): Promise<IWorkerProfileEntity> {
    const profile = await this.workerRepo.findById(id);
    if (!profile) {
      throw new NotFoundError(`Worker profile with ID ${id} not found`);
    }
    return this.populateSkillNames(profile);
  }

  async getProfileByUserId(userId: string): Promise<IWorkerProfileEntity> {
    const profile = await this.workerRepo.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError(`Worker profile for user ID ${userId} not found`);
    }
    return this.populateSkillNames(profile);
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

    if (input.primaryCategoryId) {
      const category = await this.categoryRepo.findById(input.primaryCategoryId);
      if (!category) {
        throw new NotFoundError(`Category with ID ${input.primaryCategoryId} does not exist`);
      }
    }

    if (user.role !== UserRole.WORKER) {
      await this.userRepo.update(input.userId, { role: UserRole.WORKER });
    }

    const created = await this.workerRepo.create(input);
    return this.populateSkillNames(created);
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
    return this.populateSkillNames(updated);
  }

  async softDeleteProfile(id: string): Promise<void> {
    await this.getProfileById(id);
    await this.workerRepo.softDelete(id);
  }
}

export const workerProfileService = new WorkerProfileService();

