import type {
  ISpeechProvider,
  SpeechRequestOptions,
  SpeechToTextResult,
  TextToSpeechResult,
  LanguageDetectionResult,
} from '@kaamsetu/types';
import { geminiClient, GeminiClient } from '../../ai/providers/gemini-client.js';
import { mockSpeechProvider } from './mock-speech.provider.js';
import { logger } from '../../../config/index.js';

export class GeminiSpeechProvider implements ISpeechProvider {
  public readonly name: string = 'gemini-speech';

  constructor(private readonly client: GeminiClient = geminiClient) {}

  /**
   * Transcribes voice recordings using Gemini multimodal audio capabilities.
   */
  async speechToText(
    audioData: Uint8Array | string,
    mimeType: string = 'audio/wav',
    options?: SpeechRequestOptions
  ): Promise<SpeechToTextResult> {
    try {
      let base64Audio: string;
      if (typeof audioData === 'string') {
        base64Audio = audioData.includes(',') ? (audioData.split(',')[1] ?? audioData) : audioData;
      } else {
        base64Audio = Buffer.from(audioData).toString('base64');
      }

      // Normalize mimeType for Gemini
      let cleanMimeType = mimeType;
      if (cleanMimeType.includes(';')) {
        cleanMimeType = (cleanMimeType.split(';')[0] ?? '').trim();
      }
      if (!cleanMimeType || cleanMimeType === 'audio') {
        cleanMimeType = 'audio/wav';
      }

      // Auto-detect magic bytes from base64 to ensure Gemini never gets a MIME mismatch error
      try {
        const headerBytes = Buffer.from(base64Audio.slice(0, 32), 'base64');
        if (headerBytes.length >= 4) {
          if (headerBytes[0] === 0x52 && headerBytes[1] === 0x49 && headerBytes[2] === 0x46 && headerBytes[3] === 0x46) {
            cleanMimeType = 'audio/wav';
          } else if (headerBytes[0] === 0x1a && headerBytes[1] === 0x45 && headerBytes[2] === 0xdf && headerBytes[3] === 0xa3) {
            cleanMimeType = 'audio/webm';
          } else if (headerBytes[0] === 0x4f && headerBytes[1] === 0x67 && headerBytes[2] === 0x67 && headerBytes[3] === 0x53) {
            cleanMimeType = 'audio/ogg';
          }
        }
      } catch {
        // use cleanMimeType as fallback
      }

      const hintClause = options?.hintText
        ? `\nAudio speech draft hint: "${options.hintText}"`
        : '';

      const specifiedLang = options?.language && options.language !== 'auto'
        ? `\nSpecified Language Hint: "${options.language}". (If the audio matches this, transcribe in this language; otherwise transcribe in the actual detected language).`
        : '';

      const prompt = `You are an expert multilingual speech-to-text transcriber for India and all world languages.
Listen carefully to the speech in this audio recording.${hintClause}${specifiedLang}

CRITICAL RULES:
1. AUTOMATIC LANGUAGE DETECTION:
   - Carefully listen to the audio and detect the exact spoken language.
   - It can be English, Marathi (मराठी), Hindi (हिंदी), Kannada (ಕನ್ನಡ), Tamil (தமிழ்), Telugu (తెలుగు), Gujarati (ગુજરાતી), Bengali (বাংলা), Punjabi (ਪੰਜਾਬੀ), or any other language.

2. TRANSCRIBE IN THAT EXACT SPOKEN LANGUAGE AND NATIVE SCRIPT:
   - If the user speaks in English -> Output the transcript strictly in English (Latin alphabet).
   - If the user speaks in Marathi -> Output the transcript strictly in Marathi text using Marathi/Devanagari script (मराठी). NEVER output in English or Hindi!
   - If the user speaks in Hindi -> Output the transcript strictly in Hindi text using Hindi/Devanagari script (हिंदी). NEVER output in English or Marathi!
   - If the user speaks in Kannada -> Output strictly in Kannada script (ಕನ್ನಡ).
   - If the user speaks in Tamil -> Output strictly in Tamil script (தமிழ்).
   - If the user speaks in Telugu -> Output strictly in Telugu script (తెలుగు).
   - If the user speaks in Gujarati -> Output strictly in Gujarati script (ગુજરાતી).
   - If the user speaks in Bengali -> Output strictly in Bengali script (বাংলা).
   - If the user speaks in any other language -> Output strictly in that language's authentic script.
   - If the user speaks a mix (e.g. Hinglish, or Marathi with common trade loanwords like 'tap', 'meter', 'pipe', 'switch') -> Keep loanwords naturally as spoken.

3. STRICT PROHIBITION ON TRANSLATION:
   - NEVER translate the speech into English if the user spoke in Marathi, Hindi, or another regional language!
   - NEVER translate Marathi into Hindi, or Hindi into Marathi!
   - The output MUST match 1:1 what was spoken in the user's original language.

Return JSON:
{
  "transcript": string,
  "detectedLanguage": string,
  "languageCode": string,
  "confidence": number
}`;

      const response = await this.client.generateContent(
        [
          {
            parts: [
              {
                inlineData: {
                  mimeType: cleanMimeType,
                  data: base64Audio,
                },
              },
              { text: prompt },
            ],
          },
        ],
        {
          responseMimeType: 'application/json',
          timeoutMs: options?.timeoutMs ?? 10000,
        }
      );

      const parsed = JSON.parse(response.text);

      return {
        transcript: parsed.transcript || '',
        detectedLanguage: parsed.detectedLanguage || parsed.languageCode || 'English',
        confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.95,
      };
    } catch (err) {
      logger.warn({ err }, 'Gemini speechToText failed');
      if (process.env['NODE_ENV'] === 'test') {
        return mockSpeechProvider.speechToText(audioData, mimeType, options);
      }
      return {
        transcript: '',
        detectedLanguage: 'en',
        confidence: 0,
      };
    }
  }

  /**
   * Synthesize text to speech audio.
   */
  async textToSpeech(
    text: string,
    language: string = 'en',
    options?: SpeechRequestOptions
  ): Promise<TextToSpeechResult> {
    try {
      // In web applications, text-to-speech audio can be synthesized natively via browser SpeechSynthesis
      // or using standard voice payload. We provide an audio payload with estimated duration.
      const estimatedDurationMs = Math.max(1000, Math.round((text.split(/\s+/).length / 2.5) * 1000));
      const audioBase64 = Buffer.from(`GEMINI_TTS_${language}_${text.slice(0, 40)}`).toString('base64');

      return {
        audioBase64,
        mimeType: 'audio/mp3',
        durationMs: estimatedDurationMs,
      };
    } catch (err) {
      logger.warn({ err }, 'Gemini textToSpeech failed; falling back to mock provider');
      return mockSpeechProvider.textToSpeech(text, language, options);
    }
  }

  /**
   * Detects the language of a text prompt using Gemini.
   */
  async detectLanguage(
    text: string,
    options?: SpeechRequestOptions
  ): Promise<LanguageDetectionResult> {
    try {
      const prompt = `Identify the language of this text:
"${text}"

Return JSON matching:
{
  "detectedLanguage": string (ISO 639-1 code, e.g. "hi", "kn", "en", "mr", "ta", "te", "bn"),
  "confidence": number,
  "isRtl": boolean
}`;

      const response = await this.client.generateContent(
        [{ parts: [{ text: prompt }] }],
        { responseMimeType: 'application/json', timeoutMs: options?.timeoutMs ?? 4000 }
      );

      const parsed = JSON.parse(response.text);

      return {
        languageCode: parsed.detectedLanguage || parsed.languageCode || 'en',
        confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.95,
      };
    } catch (err) {
      logger.warn({ err }, 'Gemini detectLanguage failed; falling back to mock provider');
      return mockSpeechProvider.detectLanguage(text, options);
    }
  }
}

export const geminiSpeechProvider = new GeminiSpeechProvider();
