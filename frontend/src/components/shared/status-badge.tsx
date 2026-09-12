import { Badge, type BadgeProps } from "@/components/ui/badge";

export type JobStatus =
  | "DRAFT"
  | "OPEN"
  | "MATCHING"
  | "OFFERED"
  | "ACCEPTED"
  | "EN_ROUTE"
  | "ARRIVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED"
  | "EXPIRED";

const statusConfig: Record<
  JobStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  OPEN: { label: "Open", variant: "info" },
  MATCHING: { label: "Searching", variant: "info" },
  OFFERED: { label: "Awaiting Acceptance", variant: "warning" },
  ACCEPTED: { label: "Assigned", variant: "default" },
  EN_ROUTE: { label: "En Route", variant: "info" },
  ARRIVED: { label: "Arrived", variant: "info" },
  IN_PROGRESS: { label: "Work In Progress", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  DISPUTED: { label: "Under Review", variant: "destructive" },
  EXPIRED: { label: "Expired", variant: "secondary" },
};

export interface StatusBadgeProps {
  status: JobStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = (status.toUpperCase() as JobStatus);
  const cfg = statusConfig[normalized] || {
    label: status,
    variant: "outline",
  };

  return (
    <Badge variant={cfg.variant} className={className}>
      {cfg.label}
    </Badge>
  );
}
