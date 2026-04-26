import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  backHref,
  actionLabel,
  actionHref,
  onAction,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-focus transition-all"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-text-secondary mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {actionLabel && (actionHref || onAction) && (
        <Button variant="primary" size="default" onClick={onAction}>
          {actionHref ? <a href={actionHref}>{actionLabel}</a> : actionLabel}
        </Button>
      )}
    </div>
  );
}
