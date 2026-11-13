// Google Analytics loads only after the visitor switches analytics on, and stops when they switch
// it off (DPDP s.6: consent before processing, withdrawable at any time). Nothing from Google is
// fetched before that: no script, no cookie, no cookieless ping.

import { CONSENT_EVENT, getConsent } from "./consent";

const GA_ID = import.meta.env.VITE_GA_ID || "G-0JYFR682FN";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let loaded = false;

// gtag.js reads the `arguments` object, not an array.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function gtag(..._args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

function load() {
  if (loaded) {
    gtag("consent", "update", { analytics_storage: "granted" });
    return;
  }
  loaded = true;
  window.gtag = gtag;
  gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  gtag("js", new Date());
  gtag("config", GA_ID, { anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
}

/** Drop GA's cookies on this domain and its parent (".callshivai.com"). */
function clearGaCookies() {
  const host = location.hostname;
  const parts = host.split(".");
  const domains = ["", host, parts.length > 1 ? `.${parts.slice(-2).join(".")}` : ""];
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0]?.trim();
    if (!name || !/^(_ga|_gid|_gat)/.test(name)) continue;
    for (const d of domains) document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ""}`;
  }
}

function apply() {
  if (getConsent("analytics")) return load();
  if (loaded) gtag("consent", "update", { analytics_storage: "denied" });
  (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = true;
  clearGaCookies();
}

/** Call once at start-up: applies the stored choice and follows every later change. */
export function startConsentedAnalytics() {
  apply();
  window.addEventListener(CONSENT_EVENT, () => {
    if (getConsent("analytics")) (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = false;
    apply();
  });
}
