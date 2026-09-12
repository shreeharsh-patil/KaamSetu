import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { BadRequestError } from '../../errors/index.js';
import { serviceCategoryService } from './service-category.service.js';
import { skillService } from '../skills/skill.service.js';

export async function listCategories(_req: Request, res: Response): Promise<void> {
  const categories = await serviceCategoryService.getAllCategories(true);
  res.status(200).json({ success: true, data: { categories } });
}

export async function getCategory(req: Request, res: Response): Promise<void> {
  const value = String(req.params['slug'] ?? '');
  const category = Types.ObjectId.isValid(value)
    ? await serviceCategoryService.getCategoryById(value)
    : await serviceCategoryService.getCategoryBySlug(value);
  res.status(200).json({ success: true, data: { category } });
}

export async function listCategorySkills(req: Request, res: Response): Promise<void> {
  const categoryId = String(req.params['categoryId'] ?? '');
  if (!Types.ObjectId.isValid(categoryId)) throw new BadRequestError('Invalid category ID');
  const skills = await skillService.getSkillsByCategory(categoryId, true);
  res.status(200).json({ success: true, data: { skills } });
}
