import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, checked, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className={cn(
          "flex items-start gap-3 cursor-pointer select-none text-sm group",
          props.disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            type="checkbox"
            id={id}
            ref={ref}
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <div className="h-5 w-5 rounded border border-input bg-background peer-checked:bg-primary peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 transition-colors flex items-center justify-center">
            <Check className="h-3.5 w-3.5 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && <span className="font-medium text-foreground leading-snug">{label}</span>}
            {description && (
              <span className="text-xs text-muted-foreground leading-normal mt-0.5">
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
