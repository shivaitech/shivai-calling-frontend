import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, CalendarClock, CreditCard, Download, FileText, Loader2, RefreshCw } from "lucide-react";
import GlassCard from "../../components/GlassCard";
import appToast from "../../components/AppToast";
import { appWorkspacePath } from "../../marketplace/apps";
import { PLANS, type Billing as Cycle, type PlanId } from "../../pages/digitalCardPricing";
import {
  cardBillingAPI,
  type CardInvoice,
  type CardSubscription,
  type CardSubscriptionStatus,
  type InvoiceStatus,
} from "../../services/billingAPI";
import CardPlanPicker from "./CardPlanPicker";
import { ItemIcon, Pill, fmtDate, money } from "./billingUi";

/**
 * Digital Business Card billing — the one product billed for real. Choosing a plan sends the
 * browser to the provider's hosted checkout (see billingAPI.ts); it returns here with
 * ?checkout=success|cancelled and the subscription is re-read once the webhook lands.
 */

const STATUS: Record<CardSubscriptionStatus, { label: string; cls: string }> = {
  free: { label: "Free", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300" },
  trialing: { label: "Trial", cls: "bg-sky-100 text-sky-700 dark:bg-sky-900/25 dark:text-sky-300" },
  past_due: { label: "Payment due", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/25 dark:text-amber-300" },
  incomplete: { label: "Payment pending", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/25 dark:text-amber-300" },
  cancelled: { label: "Cancelled", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
};

const INVOICE_STATUS: Record<InvoiceStatus, { label: string; cls: string }> = {
  paid: { label: "Paid", cls: STATUS.active.cls },
  open: { label: "Due", cls: STATUS.past_due.cls },
  failed: { label: "Failed", cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/25 dark:text-rose-300" },
  refunded: { label: "Refunded", cls: STATUS.free.cls },
  void: { label: "Void", cls: STATUS.free.cls },
};

const BRAND: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", amex: "American Express", rupay: "RuPay", upi: "UPI", discover: "Discover" };
const PAID_STATUSES: CardSubscriptionStatus[] = ["active", "trialing", "past_due"];
const planName = (id: string) => PLANS.find((p) => p.id === id)?.name ?? (id === "free" ? "Free" : id);

export default function CardBilling({
  preselect,
  checkoutResult,
  onCheckoutHandled,
  view = "all",
  returnPath = "/billing?view=apps&app=digital-card",
  planHref,
  inApp = false,
}: {
  /** Shown inside the Digital Card app: no "Open app" link. */
  inApp?: boolean;
  /** "plan" = current plan + plan picker; "billing" = payment method, manage/cancel, invoices; "all" = both. */
  view?: "all" | "plan" | "billing";
  /** Where checkout returns to (?checkout=success|cancelled is appended). */
  returnPath?: string;
  /** Billing view: link to the plan picker (shown on the Free plan). */
  planHref?: string;
  /** Plan picked on the marketing pricing page, carried here to finish checkout. */
  preselect?: { plan: PlanId; billing: Cycle } | null;
  checkoutResult?: "success" | "cancelled" | null;
  onCheckoutHandled: () => void;
}) {
  const [sub, setSub] = useState<CardSubscription | null>(null);
  /** false = the server doesn't have billing yet (404). */
  const [connected, setConnected] = useState(true);
  const [invoices, setInvoices] = useState<CardInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cycle, setCycle] = useState<Cycle>(preselect?.billing ?? "annual");
  const [pending, setPending] = useState<PlanId | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [allHistory, setAllHistory] = useState(false);
  // Newest first; "paid" total counts paid purchases only (refunds and failures excluded).
  const history = [...invoices].sort((a, b) => b.date.localeCompare(a.date));
  const totalPaid = history.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);

  const load = useCallback(async () => {
    setError("");
    try {
      const [s, inv] = await Promise.all([cardBillingAPI.subscription(), cardBillingAPI.invoices()]);
      setConnected(s !== null);
      setSub(s);
      setInvoices(inv);
      return s;
    } catch (e: any) {
      setError(e?.message || "Couldn't load your card billing.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Back from checkout: the webhook can lag a few seconds, so re-read until the plan shows.
  useEffect(() => {
    if (!checkoutResult) return;
    onCheckoutHandled();
    if (checkoutResult === "cancelled") {
      appToast.info("Checkout cancelled. You haven't been charged.");
      return;
    }
    appToast.success("Payment received. Updating your plan…");
    setConfirming(true);
    let tries = 0;
    let stopped = false;
    const tick = async () => {
      const s = await load();
      if (stopped) return;
      if ((s && PAID_STATUSES.includes(s.status)) || ++tries >= 6) {
        setConfirming(false);
        if (s && PAID_STATUSES.includes(s.status)) appToast.success(`You're on ${planName(s.plan)}.`);
        return;
      }
      setTimeout(tick, 2500);
    };
    void tick();
    return () => {
      stopped = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutResult]);

  // A plan chosen on the pricing page: bring the picker into view.
  useEffect(() => {
    if (preselect && !loading) pickerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [preselect, loading]);

  const startCheckout = async (plan: PlanId) => {
    setPending(plan);
    try {
      const back = `${window.location.origin}${returnPath}${returnPath.includes("?") ? "&" : "?"}checkout=`;
      const url = await cardBillingAPI.checkout(plan, cycle, { success: `${back}success`, cancel: `${back}cancelled` });
      window.location.assign(url);
    } catch (e: any) {
      appToast.error(e?.message || "Couldn't open checkout. Please try again.");
      setPending(null);
    }
  };

  const run = async (action: "cancel" | "resume") => {
    setBusy(true);
    try {
      const s = await cardBillingAPI[action]();
      if (s) setSub(s);
      setConfirmCancel(false);
      appToast.success(action === "cancel" ? "Your plan will end at the close of this billing period." : "Your plan will keep renewing.");
    } catch (e: any) {
      appToast.error(e?.message || "That didn't work. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const plan = sub?.plan ?? "free";
  const isPaid = !!sub && sub.plan !== "free" && PAID_STATUSES.includes(sub.status);
  const status = sub?.cancel_at_period_end && isPaid ? { label: "Ends soon", cls: STATUS.cancelled.cls } : STATUS[sub?.status ?? "free"];

  return (
    <GlassCard className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <ItemIcon appId="digital-card" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Digital Business Card</h3>
            {!loading && <Pill {...status} />}
            {confirming && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Confirming payment…
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {view === "plan"
              ? "Your current plan, and what each plan adds."
              : view === "billing"
                ? "Payment method, renewals and invoices."
                : "Your card plan, payment method and invoices."}
          </p>
        </div>
        {view === "all" && !inApp && (
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
      ) : error ? (
        <div className="py-8 text-center">
          <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
          <button type="button" onClick={() => void load()} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:underline">
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
        </div>
      ) : (
        <>
          {!connected && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/15 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-none" />
              <span>Card payments are being switched on. You're on the Free plan until then. Plans can be bought here as soon as it's live.</span>
            </div>
          )}

          {(sub?.status === "past_due" || sub?.status === "incomplete") && (
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/15 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
              <AlertTriangle className="w-4 h-4 flex-none" />
              <span className="flex-1 min-w-[12rem]">
                {sub.status === "past_due" ? "Your last payment didn't go through. Update your card to keep your plan." : "Your first payment hasn't completed yet."}
              </span>
              {sub.manage_url && (
                <a href={sub.manage_url} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                  Update payment method
                </a>
              )}
            </div>
          )}

          {/* Current plan */}
          <dl className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl common-bg-icons p-3 sm:p-4">
              <dt className="text-xs text-slate-500 dark:text-slate-400">Current plan</dt>
              <dd className="mt-1 text-base sm:text-lg font-bold text-slate-800 dark:text-white">{planName(plan)}</dd>
            </div>
            <div className="rounded-xl common-bg-icons p-3 sm:p-4">
              <dt className="text-xs text-slate-500 dark:text-slate-400">Price</dt>
              <dd className="mt-1 text-base sm:text-lg font-bold tabular-nums text-slate-800 dark:text-white">
                {isPaid && sub ? (
                  <>
                    {money(sub.amount, sub.currency)}
                    <span className="text-xs font-medium text-slate-500"> / {sub.billing === "annual" ? "year" : "month"}</span>
                  </>
                ) : (
                  money(0, sub?.currency)
                )}
              </dd>
            </div>
            <div className="rounded-xl common-bg-icons p-3 sm:p-4">
              <dt className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <CalendarClock className="w-3.5 h-3.5" /> {sub?.cancel_at_period_end ? "Ends on" : "Renews on"}
              </dt>
              <dd className="mt-1 text-sm sm:text-base font-semibold text-slate-800 dark:text-white">{isPaid ? fmtDate(sub?.current_period_end) : "—"}</dd>
            </div>
            <div className="rounded-xl common-bg-icons p-3 sm:p-4">
              <dt className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <CreditCard className="w-3.5 h-3.5" /> Payment method
              </dt>
              <dd className="mt-1 text-sm sm:text-base font-semibold text-slate-800 dark:text-white truncate">
                {sub?.payment_method ? `${BRAND[sub.payment_method.brand.toLowerCase()] ?? sub.payment_method.brand} •••• ${sub.payment_method.last4}` : "—"}
              </dd>
            </div>
          </dl>

          {view === "billing" && !isPaid && planHref && (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              You're on the Free plan.{" "}
              <Link to={planHref} className="font-semibold text-slate-800 dark:text-white underline underline-offset-2">
                See plans
              </Link>
            </p>
          )}

          {isPaid && view !== "plan" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {sub?.manage_url && (
                <a
                  href={sub.manage_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Manage payment & receipts <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              )}
              {sub?.cancel_at_period_end ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void run("resume")}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-60"
                >
                  {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Keep my plan
                </button>
              ) : confirmCancel ? (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-900/10 px-3 py-2 text-xs text-rose-800 dark:text-rose-200">
                  <span>Cancel {planName(plan)}? It stays active until {fmtDate(sub?.current_period_end)}, then your card moves to Free.</span>
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
          {view !== "billing" && (
            <div ref={pickerRef} className="mt-7 scroll-mt-24">
              <CardPlanPicker
                cycle={cycle}
                onCycle={setCycle}
                current={isPaid && sub ? { plan: sub.plan, billing: sub.billing } : null}
                preselected={preselect?.plan}
                connected={connected}
                pending={pending}
                hasPaidPlan={isPaid}
                onChoose={(id) => void startCheckout(id)}
              />
            </div>
          )}

          {/* Purchase history — always shown, newest first */}
          {view !== "plan" && (
            <div className="mt-8">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h4 className="text-base font-semibold text-slate-800 dark:text-white">Purchase history</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Every plan purchase and renewal, with receipts.</p>
                </div>
                {history.length > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {history.length} purchase{history.length === 1 ? "" : "s"} · {money(totalPaid, history[0].currency)} paid
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
                  {/* Column labels (wide screens) */}
                  <div className="hidden sm:grid grid-cols-[7.5rem_minmax(0,1fr)_6rem_6rem_2.5rem] gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <span>Date</span>
                    <span>Plan</span>
                    <span className="text-right">Amount</span>
                    <span>Status</span>
                    <span className="sr-only">Receipt</span>
                  </div>
                  <ul className="divide-y divide-slate-200/70 dark:divide-slate-700/60">
                    {(allHistory ? history : history.slice(0, 6)).map((inv) => (
                      <li
                        key={inv.id}
                        className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[7.5rem_minmax(0,1fr)_6rem_6rem_2.5rem] items-center gap-x-3 gap-y-1 px-4 py-3"
                      >
                        <span className="order-2 sm:order-none col-span-2 sm:col-span-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                          {fmtDate(inv.date)}
                        </span>
                        <span className="order-1 sm:order-none min-w-0">
                          <span className="block text-sm font-medium text-slate-800 dark:text-white truncate">{inv.description}</span>
                          <span className="block text-[11px] text-slate-400 truncate">{inv.number}</span>
                        </span>
                        <span className="order-1 sm:order-none text-sm font-semibold tabular-nums text-slate-800 dark:text-white text-right">
                          {money(inv.amount, inv.currency)}
                        </span>
                        <span className="order-3 sm:order-none">
                          <Pill {...(INVOICE_STATUS[inv.status] ?? INVOICE_STATUS.void)} />
                        </span>
                        <span className="order-3 sm:order-none flex justify-end">
                          {inv.pdf_url ? (
                            <a
                              href={inv.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Download receipt ${inv.number}`}
                              title="Download receipt"
                              className="w-8 h-8 grid place-items-center rounded-lg common-bg-icons hover:opacity-80"
                            >
                              <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                            </a>
                          ) : (
                            <span className="w-8" />
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {history.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setAllHistory((v) => !v)}
                      className="w-full border-t border-slate-200 dark:border-slate-700 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      {allHistory ? "Show fewer" : `Show all ${history.length} purchases`}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
}
