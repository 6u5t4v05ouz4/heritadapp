"use client";

import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
  onClose: (id: string) => void;
  duration?: number;
}

export default function Toast({ id, message, type = "info", onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400" />,
    info: <Info className="w-5 h-5 text-accent-primary" />,
  };

  const borders = {
    success: "border-emerald-500/20",
    error: "border-rose-500/20",
    info: "border-accent-primary/20",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-surface border shadow-lg",
        "animate-in slide-in-from-right-4 fade-in duration-300",
        borders[type]
      )}
    >
      {icons[type]}
      <p className="text-sm text-text-primary flex-1">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="text-text-tertiary hover:text-text-primary transition-colors"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
