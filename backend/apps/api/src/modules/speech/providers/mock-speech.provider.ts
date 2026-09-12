import type {
  ISpeechProvider,
  SpeechRequestOptions,
  SpeechToTextResult,
  TextToSpeechResult,
  LanguageDetectionResult,
} from '@kaamsetu/types';

export class MockSpeechProvider implements ISpeechProvider {
  public readonly name: string = 'mock-speech';

  private simulatedFailures: number = 0;
  private shouldTimeout: boolean = false;

  public setSimulatedFailures(count: number): void {
    this.simulatedFailures = count;
  }

  public setShouldTimeout(val: boolean): void {
    this.shouldTimeout = val;
  }

  private async checkFaultHooks(options?: SpeechRequestOptions): Promise<void> {
    if (this.shouldTimeout) {
      const wait = (options?.timeoutMs ?? 5000) + 1000;
      await new Promise((resolve) => setTimeout(resolve, wait));
      throw new Error('Speech provider connection timeout');
    }

    if (this.simulatedFailures > 0) {
      this.simulatedFailures--;
      throw new Error('Simulated upstream speech service error (503 Service Unavailable)');
    }
  }

  /**
   * Convert audio buffer / base64 to text transcript with language detection.
   */
  async speechToText(
    audioData: Uint8Array | string,
    _mimeType: string = 'audio/wav',
    options?: SpeechRequestOptions
  ): Promise<SpeechToTextResult> {
    await this.checkFaultHooks(options);

    // If string input contains recognizable hints or mock payload
    let strData = '';
    if (typeof audioData === 'string') {
      strData = audioData;
      try {
        strData += ' ' + Buffer.from(audioData, 'base64').toString('utf-8');
      } catch {
        // ignore base64 decoding error
      }
    } else if (audioData instanceof Uint8Array) {
      try {
        strData = Buffer.from(audioData).toString('utf-8');
      } catch {
        // ignore conversion error
      }
    }

    let transcript = 'I need emergency plumbing repair for my kitchen tap';
    let detectedLanguage = 'en';

    if (strData.includes('hindi') || strData.includes('नल')) {
      transcript = 'मुझे नल की मरम्मत के लिए प्लंबर चाहिए';
      detectedLanguage = 'hi';
    } else if (strData.includes('kannada') || strData.includes('ನಲ್ಲಿ')) {
      transcript = 'ನನಗೆ ಪ್ಲಂಬರ್ ಕೆಲಸ ಬೇಕಾಗಿದೆ';
      detectedLanguage = 'kn';
    }

    return {
      transcript,
      detectedLanguage,
      confidence: 0.92,
    };
  }

  /**
   * Synthesize text to speech audio.
   */
  async textToSpeech(
    text: string,
    language: string = 'en',
    options?: SpeechRequestOptions
  ): Promise<TextToSpeechResult> {
    await this.checkFaultHooks(options);

    // Mock audio MP3 base64 header
    const mockAudioBase64 = Buffer.from(`MOCK_AUDIO_${language}_${text.slice(0, 30)}`).toString('base64');
    const estimatedDurationMs = Math.max(1000, Math.round((text.split(/\s+/).length / 2.5) * 1000));

    return {
      audioBase64: mockAudioBase64,
      mimeType: 'audio/mp3',
      durationMs: estimatedDurationMs,
    };
  }

  /**
   * Detect language from text or audio input.
   */
  async detectLanguage(
    input: string | Uint8Array,
    options?: SpeechRequestOptions
  ): Promise<LanguageDetectionResult> {
    await this.checkFaultHooks(options);

    const text = typeof input === 'string' ? input : '';

    // Unicode block detection for Indic languages
    if (/[\u0900-\u097F]/.test(text)) {
      return { languageCode: 'hi', confidence: 0.98 }; // Devanagari (Hindi/Marathi)
    }
    if (/[\u0C80-\u0CFF]/.test(text)) {
      return { languageCode: 'kn', confidence: 0.98 }; // Kannada
    }
    if (/[\u0B80-\u0BFF]/.test(text)) {
      return { languageCode: 'ta', confidence: 0.98 }; // Tamil
    }
    if (/[\u0C00-\u0C7F]/.test(text)) {
      return { languageCode: 'te', confidence: 0.98 }; // Telugu
    }

    return { languageCode: 'en', confidence: 0.95 };
  }
}

export const mockSpeechProvider = new MockSpeechProvider();
