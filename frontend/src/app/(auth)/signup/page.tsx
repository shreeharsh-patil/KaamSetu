"use client";

import { useState, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { User, Mail, ArrowRight, ShieldCheck, ArrowLeft, LogIn } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/features/auth/use-auth";
import { ApiError } from "@/lib/api/errors";
import { useTranslation } from "@/lib/i18n/i18n-context";

function SignupSkeleton() {
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

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "";

  const { t } = useTranslation();
  const { signupRequestOtp } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<"CUSTOMER" | "WORKER">("CUSTOMER");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): string | null => {
    if (!firstName.trim()) return "First name is required";
    if (firstName.trim().length > 50) return "First name cannot exceed 50 characters";
    if (!lastName.trim()) return "Last name is required";
    if (lastName.trim().length > 50) return "Last name cannot exceed 50 characters";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return "Email address is required";
    if (!emailRegex.test(email.trim())) return "Please enter a valid email address";

    const cleaned = phoneNumber.replace(/\D/g, "");
    if (!cleaned) return "Mobile number is required";
    if (cleaned.length !== 10) return "Please enter a valid 10-digit mobile number";
    if (!/^[6-9]/.test(cleaned)) return "Indian mobile numbers must start with 6, 7, 8, or 9";

    return null;
  };

  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(cleaned);
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const cleanedPhone = phoneNumber.replace(/\D/g, "");
      const formattedPhone = `+91${cleanedPhone}`;

      await signupRequestOtp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: formattedPhone,
        role,
      });

      const targetUrl = `/verify-otp${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`;
      router.push(targetUrl);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isConflict()) {
          setError(err.message || "An account with this phone or email already exists. Please sign in instead.");
        } else if (err.isRateLimited()) {
          setError("Too many requests. Please wait a minute before trying again.");
        } else {
          setError(err.message || "Failed to start registration. Please check your information.");
        }
      } else {
        setError("Network error. Please try again.");
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
            onClick={() => setRole("CUSTOMER")}
            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
              role === "CUSTOMER"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("header.hire", "Customer")}
          </button>
          <button
            type="button"
            onClick={() => setRole("WORKER")}
            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
              role === "WORKER"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("header.earn", "Worker / Partner")}
          </button>
        </div>
      </div>

      <Card className="shadow-sm border-border/80 rounded-3xl p-2 sm:p-4">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <User className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Create an Account
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {role === "CUSTOMER"
              ? "Join KaamSetu to hire skilled, verified local service professionals."
              : "Join KaamSetu to find flexible work, earn more, and build your reputation."}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <Alert variant="destructive" className="text-xs rounded-xl">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <label
                  htmlFor="first-name-input"
                  className="text-xs font-semibold text-foreground"
                >
                  First Name
                </label>
                <Input
                  id="first-name-input"
                  placeholder="Rohan"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isLoading}
                  className="text-sm rounded-xl"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="last-name-input"
                  className="text-xs font-semibold text-foreground"
                >
                  Last Name
                </label>
                <Input
                  id="last-name-input"
                  placeholder="Sharma"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isLoading}
                  className="text-sm rounded-xl"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label
                htmlFor="email-input"
                className="text-xs font-semibold text-foreground"
              >
                Email Address
              </label>
              <div className="relative">
                <Input
                  id="email-input"
                  type="email"
                  placeholder="rohan@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isLoading}
                  className="text-sm rounded-xl pl-9"
                />
                <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label
                htmlFor="phone-input"
                className="text-xs font-semibold text-foreground"
              >
                Mobile Number
              </label>
              <div className="flex gap-2">
                <div className="flex h-11 items-center justify-center rounded-xl border border-input bg-muted px-3 text-sm font-bold text-foreground select-none">
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
                  disabled={isLoading}
                  className="text-base tracking-wide rounded-xl font-medium"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                We will send an SMS with a 6-digit verification code to verify this phone number.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-bold mt-2 rounded-xl"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Verify Phone via OTP
            </Button>
          </form>

          {/* Link to Sign In */}
          <div className="mt-4 pt-4 border-t border-border/60 text-center">
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
                className="font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </Link>
            </p>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Privacy protected • Zero spam guarantee</span>
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
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupSkeleton />}>
      <SignupContent />
    </Suspense>
  );
}
