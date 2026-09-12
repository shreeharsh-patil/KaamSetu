"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, RotateCcw, Check, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

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

export function VoiceRecorder({
  onConfirmText,
  title = "Voice Input Assistant",
  description = "Speak in your local language to describe your requirement or profile.",
  placeholderPrompt = "e.g., 'Mera bathroom ka tap leak ho raha hai aur paani beh raha hai'",
  maxDurationSec = 60,
}: VoiceRecorderProps) {
  const [state, setState] = useState<VoiceRecorderState>("IDLE");
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedTranscript, setExtractedTranscript] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
      setState("ERROR");
      setErrorMessage("Voice recording is not supported by this browser. Please use keyboard entry.");
      return;
    }

    setState("REQUESTING_PERMISSION");
    setErrorMessage(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        processRecording();
      };

      recorder.start();
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
        setErrorMessage("Microphone permission denied. Please allow microphone access in browser settings.");
      } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
        setErrorMessage("No microphone found on this device.");
      } else {
        setErrorMessage("Could not start audio recording. Please try typing instead.");
      }
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const processRecording = () => {
    setState("PROCESSING");
    // Simulate audio transcription processing
    setTimeout(() => {
      // Provide realistic simulated transcription for local repair task
      setExtractedTranscript(
        "Bathroom ka pipe joint leak ho raha hai aur tap se paani tapak raha hai. Jaldi plumber chahiye."
      );
      setState("SUCCESS");
    }, 1500);
  };

  const handleReset = () => {
    setState("IDLE");
    setDuration(0);
    setExtractedTranscript("");
    setErrorMessage(null);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" /> {title}
          </CardTitle>
          <Badge variant="outline" className="text-[10px] uppercase font-semibold">
            Regional Voice
          </Badge>
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {state === "IDLE" && (
          <div className="text-center py-6 space-y-4">
            <div className="p-4 rounded-xl bg-muted/40 border border-dashed text-xs text-muted-foreground max-w-sm mx-auto">
              <span className="font-semibold block text-foreground mb-1">Example Prompt:</span>
              &ldquo;{placeholderPrompt}&rdquo;
            </div>

            <Button size="lg" onClick={startRecording} className="gap-2 px-6">
              <Mic className="h-5 w-5 animate-pulse" /> Tap to Start Speaking
            </Button>
          </div>
        )}

        {state === "REQUESTING_PERMISSION" && (
          <div className="text-center py-8 space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm font-medium">Requesting microphone access...</p>
            <p className="text-xs text-muted-foreground">Please tap &ldquo;Allow&rdquo; in the browser prompt.</p>
          </div>
        )}

        {state === "RECORDING" && (
          <div className="text-center py-6 space-y-4">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
              <div className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg">
                <Mic className="h-6 w-6" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-mono text-xl font-bold text-foreground">
                {formatTimer(duration)}
              </div>
              <p className="text-xs text-muted-foreground">
                Listening... Tap &ldquo;Stop&rdquo; when finished.
              </p>
            </div>

            <Button variant="destructive" onClick={stopRecording} className="gap-2">
              <Square className="h-4 w-4" /> Stop Recording
            </Button>
          </div>
        )}

        {state === "PROCESSING" && (
          <div className="text-center py-8 space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm font-medium text-foreground">Transcribing voice audio...</p>
            <p className="text-xs text-muted-foreground">Extracting problem details and urgency...</p>
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
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Extracted Text (Confirm or Edit):</span>
              <Badge variant="outline" className="text-emerald-600 bg-emerald-50 text-[10px]">
                Preview Ready
              </Badge>
            </div>

            <Textarea
              rows={3}
              value={extractedTranscript}
              onChange={(e) => setExtractedTranscript(e.target.value)}
              className="text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Review the transcription above. You can edit any words before applying.
            </p>
          </div>
        )}
      </CardContent>

      {state === "SUCCESS" && (
        <CardFooter className="flex gap-2 justify-between pt-0">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Retake
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
