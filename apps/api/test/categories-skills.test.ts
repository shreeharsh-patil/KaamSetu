import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { serviceCategoryRepository } from '../src/modules/service-categories/service-category.repository.js';
import { serviceCategoryService } from '../src/modules/service-categories/service-category.service.js';
import { skillRepository } from '../src/modules/skills/skill.repository.js';
import { skillService } from '../src/modules/skills/skill.service.js';
import { ServiceCategoryModel } from '../src/modules/service-categories/service-category.model.js';
import { SkillModel } from '../src/modules/skills/skill.model.js';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

describe('Service Categories and Skills (Phase 1)', () => {
  beforeAll(async () => {
    await connectMongoDB({ uri: TEST_MONGODB_URI });
    await ServiceCategoryModel.syncIndexes();
    await SkillModel.syncIndexes();
  });

  afterAll(async () => {
    await SkillModel.deleteMany({ slug: /^test-/ });
    await ServiceCategoryModel.deleteMany({ slug: /^test-/ });
    await disconnectMongoDB();
  });

  it('should create a service category with multilingual translation map', async () => {
    const category = await serviceCategoryService.createCategory({
      name: 'Gardening & Landscaping',
      slug: 'test-gardening',
      description: 'Lawn mowing, plant pruning, landscaping',
      translations: {
        en: 'Gardening',
        hi: 'बागवानी',
        mr: 'बागकाम',
      },
      icon: 'leaf',
    });

    expect(category).toBeDefined();
    expect(category.id).toBeDefined();
    expect(category.name).toBe('Gardening & Landscaping');
    expect(category.slug).toBe('test-gardening');
    expect(category.translations).toEqual({
      en: 'Gardening',
      hi: 'बागवानी',
      mr: 'बागकाम',
    });
    expect(category.active).toBe(true);
  });

  it('should enforce unique slug on service categories', async () => {
    await expect(
      serviceCategoryService.createCategory({
        name: 'Duplicate Category',
        slug: 'test-gardening',
      })
    ).rejects.toThrow();
  });

  it('should create a skill associated with a valid service category', async () => {
    const category = await serviceCategoryService.getCategoryBySlug('test-gardening');

    const skill = await skillService.createSkill({
      name: 'Lawn Mowing',
      slug: 'test-lawn-mowing',
      categoryId: category.id,
      translations: {
        en: 'Lawn Mowing',
        hi: 'घास काटना',
      },
    });

    expect(skill).toBeDefined();
    expect(skill.categoryId).toBe(category.id);
    expect(skill.translations['hi']).toBe('घास काटना');
  });

  it('should retrieve all skills belonging to a category', async () => {
    const category = await serviceCategoryService.getCategoryBySlug('test-gardening');

    await skillService.createSkill({
      name: 'Hedge Trimming',
      slug: 'test-hedge-trimming',
      categoryId: category.id,
    });

    const skills = await skillService.getSkillsByCategory(category.id);
    expect(skills.length).toBeGreaterThanOrEqual(2);
    expect(skills.some((s) => s.slug === 'test-lawn-mowing')).toBe(true);
    expect(skills.some((s) => s.slug === 'test-hedge-trimming')).toBe(true);
  });

  it('should soft delete category and skills without physical deletion', async () => {
    const category = await serviceCategoryService.getCategoryBySlug('test-gardening');
    await serviceCategoryService.softDeleteCategory(category.id);

    // Standard find should not return it
    const activeDoc = await serviceCategoryRepository.findById(category.id);
    expect(activeDoc).toBeNull();

    // Include deleted should show deletedAt
    const deletedDoc = await serviceCategoryRepository.findById(category.id, true);
    expect(deletedDoc).not.toBeNull();
    expect(deletedDoc?.deletedAt).toBeInstanceOf(Date);
  });
});
