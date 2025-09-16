import { createContext } from "react";

export type Toast = {
  id: number;
  message: string;
  href?: string;
  variant?: "success" | "info" | "error";
  duration?: number;
};

export type ToastCtx = {
  showToast: (t: Omit<Toast, "id">) => void;
};

export const ToastContext = createContext<ToastCtx>({
  showToast: () => {},
});
