import { type ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "./container";
import { Badge } from "@/components/ui/badge";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  badge,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  return (
    <div className="border-b bg-card/50 py-6">
      <Container>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-3">
            <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <li key={crumb.label} className="flex items-center gap-1.5">
                    {idx > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
                    {crumb.href && !isLast ? (
                      <Link href={crumb.href} className="hover:text-foreground transition-colors">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={isLast ? "font-semibold text-foreground" : ""}>
                        {crumb.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              {badge && <Badge variant="secondary">{badge}</Badge>}
            </div>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </Container>
    </div>
  );
}
