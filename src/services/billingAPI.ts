// Billing — Digital Business Card subscriptions, paid through Stripe.
//
// The backend owns plans, prices and features (editable in the admin panel), and the plan
// only ever changes through Stripe's webhook: the browser coming back from Stripe proves
// nothing, so after checkout the page polls the overview until the plan is active.
// Money is always an integer in cents (999 = $9.99). Card details never touch this app.
//
// Every call names the app by app_id (the catalog id; the old app=Business_Card still works).
//
//   GET  /billing/plans?app_id=…&currency=usd      → PlansData   (public, no token; Essential is the free plan)
//   GET  /billing/overview?app_id=…                → Overview    (founding_member, limits)
//   GET  /billing/limits?app_id=…                  → LimitsData  (cards / AI agents: limit, used, allowed)
//   POST /billing/checkout      { app_id, plan_key, interval, promo_code?, success_url?, cancel_url? } → { url, session_id }
//   GET  /billing/checkout/session?app_id=…&session_id=… → CheckoutSession (the success / failed pages)
//   GET  /billing/promo-codes?app_id=…             → { promo_codes }   (codes this account can use)
//   POST /billing/promo-codes/validate { app_id, promo_code, plan_key, interval } → PromoPreview
//   POST /billing/change-plan   { app_id, plan_key, interval }
//   POST /billing/change-plan/preview { app_id, plan_key, interval } → ChangePreview (Stripe's proration)
//   POST /billing/cancel        { app_id }         (keeps the plan until current_period_end)
//   POST /billing/resume        { app_id }
//   POST /billing/portal        {}                 → { url }   (404 = never bought a plan)
//   GET  /billing/invoices?limit=12                → { invoices }
//   GET  /billing/entitlements?app_id=…            → { entitlements, paid }
//
// Plan limits: creating a card or an AI agent past the plan's limit is refused with 403 and
// errors[0].code === "PLAN_LIMIT_REACHED" (see planLimit.ts). Admins are unlimited; founding
// members get Essential's limits (they are tagged, not upgraded).
//
// Status codes the UI acts on: 400 promo / declined card, 401 signed out, 403 account type
// can't pay (admin, staff), 404 plan not sold / nothing to change, 409 already subscribed or
// last payment failed, 422 field errors, 502 Stripe didn't answer, 503 payments switched off.

import axios from "axios";

const API = (import.meta.env.VITE_BILLING_API_URL || import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
export const BILLING_APP = "Business_Card";
/** The Digital Business Card app's catalog id (also its installed Skill_App.app_id). */
export const BILLING_APP_ID: string = import.meta.env.VITE_BUSINESS_CARD_APP_ID || "6aeda2fca401947ef8ae1a0d";

/** What a plan allows: a number, or null for unlimited (0 = not included). */
export interface PlanLimits {
  business_cards: number | null;
  ai_agents: number | null;
}

export type Interval = "month" | "year";

export interface PlanPrice {
  amount: number;
  monthly_equivalent: number;
}

export interface PlanCard {
  id: string;
  /** "essential" | "signature" | "prestige" — admin-defined, so typed loosely ("free" is retired). */
  key: string;
  name: string;
  /** Short line, e.g. "Your professional identity". */
  tagline: string;
  description: string;
  /** Bullet list, in order. */
  features: string[];
  is_free: boolean;
  currency: string;
  prices: { month: PlanPrice | null; year: PlanPrice | null };
  /** The "Save 40%" figure, worked out from the real prices. */
  annual_savings_percent: number | null;
  /** false → no buy button (Essential, the free plan, is never purchasable). */
  purchasable: boolean;
  limits?: PlanLimits;
}

export interface PlansData {
  app: string;
  app_id?: string;
  currency: string;
  payments_enabled: boolean;
  plans: PlanCard[];
}

export type SubStatus = "free" | "active" | "trialing" | "past_due" | "unpaid" | "canceled" | "incomplete" | "incomplete_expired" | "paused";

export interface Overview {
  app: string;
  payments_enabled: boolean;
  plan: { id: string; key: string; name: string; is_free: boolean } | null;
  status: SubStatus;
  /** True only when the paid plan is in good standing — use this to unlock features. */
  paid: boolean;
  price: { amount: number; currency: string; interval: Interval | null };
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  payment_method: { brand: string; last4: string; exp_month: number; exp_year: number } | null;
  entitlements: Record<string, string | number | boolean>;
  /** A tag only: Essential is free for this account (joined before 31 Dec 2026). Limits and upgrades work as for anyone. */
  founding_member?: boolean;
  limits?: PlanLimits;
}

export type LimitResource = "business_cards" | "ai_agents";

export interface ResourceLimit {
  /** null = unlimited; 0 = not included in the plan. */
  limit: number | null;
  used: number;
  /** null when unlimited. */
  remaining: number | null;
  /** Can one more be created now? */
  allowed: boolean;
}

export interface LimitsData {
  app?: string;
  app_id?: string;
  /** false = limits switched off (admin accounts, or the setting): nothing is refused. */
  enforced: boolean;
  reason?: string;
  plan?: { key: string; name: string };
  founding_member?: boolean;
  resources?: Partial<Record<LimitResource, ResourceLimit>>;
}

export interface Invoice {
  id?: string;
  number: string | null;
  /** Stripe statuses: paid, open, void, uncollectible, draft. */
  status: string;
  /** Cents. */
  amount_paid: number;
  currency?: string;
  /** Unix seconds (Stripe) or an ISO date. */
  created: number | string;
  hosted_invoice_url?: string | null;
  invoice_pdf?: string | null;
  description?: string | null;
}

export interface PromoCode {
  /** What the customer types, upper case ("LAUNCH20"). */
  code: string;
  /** Short title shown on the code ("Launch offer"). */
  name?: string | null;
  description?: string | null;
  /** One of the two is set: a percentage (20 = 20%) or a fixed amount in cents. */
  percent_off: number | null;
  amount_off: number | null;
  /** Currency of amount_off. */
  currency?: string | null;
  /** Plans it works on; empty or omitted = every paid plan. */
  plan_keys?: string[];
  /** Billing periods it works on; empty or omitted = both. */
  intervals?: Interval[];
  /** Stripe coupon duration: once = first payment only. */
  duration: "once" | "repeating" | "forever";
  duration_in_months?: number | null;
  /** ISO date, or null when it doesn't expire. */
  expires_at: string | null;
  /** false when this account can't use it now (already used, limit reached…); reason says why. */
  available?: boolean;
  reason?: string | null;
}

/** POST /billing/promo-codes/validate — the first payment with the code applied. All cents. */
export interface PromoPreview {
  valid: boolean;
  message?: string | null;
  promo_code: PromoCode;
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
}

/** GET /billing/checkout/session — read from Stripe by the server. */
export interface CheckoutSession {
  /** Stripe Checkout Session status. */
  status: "open" | "complete" | "expired";
  payment_status: "paid" | "unpaid" | "no_payment_required";
  plan?: { key: string; name: string } | null;
  interval?: Interval | null;
  /** Cents. */
  amount_subtotal?: number | null;
  amount_discount?: number | null;
  amount_total?: number | null;
  currency?: string | null;
  promo_code?: string | null;
  customer_email?: string | null;
  /** Hosted invoice / receipt, once Stripe has made it. */
  invoice_url?: string | null;
  invoice_pdf?: string | null;
  /** Why it didn't go through, when Stripe says (card declined…). */
  failure_message?: string | null;
}

/** POST /billing/change-plan/preview — what a plan change costs today (Stripe's upcoming invoice). All cents. */
export interface ChangePreview {
  /** The new plan's price for the time it covers now. */
  new_plan_charge: number;
  /** Unused time on the current plan, given back. */
  credit: number;
  /** Charged to the card now (0 when the credit covers it). */
  amount_due: number;
  /** Left over credit, used on the next invoices. */
  credit_balance?: number;
  currency: string;
  next_payment_date: string | null;
  next_payment_amount: number | null;
}

export class BillingError extends Error {
  status: number;
  /** 422 only: field → message. */
  fieldErrors: Record<string, string>;
  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "BillingError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function token(): string | null {
  try {
    const t = localStorage.getItem("auth_tokens");
    if (t) return JSON.parse(t).accessToken ?? null;
  } catch {
    /* fall through */
  }
  return localStorage.getItem("authToken");
}

const headers = () => ({ Authorization: `Bearer ${token()}`, "Content-Type": "application/json" });

/** The server writes `message` for people, so it's shown as-is. */
function toError(e: any): BillingError {
  const body = e?.response?.data;
  const status = e?.response?.status ?? 0;
  const fields: Record<string, string> = {};
  if (Array.isArray(body?.errors)) for (const x of body.errors) if (x?.field && !fields[x.field]) fields[x.field] = x.message;
  const fallback =
    status === 0 ? "Can't reach the billing service. Check your connection and try again." : status === 502 ? "Payments didn't respond. Please try again." : "Something went wrong. Please try again.";
  return new BillingError(body?.message || fallback, status, fields);
}

async function get<T>(path: string): Promise<T> {
  try {
    return (await axios.get(`${API}${path}`, { headers: headers() })).data?.data as T;
  } catch (e) {
    throw toError(e);
  }
}

async function post<T>(path: string, body: object): Promise<T> {
  try {
    return (await axios.post(`${API}${path}`, body, { headers: headers() })).data?.data as T;
  } catch (e) {
    throw toError(e);
  }
}

/** Only ever send the browser to an https page (the URL comes from the API). */
function httpsOnly(raw: unknown): string {
  try {
    const u = new URL(String(raw));
    if (u.protocol === "https:") return u.href;
  } catch {
    /* fall through */
  }
  throw new BillingError("The payment page link from the server wasn't valid.", 502);
}

const APP_Q = `app_id=${encodeURIComponent(BILLING_APP_ID)}`;

export const cardBillingAPI = {
  plans: () => get<PlansData>(`/billing/plans?${APP_Q}`),
  /** Same plans with no sign-in (the public pricing page): no token is sent. */
  publicPlans: (currency = "usd") =>
    axios
      .get(`${API}/billing/plans?${APP_Q}&currency=${encodeURIComponent(currency)}`)
      .then((r) => r.data?.data as PlansData)
      .catch((e) => {
        throw toError(e);
      }),
  overview: () => get<Overview>(`/billing/overview?${APP_Q}`),
  /** Cards / AI agents this account may still create. */
  limits: () => get<LimitsData>(`/billing/limits?${APP_Q}`),
  entitlements: () => get<{ entitlements: Record<string, string | number | boolean>; paid: boolean }>(`/billing/entitlements?${APP_Q}`),
  invoices: (limit = 12) => get<{ invoices: Invoice[] }>(`/billing/invoices?limit=${limit}`).then((d) => d?.invoices ?? []),

  /**
   * Returns Stripe's checkout page. Stripe sends the customer back to `return_to.success`
   * ({CHECKOUT_SESSION_ID} filled in by Stripe) or `return_to.cancel`; a server that ignores
   * them still returns to /billing?checkout=…, which Billing also handles.
   */
  checkout: (plan_key: string, interval: Interval, promo_code?: string, return_to?: { success: string; cancel: string }) =>
    post<{ url: string; session_id: string }>("/billing/checkout", {
      app_id: BILLING_APP_ID,
      plan_key,
      interval,
      ...(promo_code?.trim() ? { promo_code: promo_code.trim().toUpperCase() } : {}),
      ...(return_to ? { success_url: return_to.success, cancel_url: return_to.cancel } : {}),
    }).then((d) => httpsOnly(d?.url)),

  /** Promo codes this account can use (assigned to it, or public and still open). */
  promoCodes: () => get<{ promo_codes: PromoCode[] }>(`/billing/promo-codes?${APP_Q}`).then((d) => d?.promo_codes ?? []),
  /** Checks a code against a plan and period and prices it. 400 = not valid (message says why). */
  previewPromo: (promo_code: string, plan_key: string, interval: Interval) =>
    post<PromoPreview>("/billing/promo-codes/validate", { app_id: BILLING_APP_ID, promo_code: promo_code.trim().toUpperCase(), plan_key, interval }),
  /** What happened to a checkout, for the page Stripe returns to. */
  checkoutSession: (session_id: string) => get<CheckoutSession>(`/billing/checkout/session?${APP_Q}&session_id=${encodeURIComponent(session_id)}`),

  changePlan: (plan_key: string, interval: Interval) => post("/billing/change-plan", { app_id: BILLING_APP_ID, plan_key, interval }),
  /** The bill for a plan change, before it's made. 404 = not on this server yet (the UI estimates it). */
  previewChange: (plan_key: string, interval: Interval) => post<ChangePreview>("/billing/change-plan/preview", { app_id: BILLING_APP_ID, plan_key, interval }),
  cancel: () => post("/billing/cancel", { app_id: BILLING_APP_ID }),
  resume: () => post("/billing/resume", { app_id: BILLING_APP_ID }),

  /** Stripe's customer portal (card, invoices). */
  portal: () => post<{ url: string }>("/billing/portal", {}).then((d) => httpsOnly(d?.url)),
};

const NO_PLAN: SubStatus[] = ["free", "canceled", "incomplete_expired"];

/**
 * Is this account really paying for a plan? A paid plan comes from a Stripe subscription, so it
 * has a price and a billing period. A plan without them (e.g. Prestige, $0, no renewal date —
 * set before or without payment) is not treated as bought: the account stays on Essential.
 */
export const isPaying = (o: Overview | null | undefined): boolean =>
  !!o?.plan && !o.plan.is_free && !NO_PLAN.includes(o.status) && (o.price?.amount ?? 0) > 0 && !!o.current_period_end;

/** Cents → "$9.99". */
export const formatCents = (cents: number, currency = "usd") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: (currency || "usd").toUpperCase() }).format((cents || 0) / 100);
