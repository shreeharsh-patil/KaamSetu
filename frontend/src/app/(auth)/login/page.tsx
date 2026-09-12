"use client";

import { useState, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/features/auth/use-auth";
import { ApiError } from "@/lib/api/errors";
import { AuthCard } from "@/features/auth/components/auth-card";
import { RoleSelector, type AuthRole } from "@/features/auth/components/role-selector";
import { PhoneInputField } from "@/features/auth/components/phone-input-field";
import { EmailInputField } from "@/features/auth/components/email-input-field";
import { AuthFooter } from "@/features/auth/components/auth-footer";
import { isValidIndianPhone, toIndianE164 } from "@/features/auth/phone";

function LoginSkeleton() {
  return (
    <div className="w-full max-w-[440px] mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-4 w-60 bg-slate-100 dark:bg-slate-800/60 rounded-md animate-pulse" />
      </div>
      <div className="h-13 w-full bg-slate-100 dark:bg-slate-800/40 rounded-xl animate-pulse" />
      <div className="h-12 w-full bg-slate-100 dark:bg-slate-800/40 rounded-xl animate-pulse" />
      <div className="h-11 w-full bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
    </div>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "";

  const { requestOtp } = useAuth();

  const [role, setRole] = useState<AuthRole>("CUSTOMER");
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): string | null => {
    if (authMethod === "phone") {
      if (!phoneNumber) return "Enter your 10-digit mobile number";
      if (!isValidIndianPhone(phoneNumber)) return "Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9";
      return null;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) return "Enter your email address";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) return "Please enter a valid email address";
    return null;
  };

  const isFormValid =
    authMethod === "phone"
      ? isValidIndianPhone(phoneNumber)
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

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

      const targetIdentifier =
        authMethod === "phone"
          ? toIndianE164(phoneNumber)
          : email.trim().toLowerCase();

      // Pass role preference ('customer' | 'worker') to requestOtp
      await requestOtp(targetIdentifier, role.toLowerCase() as "customer" | "worker");

      const targetUrl = `/verify-otp${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`;
      router.push(targetUrl);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isNotFound()) {
          setError("No account found with this email. Please create an account.");
        } else if (err.isRateLimited()) {
          setError("Too many requests. Please wait a moment before trying again.");
        } else if (err.isForbidden()) {
          setError(err.message || "Your account has been deactivated or suspended.");
        } else {
          setError(err.message || "We couldn't send the code. Please try again.");
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
      title="Welcome back"
      subtitle="Book trusted services or find work near you."
      backHref="/"
    >
      {/* Account Type Selector: Customer vs Worker */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          I want to
        </label>
        <RoleSelector value={role} onChange={setRole} disabled={isLoading} />
      </div>

      {/* Global Form Error Alert */}
      {error && (
        <Alert variant="destructive" className="py-2.5 px-3.5 text-xs rounded-xl border-destructive/30">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Authentication Form */}
      <form noValidate onSubmit={handleSubmit} className="space-y-4 pt-1">
        {authMethod === "phone" ? (
          <PhoneInputField
            value={phoneNumber}
            onChange={(val) => {
              setPhoneNumber(val);
              if (error) setError(null);
            }}
            disabled={isLoading}
            autoFocus
          />
        ) : (
          <EmailInputField
            value={email}
            onChange={(val) => {
              setEmail(val);
              if (error) setError(null);
            }}
            disabled={isLoading}
            autoFocus
          />
        )}

        <Button
          type="submit"
          className="w-full h-12 text-sm font-semibold rounded-xl"
          disabled={!isFormValid || isLoading}
          isLoading={isLoading}
          rightIcon={!isLoading ? <ArrowRight className="h-4 w-4" /> : undefined}
        >
          {isLoading ? "Sending code..." : "Continue"}
        </Button>
      </form>

      {/* Method Switcher Divider */}
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-medium">
            or
          </span>
        </div>
      </div>

      {/* Toggle between Phone and Email */}
      {authMethod === "phone" ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setAuthMethod("email");
            setError(null);
          }}
          disabled={isLoading}
          className="w-full h-11 text-xs sm:text-sm font-medium rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          leftIcon={<Mail className="h-4 w-4 text-slate-400" />}
        >
          Continue with email
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setAuthMethod("phone");
            setError(null);
          }}
          disabled={isLoading}
          className="w-full h-11 text-xs sm:text-sm font-medium rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          leftIcon={<Phone className="h-4 w-4 text-slate-400" />}
        >
          Continue with mobile number
        </Button>
      )}

      {/* Footer Switcher & Terms */}
      <AuthFooter mode="login" redirect={redirect} />
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  );
}
