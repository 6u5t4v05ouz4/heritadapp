import { cn } from "@/lib/utils";

interface Step {
  label: string;
  number: number;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export default function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2 md:gap-4", className)}>
      {steps.map((step, index) => {
        const isActive = step.number === currentStep;
        const isCompleted = step.number < currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.number} className="flex items-center gap-2 md:gap-4 flex-1">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={cn(
                  "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-semibold transition-all duration-200",
                  {
                    "bg-accent-primary text-slate-900": isActive,
                    "bg-emerald-500/20 text-emerald-400": isCompleted,
                    "bg-bg-elevated text-text-tertiary border border-border-subtle": !isActive && !isCompleted,
                  }
                )}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden md:block",
                  {
                    "text-text-primary": isActive,
                    "text-emerald-400": isCompleted,
                    "text-text-tertiary": !isActive && !isCompleted,
                  }
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "h-px flex-1 min-w-[20px] max-w-[60px] transition-colors duration-200",
                  {
                    "bg-emerald-500/30": isCompleted,
                    "bg-border-subtle": !isCompleted,
                  }
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
