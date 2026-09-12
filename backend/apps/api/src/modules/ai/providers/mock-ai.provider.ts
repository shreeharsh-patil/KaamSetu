import {
  JobUrgency,
  type IAIProvider,
  type AIRequestOptions,
  type JobClassificationResult,
  type ExtractedProfileResult,
  type SimplifiedJobDescriptionResult,
  type TranslationResult,
} from '@kaamsetu/types';

export class MockAIProvider implements IAIProvider {
  public readonly name: string = 'mock-ai';

  // Test hooks for simulating provider faults
  private simulatedFailures: number = 0;
  private shouldTimeout: boolean = false;
  private returnInvalidOutput: boolean = false;

  public setSimulatedFailures(count: number): void {
    this.simulatedFailures = count;
  }

  public setShouldTimeout(val: boolean): void {
    this.shouldTimeout = val;
  }

  public setReturnInvalidOutput(val: boolean): void {
    this.returnInvalidOutput = val;
  }

  private async checkFaultHooks(options?: AIRequestOptions): Promise<void> {
    if (this.shouldTimeout) {
      const wait = (options?.timeoutMs ?? 5000) + 1000;
      await new Promise((resolve) => setTimeout(resolve, wait));
      throw new Error('AI provider connection timeout');
    }

    if (this.simulatedFailures > 0) {
      this.simulatedFailures--;
      throw new Error('Simulated upstream AI provider 503 error: Rate limit or service unavailable');
    }
  }

  /**
   * Classify job details into category, suggested skills, urgency, and estimated price.
   */
  async classifyJob(
    text: string,
    options?: AIRequestOptions
  ): Promise<JobClassificationResult> {
    await this.checkFaultHooks(options);

    if (this.returnInvalidOutput) {
      // Return broken shape to test Zod validation catching it
      return { confidence: 9999 } as unknown as JobClassificationResult;
    }

    const lower = text.toLowerCase();
    let categorySlug: string | undefined;
    let suggestedCategoryName: string | undefined;
    const suggestedSkills: string[] = [];
    let urgency = JobUrgency.FLEXIBLE;
    let estimatedPrice = 500;

    if (lower.includes('pipe') || lower.includes('tap') || lower.includes('leak') || lower.includes('plumb') || lower.includes('नल') || lower.includes('लीक') || lower.includes('plumber')) {
      categorySlug = 'plumbing';
      suggestedCategoryName = 'Plumbing Services';
      suggestedSkills.push('Pipe Repair', 'Tap Installation', 'Leak Detection');
      estimatedPrice = 600;
    } else if (lower.includes('wire') || lower.includes('switch') || lower.includes('light') || lower.includes('fan') || lower.includes('electric') || lower.includes('बिजली') || lower.includes('पंखा')) {
      categorySlug = 'electrical';
      suggestedCategoryName = 'Electrical Services';
      suggestedSkills.push('Wiring', 'Switchboard Repair', 'Appliance Installation');
      estimatedPrice = 750;
    } else if (lower.includes('clean') || lower.includes('wash') || lower.includes('mop') || lower.includes('dust')) {
      categorySlug = 'cleaning';
      suggestedCategoryName = 'Home Cleaning';
      suggestedSkills.push('Deep Cleaning', 'Floor Scrubbing', 'Kitchen Cleaning');
      estimatedPrice = 1000;
    } else if (lower.includes('paint') || lower.includes('wall') || lower.includes('distemper')) {
      categorySlug = 'painting';
      suggestedCategoryName = 'Painting & Whitewash';
      suggestedSkills.push('Interior Painting', 'Wall Putty', 'Texture Painting');
      estimatedPrice = 2500;
    }

    if (lower.includes('urgent') || lower.includes('immediate') || lower.includes('burst') || lower.includes('emergency') || lower.includes('तुरंत')) {
      urgency = JobUrgency.EMERGENCY;
    } else if (lower.includes('today') || lower.includes('आज') || lower.includes('aaj')) {
      urgency = JobUrgency.TODAY;
    }

    const timingIntent = lower.includes('tomorrow') || lower.includes('कल') ? 'TOMORROW'
      : lower.includes('today') || lower.includes('आज') || lower.includes('aaj') ? 'TODAY'
      : lower.includes('asap') || lower.includes('immediate') || lower.includes('jaldi') ? 'ASAP' : undefined;
    const firstSentence = text.split(/[.?!।]/)[0]?.trim();
    const conciseTitle = lower.match(/kitchen.*sink.*(leak|drip)|sink.*(leak|drip)/)
      ? 'Kitchen sink leaking'
      : lower.match(/bathroom.*(tap|pipe).*(leak|drip)|tap.*(leak|drip)/)
        ? 'Bathroom tap leaking'
        : lower.match(/fan.*(not working|stopped|broken)/)
          ? 'Fan not working'
          : categorySlug === 'plumbing'
            ? 'Plumbing repair needed'
            : categorySlug === 'electrical'
              ? 'Electrical repair needed'
              : undefined;

    return {
      categorySlug,
      suggestedCategoryName,
      suggestedSkills,
      urgency,
      estimatedPrice,
      timingIntent,
      title: conciseTitle ?? (categorySlug && firstSentence ? firstSentence.slice(0, 80) : undefined),
      description: text.trim(),
      problemSummary: firstSentence,
      confidence: categorySlug ? 0.88 : 0.2,
    };
  }

  /**
   * Extract skills, languages, and bio summary from worker's introductory input.
   */
  async extractWorkerProfile(
    textOrTranscript: string,
    options?: AIRequestOptions
  ): Promise<ExtractedProfileResult> {
    await this.checkFaultHooks(options);

    if (this.returnInvalidOutput) {
      return { confidence: -5 } as unknown as ExtractedProfileResult;
    }

    const lower = textOrTranscript.toLowerCase();
    const suggestedSkills: string[] = [];
    const languages: string[] = ['en'];

    if (lower.includes('hindi') || lower.includes('हिंदी')) languages.push('hi');
    if (lower.includes('kannada') || lower.includes('ಕನ್ನಡ')) languages.push('kn');
    if (lower.includes('tamil') || lower.includes('தமிழ்')) languages.push('ta');
    if (lower.includes('telugu') || lower.includes('తెలుగు')) languages.push('te');

    if (lower.includes('plumb') || lower.includes('pipe') || lower.includes('tap')) {
      suggestedSkills.push('Plumbing', 'Pipe Fitting');
    }
    if (lower.includes('electric') || lower.includes('wire')) {
      suggestedSkills.push('Electrical Wiring', 'Circuit Repair');
    }
    if (lower.includes('clean') || lower.includes('housekeeping')) {
      suggestedSkills.push('Deep Cleaning', 'Sanitization');
    }
    if (lower.includes('carpenter') || lower.includes('wood') || lower.includes('furniture')) {
      suggestedSkills.push('Carpentry', 'Furniture Assembly');
    }

    // Extract years of experience if mentioned
    let experienceYears: number | undefined;
    const expMatch = textOrTranscript.match(/(\d+)\s*(?:years?|yrs?)/i);
    if (expMatch && expMatch[1]) {
      experienceYears = Math.min(60, Math.max(0, parseInt(expMatch[1], 10)));
    }

    return {
      suggestedSkills,
      languages: Array.from(new Set(languages)),
      bio: textOrTranscript.trim(),
      experienceYears,
      confidence: 0.85,
    };
  }

  /**
   * Produce a clear, jargon-free summary of a job description for field workers.
   */
  async simplifyJobDescription(
    rawText: string,
    options?: AIRequestOptions
  ): Promise<SimplifiedJobDescriptionResult> {
    await this.checkFaultHooks(options);

    const sentences = rawText
      .split(/[.\n;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const keyTasks = sentences.slice(0, 3);
    const simplifiedText =
      keyTasks.length > 0
        ? keyTasks.join('. ') + '.'
        : rawText.trim();

    return {
      simplifiedText,
      keyTasks,
      language: 'en',
    };
  }

  /**
   * Translate text into target language.
   */
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'en',
    options?: AIRequestOptions
  ): Promise<TranslationResult> {
    await this.checkFaultHooks(options);

    const target = targetLanguage.toLowerCase();
    const source = sourceLanguage.toLowerCase();

    if (target === source || !text.trim()) {
      return {
        translatedText: text,
        sourceLanguage: source,
        targetLanguage: target,
        isFallback: false,
      };
    }

    const lower = text.toLowerCase().trim();

    const DICTIONARY: Record<string, Record<string, string>> = {
      hi: {
        'kitchen tap burst repair': 'रसोई के नल के फटने की मरम्मत',
        'deep cleaning': 'गहरी सफाई सेवा',
        'urgent pipe leakage': 'तुरंत पाइप रिसाव मरम्मत',
        'electrical wiring fix': 'बिजली के तारों की मरम्मत',
        'hello': 'नमस्ते',
        'thank you': 'धन्यवाद',
      },
      kn: {
        'kitchen tap burst repair': 'ಅಡುಗೆಮನೆಯ ನಲ್ಲಿ ದುರಸ್ತಿ',
        'deep cleaning': 'ಮನೆ ಸ್ವಚ್ಛತೆ ಸೇವೆ',
        'urgent pipe leakage': 'ತುರ್ತು ಪೈಪ್ ಸೋರಿಕೆ ದುರಸ್ತಿ',
        'hello': 'ನಮಸ್ಕಾರ',
        'thank you': 'ಧನ್ಯವಾದಗಳು',
      },
      ta: {
        'kitchen tap burst repair': 'சமையலறை குழாய் பழுது',
        'deep cleaning': 'ஆழமான சுத்தம் செய்யும் சேவை',
        'hello': 'வணக்கம்',
        'thank you': 'நன்றி',
      },
    };

    const translated = DICTIONARY[target]?.[lower] ?? `[${target.toUpperCase()}] ${text}`;

    return {
      translatedText: translated,
      sourceLanguage: source,
      targetLanguage: target,
      isFallback: false,
    };
  }
}

export const mockAIProvider = new MockAIProvider();
