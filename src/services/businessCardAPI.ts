// Business Cards — tenant-owned public profiles.
// Talks to /api/v1/business-cards. Create/update/list need an admin or tenant
// token; GET /public/:slug is anonymous. The server builds the slug
// ({full-name}-{company-name}) — never send slug, tenant_id or _id.

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BASE = `${API_BASE_URL}/business-cards`;

// ── Types ────────────────────────────────────────────────────────────────────
export type SocialType = "linkedin" | "twitter" | "facebook" | "instagram" | "youtube" | "website";

export interface CardSocial {
  type: SocialType;
  url: string;
  username: string;
}

export type PhoneLabel = "mobile" | "work" | "office" | "home" | "other";

/** A number beyond the primary one (country_code / phone_number / is_whatsapp_number). */
export interface CardPhone {
  label: PhoneLabel;
  country_code: string;
  phone_number: string;
  is_whatsapp_number: boolean;
}

export type EmailLabel = "work" | "personal" | "other";

/** An email beyond the primary one (e.g. personal + official). */
export interface CardEmail {
  label: EmailLabel;
  email: string;
}

/** A saved QR wallpaper design (same shape as the QR studio's design). */
export interface CardQrDesign {
  format: string;
  fg: string;
  bg: number;
  photo: string | null;
  size: number;
  tileOpacity: number;
  pos: { x: number; y: number };
  label: string;
}

/** Actions the owner can feature as the big button on the card. */
export type CardHighlight = "ai" | "whatsapp" | "email" | "pay" | "save";

/** Pay Me: where visitors are sent to pay the card owner. ShivAI never processes the payment. */
export type PayProvider = "upi" | "paypal" | "stripe" | "wise" | "bank" | "link" | "qr";

export interface CardPayMethod {
  provider: PayProvider;
  /** Button text on the card, e.g. "Pay by UPI". */
  label: string;
  /** UPI ID, https payment link, or bank details text — depends on provider. Empty for "qr". */
  value: string;
  /** Uploaded payment QR image ("qr" provider; optional for others). */
  qr_url?: string;
  /** ISO 4217 the owner receives in, e.g. "INR". Display only. */
  currency?: string;
  is_default?: boolean;
  /** false = kept in the editor but hidden from the card. */
  enabled?: boolean;
}

/** What a "venture" entry is: a company/project, or something to browse (shop catalog, PDF…). */
export type VentureType = "venture" | "catalog" | "document" | "menu" | "portfolio";
/** How big the logo / cover shows on the card. */
export type LogoSize = "s" | "m" | "l";

export interface CardVenture {
  name: string;
  logo_url: string;
  url: string;
  /** Omitted (= "venture") on older cards. */
  type?: VentureType;
  /** Omitted (= "s", the original small logo) on older cards. */
  logo_size?: LogoSize;
  /** Original name of an uploaded document, shown on the card. */
  file_name?: string;
  /** A line or two about it, shown under the name. */
  description?: string;
}

/** The editable fields — exactly what POST / PUT accept (minus agent rules). */
export interface BusinessCardInput {
  full_name: string;
  job_title: string;
  company_name: string;
  tagline: string;
  image_url: string;
  color_code: string;
  country_code: string;
  phone_number: string;
  is_whatsapp_number: boolean;
  /** More numbers after the primary one. Omitted on older cards. */
  additional_phones?: CardPhone[];
  /** More emails after the primary one. Omitted on older cards. */
  additional_emails?: CardEmail[];
  /** Pay Me options. Omitted on older cards. */
  payment_methods?: CardPayMethod[];
  /** The one action shown as the big featured button. Omitted = My AI when an agent is set. */
  highlight?: CardHighlight;
  email: string;
  website: string;
  social_media: CardSocial[];
  ventures: CardVenture[];
  agent_id: string;
  /** Chosen link name → https://<username>.callshivai.com. Required when creating a card; fixed after that. */
  username: string;
  /** Private name the owner tells cards apart by ("Official card"). Shown in the dashboard only, never on the card. */
  card_name?: string;
}

/** The card plans. */
export type CardPlan = "essential" | "signature" | "prestige";

/** Card as returned to the owner (list / create / update). */
export interface BusinessCard extends BusinessCardInput {
  /** The card's plan, when the server stores one. */
  plan?: CardPlan | "free";
  _id: string;
  tenant_id: string;
  slug: string;
  /** Full public link built by the server, e.g. https://<slug>.callshivai.com. */
  share_url?: string;
  /** PNG of the card's QR code, generated and hosted (S3) by the server. */
  qr_code?: string;
  /** The owner's saved QR wallpaper design (owner responses only). */
  qr_design?: CardQrDesign | null;
  createdAt: string;
  updatedAt: string;
}

/** Card as returned by the public route (no _id anywhere). */
export interface PublicBusinessCard extends BusinessCardInput {
  tenant_id: string;
  slug: string;
  share_url?: string;
  /** The owner's card plan — picks the card's look (Prestige = gold). Omitted = standard. */
  plan?: "free" | "essential" | "signature" | "prestige";
  /** Created under the Founding Member offer (before 31 Dec 2026): shows a small badge. */
  founding_member?: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "full_name" | "company_name";
  sortOrder?: "asc" | "desc";
}

// ── Errors ───────────────────────────────────────────────────────────────────
export class BusinessCardError extends Error {
  status: number;
  /** 422 only — keyed by the API's dot path, e.g. "social_media.0.url". */
  fieldErrors: Record<string, string>;
  /** The raw HTTP response, when there was one. */
  response?: { status?: number; data?: unknown };
  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "BusinessCardError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** The API's validator wording ('"ventures[0].url" must be a valid uri with a scheme matching
 *  the https pattern') in plain words, without the field path. */
function plainMessage(raw: string): string {
  const m = String(raw ?? "").trim();
  if (/valid uri|scheme matching/i.test(m)) return "Enter a valid link, like https://example.com";
  if (/is required|is not allowed to be empty/i.test(m) && /^"/.test(m)) return "This field is required";
  const rest = m.replace(/^"[^"]*"\s*/, "");
  return rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : m;
}

const toError = (e: any): BusinessCardError => {
  const body = e?.response?.data;
  const fields: Record<string, string> = {};
  if (Array.isArray(body?.errors)) {
    for (const x of body.errors) {
      // "ventures[0].url" → "ventures.0.url", the form's key for that field.
      const key = typeof x?.field === "string" ? x.field.replace(/\[(\d+)\]/g, ".$1") : "";
      if (key && !fields[key]) fields[key] = plainMessage(x.message);
    }
  }
  const err = new BusinessCardError(body?.message || e?.message || "Request failed", e?.response?.status ?? 0, fields);
  // Kept so a plan-limit refusal (403, errors[0].code "PLAN_LIMIT_REACHED") can be recognised (Billing/planLimit.ts).
  err.response = e?.response;
  return err;
};

/** What to tell the person: the server's first field problem ("Username is required"), plus how many
 *  more; else its message, unless that's only the generic "Validation failed". */
export function cardErrorMessage(e: BusinessCardError, fallback = "Some details need fixing"): string {
  const problems = Object.values(e.fieldErrors ?? {}).filter(Boolean);
  if (problems.length) return problems.length > 1 ? `${problems[0]} (and ${problems.length - 1} more to fix)` : problems[0];
  return e.message && !/^validation failed\.?$/i.test(e.message.trim()) ? e.message : fallback;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
const getAuthToken = (): string | null => {
  try {
    const stored = localStorage.getItem("auth_tokens");
    if (stored) {
      const { accessToken } = JSON.parse(stored);
      if (accessToken) return accessToken;
    }
  } catch {
    /* fall through */
  }
  return localStorage.getItem("authToken");
};

/** Whether there's a session to call authenticated endpoints with (e.g. the availability check). */
export const hasSession = () => !!getAuthToken();

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
});

// ── Agent id ─────────────────────────────────────────────────────────────────
/** The API sometimes returns agent_id populated ({ id, name, agent_type, … }) instead of the
 *  id string. Everything here works with the id, so reduce it to that. */
export const agentIdOf = (v: unknown): string => {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const o = v as { id?: unknown; _id?: unknown };
    const id = o.id ?? o._id;
    return typeof id === "string" ? id : "";
  }
  return "";
};

/** A card from the API with agent_id always a plain id string. */
function normalizeCard<T>(card: T): T {
  if (!card || typeof card !== "object") return card;
  const c = card as T & { agent_id?: unknown; payment_methods?: CardPayMethod[] };
  return {
    ...c,
    agent_id: agentIdOf(c.agent_id),
    // A value that is just the QR's own link (possible on methods saved that way earlier) reads as
    // "no value", so the method is shown and edited as a QR, not as a payment link.
    ...(Array.isArray(c.payment_methods)
      ? { payment_methods: c.payment_methods.map((m) => (m.qr_url && m.value === m.qr_url ? { ...m, value: "" } : m)) }
      : {}),
  };
}

// ── Payload ──────────────────────────────────────────────────────────────────
/** Links in the form the API accepts (https only): "athar.com" → "https://athar.com",
 *  "http://athar.com" → "https://athar.com"; "https://…" is kept as typed; empty stays empty. */
export function httpsLink(raw: string | undefined | null): string {
  const u = (raw ?? "").trim();
  if (!u) return "";
  if (/^https:\/\//i.test(u)) return u;
  if (/^http:\/\//i.test(u)) return "https://" + u.slice(7);
  return "https://" + u.replace(/^\/+/, "");
}
/** Whitelists fields so stray keys (_id, slug, createdAt…) never reach Joi. */
export const toPayload = (
  c: BusinessCardInput,
): Omit<BusinessCardInput, "agent_id" | "username"> & { agent_id?: string; username?: string } => ({
  full_name: c.full_name.trim(),
  job_title: c.job_title.trim(),
  company_name: c.company_name.trim(),
  tagline: c.tagline,
  image_url: c.image_url.trim(),
  color_code: c.color_code,
  country_code: c.country_code.trim(),
  phone_number: c.phone_number.trim(),
  is_whatsapp_number: c.is_whatsapp_number,
  // Only sent when there are extra numbers, so single-number cards save the same payload as before.
  ...(() => {
    const phones = (c.additional_phones ?? [])
      .filter((p) => p.phone_number.trim())
      .map((p) => ({ label: p.label, country_code: p.country_code.trim(), phone_number: p.phone_number.trim(), is_whatsapp_number: p.is_whatsapp_number }));
    return phones.length ? { additional_phones: phones } : {};
  })(),
  // Only sent when there are extra emails, so single-email cards save the same payload as before.
  ...(() => {
    const emails = (c.additional_emails ?? []).filter((m) => m.email.trim()).map((m) => ({ label: m.label, email: m.email.trim() }));
    return emails.length ? { additional_emails: emails } : {};
  })(),
  // Owner-only label: sent once it's been set (an empty string clears it), so older cards save as before.
  ...(c.card_name !== undefined ? { card_name: c.card_name.trim() } : {}),
  // The featured button — only sent once the owner picks one.
  ...(c.highlight ? { highlight: c.highlight } : {}),
  // Pay Me — only sent once the owner adds a method.
  ...(c.payment_methods?.length
    ? {
        payment_methods: c.payment_methods.map((m) => ({
          provider: m.provider,
          label: m.label.trim(),
          value: m.value.trim(),
          // The uploaded QR goes in qr_url: its S3 link, never image data (photo.ts uploads it first).
          ...(/^https:\/\//i.test(m.qr_url ?? "") ? { qr_url: m.qr_url!.trim() } : {}),
          ...(m.currency ? { currency: m.currency } : {}),
          is_default: !!m.is_default,
          enabled: m.enabled !== false,
        })),
      }
    : {}),
  email: c.email.trim(),
  website: httpsLink(c.website),
  social_media: c.social_media.map((s) => ({ type: s.type, url: httpsLink(s.url), username: s.username.trim() })),
  // type / logo_size / file_name only go out when used, so cards that don't use them save the
  // same payload as before.
  ventures: c.ventures.map((v) => ({
    name: v.name.trim(),
    logo_url: v.logo_url.trim(),
    url: httpsLink(v.url),
    ...(v.type && v.type !== "venture" ? { type: v.type } : {}),
    ...(v.logo_size && v.logo_size !== "s" && v.logo_url.trim() ? { logo_size: v.logo_size } : {}),
    ...(v.file_name?.trim() ? { file_name: v.file_name.trim() } : {}),
    ...(v.description?.trim() ? { description: v.description.trim() } : {}),
  })),
  // The AI agent is optional: leave the key out entirely when none is chosen
  // (an empty string would fail the API's 24-char ObjectId check).
  ...(agentIdOf(c.agent_id) ? { agent_id: agentIdOf(c.agent_id) } : {}),
  // Same for the username: omitted when blank so the server keeps building the link itself.
  ...(c.username?.trim() ? { username: c.username.trim().toLowerCase() } : {}),
});

/** Reads "is it free?" from whichever shape the availability endpoint answers with.
 *  null = the answer couldn't be read (the server confirms on save instead). */
function readAvailability(data: unknown, envelope: unknown): boolean | null {
  if (typeof data === "boolean") return data;
  const objs = [data, envelope].filter((o): o is Record<string, unknown> => !!o && typeof o === "object");
  for (const o of objs) {
    for (const k of ["available", "isAvailable", "is_available", "availability", "isUsernameAvailable"]) {
      const v = o[k];
      if (typeof v === "boolean") return v;
      if (v === "true" || v === "false") return v === "true";
    }
    for (const k of ["taken", "isTaken", "is_taken", "exists", "already_taken", "alreadyExists"]) {
      const v = o[k];
      if (typeof v === "boolean") return !v;
    }
    if (typeof o.status === "string" && /^(available|taken|unavailable)$/i.test(o.status)) return /^available$/i.test(o.status);
  }
  return null;
}

export interface UsernameAvailability {
  /** null = couldn't tell from the response. */
  available: boolean | null;
  /** Server explanation when it isn't available (taken / reserved / invalid), if given. */
  message?: string;
  suggestions?: string[];
}

/**
 * Sends `plan` with the card (complimentary accounts only — see complimentaryPlans.ts). A server
 * that doesn't take the field rejects it ('"plan" is not allowed'); the card then saves without it.
 */
async function sendWithPlan(send: (body: object) => Promise<BusinessCard>, body: object, plan?: CardPlan): Promise<BusinessCard> {
  if (!plan) return send(body);
  try {
    return await send({ ...body, plan });
  } catch (e) {
    const be = e as BusinessCardError;
    const aboutPlan = "plan" in be.fieldErrors || /["']?\bplan\b["']?\s+is not allowed/i.test(be.message);
    if ((be.status === 400 || be.status === 422) && aboutPlan) return send(body);
    throw e;
  }
}

// ── API ──────────────────────────────────────────────────────────────────────
export const businessCardAPI = {
  async create(input: BusinessCardInput, opts: { plan?: CardPlan } = {}): Promise<BusinessCard> {
    return sendWithPlan(
      async (body) => {
        try {
          return normalizeCard((await axios.post(BASE, body, authHeaders())).data.data);
        } catch (e) {
          throw toError(e);
        }
      },
      toPayload(input),
      opts.plan,
    );
  },

  /** PUT /:id — `id` is data._id (24-char ObjectId), not the slug. */
  async update(id: string, input: Partial<BusinessCardInput>, opts: { plan?: CardPlan } = {}): Promise<BusinessCard> {
    return sendWithPlan(
      async (body) => {
        try {
          return normalizeCard((await axios.put(`${BASE}/${id}`, body, authHeaders())).data.data);
        } catch (e) {
          throw toError(e);
        }
      },
      input,
      opts.plan,
    );
  },

  async list(params: ListParams = {}): Promise<{ cards: BusinessCard[]; pagination: Pagination }> {
    try {
      const res = await axios.get(BASE, { ...authHeaders(), params });
      const pagination: Pagination = res.data.meta?.pagination ?? {
        page: 1,
        limit: params.limit ?? 10,
        total: 0,
        totalPages: 0,
      };
      return { cards: (res.data.data?.businessCards ?? []).map(normalizeCard), pagination };
    } catch (e) {
      throw toError(e);
    }
  },

  /** GET /username-availability — needs a logged-in session. */
  async usernameAvailability(username: string): Promise<UsernameAvailability> {
    try {
      const res = await axios.get(`${BASE}/username-availability`, { ...authHeaders(), params: { username } });
      const available = readAvailability(res.data?.data, res.data);
      const d = res.data?.data && typeof res.data.data === "object" ? res.data.data : {};
      return {
        available,
        // Only an explanation for a "no" — never the envelope's "…checked successfully" message.
        message: available === false && typeof d.message === "string" ? d.message : undefined,
        suggestions: Array.isArray(d.suggestions) ? d.suggestions.filter((s: unknown) => typeof s === "string") : undefined,
      };
    } catch (e) {
      throw toError(e);
    }
  },

  /** POST /upload-document (multipart "file") — a PDF for a document / catalog / menu entry. */
  async uploadDocument(file: File): Promise<{ url: string; file_name: string }> {
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await axios.post(`${BASE}/upload-document`, form, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        timeout: 60000,
      });
      const d = res.data?.data ?? res.data ?? {};
      const url = d.url ?? d.file_url;
      if (typeof url !== "string" || !url) throw new BusinessCardError("Upload finished but no file link came back.", 502);
      return { url, file_name: d.file_name ?? file.name };
    } catch (e) {
      if (e instanceof BusinessCardError) throw e;
      throw toError(e);
    }
  },

  /** Anonymous — deliberately sends no Authorization header. */
  async getPublic(slug: string): Promise<PublicBusinessCard> {
    try {
      const res = await axios.get(`${BASE}/public/${encodeURIComponent(slug)}`);
      return normalizeCard(res.data.data);
    } catch (e) {
      throw toError(e);
    }
  },
};

/** Shared links always use the production host (even when running locally).
 *  Must be www: the apex callshivai.com does not serve the app — it only
 *  redirects "/" to www and returns 404 for every other path.
 *  Override with VITE_PUBLIC_APP_URL for staging. */
export const PUBLIC_APP_URL = (import.meta.env.VITE_PUBLIC_APP_URL || "https://www.callshivai.com").replace(/\/+$/, "");

/** Card links are https://<slug>.callshivai.com (served via infra/card-subdomain-cdn,
 *  which also gives WhatsApp & co. a preview with the photo and tagline). A slug
 *  longer than a DNS label (63) can't be a subdomain and keeps the /card/<slug> path.
 *  VITE_CARD_SUBDOMAINS=false switches back to /card/<slug> links everywhere. */
const USE_SUBDOMAINS = import.meta.env.VITE_CARD_SUBDOMAINS !== "false";

export const publicCardUrl = (slug: string) => {
  if (USE_SUBDOMAINS && slug.length <= 63) {
    const base = new URL(PUBLIC_APP_URL).hostname.replace(/^www\./, "");
    return `https://${slug}.${base}`;
  }
  return `${PUBLIC_APP_URL}/card/${slug}`;
};

/** The card's link: the API's `share_url` when it sent one (so the backend owns the
 *  link format), otherwise built from the slug. Only https is accepted because the
 *  value ends up in hrefs and QR codes. */
const httpsUrl = (raw?: string): URL | null => {
  try {
    const u = new URL((raw || "").trim());
    return u.protocol === "https:" ? u : null;
  } catch {
    return null;
  }
};

export const cardUrl = (card: { slug: string; share_url?: string }): string => {
  const u = httpsUrl(card.share_url); // URL() also lowercases the host (the API sends "CallShivAI.com")
  return u ? u.href.replace(/\/$/, "") : publicCardUrl(card.slug);
};

/** The server-made QR image for the card, or null to generate one in the browser. */
export const cardQrImage = (card: { qr_code?: string }): string | null => httpsUrl(card.qr_code)?.href ?? null;

/**
 * Google Wallet: the backend route from infra/google-wallet, as a template with {slug},
 * e.g. https://nodejs.service.callshivai.com/api/v1/business-cards/public/{slug}/google-wallet
 * Unset = the option stays "Coming soon".
 */
const GOOGLE_WALLET_URL = ((import.meta.env.VITE_GOOGLE_WALLET_URL as string | undefined) || "").trim();
export const googleWalletEnabled = GOOGLE_WALLET_URL.includes("{slug}");

/** Asks the backend to create/update the card's pass and returns Google's "save" link. */
export async function googleWalletSaveUrl(slug: string): Promise<string> {
  const res = await axios.get(GOOGLE_WALLET_URL.replace("{slug}", encodeURIComponent(slug))).catch((e) => {
    throw toError(e);
  });
  const url: unknown = res.data?.data?.saveUrl ?? res.data?.saveUrl;
  // Only ever navigate to Google's own save page.
  if (typeof url !== "string" || !url.startsWith("https://pay.google.com/gp/v/save/")) {
    throw new BusinessCardError("Unexpected response from the Google Wallet service", 502);
  }
  return url;
}

/** The card's link without the scheme, for display. */
export const cardLabel = (card: { slug: string; share_url?: string }) => cardUrl(card).replace(/^https:\/\//, "");
