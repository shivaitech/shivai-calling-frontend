import { Layers } from "lucide-react";
import { getAppById } from "../../marketplace/apps";

const dateFmt = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" });
export const fmtDate = (iso?: string) => (iso ? dateFmt.format(new Date(iso)) : "—");

export const money = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: n % 1 ? 2 : 0 }).format(n);

export const Pill = ({ label, cls }: { label: string; cls: string }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${cls}`}>{label}</span>
);

export const SOON_CLS = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

/** Platform = a layered tile; apps = their marketplace icon on the app's gradient. */
export function ItemIcon({ appId, size = "md" }: { appId?: string; size?: "sm" | "md" }) {
  const app = appId ? getAppById(appId) : undefined;
  const box = size === "sm" ? "w-8 h-8 rounded-lg" : "w-11 h-11 rounded-xl";
  const icon = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const Icon = app?.icon ?? Layers;
  return (
    <span className={`${box} flex-none grid place-items-center bg-gradient-to-br ${app?.gradient ?? "from-slate-900 to-slate-600"} text-white`}>
      <Icon className={icon} />
    </span>
  );
}
