import type { IAIProvider } from '@kaamsetu/types';
import { mockAIProvider } from './mock-ai.provider.js';
import { geminiAIProvider } from './gemini-ai.provider.js';

export class AIProviderRegistry {
  private providers: Map<string, IAIProvider> = new Map();
  private activeProviderName: string = 'mock-ai';

  constructor() {
    this.register(mockAIProvider);
    this.register(geminiAIProvider);

    // If GEMINI_API_KEY is configured, activate Gemini AI provider by default
    if (process.env['GEMINI_API_KEY'] && process.env['GEMINI_API_KEY'].trim().length > 0) {
      this.activeProviderName = 'gemini-ai';
    }
  }

  public register(provider: IAIProvider): void {
    this.providers.set(provider.name, provider);
  }

  public setActiveProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`AI Provider '${name}' is not registered`);
    }
    this.activeProviderName = name;
  }

  public getActiveProvider(): IAIProvider {
    const provider = this.providers.get(this.activeProviderName);
    if (!provider) {
      return mockAIProvider;
    }
    return provider;
  }

  public getActiveProviderName(): string {
    return this.activeProviderName;
  }
}

export const aiProviderRegistry = new AIProviderRegistry();
