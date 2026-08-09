"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, Info, XCircle, X } from "lucide-react";

type ToastType = "info" | "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Any component under the ToastProvider (mounted once in the root layout)
// can call this to fire a small, auto-dismissing notice — used for things
// like "this user has no public profile" instead of a dead click.
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

let idCounter = 0;

const TYPE_STYLES: Record<ToastType, { color: string; icon: ReactNode }> = {
  info: { color: "rgb(var(--accent))", icon: <Info size={16} /> },
  success: { color: "rgb(var(--primary))", icon: <CheckCircle2 size={16} /> },
  error: { color: "rgb(220 38 38)", icon: <XCircle size={16} /> },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast stack — fixed above the mobile bottom nav, bottom-right on desktop */}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end">
        {toasts.map((t) => {
          const style = TYPE_STYLES[t.type];
          return (
            <div
              key={t.id}
              role="status"
              className="toast-enter pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg sm:w-auto"
              style={{
                backgroundColor: "rgb(var(--surface))",
                borderColor: "rgb(var(--border))",
                color: "rgb(var(--text))",
              }}
            >
              <span className="shrink-0" style={{ color: style.color }}>
                {style.icon}
              </span>
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
