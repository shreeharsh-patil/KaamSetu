import { logger } from '../../../config/index.js';

export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface GeminiContent {
  parts: GeminiPart[];
}

export interface GeminiGenerateOptions {
  responseMimeType?: 'application/json' | 'text/plain';
  systemInstruction?: string;
  timeoutMs?: number;
  temperature?: number;
}

export class GeminiClient {
  private readonly apiKey: string;
  private readonly priorityModel: string;
  private readonly backupModels: string[];

  constructor(apiKey?: string, priorityModel?: string, backupModel?: string) {
    this.apiKey = apiKey || process.env['GEMINI_API_KEY'] || '';
    this.priorityModel = priorityModel || process.env['GEMINI_MODEL'] || 'gemini-3.8-flash';
    const backup = backupModel || process.env['GEMINI_BACKUP_MODEL'] || 'gemini-3.5-flash';
    this.backupModels = [backup, 'gemini-2.5-flash', 'gemini-flash-latest'];
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Generates content using Gemini with automatic priority -> backup model fallback.
   * Priority: gemini-3.8-flash
   * Backup: gemini-3.5-flash / gemini-2.5-flash / gemini-flash-latest
   */
  public async generateContent(
    contents: GeminiContent[],
    options: GeminiGenerateOptions = {}
  ): Promise<{ text: string; modelUsed: string }> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key is not configured');
    }

    const candidateModels = [this.priorityModel, ...this.backupModels.filter((m) => m !== this.priorityModel)];
    let lastError: Error | null = null;

    for (let i = 0; i < candidateModels.length; i++) {
      const model = candidateModels[i] as string;
      const isPriority = i === 0;

      try {
        const timeoutMs = isPriority ? 5000 : (options.timeoutMs ?? 10000);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const bodyPayload: Record<string, unknown> = {
          contents,
          generationConfig: {
            temperature: options.temperature ?? 0.2,
          },
        };

        if (options.responseMimeType) {
          (bodyPayload['generationConfig'] as Record<string, unknown>)['responseMimeType'] =
            options.responseMimeType;
        }

        if (options.systemInstruction) {
          bodyPayload['systemInstruction'] = {
            parts: [{ text: options.systemInstruction }],
          };
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (!response.ok) {
          const errData = (await response.json().catch(() => ({}))) as { error?: { code?: number; message?: string } };
          const errMsg = errData.error?.message || `HTTP ${response.status} ${response.statusText}`;
          throw new Error(`Gemini API error [${model}] (${response.status}): ${errMsg}`);
        }

        const result = (await response.json()) as {
          candidates?: Array<{
            content?: {
              parts?: Array<{ text?: string }>;
            };
          }>;
        };

        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error(`Gemini API model [${model}] returned empty candidates`);
        }

        return { text, modelUsed: model };
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        lastError = error;
        logger.warn(
          { model, error: error.message, isPriority },
          `Gemini model ${model} failed or timed out. Trying backup model...`
        );
      }
    }

    throw new Error(`All Gemini models failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }
}

export const geminiClient = new GeminiClient();
