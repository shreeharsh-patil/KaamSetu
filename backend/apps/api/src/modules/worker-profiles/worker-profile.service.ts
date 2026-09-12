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
  UserStatus,
  type IWorkerEnrollmentInput,
} from '@kaamsetu/types';
import { NotFoundError, ConflictError, BadRequestError } from '../../errors/index.js';
import { withTransaction } from '../../database/transaction.js';

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
        // Omit displayName so the repository fallback ('Skilled Worker') applies,
        // keeping the default consistent with direct profile creation.
        serviceRadiusKm: 15,
        availabilityStatus: WorkerAvailability.OFFLINE,
        onboardingComplete: false,
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
    const profile = await this.getOrCreateMyProfile(userId);
    if (availabilityStatus === WorkerAvailability.AVAILABLE && !this.isMatchingReady(profile)) {
      throw new ConflictError('Complete onboarding and confirm a real service location before going available');
    }
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
    // Public worker URLs can originate from worker search (profile document ID)
    // or an assigned job (worker user ID). Resolve both identifiers so a
    // completed booking always opens the professional that performed it.
    const profile =
      (await this.workerRepo.findById(workerId)) ??
      (await this.workerRepo.findByUserId(workerId));
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
      serviceArea: {
        city: populated.serviceArea?.city ?? null,
        pincode: populated.serviceArea?.pincode ?? null,
        radiusKm: populated.serviceRadiusKm,
      },
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

  private isMatchingReady(profile: IWorkerProfileEntity): boolean {
    return Boolean(
      profile.onboardingComplete &&
        profile.primaryCategoryId &&
        profile.skills.length > 0 &&
        profile.serviceLocation?.coordinates &&
        profile.serviceLocation.coordinates.length === 2
    );
  }

  /** Controlled CUSTOMER -> WORKER transition. Never accepts a role from the client. */
  async enroll(userId: string, input: IWorkerEnrollmentInput): Promise<{
    user: Awaited<ReturnType<IUserRepository['findById']>>;
    profile: IWorkerProfileEntity;
  }> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    if (user.status !== UserStatus.ACTIVE) {
      throw new ConflictError('Only active accounts can enroll as workers');
    }
    if (user.role !== UserRole.CUSTOMER && user.role !== UserRole.WORKER) {
      throw new ConflictError('Staff accounts cannot enroll through the worker workflow');
    }

    const [category, skills] = await Promise.all([
      this.categoryRepo.findById(input.primaryCategoryId),
      this.skillRepo.findByIds(input.skills.map((skill) => skill.skillId)),
    ]);
    if (!category || !category.active || category.deletedAt) {
      throw new BadRequestError('Category does not exist or is inactive');
    }
    if (skills.length !== input.skills.length) {
      throw new BadRequestError('One or more skills do not exist');
    }
    if (skills.some((skill) => !skill.active || skill.deletedAt || skill.categoryId !== input.primaryCategoryId)) {
      throw new BadRequestError('Skills must be active and belong to the selected category');
    }

    return withTransaction(async (session) => {
      const profileInput: IUpdateWorkerProfileInput = {
        displayName: input.displayName,
        bio: input.bio ?? null,
        primaryCategoryId: input.primaryCategoryId,
        skills: input.skills.map((skill) => ({ ...skill, verified: false })),
        languages: input.languages,
        serviceLocation: input.serviceLocation,
        serviceArea: {
          type: 'Point',
          coordinates: input.serviceLocation.coordinates,
          radiusKm: input.serviceRadiusKm,
          city: input.serviceArea.city,
          pincode: input.serviceArea.pincode,
        },
        serviceRadiusKm: input.serviceRadiusKm,
        pricing: input.pricing,
        onboardingComplete: true,
        availabilityStatus: input.availabilityStatus,
      };

      const existing = await this.workerRepo.findByUserId(userId);
      const profile = existing
        ? await this.workerRepo.updateByUserId(userId, profileInput, session)
        : await this.workerRepo.create({
            userId,
            displayName: input.displayName,
            bio: input.bio ?? null,
            primaryCategoryId: input.primaryCategoryId,
            skills: input.skills.map((skill) => ({ ...skill, verified: false })),
            languages: input.languages,
            serviceLocation: input.serviceLocation,
            serviceArea: {
              type: 'Point',
              coordinates: input.serviceLocation.coordinates,
              radiusKm: input.serviceRadiusKm,
              city: input.serviceArea.city,
              pincode: input.serviceArea.pincode,
            },
            serviceRadiusKm: input.serviceRadiusKm,
            pricing: input.pricing,
            onboardingComplete: true,
            availabilityStatus: input.availabilityStatus,
          }, session);
      if (!profile) throw new NotFoundError('Worker profile could not be saved');

      const updatedUser = await this.userRepo.update(userId, { role: UserRole.WORKER }, session);
      if (!updatedUser) throw new NotFoundError('User role could not be updated');

      return { user: updatedUser, profile: await this.populateSkillNames(profile) };
    });
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

