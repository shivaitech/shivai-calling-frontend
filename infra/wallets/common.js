/**
 * Shared by the wallet modules (Google, Apple, Samsung): config, loading a card from
 * the public API, the card's link, and the error type the route handlers turn into
 * JSON. Node 18+ (global fetch), no dependencies.
 */

const fs = require("fs");

const API_BASE = (process.env.API_BASE || "https://nodejs.service.callshivai.com/api/v1").replace(/\/+$/, "");
const SITE_URL = (process.env.SITE_URL || "https://www.callshivai.com").replace(/\/+$/, "");
const DEFAULT_LOGO = `${SITE_URL}/Shivai1.png`;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,98}[a-z0-9]$/;
const HEX_RE = /^#[0-9a-f]{6}$/i;

class WalletError extends Error {
  constructor(message, status = 502, publicMessage = "Couldn't create the wallet pass") {
    super(message);
    this.status = status;
    this.publicMessage = publicMessage;
  }
}

const notConfigured = (what) => new WalletError(`${what} not set`, 503, "This wallet isn't available yet");

/** An env value that is either the secret itself (PEM / JSON) or a path to a file holding it. */
function secret(name, { required = true } = {}) {
  const raw = (process.env[name] || "").trim();
  if (!raw) {
    if (required) throw notConfigured(name);
    return "";
  }
  if (raw.startsWith("-----BEGIN") || raw.startsWith("{")) return raw.replace(/\\n/g, "\n");
  return fs.readFileSync(raw, "utf8");
}

const href = (u) => (/^[a-z]+:/i.test(u) ? u : `https://${u}`);
const host = (u) => String(u).replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");

function fullPhone(c) {
  const cc = String(c.country_code || "").replace(/\D/g, "");
  const num = String(c.phone_number || "").replace(/\D/g, "");
  return num ? (cc ? `+${cc}${num}` : num) : "";
}

/** The card's public link — the server's share_url when present, else built from the slug. */
function cardLink(card) {
  try {
    const u = new URL(String(card.share_url || "").trim());
    if (u.protocol === "https:") return u.href.replace(/\/$/, "");
  } catch {
    /* fall through */
  }
  const site = new URL(SITE_URL).hostname.replace(/^www\./, "");
  return card.slug.length <= 63 ? `https://${card.slug}.${site}` : `${SITE_URL}/card/${card.slug}`;
}

/** A stable per-card id: the DB _id when present (survives renames), else the slug. */
const cardKey = (card) => String(card._id || card.slug).replace(/[^A-Za-z0-9._-]/g, "_");

async function fetchCard(slug) {
  slug = String(slug || "").toLowerCase();
  if (!SLUG_RE.test(slug)) throw new WalletError(`Invalid slug ${slug}`, 404, "Card not found");
  const res = await fetch(`${API_BASE}/business-cards/public/${encodeURIComponent(slug)}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(6000),
  });
  if (res.status === 404 || res.status === 422) throw new WalletError(`Card ${slug} not found`, 404, "Card not found");
  if (!res.ok) throw new WalletError(`Card API ${res.status} for ${slug}`);
  const json = await res.json();
  if (!json || !json.data) throw new WalletError(`Card API returned no data for ${slug}`, 404, "Card not found");
  return { slug, ...json.data };
}

/** Turns any thrown error into { status, message } and logs the real reason server-side. */
function toFailure(e, tag) {
  const err = e instanceof WalletError ? e : new WalletError(String((e && e.message) || e));
  console.error(`[${tag}]`, err.message);
  return { status: err.status, message: err.publicMessage };
}

/** CORS headers for the standalone-Lambda handlers (the backend has its own CORS setup). */
function corsFor(event) {
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || "";
  const ok = /^https:\/\/([a-z0-9-]+\.)*callshivai\.com$/i.test(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin);
  return ok ? { "access-control-allow-origin": origin, vary: "Origin" } : {};
}

/** The slug from a Lambda Function URL path like /<slug> or /<slug>/<anything>. */
const slugFromPath = (event, suffix) =>
  (event.rawPath || event.path || "").split("/").filter(Boolean).filter((s) => s !== suffix).pop();

module.exports = {
  API_BASE,
  SITE_URL,
  DEFAULT_LOGO,
  HEX_RE,
  WalletError,
  notConfigured,
  secret,
  href,
  host,
  fullPhone,
  cardLink,
  cardKey,
  fetchCard,
  toFailure,
  corsFor,
  slugFromPath,
};
