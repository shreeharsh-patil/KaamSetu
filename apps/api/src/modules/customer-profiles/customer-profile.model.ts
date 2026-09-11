import { Schema, model, Document, Types } from 'mongoose';
import type { ICustomerProfileEntity, ICustomerAddress } from '@kaamsetu/types';

export interface ICustomerAddressSubDocument {
  _id: Types.ObjectId;
  label: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  coordinates?: [number, number];
  isDefault: boolean;
}

export interface ICustomerProfileDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  displayName: string;
  savedAddresses: Types.DocumentArray<ICustomerAddressSubDocument>;
  rating: {
    average: number;
    count: number;
  };
  jobStats: {
    totalBookings: number;
    activeBookings: number;
    cancelledBookings: number;
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const customerAddressSubSchema = new Schema(
  {
    label: {
      type: String,
      required: [true, 'Address label is required'],
      trim: true,
    },
    addressLine: {
      type: String,
      required: [true, 'Address line is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
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
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
    },
    savedAddresses: {
      type: [customerAddressSubSchema],
      default: [],
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    jobStats: {
      totalBookings: {
        type: Number,
        default: 0,
        min: 0,
      },
      activeBookings: {
        type: Number,
        default: 0,
        min: 0,
      },
      cancelledBookings: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
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
  const addresses: ICustomerAddress[] = (doc.savedAddresses || []).map((addr) => ({
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
  }));

  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0] || null;

  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    displayName: doc.displayName,
    fullName: doc.displayName,
    savedAddresses: addresses,
    addresses: addresses,
    defaultAddress,
    rating: {
      average: doc.rating?.average ?? 0,
      count: doc.rating?.count ?? 0,
    },
    jobStats: {
      totalBookings: doc.jobStats?.totalBookings ?? 0,
      activeBookings: doc.jobStats?.activeBookings ?? 0,
      cancelledBookings: doc.jobStats?.cancelledBookings ?? 0,
    },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt ?? null,
  };
}

export const CustomerProfileModel = model<ICustomerProfileDocument>(
  'CustomerProfile',
  customerProfileSchema
);
