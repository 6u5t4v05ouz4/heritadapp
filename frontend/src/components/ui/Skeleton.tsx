import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-bg-elevated",
        className
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
    </div>
  );
}
