import { ClientSession, Types } from 'mongoose';
import {
  WorkerProfileModel,
  mapWorkerDocumentToEntity,
  IWorkerProfileDocument,
} from './worker-profile.model.js';
import type {
  IWorkerProfileEntity,
  ICreateWorkerProfileInput,
  IUpdateWorkerProfileInput,
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
      isAvailable: true,
      'serviceArea.coordinates': {
        $near: {
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
    const docData: Partial<IWorkerProfileDocument> = {
      userId: new Types.ObjectId(data.userId),
      fullName: data.fullName,
      bio: data.bio ?? null,
      primaryCategoryId: new Types.ObjectId(data.primaryCategoryId),
      skillIds: (data.skillIds || []).map((id) => new Types.ObjectId(id)),
      serviceArea: {
        type: 'Point',
        coordinates: data.serviceArea.coordinates,
        radiusKm: data.serviceArea.radiusKm ?? 15,
        address: data.serviceArea.address ?? null,
        city: data.serviceArea.city ?? null,
        pincode: data.serviceArea.pincode ?? null,
      },
      hourlyRate: data.hourlyRate ?? null,
      isAvailable: data.isAvailable ?? true,
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

    const updateData: Record<string, unknown> = { ...data };

    if (data.primaryCategoryId && Types.ObjectId.isValid(data.primaryCategoryId)) {
      updateData['primaryCategoryId'] = new Types.ObjectId(data.primaryCategoryId);
    }
    if (data.skillIds) {
      updateData['skillIds'] = data.skillIds.map((sid) => new Types.ObjectId(sid));
    }

    const doc = await WorkerProfileModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: updateData },
      { new: true, session: session ?? undefined }
    ).exec();

    return doc ? mapWorkerDocumentToEntity(doc) : null;
  }

  async softDelete(id: string, session?: ClientSession | null): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const result = await WorkerProfileModel.updateOne(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date(), isAvailable: false } },
      { session: session ?? undefined }
    ).exec();

    return result.modifiedCount > 0;
  }
}

export const workerProfileRepository = new WorkerProfileRepository();
