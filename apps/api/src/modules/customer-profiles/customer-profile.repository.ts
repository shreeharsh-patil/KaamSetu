import { ClientSession, Types } from 'mongoose';
import {
  CustomerProfileModel,
  mapCustomerDocumentToEntity,
  ICustomerProfileDocument,
} from './customer-profile.model.js';
import type {
  ICustomerProfileEntity,
  ICreateCustomerProfileInput,
  IUpdateCustomerProfileInput,
} from '@kaamsetu/types';

export interface ICustomerProfileRepository {
  findById(id: string, includeDeleted?: boolean): Promise<ICustomerProfileEntity | null>;
  findByUserId(userId: string, includeDeleted?: boolean): Promise<ICustomerProfileEntity | null>;
  create(data: ICreateCustomerProfileInput, session?: ClientSession | null): Promise<ICustomerProfileEntity>;
  update(
    id: string,
    data: IUpdateCustomerProfileInput,
    session?: ClientSession | null
  ): Promise<ICustomerProfileEntity | null>;
  softDelete(id: string, session?: ClientSession | null): Promise<boolean>;
}

export class CustomerProfileRepository implements ICustomerProfileRepository {
  async findById(id: string, includeDeleted = false): Promise<ICustomerProfileEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const query: Record<string, unknown> = { _id: id };
    if (!includeDeleted) {
      query['deletedAt'] = null;
    }

    const doc = await CustomerProfileModel.findOne(query).exec();
    return doc ? mapCustomerDocumentToEntity(doc) : null;
  }

  async findByUserId(userId: string, includeDeleted = false): Promise<ICustomerProfileEntity | null> {
    if (!Types.ObjectId.isValid(userId)) return null;

    const query: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
    if (!includeDeleted) {
      query['deletedAt'] = null;
    }

    const doc = await CustomerProfileModel.findOne(query).exec();
    return doc ? mapCustomerDocumentToEntity(doc) : null;
  }

  async create(
    data: ICreateCustomerProfileInput,
    session?: ClientSession | null
  ): Promise<ICustomerProfileEntity> {
    const docData: Partial<ICustomerProfileDocument> = {
      userId: new Types.ObjectId(data.userId),
      fullName: data.fullName,
      addresses: ((data.addresses || []) as unknown) as ICustomerProfileDocument['addresses'],
    };

    const doc = new CustomerProfileModel(docData);
    await doc.save({ session: session ?? undefined });
    return mapCustomerDocumentToEntity(doc);
  }

  async update(
    id: string,
    data: IUpdateCustomerProfileInput,
    session?: ClientSession | null
  ): Promise<ICustomerProfileEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const updateData: Record<string, unknown> = { ...data };

    const doc = await CustomerProfileModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: updateData },
      { new: true, session: session ?? undefined }
    ).exec();

    return doc ? mapCustomerDocumentToEntity(doc) : null;
  }

  async softDelete(id: string, session?: ClientSession | null): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const result = await CustomerProfileModel.updateOne(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { session: session ?? undefined }
    ).exec();

    return result.modifiedCount > 0;
  }
}

export const customerProfileRepository = new CustomerProfileRepository();
