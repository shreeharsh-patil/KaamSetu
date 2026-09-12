import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f6f8fc] dark:bg-slate-950 px-3 xs:px-4 py-6 xs:py-10 sm:p-8 pb-safe">
      <main className="w-full max-w-[440px]">
        {children}
      </main>
    </div>
  );
}
