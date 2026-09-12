import { ISkillRepository, skillRepository } from './skill.repository.js';
import {
  IServiceCategoryRepository,
  serviceCategoryRepository,
} from '../service-categories/service-category.repository.js';
import type { ISkillEntity, ICreateSkillInput, IUpdateSkillInput } from '@kaamsetu/types';
import { NotFoundError, ConflictError } from '../../errors/index.js';

export class SkillService {
  constructor(
    private readonly skillRepo: ISkillRepository = skillRepository,
    private readonly categoryRepo: IServiceCategoryRepository = serviceCategoryRepository
  ) {}

  async getSkillById(id: string): Promise<ISkillEntity> {
    const skill = await this.skillRepo.findById(id);
    if (!skill) {
      throw new NotFoundError(`Skill with ID ${id} not found`);
    }
    return skill;
  }

  async getSkillBySlug(slug: string): Promise<ISkillEntity> {
    const skill = await this.skillRepo.findBySlug(slug);
    if (!skill) {
      throw new NotFoundError(`Skill with slug '${slug}' not found`);
    }
    return skill;
  }

  async getSkillsByCategory(categoryId: string, onlyActive = true): Promise<ISkillEntity[]> {
    await this.categoryRepo.findById(categoryId);
    return this.skillRepo.findByCategory(categoryId, onlyActive);
  }

  async createSkill(input: ICreateSkillInput): Promise<ISkillEntity> {
    const category = await this.categoryRepo.findById(input.categoryId);
    if (!category) {
      throw new NotFoundError(`Category with ID ${input.categoryId} does not exist`);
    }

    const existing = await this.skillRepo.findBySlug(input.slug);
    if (existing) {
      throw new ConflictError(`Skill with slug '${input.slug}' already exists`);
    }

    return this.skillRepo.create(input);
  }

  async updateSkill(id: string, input: IUpdateSkillInput): Promise<ISkillEntity> {
    await this.getSkillById(id);

    if (input.categoryId) {
      const category = await this.categoryRepo.findById(input.categoryId);
      if (!category) {
        throw new NotFoundError(`Category with ID ${input.categoryId} does not exist`);
      }
    }

    if (input.slug) {
      const existing = await this.skillRepo.findBySlug(input.slug);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Skill with slug '${input.slug}' already exists`);
      }
    }

    const updated = await this.skillRepo.update(id, input);
    if (!updated) {
      throw new NotFoundError(`Skill with ID ${id} not found`);
    }
    return updated;
  }

  async softDeleteSkill(id: string): Promise<void> {
    await this.getSkillById(id);
    await this.skillRepo.softDelete(id);
  }
}

export const skillService = new SkillService();
