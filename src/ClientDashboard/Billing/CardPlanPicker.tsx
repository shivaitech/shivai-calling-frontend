import { ArrowRight, BadgePercent, Check, Crown, Loader2, Lock, Sparkles } from "lucide-react";
import type { Billing as Cycle } from "../../pages/digitalCardPricing";
import { formatCents, type Interval, type PlanCard } from "../../services/billingAPI";
import PlanCardPreview, { type PlanTier } from "../apps/DigitalCard/PlanCardPreview";
import { FOUNDING_OFFER_LABEL, isFoundingFree } from "../../pages/foundingOffer";

/**
 * Card plan picker for the Billing page. Plans, prices and features all come from
 * GET /billing/plans (admin-editable) — nothing here is hard-coded except the look.
 * Annual is the default and shows the real difference: the monthly price struck through,
 * the per-month annual price, and what that saves a year.
 */

const GOLD = "#a8822f";
export const toInterval = (c: Cycle): Interval => (c === "annual" ? "year" : "month");

const TIERS: Record<string, PlanTier> = { essential: "essential", signature: "signature", prestige: "prestige", free: "essential" };

/** Cents saved a year by paying annually, or 0 when there's nothing to compare. */
const yearlySaving = (p: PlanCard) => (p.prices.month && p.prices.year ? Math.max(0, p.prices.month.amount * 12 - p.prices.year.amount) : 0);

/** "1 business card", "Up to 2 business cards", "No AI agents", "Unlimited AI agents". */
function limitText(n: number | null, one: string, many: string): string {
  if (n === null) return `Unlimited ${many}`;
  if (n === 0) return `No ${many}`;
  return n === 1 ? `1 ${one}` : `Up to ${n} ${many}`;
}

export default function CardPlanPicker({
  plans,
  cycle,
  onCycle,
  currentKey,
  currentInterval,
  hasPaidPlan,
  canPay,
  paymentsOn,
  preselectedKey,
  pending,
  onChoose,
  complimentaryKey,
  foundingAccount = false,
}: {
  plans: PlanCard[];
  cycle: Cycle;
  onCycle: (c: Cycle) => void;
  /** The account's plan key ("essential" when not paying). */
  currentKey: string;
  currentInterval: Interval | null;
  hasPaidPlan: boolean;
  /** false for admin / staff accounts (the API answers 403): buttons are hidden. */
  canPay: boolean;
  /** false = payments switched off: buttons say "Opens soon". */
  paymentsOn: boolean;
  preselectedKey?: string;
  pending: string | null;
  onChoose: (plan: PlanCard) => void;
  /** The account has this plan free (complimentary): it's marked current and nothing is for sale. */
  complimentaryKey?: string;
  /** A founding member: no limits and no billing, so every plan is simply included. */
  foundingAccount?: boolean;
}) {
  const annual = cycle === "annual";
  const interval = toInterval(cycle);
  const maxPercent = Math.max(0, ...plans.map((p) => p.annual_savings_percent ?? 0));
  const maxSaving = Math.max(0, ...plans.map(yearlySaving));
  const currency = plans[0]?.currency ?? "usd";
  const cols = plans.length >= 4 ? "md:grid-cols-2 xl:grid-cols-4" : plans.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2";

  return (
    <div>
      {/* Heading + billing toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="text-base font-semibold text-slate-800 dark:text-white">{hasPaidPlan ? "Change plan" : "Choose a plan"}</h4>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {annual && maxPercent > 0 ? `Pay yearly and save up to ${maxPercent}%.` : "Flexible monthly billing. Cancel anytime."}
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
                {c === "annual" && maxPercent > 0 && (
                  <span className="rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">−{maxPercent}%</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {!annual && maxSaving > 0 && (
        <button
          type="button"
          onClick={() => onCycle("annual")}
          className="group mt-4 flex w-full items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/15 dark:to-teal-900/10 px-4 py-3 text-left transition hover:border-emerald-300"
        >
          <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-emerald-500 text-white">
            <BadgePercent className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1 text-sm">
            <strong className="font-semibold text-emerald-800 dark:text-emerald-200">Switch to annual and save up to {formatCents(maxSaving, currency)} a year.</strong>
            <span className="block text-emerald-700/80 dark:text-emerald-300/80">Same plans, {maxPercent}% less than paying monthly.</span>
          </span>
          <ArrowRight className="hidden sm:block h-4 w-4 flex-none text-emerald-700 transition-transform group-hover:translate-x-0.5" />
        </button>
      )}

      <div className={`mt-4 grid gap-4 ${cols}`}>
        {plans.map((p) => {
          const price = p.prices[interval];
          const onThisPlan = currentKey === p.key;
          // Founding Member offer: Essential is free (no checkout) — everyone not paying is on it.
          const founding = isFoundingFree(p.key);
          // Paid plans are "current" for their own period; switching period is a plan change.
          const isCurrent = foundingAccount
            ? false
            : complimentaryKey
            ? p.key === complimentaryKey
            : (onThisPlan && (p.is_free || !hasPaidPlan || currentInterval === interval)) || (founding && !hasPaidPlan);
          const popular = p.key === "signature";
          const gold = p.key === "prestige";
          const picked = preselectedKey === p.key && !isCurrent;
          const highlight = picked || (popular && !preselectedKey);
          const saving = yearlySaving(p);

          let label = "";
          let disabled = false;
          if (foundingAccount) {
            label = "Included";
            disabled = true;
          } else if (complimentaryKey) {
            // Free on this account: nothing to buy.
            const tiers = ["essential", "signature", "prestige"];
            label = p.key === complimentaryKey ? "Your plan · Free" : tiers.indexOf(p.key) < tiers.indexOf(complimentaryKey) ? "Included free" : "Not included";
            disabled = true;
          } else if (founding) {
            label = "Free for Founding Members";
            disabled = true;
          } else if (p.is_free) {
            label = hasPaidPlan ? "Included when you cancel" : "Your current plan";
            disabled = true;
          } else if (!price) {
            label = `No ${annual ? "annual" : "monthly"} option`;
            disabled = true;
          } else if (!paymentsOn || !p.purchasable) {
            label = "Opens soon";
            disabled = true;
          } else if (onThisPlan && hasPaidPlan) {
            label = `Switch to ${annual ? "annual" : "monthly"}`;
          } else {
            label = `${hasPaidPlan ? "Switch to" : "Choose"} ${p.name}`;
          }

          return (
            <article
              key={p.id || p.key}
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
                  className={`absolute -top-3 left-5 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
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
                <PlanCardPreview tier={TIERS[p.key] ?? "essential"} height={188} />
              </div>

              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {p.tagline && (
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: gold ? GOLD : undefined }}>
                      <span className={gold ? "" : "text-slate-400"}>{p.tagline}</span>
                    </p>
                  )}
                  <h5 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white" style={gold ? { color: GOLD } : undefined}>
                    {p.name}
                  </h5>
                </div>
                {gold && <Crown className="h-5 w-5 flex-none" style={{ color: GOLD }} aria-hidden="true" />}
              </div>

              {/* Price — fixed height so the cards line up on either billing period */}
              <div className="mt-4 min-h-[118px]">
                {founding ? (
                  <>
                    <p className="flex items-center gap-2 text-sm">
                      {p.prices.month && <s className="tabular-nums text-slate-400">{formatCents(p.prices.month.amount, p.currency)}/mo</s>}
                      <span className="rounded-md bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Founding Member</span>
                    </p>
                    <p className="mt-0.5 flex items-baseline gap-1.5">
                      <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Free</span>
                      <span className="text-sm font-medium text-slate-500">for life</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">For cards created before {FOUNDING_OFFER_LABEL}.</p>
                  </>
                ) : p.is_free ? (
                  <>
                    <p className="text-sm text-slate-400">Always free</p>
                    <p className="mt-0.5 flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white">{formatCents(0, p.currency)}</span>
                    </p>
                  </>
                ) : !price ? (
                  <p className="text-sm text-slate-500">Not sold {annual ? "annually" : "monthly"}. Try the other billing period.</p>
                ) : annual ? (
                  <>
                    {p.prices.month && (
                      <p className="flex items-center gap-2 text-sm">
                        <s className="tabular-nums text-slate-400">{formatCents(p.prices.month.amount, p.currency)}/mo</s>
                        {!!p.annual_savings_percent && (
                          <span className="rounded-md bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-300">
                            −{p.annual_savings_percent}%
                          </span>
                        )}
                      </p>
                    )}
                    <p className="mt-0.5 flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white">{formatCents(price.monthly_equivalent, p.currency)}</span>
                      <span className="text-sm text-slate-500">/month</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Billed annually at {formatCents(price.amount, p.currency)}</p>
                    {saving > 0 && (
                      <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        <BadgePercent className="h-3.5 w-3.5" /> You save {formatCents(saving, p.currency)} a year
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-400">Monthly price</p>
                    <p className="mt-0.5 flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white">{formatCents(price.amount, p.currency)}</span>
                      <span className="text-sm text-slate-500">/month</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Billed monthly · cancel anytime</p>
                    {p.prices.year && saving > 0 && (
                      <button
                        type="button"
                        onClick={() => onCycle("annual")}
                        className="mt-2 inline-flex items-center gap-1 rounded-lg border border-dashed border-emerald-300 dark:border-emerald-800 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      >
                        Annual: {formatCents(p.prices.year.monthly_equivalent, p.currency)}/mo · save {formatCents(saving, p.currency)}/yr
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* What the plan allows: cards and AI agents (0 = not included, null = unlimited) */}
              {p.limits && (
                <p className="mt-3 text-[12.5px] font-semibold text-slate-700 dark:text-slate-200">
                  {[limitText(p.limits.business_cards, "business card", "business cards"), limitText(p.limits.ai_agents, "AI agent", "AI agents")].join(" · ")}
                </p>
              )}

              <div className="my-4 h-px bg-slate-200/80 dark:bg-slate-700/70" />

              {p.description && <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">{p.description}</p>}
              <ul className={`flex-1 space-y-2 ${p.description ? "mt-3" : ""}`}>
                {p.features.slice(0, 5).map((f) => (
                  <li key={f} className="flex gap-2 text-[13px] leading-snug text-slate-600 dark:text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 flex-none" style={{ color: gold ? GOLD : "#10b981" }} />
                    {f}
                  </li>
                ))}
                {p.features.length > 5 && <li className="pl-6 text-xs text-slate-400">+ {p.features.length - 5} more</li>}
              </ul>

              {canPay &&
                (isCurrent ? (
                  <span className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/25">
                    <Check className="h-4 w-4" /> Your current plan
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={disabled || pending !== null}
                    onClick={() => onChoose(p)}
                    className={`mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold transition disabled:cursor-not-allowed ${
                      highlight
                        ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 disabled:opacity-60"
                        : gold
                          ? "text-white hover:brightness-105 disabled:opacity-60"
                          : "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 disabled:opacity-70"
                    }`}
                    style={gold && !highlight ? { background: "linear-gradient(135deg,#c9a24d,#a8822f)" } : undefined}
                  >
                    {pending === p.key ? <Loader2 className="h-4 w-4 animate-spin" /> : label === "Opens soon" ? <Lock className="h-3.5 w-3.5" /> : null}
                    {label}
                  </button>
                ))}
            </article>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-400">You'll pay on Stripe's secure checkout page. Card details never pass through ShivAI.</p>
    </div>
  );
}
