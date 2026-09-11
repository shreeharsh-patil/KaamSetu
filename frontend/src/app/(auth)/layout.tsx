import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 flex items-center justify-center py-12">
      <Container size="sm">{children}</Container>
    </div>
  );
}
