import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, ArrowUpRight, CalendarClock, CreditCard, Download, ExternalLink, FileText, Info, Loader2, Lock } from "lucide-react";
import GlassCard from "../../components/GlassCard";
import appToast from "../../components/AppToast";
import { appWorkspacePath } from "../../marketplace/apps";
import { PLANS, type Billing as Cycle, type PlanId } from "../../pages/digitalCardPricing";
import {
  BillingError,
  cardBillingAPI,
  isPaying,
  formatCents,
  type Interval,
  type Invoice,
  type Overview,
  type PlanCard,
  type PlansData,
  type SubStatus,
} from "../../services/billingAPI";
import CardPlanPicker, { toInterval } from "./CardPlanPicker";
import CheckoutModal from "./CheckoutModal";
import PlanDecisionModal from "./PlanDecisionModal";
import ChangePlanModal from "./ChangePlanModal";
import { clearPendingPlan, loadPendingPlan, type PendingPlan } from "./pendingPlan";
import { refreshPlanLimits, usePlanLimits } from "./planLimit";
import type { ResourceLimit } from "../../services/billingAPI";

/** "1 of 2 used" · "Not included" · "Unlimited". */
const usageText = (r?: ResourceLimit) => (!r || r.limit === null ? "Unlimited" : r.limit === 0 ? "Not included" : `${r.used} of ${r.limit} used`);
import { ItemIcon, Pill, fmtDate } from "./billingUi";

/**
 * Digital Business Card billing, on Stripe (see billingAPI.ts). Plans and prices come from the
 * API. After checkout Stripe sends the customer back with ?checkout=success; the plan only
 * changes when Stripe's webhook lands, so the page polls the overview until it's active.
 */

const STATUS: Record<SubStatus, { label: string; cls: string }> = {
  // No paid plan = Essential (free for Founding Members until 31 Dec 2026). There is no "Free" plan.
  free: { label: "Essential", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
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
 * The backend's plans (prices and limits), shown whenever GET /billing/plans can't answer — the plans are
 * always visible; buying waits for the API.
 */
const FALLBACK_PLANS: PlanCard[] = [
  {
    id: "essential", key: "essential", name: "Essential", tagline: "Your professional identity",
    description: "Create and share your professional card", features: PLANS.find((p) => p.id === "essential")?.features.map((f) => f.text) ?? [],
    is_free: true, currency: "usd",
    prices: { month: { amount: 0, monthly_equivalent: 0 }, year: { amount: 0, monthly_equivalent: 0 } },
    annual_savings_percent: null, purchasable: false, limits: { business_cards: 1, ai_agents: 0 },
  },
  {
    id: "signature", key: "signature", name: "Signature", tagline: "Your presence, elevated",
    description: PLANS.find((p) => p.id === "signature")?.pitch ?? "", features: PLANS.find((p) => p.id === "signature")?.features.map((f) => f.text) ?? [],
    is_free: false, currency: "usd",
    prices: { month: { amount: 1499, monthly_equivalent: 1499 }, year: { amount: 10792, monthly_equivalent: 899 } },
    annual_savings_percent: 40, purchasable: false, limits: { business_cards: 2, ai_agents: 2 },
  },
  {
    id: "prestige", key: "prestige", name: "Prestige", tagline: "The premium experience",
    description: PLANS.find((p) => p.id === "prestige")?.pitch ?? "", features: PLANS.find((p) => p.id === "prestige")?.features.map((f) => f.text) ?? [],
    is_free: false, currency: "usd",
    prices: { month: { amount: 4499, monthly_equivalent: 4499 }, year: { amount: 32388, monthly_equivalent: 2699 } },
    annual_savings_percent: 40, purchasable: false, limits: { business_cards: 5, ai_agents: 5 },
  },
];

const BRAND: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", amex: "American Express", rupay: "RuPay", discover: "Discover", jcb: "JCB", unionpay: "UnionPay" };
const invoiceIso = (c: number | string) => (typeof c === "number" ? new Date(c < 1e12 ? c * 1000 : c).toISOString() : c);

export default function CardBilling({
  preselect,
  checkoutResult,
  onCheckoutHandled,
  inApp = false,
  askToPay = false,
  buy = false,
  promoParam,
}: {
  /** ?buy=1: open checkout on the preselected plan as soon as billing loads. */
  buy?: boolean;
  /** ?promo=: a code to put on that checkout. */
  promoParam?: string | null;
  /** Came from creating a card on a paid plan (?pay=1): ask to pay for the preselected plan first. */
  askToPay?: boolean;
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
  // A paid plan chosen when the card was created and not paid for yet (see pendingPlan.ts).
  const [pendingPlan, setPendingPlan] = useState<PendingPlan | null>(() => {
    const saved = loadPendingPlan();
    if (askToPay && preselect && preselect.plan !== "essential") return { plan: preselect.plan, billing: preselect.billing, at: Date.now() };
    return saved;
  });
  const [checkout, setCheckout] = useState<{ planKey: string; interval: Interval; promo?: string | null } | null>(null);
  const finishRef = useRef<HTMLDivElement>(null);
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
      appToast.info(loadPendingPlan() ? "No payment was made. Your plan is waiting whenever you're ready." : "No payment was made.");
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
      if (ov && isPaying(ov)) {
        setConfirming(false);
        await load();
        refreshPlanLimits();
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
    if (!preselectKey || loading || askToPay || scrolledFor.current === preselectKey) return;
    scrolledFor.current = preselectKey;
    pickerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [preselectKey, loading, askToPay]);

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
  // Founding member is only a tag: Essential, free for accounts that joined before 31 Dec 2026.
  // They keep Essential's limits and can still upgrade to Signature or Prestige like anyone else.
  const founding = !!overview?.founding_member;
  const hasPaidPlan = isPaying(overview);
  // Cards / AI agents used against the plan (GET /billing/limits).
  const planLimits = usePlanLimits();
  // Only a real payment counts; anything else is Essential.
  const currentKey = hasPaidPlan ? overview!.plan!.key : "essential";
  // Live plans when the API answers; otherwise the built-in ones (view only).
  const livePlans = !!plans?.plans?.length;
  // Essential is the free plan everyone starts on; the old "free" plan is retired, so it is hidden if it ever appears.
  const shownPlans = (livePlans ? plans!.plans : FALLBACK_PLANS).filter((p) => p.key !== "free");
  const paymentsOn = livePlans && !unavailable && !!plans?.payments_enabled && (overview?.payments_enabled ?? true);
  const currency = overview?.price.currency || plans?.currency || "usd";

  useEffect(() => {
    if (loading || !pendingPlan) return;
    if (hasPaidPlan) {
      clearPendingPlan();
      setPendingPlan(null);
    }
  }, [loading, hasPaidPlan, pendingPlan]);

  // Arriving to pay: bring the panel into view (it sits above the plans).
  useEffect(() => {
    if (!loading && askToPay && pendingPlan) finishRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const finishCard = pendingPlan ? shownPlans.find((p) => p.key === pendingPlan.plan) ?? null : null;
  const finishInterval: Interval = pendingPlan?.billing === "monthly" ? "month" : "year";
  const finishPrice = finishCard?.prices[finishInterval] ?? null;
  const showFinish = !!pendingPlan && !!finishCard && !hasPaidPlan && canPay && !confirming;
  const dropPendingPlan = () => {
    clearPendingPlan();
    setPendingPlan(null);
  };
  // The card's paid plan isn't paid for: closing checkout asks them to pay or move to Essential.
  const unpaidPlan = !!pendingPlan && !hasPaidPlan && canPay;
  const [decide, setDecide] = useState(false);
  const navigate = useNavigate();
  const continueOnEssential = () => {
    dropPendingPlan();
    setDecide(false);
    appToast.success("You're on Essential. Your card now uses the Essential look.");
    navigate("/app/digital-card?section=cards");
  };

  // Not paying yet: the checkout modal (the full bill, promo codes) and then Stripe.
  // Already paying: a plan change, confirmed in SwitchPlanModal.
  const choose = (plan: PlanCard, interval: Interval = toInterval(cycle), promo?: string | null) => {
    if (hasPaidPlan) setChange({ plan, interval });
    else setCheckout({ planKey: plan.key, interval, promo });
  };

  // Opened with ?buy=1 (the failed page's "Try again", links from the pricing page) or ?pay=1
  // (a card just made on a paid plan): straight to checkout.
  const buyOpened = useRef(false);
  useEffect(() => {
    if (!(buy || askToPay) || loading || buyOpened.current || !preselect || preselect.plan === "essential") return;
    buyOpened.current = true;
    if (askToPay && hasPaidPlan) return;
    const plan = shownPlans.find((p) => p.key === preselect.plan);
    if (plan && paymentsOn && canPay) choose(plan, toInterval(preselect.billing), promoParam);
    onCheckoutHandled(); // drop ?buy= so a reload doesn't reopen it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buy, loading]);

  const confirmChange = async (plan: PlanCard, interval: Interval) => {
    setBusy(true);
    try {
      await cardBillingAPI.changePlan(plan.key, interval);
      setChange(null);
      refreshPlanLimits();
      appToast.success(`You're now on ${plan.name}.`);
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

  const pill = overview?.cancel_at_period_end && hasPaidPlan
      ? { label: "Ends soon", cls: STATUS.canceled.cls }
      : !hasPaidPlan && (status === "active" || status === "trialing")
        ? STATUS.free
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
            {!loading && founding && <Pill label="Founding member" cls={STATUS.active.cls} />}
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
          {/* Finish the plan chosen when the card was created */}
          {showFinish && finishCard && (
            <div ref={finishRef} className="mt-4 rounded-2xl border border-slate-900/15 dark:border-white/15 bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">One step left</p>
              <h4 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">Complete your {finishCard.name} plan</h4>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Pay securely to unlock {finishCard.name}
                {finishPrice && (
                  <>
                    {": "}
                    <strong className="font-semibold text-slate-900 dark:text-white">
                      {formatCents(finishPrice.amount, finishCard.currency || currency)} {finishInterval === "year" ? "a year" : "a month"}
                    </strong>
                    {finishInterval === "year" && <> ({formatCents(finishPrice.monthly_equivalent, finishCard.currency || currency)} a month)</>}
                  </>
                )}
                . Until then your card stays on Essential.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!paymentsOn || !finishCard.purchasable || !finishPrice}
                  onClick={() => choose(finishCard, finishInterval)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="h-4 w-4" />
                  Review and pay
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button type="button" onClick={continueOnEssential} className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700">
                  Continue with Essential
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {paymentsOn && finishCard.purchasable
                  ? "You'll see the full bill and can add a promo code before paying on Stripe."
                  : "Card payments are opening soon. We'll keep your choice and ask you again here."}
              </p>
            </div>
          )}

          {/* Notices */}
          <div className="mt-4 space-y-2 empty:hidden">
            {error && (
              <Notice tone="rose" action={{ label: "Try again", onClick: () => void load() }}>
                {error} Plans are shown below; buying opens once billing loads.
              </Notice>
            )}
            {/* Cancelled = no renewal: the plan is paid up to the period end and stays until then. */}
            {hasPaidPlan && overview?.cancel_at_period_end && (
              <Notice tone="amber" action={canPay ? { label: "Resume plan", onClick: () => void run("resume"), busy } : undefined}>
                Your {overview.plan?.name} plan is cancelled and won't renew. You've paid for it, so you keep everything in {overview.plan?.name} until{" "}
                <strong className="font-semibold">{fmtDate(overview.current_period_end ?? undefined)}</strong>. After that your cards move to Essential
                {founding ? " (free for you as a Founding Member)" : ""} and you won't be charged again.
              </Notice>
            )}
            {founding && !hasPaidPlan && (
              <Notice tone="slate">You're a Founding Member, so Essential is free for you. Upgrade to Signature or Prestige any time for more cards and AI.</Notice>
            )}
            {!error && !paymentsOn && canPay && (
              <Notice tone="amber">Card payments are being switched on. You're on Essential until then. Plans can be bought here as soon as it's live.</Notice>
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
            <SummaryTile label="Current plan" value={hasPaidPlan ? overview!.plan!.name : "Essential"} strong />
            <SummaryTile
              label="Price"
              value={
                hasPaidPlan && overview ? (
                  <>
                    {formatCents(overview.price.amount, currency)}
                    {overview.price.interval && <span className="text-xs font-medium text-slate-500"> / {overview.price.interval}</span>}
                  </>
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
          {planLimits.loaded && planLimits.data && (
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              {!planLimits.data.enforced ? (
                <span>No limits on business cards or AI agents.</span>
              ) : (
                <>
                  <span>
                    Business cards: <strong className="font-semibold text-slate-700 dark:text-slate-200">{usageText(planLimits.data.resources?.business_cards)}</strong>
                  </span>
                  <span>
                    Cards with AI: <strong className="font-semibold text-slate-700 dark:text-slate-200">{usageText(planLimits.data.resources?.ai_agents)}</strong>
                  </span>
                </>
              )}
            </p>
          )}

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
                    Cancel {overview?.plan?.name}? It stays active until {fmtDate(overview?.current_period_end ?? undefined)}, then your card moves to Essential. Nothing is
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
            {change && overview?.plan && (
              <ChangePlanModal
                overview={overview}
                plans={shownPlans}
                initial={change}
                usage={planLimits.data?.resources}
                busy={busy}
                onConfirm={(plan, interval) => void confirmChange(plan, interval)}
                onClose={() => !busy && setChange(null)}
              />
            )}

            {decide && unpaidPlan && pendingPlan && !checkout && (
              <PlanDecisionModal
                chosen={pendingPlan.plan}
                billing={pendingPlan.billing}
                founding={founding}
                onPick={(planKey, billing) => {
                  const plan = shownPlans.find((p) => p.key === planKey);
                  if (!plan) return;
                  setDecide(false);
                  setCheckout({ planKey, interval: toInterval(billing) });
                }}
                onEssential={continueOnEssential}
              />
            )}

            {checkout && (
              <CheckoutModal
                plans={shownPlans}
                initial={checkout}
                onClose={() => {
                  setCheckout(null);
                  if (unpaidPlan) setDecide(true);
                }}
                onAlreadySubscribed={(plan, interval, message) => {
                  setCheckout(null);
                  appToast.info(message);
                  setChange({ plan, interval });
                  void load();
                }}
              />
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
                pending={null}
                onChoose={(p) => choose(p)}
                foundingAccount={founding}
              />
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Plans will appear here once card billing is available.
              </p>
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
