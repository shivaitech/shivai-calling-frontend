import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, ArrowRight, Check, CreditCard, Crown, Loader2, X } from "lucide-react";
import { BillingError, cardBillingAPI, formatCents, type ChangePreview, type Interval, type Overview, type PlanCard, type ResourceLimit } from "../../services/billingAPI";
import { fmtDate } from "./billingUi";
import { Label, Radio, Row } from "./CheckoutModal";

/**
 * The bill for changing plan when already paying (no Stripe page: the card on file is used).
 * Stripe prorates: unused time on the current plan comes back as a credit, the new plan is
 * charged for the time it covers. The server's preview gives the exact figures; until it
 * answers (or where it doesn't exist yet) they're estimated here the same way.
 */

const GOLD = "#a8822f";
const TIER_ORDER = ["essential", "signature", "prestige"];
const BRAND: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", amex: "American Express", rupay: "RuPay", discover: "Discover" };
const DAY = 86_400_000;

const shift = (iso: string | Date, interval: Interval, by: number) => {
  const d = new Date(iso);
  if (interval === "year") d.setFullYear(d.getFullYear() + by);
  else d.setMonth(d.getMonth() + by);
  return d;
};

/** Stripe-style proration, worked out here when the server can't preview it. */
function estimate(overview: Overview, price: number, interval: Interval): ChangePreview {
  const curInterval = overview.price.interval ?? "year";
  const end = overview.current_period_end ? new Date(overview.current_period_end) : shift(new Date(), curInterval, 1);
  const start = shift(end, curInterval, -1);
  const now = Date.now();
  const left = Math.min(1, Math.max(0, (end.getTime() - now) / Math.max(DAY, end.getTime() - start.getTime())));
  const credit = Math.round(overview.price.amount * left);
  // Same period: the new price for the rest of it. New period: it starts today, at full price.
  const samePeriod = interval === curInterval;
  const charge = samePeriod ? Math.round(price * left) : price;
  return {
    new_plan_charge: charge,
    credit,
    amount_due: Math.max(0, charge - credit),
    credit_balance: Math.max(0, credit - charge),
    currency: overview.price.currency,
    next_payment_date: (samePeriod ? end : shift(new Date(), interval, 1)).toISOString(),
    next_payment_amount: price,
  };
}

const limitText = (n: number | null | undefined, one: string, many: string) =>
  n === undefined ? "—" : n === null ? `Unlimited ${many}` : n === 0 ? `No ${many}` : n === 1 ? `1 ${one}` : `${n} ${many}`;

export default function ChangePlanModal({
  overview,
  plans,
  initial,
  usage,
  busy,
  onConfirm,
  onClose,
}: {
  overview: Overview;
  plans: PlanCard[];
  initial: { plan: PlanCard; interval: Interval };
  /** Cards / AI agents in use (GET /billing/limits), to warn before a smaller plan. */
  usage?: Partial<Record<"business_cards" | "ai_agents", ResourceLimit>>;
  busy: boolean;
  onConfirm: (plan: PlanCard, interval: Interval) => void;
  onClose: () => void;
}) {
  const current = overview.plan!;
  const curInterval = overview.price.interval;
  const paid = useMemo(() => plans.filter((p) => !p.is_free && p.purchasable), [plans]);
  const [planKey, setPlanKey] = useState(initial.plan.key);
  const [interval, setPeriod] = useState<Interval>(initial.interval);
  const plan = paid.find((p) => p.key === planKey) ?? initial.plan;
  const price = plan.prices[interval];
  const isCurrent = plan.key === current.key && interval === curInterval;

  const [preview, setPreview] = useState<ChangePreview | null>(null);
  const [exact, setExact] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, busy]);

  // Exact figures from the server; an estimate meanwhile, or when it has no preview yet.
  useEffect(() => {
    if (!price || isCurrent) return setPreview(null);
    setPreview(estimate(overview, price.amount, interval));
    setExact(false);
    setLoading(true);
    let live = true;
    cardBillingAPI
      .previewChange(plan.key, interval)
      .then((p) => {
        if (live && p && typeof p.amount_due === "number") {
          setPreview(p);
          setExact(true);
        }
      })
      .catch((e: BillingError) => void e)
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey, interval]);

  const currency = preview?.currency || plan.currency || overview.price.currency || "usd";
  const money = (c: number) => formatCents(c, currency);
  const upgrade = TIER_ORDER.indexOf(plan.key) > TIER_ORDER.indexOf(current.key);
  const sameTier = plan.key === current.key;
  const gold = plan.key === "prestige";
  const pm = overview.payment_method;
  const due = preview?.amount_due ?? 0;
  const leftover = preview?.credit_balance ?? Math.max(0, (preview?.credit ?? 0) - (preview?.new_plan_charge ?? 0));
  const est = exact ? "" : " (est.)";

  // Going smaller: what's in use that the new plan doesn't cover.
  const over = (["business_cards", "ai_agents"] as const)
    .map((k) => {
      const used = usage?.[k]?.used ?? 0;
      const cap = plan.limits?.[k];
      return cap !== undefined && cap !== null && used > cap ? { k, used, cap } : null;
    })
    .filter(Boolean) as { k: "business_cards" | "ai_agents"; used: number; cap: number }[];

  const title = sameTier ? `Switch to ${interval === "year" ? "annual" : "monthly"} billing` : `${upgrade ? "Upgrade" : "Move"} to ${plan.name}`;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="change-title">
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" onClick={() => !busy && onClose()} />
      <div className="relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:max-w-4xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-5 py-4 dark:border-slate-700/70 sm:px-7 sm:py-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Change plan</p>
            <h2 id="change-title" className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_340px] md:overflow-hidden">
          <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6 md:overflow-y-auto">
            {/* Now → new */}
            <section>
              <Label>Your plan</Label>
              <div className="flex items-stretch gap-2">
                <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Now</p>
                  <p className="mt-0.5 truncate text-[15px] font-semibold text-slate-800 dark:text-white">{current.name}</p>
                  <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                    {formatCents(overview.price.amount, overview.price.currency)} {curInterval === "month" ? "a month" : "a year"}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 flex-none self-center text-slate-400" aria-hidden="true" />
                <div className="min-w-0 flex-1 rounded-2xl border-2 border-slate-900 p-4 dark:border-white">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">New</p>
                  <p className="mt-0.5 truncate text-[15px] font-semibold" style={gold ? { color: GOLD } : undefined}>
                    <span className={gold ? "" : "text-slate-900 dark:text-white"}>{plan.name}</span>
                  </p>
                  <p className="text-xs tabular-nums text-slate-600 dark:text-slate-300">
                    {price ? `${formatCents(price.amount, plan.currency)} ${interval === "month" ? "a month" : "a year"}` : "—"}
                  </p>
                </div>
              </div>
            </section>

            {/* Plan */}
            {paid.length > 1 && (
              <section>
                <Label>Plan</Label>
                <div role="radiogroup" aria-label="Plan" className="grid gap-2.5 sm:grid-cols-2">
                  {paid.map((p) => {
                    const on = p.key === plan.key;
                    const pr = p.prices[interval];
                    const isGold = p.key === "prestige";
                    return (
                      <button
                        key={p.key}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setPlanKey(p.key)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          on ? "border-slate-900 ring-1 ring-slate-900 dark:border-white dark:ring-white" : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-[15px] font-semibold" style={isGold ? { color: GOLD } : undefined}>
                            {isGold && <Crown className="h-4 w-4" />}
                            <span className={isGold ? "" : "text-slate-900 dark:text-white"}>{p.name}</span>
                            {p.key === current.key && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800">Current</span>}
                          </span>
                          <Radio on={on} />
                        </span>
                        <span className="mt-1 block text-sm tabular-nums text-slate-600 dark:text-slate-300">
                          {pr ? (
                            <>
                              <strong className="font-semibold text-slate-900 dark:text-white">{formatCents(pr.monthly_equivalent, p.currency)}</strong>/month
                            </>
                          ) : (
                            "Not sold on this period"
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Billing period */}
            <section>
              <Label>Billing period</Label>
              <div role="radiogroup" aria-label="Billing period" className="grid gap-2.5 sm:grid-cols-2">
                {(["year", "month"] as Interval[]).map((i) => {
                  const pr = plan.prices[i];
                  const on = i === interval;
                  return (
                    <button
                      key={i}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={!pr}
                      onClick={() => setPeriod(i)}
                      className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        on ? "border-slate-900 ring-1 ring-slate-900 dark:border-white dark:ring-white" : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-[15px] font-semibold text-slate-900 dark:text-white">
                          {i === "year" ? "Annual" : "Monthly"}
                          {i === "year" && !!plan.annual_savings_percent && (
                            <span className="rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">−{plan.annual_savings_percent}%</span>
                          )}
                        </span>
                        <Radio on={on} />
                      </span>
                      <span className="mt-1 block text-sm tabular-nums text-slate-600 dark:text-slate-300">
                        {pr ? `${formatCents(pr.amount, plan.currency)} ${i === "year" ? "a year" : "a month"}` : "Not available"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* What changes */}
            <section>
              <Label>What changes</Label>
              <dl className="divide-y divide-slate-200/70 rounded-2xl border border-slate-200 text-sm dark:divide-slate-700/60 dark:border-slate-700">
                {(
                  [
                    ["Business cards", "business_cards", "card", "cards"],
                    ["AI agents", "ai_agents", "AI agent", "AI agents"],
                  ] as const
                ).map(([label, k, one, many]) => {
                  const from = plans.find((p) => p.key === current.key)?.limits?.[k];
                  const to = plan.limits?.[k];
                  return (
                    <div key={k} className="flex items-center justify-between gap-3 px-4 py-3">
                      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
                      <dd className="flex items-center gap-2 tabular-nums">
                        <span className="text-slate-500 dark:text-slate-400">{limitText(from, one, many)}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                        <span className="font-semibold text-slate-900 dark:text-white">{limitText(to, one, many)}</span>
                      </dd>
                    </div>
                  );
                })}
              </dl>
              {over.length > 0 && (
                <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-900/15 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
                  <p>
                    {over.map((o) => `You have ${o.used} ${o.k === "business_cards" ? "business cards" : "cards with AI"}; ${plan.name} includes ${o.cap}.`).join(" ")} You
                    won't be able to add more until you're within the limit.
                  </p>
                </div>
              )}
              <ul className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 text-[13px] leading-snug text-slate-600 dark:text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 flex-none" style={{ color: gold ? GOLD : "#10b981" }} />
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* The bill */}
          <aside className="border-t border-slate-200/80 bg-slate-50 px-5 py-5 dark:border-slate-700/70 dark:bg-slate-800/50 sm:px-7 sm:py-6 md:overflow-y-auto md:border-l md:border-t-0">
            <Label>Summary</Label>
            {isCurrent ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">This is your current plan. Pick another plan or billing period.</p>
            ) : !price || !preview ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">{plan.name} isn't sold {interval === "year" ? "annually" : "monthly"}.</p>
            ) : (
              <>
                <dl className="space-y-2.5 text-sm">
                  <Row label={`${plan.name} · ${interval === "year" ? "Annual" : "Monthly"}`} value={money(preview.new_plan_charge)} />
                  {interval === curInterval && preview.new_plan_charge < price.amount && (
                    <p className="-mt-1.5 text-xs text-slate-500 dark:text-slate-400">For the rest of this billing period, to {fmtDate(overview.current_period_end ?? undefined)}</p>
                  )}
                  {preview.credit > 0 && <Row label={`Unused ${current.name} credit${est}`} value={`−${money(preview.credit)}`} tone="good" />}
                  <div className="h-px bg-slate-200 dark:bg-slate-700" />
                  <div className="flex items-end justify-between gap-3 pt-0.5">
                    <dt className="text-sm font-semibold text-slate-900 dark:text-white">Due today{est}</dt>
                    <dd className="text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white">
                      {loading && !exact ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : money(due)}
                    </dd>
                  </div>
                  {leftover > 0 && <Row label="Credit kept for your next invoices" value={money(leftover)} tone="good" />}
                </dl>

                <div className="mt-4 space-y-2 rounded-2xl bg-white px-4 py-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                  <p>
                    {plan.name} starts <strong className="font-semibold text-slate-900 dark:text-white">right away</strong>. Then{" "}
                    <strong className="font-semibold text-slate-900 dark:text-white">{money(preview.next_payment_amount ?? price.amount)}</strong>{" "}
                    {interval === "year" ? "a year" : "a month"}
                    {preview.next_payment_date && (
                      <>
                        , next on <strong className="font-semibold text-slate-900 dark:text-white">{fmtDate(preview.next_payment_date)}</strong>
                      </>
                    )}
                    .
                  </p>
                  {pm && (
                    <p className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" /> {due > 0 ? "Charged to" : "Card on file:"} {BRAND[pm.brand?.toLowerCase()] ?? pm.brand} ending {pm.last4}
                    </p>
                  )}
                  {!exact && !loading && <p className="text-slate-400">Estimated from the days left on your plan. Stripe works out the exact amount to the second.</p>}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => onConfirm(plan, interval)}
              disabled={busy || isCurrent || !price || !preview}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-semibold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${
                gold ? "hover:brightness-105" : "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              }`}
              style={gold ? { background: "linear-gradient(135deg,#c9a24d,#a8822f)" } : undefined}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {due > 0 ? `Pay ${money(due)} and switch` : `Switch to ${plan.name}`}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="mt-2 w-full rounded-2xl px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Keep {current.name}
            </button>
          </aside>
        </div>
      </div>
    </div>,
    document.body,
  );
}
