"use client";

import { useState, Suspense, useEffect, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/features/auth/use-auth";
import { ApiError } from "@/lib/api/errors";
import { AuthCard } from "@/features/auth/components/auth-card";

function CompleteProfileSkeleton() {
  return (
    <div className="w-full max-w-[440px] mx-auto bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-6">
      <div className="space-y-2">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse" />
      </div>
      <div className="space-y-4 pt-4">
        <div className="h-11 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
        <div className="h-11 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
        <div className="h-11 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

function CompleteProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "";

  const { user, completeProfile, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user) {
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName);
      if (user.email) setEmail(user.email);

      // If user profile is already complete, redirect to appropriate dashboard
      if (user.firstName && user.lastName && user.email) {
        if (redirect) {
          router.replace(redirect);
        } else if (user.role === "WORKER") {
          router.replace("/worker");
        } else if (user.role === "ADMIN" || user.role === "SUPPORT") {
          router.replace("/admin");
        } else {
          router.replace("/customer");
        }
      }
    }
  }, [user, isAuthenticated, isAuthLoading, router, redirect]);

  const validate = (): string | null => {
    if (!firstName.trim()) return "First name is required";
    if (firstName.trim().length > 50) return "First name cannot exceed 50 characters";
    if (!lastName.trim()) return "Last name is required";
    if (lastName.trim().length > 50) return "Last name cannot exceed 50 characters";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return "Email address is required";
    if (!emailRegex.test(email.trim())) return "Please enter a valid email address";

    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const updatedUser = await completeProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
      });

      // Role-based redirect
      if (redirect) {
        router.replace(redirect);
      } else if (updatedUser.role === "WORKER") {
        router.replace("/worker");
      } else if (updatedUser.role === "ADMIN" || updatedUser.role === "SUPPORT") {
        router.replace("/admin");
      } else {
        router.replace("/customer");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isConflict()) {
          setError("This email address is already in use by another account.");
        } else {
          setError(err.message || "Failed to update profile. Please try again.");
        }
      } else {
        setError("Network failure. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return <CompleteProfileSkeleton />;
  }

  return (
    <AuthCard
      title="Complete your profile"
      subtitle="Provide your name and email to finish setting up your account."
      backHref="/"
    >
      {/* Verified Phone Badge */}
      {user?.phoneNumber && (
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Verified: {user.phoneNumber}
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
            Active
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive" className="text-xs rounded-xl py-2.5">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Name Fields (stacked on mobile, 2-column on tablet+) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="first-name-input"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
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
              disabled={isSubmitting}
              className="text-sm rounded-xl h-11"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="last-name-input"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
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
              disabled={isSubmitting}
              className="text-sm rounded-xl h-11"
            />
          </div>
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <label
            htmlFor="email-input"
            className="text-xs font-semibold text-slate-700 dark:text-slate-300"
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
              disabled={isSubmitting}
              className="text-sm rounded-xl h-11 pl-9"
            />
            <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Used for service invoices, booking confirmations, and worker coordination.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-sm font-semibold mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Save & Continue to Dashboard
        </Button>
      </form>
    </AuthCard>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<CompleteProfileSkeleton />}>
      <CompleteProfileContent />
    </Suspense>
  );
}
