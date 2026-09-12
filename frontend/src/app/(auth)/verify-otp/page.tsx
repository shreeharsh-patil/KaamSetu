"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, RefreshCw, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/features/auth/use-auth";
import { ApiError } from "@/lib/api/errors";
import { AuthCard } from "@/features/auth/components/auth-card";
import { OtpInputField } from "@/features/auth/components/otp-input-field";
import { formatPhoneDisplay } from "@/features/auth/components/phone-input-field";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

function VerifyOtpSkeleton() {
  return (
    <div className="w-full max-w-[440px] mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-44 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-4 w-60 bg-slate-100 dark:bg-slate-800/60 rounded-md animate-pulse" />
      </div>
      <div className="h-14 w-full bg-slate-100 dark:bg-slate-800/40 rounded-xl animate-pulse" />
      <div className="h-11 w-full bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
    </div>
  );
}

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "";

  const { pendingPhone, setPendingPhone, verifyOtp, requestOtp, user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const [isResending, setIsResending] = useState(false);

  const isNavigatingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    if (!pendingPhone && typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("kaamsetu_pending_phone");
        if (stored) {
          setPendingPhone(stored);
        }
      } catch {
        // Ignore storage access errors
      }
    }
  }, [pendingPhone, setPendingPhone]);

  const effectivePhone =
    pendingPhone ||
    (typeof window !== "undefined"
      ? sessionStorage.getItem("kaamsetu_pending_phone")
      : null);

  // If accessed directly with no pending phone and no active session, redirect to login
  useEffect(() => {
    if (!mounted) return;
    if (!effectivePhone && !user && !isNavigatingRef.current) {
      router.replace("/login");
    }
  }, [mounted, effectivePhone, user, router]);

  // Resend cooldown countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const submitOtp = async (otpString: string) => {
    if (!effectivePhone || isNavigatingRef.current || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);
      isNavigatingRef.current = true;

      const requestedRole = typeof window !== "undefined"
        ? sessionStorage.getItem("kaamsetu_pending_role")
        : null;

      const verifiedUser = await verifyOtp(effectivePhone, otpString);

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("kaamsetu_pending_role");
      }

      // Check if user requires profile completion (legacy accounts)
      if (verifiedUser.requiresProfileCompletion) {
        router.replace(`/complete-profile${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`);
        return;
      }

      // Custom redirect query param
      if (redirect) {
        router.replace(redirect);
        return;
      }

      // Role-based redirects
      if (requestedRole === "worker" && verifiedUser.role === "CUSTOMER") {
        router.replace("/worker/onboarding");
      } else if (verifiedUser.role === "WORKER") {
        router.replace("/worker");
      } else if (verifiedUser.role === "ADMIN" || verifiedUser.role === "SUPPORT") {
        router.replace("/admin");
      } else {
        router.replace("/customer");
      }
    } catch (err) {
      isNavigatingRef.current = false;
      if (err instanceof ApiError) {
        setError(err.message || "Invalid or expired verification code.");
      } else {
        setError("Network failure. Please check your connection and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !effectivePhone || isResending) return;

    try {
      setIsResending(true);
      setError(null);
      await requestOtp(effectivePhone);
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setOtpDigits(Array(OTP_LENGTH).fill(""));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Failed to resend code. Please try again.");
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setIsResending(false);
    }
  };

  if (!mounted || !effectivePhone) {
    return <VerifyOtpSkeleton />;
  }

  const isComplete = otpDigits.every((d) => d.length === 1);
  const formattedPhone = effectivePhone.startsWith("+91")
    ? `+91 ${formatPhoneDisplay(effectivePhone.slice(3))}`
    : effectivePhone;

  return (
    <AuthCard
      title="Verify your number"
      subtitle="Enter the 6-digit verification code sent to"
      backHref="/login"
    >
      {/* Phone number display with quick change link */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
        <span className="text-sm font-semibold text-slate-900 dark:text-white font-mono tracking-wide">
          {formattedPhone}
        </span>
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <Pencil className="h-3 w-3" />
          <span>Change</span>
        </Link>
      </div>

      {/* Error container with reserved space */}
      <div className="min-h-[20px]">
        {error && (
          <Alert variant="destructive" className="py-2.5 px-3.5 text-xs rounded-xl border-destructive/30">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* 6-box OTP Input */}
      <div className="space-y-4 pt-1">
        <OtpInputField
          value={otpDigits}
          onChange={(digits) => {
            setOtpDigits(digits);
            if (error) setError(null);
          }}
          onComplete={(fullCode) => submitOtp(fullCode)}
          disabled={isLoading}
          error={Boolean(error)}
        />

        <Button
          type="button"
          onClick={() => submitOtp(otpDigits.join(""))}
          className="w-full h-12 text-sm font-semibold rounded-xl"
          disabled={!isComplete || isLoading}
          isLoading={isLoading}
          rightIcon={!isLoading ? <ArrowRight className="h-4 w-4" /> : undefined}
        >
          {isLoading ? "Verifying code..." : "Verify & Continue"}
        </Button>
      </div>

      {/* Resend OTP Section */}
      <div className="pt-2 text-center">
        {countdown > 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Didn&apos;t receive the code? Resend in{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
              {countdown}s
            </span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
          >
            <RefreshCw className={isResending ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            <span>Resend OTP</span>
          </button>
        )}
      </div>

      {/* Subtle dev-only note (completely hidden in production) */}
      {process.env.NODE_ENV !== "production" && (
        <div className="pt-2 text-center">
          <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-mono">
            Dev OTP: 123456
          </span>
        </div>
      )}
    </AuthCard>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<VerifyOtpSkeleton />}>
      <VerifyOtpContent />
    </Suspense>
  );
}
