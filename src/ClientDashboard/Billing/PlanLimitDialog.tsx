import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Crown, Lock, X } from "lucide-react";
import { cardBillingAPI, formatCents, type PlanCard, type PlanLimits } from "../../services/billingAPI";
import { onPlanLimit, type PlanLimitHit } from "./planLimit";

/** Shown when the plans can't be loaded (limits as the backend defines them). */
const FALLBACK: { key: string; name: string; limits: PlanLimits }[] = [
  { key: "essential", name: "Essential", limits: { business_cards: 1, ai_agents: 0 } },
  { key: "signature", name: "Signature", limits: { business_cards: 2, ai_agents: 2 } },
  { key: "prestige", name: "Prestige", limits: { business_cards: 5, ai_agents: 5 } },
];

const ORDER = ["essential", "signature", "prestige"];

function limitLine(n: number | null | undefined, one: string, many: string): string {
  if (n === null) return `Unlimited ${many}`;
  if (n === undefined) return "";
  if (n === 0) return `No ${many}`;
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * The upgrade dialog for plan limits. Mounted once (App.tsx); opened by showPlanLimit() from any
 * screen. Shows the server's message, the plans with their limits, and leads to checkout on Billing.
 */
export default function PlanLimitDialog() {
  const navigate = useNavigate();
  const [hit, setHit] = useState<PlanLimitHit | null>(null);
  const [plans, setPlans] = useState<PlanCard[] | null>(null);

  useEffect(() => onPlanLimit(setHit), []);

  useEffect(() => {
    if (!hit || plans) return;
    cardBillingAPI
      .plans()
      .then((d) => setPlans((d?.plans ?? []).filter((p) => p.key !== "free")))
      .catch(() => setPlans([]));
  }, [hit, plans]);

  useEffect(() => {
    if (!hit) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setHit(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hit]);

  if (!hit) return null;

  const rows = (plans?.length ? plans : FALLBACK)
    .map((p) => ({
      key: p.key,
      name: p.name,
      limits: p.limits,
      price: "prices" in p ? (p as PlanCard).prices.year : null,
      currency: "currency" in p ? (p as PlanCard).currency : "usd",
      buyable: "purchasable" in p ? (p as PlanCard).purchasable && !(p as PlanCard).is_free : p.key !== "essential",
    }))
    .sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key));
  const current = (hit.plan ?? "").toLowerCase();
  const title = hit.resource === "ai_agents" ? "Upgrade to add more AI agents" : hit.resource === "business_cards" ? "Upgrade to add more cards" : "Upgrade your plan";

  const choose = (key: string) => {
    setHit(null);
    navigate(`/billing?${new URLSearchParams({ view: "apps", app: "digital-card", plan: key, billing: "annual", pay: "1" })}`);
  };

  return createPortal(
    <div className="fixed inset-0 z-[2147483000] flex items-end sm:items-center justify-center bg-slate-950/50 p-0 sm:p-6" onClick={() => setHit(null)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-limit-title"
        className="w-full max-w-2xl max-h-[min(92dvh,100%)] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-7 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
            <Lock className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="plan-limit-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{hit.message}</p>
          </div>
          <button type="button" onClick={() => setHit(null)} aria-label="Close" className="grid h-9 w-9 flex-none place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {rows.map((p) => {
            const isCurrent = p.key === current;
            const gold = p.key === "prestige";
            return (
              <div
                key={p.key}
                className={`flex flex-col rounded-2xl border p-4 ${
                  gold ? "border-[#e2cd94] bg-gradient-to-b from-[#fffaf0] to-white dark:from-slate-800 dark:to-slate-900" : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={`flex items-center gap-1.5 font-semibold ${gold ? "text-[#8a6a1f]" : "text-slate-900 dark:text-white"}`}>
                    {gold && <Crown className="h-4 w-4" />} {p.name}
                  </p>
                  {isCurrent && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Current</span>}
                </div>
                {p.price && p.price.amount > 0 ? (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    <span className="text-base font-bold text-slate-900 dark:text-white">{formatCents(p.price.monthly_equivalent, p.currency)}</span>/mo billed yearly
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{p.key === "essential" ? "Free" : " "}</p>
                )}
                <ul className="mt-3 flex-1 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                  {[limitLine(p.limits?.business_cards, "business card", "business cards"), limitLine(p.limits?.ai_agents, "AI agent", "AI agents")]
                    .filter(Boolean)
                    .map((line) => (
                      <li key={line} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 flex-none text-slate-400" /> {line}
                      </li>
                    ))}
                </ul>
                {p.buyable && !isCurrent && (
                  <button
                    type="button"
                    onClick={() => choose(p.key)}
                    className={`mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                      gold ? "text-white hover:brightness-105" : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                    }`}
                    style={gold ? { background: "linear-gradient(135deg,#c9a24d,#a8822f)" } : undefined}
                  >
                    Choose {p.name} <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">Nothing you've already created is ever removed. Upgrading only lets you add more.</p>
          <button
            type="button"
            onClick={() => {
              setHit(null);
              navigate("/app/digital-card?section=plan");
            }}
            className="inline-flex flex-none items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
          >
            Upgrade plan <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
