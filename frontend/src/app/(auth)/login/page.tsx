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

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "";

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
      await requestOtp(formattedPhone);

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
        setError("Network error. Please check your internet connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto shadow-md border-border">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Phone className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Welcome to KaamSetu
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Enter your 10-digit mobile number to sign in or create an account.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="text-xs">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="phone-input"
              className="text-xs font-semibold text-foreground"
            >
              Mobile Number
            </label>
            <div className="flex gap-2">
              <div className="flex h-11 items-center justify-center rounded-md border border-input bg-muted px-3 text-sm font-semibold text-foreground select-none">
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
                className="text-base tracking-wide"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              We will send a 6-digit one-time password (OTP) via SMS.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-sm font-semibold mt-2"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Get OTP
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Verified security • No password required</span>
        </div>
      </CardContent>

      <CardFooter className="border-t bg-muted/10 pt-4 flex justify-between">
        <Link href="/" className="w-full">
          <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}>
            Back to Home
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
