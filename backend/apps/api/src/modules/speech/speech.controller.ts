import { Request, Response } from 'express';
import { speechService } from './speech.service.js';
import {
  transcribeAudioInputSchema,
  synthesizeSpeechInputSchema,
} from '@kaamsetu/validation';
import { BadRequestError } from '../../errors/index.js';

export async function transcribeAudio(req: Request, res: Response): Promise<void> {
  const validated = transcribeAudioInputSchema.parse(req.body);
  const result = await speechService.speechToText(
    validated.audio,
    validated.mimeType,
    { hintText: validated.hintText, language: validated.language } as unknown as any
  );

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function synthesizeSpeech(req: Request, res: Response): Promise<void> {
  const validated = synthesizeSpeechInputSchema.parse(req.body);
  const result = await speechService.textToSpeech(validated.text, validated.language);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function detectLanguage(req: Request, res: Response): Promise<void> {
  const text = req.body['text'];
  if (!text || typeof text !== 'string') {
    throw new BadRequestError('Text field is required for language detection');
  }

  const result = await speechService.detectLanguage(text);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getSpeechStatus(_req: Request, res: Response): Promise<void> {
  const status = speechService.getStatus();

  res.status(200).json({
    success: true,
    data: status,
  });
}
