import type {
  ISpeechProvider,
  SpeechRequestOptions,
  SpeechToTextResult,
  TextToSpeechResult,
  LanguageDetectionResult,
  AIProviderStatus,
} from '@kaamsetu/types';
import {
  speechToTextOutputSchema,
  textToSpeechOutputSchema,
  languageDetectionOutputSchema,
} from '@kaamsetu/validation';
import { speechProviderRegistry } from './providers/speech-provider.registry.js';
import { CircuitBreaker } from '../ai/circuit-breaker.js';
import { retrySafeOperation } from '../ai/retry.util.js';
import { logger } from '../../config/index.js';

export class SpeechService {
  private readonly breaker: CircuitBreaker;

  constructor(
    private readonly providerRegistry = speechProviderRegistry,
    breakerOptions = { name: 'SpeechService', failureThreshold: 3, cooldownPeriodMs: 20000, timeoutMs: 8000 }
  ) {
    this.breaker = new CircuitBreaker(breakerOptions);
  }

  private getProvider(): ISpeechProvider {
    return this.providerRegistry.getActiveProvider();
  }

  /**
   * Transcribe speech audio to text with language detection.
   */
  async speechToText(
    audioData: Uint8Array | string,
    mimeType: string = 'audio/wav',
    options?: SpeechRequestOptions
  ): Promise<SpeechToTextResult> {
    const fallback: SpeechToTextResult = {
      transcript: '',
      confidence: 0,
    };

    return this.breaker.execute(
      async () => {
        return retrySafeOperation(async () => {
          const raw = await this.getProvider().speechToText(audioData, mimeType, options);
          return speechToTextOutputSchema.parse(raw) as SpeechToTextResult;
        });
      },
      () => {
        logger.warn('SpeechToText failed or circuit OPEN; returning empty transcript fallback');
        return fallback;
      }
    );
  }

  /**
   * Synthesize text to speech audio.
   */
  async textToSpeech(
    text: string,
    language: string = 'en',
    options?: SpeechRequestOptions
  ): Promise<TextToSpeechResult> {
    return this.breaker.execute(async () => {
      const raw = await this.getProvider().textToSpeech(text, language, options);
      return textToSpeechOutputSchema.parse(raw) as TextToSpeechResult;
    });
  }

  /**
   * Detect language from text or audio.
   */
  async detectLanguage(
    input: string | Uint8Array,
    options?: SpeechRequestOptions
  ): Promise<LanguageDetectionResult> {
    const fallback: LanguageDetectionResult = {
      languageCode: 'en',
      confidence: 0.5,
    };

    return this.breaker.execute(
      async () => {
        return retrySafeOperation(async () => {
          const raw = await this.getProvider().detectLanguage(input, options);
          return languageDetectionOutputSchema.parse(raw) as LanguageDetectionResult;
        });
      },
      () => {
        logger.warn('Language detection failed; defaulting to English fallback');
        return fallback;
      }
    );
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
   * Access breaker directly for testing.
   */
  public getCircuitBreaker(): CircuitBreaker {
    return this.breaker;
  }
}

export const speechService = new SpeechService();
