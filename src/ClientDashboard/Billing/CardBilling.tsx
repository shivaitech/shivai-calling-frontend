import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, CalendarClock, Check, CreditCard, Download, FileText, Loader2, RefreshCw } from "lucide-react";
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
}: {
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
      const back = `${window.location.origin}/billing?view=apps&app=digital-card&checkout=`;
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
          <p className="text-sm text-slate-500 dark:text-slate-400">Your card plan, payment method and invoices.</p>
        </div>
        <Link
          to={appWorkspacePath("digital-card")}
          className="hidden sm:inline-flex flex-none items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Open app <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
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

          {isPaid && (
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
          <div ref={pickerRef} className="mt-6 scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="font-semibold text-slate-800 dark:text-white">{isPaid ? "Change plan" : "Choose a plan"}</h4>
              <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-lg common-bg-icons p-1 gap-1">
                {(["annual", "monthly"] as Cycle[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={cycle === c}
                    onClick={() => setCycle(c)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      cycle === c ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {c === "monthly" ? "Monthly" : "Annual"}
                    {c === "annual" && <span className="ml-1 text-emerald-600 dark:text-emerald-400">· save 40%</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {PLANS.map((p) => {
                const current = isPaid && sub?.plan === p.id && sub?.billing === cycle;
                const picked = preselect?.plan === p.id && !current;
                const perMonth = cycle === "annual" ? p.yearlyPerMonth : p.monthly;
                const saving = Math.round((1 - (cycle === "annual" ? p.yearly / (p.monthlyWas * 12) : p.monthly / p.monthlyWas)) * 100);
                return (
                  <div
                    key={p.id}
                    className={`relative flex flex-col rounded-2xl border p-4 transition ${
                      current
                        ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50/40 dark:bg-emerald-900/10"
                        : picked
                          ? "border-slate-900 dark:border-white ring-2 ring-slate-900/10 dark:ring-white/10"
                          : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {picked && (
                      <span className="absolute -top-2.5 left-4 rounded-full bg-slate-900 dark:bg-white px-2 py-0.5 text-[10px] font-semibold text-white dark:text-slate-900">
                        Your choice
                      </span>
                    )}
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{p.eyebrow}</p>
                    <p className="mt-1 text-lg font-bold text-slate-800 dark:text-white" style={p.premium ? { color: "#a8822f" } : undefined}>
                      {p.name}
                    </p>
                    <p className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-bold tabular-nums text-slate-800 dark:text-white">{money(perMonth)}</span>
                      <span className="text-sm text-slate-500">/month</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {cycle === "annual" ? `Billed annually at ${money(p.yearly)}` : "Billed monthly"}
                      {saving > 0 && (
                        <>
                          {" · "}
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Save {saving}%</span>
                        </>
                      )}
                    </p>
                    <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 flex-1">{p.adds}</p>
                    {current ? (
                      <span className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/25">
                        <Check className="w-4 h-4" /> Current plan
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!connected || pending !== null}
                        title={!connected ? "Plans can be bought once card payments are switched on" : undefined}
                        onClick={() => void startCheckout(p.id)}
                        className={`mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          picked || p.id === "signature"
                            ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                            : "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                        }`}
                      >
                        {pending === p.id && <Loader2 className="w-4 h-4 animate-spin" />}
                        {!connected ? "Opens soon" : isPaid ? `Switch to ${p.name}` : `Choose ${p.name}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-400">You'll finish payment on our secure checkout page. Card details never pass through ShivAI.</p>
          </div>

          {/* Invoices */}
          {invoices.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-slate-800 dark:text-white">Invoices</h4>
              <ul className="mt-2 divide-y divide-slate-200/70 dark:divide-slate-700/60">
                {invoices.map((inv) => (
                  <li key={inv.id} className="flex items-center gap-3 py-3">
                    <FileText className="w-4 h-4 flex-none text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{inv.description}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {fmtDate(inv.date)} · {inv.number}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-slate-800 dark:text-white">{money(inv.amount, inv.currency)}</span>
                    <Pill {...(INVOICE_STATUS[inv.status] ?? INVOICE_STATUS.void)} />
                    {inv.pdf_url && (
                      <a
                        href={inv.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Download invoice ${inv.number}`}
                        className="w-8 h-8 flex-none grid place-items-center rounded-lg common-bg-icons hover:opacity-80"
                      >
                        <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
}
