import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  variant?: "success" | "warning" | "danger" | "neutral";
  className?: string;
}

export default function ProgressBar({ value, label, variant = "neutral", className }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  const barColor = {
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    danger: "bg-rose-400",
    neutral: "bg-accent-primary",
  }[variant];

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-text-tertiary">{label}</span>
          <span className="font-mono text-text-secondary">{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", barColor)}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
