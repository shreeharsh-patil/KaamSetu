import { Schema, model, Document, Types } from 'mongoose';
import type { ICustomerProfileEntity } from '@kaamsetu/types';

export interface ICustomerProfileDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  fullName: string;
  addresses: Types.DocumentArray<{
    _id: Types.ObjectId;
    label: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    coordinates?: [number, number];
    isDefault: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const customerAddressSubSchema = new Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    addressLine: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: undefined,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

export const customerProfileSchema = new Schema<ICustomerProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    addresses: [customerAddressSubSchema],
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export function mapCustomerDocumentToEntity(
  doc: ICustomerProfileDocument
): ICustomerProfileEntity {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    fullName: doc.fullName,
    addresses: (doc.addresses || []).map((addr) => ({
      id: addr._id.toString(),
      label: addr.label,
      addressLine: addr.addressLine,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      coordinates: addr.coordinates
        ? [addr.coordinates[0] ?? 0, addr.coordinates[1] ?? 0]
        : undefined,
      isDefault: addr.isDefault,
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt ?? null,
  };
}

export const CustomerProfileModel = model<ICustomerProfileDocument>(
  'CustomerProfile',
  customerProfileSchema
);
