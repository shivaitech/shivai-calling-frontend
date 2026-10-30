// Billing. Only the Digital Business Card is billed for real today; platform and other
// app billing show "Coming soon" on the Billing page and make no calls.
//
// Card billing is provider-agnostic: the backend creates a hosted checkout page (e.g. Stripe
// Checkout or a Razorpay subscription link) and returns its URL; the browser goes there and
// comes back to success_url / cancel_url. The backend's webhook then updates the subscription,
// which GET /subscription reads. No card details ever touch this app.
//
//   GET  /business-cards/subscription            → { data: CardSubscription }  (plan "free" when none)
//   POST /business-cards/subscription/checkout   { plan, billing, success_url, cancel_url }
//                                                → { data: { checkout_url } }
//   POST /business-cards/subscription/cancel     → { data: CardSubscription }  (ends at period end)
//   POST /business-cards/subscription/resume     → { data: CardSubscription }  (undo a pending cancel)
//   GET  /business-cards/subscription/invoices   → { data: { invoices: CardInvoice[] } }
//
// Until those routes exist they 404, and the page says payments aren't switched on yet.

import axios from "axios";
import type { Billing, PlanId } from "../pages/digitalCardPricing";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/business-cards/subscription`;

export type CardPlan = PlanId | "free";
/** incomplete = checkout started but the first payment hasn't succeeded. */
export type CardSubscriptionStatus = "free" | "active" | "trialing" | "past_due" | "incomplete" | "cancelled";

export interface CardSubscription {
  plan: CardPlan;
  /** null on the free plan. */
  billing: Billing | null;
  status: CardSubscriptionStatus;
  /** Charged per billing period, in currency units (71.93, not cents). */
  amount: number;
  /** ISO 4217, e.g. "USD". */
  currency: string;
  /** ISO date the current period ends — it renews then, or ends if cancel_at_period_end. */
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  payment_method?: { brand: string; last4: string; exp_month?: number; exp_year?: number };
  /** Hosted customer portal to update the card or download receipts, if the provider has one. */
  manage_url?: string;
}

export type InvoiceStatus = "paid" | "open" | "failed" | "refunded" | "void";

export interface CardInvoice {
  id: string;
  /** Human invoice number, e.g. "INV-2026-0142". */
  number: string;
  /** ISO date issued. */
  date: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  /** e.g. "Signature · Annual". */
  description: string;
  pdf_url?: string;
}

export class BillingError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "BillingError";
    this.status = status;
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

const auth = () => ({ headers: { Authorization: `Bearer ${token()}` } });

const fail = (e: any): never => {
  throw new BillingError(e?.response?.data?.message || e?.message || "Billing request failed", e?.response?.status ?? 0);
};

/** Only ever send the browser to an https page (the URL comes from the API). */
const httpsOnly = (raw: unknown): string => {
  try {
    const u = new URL(String(raw));
    if (u.protocol === "https:") return u.href;
  } catch {
    /* fall through */
  }
  throw new BillingError("The payment page link from the server wasn't valid.", 502);
};

export const cardBillingAPI = {
  /** null = billing isn't deployed on the server yet (404). */
  async subscription(): Promise<CardSubscription | null> {
    try {
      const res = await axios.get(BASE, auth());
      return res.data?.data ?? null;
    } catch (e: any) {
      if (e?.response?.status === 404) return null;
      return fail(e);
    }
  },

  async invoices(): Promise<CardInvoice[]> {
    try {
      const res = await axios.get(`${BASE}/invoices`, auth());
      return res.data?.data?.invoices ?? [];
    } catch (e: any) {
      if (e?.response?.status === 404) return [];
      return fail(e);
    }
  },

  /** Returns the hosted payment page to send the browser to. */
  async checkout(plan: PlanId, billing: Billing, returnTo: { success: string; cancel: string }): Promise<string> {
    try {
      const res = await axios.post(
        `${BASE}/checkout`,
        { plan, billing, success_url: returnTo.success, cancel_url: returnTo.cancel },
        auth(),
      );
      return httpsOnly(res.data?.data?.checkout_url ?? res.data?.checkout_url);
    } catch (e: any) {
      if (e instanceof BillingError) throw e;
      return fail(e);
    }
  },

  async cancel(): Promise<CardSubscription> {
    try {
      return (await axios.post(`${BASE}/cancel`, {}, auth())).data?.data;
    } catch (e) {
      return fail(e);
    }
  },

  async resume(): Promise<CardSubscription> {
    try {
      return (await axios.post(`${BASE}/resume`, {}, auth())).data?.data;
    } catch (e) {
      return fail(e);
    }
  },
};
