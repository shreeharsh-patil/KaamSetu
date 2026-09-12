import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f6f8fc] px-4 py-10 sm:p-8">
      <main className="w-full max-w-[470px]">
        {children}
      </main>
    </div>
  );
}
