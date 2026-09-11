import { Schema, model, Document, Types } from 'mongoose';
import type { IServiceCategoryEntity, TranslationMap } from '@kaamsetu/types';

export interface IServiceCategoryDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string | null;
  translations: TranslationMap;
  icon?: string | null;
  active: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export const serviceCategorySchema = new Schema<IServiceCategoryDocument>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    translations: {
      type: Map,
      of: String,
      default: {},
    },
    icon: {
      type: String,
      default: null,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
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

export function mapCategoryDocumentToEntity(doc: IServiceCategoryDocument): IServiceCategoryEntity {
  const translationsObj: TranslationMap = {};
  if (doc.translations) {
    if (doc.translations instanceof Map) {
      doc.translations.forEach((value, key) => {
        translationsObj[key] = value;
      });
    } else {
      Object.assign(translationsObj, doc.translations);
    }
  }

  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? null,
    translations: translationsObj,
    icon: doc.icon ?? null,
    active: doc.active,
    displayOrder: doc.displayOrder,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt ?? null,
  };
}

export const ServiceCategoryModel = model<IServiceCategoryDocument>(
  'ServiceCategory',
  serviceCategorySchema
);
