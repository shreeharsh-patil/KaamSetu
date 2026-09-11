import type { ReactNode } from "react";
import { Container } from "./container";
import { Badge } from "@/components/ui/badge";

export interface AppShellProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  title,
  subtitle,
  badge,
  actions,
  children,
}: AppShellProps) {
  return (
    <div className="flex-1 py-8">
      <Container>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              {badge && <Badge variant="secondary">{badge}</Badge>}
            </div>
            {subtitle && (
              <p className="mt-1.5 text-sm sm:text-base text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
        {children}
      </Container>
    </div>
  );
}
