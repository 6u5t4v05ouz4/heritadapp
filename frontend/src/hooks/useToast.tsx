"use client";

import { useState, useCallback } from "react";
import Toast, { ToastProps } from "@/components/ui/Toast";

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastItem["type"] = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message: string) => addToast(message, "success"), [addToast]);
  const error = useCallback((message: string) => addToast(message, "error"), [addToast]);
  const info = useCallback((message: string) => addToast(message, "info"), [addToast]);

  const ToastContainer = useCallback(() => {
    return (
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={removeToast}
          />
        ))}
      </div>
    );
  }, [toasts, removeToast]);

  return { success, error, info, ToastContainer };
}
