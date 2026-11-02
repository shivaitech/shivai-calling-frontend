// Billing — Digital Business Card subscriptions, paid through Stripe.
//
// The backend owns plans, prices and features (editable in the admin panel), and the plan
// only ever changes through Stripe's webhook: the browser coming back from Stripe proves
// nothing, so after checkout the page polls the overview until the plan is active.
// Money is always an integer in cents (999 = $9.99). Card details never touch this app.
//
//   GET  /billing/plans?app=Business_Card         → PlansData
//   GET  /billing/overview?app=Business_Card      → Overview
//   POST /billing/checkout      { app, plan_key, interval, promo_code? } → { url, session_id }
//   POST /billing/change-plan   { app, plan_key, interval }
//   POST /billing/cancel        { app }            (keeps the plan until current_period_end)
//   POST /billing/resume        { app }
//   POST /billing/portal        {}                 → { url }   (404 = never bought a plan)
//   GET  /billing/invoices?limit=12                → { invoices }
//   GET  /billing/entitlements?app=Business_Card   → { entitlements, paid }
//
// Status codes the UI acts on: 400 promo / declined card, 401 signed out, 403 account type
// can't pay (admin, staff), 404 plan not sold / nothing to change, 409 already subscribed or
// last payment failed, 422 field errors, 502 Stripe didn't answer, 503 payments switched off.

import axios from "axios";

const API = (import.meta.env.VITE_BILLING_API_URL || import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
export const BILLING_APP = "Business_Card";

export type Interval = "month" | "year";

export interface PlanPrice {
  amount: number;
  monthly_equivalent: number;
}

export interface PlanCard {
  id: string;
  /** "essential" | "signature" | "prestige" | "free" — admin-defined, so typed loosely. */
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
  /** false → the button says "Opens soon". */
  purchasable: boolean;
}

export interface PlansData {
  app: string;
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

export const cardBillingAPI = {
  plans: () => get<PlansData>(`/billing/plans?app=${BILLING_APP}`),
  overview: () => get<Overview>(`/billing/overview?app=${BILLING_APP}`),
  entitlements: () => get<{ entitlements: Record<string, string | number | boolean>; paid: boolean }>(`/billing/entitlements?app=${BILLING_APP}`),
  invoices: (limit = 12) => get<{ invoices: Invoice[] }>(`/billing/invoices?limit=${limit}`).then((d) => d?.invoices ?? []),

  /** Returns Stripe's checkout page. */
  checkout: (plan_key: string, interval: Interval, promo_code?: string) =>
    post<{ url: string; session_id: string }>("/billing/checkout", {
      app: BILLING_APP,
      plan_key,
      interval,
      ...(promo_code?.trim() ? { promo_code: promo_code.trim() } : {}),
    }).then((d) => httpsOnly(d?.url)),

  changePlan: (plan_key: string, interval: Interval) => post("/billing/change-plan", { app: BILLING_APP, plan_key, interval }),
  cancel: () => post("/billing/cancel", { app: BILLING_APP }),
  resume: () => post("/billing/resume", { app: BILLING_APP }),

  /** Stripe's customer portal (card, invoices). */
  portal: () => post<{ url: string }>("/billing/portal", {}).then((d) => httpsOnly(d?.url)),
};

/** Cents → "$9.99". */
export const formatCents = (cents: number, currency = "usd") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: (currency || "usd").toUpperCase() }).format((cents || 0) / 100);
