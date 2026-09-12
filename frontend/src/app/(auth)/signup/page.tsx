"use client";

import { useState, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/features/auth/use-auth";
import { ApiError } from "@/lib/api/errors";
import { AuthCard } from "@/features/auth/components/auth-card";
import { RoleSelector, type AuthRole } from "@/features/auth/components/role-selector";
import { PhoneInputField } from "@/features/auth/components/phone-input-field";
import { EmailInputField } from "@/features/auth/components/email-input-field";
import { AuthFooter } from "@/features/auth/components/auth-footer";

function SignupSkeleton() {
  return (
    <div className="w-full max-w-[440px] mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800/60 rounded-md animate-pulse" />
      </div>
      <div className="h-13 w-full bg-slate-100 dark:bg-slate-800/40 rounded-xl animate-pulse" />
      <div className="h-11 w-full bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
    </div>
  );
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "";

  const { signupRequestOtp } = useAuth();

  const [role, setRole] = useState<AuthRole>("CUSTOMER");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): string | null => {
    if (!firstName.trim()) return "Enter your first name";
    if (firstName.trim().length > 50) return "First name must be under 50 characters";
    if (!lastName.trim()) return "Enter your last name";
    if (lastName.trim().length > 50) return "Last name must be under 50 characters";

    const cleaned = phoneNumber.replace(/\D/g, "");
    if (!cleaned) return "Enter your mobile number";
    if (cleaned.length !== 10) return "Enter a valid 10-digit mobile number";
    if (!/^[6-9]/.test(cleaned)) return "Indian mobile numbers must start with 6, 7, 8, or 9";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return "Enter your email address";
    if (!emailRegex.test(email.trim())) return "Enter a valid email address";

    return null;
  };

  const isFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    phoneNumber.replace(/\D/g, "").length === 10 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const cleaned = phoneNumber.replace(/\D/g, "");
      const formattedPhone = `+91${cleaned}`;

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
          setError("Too many requests. Please wait a minute before requesting another code.");
        } else {
          setError(err.message || "Failed to start registration. Please check your information.");
        }
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create account"
      subtitle={
        role === "CUSTOMER"
          ? "Hire background-verified local service professionals."
          : "Join our partner network to find jobs and grow your earnings."
      }
      backHref="/login"
    >
      {/* Account Type Selector */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          I want to
        </label>
        <RoleSelector value={role} onChange={setRole} disabled={isLoading} />
      </div>

      {/* Global Error Alert */}
      {error && (
        <Alert variant="destructive" className="py-2.5 px-3.5 text-xs rounded-xl border-destructive/30">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
        {/* Name Fields (stacked on mobile, 2-column on tablet+) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1.5">
            <label
              htmlFor="signup-first-name"
              className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              First name
            </label>
            <input
              id="signup-first-name"
              type="text"
              placeholder="Rohan"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (error) setError(null);
              }}
              disabled={isLoading}
              autoFocus
              className="flex h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors shadow-2xs"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="signup-last-name"
              className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Last name
            </label>
            <input
              id="signup-last-name"
              type="text"
              placeholder="Sharma"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (error) setError(null);
              }}
              disabled={isLoading}
              className="flex h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors shadow-2xs"
            />
          </div>
        </div>

        {/* Mobile Number Field */}
        <PhoneInputField
          value={phoneNumber}
          onChange={(val) => {
            setPhoneNumber(val);
            if (error) setError(null);
          }}
          disabled={isLoading}
          helperText="We'll send a 6-digit verification code to this phone."
        />

        {/* Email Field */}
        <EmailInputField
          value={email}
          onChange={(val) => {
            setEmail(val);
            if (error) setError(null);
          }}
          disabled={isLoading}
          helperText="Used for booking receipts and account updates."
        />

        {/* Notice for workers */}
        {role === "WORKER" && (
          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-300 leading-relaxed">
            You will choose your trade skills, service radius, and setup payout details directly after phone verification.
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-12 text-sm font-semibold rounded-xl mt-1"
          disabled={!isFormValid || isLoading}
          isLoading={isLoading}
          rightIcon={!isLoading ? <ArrowRight className="h-4 w-4" /> : undefined}
        >
          {isLoading ? "Sending code..." : "Verify Phone via OTP"}
        </Button>
      </form>

      {/* Footer Switcher & Terms */}
      <AuthFooter mode="signup" redirect={redirect} />
    </AuthCard>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupSkeleton />}>
      <SignupContent />
    </Suspense>
  );
}
