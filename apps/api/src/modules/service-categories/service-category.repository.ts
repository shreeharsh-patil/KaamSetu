import { ClientSession, Types } from 'mongoose';
import {
  ServiceCategoryModel,
  mapCategoryDocumentToEntity,
  IServiceCategoryDocument,
} from './service-category.model.js';
import type {
  IServiceCategoryEntity,
  ICreateServiceCategoryInput,
  IUpdateServiceCategoryInput,
} from '@kaamsetu/types';

export interface IServiceCategoryRepository {
  findById(id: string, includeDeleted?: boolean): Promise<IServiceCategoryEntity | null>;
  findBySlug(slug: string, includeDeleted?: boolean): Promise<IServiceCategoryEntity | null>;
  findAll(onlyActive?: boolean): Promise<IServiceCategoryEntity[]>;
  create(data: ICreateServiceCategoryInput, session?: ClientSession | null): Promise<IServiceCategoryEntity>;
  update(
    id: string,
    data: IUpdateServiceCategoryInput,
    session?: ClientSession | null
  ): Promise<IServiceCategoryEntity | null>;
  softDelete(id: string, session?: ClientSession | null): Promise<boolean>;
}

export class ServiceCategoryRepository implements IServiceCategoryRepository {
  async findById(id: string, includeDeleted = false): Promise<IServiceCategoryEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const query: Record<string, unknown> = { _id: id };
    if (!includeDeleted) {
      query['deletedAt'] = null;
    }

    const doc = await ServiceCategoryModel.findOne(query).exec();
    return doc ? mapCategoryDocumentToEntity(doc) : null;
  }

  async findBySlug(slug: string, includeDeleted = false): Promise<IServiceCategoryEntity | null> {
    const query: Record<string, unknown> = { slug: slug.toLowerCase().trim() };
    if (!includeDeleted) {
      query['deletedAt'] = null;
    }

    const doc = await ServiceCategoryModel.findOne(query).exec();
    return doc ? mapCategoryDocumentToEntity(doc) : null;
  }

  async findAll(onlyActive = true): Promise<IServiceCategoryEntity[]> {
    const query: Record<string, unknown> = { deletedAt: null };
    if (onlyActive) {
      query['active'] = true;
    }

    const docs = await ServiceCategoryModel.find(query)
      .sort({ displayOrder: 1, name: 1 })
      .exec();

    return docs.map(mapCategoryDocumentToEntity);
  }

  async create(
    data: ICreateServiceCategoryInput,
    session?: ClientSession | null
  ): Promise<IServiceCategoryEntity> {
    const docData: Partial<IServiceCategoryDocument> = {
      ...data,
      slug: data.slug.toLowerCase().trim(),
    };

    const doc = new ServiceCategoryModel(docData);
    await doc.save({ session: session ?? undefined });
    return mapCategoryDocumentToEntity(doc);
  }

  async update(
    id: string,
    data: IUpdateServiceCategoryInput,
    session?: ClientSession | null
  ): Promise<IServiceCategoryEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const updateData: Record<string, unknown> = { ...data };
    if (data.slug) {
      updateData['slug'] = data.slug.toLowerCase().trim();
    }

    const doc = await ServiceCategoryModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: updateData },
      { new: true, session: session ?? undefined }
    ).exec();

    return doc ? mapCategoryDocumentToEntity(doc) : null;
  }

  async softDelete(id: string, session?: ClientSession | null): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const result = await ServiceCategoryModel.updateOne(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date(), active: false } },
      { session: session ?? undefined }
    ).exec();

    return result.modifiedCount > 0;
  }
}

export const serviceCategoryRepository = new ServiceCategoryRepository();
