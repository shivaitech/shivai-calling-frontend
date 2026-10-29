/**
 * Google Wallet passes for ShivAI digital business cards.
 *
 *   GET <route>/:slug  →  { success: true, data: { saveUrl } }
 *
 * `saveUrl` is a https://pay.google.com/gp/v/save/<jwt> link; opening it shows
 * Google's "Add to Google Wallet" screen for that card. Each request creates or
 * updates the card's pass with Google first, so a saved pass picks up edits to the
 * card (name, photo, colour, links) the next time anyone requests it.
 *
 * Why a server: Google only accepts passes signed with the issuer's service-account
 * private key, which must never ship to the browser.
 *
 * Zero dependencies — Node 18+ (global fetch, crypto). Use it ONE of two ways
 * (see README.md):
 *   1. mount in the Node/Express backend — BEFORE any auth middleware, it's public:
 *        const { expressHandler } = require("./googleWallet");
 *        app.get("/api/v1/business-cards/public/:slug/google-wallet", expressHandler);
 *   2. AWS Lambda behind a Function URL:  handler = googleWallet.lambdaHandler
 *
 * Config (environment variables):
 *   GOOGLE_WALLET_ISSUER_ID         required — from the Google Pay & Wallet Console
 *   GOOGLE_WALLET_SERVICE_ACCOUNT   required — the service-account key: the JSON itself,
 *                                   or a path to the .json file
 *   GOOGLE_WALLET_CLASS_SUFFIX      optional, default "shivai_digital_card"
 *   API_BASE                        optional, default https://nodejs.service.callshivai.com/api/v1
 *   SITE_URL                        optional, default https://www.callshivai.com
 */

const crypto = require("crypto");
const fs = require("fs");

const WALLET_API = "https://walletobjects.googleapis.com/walletobjects/v1";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/wallet_object.issuer";
const SAVE_URL = "https://pay.google.com/gp/v/save/";

const API_BASE = (process.env.API_BASE || "https://nodejs.service.callshivai.com/api/v1").replace(/\/+$/, "");
const SITE_URL = (process.env.SITE_URL || "https://www.callshivai.com").replace(/\/+$/, "");
const CLASS_SUFFIX = process.env.GOOGLE_WALLET_CLASS_SUFFIX || "shivai_digital_card";
const DEFAULT_LOGO = `${SITE_URL}/Shivai1.png`;

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,98}[a-z0-9]$/;
const HEX_RE = /^#[0-9a-f]{6}$/i;

// ── helpers ──────────────────────────────────────────────────────────────────

class WalletError extends Error {
  constructor(message, status = 502, publicMessage = "Couldn't create the Google Wallet pass") {
    super(message);
    this.status = status;
    this.publicMessage = publicMessage;
  }
}

const b64url = (input) =>
  Buffer.from(input).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

function signJwt(payload, privateKey, keyId) {
  const header = { alg: "RS256", typ: "JWT", ...(keyId ? { kid: keyId } : {}) };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(privateKey);
  return `${unsigned}.${b64url(signature)}`;
}

let config = null;
function loadConfig() {
  if (config) return config;
  const issuerId = (process.env.GOOGLE_WALLET_ISSUER_ID || "").trim();
  const raw = (process.env.GOOGLE_WALLET_SERVICE_ACCOUNT || "").trim();
  if (!issuerId || !raw) {
    throw new WalletError("GOOGLE_WALLET_ISSUER_ID / GOOGLE_WALLET_SERVICE_ACCOUNT not set", 503, "Google Wallet isn't available yet");
  }
  const sa = JSON.parse(raw.startsWith("{") ? raw : fs.readFileSync(raw, "utf8"));
  if (!sa.client_email || !sa.private_key) throw new WalletError("Service account JSON lacks client_email/private_key", 503, "Google Wallet isn't available yet");
  config = { issuerId, sa, classId: `${issuerId}.${CLASS_SUFFIX}` };
  return config;
}

// OAuth access token for the Wallet REST API (service-account JWT bearer flow), cached ~1h.
let token = null;
async function accessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  if (token && token.exp - 120 > now) return token.value;
  const assertion = signJwt({ iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }, sa.private_key, sa.private_key_id);
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    signal: AbortSignal.timeout(8000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) throw new WalletError(`Google token error ${res.status}: ${json.error_description || json.error || ""}`);
  token = { value: json.access_token, exp: now + (json.expires_in || 3600) };
  return token.value;
}

async function walletApi(accessTok, method, path, body) {
  const res = await fetch(`${WALLET_API}${path}`, {
    method,
    headers: { authorization: `Bearer ${accessTok}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 404 && method === "GET") return null;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new WalletError(`Google Wallet API ${method} ${path} → ${res.status}: ${(json.error && json.error.message) || ""}`);
  return json;
}

// The class only needs creating once per process (it's shared by every card).
let classReady = false;
async function ensureClass(accessTok, classId) {
  if (classReady) return;
  const path = `/genericClass/${encodeURIComponent(classId)}`;
  if (!(await walletApi(accessTok, "GET", path))) await walletApi(accessTok, "POST", "/genericClass", { id: classId });
  classReady = true;
}

async function upsertObject(accessTok, object) {
  const path = `/genericObject/${encodeURIComponent(object.id)}`;
  return (await walletApi(accessTok, "GET", path))
    ? walletApi(accessTok, "PUT", path, object)
    : walletApi(accessTok, "POST", "/genericObject", object);
}

// ── card → pass ──────────────────────────────────────────────────────────────

const text = (value) => ({ defaultValue: { language: "en", value: String(value).slice(0, 100) } });
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

function buildObject(card, { issuerId, classId }) {
  const link = cardLink(card);
  const phone = fullPhone(card);
  // Object ids allow [A-Za-z0-9._-]; the card _id is stable across renames, the slug isn't.
  const key = String(card._id || card.slug).replace(/[^A-Za-z0-9._-]/g, "_");
  const uris = [{ id: "card", uri: link, description: "Open digital card" }];
  if (phone) uris.push({ id: "call", uri: `tel:${phone}`, description: `Call ${phone}` });
  if (card.email) uris.push({ id: "email", uri: `mailto:${card.email}`, description: card.email });
  if (card.website) uris.push({ id: "website", uri: href(card.website), description: host(card.website) });

  return {
    id: `${issuerId}.${key}`,
    classId,
    state: "ACTIVE",
    hexBackgroundColor: HEX_RE.test(card.color_code || "") ? card.color_code : "#161616",
    logo: {
      sourceUri: { uri: /^https:\/\//i.test(card.image_url || "") ? card.image_url : DEFAULT_LOGO },
      contentDescription: text(`Photo of ${card.full_name}`),
    },
    cardTitle: text(card.company_name || "Digital Business Card"),
    header: text(card.full_name || "Digital Business Card"),
    ...(card.job_title ? { subheader: text(card.job_title) } : {}),
    barcode: { type: "QR_CODE", value: link, alternateText: host(link) },
    ...(card.tagline ? { textModulesData: [{ id: "about", header: "About", body: String(card.tagline).slice(0, 500) }] } : {}),
    linksModuleData: { uris },
  };
}

async function fetchCard(slug) {
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

/** Creates/updates the card's Google Wallet pass and returns its "save" link. */
async function createSaveUrl(slug) {
  if (!SLUG_RE.test(slug)) throw new WalletError(`Invalid slug ${slug}`, 404, "Card not found");
  const cfg = loadConfig();
  const card = await fetchCard(slug);
  const accessTok = await accessToken(cfg.sa);
  await ensureClass(accessTok, cfg.classId);
  const object = buildObject(card, cfg);
  await upsertObject(accessTok, object);
  // "Skinny" JWT: just the object id — the pass itself already lives at Google, which keeps
  // the link short (save links get unreliable past ~2,000 characters).
  const now = Math.floor(Date.now() / 1000);
  const jwt = signJwt(
    { iss: cfg.sa.client_email, aud: "google", typ: "savetowallet", iat: now, origins: [SITE_URL], payload: { genericObjects: [{ id: object.id }] } },
    cfg.sa.private_key,
    cfg.sa.private_key_id,
  );
  return SAVE_URL + jwt;
}

// ── handlers ─────────────────────────────────────────────────────────────────

async function respond(slug) {
  try {
    return { status: 200, body: { success: true, data: { saveUrl: await createSaveUrl(String(slug || "").toLowerCase()) } } };
  } catch (e) {
    const err = e instanceof WalletError ? e : new WalletError(String((e && e.message) || e));
    console.error("[google-wallet]", err.message);
    return { status: err.status, body: { success: false, message: err.publicMessage } };
  }
}

/** Express / Connect:  app.get(".../:slug/google-wallet", expressHandler) */
async function expressHandler(req, res) {
  const { status, body } = await respond(req.params.slug);
  res.status(status).set("Cache-Control", "no-store").json(body);
}

/** AWS Lambda (Function URL / API Gateway): the slug is the last path segment. */
async function lambdaHandler(event) {
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || "";
  const allowed = /^https:\/\/([a-z0-9-]+\.)*callshivai\.com$/i.test(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin);
  const cors = allowed ? { "access-control-allow-origin": origin, vary: "Origin" } : {};
  if ((event.requestContext && event.requestContext.http && event.requestContext.http.method) === "OPTIONS") {
    return { statusCode: 204, headers: { ...cors, "access-control-allow-methods": "GET", "access-control-max-age": "86400" } };
  }
  const path = event.rawPath || event.path || "";
  const slug = path.split("/").filter(Boolean).filter((s) => s !== "google-wallet").pop();
  const { status, body } = await respond(slug);
  return { statusCode: status, headers: { ...cors, "content-type": "application/json", "cache-control": "no-store" }, body: JSON.stringify(body) };
}

module.exports = { createSaveUrl, expressHandler, lambdaHandler, handler: lambdaHandler, _buildObject: buildObject, _signJwt: signJwt };
