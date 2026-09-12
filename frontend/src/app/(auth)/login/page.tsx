"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Phone, ArrowRight, ShieldCheck, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/features/auth/use-auth";
import { ApiError } from "@/lib/api/errors";
import { useTranslation } from "@/lib/i18n/i18n-context";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "";

  const { t } = useTranslation();
  const { requestOtp } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Validate Indian mobile numbers: 10 digits starting with 6, 7, 8, or 9
  const validatePhone = (num: string): string | null => {
    const cleaned = num.replace(/\D/g, "");
    if (!cleaned) return "Mobile number is required";
    if (cleaned.length !== 10) return "Please enter a valid 10-digit mobile number";
    if (!/^[6-9]/.test(cleaned)) return "Indian mobile numbers must start with 6, 7, 8, or 9";
    return null;
  };

  const handlePhoneChange = (val: string) => {
    // Only permit digits up to 10 characters
    const cleaned = val.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(cleaned);
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validatePhone(phoneNumber);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Backend requires full E.164 format: +91XXXXXXXXXX
      const formattedPhone = `+91${phoneNumber}`;
      await requestOtp(formattedPhone, role);

      const targetUrl = `/verify-otp${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`;
      router.push(targetUrl);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isRateLimited()) {
          setError("Too many attempts. Please wait a minute before requesting another OTP.");
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

  const [role, setRole] = useState<"customer" | "worker">("customer");

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
            <Phone className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            {t("nav.login", "Sign In")}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Enter your 10-digit mobile number to get started.
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
                htmlFor="phone-input"
                className="text-xs font-semibold text-foreground"
              >
                Phone Number
              </label>
              <div className="flex gap-2">
                <div className="flex h-11 items-center justify-center rounded-xl border border-input bg-muted px-3.5 text-sm font-bold text-foreground select-none">
                  +91
                </div>
                <Input
                  id="phone-input"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  autoFocus
                  disabled={isLoading}
                  className="text-base tracking-wide rounded-xl font-medium"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                We will send an OTP verification code via SMS.
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

          <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Verified security • No password required</span>
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

      {/* 3 Trust Cards Underneath (Matching Screen 1) */}
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
