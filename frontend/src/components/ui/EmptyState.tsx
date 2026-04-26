import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";
import Button from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 md:p-12",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border-subtle flex items-center justify-center mb-5">
        {icon || <Shield className="w-8 h-8 text-text-tertiary" />}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6">{description}</p>
      {actionLabel && (actionHref || onAction) && (
        <Button variant="primary" onClick={onAction} asChild={!!actionHref}>
          {actionHref ? (
            <a href={actionHref}>{actionLabel}</a>
          ) : (
            actionLabel
          )}
        </Button>
      )}
    </div>
  );
}
