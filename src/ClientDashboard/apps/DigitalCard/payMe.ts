import { Building2, CreditCard, Globe2, Link2, LucideIcon, QrCode, Send, Smartphone } from "lucide-react";
import type { CardPayMethod, PayProvider } from "../../../services/businessCardAPI";

/**
 * Pay Me — the card links visitors to payment services the owner already uses. ShivAI is not a
 * payment processor: it never collects card numbers, bank passwords, UPI PINs or any payment
 * credentials, and only ever sends visitors to the provider's own (https) payment flow.
 */

export interface PayProviderInfo {
  id: PayProvider;
  name: string;
  /** Where / what it's for — shown when choosing a provider. */
  use: string;
  Icon: LucideIcon;
  /** Pre-filled button text on the card. */
  defaultLabel: string;
  defaultCurrency?: string;
  /** The value field; omitted for "qr" (image only). */
  field?: { label: string; placeholder: string; multiline?: boolean; hint?: string };
  /** A QR image is required ("qr") or optional (others that support one). */
  qr: "required" | "optional" | "none";
  /** "" when valid, otherwise what to fix. */
  check: (value: string) => string;
  /** Tidies the value before it's saved. */
  normalize: (value: string) => string;
}

/** https URL from what was typed ("paypal.me/x" → "https://paypal.me/x"), or null. */
export function toHttps(raw: string): URL | null {
  const v = raw.trim();
  if (!v) return null;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`);
    return u.protocol === "https:" && u.hostname.includes(".") ? u : null;
  } catch {
    return null;
  }
}

const hostIs = (u: URL | null, ...domains: string[]) => !!u && domains.some((d) => u.hostname === d || u.hostname.endsWith(`.${d}`));

const linkCheck =
  (what: string, ...domains: string[]) =>
  (v: string) => {
    const u = toHttps(v);
    if (!v.trim()) return `Paste your ${what} link`;
    if (!u) return "Enter a valid https link";
    if (domains.length && !hostIs(u, ...domains)) return `That doesn't look like a ${what} link`;
    return "";
  };

const normalizeLink = (v: string) => toHttps(v)?.href ?? v.trim();

const UPI_ID = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/;

export const PAY_PROVIDERS: PayProviderInfo[] = [
  {
    id: "upi",
    name: "UPI",
    use: "India · GPay, PhonePe, Paytm and any UPI app",
    Icon: Smartphone,
    defaultLabel: "Pay by UPI",
    defaultCurrency: "INR",
    field: { label: "UPI ID", placeholder: "yourname@okhdfcbank" },
    qr: "none",
    check: (v) => (!v.trim() ? "Enter your UPI ID" : UPI_ID.test(v.trim()) ? "" : "Enter a valid UPI ID, like name@bank"),
    normalize: (v) => v.trim(),
  },
  {
    id: "paypal",
    name: "PayPal",
    use: "International payments",
    Icon: Globe2,
    defaultLabel: "Pay with PayPal",
    defaultCurrency: "USD",
    field: { label: "PayPal.Me link or username", placeholder: "paypal.me/yourname" },
    qr: "none",
    check: (v) => (/^[A-Za-z0-9]{1,20}$/.test(v.trim()) ? "" : linkCheck("PayPal", "paypal.me", "paypal.com")(v)),
    // A bare username becomes their PayPal.Me link.
    normalize: (v) => (/^[A-Za-z0-9]{1,20}$/.test(v.trim()) ? `https://paypal.me/${v.trim()}` : normalizeLink(v)),
  },
  {
    id: "stripe",
    name: "Stripe Payment Link",
    use: "Card payments in supported countries",
    Icon: CreditCard,
    defaultLabel: "Pay by card",
    defaultCurrency: "USD",
    field: { label: "Stripe payment link", placeholder: "https://buy.stripe.com/…" },
    qr: "none",
    check: linkCheck("Stripe", "stripe.com"),
    normalize: normalizeLink,
  },
  {
    id: "wise",
    name: "Wise",
    use: "International transfers",
    Icon: Send,
    defaultLabel: "Pay with Wise",
    field: { label: "Wise payment link", placeholder: "https://wise.com/pay/me/yourname" },
    qr: "none",
    check: linkCheck("Wise", "wise.com"),
    normalize: normalizeLink,
  },
  {
    id: "bank",
    name: "Bank transfer",
    use: "Local or international bank payments",
    Icon: Building2,
    defaultLabel: "Bank transfer",
    field: {
      label: "Bank details",
      placeholder: "Account name\nAccount number\nIFSC / SWIFT / IBAN\nBank name",
      multiline: true,
      hint: "Visible to anyone who opens your card. Share only what's needed to receive money, never passwords or PINs.",
    },
    qr: "none",
    check: (v) => (!v.trim() ? "Add your bank details" : v.length > 500 ? "Max 500 characters" : ""),
    normalize: (v) => v.trim(),
  },
  {
    id: "link",
    name: "Payment link",
    use: "Any provider: Razorpay, Square, Revolut, Instamojo…",
    Icon: Link2,
    defaultLabel: "Pay online",
    field: { label: "Payment link", placeholder: "https://…" },
    qr: "optional",
    check: linkCheck("payment"),
    normalize: normalizeLink,
  },
  {
    id: "qr",
    name: "Payment QR",
    use: "Upload the QR from your payment app",
    Icon: QrCode,
    defaultLabel: "Scan to pay",
    qr: "required",
    check: () => "",
    normalize: (v) => v.trim(),
  },
];

export const payProvider = (id: PayProvider) => PAY_PROVIDERS.find((p) => p.id === id) ?? PAY_PROVIDERS[PAY_PROVIDERS.length - 2];

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SAR", "SGD", "AUD", "CAD", "JPY", "CHF", "ZAR", "NZD", "MYR", "HKD"];

export const MAX_PAY_METHODS = 8;

/** Why a method can't be saved, or "". */
export function payMethodProblem(m: CardPayMethod): string {
  const p = payProvider(m.provider);
  if (!m.label.trim()) return "Give this payment option a name";
  if (m.label.trim().length > 40) return "Keep the name under 40 characters";
  if (p.qr === "required" && !m.qr_url) return "Upload your payment QR";
  return p.field ? p.check(m.value) : "";
}

/** Methods visitors see: enabled ones, the default first. */
export const visiblePayMethods = (methods: CardPayMethod[] = []) =>
  methods.filter((m) => m.enabled !== false && !payMethodProblem(m)).sort((a, b) => Number(!!b.is_default) - Number(!!a.is_default));

export type PayAction =
  | { kind: "link"; url: string }
  | { kind: "upi"; uri: string; id: string }
  | { kind: "qr"; image: string }
  | { kind: "bank"; text: string };

/** What tapping a method does on the card. */
export function payAction(m: CardPayMethod, payeeName: string): PayAction | null {
  switch (m.provider) {
    case "upi": {
      const q = new URLSearchParams({ pa: m.value.trim(), pn: payeeName.trim() || "Payee", cu: m.currency || "INR" });
      return { kind: "upi", uri: `upi://pay?${q.toString()}`, id: m.value.trim() };
    }
    case "qr":
      return m.qr_url ? { kind: "qr", image: m.qr_url } : null;
    case "bank":
      return { kind: "bank", text: m.value.trim() };
    default: {
      const u = toHttps(m.value);
      return u ? { kind: "link", url: u.href } : m.qr_url ? { kind: "qr", image: m.qr_url } : null;
    }
  }
}
