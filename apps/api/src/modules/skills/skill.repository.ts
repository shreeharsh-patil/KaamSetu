import { ClientSession, Types } from 'mongoose';
import { SkillModel, mapSkillDocumentToEntity, ISkillDocument } from './skill.model.js';
import type { ISkillEntity, ICreateSkillInput, IUpdateSkillInput } from '@kaamsetu/types';

export interface ISkillRepository {
  findById(id: string, includeDeleted?: boolean): Promise<ISkillEntity | null>;
  findBySlug(slug: string, includeDeleted?: boolean): Promise<ISkillEntity | null>;
  findByCategory(categoryId: string, onlyActive?: boolean): Promise<ISkillEntity[]>;
  findByIds(ids: string[]): Promise<ISkillEntity[]>;
  create(data: ICreateSkillInput, session?: ClientSession | null): Promise<ISkillEntity>;
  update(
    id: string,
    data: IUpdateSkillInput,
    session?: ClientSession | null
  ): Promise<ISkillEntity | null>;
  softDelete(id: string, session?: ClientSession | null): Promise<boolean>;
}

export class SkillRepository implements ISkillRepository {
  async findById(id: string, includeDeleted = false): Promise<ISkillEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const query: Record<string, unknown> = { _id: id };
    if (!includeDeleted) {
      query['deletedAt'] = null;
    }

    const doc = await SkillModel.findOne(query).exec();
    return doc ? mapSkillDocumentToEntity(doc) : null;
  }

  async findBySlug(slug: string, includeDeleted = false): Promise<ISkillEntity | null> {
    const query: Record<string, unknown> = { slug: slug.toLowerCase().trim() };
    if (!includeDeleted) {
      query['deletedAt'] = null;
    }

    const doc = await SkillModel.findOne(query).exec();
    return doc ? mapSkillDocumentToEntity(doc) : null;
  }

  async findByCategory(categoryId: string, onlyActive = true): Promise<ISkillEntity[]> {
    if (!Types.ObjectId.isValid(categoryId)) return [];

    const query: Record<string, unknown> = {
      categoryId: new Types.ObjectId(categoryId),
      deletedAt: null,
    };
    if (onlyActive) {
      query['active'] = true;
    }

    const docs = await SkillModel.find(query).sort({ name: 1 }).exec();
    return docs.map(mapSkillDocumentToEntity);
  }

  async findByIds(ids: string[]): Promise<ISkillEntity[]> {
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
    if (validIds.length === 0) return [];

    const docs = await SkillModel.find({
      _id: { $in: validIds },
      deletedAt: null,
    }).exec();

    return docs.map(mapSkillDocumentToEntity);
  }

  async create(data: ICreateSkillInput, session?: ClientSession | null): Promise<ISkillEntity> {
    const docData: Partial<ISkillDocument> = {
      ...data,
      slug: data.slug.toLowerCase().trim(),
      categoryId: new Types.ObjectId(data.categoryId),
    };

    const doc = new SkillModel(docData);
    await doc.save({ session: session ?? undefined });
    return mapSkillDocumentToEntity(doc);
  }

  async update(
    id: string,
    data: IUpdateSkillInput,
    session?: ClientSession | null
  ): Promise<ISkillEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const updateData: Record<string, unknown> = { ...data };
    if (data.slug) {
      updateData['slug'] = data.slug.toLowerCase().trim();
    }
    if (data.categoryId && Types.ObjectId.isValid(data.categoryId)) {
      updateData['categoryId'] = new Types.ObjectId(data.categoryId);
    }

    const doc = await SkillModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: updateData },
      { new: true, session: session ?? undefined }
    ).exec();

    return doc ? mapSkillDocumentToEntity(doc) : null;
  }

  async softDelete(id: string, session?: ClientSession | null): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const result = await SkillModel.updateOne(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date(), active: false } },
      { session: session ?? undefined }
    ).exec();

    return result.modifiedCount > 0;
  }
}

export const skillRepository = new SkillRepository();
