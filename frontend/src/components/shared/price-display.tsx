import { formatINR, cn } from "@/lib/utils";

export interface PriceDisplayProps {
  amount: number;
  label?: string;
  isEstimate?: boolean;
  rateType?: "fixed" | "hourly" | "daily";
  originalAmount?: number;
  className?: string;
}

export function PriceDisplay({
  amount,
  label,
  isEstimate = false,
  rateType,
  originalAmount,
  className,
}: PriceDisplayProps) {
  const rateSuffix = {
    fixed: "",
    hourly: " / hr",
    daily: " / day",
  };

  return (
    <div className={cn("inline-flex flex-col", className)}>
      {label && <span className="text-[11px] font-medium text-muted-foreground uppercase">{label}</span>}
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-bold text-foreground tracking-tight">
          {isEstimate && <span className="text-sm font-normal text-muted-foreground mr-1">Est.</span>}
          {formatINR(amount)}
          {rateType && rateSuffix[rateType] && (
            <span className="text-xs font-normal text-muted-foreground">
              {rateSuffix[rateType]}
            </span>
          )}
        </span>

        {originalAmount && originalAmount > amount && (
          <span className="text-xs text-muted-foreground line-through">
            {formatINR(originalAmount)}
          </span>
        )}
      </div>
    </div>
  );
}
