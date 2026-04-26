import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: "none" | "default" | "lg";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, padding = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-bg-surface border border-border-subtle rounded-2xl transition-all duration-200 ease-out",
          {
            "p-0": padding === "none",
            "p-6": padding === "default",
            "p-8": padding === "lg",
          },
          {
            "hover:border-border-focus hover:shadow-[0_0_0_1px_#334155,0_8px_30px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-0.5": hoverable,
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
export default Card;
