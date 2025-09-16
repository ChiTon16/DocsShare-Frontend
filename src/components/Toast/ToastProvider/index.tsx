import React, { useCallback, useState } from "react";
import { ToastContext } from "../ToastContext";
import type { Toast } from "../ToastContext";
// hoặc gộp 1 dòng nếu TS của bạn hỗ trợ:
/// import { ToastContext, type Toast } from "../ToastContext";


export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    const toast: Toast = { id, variant: "success", duration: 3500, ...t };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), toast.duration!);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed left-4 bottom-4 z-[9999] space-y-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "min-w-[280px] max-w-[92vw] rounded-xl px-4 py-3 shadow-lg border",
              t.variant === "success" && "bg-green-50 border-green-200 text-green-800",
              t.variant === "info" && "bg-blue-50 border-blue-200 text-blue-800",
              t.variant === "error" && "bg-red-50 border-red-200 text-red-800",
            ].join(" ")}
            role="status"
          >
            <div className="flex items-start gap-3">
              <div className="mt-[2px]">✅</div>
              <div className="flex-1 text-sm">{t.message}</div>
              <button
                className="text-inherit/60 hover:text-inherit"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
