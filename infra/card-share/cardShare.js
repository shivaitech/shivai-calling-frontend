/**
 * Card share route — link previews for business cards (WhatsApp, Facebook,
 * LinkedIn, Slack, Telegram, X…).
 *
 * Why: the website is a static SPA on AWS Amplify. Link-preview crawlers don't
 * run JavaScript, so a pasted card link shows no photo. This route sits on a
 * server and answers by who is asking:
 *
 *   crawler  → 200 + a tiny HTML page with og:title / og:description / og:image
 *              (the card's name, role, tagline and profile photo)
 *   a person → 302 redirect to the real card page on the website
 *
 * Share links look like  https://<share-host>/<slug>  (set VITE_CARD_SHARE_URL
 * in the frontend build). Zero dependencies; Node 14+.
 *
 * Use it ONE of two ways (see README.md):
 *   1. mount in the existing Node/Express backend:
 *        const { expressHandler } = require("./cardShare");
 *        app.get("/card-share/:slug", expressHandler);
 *   2. deploy as an AWS Lambda behind a Function URL:  handler = cardShare.lambdaHandler
 *
 * Config (environment variables, all optional):
 *   API_BASE         default https://nodejs.service.callshivai.com/api/v1
 *   SITE_URL         default https://www.callshivai.com
 *   CARD_SUBDOMAINS  "true" → redirect people to https://<slug>.callshivai.com
 */

const https = require("https");
const http = require("http");

const API_BASE = (process.env.API_BASE || "https://nodejs.service.callshivai.com/api/v1").replace(/\/+$/, "");
const SITE_URL = (process.env.SITE_URL || "https://www.callshivai.com").replace(/\/+$/, "");
const USE_SUBDOMAINS = process.env.CARD_SUBDOMAINS === "true";
const DEFAULT_IMAGE = `${SITE_URL}/Shivai1.png`;

const BOT_RE =
  /whatsapp|facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|skypeuripreview|pinterest|redditbot|embedly|vkshare|iframely|google-structured-data|bingpreview|applebot|line-poker|signal|viber|snapchat|mastodon|bluesky/i;

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,98}[a-z0-9]$/;

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Where a person should land: the card on the website (or its subdomain). */
function canonicalUrl(slug) {
  if (USE_SUBDOMAINS && slug.length <= 63) {
    const host = new URL(SITE_URL).hostname.replace(/^www\./, "");
    return `https://${slug}.${host}`;
  }
  return `${SITE_URL}/card/${slug}`;
}

function getJson(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https:") ? https : http;
    const req = lib.get(url, { headers: { accept: "application/json" }, timeout: timeoutMs }, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          /* not JSON */
        }
        resolve({ status: res.statusCode, json });
      });
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

function previewPage(card, url) {
  const role = [card.job_title, card.company_name].filter(Boolean).join(", ");
  const title = `${[card.full_name, role].filter(Boolean).join(" — ") || "Digital business card"} | Digital Business Card`;
  const firstName = String(card.full_name || "").trim().split(/\s+/)[0] || "them";
  const tagline = card.tagline ? String(card.tagline).replace(/[.\s]+$/, "") + ". " : "";
  const description = `${tagline}Tap to call, WhatsApp or email ${firstName}, or save the contact in one tap.`;
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

const html = (status, body, cache) => ({
  status,
  headers: { "content-type": "text/html; charset=utf-8", "cache-control": cache },
  body,
});

/** Core logic, framework-free. Returns { status, headers, body }. */
async function renderCardShare({ slug, userAgent }) {
  slug = String(slug || "").toLowerCase();
  if (!SLUG_RE.test(slug)) return html(404, "<!doctype html><title>Not found</title>Card not found", "public, max-age=60");

  const target = canonicalUrl(slug);
  const isBot = BOT_RE.test(userAgent || "");

  // People never need the API call — send them straight to the card.
  if (!isBot) return { status: 302, headers: { location: target, "cache-control": "no-store" }, body: "" };

  try {
    const { status, json } = await getJson(`${API_BASE}/business-cards/public/${encodeURIComponent(slug)}`, 4000);
    if (status === 404) return html(404, "<!doctype html><title>Card not found</title>Card not found", "public, max-age=60");
    if (status !== 200 || !json || !json.data) throw new Error(`api ${status}`);
    return html(200, previewPage(json.data, target), "public, max-age=300");
  } catch (e) {
    // API slow/down: still get the visitor to the card rather than a dead link.
    return { status: 302, headers: { location: target, "cache-control": "no-store" }, body: "" };
  }
}

/** Express / Connect:  app.get("/card-share/:slug", expressHandler) */
async function expressHandler(req, res) {
  const out = await renderCardShare({ slug: req.params.slug, userAgent: req.headers["user-agent"] });
  res.status(out.status);
  Object.keys(out.headers).forEach((k) => res.setHeader(k, out.headers[k]));
  res.send(out.body);
}

/** AWS Lambda Function URL / API Gateway (HTTP API v2). Slug = last path segment. */
async function lambdaHandler(event) {
  const path = (event && (event.rawPath || event.path)) || "/";
  const slug = path.split("/").filter(Boolean).pop() || "";
  const headers = (event && event.headers) || {};
  const ua = headers["user-agent"] || headers["User-Agent"] || "";
  const out = await renderCardShare({ slug, userAgent: ua });
  return { statusCode: out.status, headers: out.headers, body: out.body };
}

module.exports = { renderCardShare, expressHandler, lambdaHandler, handler: lambdaHandler };
