import { Award, Check, Crown, Sparkles } from "lucide-react";
import { PLANS, type Billing, type PlanId } from "./digitalCardPricing";

const ICONS: Record<PlanId, typeof Crown> = { essential: Sparkles, signature: Award, prestige: Crown };
const money = (n: number) => `$${n.toFixed(2)}`;

/**
 * Plan choice inside the card creator. The live preview takes this plan's look (standard,
 * silver Signature, gold Prestige); after saving, checkout opens for the chosen plan.
 */
export default function CreatePlanPicker({
  plan,
  billing,
  onChange,
}: {
  plan: PlanId | null;
  billing: Billing;
  onChange: (plan: PlanId, billing: Billing) => void;
}) {
  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm" aria-labelledby="create-plan-h">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="create-plan-h" className="text-base font-semibold text-slate-900">
            {plan ? "Your plan" : "Choose your plan"}
          </h2>
          <p className="text-sm text-slate-500">Your card takes this plan's look and features. You'll confirm payment after saving.</p>
        </div>
        <div role="radiogroup" aria-label="Billing" className="inline-flex rounded-xl bg-slate-100 p-1">
          {(["annual", "monthly"] as Billing[]).map((b) => (
            <button
              key={b}
              type="button"
              role="radio"
              aria-checked={billing === b}
              onClick={() => onChange(plan ?? "signature", b)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                billing === b ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {b === "annual" ? "Annual" : "Monthly"}
              {b === "annual" && <span className="rounded bg-emerald-100 px-1 py-px text-[10px] font-bold text-emerald-700">−40%</span>}
            </button>
          ))}
        </div>
      </div>

      <div role="radiogroup" aria-label="Plan" className="mt-4 grid gap-2.5 sm:grid-cols-3">
        {PLANS.map((p) => {
          const on = plan === p.id;
          const Icon = ICONS[p.id];
          const gold = !!p.premium;
          const perMonth = billing === "annual" ? p.yearlyPerMonth : p.monthly;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(p.id, billing)}
              className={`relative flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                on
                  ? gold
                    ? "border-[#c9a24d] bg-[#fffaf0] ring-2 ring-[#c9a24d]/25"
                    : "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span
                className={`grid h-9 w-9 flex-none place-items-center rounded-lg ${
                  gold ? "bg-gradient-to-br from-[#f3dfa3] to-[#c9a24d] text-[#5a4416]" : p.id === "signature" ? "bg-gradient-to-br from-slate-100 to-slate-300 text-slate-700" : "bg-slate-900 text-white"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900" style={gold ? { color: "#8f6d25" } : undefined}>
                  {p.name}
                </span>
                <span className="block text-xs text-slate-500 tabular-nums">
                  {money(perMonth)}/mo{billing === "annual" ? " · billed yearly" : ""}
                </span>
              </span>
              {on && (
                <span className={`grid h-5 w-5 flex-none place-items-center rounded-full text-white ${gold ? "bg-[#a8822f]" : "bg-slate-900"}`}>
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
