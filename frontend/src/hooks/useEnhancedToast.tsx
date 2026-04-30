import { useState, useCallback } from "react";
import { getTxExplorerUrl } from "@/lib/explorer";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  txSignature?: string;
  duration?: number;
}

let toastIdCounter = 0;

export function useEnhancedToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (toast: Omit<ToastMessage, "id">) => {
      const id = `toast-${++toastIdCounter}`;
      const newToast: ToastMessage = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      // Auto-remove after duration
      const duration = toast.duration ?? (toast.type === "error" ? 8000 : 5000);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);

      return id;
    },
    []
  );

  const success = useCallback(
    (title: string, message?: string, txSignature?: string) => {
      return addToast({ type: "success", title, message, txSignature });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string) => {
      return addToast({ type: "error", title, message });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string) => {
      return addToast({ type: "info", title, message });
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      return addToast({ type: "warning", title, message });
    },
    [addToast]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ToastContainer = useCallback(
    () => (
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    ),
    [toasts, removeToast]
  );

  return { success, error, info, warning, toasts, ToastContainer };
}

function ToastItem({
  toast,
  onClose,
}: {
  toast: ToastMessage;
  onClose: () => void;
}) {
  const iconColors = {
    success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    error: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    info: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm animate-in slide-in-from-right-4 fade-in duration-300 ${iconColors[toast.type]}`}
      role="alert"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-text-secondary mt-1">{toast.message}</p>
        )}
        {toast.txSignature && (
          <a
            href={getTxExplorerUrl(toast.txSignature)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs text-accent-primary hover:text-accent-primary/80 transition-colors"
          >
            View on Explorer
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
      <button
        onClick={onClose}
        className="shrink-0 p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors"
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
