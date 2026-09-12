import { ClientSession, Types } from 'mongoose';
import {
  WorkerProfileModel,
  mapWorkerDocumentToEntity,
  IWorkerProfileDocument,
} from './worker-profile.model.js';
import {
  IWorkerProfileEntity,
  ICreateWorkerProfileInput,
  IUpdateWorkerProfileInput,
  IWorkerSkillItem,
  WorkerAvailability,
  WorkerVerificationStatus,
} from '@kaamsetu/types';

export interface IWorkerProfileRepository {
  findById(id: string, includeDeleted?: boolean): Promise<IWorkerProfileEntity | null>;
  findByUserId(userId: string, includeDeleted?: boolean): Promise<IWorkerProfileEntity | null>;
  findNearby(
    longitude: number,
    latitude: number,
    maxDistanceKm?: number,
    categoryId?: string
  ): Promise<IWorkerProfileEntity[]>;
  create(data: ICreateWorkerProfileInput, session?: ClientSession | null): Promise<IWorkerProfileEntity>;
  update(
    id: string,
    data: IUpdateWorkerProfileInput,
    session?: ClientSession | null
  ): Promise<IWorkerProfileEntity | null>;
  updateByUserId(
    userId: string,
    data: IUpdateWorkerProfileInput,
    session?: ClientSession | null
  ): Promise<IWorkerProfileEntity | null>;
  addSkill(userId: string, skill: IWorkerSkillItem): Promise<IWorkerProfileEntity | null>;
  removeSkill(userId: string, skillId: string): Promise<IWorkerProfileEntity | null>;
  updateLocation(userId: string, coordinates: [number, number]): Promise<IWorkerProfileEntity | null>;
  updateAvailability(
    userId: string,
    availabilityStatus: WorkerAvailability
  ): Promise<IWorkerProfileEntity | null>;
  updateServiceRadius(userId: string, radiusKm: number): Promise<IWorkerProfileEntity | null>;
  softDelete(id: string, session?: ClientSession | null): Promise<boolean>;
}

export class WorkerProfileRepository implements IWorkerProfileRepository {
  async findById(id: string, includeDeleted = false): Promise<IWorkerProfileEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const query: Record<string, unknown> = { _id: id };
    if (!includeDeleted) {
      query['deletedAt'] = null;
    }

    const doc = await WorkerProfileModel.findOne(query).exec();
    return doc ? mapWorkerDocumentToEntity(doc) : null;
  }

  async findByUserId(userId: string, includeDeleted = false): Promise<IWorkerProfileEntity | null> {
    if (!Types.ObjectId.isValid(userId)) return null;

    const query: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
    if (!includeDeleted) {
      query['deletedAt'] = null;
    }

    const doc = await WorkerProfileModel.findOne(query).exec();
    return doc ? mapWorkerDocumentToEntity(doc) : null;
  }

  async findNearby(
    longitude: number,
    latitude: number,
    maxDistanceKm = 25,
    categoryId?: string
  ): Promise<IWorkerProfileEntity[]> {
    const maxDistanceMeters = maxDistanceKm * 1000;

    const query: Record<string, unknown> = {
      deletedAt: null,
      availabilityStatus: WorkerAvailability.AVAILABLE,
      onboardingComplete: true,
      primaryCategoryId: { $exists: true },
      'skills.0': { $exists: true },
      'serviceLocation.coordinates.1': { $exists: true },
      serviceLocation: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistanceMeters,
        },
      },
    };

    if (categoryId && Types.ObjectId.isValid(categoryId)) {
      query['primaryCategoryId'] = new Types.ObjectId(categoryId);
    }

    const docs = await WorkerProfileModel.find(query).limit(50).exec();
    return docs.map(mapWorkerDocumentToEntity);
  }

  async create(
    data: ICreateWorkerProfileInput,
    session?: ClientSession | null
  ): Promise<IWorkerProfileEntity> {
    const displayName = data.displayName || data.fullName || 'Skilled Worker';
    const coordinates = data.serviceLocation?.coordinates || data.serviceArea?.coordinates;
    const radiusKm = data.serviceRadiusKm ?? data.serviceArea?.radiusKm ?? 15;

    const docData: Partial<IWorkerProfileDocument> = {
      userId: new Types.ObjectId(data.userId),
      displayName,
      bio: data.bio ?? null,
      primaryCategoryId:
        data.primaryCategoryId && Types.ObjectId.isValid(data.primaryCategoryId)
          ? new Types.ObjectId(data.primaryCategoryId)
          : undefined,
      skills: (data.skills || []).map((s) => ({
        skillId: new Types.ObjectId(s.skillId),
        experienceYears: s.experienceYears,
        level: s.level,
        verified: s.verified ?? false,
      })),
      languages: data.languages || ['en'],
      ...(coordinates
        ? { serviceLocation: { type: 'Point', coordinates } }
        : {}),
      ...(data.serviceArea
        ? {
            serviceArea: {
              city: data.serviceArea.city ?? null,
              pincode: data.serviceArea.pincode ?? null,
            },
          }
        : {}),
      serviceRadiusKm: radiusKm,
      availabilityStatus:
        data.availabilityStatus ??
        (data.isAvailable === true ? WorkerAvailability.AVAILABLE : WorkerAvailability.OFFLINE),
      onboardingComplete: data.onboardingComplete ?? false,
      pricing: {
        hourlyRate: data.pricing?.hourlyRate ?? data.hourlyRate ?? null,
        customRateDescription: data.pricing?.customRateDescription ?? null,
        currency: data.pricing?.currency ?? 'INR',
      },
      portfolio: ((data.portfolio || []).map((p) => ({
        title: p.title,
        description: p.description ?? null,
        imageUrl: p.imageUrl,
        createdAt: new Date(),
      })) as unknown) as IWorkerProfileDocument['portfolio'],
      verificationStatus: WorkerVerificationStatus.UNVERIFIED,
    };

    const doc = new WorkerProfileModel(docData);
    await doc.save({ session: session ?? undefined });
    return mapWorkerDocumentToEntity(doc);
  }

  async update(
    id: string,
    data: IUpdateWorkerProfileInput,
    session?: ClientSession | null
  ): Promise<IWorkerProfileEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const updateData: Record<string, unknown> = {};

    if (data.displayName || data.fullName) {
      updateData['displayName'] = data.displayName || data.fullName;
    }
    if (data.bio !== undefined) updateData['bio'] = data.bio;
    if (data.languages !== undefined) updateData['languages'] = data.languages;
    if (data.pricing !== undefined) updateData['pricing'] = data.pricing;
    if (data.hourlyRate !== undefined) updateData['pricing.hourlyRate'] = data.hourlyRate;
    if (data.portfolio !== undefined) updateData['portfolio'] = data.portfolio;
    if (data.availabilityStatus !== undefined) updateData['availabilityStatus'] = data.availabilityStatus;
    if (data.serviceRadiusKm !== undefined) updateData['serviceRadiusKm'] = data.serviceRadiusKm;
    if (data.serviceLocation !== undefined) updateData['serviceLocation'] = data.serviceLocation;
    if (data.serviceArea !== undefined) {
      if (data.serviceArea.city !== undefined) updateData['serviceArea.city'] = data.serviceArea.city;
      if (data.serviceArea.pincode !== undefined) updateData['serviceArea.pincode'] = data.serviceArea.pincode;
    }
    if (data.onboardingComplete !== undefined) updateData['onboardingComplete'] = data.onboardingComplete;
    if (data.ratingAverage !== undefined) updateData['rating.average'] = data.ratingAverage;
    if (data.ratingCount !== undefined) updateData['rating.count'] = data.ratingCount;
    if (data.completedJobsCount !== undefined) updateData['stats.completedJobs'] = data.completedJobsCount;

    if (data.primaryCategoryId && Types.ObjectId.isValid(data.primaryCategoryId)) {
      updateData['primaryCategoryId'] = new Types.ObjectId(data.primaryCategoryId);
    }
    if (data.skills) {
      updateData['skills'] = data.skills.map((s) => ({
        skillId: new Types.ObjectId(s.skillId),
        experienceYears: s.experienceYears,
        level: s.level,
        verified: s.verified,
      }));
    }

    const doc = await WorkerProfileModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: updateData },
      { new: true, session: session ?? undefined }
    ).exec();

    return doc ? mapWorkerDocumentToEntity(doc) : null;
  }

  async updateByUserId(
    userId: string,
    data: IUpdateWorkerProfileInput,
    session?: ClientSession | null
  ): Promise<IWorkerProfileEntity | null> {
    if (!Types.ObjectId.isValid(userId)) return null;

    const updateData: Record<string, unknown> = {};

    if (data.displayName || data.fullName) {
      updateData['displayName'] = data.displayName || data.fullName;
    }
    if (data.bio !== undefined) updateData['bio'] = data.bio;
    if (data.languages !== undefined) updateData['languages'] = data.languages;
    if (data.pricing !== undefined) updateData['pricing'] = data.pricing;
    if (data.hourlyRate !== undefined) updateData['pricing.hourlyRate'] = data.hourlyRate;
    if (data.portfolio !== undefined) updateData['portfolio'] = data.portfolio;
    if (data.availabilityStatus !== undefined) updateData['availabilityStatus'] = data.availabilityStatus;
    if (data.serviceRadiusKm !== undefined) updateData['serviceRadiusKm'] = data.serviceRadiusKm;
    if (data.serviceLocation !== undefined) updateData['serviceLocation'] = data.serviceLocation;
    if (data.serviceArea !== undefined) {
      if (data.serviceArea.city !== undefined) updateData['serviceArea.city'] = data.serviceArea.city;
      if (data.serviceArea.pincode !== undefined) updateData['serviceArea.pincode'] = data.serviceArea.pincode;
    }
    if (data.onboardingComplete !== undefined) updateData['onboardingComplete'] = data.onboardingComplete;
    if (data.primaryCategoryId && Types.ObjectId.isValid(data.primaryCategoryId)) {
      updateData['primaryCategoryId'] = new Types.ObjectId(data.primaryCategoryId);
    }
    if (data.skills !== undefined) {
      updateData['skills'] = data.skills.map((skill) => ({
        skillId: new Types.ObjectId(skill.skillId),
        experienceYears: skill.experienceYears,
        level: skill.level,
        verified: skill.verified,
      }));
    }

    const doc = await WorkerProfileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), deletedAt: null },
      { $set: updateData },
      { new: true, session: session ?? undefined }
    ).exec();

    return doc ? mapWorkerDocumentToEntity(doc) : null;
  }

  async addSkill(userId: string, skill: IWorkerSkillItem): Promise<IWorkerProfileEntity | null> {
    if (!Types.ObjectId.isValid(userId)) return null;

    // Pull any existing skill with the same skillId to prevent duplicate skills
    await WorkerProfileModel.updateOne(
      { userId: new Types.ObjectId(userId), deletedAt: null },
      { $pull: { skills: { skillId: new Types.ObjectId(skill.skillId) } } }
    ).exec();

    // Push the updated or newly added skill
    const doc = await WorkerProfileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), deletedAt: null },
      {
        $push: {
          skills: {
            skillId: new Types.ObjectId(skill.skillId),
            experienceYears: skill.experienceYears,
            level: skill.level,
            verified: skill.verified ?? false,
          },
        },
      },
      { new: true }
    ).exec();

    return doc ? mapWorkerDocumentToEntity(doc) : null;
  }

  async removeSkill(userId: string, skillId: string): Promise<IWorkerProfileEntity | null> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(skillId)) return null;

    const doc = await WorkerProfileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), deletedAt: null },
      { $pull: { skills: { skillId: new Types.ObjectId(skillId) } } },
      { new: true }
    ).exec();

    return doc ? mapWorkerDocumentToEntity(doc) : null;
  }

  async updateLocation(
    userId: string,
    coordinates: [number, number]
  ): Promise<IWorkerProfileEntity | null> {
    if (!Types.ObjectId.isValid(userId)) return null;

    const doc = await WorkerProfileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), deletedAt: null },
      {
        $set: {
          serviceLocation: {
            type: 'Point',
            coordinates,
          },
        },
      },
      { new: true }
    ).exec();

    return doc ? mapWorkerDocumentToEntity(doc) : null;
  }

  async updateAvailability(
    userId: string,
    availabilityStatus: WorkerAvailability
  ): Promise<IWorkerProfileEntity | null> {
    if (!Types.ObjectId.isValid(userId)) return null;

    const doc = await WorkerProfileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), deletedAt: null },
      { $set: { availabilityStatus } },
      { new: true }
    ).exec();

    return doc ? mapWorkerDocumentToEntity(doc) : null;
  }

  async updateServiceRadius(
    userId: string,
    serviceRadiusKm: number
  ): Promise<IWorkerProfileEntity | null> {
    if (!Types.ObjectId.isValid(userId)) return null;

    const doc = await WorkerProfileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), deletedAt: null },
      { $set: { serviceRadiusKm } },
      { new: true }
    ).exec();

    return doc ? mapWorkerDocumentToEntity(doc) : null;
  }

  async softDelete(id: string, session?: ClientSession | null): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const result = await WorkerProfileModel.updateOne(
      { _id: id, deletedAt: null },
      {
        $set: {
          deletedAt: new Date(),
          availabilityStatus: WorkerAvailability.OFFLINE,
        },
      },
      { session: session ?? undefined }
    ).exec();

    return result.modifiedCount > 0;
  }
}

export const workerProfileRepository = new WorkerProfileRepository();

