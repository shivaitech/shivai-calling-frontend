import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Check, Crown } from "lucide-react";
import { money, usePlans, type Billing, type PlanId } from "../../pages/digitalCardPricing";
import PlanCardPreview from "../apps/DigitalCard/PlanCardPreview";
import type { PaidPlan } from "./checkoutFlow";

/**
 * A card was made on a paid plan that isn't paid for (checkout closed, or they came back later).
 * They have to choose before carrying on: pay for Prestige / Signature, or continue free on
 * Essential, which drops the plan they picked (the card shows the Essential look). No close
 * button: one of the three is the way out.
 */

const GOLD = "#a8822f";
const ORDER: PlanId[] = ["prestige", "signature", "essential"];

export default function PlanDecisionModal({
  chosen,
  billing,
  founding = false,
  onPick,
  onEssential,
}: {
  /** The plan the card was designed on. */
  chosen: PaidPlan;
  billing: Billing;
  /** Founding Members get Essential free. */
  founding?: boolean;
  onPick: (plan: PaidPlan, billing: Billing) => void;
  onEssential: () => void;
}) {
  const plans = usePlans();
  const chosenName = plans.find((p) => p.id === chosen)?.name ?? chosen;

  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  const ordered = ORDER.map((id) => plans.find((p) => p.id === id)).filter(Boolean) as typeof plans;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="decide-title">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]" />
      <div className="relative max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:max-w-4xl sm:rounded-3xl sm:p-8">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">One step left</p>
          <h2 id="decide-title" className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 text-balance dark:text-white sm:text-[28px]">
            Choose how to continue
          </h2>
          <p className="mt-2.5 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
            Your card was designed on {chosenName}, which isn't paid for yet. Pay to keep its look and features, or continue free on Essential.
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {ordered.map((p) => {
            const free = p.id === "essential";
            const picked = p.id === chosen;
            const gold = p.id === "prestige";
            const perMonth = billing === "annual" ? p.yearlyPerMonth : p.monthly;
            return (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl border p-4 ${
                  picked
                    ? "border-slate-900 ring-1 ring-slate-900 dark:border-white dark:ring-white"
                    : gold
                      ? "border-[#e2cd94] bg-gradient-to-b from-[#fffaf0] to-white dark:border-[#a8822f]/50 dark:from-[#2a2416] dark:to-slate-900/40"
                      : "border-slate-200 dark:border-slate-700"
                }`}
              >
                {picked && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-semibold text-white dark:bg-white dark:text-slate-900">
                    Your card's plan
                  </span>
                )}
                <PlanCardPreview tier={p.id} height={120} />
                <p className="mt-3 flex items-center gap-1.5 text-base font-semibold" style={gold ? { color: GOLD } : undefined}>
                  {gold && <Crown className="h-4 w-4" />}
                  <span className={gold ? "" : "text-slate-900 dark:text-white"}>{p.name}</span>
                </p>
                <p className="mt-0.5 text-sm tabular-nums text-slate-600 dark:text-slate-300">
                  {free ? (
                    <strong className="font-semibold text-slate-900 dark:text-white">{founding ? "Free for you" : "Free"}</strong>
                  ) : (
                    <>
                      <strong className="font-semibold text-slate-900 dark:text-white">{money(perMonth, p.currency)}</strong>/month
                      {billing === "annual" && <span className="text-slate-400"> · {money(p.yearly, p.currency)}/year</span>}
                    </>
                  )}
                </p>
                <ul className="mt-3 flex-1 space-y-1.5">
                  {p.features.slice(0, 3).map((f) => (
                    <li key={f.text} className="flex gap-2 text-[13px] leading-snug text-slate-600 dark:text-slate-300">
                      <Check className="mt-0.5 h-3.5 w-3.5 flex-none" style={{ color: gold ? GOLD : "#10b981" }} />
                      {f.text}
                    </li>
                  ))}
                </ul>
                {free ? (
                  <button
                    type="button"
                    onClick={onEssential}
                    className="mt-4 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
                  >
                    Continue with Essential
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onPick(p.id as PaidPlan, billing)}
                    className={`mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.99] ${
                      gold ? "hover:brightness-105" : "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                    }`}
                    style={gold ? { background: "linear-gradient(135deg,#c9a24d,#a8822f)" } : undefined}
                  >
                    {picked ? `Pay for ${p.name}` : `Get ${p.name}`} <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          On Essential your card switches to the Essential look. You can upgrade any time from Billing.
        </p>
      </div>
    </div>,
    document.body,
  );
}
