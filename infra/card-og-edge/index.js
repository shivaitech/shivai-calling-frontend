/**
 * Lambda@Edge (viewer-request) — link previews for /card/:slug and /digital-card
 *
 * WhatsApp, Facebook, LinkedIn, Slack, Telegram, X… build link previews by
 * fetching the URL and reading <meta property="og:*"> tags. They do NOT run
 * JavaScript, and the SPA's index.html has no per-card tags, so a shared card
 * shows only "www.callshivai.com". This function answers those crawlers with a
 * tiny HTML page carrying the card's name, role, tagline and profile photo.
 * Real visitors (any other User-Agent) pass straight through to the SPA.
 *
 * Deploy: see README.md (must be created in us-east-1, attached to the
 * CloudFront behavior for /card/* as a *viewer request*).
 */

const API_BASE = "https://nodejs.service.callshivai.com/api/v1";
const SITE = "https://www.callshivai.com";
const DEFAULT_IMAGE = `${SITE}/Shivai1.png`;

const BOT_RE =
  /whatsapp|facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|skypeuripreview|pinterest|redditbot|embedly|vkshare|iframely|google-structured-data|bingpreview|applebot|line-poker|signal/i;

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const header = (request, name) => (request.headers[name] && request.headers[name][0] && request.headers[name][0].value) || "";

function page(card, slug) {
  const url = `${SITE}/card/${slug}`;
  const role = [card.job_title, card.company_name].filter(Boolean).join(", ");
  // e.g. "Athar Cee — Founder & CEO, Acme Studio | Digital Business Card"
  const title = `${[card.full_name, role].filter(Boolean).join(" — ") || "Digital business card"} | Digital Business Card`;
  const firstName = String(card.full_name || "").trim().split(/\s+/)[0] || "them";
  const description = `${card.tagline ? card.tagline.replace(/[.\s]+$/, "") + ". " : ""}Tap to call, WhatsApp or email ${firstName}, or save the contact in one tap.`;
  const image = /^https:\/\//i.test(card.image_url || "") ? card.image_url : DEFAULT_IMAGE;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ShivAI">
<meta property="og:url" content="${esc(url)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:secure_url" content="${esc(image)}">
<meta property="og:image:alt" content="${esc(`Photo of ${card.full_name}`)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
</head><body><a href="${esc(url)}">${esc(title)}</a></body></html>`;
}

/** Static preview for the shareable app link /digital-card. */
function invitePage() {
  const url = `${SITE}/digital-card`;
  const title = "Create your free digital business card | ShivAI";
  const description = "Build a professional profile in minutes. Share one link or QR code — people can call, WhatsApp, email and save your contact in one tap.";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ShivAI">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${DEFAULT_IMAGE}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${DEFAULT_IMAGE}">
</head><body><a href="${url}">${esc(title)}</a></body></html>`;
}

const respond = (status, body, cache) => ({
  status: String(status),
  statusDescription: status === 200 ? "OK" : "Not Found",
  headers: {
    "content-type": [{ key: "Content-Type", value: "text/html; charset=utf-8" }],
    "cache-control": [{ key: "Cache-Control", value: cache }],
  },
  body,
});

exports.handler = async (event) => {
  const request = event.Records[0].cf.request;

  // Humans (and unknown agents) get the normal SPA.
  if (!BOT_RE.test(header(request, "user-agent"))) return request;

  if (/^\/digital-card\/?$/i.test(request.uri)) return respond(200, invitePage(), "public, max-age=3600");

  const m = /^\/card\/([a-z0-9][a-z0-9-]{1,98}[a-z0-9])\/?$/i.exec(request.uri);
  if (!m) return request;
  const slug = m[1].toLowerCase();

  try {
    const res = await fetch(`${API_BASE}/business-cards/public/${encodeURIComponent(slug)}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(2500), // viewer-request functions have a 5s hard limit
    });
    if (!res.ok) return request; // unknown card → let the SPA show "Card not found"
    const json = await res.json();
    if (!json || !json.data) return request;
    return respond(200, page(json.data, slug), "public, max-age=300");
  } catch (e) {
    return request; // API slow/down → fall back to the SPA rather than break the link
  }
};

exports._page = page; // exported for local testing
