/**
 * AppToast — unified, theme-consistent toast notifications.
 *
 * Usage:
 *   import appToast from "@/components/AppToast";
 *
 *   appToast.success("Saved!");
 *   appToast.error("Something went wrong.");
 *   appToast.info("FYI...");
 *   const id = appToast.loading("Saving...");
 *   appToast.dismiss(id);
 *
 * Design: dark slate gradient, white text, monochrome icons — no green/red/emojis.
 */

import toast from "react-hot-toast";
import { CheckCircle2, XCircle, Info, Loader2, X } from "lucide-react";

// ─── Internal UI component ────────────────────────────────────────────────────

interface AppToastUIProps {
  message: string;
  type: "success" | "error" | "info" | "loading";
  t: { id: string; visible: boolean };
}

export function AppToastUI({ message, type, t }: AppToastUIProps) {
  const icons = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    loading: Loader2,
  };

  const Icon = icons[type];

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border border-white/10 max-w-sm w-full transition-all duration-300 ${
        t.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
      style={{
        background:
          "linear-gradient(135deg, rgb(30, 41, 59) 0%, rgb(15, 23, 42) 100%)",
        color: "#f1f5f9",
        fontFamily: "inherit",
        minWidth: "240px",
      }}
    >
      <Icon
        className={`w-[18px] h-[18px] flex-shrink-0 mt-0.5 text-slate-300 ${
          type === "loading" ? "animate-spin" : ""
        }`}
      />
      <span className="text-sm font-medium flex-1 leading-snug">{message}</span>
      {type !== "loading" && (
        <button
          onClick={() => toast.dismiss(t.id)}
          aria-label="Dismiss"
          className="flex-shrink-0 text-slate-400 hover:text-white transition-colors mt-0.5"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

const appToast = {
  success: (message: string, opts?: { duration?: number }) =>
    toast.custom(
      (t) => <AppToastUI message={message} type="success" t={t} />,
      { duration: opts?.duration ?? 3000 }
    ),

  error: (message: string, opts?: { duration?: number }) =>
    toast.custom(
      (t) => <AppToastUI message={message} type="error" t={t} />,
      { duration: opts?.duration ?? 5000 }
    ),

  info: (message: string, opts?: { duration?: number }) =>
    toast.custom(
      (t) => <AppToastUI message={message} type="info" t={t} />,
      { duration: opts?.duration ?? 4000 }
    ),

  /** Returns a toast ID — pass to `appToast.dismiss(id)` to remove it. */
  loading: (message: string) =>
    toast.custom(
      (t) => <AppToastUI message={message} type="loading" t={t} />,
      { duration: Infinity }
    ),

  dismiss: (id?: string) => toast.dismiss(id),
};

export default appToast;
