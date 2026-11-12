import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BadgePercent, Check, Crown, Loader2, Lock, ShieldCheck, Tag, X } from "lucide-react";
import { BillingError, cardBillingAPI, formatCents, type Interval, type PlanCard, type PromoCode, type PromoPreview } from "../../services/billingAPI";
import { fmtDate } from "./billingUi";
import { isPaidPlan, localDiscount, promoBlocker, promoDuration, promoLabel, stripeReturnUrls, toBilling } from "./checkoutFlow";

/**
 * The bill before Stripe: plan, billing period, promo codes (the account's own, or typed), and
 * every line of the first payment — list price, annual saving, promo, total today and what
 * renews after. "Pay" opens Stripe's checkout, which returns to /billing/success or /failed.
 */

const GOLD = "#a8822f";

/** A code put on the order: priced by the server (preview), or locally when it can't say. */
type Applied = { code: string; preview: PromoPreview | null; promo: PromoCode | null; unverified?: boolean };

const addPeriod = (interval: Interval) => {
  const d = new Date();
  if (interval === "year") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
};

const limitText = (n: number | null | undefined, one: string, many: string) =>
  n === undefined ? null : n === null ? `Unlimited ${many}` : n === 0 ? `No ${many}` : n === 1 ? `1 ${one}` : `Up to ${n} ${many}`;

export default function CheckoutModal({
  plans,
  initial,
  onClose,
  onAlreadySubscribed,
}: {
  plans: PlanCard[];
  initial: { planKey: string; interval: Interval; promo?: string | null };
  onClose: () => void;
  /** 409: the account already has a plan — switch to the change-plan flow. */
  onAlreadySubscribed: (plan: PlanCard, interval: Interval, message: string) => void;
}) {
  const paid = useMemo(() => plans.filter((p) => !p.is_free && p.purchasable && isPaidPlan(p.key)), [plans]);
  const [planKey, setPlanKey] = useState(initial.planKey);
  const [interval, setPeriod] = useState<Interval>(initial.interval);
  const plan = paid.find((p) => p.key === planKey) ?? paid[0];

  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(true);
  const [typed, setTyped] = useState(initial.promo ?? "");
  const [applied, setApplied] = useState<Applied | null>(null);
  const [checking, setChecking] = useState<string | null>(null);
  const [promoError, setPromoError] = useState("");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  // Escape closes; the page behind doesn't scroll.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !paying && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, paying]);

  // The account's promo codes. None, or no endpoint yet: just the "enter a code" box.
  useEffect(() => {
    let live = true;
    cardBillingAPI
      .promoCodes()
      .then((c) => live && setCodes(c))
      .catch(() => live && setCodes([]))
      .finally(() => live && setCodesLoading(false));
    return () => {
      live = false;
    };
  }, []);

  const apply = async (raw: string) => {
    const code = raw.trim().toUpperCase();
    if (!code || !plan) return;
    setChecking(code);
    setPromoError("");
    const known = codes.find((c) => c.code.toUpperCase() === code) ?? null;
    try {
      const preview = await cardBillingAPI.previewPromo(code, plan.key, interval);
      if (preview && preview.valid === false) {
        setApplied(null);
        setPromoError(preview.message || "This code can't be used on this plan.");
      } else setApplied({ code, preview: preview ?? null, promo: preview?.promo_code ?? known });
    } catch (err) {
      const e = err as BillingError;
      if (e.status === 404 || e.status === 405 || e.status === 501) {
        // The server can't price codes yet: work it out here, or let Stripe check it.
        const blocked = known ? promoBlocker(known, plan.key, interval) : null;
        if (blocked) {
          setApplied(null);
          setPromoError(blocked);
        } else setApplied({ code, preview: null, promo: known, unverified: !known });
      } else {
        setApplied(null);
        setPromoError(e.message || "This code can't be used.");
      }
    } finally {
      setChecking(null);
    }
  };

  // A code arriving in the link, and any code once the plan or period changes: price it again.
  const linkCodeUsed = useRef(false);
  useEffect(() => {
    if (codesLoading) return;
    const code = applied?.code || (linkCodeUsed.current ? null : initial.promo);
    linkCodeUsed.current = true;
    if (code) void apply(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey, interval, codesLoading]);

  if (!plan) return null;

  const currency = plan.currency || "usd";
  const money = (c: number) => formatCents(c, currency);
  const price = plan.prices[interval];
  const monthly = plan.prices.month;
  const annual = interval === "year";
  const subtotal = applied?.preview?.subtotal ?? price?.amount ?? 0;
  // Paying a year up front vs twelve monthly payments.
  const listPrice = annual && monthly ? monthly.amount * 12 : subtotal;
  const annualSaving = Math.max(0, listPrice - subtotal);
  const discount = applied ? (applied.preview ? applied.preview.discount : applied.promo ? localDiscount(applied.promo, subtotal, currency) : 0) : 0;
  const total = applied?.preview?.total ?? Math.max(0, subtotal - discount);
  const promo = applied?.preview?.promo_code ?? applied?.promo ?? null;
  const renewsDiscounted = promo?.duration === "forever";
  const renewal = renewsDiscounted ? total : price?.amount ?? 0;
  const renewsOn = addPeriod(interval);
  const gold = plan.key === "prestige";
  const shownCodes = codes.filter((c) => c.available !== false || c.reason);

  const pay = async () => {
    if (!price) return;
    setPaying(true);
    setError("");
    const promoCode = applied?.code;
    try {
      const url = await cardBillingAPI.checkout(plan.key, interval, promoCode, stripeReturnUrls({ plan: plan.key as "signature" | "prestige", billing: toBilling(interval), promo: promoCode }));
      window.location.assign(url);
    } catch (err) {
      const e = err as BillingError;
      setPaying(false);
      if (e.status === 409) onAlreadySubscribed(plan, interval, e.message);
      else if (e.status === 400 && promoCode) {
        setApplied(null);
        setPromoError(e.message);
      } else if (e.status === 401) setError("Your session has expired. Please sign in again.");
      else setError(e.message);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" onClick={() => !paying && onClose()} />
      <div className="relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:max-w-4xl sm:rounded-3xl border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 dark:border-slate-700/70 px-5 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Checkout</p>
            <h2 id="checkout-title" className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Upgrade to <span style={gold ? { color: GOLD } : undefined}>{plan.name}</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={paying}
            aria-label="Close"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_340px] md:overflow-hidden">
          {/* Left: choices */}
          <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6 md:overflow-y-auto">
            {/* Plan */}
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
                      className={`relative rounded-2xl border p-4 text-left transition ${
                        on ? "border-slate-900 ring-1 ring-slate-900 dark:border-white dark:ring-white" : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-[15px] font-semibold" style={isGold ? { color: GOLD } : undefined}>
                          {isGold && <Crown className="h-4 w-4" />}
                          <span className={isGold ? "" : "text-slate-900 dark:text-white"}>{p.name}</span>
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
                      {p.limits && (
                        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                          {[limitText(p.limits.business_cards, "card", "cards"), limitText(p.limits.ai_agents, "AI agent", "AI agents")].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Billing period */}
            <section>
              <Label>Billing period</Label>
              <div role="radiogroup" aria-label="Billing period" className="grid gap-2.5 sm:grid-cols-2">
                {(["year", "month"] as Interval[]).map((i) => {
                  const pr = plan.prices[i];
                  const on = i === interval;
                  const save = i === "year" && monthly && pr ? monthly.amount * 12 - pr.amount : 0;
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
                        {pr ? `${formatCents(pr.amount, currency)} ${i === "year" ? "a year" : "a month"}` : "Not available"}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                        {i === "year" ? (save > 0 ? `You save ${formatCents(save, currency)} a year` : "Billed once a year") : "Cancel anytime"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Promo codes */}
            <section>
              <Label>Promo code</Label>
              {codesLoading ? (
                <p className="mb-3 flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Looking for your promo codes…
                </p>
              ) : (
                shownCodes.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Your promo codes</p>
                    {shownCodes.map((c) => {
                      const blocked = promoBlocker(c, plan.key, interval);
                      const on = applied?.code === c.code.toUpperCase();
                      return (
                        <div
                          key={c.code}
                          className={`flex items-center gap-3 rounded-2xl border border-dashed px-3.5 py-3 ${
                            on
                              ? "border-emerald-400 bg-emerald-50/70 dark:border-emerald-700 dark:bg-emerald-900/15"
                              : blocked
                                ? "border-slate-200 opacity-60 dark:border-slate-700"
                                : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          <span className={`grid h-9 w-9 flex-none place-items-center rounded-xl ${on ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                            <BadgePercent className="h-[18px] w-[18px]" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-x-2 text-sm">
                              <strong className="font-semibold text-slate-900 dark:text-white">{promoLabel(c)}</strong>
                              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">{c.code}</code>
                            </span>
                            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                              {blocked ?? [c.name, promoDuration(c), c.expires_at ? `Expires ${fmtDate(c.expires_at)}` : null].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                          {!blocked &&
                            (on ? (
                              <button type="button" onClick={() => setApplied(null)} className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white">
                                Remove
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={!!checking}
                                onClick={() => void apply(c.code)}
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900"
                              >
                                {checking === c.code.toUpperCase() && <Loader2 className="h-3 w-3 animate-spin" />}
                                Apply
                              </button>
                            ))}
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void apply(typed);
                }}
                className="flex gap-2"
              >
                <div className="relative min-w-0 flex-1">
                  <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={typed}
                    onChange={(e) => {
                      setTyped(e.target.value);
                      setPromoError("");
                    }}
                    placeholder="Enter a code"
                    autoCapitalize="characters"
                    spellCheck={false}
                    aria-label="Promo code"
                    aria-invalid={!!promoError}
                    className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-3 text-sm uppercase tracking-wide text-slate-900 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-white ${
                      promoError ? "border-rose-300 focus:ring-rose-500/20" : "border-slate-200 focus:ring-slate-900/15 dark:border-slate-700"
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!typed.trim() || !!checking}
                  className="inline-flex flex-none items-center gap-1.5 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
                >
                  {checking && checking === typed.trim().toUpperCase() && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Apply
                </button>
              </form>
              {promoError && <p className="mt-1.5 text-xs text-rose-600">{promoError}</p>}
            </section>

            {/* What's included */}
            <section>
              <Label>Included in {plan.name}</Label>
              <ul className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 text-[13px] leading-snug text-slate-600 dark:text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 flex-none" style={{ color: gold ? GOLD : "#10b981" }} />
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Right: the bill */}
          <aside className="border-t border-slate-200/80 bg-slate-50 px-5 py-5 dark:border-slate-700/70 dark:bg-slate-800/50 sm:px-7 sm:py-6 md:overflow-y-auto md:border-l md:border-t-0">
            <Label>Order summary</Label>
            <dl className="space-y-2.5 text-sm">
              <Row label={`${plan.name} · ${annual ? "Annual" : "Monthly"}`} value={annual && monthly ? money(listPrice) : money(subtotal)} />
              {annual && monthly && (
                <p className="-mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {money(monthly.amount)} × 12 months
                </p>
              )}
              {annualSaving > 0 && <Row label={`Annual saving${plan.annual_savings_percent ? ` (${plan.annual_savings_percent}%)` : ""}`} value={`−${money(annualSaving)}`} tone="good" />}
              <div className="h-px bg-slate-200 dark:bg-slate-700" />
              <Row label="Subtotal" value={money(subtotal)} />
              {applied && (
                <Row
                  label={
                    <span className="inline-flex items-center gap-1.5">
                      Promo <code className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">{applied.code}</code>
                    </span>
                  }
                  value={applied.unverified && !discount ? "On payment page" : `−${money(discount)}`}
                  tone="good"
                />
              )}
              <Row label="Tax" value="At payment, if any" muted />
              <div className="h-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-end justify-between gap-3 pt-0.5">
                <dt className="text-sm font-semibold text-slate-900 dark:text-white">Due today</dt>
                <dd className="text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white">{money(total)}</dd>
              </div>
            </dl>

            <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
              Then <strong className="font-semibold text-slate-900 dark:text-white">{money(renewal)}</strong> {annual ? "a year" : "a month"}, renewing on{" "}
              <strong className="font-semibold text-slate-900 dark:text-white">{fmtDate(renewsOn)}</strong>
              {promo && !renewsDiscounted && <> ({promoDuration(promo).toLowerCase()} is discounted)</>}. Cancel anytime: you keep {plan.name} until the end of the period you've paid for.
            </div>

            {error && <p className="mt-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">{error}</p>}

            <button
              type="button"
              onClick={() => void pay()}
              disabled={paying || !price || !!checking}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-semibold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${
                gold ? "hover:brightness-105" : "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              }`}
              style={gold ? { background: "linear-gradient(135deg,#c9a24d,#a8822f)" } : undefined}
            >
              {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {paying ? "Opening secure payment…" : `Pay ${money(total)}`}
            </button>
            <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              <ShieldCheck className="mt-px h-3.5 w-3.5 flex-none" />
              You'll pay on Stripe's secure page. Card details never pass through ShivAI.
            </p>
          </aside>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{children}</h3>
);

const Radio = ({ on }: { on: boolean }) => (
  <span className={`grid h-[18px] w-[18px] flex-none place-items-center rounded-full border-2 ${on ? "border-slate-900 dark:border-white" : "border-slate-300 dark:border-slate-600"}`}>
    {on && <span className="h-2 w-2 rounded-full bg-slate-900 dark:bg-white" />}
  </span>
);

function Row({ label, value, tone, muted }: { label: React.ReactNode; value: React.ReactNode; tone?: "good"; muted?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className={muted ? "text-slate-500 dark:text-slate-400" : "text-slate-600 dark:text-slate-300"}>{label}</dt>
      <dd className={`text-right tabular-nums ${tone === "good" ? "font-semibold text-emerald-600 dark:text-emerald-400" : muted ? "text-slate-500 dark:text-slate-400" : "font-medium text-slate-900 dark:text-white"}`}>
        {value}
      </dd>
    </div>
  );
}
