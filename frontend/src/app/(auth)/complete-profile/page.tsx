"use client";

import { useState, Suspense, useEffect, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserCheck, CheckCircle2, Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/features/auth/use-auth";
import { ApiError } from "@/lib/api/errors";
import { useTranslation } from "@/lib/i18n/i18n-context";

function CompleteProfileSkeleton() {
  return (
    <Card className="max-w-md mx-auto shadow-md border-border">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-muted animate-pulse" />
        <div className="h-6 w-48 bg-muted rounded mx-auto animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded mx-auto mt-2 animate-pulse" />
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="h-11 w-full bg-muted rounded-xl animate-pulse" />
        <div className="h-11 w-full bg-muted rounded-xl animate-pulse" />
      </CardContent>
    </Card>
  );
}

function CompleteProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "";

  const { t } = useTranslation();
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
    <div className="max-w-md mx-auto space-y-6">
      <Card className="shadow-sm border-border/80 rounded-3xl p-2 sm:p-4">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <UserCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Please provide your name and email to finish setting up your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2">
          {/* Verified Phone Badge */}
          {user?.phoneNumber && (
            <div className="mb-4 flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-foreground">
                  Phone Verified: {user.phoneNumber}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Verified
              </span>
            </div>
          )}

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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                  className="text-sm rounded-xl pl-9"
                />
                <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                We use your email for service receipts, booking confirmations, and updates.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-bold mt-2 rounded-xl"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Save & Continue to Dashboard
            </Button>
          </form>
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

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<CompleteProfileSkeleton />}>
      <CompleteProfileContent />
    </Suspense>
  );
}
