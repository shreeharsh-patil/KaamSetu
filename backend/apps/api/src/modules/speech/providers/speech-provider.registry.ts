import type { ISpeechProvider } from '@kaamsetu/types';
import { mockSpeechProvider } from './mock-speech.provider.js';

export class SpeechProviderRegistry {
  private providers: Map<string, ISpeechProvider> = new Map();
  private activeProviderName: string = 'mock-speech';

  constructor() {
    this.register(mockSpeechProvider);
  }

  public register(provider: ISpeechProvider): void {
    this.providers.set(provider.name, provider);
  }

  public setActiveProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Speech Provider '${name}' is not registered`);
    }
    this.activeProviderName = name;
  }

  public getActiveProvider(): ISpeechProvider {
    const provider = this.providers.get(this.activeProviderName);
    if (!provider) {
      return mockSpeechProvider;
    }
    return provider;
  }
}

export const speechProviderRegistry = new SpeechProviderRegistry();
