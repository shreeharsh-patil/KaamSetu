import { Schema, model, Document, Types } from 'mongoose';
import { UserRole, UserStatus, IUserEntity } from '@kaamsetu/types';

export interface IUserDocument extends Document {
  _id: Types.ObjectId;
  phoneNumber: string;
  phoneVerified: boolean;
  phoneVerifiedAt?: Date | null;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole;
  status: UserStatus;
  email?: string | null;
  emailVerified: boolean;
  preferredLanguage: string;
  profilePhotoUrl?: string | null;
  lastLoginAt?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const userSchema = new Schema<IUserDocument>(
  {
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerifiedAt: {
      type: Date,
      default: null,
    },
    firstName: {
      type: String,
      trim: true,
      default: null,
    },
    lastName: {
      type: String,
      trim: true,
      default: null,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    preferredLanguage: {
      type: String,
      default: 'en',
      trim: true,
    },
    profilePhotoUrl: {
      type: String,
      default: null,
      trim: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
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

// Explicit partial index for email: only enforces uniqueness when email is a string
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: 'string' } },
  }
);

export function mapUserDocumentToEntity(doc: IUserDocument): IUserEntity {
  const firstName = doc.firstName ?? null;
  const lastName = doc.lastName ?? null;
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || doc.phoneNumber;
  const requiresProfileCompletion = !firstName || !lastName || !doc.email;

  return {
    id: doc._id.toString(),
    phoneNumber: doc.phoneNumber,
    phone: doc.phoneNumber,
    phoneVerified: doc.phoneVerified,
    phoneVerifiedAt: doc.phoneVerifiedAt ?? null,
    firstName,
    lastName,
    fullName,
    role: doc.role,
    status: doc.status,
    email: doc.email ?? null,
    emailVerified: doc.emailVerified,
    preferredLanguage: doc.preferredLanguage,
    profilePhotoUrl: doc.profilePhotoUrl ?? null,
    lastLoginAt: doc.lastLoginAt ?? null,
    requiresProfileCompletion,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt ?? null,
  };
}

export const UserModel = model<IUserDocument>('User', userSchema);
