import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helper, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full h-11 px-3 rounded-xl border bg-bg-elevated text-text-primary placeholder:text-text-tertiary",
              "transition-all duration-200 ease-out",
              "focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              {
                "pl-10": icon,
                "border-rose-500 focus:border-rose-500 focus:ring-rose-500/30": error,
                "border-border-subtle hover:border-border-focus": !error,
              },
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
        {helper && !error && <p className="mt-1.5 text-xs text-text-tertiary">{helper}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
