"use client";

import { useState, useRef, useEffect, type ClipboardEvent, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { KeyRound, ArrowRight, RefreshCw, Edit3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/features/auth/use-auth";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "";

  const { pendingPhone, verifyOtp, requestOtp } = useAuth();
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If user accesses /verify-otp directly without pending phone, redirect to /login
  useEffect(() => {
    if (!pendingPhone) {
      router.replace("/login");
    }
  }, [pendingPhone, router]);

  // Resend cooldown countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleDigitChange = (index: number, val: string) => {
    // Only accept numeric digit
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned) {
      const nextDigits = [...otpDigits];
      nextDigits[index] = "";
      setOtpDigits(nextDigits);
      return;
    }

    const digit = cleaned.slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = digit;
    setOtpDigits(nextDigits);
    if (error) setError(null);

    // Auto-advance to next input box
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    } else {
      // If last digit filled, auto submit
      const fullOtp = nextDigits.join("");
      if (fullOtp.length === OTP_LENGTH) {
        submitOtp(fullOtp);
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pastedData) return;

    const nextDigits = [...otpDigits];
    for (let i = 0; i < pastedData.length; i++) {
      nextDigits[i] = pastedData[i] || "";
    }
    setOtpDigits(nextDigits);
    if (error) setError(null);

    const focusIndex = Math.min(pastedData.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();

    if (pastedData.length === OTP_LENGTH) {
      submitOtp(pastedData);
    }
  };

  const submitOtp = async (otpString: string) => {
    if (!pendingPhone) return;

    try {
      setIsLoading(true);
      setError(null);

      const user = await verifyOtp(pendingPhone, otpString);

      // Check if redirect query param exists
      if (redirect) {
        router.push(redirect);
        return;
      }

      // Role-based redirects per specification
      if (user.role === "worker") {
        router.push("/worker");
      } else if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/customer");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Invalid or expired verification code.");
      } else {
        setError("Network failure. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !pendingPhone || isResending) return;

    try {
      setIsResending(true);
      setError(null);
      await requestOtp(pendingPhone);
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Failed to resend code.");
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setIsResending(false);
    }
  };

  if (!pendingPhone) {
    return null;
  }

  const isComplete = otpDigits.every((d) => d.length === 1);

  return (
    <Card className="max-w-md mx-auto shadow-md border-border">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <KeyRound className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Verify Mobile Number
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Enter the 6-digit code sent to <span className="font-semibold text-foreground">{pendingPhone}</span>
        </CardDescription>
        <div className="pt-1">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
          >
            <Edit3 className="h-3 w-3" />
            <span>Change mobile number</span>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-6">
        {error && (
          <Alert variant="destructive" className="text-xs">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 6-box OTP input field */}
        <div className="flex justify-center gap-2 sm:gap-3">
          {otpDigits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              autoFocus={idx === 0}
              disabled={isLoading}
              aria-label={`Digit ${idx + 1} of 6`}
              className={cn(
                "h-12 w-11 sm:h-14 sm:w-12 rounded-lg border border-input bg-background text-center text-xl font-bold shadow-xs transition-all focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50 min-h-touch",
                digit ? "border-primary bg-primary/5 text-primary" : ""
              )}
            />
          ))}
        </div>

        <Button
          onClick={() => submitOtp(otpDigits.join(""))}
          className="w-full h-11 text-sm font-semibold"
          disabled={!isComplete || isLoading}
          isLoading={isLoading}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Verify & Continue
        </Button>

        {/* Resend OTP cooldown */}
        <div className="text-center pt-2">
          {countdown > 0 ? (
            <p className="text-xs text-muted-foreground">
              Resend code in <span className="font-semibold text-foreground font-mono">{countdown}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isResending && "animate-spin")} />
              <span>Resend OTP</span>
            </button>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t bg-muted/10 pt-4 flex justify-between">
        <Link href="/login" className="w-full">
          <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
            Cancel & Return to Login
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
