"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, RotateCcw, Check, AlertTriangle, Loader2, Sparkles, Volume2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { env } from "@/config/env";
import { convertBlobToWav, PcmAudioRecorder } from "@/lib/audio/wav-encoder";

export type VoiceRecorderState =
  | "IDLE"
  | "REQUESTING_PERMISSION"
  | "RECORDING"
  | "PROCESSING"
  | "SUCCESS"
  | "ERROR";

export interface VoiceRecorderProps {
  onConfirmText: (extractedText: string) => void;
  title?: string;
  description?: string;
  placeholderPrompt?: string;
  maxDurationSec?: number;
}

const SUPPORTED_LANGUAGES = [
  { code: "auto", label: "🌐 Auto Detect (Marathi / Hindi / English / Any)" },
  { code: "mr-IN", label: "मराठी (Marathi)" },
  { code: "hi-IN", label: "हिंदी (Hindi)" },
  { code: "en-IN", label: "English" },
  { code: "kn-IN", label: "ಕನ್ನಡ (Kannada)" },
  { code: "ta-IN", label: "தமிழ் (Tamil)" },
  { code: "te-IN", label: "తెలుగు (Telugu)" },
  { code: "bn-IN", label: "বাংলা (Bengali)" },
  { code: "gu-IN", label: "ગુજરાતી (Gujarati)" },
];

function formatLanguageLabel(lang: string): string {
  const l = lang.toLowerCase();
  if (l.includes("marathi") || l === "mr" || l === "mr-in") return "मराठी (Marathi)";
  if (l.includes("hindi") || l === "hi" || l === "hi-in") return "हिंदी (Hindi)";
  if (l.includes("english") || l === "en" || l === "en-in" || l === "en-us") return "English";
  if (l.includes("kannada") || l === "kn" || l === "kn-in") return "ಕನ್ನಡ (Kannada)";
  if (l.includes("tamil") || l === "ta" || l === "ta-in") return "தமிழ் (Tamil)";
  if (l.includes("telugu") || l === "te" || l === "te-in") return "తెలుగు (Telugu)";
  if (l.includes("bengali") || l === "bn" || l === "bn-in") return "বাংলা (Bengali)";
  if (l.includes("gujarati") || l === "gu" || l === "gu-in") return "ગુજરાતી (Gujarati)";
  if (l.includes("punjabi") || l === "pa" || l === "pa-in") return "ਪੰਜਾਬੀ (Punjabi)";
  return lang;
}

export function VoiceRecorder({
  onConfirmText,
  title = "Voice Input Assistant",
  description = "Speak in English, Marathi (मराठी), Hindi (हिंदी), or your native language. The AI will automatically detect your language and output your text accordingly.",
  placeholderPrompt = "e.g., 'माझ्या घराचा टॅप लीक होतो आहे' or 'Bathroom ka tap leak ho raha hai' or 'Kitchen tap is leaking'",
  maxDurationSec = 60,
}: VoiceRecorderProps) {
  const [state, setState] = useState<VoiceRecorderState>("IDLE");
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedTranscript, setExtractedTranscript] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("auto");
  const [detectedLanguageLabel, setDetectedLanguageLabel] = useState<string | null>(null);
  const [livePreviewText, setLivePreviewText] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const pcmRecorderRef = useRef<PcmAudioRecorder | null>(null);
  const directWavBlobRef = useRef<Blob | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const liveTranscriptRef = useRef<string>("");
  const isManuallyStoppedRef = useRef<boolean>(false);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (pcmRecorderRef.current) {
      try {
        pcmRecorderRef.current.stop();
      } catch {
        // ignore
      }
      pcmRecorderRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startRecording = async () => {
    cleanup();
    setState("REQUESTING_PERMISSION");
    setErrorMessage(null);
    audioChunksRef.current = [];
    liveTranscriptRef.current = "";
    setLivePreviewText("");
    setDetectedLanguageLabel(null);
    isManuallyStoppedRef.current = false;

    if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
      setState("ERROR");
      setErrorMessage("Microphone audio is not supported in this browser. Please use text input.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 1. Direct Web Audio API 16kHz PCM capture (uncompressed, flawless WAV)
      try {
        const pcm = new PcmAudioRecorder(16000);
        pcm.start(stream);
        pcmRecorderRef.current = pcm;
      } catch (pcmErr) {
        console.warn("PCM direct recorder start notice:", pcmErr);
      }

      // 2. Start browser Web Speech API for real-time speech preview and zero-latency fallback
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = selectedLanguage === "auto" ? (navigator.language || "hi-IN") : selectedLanguage;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recognition.onresult = (event: any) => {
            let fullTranscript = "";
            for (let i = 0; i < event.results.length; ++i) {
              const item = event.results[i];
              if (item && item[0]) {
                fullTranscript += item[0].transcript + " ";
              }
            }
            const clean = fullTranscript.trim();
            if (clean) {
              liveTranscriptRef.current = clean;
              setLivePreviewText(clean);
            }
          };

          recognition.onerror = (e: unknown) => {
            console.warn("SpeechRecognition notice:", e);
          };

          recognition.onend = () => {
            if (!isManuallyStoppedRef.current && state === "RECORDING") {
              try {
                recognition.start();
              } catch {
                // ignore
              }
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (speechErr) {
          console.warn("Could not start Web Speech Recognition:", speechErr);
        }
      }

      // 3. MediaRecorder as secondary fallback
      try {
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "audio/wav";

        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          finalizeVoiceCapture();
        };

        recorder.start(250);
      } catch (recErr) {
        console.warn("MediaRecorder init notice:", recErr);
      }

      setState("RECORDING");
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= maxDurationSec - 1) {
            stopRecording();
            return maxDurationSec;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: unknown) {
      setState("ERROR");
      const errName = err instanceof Error ? err.name : "";
      if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
        setErrorMessage("Microphone permission denied. Please allow microphone access in your browser address bar.");
      } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
        setErrorMessage("No microphone detected on your system. Please plug in a microphone or type below.");
      } else {
        setErrorMessage("Could not access microphone. Please type your requirement or try again.");
      }
    }
  };

  const stopRecording = () => {
    isManuallyStoppedRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (pcmRecorderRef.current) {
      try {
        directWavBlobRef.current = pcmRecorderRef.current.stop();
      } catch (pcmErr) {
        console.warn("PCM recorder stop notice:", pcmErr);
      }
      pcmRecorderRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    } else {
      finalizeVoiceCapture();
    }
  };

  const finalizeVoiceCapture = async () => {
    setState("PROCESSING");

    let finalTranscript = "";
    let detectedLangName = "";

    try {
      let wavBlob: Blob | null = null;
      if (directWavBlobRef.current && directWavBlobRef.current.size > 500) {
        wavBlob = directWavBlobRef.current;
      } else if (audioChunksRef.current.length > 0) {
        const rawBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        wavBlob = await convertBlobToWav(rawBlob);
      }

      if (wavBlob && wavBlob.size > 200) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const res = reader.result as string;
            const base64 = res.includes(",") ? res.split(",")[1] : res;
            if (base64) resolve(base64);
            else reject(new Error("No base64 audio"));
          };
          reader.onerror = () => reject(new Error("Blob read error"));
        });
        reader.readAsDataURL(wavBlob);
        const base64Audio = await base64Promise;

        const apiUrl = `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/speech/transcribe`;
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audio: base64Audio,
            mimeType: "audio/wav",
            language: selectedLanguage !== "auto" ? selectedLanguage : undefined,
            hintText: selectedLanguage !== "auto" && liveTranscriptRef.current.trim() ? liveTranscriptRef.current.trim() : undefined,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.data?.transcript && json.data.transcript.trim()) {
            finalTranscript = json.data.transcript.trim();
            detectedLangName = json.data.detectedLanguage || "";
          }
        }
      }
    } catch (err) {
      console.warn("Backend Gemini speech-to-text notice:", err);
    }

    // High-fidelity fallback: if backend was unavailable or returned empty, use the browser-recognized speech
    if (!finalTranscript && liveTranscriptRef.current.trim()) {
      finalTranscript = liveTranscriptRef.current.trim();
      const text = finalTranscript;
      if (/[\u0900-\u097F]/.test(text)) {
        if (text.includes("आहे") || text.includes("नाही") || text.includes("माझे") || text.includes("माझ्या") || text.includes("करा") || text.includes("होतो") || text.includes("झाले") || text.includes("पाहिजे")) {
          detectedLangName = "मराठी (Marathi)";
        } else {
          detectedLangName = "हिंदी (Hindi)";
        }
      } else if (/[\u0C80-\u0CFF]/.test(text)) {
        detectedLangName = "ಕನ್ನಡ (Kannada)";
      } else if (/[\u0B80-\u0BFF]/.test(text)) {
        detectedLangName = "தமிழ் (Tamil)";
      } else if (/[\u0C00-\u0C7F]/.test(text)) {
        detectedLangName = "తెలుగు (Telugu)";
      } else if (/[\u0A80-\u0AFF]/.test(text)) {
        detectedLangName = "ગુજરાતી (Gujarati)";
      } else if (/[\u0980-\u09FF]/.test(text)) {
        detectedLangName = "বাংলা (Bengali)";
      } else {
        detectedLangName = selectedLanguage !== "auto" ? selectedLanguage : "English";
      }
    }

    if (!finalTranscript) {
      setState("ERROR");
      setErrorMessage("No clear speech detected. Please speak clearly into your microphone and try again.");
      return;
    }

    setExtractedTranscript(finalTranscript);
    if (detectedLangName) {
      setDetectedLanguageLabel(formatLanguageLabel(detectedLangName));
    }
    setState("SUCCESS");
  };

  const handleReset = () => {
    cleanup();
    setState("IDLE");
    setDuration(0);
    setExtractedTranscript("");
    setErrorMessage(null);
    setLivePreviewText("");
    setDetectedLanguageLabel(null);
    isManuallyStoppedRef.current = false;
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" /> {title}
          </CardTitle>
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              disabled={state === "RECORDING"}
              className="text-[11px] font-medium bg-muted/70 border border-border rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[220px]"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {state === "IDLE" && (
          <div className="text-center py-6 space-y-4">
            <div className="p-4 rounded-xl bg-muted/40 border border-dashed text-xs text-muted-foreground max-w-sm mx-auto">
              <span className="font-semibold block text-foreground mb-1">Example Prompts:</span>
              <div className="space-y-1 text-left">
                <p>• <strong>English:</strong> &ldquo;My kitchen sink is leaking, need a plumber urgently.&rdquo;</p>
                <p>• <strong>मराठी:</strong> &ldquo;माझ्या घराचा टॅप लीक होतो आहे, वायरमन किंवा प्लंबर हवा आहे.&rdquo;</p>
                <p>• <strong>हिंदी:</strong> &ldquo;कमरे का पंखा नहीं चल रहा है, इलेक्ट्रीशियन भेजो.&rdquo;</p>
              </div>
            </div>

            <Button size="lg" onClick={startRecording} className="gap-2 px-6 shadow-md hover:shadow-lg transition-all">
              <Mic className="h-5 w-5 animate-pulse text-amber-300" /> Tap to Start Speaking
            </Button>
          </div>
        )}

        {state === "REQUESTING_PERMISSION" && (
          <div className="text-center py-8 space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm font-medium">Requesting microphone access...</p>
            <p className="text-xs text-muted-foreground">Please tap &ldquo;Allow&rdquo; in your browser prompt.</p>
          </div>
        )}

        {state === "RECORDING" && (
          <div className="text-center py-6 space-y-4">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
              <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                <Volume2 className="h-6 w-6 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-mono text-xl font-bold text-foreground">
                {formatTimer(duration)}
              </div>
              <p className="text-xs text-muted-foreground">
                Listening to your voice... Speak in English, Marathi, Hindi, or any language.
              </p>
            </div>

            {livePreviewText ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 font-medium max-w-md mx-auto shadow-sm">
                &ldquo;{livePreviewText}&rdquo;
              </div>
            ) : (
              <div className="text-[11px] text-muted-foreground italic">
                (Waiting for speech... speak now)
              </div>
            )}

            <Button variant="destructive" onClick={stopRecording} className="gap-2 px-6">
              <Square className="h-4 w-4" /> Stop & Transcribe
            </Button>
          </div>
        )}

        {state === "PROCESSING" && (
          <div className="text-center py-8 space-y-3">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Sparkles className="h-5 w-5 animate-spin" />
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-foreground">Detecting language & transcribing with Gemini AI...</p>
            <p className="text-xs text-muted-foreground">Converting speech to exact native script (Marathi / Hindi / English)...</p>
          </div>
        )}

        {state === "ERROR" && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage || "An error occurred with voice capture."}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Try Again
            </Button>
          </div>
        )}

        {state === "SUCCESS" && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">What Was Heard in Your Language:</span>
              {detectedLanguageLabel && (
                <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] uppercase font-mono">
                  Detected: {detectedLanguageLabel}
                </Badge>
              )}
            </div>

            <Textarea
              rows={3}
              value={extractedTranscript}
              onChange={(e) => setExtractedTranscript(e.target.value)}
              className="text-xs font-medium"
              placeholder={placeholderPrompt || "Your requirement text..."}
            />
            <p className="text-[11px] text-muted-foreground">
              Your exact spoken language has been captured above. You can edit any words if needed before applying.
            </p>
          </div>
        )}
      </CardContent>

      {state === "SUCCESS" && (
        <CardFooter className="flex gap-2 justify-between pt-0">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Speak Again
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onConfirmText(extractedTranscript);
              handleReset();
            }}
          >
            <Check className="mr-1 h-3.5 w-3.5" /> Apply Extracted Text
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
