import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Mail, RotateCcw, X } from "lucide-react";
import { cardBillingAPI, formatCents, type PlanCard } from "../../services/billingAPI";
import { ResultShell } from "./billingUi";
import { BILLING_HOME, checkoutHref, isPaidPlan, toBilling } from "./checkoutFlow";

/**
 * Where Stripe sends the customer when the payment didn't happen (cancel_url):
 *   /billing/failed?plan=&billing=&promo=&reason=cancelled
 * Also reached from the success page when the session turns out unpaid (reason=expired).
 * No money was taken; "Try again" reopens checkout on the same plan, period and code.
 */

const SUPPORT_EMAIL = "support@callshivai.com";

const REASONS = [
  "The card was declined by the bank",
  "The bank's security check (3-D Secure) wasn't finished",
  "Not enough funds, or the card has expired",
];

export default function CheckoutFailed() {
  const [params] = useSearchParams();
  const reason = params.get("reason");
  const planKey = params.get("plan");
  const interval = params.get("billing") === "monthly" ? "month" : "year";
  const promo = params.get("promo");
  const sessionId = params.get("session_id");
  const [plan, setPlan] = useState<PlanCard | null>(null);
  const [failure, setFailure] = useState("");

  useEffect(() => {
    let live = true;
    if (isPaidPlan(planKey))
      cardBillingAPI
        .plans()
        .then((d) => live && setPlan(d?.plans?.find((p) => p.key === planKey) ?? null))
        .catch(() => undefined);
    // Stripe's own reason, when the server has it (card declined…).
    if (sessionId)
      cardBillingAPI
        .checkoutSession(sessionId)
        .then((s) => live && setFailure(s?.failure_message ?? ""))
        .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [planKey, sessionId]);

  const cancelled = reason === "cancelled";
  const expired = reason === "expired";
  const price = plan?.prices[interval];
  const retry = isPaidPlan(planKey) ? checkoutHref({ plan: planKey, billing: toBilling(interval), promo }) : BILLING_HOME;
  const mail = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Card payment didn't go through")}&body=${encodeURIComponent(
    `Hi ShivAI team,\n\nMy payment for the ${plan?.name ?? planKey ?? ""} plan (${interval === "year" ? "annual" : "monthly"}) didn't go through.${failure ? `\nStripe said: ${failure}` : ""}\n\nThanks`,
  )}`;

  return (
    <ResultShell
      tone={cancelled ? "amber" : "bad"}
      icon={<X className="h-8 w-8" strokeWidth={3} />}
      eyebrow={cancelled ? "Payment not completed" : expired ? "Checkout expired" : "Payment failed"}
      title={cancelled ? "You left before paying" : expired ? "Your checkout timed out" : "Your payment didn't go through"}
    >
      <p>
        <strong className="font-semibold text-slate-900 dark:text-white">No money was taken from your card.</strong> Your cards stay on your current plan
        {plan ? `, and ${plan.name} is ready whenever you are` : ""}.
      </p>

      {plan && price && (
        <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3.5 text-left text-sm dark:bg-slate-800/60">
          <span>
            <span className="block font-semibold text-slate-900 dark:text-white">
              {plan.name} · {interval === "year" ? "Annual" : "Monthly"}
            </span>
            {promo && <span className="block text-xs text-slate-500 dark:text-slate-400">Promo code {promo.toUpperCase()}</span>}
          </span>
          <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
            {formatCents(price.amount, plan.currency)}
            <span className="text-xs font-medium text-slate-500"> / {interval}</span>
          </span>
        </div>
      )}

      {!cancelled && (
        <div className="mt-4 rounded-2xl border border-slate-200 px-4 py-3.5 text-left text-sm dark:border-slate-700">
          {failure ? (
            <p className="text-slate-700 dark:text-slate-200">
              <span className="font-semibold">Stripe said:</span> {failure}
            </p>
          ) : (
            <>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{expired ? "Checkout links last a limited time." : "This usually happens when:"}</p>
              {!expired && (
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-300">
                  {REASONS.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
            </>
          )}
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Try again, or use a different card.</p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link
          to={retry}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
        >
          <RotateCcw className="h-4 w-4" /> Try again
        </Link>
        <Link
          to={BILLING_HOME}
          className="inline-flex items-center justify-center gap-1.5 rounded-2xl px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Back to billing <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <a href={mail} className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white">
        <Mail className="h-3.5 w-3.5" /> Need help? {SUPPORT_EMAIL}
      </a>
    </ResultShell>
  );
}
