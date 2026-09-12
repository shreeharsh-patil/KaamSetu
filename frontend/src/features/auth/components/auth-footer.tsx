"use client";

import Link from "next/link";

interface AuthFooterProps {
  mode: "login" | "signup";
  redirect?: string;
}

export function AuthFooter({ mode, redirect }: AuthFooterProps) {
  const query = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";

  return (
    <div className="space-y-4 pt-2 text-center">
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {mode === "login" ? (
          <>
            New to KaamSetu?{" "}
            <Link
              href={`/signup${query}`}
              className="font-semibold text-primary hover:underline"
            >
              Create account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href={`/login${query}`}
              className="font-semibold text-primary hover:underline"
            >
              Sign in
            </Link>
          </>
        )}
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed max-w-xs mx-auto">
        By continuing, you agree to KaamSetu&apos;s{" "}
        <Link href="/terms" className="underline hover:text-slate-600 dark:hover:text-slate-300">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-slate-600 dark:hover:text-slate-300">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
