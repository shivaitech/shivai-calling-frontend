import { ArrowRight, BadgePercent, Check, Crown, Loader2, Lock, Sparkles } from "lucide-react";
import { PLANS, type Billing as Cycle, type Plan, type PlanId } from "../../pages/digitalCardPricing";
import { money } from "./billingUi";
import PlanCardPreview from "../apps/DigitalCard/PlanCardPreview";

/**
 * Card plan picker for the Billing page. Annual is the default and shows the real
 * difference: the monthly price struck through, the discounted price, and the dollars
 * saved a year. On Monthly, each plan nudges towards its annual price.
 */

const GOLD = "#a8822f";

const yearlySaving = (p: Plan) => p.monthlyWas * 12 - p.yearly;
const percentOff = (p: Plan) => Math.round((1 - p.yearly / (p.monthlyWas * 12)) * 100);
const MAX_SAVING = Math.max(...PLANS.map(yearlySaving));
const MAX_PERCENT = Math.max(...PLANS.map(percentOff));

export default function CardPlanPicker({
  cycle,
  onCycle,
  current,
  preselected,
  connected,
  pending,
  hasPaidPlan,
  onChoose,
}: {
  cycle: Cycle;
  onCycle: (c: Cycle) => void;
  /** The paid plan the account is on now, if any. */
  current: { plan: string; billing: Cycle | null } | null;
  /** Plan picked on the pricing page. */
  preselected?: PlanId;
  /** false = payments aren't switched on yet; buttons show "Opens soon". */
  connected: boolean;
  pending: PlanId | null;
  hasPaidPlan: boolean;
  onChoose: (plan: PlanId) => void;
}) {
  const annual = cycle === "annual";

  return (
    <div>
      {/* Heading + billing toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="text-base font-semibold text-slate-800 dark:text-white">{hasPaidPlan ? "Change plan" : "Choose a plan"}</h4>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {annual ? `Pay yearly and save ${MAX_PERCENT}% on every plan.` : "Flexible monthly billing. Cancel anytime."}
          </p>
        </div>
        <div role="radiogroup" aria-label="Billing period" className="inline-flex self-start sm:self-auto rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          {(["annual", "monthly"] as Cycle[]).map((c) => {
            const on = cycle === c;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onCycle(c)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  on ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                {c === "annual" ? "Annual" : "Monthly"}
                {c === "annual" && (
                  <span className="rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">−{MAX_PERCENT}%</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* On monthly, show what annual would save */}
      {!annual && (
        <button
          type="button"
          onClick={() => onCycle("annual")}
          className="group mt-4 flex w-full items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/15 dark:to-teal-900/10 px-4 py-3 text-left transition hover:border-emerald-300"
        >
          <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-emerald-500 text-white">
            <BadgePercent className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1 text-sm">
            <strong className="font-semibold text-emerald-800 dark:text-emerald-200">Switch to annual and save up to {money(MAX_SAVING)} a year.</strong>
            <span className="block text-emerald-700/80 dark:text-emerald-300/80">Same plans, {MAX_PERCENT}% less than paying monthly.</span>
          </span>
          <span className="hidden sm:inline-flex flex-none items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            See annual prices <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const isCurrent = !!current && current.plan === p.id && current.billing === cycle;
          const popular = p.id === "signature";
          const picked = preselected === p.id && !isCurrent;
          const gold = p.premium;
          const highlight = picked || (popular && !preselected);
          const saving = yearlySaving(p);

          return (
            <article
              key={p.id}
              className={`relative flex flex-col rounded-2xl border p-5 transition-shadow ${
                isCurrent
                  ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50/40 dark:bg-emerald-900/10"
                  : highlight
                    ? "border-slate-900 dark:border-slate-300 bg-white dark:bg-slate-900/60 shadow-lg shadow-slate-900/[0.06]"
                    : gold
                      ? "border-[#d9b25a]/60 bg-gradient-to-b from-[#fbf6ea] to-white dark:from-[#2a2416] dark:to-slate-900/40"
                      : "border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 hover:shadow-md"
              }`}
            >
              {(isCurrent || picked || popular) && (
                <span
                  className={`absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
                    isCurrent ? "bg-emerald-600 text-white" : "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <Check className="h-3 w-3" /> Current plan
                    </>
                  ) : picked ? (
                    "Your choice"
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" /> Most popular
                    </>
                  )}
                </span>
              )}

              <div className="mb-4">
                <PlanCardPreview tier={p.id} height={188} />
              </div>

              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: gold ? GOLD : undefined }}>
                    <span className={gold ? "" : "text-slate-400"}>{p.eyebrow}</span>
                  </p>
                  <h5 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white" style={gold ? { color: GOLD } : undefined}>
                    {p.name}
                  </h5>
                </div>
                {gold && <Crown className="h-5 w-5 flex-none" style={{ color: GOLD }} aria-hidden="true" />}
              </div>

              {/* Price — fixed height so the three cards line up on either billing */}
              <div className="mt-4 min-h-[118px]">
                {annual ? (
                  <>
                    <p className="flex items-center gap-2 text-sm">
                      <s className="tabular-nums text-slate-400">{money(p.monthlyWas)}/mo</s>
                      <span className="rounded-md bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-300">
                        −{percentOff(p)}%
                      </span>
                    </p>
                    <p className="mt-0.5 flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white">{money(p.yearlyPerMonth)}</span>
                      <span className="text-sm text-slate-500">/month</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{money(p.yearly)} billed yearly</p>
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      <BadgePercent className="h-3.5 w-3.5" /> You save {money(saving)} a year
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-400">Monthly price</p>
                    <p className="mt-0.5 flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white">{money(p.monthly)}</span>
                      <span className="text-sm text-slate-500">/month</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Billed monthly · cancel anytime</p>
                    <button
                      type="button"
                      onClick={() => onCycle("annual")}
                      className="mt-2 inline-flex items-center gap-1 rounded-lg border border-dashed border-emerald-300 dark:border-emerald-800 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                    >
                      Annual: {money(p.yearlyPerMonth)}/mo · save {money(saving)}/yr
                    </button>
                  </>
                )}
              </div>

              <div className="my-4 h-px bg-slate-200/80 dark:bg-slate-700/70" />

              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{p.listTitle}</p>
              <ul className="mt-2.5 flex-1 space-y-2">
                {p.features.slice(0, 4).map((f) => (
                  <li key={f.text} className="flex gap-2 text-[13px] leading-snug text-slate-600 dark:text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 flex-none" style={{ color: gold ? GOLD : "#10b981" }} />
                    {f.text}
                  </li>
                ))}
                {p.features.length > 4 && <li className="pl-6 text-xs text-slate-400">+ {p.features.length - 4} more</li>}
              </ul>

              {isCurrent ? (
                <span className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/25">
                  <Check className="h-4 w-4" /> Your current plan
                </span>
              ) : (
                <button
                  type="button"
                  disabled={!connected || pending !== null}
                  title={!connected ? "Plans can be bought once card payments are switched on" : undefined}
                  onClick={() => onChoose(p.id)}
                  className={`mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold transition disabled:cursor-not-allowed ${
                    highlight
                      ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 disabled:opacity-60"
                      : gold
                        ? "text-white hover:brightness-105 disabled:opacity-60"
                        : "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 disabled:opacity-70"
                  }`}
                  style={gold && !highlight ? { background: "linear-gradient(135deg,#c9a24d,#a8822f)" } : undefined}
                >
                  {pending === p.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : !connected ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : null}
                  {!connected
                    ? "Opens soon"
                    : `${hasPaidPlan ? "Switch to" : "Get"} ${p.name}${annual ? ` · ${money(p.yearly)}/yr` : ""}`}
                </button>
              )}
            </article>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-400">You'll finish payment on our secure checkout page. Card details never pass through ShivAI.</p>
    </div>
  );
}
