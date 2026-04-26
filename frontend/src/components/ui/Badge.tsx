import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "active" | "expired" | "waiting" | "claimed" | "default";
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        {
          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20": variant === "active",
          "bg-rose-500/10 text-rose-400 border-rose-500/20": variant === "expired",
          "bg-amber-500/10 text-amber-400 border-amber-500/20": variant === "waiting",
          "bg-sky-500/10 text-sky-400 border-sky-500/20": variant === "claimed",
          "bg-bg-elevated text-text-secondary border-border-subtle": variant === "default",
        },
        className
      )}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full", {
          "bg-emerald-400": variant === "active",
          "bg-rose-400": variant === "expired",
          "bg-amber-400": variant === "waiting",
          "bg-sky-400": variant === "claimed",
          "bg-text-tertiary": variant === "default",
        })}
      />
      {children}
    </span>
  );
}
