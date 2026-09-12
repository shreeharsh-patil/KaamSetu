"use client";

import { useState, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Phone, Mail, ArrowRight, ShieldCheck, ArrowLeft, UserPlus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/features/auth/use-auth";
import { ApiError } from "@/lib/api/errors";
import { useTranslation } from "@/lib/i18n/i18n-context";

function LoginSkeleton() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex justify-center">
        <div className="h-8 w-44 rounded-full bg-muted animate-pulse" />
      </div>
      <Card className="shadow-md border-border">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-muted animate-pulse" />
          <div className="h-6 w-36 bg-muted rounded mx-auto animate-pulse" />
          <div className="h-4 w-52 bg-muted rounded mx-auto mt-2 animate-pulse" />
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="h-11 w-full bg-muted rounded-xl animate-pulse" />
          <div className="h-11 w-full bg-muted rounded-xl animate-pulse" />
        </CardContent>
      </Card>
    </div>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "";

  const { t } = useTranslation();
  const { requestOtp } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"customer" | "worker">("customer");

  const isEmail = identifier.includes("@");

  const validateInput = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "Please enter your mobile number or email address";
    }

    if (trimmed.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        return "Please enter a valid email address";
      }
      return null;
    }

    const cleaned = trimmed.replace(/\D/g, "");
    if (cleaned.length !== 10) {
      return "Please enter a valid 10-digit mobile number or email address";
    }
    if (!/^[6-9]/.test(cleaned)) {
      return "Indian mobile numbers must start with 6, 7, 8, or 9";
    }
    return null;
  };

  const handleInputChange = (val: string) => {
    setIdentifier(val);
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validateInput(identifier);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const trimmed = identifier.trim();
      let targetIdentifier = trimmed;

      if (!trimmed.includes("@")) {
        const cleaned = trimmed.replace(/\D/g, "");
        targetIdentifier = `+91${cleaned}`;
      }

      await requestOtp(targetIdentifier, role);

      const targetUrl = `/verify-otp${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`;
      router.push(targetUrl);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isRateLimited()) {
          setError("Too many attempts. Please wait before requesting another OTP.");
        } else {
          setError(err.message || "Failed to send verification code. Please try again.");
        }
      } else {
        setError("Failed to request verification code. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Role Switcher Pill */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 rounded-full bg-secondary border border-border/70 shadow-2xs">
          <button
            type="button"
            onClick={() => setRole("customer")}
            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
              role === "customer"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("header.hire", "Customer")}
          </button>
          <button
            type="button"
            onClick={() => setRole("worker")}
            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
              role === "worker"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("header.earn", "Worker")}
          </button>
        </div>
      </div>

      <Card className="shadow-sm border-border/80 rounded-3xl p-2 sm:p-4">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {isEmail ? <Mail className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            {t("nav.login", "Sign In")}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Enter your mobile number or email to receive a secure login OTP.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="text-xs rounded-xl">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="identifier-input"
                className="text-xs font-semibold text-foreground flex items-center justify-between"
              >
                <span>Mobile Number or Email</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  {isEmail ? "Email login" : "SMS OTP login"}
                </span>
              </label>

              <div className="flex gap-2">
                {!isEmail && (
                  <div className="flex h-11 items-center justify-center rounded-xl border border-input bg-muted px-3.5 text-sm font-bold text-foreground select-none">
                    +91
                  </div>
                )}
                <Input
                  id="identifier-input"
                  type={isEmail ? "email" : "text"}
                  placeholder={isEmail ? "you@example.com" : "98765 43210 or email"}
                  value={identifier}
                  onChange={(e) => handleInputChange(e.target.value)}
                  autoFocus
                  disabled={isLoading}
                  className="text-base tracking-wide rounded-xl font-medium"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isEmail
                  ? "We will send an OTP to the mobile number registered with this email."
                  : "We will send a 6-digit OTP verification code via SMS."}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-bold mt-2 rounded-xl"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              {t("action.continue", "Get OTP")}
            </Button>
          </form>

          {/* Link to Sign Up */}
          <div className="mt-4 pt-4 border-t border-border/60 text-center">
            <p className="text-xs text-muted-foreground">
              Don&apos;t have an account yet?{" "}
              <Link
                href={`/signup${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
                className="font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Sign Up
              </Link>
            </p>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Verified security • Passwordless login</span>
          </div>
        </CardContent>

        <CardFooter className="border-t border-border/60 pt-3 flex justify-between">
          <Link href="/" className="w-full">
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground rounded-xl" leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}>
              {t("action.back", "Back to Home")}
            </Button>
          </Link>
        </CardFooter>
      </Card>

      {/* 3 Trust Cards Underneath */}
      <div className="grid grid-cols-3 gap-2.5 pt-2">
        <div className="p-3 rounded-2xl border border-border/70 bg-card text-center space-y-1 shadow-2xs">
          <div className="flex justify-center text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-[11px] font-bold text-foreground leading-tight">Verified Workers</p>
          <p className="text-[9px] text-muted-foreground leading-tight hidden sm:block">Background checked</p>
        </div>

        <div className="p-3 rounded-2xl border border-border/70 bg-card text-center space-y-1 shadow-2xs">
          <div className="flex justify-center text-amber-600">
            <Phone className="h-5 w-5" />
          </div>
          <p className="text-[11px] font-bold text-foreground leading-tight">Fast Matching</p>
          <p className="text-[9px] text-muted-foreground leading-tight hidden sm:block">Connect in minutes</p>
        </div>

        <div className="p-3 rounded-2xl border border-border/70 bg-card text-center space-y-1 shadow-2xs">
          <div className="flex justify-center text-emerald-600">
            <ArrowRight className="h-5 w-5" />
          </div>
          <p className="text-[11px] font-bold text-foreground leading-tight">Transparent Rates</p>
          <p className="text-[9px] text-muted-foreground leading-tight hidden sm:block">No hidden fees</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  );
}
