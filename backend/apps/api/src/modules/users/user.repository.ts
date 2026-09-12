import { ClientSession, Types } from 'mongoose';
import { UserModel, mapUserDocumentToEntity, IUserDocument } from './user.model.js';
import type { IUserEntity, ICreateUserInput, IUpdateUserInput } from '@kaamsetu/types';
import { normalizePhoneNumber } from '@kaamsetu/validation';

export interface IUserRepository {
  findById(id: string, includeDeleted?: boolean): Promise<IUserEntity | null>;
  findByPhone(phoneNumber: string, includeDeleted?: boolean): Promise<IUserEntity | null>;
  findByEmail(email: string): Promise<IUserEntity | null>;
  create(data: ICreateUserInput, session?: ClientSession | null): Promise<IUserEntity>;
  update(id: string, data: IUpdateUserInput, session?: ClientSession | null): Promise<IUserEntity | null>;
  softDelete(id: string, session?: ClientSession | null): Promise<boolean>;
  restore(id: string, session?: ClientSession | null): Promise<boolean>;
}

export class UserRepository implements IUserRepository {
  async findById(id: string, includeDeleted = false): Promise<IUserEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const query: Record<string, unknown> = { _id: id };
    if (!includeDeleted) {
      query['deletedAt'] = null;
    }

    const doc = await UserModel.findOne(query).exec();
    return doc ? mapUserDocumentToEntity(doc) : null;
  }

  async findByPhone(phoneNumber: string, includeDeleted = false): Promise<IUserEntity | null> {
    const normalized = normalizePhoneNumber(phoneNumber);
    const query: Record<string, unknown> = { phoneNumber: normalized };
    if (!includeDeleted) {
      query['deletedAt'] = null;
    }

    const doc = await UserModel.findOne(query).exec();
    return doc ? mapUserDocumentToEntity(doc) : null;
  }

  async findByEmail(email: string): Promise<IUserEntity | null> {
    const doc = await UserModel.findOne({
      email: email.toLowerCase().trim(),
      deletedAt: null,
    }).exec();
    return doc ? mapUserDocumentToEntity(doc) : null;
  }

  async create(data: ICreateUserInput, session?: ClientSession | null): Promise<IUserEntity> {
    const normalizedPhone = normalizePhoneNumber(data.phoneNumber);

    const docData: Partial<IUserDocument> = {
      phoneNumber: normalizedPhone,
      role: data.role,
      status: data.status,
      phoneVerified: data.phoneVerified,
      emailVerified: data.emailVerified,
      preferredLanguage: data.preferredLanguage,
      profilePhotoUrl: data.profilePhotoUrl,
      ...(data.email ? { email: data.email.toLowerCase().trim() } : {}),
    };

    const doc = new UserModel(docData);
    await doc.save({ session: session ?? undefined });
    return mapUserDocumentToEntity(doc);
  }

  async update(
    id: string,
    data: IUpdateUserInput,
    session?: ClientSession | null
  ): Promise<IUserEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const updateData: Record<string, unknown> = { ...data };

    if (data.phoneNumber) {
      updateData['phoneNumber'] = normalizePhoneNumber(data.phoneNumber);
    }
    if (data.email !== undefined) {
      updateData['email'] = data.email ? data.email.toLowerCase().trim() : null;
    }

    const doc = await UserModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: updateData },
      { new: true, session: session ?? undefined }
    ).exec();

    return doc ? mapUserDocumentToEntity(doc) : null;
  }

  async softDelete(id: string, session?: ClientSession | null): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const result = await UserModel.updateOne(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { session: session ?? undefined }
    ).exec();

    return result.modifiedCount > 0;
  }

  async restore(id: string, session?: ClientSession | null): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const result = await UserModel.updateOne(
      { _id: id, deletedAt: { $ne: null } },
      { $set: { deletedAt: null } },
      { session: session ?? undefined }
    ).exec();

    return result.modifiedCount > 0;
  }
}

export const userRepository = new UserRepository();
