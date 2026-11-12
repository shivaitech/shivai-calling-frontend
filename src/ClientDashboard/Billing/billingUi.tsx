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

const RESULT_TONES = {
  good: "bg-emerald-500 text-white shadow-emerald-500/30",
  bad: "bg-rose-500 text-white shadow-rose-500/30",
  amber: "bg-amber-500 text-white shadow-amber-500/30",
  slate: "bg-slate-900 text-white shadow-slate-900/20 dark:bg-white dark:text-slate-900",
};

/** The page Stripe returns to (/billing/success, /billing/failed): one centred card. */
export function ResultShell({
  tone,
  icon,
  eyebrow,
  title,
  children,
}: {
  tone: keyof typeof RESULT_TONES;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-xl py-4 sm:py-10">
      <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 text-center shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] dark:border-slate-700/70 dark:bg-slate-900/85 sm:p-10">
        <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full shadow-lg ${RESULT_TONES[tone]}`}>{icon}</span>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{eyebrow}</p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 text-balance dark:text-white sm:text-[28px]">{title}</h1>
        <div className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">{children}</div>
      </section>
    </div>
  );
}
