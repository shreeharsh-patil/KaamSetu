import {
  type IAIProvider,
  type JobClassificationResult,
  type ExtractedProfileResult,
  type SimplifiedJobDescriptionResult,
  type TranslationResult,
  type AIProviderStatus,
  type AIRequestOptions,
  JobUrgency,
} from '@kaamsetu/types';
import {
  jobClassificationOutputSchema,
  extractedProfileOutputSchema,
  simplifiedJobDescriptionOutputSchema,
  translationOutputSchema,
} from '@kaamsetu/validation';
import { aiProviderRegistry } from './providers/ai-provider.registry.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { retrySafeOperation } from './retry.util.js';
import { logger } from '../../config/index.js';

export class AIService {
  private readonly breaker: CircuitBreaker;

  constructor(
    private readonly providerRegistry = aiProviderRegistry,
    breakerOptions = { name: 'AIService', failureThreshold: 3, cooldownPeriodMs: 20000, timeoutMs: 4000 }
  ) {
    this.breaker = new CircuitBreaker(breakerOptions);
  }

  private getProvider(): IAIProvider {
    return this.providerRegistry.getActiveProvider();
  }

  /**
   * Classify job details into category, skills, urgency, and estimated price.
   * Circuit breaker protected with safe retry and manual field fallback.
   */
  async classifyJob(
    text: string,
    options?: AIRequestOptions
  ): Promise<JobClassificationResult> {
    const fallback: JobClassificationResult = {
      suggestedSkills: [],
      urgency: JobUrgency.FLEXIBLE,
      confidence: 0,
    };

    return this.breaker.execute(
      async () => {
        return retrySafeOperation(async () => {
          const raw = await this.getProvider().classifyJob(text, options);
          // Strict Zod validation on AI output
          return jobClassificationOutputSchema.parse(raw) as JobClassificationResult;
        });
      },
      () => {
        logger.warn({ text: text.slice(0, 50) }, 'AI classifyJob failed or circuit OPEN; using manual fallback');
        return fallback;
      }
    );
  }

  /**
   * Extract skills, languages, and bio summary from worker text or audio transcript.
   * Circuit breaker protected with safe fallback to form input.
   */
  async extractWorkerProfile(
    textOrTranscript: string,
    options?: AIRequestOptions
  ): Promise<ExtractedProfileResult> {
    const fallback: ExtractedProfileResult = {
      suggestedSkills: [],
      languages: ['en'],
      bio: textOrTranscript.trim(),
      confidence: 0,
    };

    return this.breaker.execute(
      async () => {
        return retrySafeOperation(async () => {
          const raw = await this.getProvider().extractWorkerProfile(textOrTranscript, options);
          return extractedProfileOutputSchema.parse(raw) as ExtractedProfileResult;
        });
      },
      () => {
        logger.warn('AI extractWorkerProfile failed or circuit OPEN; falling back to raw form input');
        return fallback;
      }
    );
  }

  /**
   * Produce a clear, simplified summary of a job description for field workers.
   */
  async simplifyJobDescription(
    rawText: string,
    options?: AIRequestOptions
  ): Promise<SimplifiedJobDescriptionResult> {
    const fallback: SimplifiedJobDescriptionResult = {
      simplifiedText: rawText.trim(),
      keyTasks: [],
      language: 'en',
    };

    return this.breaker.execute(
      async () => {
        return retrySafeOperation(async () => {
          const raw = await this.getProvider().simplifyJobDescription(rawText, options);
          return simplifiedJobDescriptionOutputSchema.parse(raw) as SimplifiedJobDescriptionResult;
        });
      },
      () => {
        logger.warn('AI simplifyJobDescription failed; falling back to canonical text');
        return fallback;
      }
    );
  }

  /**
   * Translate text into target language.
   * CRITICAL FALLBACK RULE: Translation failure MUST return canonical content with isFallback: true.
   */
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'en',
    options?: AIRequestOptions
  ): Promise<TranslationResult> {
    const fallback: TranslationResult = {
      translatedText: text,
      sourceLanguage,
      targetLanguage,
      isFallback: true,
    };

    return this.breaker.execute(
      async () => {
        return retrySafeOperation(async () => {
          const raw = await this.getProvider().translateText(
            text,
            targetLanguage,
            sourceLanguage,
            options
          );
          return translationOutputSchema.parse(raw) as TranslationResult;
        });
      },
      () => {
        logger.warn(
          { sourceLanguage, targetLanguage },
          'AI translation failed; returning canonical content fallback'
        );
        return fallback;
      }
    );
  }

  /**
   * Guardrail: Strict prevention of AI taking unauthorized actions.
   */
  public assertNoDirectAdministrativeAction(action: string): void {
    const FORBIDDEN_AI_ACTIONS = [
      'APPROVE_VERIFICATION',
      'ASSIGN_WORKER',
      'MODIFY_FINANCIAL_LEDGER',
      'BAN_USER',
      'RESOLVE_DISPUTE',
    ];

    if (FORBIDDEN_AI_ACTIONS.includes(action.toUpperCase())) {
      throw new Error(
        `Security Policy Violation: AI is strictly prohibited from executing '${action}'. Irreversible administrative and financial decisions require human authorization.`
      );
    }
  }

  /**
   * Get provider health and circuit breaker status.
   */
  public getStatus(): AIProviderStatus {
    const provider = this.getProvider();
    const breakerStatus = this.breaker.getStatus();

    return {
      providerName: provider.name,
      available: breakerStatus.state !== 'OPEN',
      circuitBreaker: breakerStatus,
    };
  }

  /**
   * Helper to inspect circuit breaker directly (for testing).
   */
  public getCircuitBreaker(): CircuitBreaker {
    return this.breaker;
  }
}

export const aiService = new AIService();
