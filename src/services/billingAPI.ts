// Billing — Digital Business Card subscriptions, paid through Stripe.
//
// The backend owns plans, prices and features (editable in the admin panel), and the plan
// only ever changes through Stripe's webhook: the browser coming back from Stripe proves
// nothing, so after checkout the page polls the overview until the plan is active.
// Money is always an integer in cents (999 = $9.99). Card details never touch this app.
//
// Every call names the app by app_id (the catalog id; the old app=Business_Card still works).
//
//   GET  /billing/plans?app_id=…                   → PlansData   (Essential is the free plan; no "free" key)
//   GET  /billing/overview?app_id=…                → Overview    (founding_member, limits)
//   GET  /billing/limits?app_id=…                  → LimitsData  (cards / AI agents: limit, used, allowed)
//   POST /billing/checkout      { app_id, plan_key, interval, promo_code? } → { url, session_id }
//   POST /billing/change-plan   { app_id, plan_key, interval }
//   POST /billing/cancel        { app_id }         (keeps the plan until current_period_end)
//   POST /billing/resume        { app_id }
//   POST /billing/portal        {}                 → { url }   (404 = never bought a plan)
//   GET  /billing/invoices?limit=12                → { invoices }
//   GET  /billing/entitlements?app_id=…            → { entitlements, paid }
//
// Plan limits: creating a card or an AI agent past the plan's limit is refused with 403 and
// errors[0].code === "PLAN_LIMIT_REACHED" (see planLimit.ts). Founding members and admins are unlimited.
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
  /** Founding members have no billing and no limits: show a label, hide Choose / Switch / Cancel. */
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
  overview: () => get<Overview>(`/billing/overview?${APP_Q}`),
  /** Cards / AI agents this account may still create. */
  limits: () => get<LimitsData>(`/billing/limits?${APP_Q}`),
  entitlements: () => get<{ entitlements: Record<string, string | number | boolean>; paid: boolean }>(`/billing/entitlements?${APP_Q}`),
  invoices: (limit = 12) => get<{ invoices: Invoice[] }>(`/billing/invoices?limit=${limit}`).then((d) => d?.invoices ?? []),

  /** Returns Stripe's checkout page. */
  checkout: (plan_key: string, interval: Interval, promo_code?: string) =>
    post<{ url: string; session_id: string }>("/billing/checkout", {
      app_id: BILLING_APP_ID,
      plan_key,
      interval,
      ...(promo_code?.trim() ? { promo_code: promo_code.trim() } : {}),
    }).then((d) => httpsOnly(d?.url)),

  changePlan: (plan_key: string, interval: Interval) => post("/billing/change-plan", { app_id: BILLING_APP_ID, plan_key, interval }),
  cancel: () => post("/billing/cancel", { app_id: BILLING_APP_ID }),
  resume: () => post("/billing/resume", { app_id: BILLING_APP_ID }),

  /** Stripe's customer portal (card, invoices). */
  portal: () => post<{ url: string }>("/billing/portal", {}).then((d) => httpsOnly(d?.url)),
};

/** Cents → "$9.99". */
export const formatCents = (cents: number, currency = "usd") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: (currency || "usd").toUpperCase() }).format((cents || 0) / 100);
