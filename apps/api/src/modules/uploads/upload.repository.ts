import { Types } from 'mongoose';
import { UploadModel, toUploadEntity } from './upload.model.js';
import type { IUploadEntity, UploadPurpose, UploadStatus } from '@kaamsetu/types';

export interface IUploadRepository {
  create(data: {
    userId: string;
    purpose: UploadPurpose;
    key: string;
    originalFilename?: string | null;
    mimeType: string;
    sizeBytes: number;
    isPublic: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<IUploadEntity>;

  findById(id: string): Promise<IUploadEntity | null>;
  findByKey(key: string): Promise<IUploadEntity | null>;
  updateStatus(
    id: string,
    status: UploadStatus,
    publicUrl?: string | null
  ): Promise<IUploadEntity | null>;
  delete(id: string): Promise<boolean>;
  findByUserId(userId: string, purpose?: UploadPurpose): Promise<IUploadEntity[]>;
}

export class UploadRepository implements IUploadRepository {
  async create(data: {
    userId: string;
    purpose: UploadPurpose;
    key: string;
    originalFilename?: string | null;
    mimeType: string;
    sizeBytes: number;
    isPublic: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<IUploadEntity> {
    const doc = await UploadModel.create({
      userId: new Types.ObjectId(data.userId),
      purpose: data.purpose,
      key: data.key,
      originalFilename: data.originalFilename ?? null,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      isPublic: data.isPublic,
      metadata: data.metadata,
    });

    return toUploadEntity(doc);
  }

  async findById(id: string): Promise<IUploadEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await UploadModel.findById(id).exec();
    return doc ? toUploadEntity(doc) : null;
  }

  async findByKey(key: string): Promise<IUploadEntity | null> {
    const doc = await UploadModel.findOne({ key }).exec();
    return doc ? toUploadEntity(doc) : null;
  }

  async updateStatus(
    id: string,
    status: UploadStatus,
    publicUrl?: string | null
  ): Promise<IUploadEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const updatePayload: Record<string, unknown> = { status };
    if (publicUrl !== undefined) {
      updatePayload['publicUrl'] = publicUrl;
    }

    const doc = await UploadModel.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true }
    ).exec();

    return doc ? toUploadEntity(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const res = await UploadModel.findByIdAndDelete(id).exec();
    return !!res;
  }

  async findByUserId(userId: string, purpose?: UploadPurpose): Promise<IUploadEntity[]> {
    if (!Types.ObjectId.isValid(userId)) return [];
    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };
    if (purpose) {
      filter['purpose'] = purpose;
    }
    const docs = await UploadModel.find(filter)
      .sort({ createdAt: -1 })
      .exec();
    return docs.map(toUploadEntity);
  }
}

export const uploadRepository = new UploadRepository();
