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
  ICustomerAddress,
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
  updateByUserId(
    userId: string,
    data: IUpdateCustomerProfileInput,
    session?: ClientSession | null
  ): Promise<ICustomerProfileEntity | null>;
  addAddress(
    userId: string,
    address: Omit<ICustomerAddress, 'id'>
  ): Promise<ICustomerProfileEntity | null>;
  updateAddress(
    userId: string,
    addressId: string,
    addressData: Partial<Omit<ICustomerAddress, 'id'>>
  ): Promise<ICustomerProfileEntity | null>;
  deleteAddress(userId: string, addressId: string): Promise<ICustomerProfileEntity | null>;
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
    const displayName = data.displayName || data.fullName || 'Customer';
    const rawAddresses = data.savedAddresses || data.addresses || [];

    const docData: Partial<ICustomerProfileDocument> = {
      userId: new Types.ObjectId(data.userId),
      displayName,
      savedAddresses: (rawAddresses as unknown) as ICustomerProfileDocument['savedAddresses'],
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

    const updateData: Record<string, unknown> = {};
    if (data.displayName || data.fullName) {
      updateData['displayName'] = data.displayName || data.fullName;
    }
    if (data.savedAddresses || data.addresses) {
      updateData['savedAddresses'] = data.savedAddresses || data.addresses;
    }

    const doc = await CustomerProfileModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: updateData },
      { new: true, session: session ?? undefined }
    ).exec();

    return doc ? mapCustomerDocumentToEntity(doc) : null;
  }

  async updateByUserId(
    userId: string,
    data: IUpdateCustomerProfileInput,
    session?: ClientSession | null
  ): Promise<ICustomerProfileEntity | null> {
    if (!Types.ObjectId.isValid(userId)) return null;

    const updateData: Record<string, unknown> = {};
    if (data.displayName || data.fullName) {
      updateData['displayName'] = data.displayName || data.fullName;
    }

    const doc = await CustomerProfileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), deletedAt: null },
      { $set: updateData },
      { new: true, session: session ?? undefined }
    ).exec();

    return doc ? mapCustomerDocumentToEntity(doc) : null;
  }

  async addAddress(
    userId: string,
    address: Omit<ICustomerAddress, 'id'>
  ): Promise<ICustomerProfileEntity | null> {
    if (!Types.ObjectId.isValid(userId)) return null;

    const doc = await CustomerProfileModel.findOne({
      userId: new Types.ObjectId(userId),
      deletedAt: null,
    }).exec();

    if (!doc) return null;

    const isFirstAddress = doc.savedAddresses.length === 0;
    const shouldBeDefault = address.isDefault || isFirstAddress;

    if (shouldBeDefault) {
      doc.savedAddresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    doc.savedAddresses.push({
      _id: new Types.ObjectId(),
      label: address.label,
      addressLine: address.addressLine,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      coordinates: address.coordinates,
      isDefault: shouldBeDefault,
    });

    await doc.save();
    return mapCustomerDocumentToEntity(doc);
  }

  async updateAddress(
    userId: string,
    addressId: string,
    addressData: Partial<Omit<ICustomerAddress, 'id'>>
  ): Promise<ICustomerProfileEntity | null> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(addressId)) return null;

    const doc = await CustomerProfileModel.findOne({
      userId: new Types.ObjectId(userId),
      deletedAt: null,
    }).exec();

    if (!doc) return null;

    const targetAddr = doc.savedAddresses.find((a) => a._id.toString() === addressId);
    if (!targetAddr) return null;

    if (addressData.isDefault === true) {
      doc.savedAddresses.forEach((addr) => {
        addr.isDefault = false;
      });
      targetAddr.isDefault = true;
    } else if (addressData.isDefault === false && targetAddr.isDefault) {
      targetAddr.isDefault = false;
    }

    if (addressData.label !== undefined) targetAddr.label = addressData.label;
    if (addressData.addressLine !== undefined) targetAddr.addressLine = addressData.addressLine;
    if (addressData.city !== undefined) targetAddr.city = addressData.city;
    if (addressData.state !== undefined) targetAddr.state = addressData.state;
    if (addressData.pincode !== undefined) targetAddr.pincode = addressData.pincode;
    if (addressData.coordinates !== undefined) targetAddr.coordinates = addressData.coordinates;

    await doc.save();
    return mapCustomerDocumentToEntity(doc);
  }

  async deleteAddress(userId: string, addressId: string): Promise<ICustomerProfileEntity | null> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(addressId)) return null;

    const doc = await CustomerProfileModel.findOne({
      userId: new Types.ObjectId(userId),
      deletedAt: null,
    }).exec();

    if (!doc) return null;

    const index = doc.savedAddresses.findIndex((a) => a._id.toString() === addressId);
    if (index === -1) return null;

    const wasDefault = doc.savedAddresses[index]?.isDefault;
    doc.savedAddresses.splice(index, 1);

    if (wasDefault && doc.savedAddresses.length > 0) {
      const firstAddr = doc.savedAddresses[0];
      if (firstAddr) {
        firstAddr.isDefault = true;
      }
    }

    await doc.save();
    return mapCustomerDocumentToEntity(doc);
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

