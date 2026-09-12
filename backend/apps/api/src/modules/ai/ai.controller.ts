import { Request, Response } from 'express';
import { aiService } from './ai.service.js';
import {
  classifyJobInputSchema,
  simplifyDescriptionInputSchema,
  translateTextInputSchema,
  extractProfileInputSchema,
} from '@kaamsetu/validation';

export async function classifyJob(req: Request, res: Response): Promise<void> {
  const validated = classifyJobInputSchema.parse(req.body);
  const result = await aiService.classifyJob(validated.text);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function simplifyDescription(req: Request, res: Response): Promise<void> {
  const validated = simplifyDescriptionInputSchema.parse(req.body);
  const result = await aiService.simplifyJobDescription(validated.description);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function translateText(req: Request, res: Response): Promise<void> {
  const validated = translateTextInputSchema.parse(req.body);
  const result = await aiService.translateText(
    validated.text,
    validated.targetLanguage,
    validated.sourceLanguage
  );

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function extractProfile(req: Request, res: Response): Promise<void> {
  const validated = extractProfileInputSchema.parse(req.body);
  const result = await aiService.extractWorkerProfile(validated.text);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getAIStatus(_req: Request, res: Response): Promise<void> {
  const status = aiService.getStatus();

  res.status(200).json({
    success: true,
    data: status,
  });
}
