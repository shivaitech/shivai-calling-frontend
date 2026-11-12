import type { Billing, PlanId } from "../../pages/digitalCardPricing";
import { formatCents, type Interval, type PromoCode } from "../../services/billingAPI";

/**
 * The card checkout flow: Billing → CheckoutModal (plan, period, promo codes, the full bill) →
 * Stripe → /billing/success or /billing/failed. Links and promo-code maths shared by those.
 */

export type PaidPlan = Exclude<PlanId, "essential">;
export const PAID_PLANS: PaidPlan[] = ["signature", "prestige"];
export const isPaidPlan = (p: string | null | undefined): p is PaidPlan => p === "signature" || p === "prestige";

export { toInterval } from "./CardPlanPicker";
export const toBilling = (i: Interval | null | undefined): Billing => (i === "month" ? "monthly" : "annual");

export const BILLING_HOME = "/billing?view=apps&app=digital-card";

export interface CheckoutChoice {
  plan: PaidPlan;
  billing: Billing;
  promo?: string | null;
}

const query = ({ plan, billing, promo }: CheckoutChoice, extra: Record<string, string> = {}) =>
  new URLSearchParams({ plan, billing, ...(promo?.trim() ? { promo: promo.trim().toUpperCase() } : {}), ...extra }).toString();

/** Billing with the checkout modal open on a plan (and a promo code, when one was picked). */
export const checkoutHref = (c: CheckoutChoice) => `${BILLING_HOME}&${query(c, { buy: "1" })}`;

/**
 * Where Stripe sends the customer back. Stripe fills in {CHECKOUT_SESSION_ID} itself, so it
 * must stay unencoded.
 */
export const stripeReturnUrls = (c: CheckoutChoice) => {
  const origin = window.location.origin;
  return {
    success: `${origin}/billing/success?${query(c)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel: `${origin}/billing/failed?${query(c, { reason: "cancelled" })}`,
  };
};

/** "20% off" · "$10 off". */
export const promoLabel = (p: PromoCode) =>
  p.percent_off ? `${+p.percent_off.toFixed(2)}% off` : p.amount_off ? `${formatCents(p.amount_off, p.currency || "usd")} off` : "Discount";

/** "First payment only" · "First 3 months" · "Every payment". */
export const promoDuration = (p: PromoCode) =>
  p.duration === "forever" ? "Every payment" : p.duration === "repeating" && p.duration_in_months ? `First ${p.duration_in_months} months` : "First payment only";

const PLAN_NAMES: Record<string, string> = { signature: "Signature", prestige: "Prestige" };

/** Why a code can't be used on this plan and period, or null when it can. */
export function promoBlocker(p: PromoCode, plan: string, interval: Interval): string | null {
  if (p.available === false) return p.reason || "Not available on your account";
  if (p.expires_at && new Date(p.expires_at).getTime() < Date.now()) return "Expired";
  if (p.plan_keys?.length && !p.plan_keys.includes(plan)) return `Only for ${p.plan_keys.map((k) => PLAN_NAMES[k] ?? k).join(" or ")}`;
  if (p.intervals?.length && !p.intervals.includes(interval)) return `Only on ${p.intervals[0] === "year" ? "annual" : "monthly"} billing`;
  return null;
}

/** The discount (cents) a code takes off a first payment — used when the server can't price it. */
export function localDiscount(p: PromoCode, subtotal: number, currency: string): number {
  if (p.percent_off) return Math.round((subtotal * p.percent_off) / 100);
  if (p.amount_off && (!p.currency || p.currency.toLowerCase() === currency.toLowerCase())) return Math.min(p.amount_off, subtotal);
  return 0;
}
