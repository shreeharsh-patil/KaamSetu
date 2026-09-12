import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { getCategory, listCategories, listCategorySkills } from './service-category.controller.js';

export const serviceCategoryRoutes = Router();
serviceCategoryRoutes.get('/', asyncHandler(listCategories));
serviceCategoryRoutes.get('/:categoryId/skills', asyncHandler(listCategorySkills));
serviceCategoryRoutes.get('/:slug', asyncHandler(getCategory));
