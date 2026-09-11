import {
  IServiceCategoryRepository,
  serviceCategoryRepository,
} from './service-category.repository.js';
import type {
  IServiceCategoryEntity,
  ICreateServiceCategoryInput,
  IUpdateServiceCategoryInput,
} from '@kaamsetu/types';
import { NotFoundError, ConflictError } from '../../errors/index.js';

export class ServiceCategoryService {
  constructor(
    private readonly categoryRepo: IServiceCategoryRepository = serviceCategoryRepository
  ) {}

  async getCategoryById(id: string): Promise<IServiceCategoryEntity> {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw new NotFoundError(`Service Category with ID ${id} not found`);
    }
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<IServiceCategoryEntity> {
    const category = await this.categoryRepo.findBySlug(slug);
    if (!category) {
      throw new NotFoundError(`Service Category with slug '${slug}' not found`);
    }
    return category;
  }

  async getAllCategories(onlyActive = true): Promise<IServiceCategoryEntity[]> {
    return this.categoryRepo.findAll(onlyActive);
  }

  async createCategory(input: ICreateServiceCategoryInput): Promise<IServiceCategoryEntity> {
    const existing = await this.categoryRepo.findBySlug(input.slug);
    if (existing) {
      throw new ConflictError(`Service Category with slug '${input.slug}' already exists`);
    }

    return this.categoryRepo.create(input);
  }

  async updateCategory(
    id: string,
    input: IUpdateServiceCategoryInput
  ): Promise<IServiceCategoryEntity> {
    await this.getCategoryById(id);

    if (input.slug) {
      const existing = await this.categoryRepo.findBySlug(input.slug);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Service Category with slug '${input.slug}' already exists`);
      }
    }

    const updated = await this.categoryRepo.update(id, input);
    if (!updated) {
      throw new NotFoundError(`Service Category with ID ${id} not found`);
    }
    return updated;
  }

  async softDeleteCategory(id: string): Promise<void> {
    await this.getCategoryById(id);
    await this.categoryRepo.softDelete(id);
  }
}

export const serviceCategoryService = new ServiceCategoryService();
