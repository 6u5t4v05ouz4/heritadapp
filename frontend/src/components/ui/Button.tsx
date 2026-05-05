import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef, ReactElement, cloneElement } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "default" | "sm" | "lg";
  isLoading?: boolean;
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", isLoading, children, disabled, asChild, ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 ease-out",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50",
      "active:scale-[0.98]",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
      {
        "h-11 px-6 text-sm": size === "default",
        "h-9 px-4 text-xs": size === "sm",
        "h-12 px-8 text-base": size === "lg",
      },
      {
        "bg-accent-primary text-black hover:brightness-110 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]": variant === "primary",
        "bg-bg-elevated text-text-primary border border-border-subtle hover:border-border-focus hover:bg-bg-elevated-hover": variant === "secondary",
        "bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5": variant === "ghost",
        "bg-transparent border border-rose-500/30 text-rose-400 hover:bg-rose-500/10": variant === "danger",
      },
      className
    );

    if (asChild && children) {
      const child = children as ReactElement;
      return cloneElement(child, {
        className: cn(classes, (child.props as any).className),
        ...(props as any),
      });
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={classes}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
