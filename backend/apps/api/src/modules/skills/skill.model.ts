import { Schema, model, Document, Types } from 'mongoose';
import type { ISkillEntity, TranslationMap } from '@kaamsetu/types';

export interface ISkillDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  categoryId: Types.ObjectId;
  active: boolean;
  translations: TranslationMap;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export const skillSchema = new Schema<ISkillDocument>(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Skill slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: [true, 'Category ID is required'],
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    translations: {
      type: Map,
      of: String,
      default: {},
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

// Explicit compound index
skillSchema.index({ categoryId: 1, active: 1 });

export function mapSkillDocumentToEntity(doc: ISkillDocument): ISkillEntity {
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
    categoryId: doc.categoryId.toString(),
    active: doc.active,
    translations: translationsObj,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt ?? null,
  };
}

export const SkillModel = model<ISkillDocument>('Skill', skillSchema);
