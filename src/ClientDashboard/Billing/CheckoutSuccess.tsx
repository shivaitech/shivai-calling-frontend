import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, Clock, Download, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { appWorkspacePath } from "../../marketplace/apps";
import { cardBillingAPI, formatCents, isPaying, type CheckoutSession, type Overview, type PlanCard } from "../../services/billingAPI";
import { ResultShell, fmtDate } from "./billingUi";
import { BILLING_HOME, isPaidPlan } from "./checkoutFlow";
import { clearPendingPlan } from "./pendingPlan";
import { refreshPlanLimits } from "./planLimit";

/**
 * Where Stripe sends the customer after paying (success_url):
 *   /billing/success?plan=&billing=&promo=&session_id={CHECKOUT_SESSION_ID}
 * Coming back proves nothing — the plan changes when Stripe's webhook lands — so this reads the
 * session (what was paid) and polls the overview until the plan is active.
 */

const BRAND: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", amex: "American Express", rupay: "RuPay", discover: "Discover" };
const POLL_MS = 2000;
const MAX_TRIES = 20;

type Phase = "confirming" | "active" | "processing";

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get("session_id") ?? "";
  const planParam = params.get("plan");
  const interval = params.get("billing") === "monthly" ? "month" : "year";

  const [phase, setPhase] = useState<Phase>("confirming");
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [plan, setPlan] = useState<PlanCard | null>(null);
  const [round, setRound] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // What was bought: the Stripe session (amounts, promo, receipt) and the plan, for its price.
  useEffect(() => {
    if (sessionId)
      cardBillingAPI
        .checkoutSession(sessionId)
        .then((s) => {
          if (!mounted.current || !s) return;
          // Not paid after all (closed or expired without paying): that's the failed page.
          if (s.status === "expired" || (s.status === "open" && s.payment_status === "unpaid")) {
            navigate(`/billing/failed?${new URLSearchParams({ ...Object.fromEntries(params), reason: s.status === "expired" ? "expired" : "cancelled" })}`, { replace: true });
            return;
          }
          setSession(s);
        })
        .catch(() => undefined);
    if (isPaidPlan(planParam))
      cardBillingAPI
        .plans()
        .then((d) => mounted.current && setPlan(d?.plans?.find((p) => p.key === planParam) ?? null))
        .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, planParam]);

  // The webhook switches the plan: poll until it's active (~40 s), then say so.
  useEffect(() => {
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    setPhase("confirming");
    const tick = async () => {
      if (!mounted.current) return;
      let ov: Overview | null = null;
      try {
        ov = await cardBillingAPI.overview();
      } catch {
        /* keep polling */
      }
      if (!mounted.current) return;
      if (ov) setOverview(ov);
      if (ov && isPaying(ov)) {
        clearPendingPlan();
        refreshPlanLimits();
        setPhase("active");
        return;
      }
      if (++tries >= MAX_TRIES) return setPhase("processing");
      timer = setTimeout(tick, POLL_MS);
    };
    void tick();
    return () => clearTimeout(timer);
  }, [round]);

  const planName = overview?.plan && !overview.plan.is_free ? overview.plan.name : session?.plan?.name ?? plan?.name ?? "your new plan";
  const currency = session?.currency || overview?.price.currency || plan?.currency || "usd";
  const money = (c: number) => formatCents(c, currency);
  const planPrice = plan?.prices[interval]?.amount ?? null;
  const paid = session?.amount_total ?? null;
  const discount = session?.amount_discount ?? 0;
  const subtotal = session?.amount_subtotal ?? planPrice;
  const periodWord = (session?.interval ?? overview?.price.interval ?? interval) === "month" ? "Monthly" : "Annual";
  const pm = overview?.payment_method;
  const cardHome = appWorkspacePath("digital-card");

  if (phase === "confirming") {
    return (
      <ResultShell tone="slate" icon={<Loader2 className="h-7 w-7 animate-spin" />} eyebrow="Payment received" title="Confirming your plan…">
        <p>Stripe has your payment. We're switching your account to {planName} now. This takes a few seconds, so please keep this page open.</p>
      </ResultShell>
    );
  }

  if (phase === "processing") {
    return (
      <ResultShell tone="amber" icon={<Clock className="h-7 w-7" />} eyebrow="Payment received" title="Your plan is being activated">
        <p>
          Your payment went through, but {planName} is taking longer than usual to switch on. You don't need to pay again. It usually finishes within a few
          minutes, and we'll email {session?.customer_email || "you"} a receipt.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => setRound((r) => r + 1)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
          >
            <RefreshCw className="h-4 w-4" /> Check again
          </button>
          <Link to={BILLING_HOME} className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
            Go to billing
          </Link>
        </div>
      </ResultShell>
    );
  }

  return (
    <ResultShell tone="good" icon={<Check className="h-8 w-8" strokeWidth={3} />} eyebrow="Payment successful" title={`You're on ${planName}`}>
      <p>Thank you! Your cards have everything in {planName} from now on. A receipt is on its way to your email.</p>

      {/* Receipt */}
      <dl className="mt-6 space-y-2.5 rounded-2xl bg-slate-50 p-4 text-left text-sm dark:bg-slate-800/60 sm:p-5">
        <ReceiptRow label="Plan" value={`${planName} · ${periodWord}`} />
        {subtotal !== null && <ReceiptRow label="Subtotal" value={money(subtotal)} />}
        {discount > 0 && <ReceiptRow label={`Promo${session?.promo_code ? ` ${session.promo_code}` : ""}`} value={`−${money(discount)}`} good />}
        <div className="h-px bg-slate-200 dark:bg-slate-700" />
        <ReceiptRow label="Amount paid" value={paid !== null ? money(paid) : subtotal !== null ? money(subtotal) : "—"} strong />
        {overview?.current_period_end && (
          <ReceiptRow
            label={overview.cancel_at_period_end ? "Ends on" : "Renews on"}
            value={`${fmtDate(overview.current_period_end)}${overview.price.amount ? ` · ${money(overview.price.amount)}` : ""}`}
          />
        )}
        {pm && <ReceiptRow label="Paid with" value={`${BRAND[pm.brand?.toLowerCase()] ?? pm.brand} ending ${pm.last4}`} />}
      </dl>

      {(session?.invoice_url || session?.invoice_pdf) && (
        <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
          {session.invoice_url && (
            <a href={session.invoice_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
              <ExternalLink className="h-4 w-4" /> View receipt
            </a>
          )}
          {session.invoice_pdf && (
            <a href={session.invoice_pdf} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
              <Download className="h-4 w-4" /> Download PDF
            </a>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link
          to={cardHome}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
        >
          Go to my cards <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to={BILLING_HOME} className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
          View billing
        </Link>
      </div>
    </ResultShell>
  );
}

function ReceiptRow({ label, value, strong, good }: { label: string; value: string; strong?: boolean; good?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd
        className={`text-right tabular-nums ${
          good ? "font-semibold text-emerald-600 dark:text-emerald-400" : strong ? "text-base font-bold text-slate-900 dark:text-white" : "font-medium text-slate-800 dark:text-slate-100"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
