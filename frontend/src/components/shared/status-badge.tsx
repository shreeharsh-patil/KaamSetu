import { Badge, type BadgeProps } from "@/components/ui/badge";

export type JobStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "MATCHED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

const statusConfig: Record<
  JobStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PUBLISHED: { label: "Finding Workers", variant: "info" },
  MATCHED: { label: "Worker Matched", variant: "info" },
  ASSIGNED: { label: "Assigned", variant: "default" },
  IN_PROGRESS: { label: "Work In Progress", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  DISPUTED: { label: "Under Review", variant: "destructive" },
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
