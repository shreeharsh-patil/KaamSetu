import type { IAIProvider } from '@kaamsetu/types';
import { mockAIProvider } from './mock-ai.provider.js';

export class AIProviderRegistry {
  private providers: Map<string, IAIProvider> = new Map();
  private activeProviderName: string = 'mock-ai';

  constructor() {
    this.register(mockAIProvider);
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
}

export const aiProviderRegistry = new AIProviderRegistry();
