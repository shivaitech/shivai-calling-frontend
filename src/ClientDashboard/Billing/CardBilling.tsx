import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, CalendarClock, CreditCard, Download, ExternalLink, FileText, Info, Loader2, Tag } from "lucide-react";
import GlassCard from "../../components/GlassCard";
import appToast from "../../components/AppToast";
import { appWorkspacePath } from "../../marketplace/apps";
import { PLANS, type Billing as Cycle, type PlanId } from "../../pages/digitalCardPricing";
import {
  BillingError,
  cardBillingAPI,
  formatCents,
  type Interval,
  type Invoice,
  type Overview,
  type PlanCard,
  type PlansData,
  type SubStatus,
} from "../../services/billingAPI";
import CardPlanPicker, { toInterval } from "./CardPlanPicker";
import { useAuth } from "../../contexts/AuthContext";
import { complimentaryPlan } from "../../pages/complimentaryPlans";
import { ItemIcon, Pill, fmtDate } from "./billingUi";

/**
 * Digital Business Card billing, on Stripe (see billingAPI.ts). Plans and prices come from the
 * API. After checkout Stripe sends the customer back with ?checkout=success; the plan only
 * changes when Stripe's webhook lands, so the page polls the overview until it's active.
 */

const STATUS: Record<SubStatus, { label: string; cls: string }> = {
  free: { label: "Free", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300" },
  trialing: { label: "Trial", cls: "bg-sky-100 text-sky-700 dark:bg-sky-900/25 dark:text-sky-300" },
  past_due: { label: "Payment failed", cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/25 dark:text-rose-300" },
  unpaid: { label: "Unpaid", cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/25 dark:text-rose-300" },
  canceled: { label: "Cancelled", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  incomplete: { label: "Finishing payment", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/25 dark:text-amber-300" },
  incomplete_expired: { label: "Payment expired", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  paused: { label: "Paused", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
};

const INVOICE_STATUS: Record<string, { label: string; cls: string }> = {
  paid: { label: "Paid", cls: STATUS.active.cls },
  open: { label: "Due", cls: STATUS.incomplete.cls },
  uncollectible: { label: "Failed", cls: STATUS.past_due.cls },
  void: { label: "Void", cls: STATUS.free.cls },
  draft: { label: "Draft", cls: STATUS.free.cls },
};

/**
 * The built-in plans (same table as the marketing page), in the API's shape. Shown whenever
 * GET /billing/plans can't answer — the plans are always visible; buying waits for the API.
 */
const FALLBACK_PLANS: PlanCard[] = PLANS.map((p) => {
  const cents = (n: number) => Math.round(n * 100);
  return {
    id: p.id,
    key: p.id,
    name: p.name,
    tagline: p.eyebrow,
    description: p.pitch,
    features: p.features.map((f) => f.text),
    is_free: false,
    currency: "usd",
    prices: {
      month: { amount: cents(p.monthly), monthly_equivalent: cents(p.monthly) },
      year: { amount: cents(p.yearly), monthly_equivalent: cents(p.yearlyPerMonth) },
    },
    annual_savings_percent: Math.round((1 - p.yearly / (p.monthlyWas * 12)) * 100),
    purchasable: false,
  };
});

const BRAND: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", amex: "American Express", rupay: "RuPay", discover: "Discover", jcb: "JCB", unionpay: "UnionPay" };
/** No paid plan in these states — show the free view. */
const NOT_PAYING: SubStatus[] = ["free", "canceled", "incomplete_expired"];
const invoiceIso = (c: number | string) => (typeof c === "number" ? new Date(c < 1e12 ? c * 1000 : c).toISOString() : c);

export default function CardBilling({
  preselect,
  checkoutResult,
  onCheckoutHandled,
  inApp = false,
}: {
  /** Plan picked on the pricing page / in the card creator, carried here to finish checkout. */
  preselect?: { plan: PlanId; billing: Cycle } | null;
  checkoutResult?: "success" | "cancelled" | null;
  onCheckoutHandled: () => void;
  /** Shown inside the Digital Card app: no "Open app" link. */
  inApp?: boolean;
}) {
  const [plans, setPlans] = useState<PlansData | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  /** false: admin / staff (403) — they can see plans but not buy. */
  const [canPay, setCanPay] = useState(true);
  /** Billing answered 503 (switched off) or isn't on this server (404). */
  const [unavailable, setUnavailable] = useState(false);
  const [cycle, setCycle] = useState<Cycle>(preselect?.billing ?? "annual");
  const [pending, setPending] = useState<string | null>(null);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promo, setPromo] = useState("");
  const [promoError, setPromoError] = useState("");
  const [change, setChange] = useState<{ plan: PlanCard; interval: Interval } | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [processingNote, setProcessingNote] = useState("");
  const [portalBusy, setPortalBusy] = useState(false);
  const [allHistory, setAllHistory] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setError("");
    const [p, o, inv] = await Promise.allSettled([cardBillingAPI.plans(), cardBillingAPI.overview(), cardBillingAPI.invoices(12)]);
    if (p.status === "fulfilled") setPlans(p.value);
    else {
      const e = p.reason as BillingError;
      if (e.status === 404 || e.status === 503) setUnavailable(true);
      else setError(e.status === 401 ? "Please sign in again to see your billing." : e.message);
    }
    let ov: Overview | null = null;
    if (o.status === "fulfilled") {
      ov = o.value;
      setOverview(ov);
    } else {
      const e = o.reason as BillingError;
      if (e.status === 403) setCanPay(false);
      else if (e.status === 404 || e.status === 503) setUnavailable(true);
    }
    if (inv.status === "fulfilled") setInvoices(inv.value);
    setLoading(false);
    return ov;
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Polling outlives the URL cleanup below, so it's stopped by unmount only.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const checkoutHandled = useRef(false);

  // Back from Stripe. Only the webhook changes the plan, so poll the overview (every 2 s, ~30 s).
  // onCheckoutHandled() strips ?checkout= from the URL, which flips checkoutResult back to null —
  // so this must not stop on that change (it used to, leaving "Confirming your payment…" forever).
  useEffect(() => {
    if (!checkoutResult || checkoutHandled.current) return;
    checkoutHandled.current = true;
    onCheckoutHandled();
    if (checkoutResult === "cancelled") {
      appToast.info("No payment was made.");
      return;
    }
    setConfirming(true);
    setProcessingNote("");
    let tries = 0;
    const tick = async () => {
      if (!mounted.current) return;
      let ov: Overview | null = null;
      try {
        ov = await cardBillingAPI.overview();
      } catch {
        /* keep polling */
      }
      if (!mounted.current) return;
      if (ov && (ov.status === "active" || ov.paid)) {
        setConfirming(false);
        await load();
        appToast.success(`You're on ${ov.plan?.name ?? "your new plan"}.`);
        return;
      }
      if (++tries >= 15) {
        setConfirming(false);
        setProcessingNote("Your payment is being processed. This page will update shortly.");
        void load();
        return;
      }
      setTimeout(tick, 2000);
    };
    void tick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutResult]);

  // A plan chosen on the pricing page / creator: bring the picker into view, once. (preselect is a
  // new object every render, so keying on it scrolled the page on every keystroke and toggle.)
  const preselectKey = preselect?.plan;
  const scrolledFor = useRef<string | null>(null);
  useEffect(() => {
    if (!preselectKey || loading || scrolledFor.current === preselectKey) return;
    scrolledFor.current = preselectKey;
    pickerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [preselectKey, loading]);

  const handleError = (e: BillingError, fallback?: () => void) => {
    if (e.status === 401) appToast.error("Your session has expired. Please sign in again.");
    else if (e.status === 403) {
      setCanPay(false);
      appToast.error(e.message);
    } else if (e.status === 503) {
      setUnavailable(true);
      appToast.info(e.message);
    } else if (fallback) fallback();
    else appToast.error(e.message);
  };

  const status: SubStatus = overview?.status ?? "free";
  const hasPaidPlan = !!overview?.plan && !overview.plan.is_free && !NOT_PAYING.includes(status);
  // A plan given free to this account (complimentaryPlans.ts) — unless it's actually paying.
  const { user } = useAuth();
  const compKey = hasPaidPlan ? null : complimentaryPlan(user?.email);
  const compName = compKey ? PLANS.find((p) => p.id === compKey)?.name ?? compKey : "";
  const currentKey = hasPaidPlan ? overview!.plan!.key : compKey ?? "free";
  // Live plans when the API answers; otherwise the built-in ones (view only).
  const livePlans = !!plans?.plans?.length;
  const shownPlans = livePlans ? plans!.plans : FALLBACK_PLANS;
  const paymentsOn = livePlans && !unavailable && !!plans?.payments_enabled && (overview?.payments_enabled ?? true);
  const currency = overview?.price.currency || plans?.currency || "usd";

  const choose = async (plan: PlanCard) => {
    if (compKey) return;
    const interval = toInterval(cycle);
    if (hasPaidPlan) {
      setChange({ plan, interval });
      return;
    }
    setPending(plan.key);
    setPromoError("");
    try {
      window.location.assign(await cardBillingAPI.checkout(plan.key, interval, promo));
    } catch (err) {
      const e = err as BillingError;
      setPending(null);
      handleError(e, () => {
        if (e.status === 409) {
          // Already subscribed: switch to the change-plan flow.
          appToast.info(e.message);
          setChange({ plan, interval });
          void load();
        } else if (e.status === 400 && promo.trim()) {
          setPromoOpen(true);
          setPromoError(e.message);
        } else if (e.status === 404) {
          appToast.error(e.message);
          void load();
        } else appToast.error(e.message);
      });
    }
  };

  const confirmChange = async () => {
    if (!change) return;
    setBusy(true);
    try {
      await cardBillingAPI.changePlan(change.plan.key, change.interval);
      setChange(null);
      appToast.success(`You're now on ${change.plan.name}.`);
      await load();
    } catch (err) {
      handleError(err as BillingError);
    } finally {
      setBusy(false);
    }
  };

  const run = async (action: "cancel" | "resume") => {
    setBusy(true);
    try {
      await cardBillingAPI[action]();
      setConfirmCancel(false);
      appToast.success(action === "cancel" ? "Your plan will end at the close of this billing period." : "Your plan will keep renewing.");
      await load();
    } catch (err) {
      handleError(err as BillingError);
    } finally {
      setBusy(false);
    }
  };

  const openPortal = async () => {
    setPortalBusy(true);
    try {
      window.location.assign(await cardBillingAPI.portal());
    } catch (err) {
      const e = err as BillingError;
      setPortalBusy(false);
      handleError(e, () => appToast.info(e.status === 404 ? "Manage billing opens after your first purchase." : e.message));
    }
  };

  const pill = compKey
    ? { label: "Complimentary", cls: STATUS.active.cls }
    : overview?.cancel_at_period_end && hasPaidPlan
      ? { label: "Ends soon", cls: STATUS.canceled.cls }
      : STATUS[status] ?? STATUS.free;
  const pm = overview?.payment_method;
  const history = [...invoices].sort((a, b) => invoiceIso(b.created).localeCompare(invoiceIso(a.created)));
  const totalPaid = history.filter((i) => i.status === "paid").reduce((s, i) => s + (i.amount_paid || 0), 0);

  return (
    <GlassCard className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <ItemIcon appId="digital-card" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Digital Business Card</h3>
            {!loading && <Pill {...pill} />}
            {confirming && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Confirming your payment…
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Your card plan, payment method and purchase history.</p>
        </div>
        {!inApp && (
          <Link
            to={appWorkspacePath("digital-card")}
            className="hidden sm:inline-flex flex-none items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Open app <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          {/* Notices */}
          <div className="mt-4 space-y-2 empty:hidden">
            {error && (
              <Notice tone="rose" action={{ label: "Try again", onClick: () => void load() }}>
                {error} Plans are shown below; buying opens once billing loads.
              </Notice>
            )}
            {compKey && (
              <Notice tone="slate">
                {compName} is free on your account. No payment needed: your cards get the {compName} look
                {compKey === "prestige" ? " (or Signature, if you prefer it in the card editor)" : ""}.
              </Notice>
            )}
            {!compKey && !error && !paymentsOn && canPay && (
              <Notice tone="amber">Card payments are being switched on. You're on the Free plan until then. Plans can be bought here as soon as it's live.</Notice>
            )}
            {!canPay && <Notice tone="slate">Admin and staff accounts can't buy plans. The plans below are shown for reference.</Notice>}
            {(status === "past_due" || status === "unpaid") && (
              <Notice tone="rose" action={canPay ? { label: "Manage billing", onClick: openPortal, busy: portalBusy } : undefined}>
                {status === "past_due"
                  ? "Your last payment failed. Update your card to keep your plan."
                  : "Your last payment failed and your plan is paused. Update your card to get it back."}
              </Notice>
            )}
            {status === "incomplete" && <Notice tone="amber">Finishing your payment…</Notice>}
            {processingNote && <Notice tone="slate">{processingNote}</Notice>}
          </div>

          {/* Current plan */}
          <dl className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryTile label="Current plan" value={hasPaidPlan ? overview!.plan!.name : compKey ? compName : "Free"} strong />
            <SummaryTile
              label="Price"
              value={
                hasPaidPlan && overview ? (
                  <>
                    {formatCents(overview.price.amount, currency)}
                    {overview.price.interval && <span className="text-xs font-medium text-slate-500"> / {overview.price.interval}</span>}
                  </>
                ) : compKey ? (
                  "Free"
                ) : (
                  formatCents(0, currency)
                )
              }
              strong
            />
            <SummaryTile
              icon={<CalendarClock className="w-3.5 h-3.5" />}
              label={overview?.cancel_at_period_end ? "Ends on" : "Renews on"}
              value={hasPaidPlan && overview?.current_period_end ? fmtDate(overview.current_period_end) : "—"}
            />
            <SummaryTile
              icon={<CreditCard className="w-3.5 h-3.5" />}
              label="Payment method"
              value={pm ? `${BRAND[pm.brand?.toLowerCase()] ?? pm.brand} ending ${pm.last4}` : "—"}
            />
          </dl>

          {hasPaidPlan && canPay && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void openPortal()}
                disabled={portalBusy}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60"
              >
                {portalBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />} Manage billing
              </button>
              {overview?.cancel_at_period_end ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void run("resume")}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-60"
                >
                  {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Resume plan
                </button>
              ) : confirmCancel ? (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-900/10 px-3 py-2 text-xs text-rose-800 dark:text-rose-200">
                  <span>
                    Cancel {overview?.plan?.name}? It stays active until {fmtDate(overview?.current_period_end ?? undefined)}, then your card moves to Free. Nothing is
                    refunded.
                  </span>
                  <button type="button" onClick={() => setConfirmCancel(false)} className="font-semibold text-slate-700 dark:text-slate-200 hover:underline">
                    Keep plan
                  </button>
                  <button type="button" disabled={busy} onClick={() => void run("cancel")} className="inline-flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-300 hover:underline disabled:opacity-60">
                    {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Cancel plan
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmCancel(true)} className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/15">
                  Cancel plan
                </button>
              )}
            </div>
          )}

          {/* Plans */}
          <div ref={pickerRef} className="mt-7 scroll-mt-24">
            {change && (
              <div className="mb-4 rounded-xl border border-slate-900/15 dark:border-white/15 bg-slate-50 dark:bg-slate-800/60 p-4">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Switch to {change.plan.name} ({change.interval === "year" ? "annual" : "monthly"})?
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Moving to a higher plan charges the difference now. Moving to a lower plan gives a credit on your next invoice.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void confirmChange()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 disabled:opacity-60"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />} Confirm switch
                  </button>
                  <button type="button" onClick={() => setChange(null)} className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700">
                    Keep current plan
                  </button>
                </div>
              </div>
            )}

            {shownPlans.length ? (
              <CardPlanPicker
                plans={shownPlans}
                cycle={cycle}
                onCycle={setCycle}
                currentKey={currentKey}
                currentInterval={hasPaidPlan ? overview?.price.interval ?? null : null}
                hasPaidPlan={hasPaidPlan}
                canPay={canPay}
                paymentsOn={paymentsOn}
                preselectedKey={preselect?.plan}
                pending={pending}
                onChoose={(p) => void choose(p)}
                complimentaryKey={compKey ?? undefined}
              />
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Plans will appear here once card billing is available.
              </p>
            )}

            {/* Promo code — first payment only */}
            {!hasPaidPlan && !compKey && paymentsOn && canPay && livePlans && (
              <div className="mt-4">
                {promoOpen ? (
                  <div className="max-w-sm">
                    <label htmlFor="promo-code" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <Tag className="h-3.5 w-3.5" /> Promo code
                    </label>
                    <input
                      id="promo-code"
                      value={promo}
                      onChange={(e) => {
                        setPromo(e.target.value);
                        setPromoError("");
                      }}
                      placeholder="Enter code"
                      autoCapitalize="characters"
                      spellCheck={false}
                      aria-invalid={!!promoError}
                      aria-describedby="promo-help"
                      className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm uppercase tracking-wide bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                        promoError ? "border-rose-300 focus:ring-rose-500/20" : "border-slate-200 dark:border-slate-700 focus:ring-slate-900/15"
                      }`}
                    />
                    <p id="promo-help" className={`mt-1 text-xs ${promoError ? "text-rose-600" : "text-slate-500 dark:text-slate-400"}`}>
                      {promoError || "Applied when you choose a plan. The discount covers your first payment only."}
                    </p>
                  </div>
                ) : (
                  <button type="button" onClick={() => setPromoOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                    <Tag className="h-4 w-4" /> Have a promo code?
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Purchase history */}
          <div className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h4 className="text-base font-semibold text-slate-800 dark:text-white">Purchase history</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Every plan purchase and renewal, with receipts.</p>
              </div>
              {history.length > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {history.length} invoice{history.length === 1 ? "" : "s"} · {formatCents(totalPaid, history[0].currency || currency)} paid
                </p>
              )}
            </div>

            {history.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-8 px-4 text-center">
                <FileText className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">No purchases yet</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">When you buy or renew a plan, it shows here with a receipt.</p>
              </div>
            ) : (
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="hidden sm:grid grid-cols-[7.5rem_minmax(0,1fr)_6rem_6rem_4.5rem] gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <span>Date</span>
                  <span>Invoice</span>
                  <span className="text-right">Amount</span>
                  <span>Status</span>
                  <span className="sr-only">Receipt</span>
                </div>
                <ul className="divide-y divide-slate-200/70 dark:divide-slate-700/60">
                  {(allHistory ? history : history.slice(0, 6)).map((inv, i) => {
                    const st = INVOICE_STATUS[inv.status] ?? { label: inv.status, cls: STATUS.free.cls };
                    return (
                      <li
                        key={inv.id ?? inv.number ?? i}
                        className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[7.5rem_minmax(0,1fr)_6rem_6rem_4.5rem] items-center gap-x-3 gap-y-1 px-4 py-3"
                      >
                        <span className="order-2 sm:order-none col-span-2 sm:col-span-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                          {fmtDate(invoiceIso(inv.created))}
                        </span>
                        <span className="order-1 sm:order-none min-w-0">
                          <span className="block text-sm font-medium text-slate-800 dark:text-white truncate">{inv.description || "Digital Card plan"}</span>
                          {inv.number && <span className="block text-[11px] text-slate-400 truncate">{inv.number}</span>}
                        </span>
                        <span className="order-1 sm:order-none text-sm font-semibold tabular-nums text-slate-800 dark:text-white text-right">
                          {formatCents(inv.amount_paid, inv.currency || currency)}
                        </span>
                        <span className="order-3 sm:order-none">
                          <Pill {...st} />
                        </span>
                        <span className="order-3 sm:order-none flex justify-end gap-1">
                          {inv.hosted_invoice_url && (
                            <a
                              href={inv.hosted_invoice_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`View invoice ${inv.number ?? ""}`}
                              title="View invoice"
                              className="w-8 h-8 grid place-items-center rounded-lg common-bg-icons hover:opacity-80"
                            >
                              <ExternalLink className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                            </a>
                          )}
                          {inv.invoice_pdf && (
                            <a
                              href={inv.invoice_pdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Download invoice ${inv.number ?? ""} PDF`}
                              title="Download PDF"
                              className="w-8 h-8 grid place-items-center rounded-lg common-bg-icons hover:opacity-80"
                            >
                              <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                            </a>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {history.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setAllHistory((v) => !v)}
                    className="w-full border-t border-slate-200 dark:border-slate-700 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    {allHistory ? "Show fewer" : `Show all ${history.length} invoices`}
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </GlassCard>
  );
}

function SummaryTile({ label, value, icon, strong }: { label: string; value: React.ReactNode; icon?: React.ReactNode; strong?: boolean }) {
  return (
    <div className="rounded-xl common-bg-icons p-3 sm:p-4 min-w-0">
      <dt className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        {icon}
        {label}
      </dt>
      <dd className={`mt-1 truncate text-slate-800 dark:text-white tabular-nums ${strong ? "text-base sm:text-lg font-bold" : "text-sm sm:text-base font-semibold"}`}>{value}</dd>
    </div>
  );
}

const TONES = {
  amber: "border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/15 text-amber-800 dark:text-amber-200",
  rose: "border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/15 text-rose-800 dark:text-rose-200",
  slate: "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200",
};

function Notice({
  tone,
  children,
  action,
}: {
  tone: keyof typeof TONES;
  children: React.ReactNode;
  action?: { label: string; onClick: () => void; busy?: boolean };
}) {
  const Icon = tone === "slate" ? Info : AlertTriangle;
  return (
    <div className={`flex flex-wrap items-start gap-x-3 gap-y-2 rounded-xl border px-4 py-3 text-sm ${TONES[tone]}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-none" />
      <span className="flex-1 min-w-[12rem]">{children}</span>
      {action && (
        <button type="button" onClick={action.onClick} disabled={action.busy} className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 disabled:opacity-60">
          {action.busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {action.label}
        </button>
      )}
    </div>
  );
}
