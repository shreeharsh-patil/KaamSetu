import {
  JobUrgency,
  type IAIProvider,
  type AIRequestOptions,
  type JobClassificationResult,
  type ExtractedProfileResult,
  type SimplifiedJobDescriptionResult,
  type TranslationResult,
} from '@kaamsetu/types';
import { geminiClient, GeminiClient } from './gemini-client.js';
import { mockAIProvider } from './mock-ai.provider.js';
import { logger } from '../../../config/index.js';

export interface BestMatchExplanation {
  workerId: string;
  workerName: string;
  bestFitSummary: string;
  strengths: string[];
  recommendedBadge?: string;
}

export class GeminiAIProvider implements IAIProvider {
  public readonly name: string = 'gemini-ai';

  constructor(private readonly client: GeminiClient = geminiClient) {}

  /**
   * Classifies a customer service request into category, skills, urgency, and estimated price using Gemini.
   */
  async classifyJob(
    text: string,
    options?: AIRequestOptions
  ): Promise<JobClassificationResult> {
    try {
      const prompt = `You are KaamSetu's AI dispatch classifier for local blue-collar services in India.
Analyze this customer problem description:
"${text}"

Return JSON matching this exact structure:
{
  "categorySlug": "plumbing" | "electrical" | "cleaning" | "painting" | "carpentry" | "appliance-repair" | "general-maintenance",
  "suggestedCategoryName": string,
  "suggestedSkills": string[],
  "title": string | null,
  "description": string | null,
  "urgency": "FLEXIBLE" | "TODAY" | "EMERGENCY",
  "timingIntent": "ASAP" | "TODAY" | "TOMORROW" | "SCHEDULED" | null,
  "scheduledAt": ISO-8601 string | null,
  "locationText": string | null,
  "problemSummary": string | null,
  "estimatedPrice": number,
  "confidence": number
}

Rules:
- categorySlug must be one of: "plumbing", "electrical", "cleaning", "painting", "carpentry", "appliance-repair", "general-maintenance".
- Preserve the customer's original language in description. Do not invent a category, time, location, or MongoDB IDs. For an unclear request omit categorySlug and use low confidence.
- estimatedPrice in INR (realistic price for India, between 250 and 8000).
- confidence between 0.70 and 0.99.`;

      const response = await this.client.generateContent(
        [{ parts: [{ text: prompt }] }],
        { responseMimeType: 'application/json', timeoutMs: options?.timeoutMs }
      );

      const parsed = JSON.parse(response.text);

      let urgencyEnum = JobUrgency.FLEXIBLE;
      if (parsed.urgency === 'EMERGENCY') {
        urgencyEnum = JobUrgency.EMERGENCY;
      } else if (parsed.urgency === 'TODAY') {
        urgencyEnum = JobUrgency.TODAY;
      }

      return {
        categorySlug: typeof parsed.categorySlug === 'string' ? parsed.categorySlug : undefined,
        suggestedCategoryName: typeof parsed.suggestedCategoryName === 'string' ? parsed.suggestedCategoryName : undefined,
        suggestedSkills: Array.isArray(parsed.suggestedSkills) ? parsed.suggestedSkills : [],
        urgency: urgencyEnum,
        estimatedPrice: typeof parsed.estimatedPrice === 'number' ? parsed.estimatedPrice : 500,
        title: typeof parsed.title === 'string' ? parsed.title : undefined,
        description: typeof parsed.description === 'string' ? parsed.description : text.trim(),
        timingIntent: ['ASAP', 'TODAY', 'TOMORROW', 'SCHEDULED'].includes(parsed.timingIntent) ? parsed.timingIntent : undefined,
        scheduledAt: typeof parsed.scheduledAt === 'string' ? parsed.scheduledAt : undefined,
        locationText: typeof parsed.locationText === 'string' ? parsed.locationText : undefined,
        problemSummary: typeof parsed.problemSummary === 'string' ? parsed.problemSummary : undefined,
        confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.85,
      };
    } catch (err) {
      logger.warn({ err }, 'Gemini classifyJob failed; falling back to deterministic mock analyzer');
      return mockAIProvider.classifyJob(text, options);
    }
  }

  /**
   * Extracts worker profile, skills, languages, and bio from spoken voice transcript or text introduction.
   */
  async extractWorkerProfile(
    textOrTranscript: string,
    options?: AIRequestOptions
  ): Promise<ExtractedProfileResult> {
    try {
      const prompt = `You are KaamSetu's worker onboarding assistant.
Extract worker profile information from this text or voice transcript:
"${textOrTranscript}"

Return JSON matching this exact structure:
{
  "suggestedSkills": string[],
  "languages": string[],
  "bio": string,
  "experienceYears": number or null,
  "confidence": number
}

Rules:
- languages must be ISO 639-1 two-letter codes (e.g. "en", "hi", "kn", "ta", "te", "mr", "bn").
- bio should be a clean 1-2 sentence professional bio in English.
- experienceYears should be integer years of experience if mentioned.
- confidence between 0.75 and 0.98.`;

      const response = await this.client.generateContent(
        [{ parts: [{ text: prompt }] }],
        { responseMimeType: 'application/json', timeoutMs: options?.timeoutMs }
      );

      const parsed = JSON.parse(response.text);

      return {
        suggestedSkills: Array.isArray(parsed.suggestedSkills) ? parsed.suggestedSkills : [],
        languages: Array.isArray(parsed.languages) && parsed.languages.length > 0 ? parsed.languages : ['en'],
        bio: typeof parsed.bio === 'string' && parsed.bio.trim().length > 0 ? parsed.bio.trim() : textOrTranscript.trim(),
        experienceYears: typeof parsed.experienceYears === 'number' ? parsed.experienceYears : undefined,
        confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.85,
      };
    } catch (err) {
      logger.warn({ err }, 'Gemini extractWorkerProfile failed; falling back to mock extractor');
      return mockAIProvider.extractWorkerProfile(textOrTranscript, options);
    }
  }

  /**
   * Simplifies customer technical problem description for field workers.
   */
  async simplifyJobDescription(
    rawText: string,
    options?: AIRequestOptions
  ): Promise<SimplifiedJobDescriptionResult> {
    try {
      const prompt = `Summarize this service job description into plain, simple language for a field technician:
"${rawText}"

Return JSON matching:
{
  "simplifiedText": string,
  "keyTasks": string[],
  "language": "en"
}`;

      const response = await this.client.generateContent(
        [{ parts: [{ text: prompt }] }],
        { responseMimeType: 'application/json', timeoutMs: options?.timeoutMs }
      );

      const parsed = JSON.parse(response.text);
      return {
        simplifiedText: parsed.simplifiedText || rawText,
        keyTasks: Array.isArray(parsed.keyTasks) ? parsed.keyTasks : [rawText],
        language: parsed.language || 'en',
      };
    } catch (err) {
      logger.warn({ err }, 'Gemini simplifyJobDescription failed; falling back to mock simplifier');
      return mockAIProvider.simplifyJobDescription(rawText, options);
    }
  }

  /**
   * Translates job notes and messages between customer and worker languages.
   */
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'en',
    options?: AIRequestOptions
  ): Promise<TranslationResult> {
    const target = targetLanguage.toLowerCase().trim();
    const source = sourceLanguage.toLowerCase().trim();

    if (target === source || !text.trim()) {
      return {
        translatedText: text,
        sourceLanguage: source,
        targetLanguage: target,
        isFallback: false,
      };
    }

    try {
      const prompt = `Translate the following text from language '${source}' to language '${target}':
"${text}"

Return JSON:
{
  "translatedText": string,
  "sourceLanguage": "${source}",
  "targetLanguage": "${target}"
}`;

      const response = await this.client.generateContent(
        [{ parts: [{ text: prompt }] }],
        { responseMimeType: 'application/json', timeoutMs: options?.timeoutMs }
      );

      const parsed = JSON.parse(response.text);
      return {
        translatedText: parsed.translatedText || text,
        sourceLanguage: source,
        targetLanguage: target,
        isFallback: false,
      };
    } catch (err) {
      logger.warn({ err }, 'Gemini translateText failed; falling back to dictionary/mock translator');
      return mockAIProvider.translateText(text, targetLanguage, sourceLanguage, options);
    }
  }

  /**
   * Evaluates and highlights why candidate workers are the best match for a specific job request.
   */
  async explainBestMatches(
    jobDescription: string,
    candidates: Array<{ workerId: string; name: string; skills: string[]; distanceKm: number; rating: number; completedJobs: number }>
  ): Promise<BestMatchExplanation[]> {
    if (candidates.length === 0) return [];

    try {
      const prompt = `You are KaamSetu's AI matching assistant.
A customer posted this job: "${jobDescription}".
Here are the top qualified worker candidates:
${JSON.stringify(candidates, null, 2)}

Provide a concise, customer-friendly explanation for each candidate explaining why they are a great match.
Return JSON array matching:
[
  {
    "workerId": string,
    "workerName": string,
    "bestFitSummary": string (1 concise sentence, e.g. "Only 1.2km away with 4.9 rating on similar plumbing tasks"),
    "strengths": string[] (2-3 highlights),
    "recommendedBadge": string (e.g. "Closest Technician" | "Highest Rated" | "Most Experienced" | "Best Value")
  }
]`;

      const response = await this.client.generateContent(
        [{ parts: [{ text: prompt }] }],
        { responseMimeType: 'application/json', timeoutMs: 5000 }
      );

      const parsed = JSON.parse(response.text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      logger.warn({ err }, 'explainBestMatches AI generation failed; generating deterministic summaries');
      return candidates.map((c, i) => ({
        workerId: c.workerId,
        workerName: c.name,
        bestFitSummary: `${c.distanceKm.toFixed(1)} km away with ${c.rating}★ rating and ${c.completedJobs} completed jobs.`,
        strengths: [`${c.distanceKm.toFixed(1)} km distance`, `${c.rating}★ rating`, ...c.skills.slice(0, 2)],
        recommendedBadge: i === 0 ? 'Top Match' : undefined,
      }));
    }
  }
}

export const geminiAIProvider = new GeminiAIProvider();
