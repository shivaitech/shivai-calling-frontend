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

export interface CardVenture {
  name: string;
  logo_url: string;
  url: string;
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
  email: string;
  website: string;
  social_media: CardSocial[];
  ventures: CardVenture[];
  agent_id: string;
}

/** Card as returned to the owner (list / create / update). */
export interface BusinessCard extends BusinessCardInput {
  _id: string;
  tenant_id: string;
  slug: string;
  /** Full public link built by the server, e.g. https://<slug>.callshivai.com. */
  share_url?: string;
  /** PNG of the card's QR code, generated and hosted (S3) by the server. */
  qr_code?: string;
  createdAt: string;
  updatedAt: string;
}

/** Card as returned by the public route (no _id anywhere). */
export interface PublicBusinessCard extends BusinessCardInput {
  tenant_id: string;
  slug: string;
  share_url?: string;
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
  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "BusinessCardError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const toError = (e: any): BusinessCardError => {
  const body = e?.response?.data;
  const fields: Record<string, string> = {};
  if (Array.isArray(body?.errors)) {
    for (const x of body.errors) if (x?.field && !fields[x.field]) fields[x.field] = x.message;
  }
  return new BusinessCardError(
    body?.message || e?.message || "Request failed",
    e?.response?.status ?? 0,
    fields,
  );
};

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

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
});

// ── Payload ──────────────────────────────────────────────────────────────────
/** Whitelists fields so stray keys (_id, slug, createdAt…) never reach Joi. */
export const toPayload = (c: BusinessCardInput): Omit<BusinessCardInput, "agent_id"> & { agent_id?: string } => ({
  full_name: c.full_name.trim(),
  job_title: c.job_title.trim(),
  company_name: c.company_name.trim(),
  tagline: c.tagline,
  image_url: c.image_url.trim(),
  color_code: c.color_code,
  country_code: c.country_code.trim(),
  phone_number: c.phone_number.trim(),
  is_whatsapp_number: c.is_whatsapp_number,
  email: c.email.trim(),
  website: c.website.trim(),
  social_media: c.social_media.map((s) => ({ type: s.type, url: s.url.trim(), username: s.username.trim() })),
  ventures: c.ventures.map((v) => ({ name: v.name.trim(), logo_url: v.logo_url.trim(), url: v.url.trim() })),
  // The AI agent is optional: leave the key out entirely when none is chosen
  // (an empty string would fail the API's 24-char ObjectId check).
  ...(c.agent_id ? { agent_id: c.agent_id } : {}),
});

// ── API ──────────────────────────────────────────────────────────────────────
export const businessCardAPI = {
  async create(input: BusinessCardInput): Promise<BusinessCard> {
    try {
      const res = await axios.post(BASE, toPayload(input), authHeaders());
      return res.data.data;
    } catch (e) {
      throw toError(e);
    }
  },

  /** PUT /:id — `id` is data._id (24-char ObjectId), not the slug. */
  async update(id: string, input: Partial<BusinessCardInput>): Promise<BusinessCard> {
    try {
      const res = await axios.put(`${BASE}/${id}`, input, authHeaders());
      return res.data.data;
    } catch (e) {
      throw toError(e);
    }
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
      return { cards: res.data.data?.businessCards ?? [], pagination };
    } catch (e) {
      throw toError(e);
    }
  },

  /** Anonymous — deliberately sends no Authorization header. */
  async getPublic(slug: string): Promise<PublicBusinessCard> {
    try {
      const res = await axios.get(`${BASE}/public/${encodeURIComponent(slug)}`);
      return res.data.data;
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
