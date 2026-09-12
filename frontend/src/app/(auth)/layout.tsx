import type { ReactNode } from "react";
import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-12 gap-8 xl:gap-12 items-center">
        {/* Left Column: Brand & Trust Panel (Desktop only) */}
        <div className="hidden lg:block lg:col-span-6 xl:col-span-7 h-full">
          <AuthBrandPanel />
        </div>

        {/* Right Column: Active Auth Form Card */}
        <div className="w-full lg:col-span-6 xl:col-span-5 flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
