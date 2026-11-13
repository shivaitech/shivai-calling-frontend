// Consent ledger: every consent someone gives or withdraws, kept as a dated, versioned record.
//
// DPDP Act s.6: consent must be free, specific, informed, unconditional and unambiguous, given by
// a clear affirmative action (never a pre-ticked box), and as easy to withdraw as to give. s.6(10):
// the Data Fiduciary must be able to prove the consent and the notice it was given against.
//
// Each change is kept on this device and sent to the server (POST /privacy/consents). A record that
// can't be sent yet stays queued and goes with the next sync, so nothing is lost offline or before
// sign-in (a visitor's cookie choice, the sign-up consent given before the account exists).

import axios from "axios";
import { POLICY_VERSION } from "./company";

/** Optional purposes a person can switch on or off at any time. */
export type OptionalPurpose = "analytics" | "marketing" | "improvement";
/** Purposes recorded when an account is created (needed to run the service). */
export type RequiredPurpose = "terms" | "privacy" | "age";
export type Purpose = OptionalPurpose | RequiredPurpose;

export const OPTIONAL_PURPOSES: { id: OptionalPurpose; title: string; body: string }[] = [
  {
    id: "analytics",
    title: "Analytics cookies",
    body: "Google Analytics measures which pages are visited so we can improve the site. Off unless you switch it on.",
  },
  {
    id: "marketing",
    title: "Product news and offers",
    body: "Occasional emails or WhatsApp messages about new features and offers. Service messages (billing, security) are sent either way.",
  },
  {
    id: "improvement",
    title: "Help improve ShivAI",
    body: "Use de-identified usage data to improve our features. Your call recordings and contacts are never used to train shared AI models.",
  },
];

export interface ConsentEvent {
  purpose: Purpose;
  granted: boolean;
  /** ISO time the person acted. */
  at: string;
  /** The policy version shown when they acted. */
  version: string;
  /** Where it happened: "cookie-banner", "signup", "privacy-center", … */
  source: string;
}

interface Store {
  /** The person has made a cookie choice (the banner stays away until the policy version changes). */
  decidedVersion: string | null;
  state: Partial<Record<Purpose, boolean>>;
  log: ConsentEvent[];
  /** Not yet accepted by the server. */
  queue: ConsentEvent[];
}

const KEY = "shivai_consent_v1";
export const CONSENT_EVENT = "shivai:consent";
const API = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

const empty = (): Store => ({ decidedVersion: null, state: {}, log: [], queue: [] });

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const s = JSON.parse(raw);
    return { ...empty(), ...s };
  } catch {
    return empty();
  }
}

function write(s: Store) {
  try {
    // Keep the device copy small; the server holds the full history.
    localStorage.setItem(KEY, JSON.stringify({ ...s, log: s.log.slice(-100), queue: s.queue.slice(-200) }));
  } catch {
    /* storage blocked: the in-memory choice still applies for this page */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT));
}

export const getConsent = (purpose: Purpose): boolean => read().state[purpose] === true;
export const consentState = () => read().state;
export const consentLog = () => read().log;
/** The cookie banner needs an answer (never chosen, or the policy changed since). */
export const needsCookieChoice = () => read().decidedVersion !== POLICY_VERSION;

/** Record one or more choices. Only changes are logged. */
export function setConsent(changes: Partial<Record<Purpose, boolean>>, source: string, opts: { decided?: boolean } = {}) {
  const s = read();
  const at = new Date().toISOString();
  for (const [purpose, granted] of Object.entries(changes) as [Purpose, boolean][]) {
    if (s.state[purpose] === granted && s.log.some((e) => e.purpose === purpose && e.version === POLICY_VERSION)) continue;
    const ev: ConsentEvent = { purpose, granted, at, version: POLICY_VERSION, source };
    s.state[purpose] = granted;
    s.log.push(ev);
    s.queue.push(ev);
  }
  if (opts.decided) s.decidedVersion = POLICY_VERSION;
  write(s);
  void syncConsent();
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

let syncing = false;
/** Send queued consent records once signed in. Safe to call any time. */
export async function syncConsent(): Promise<void> {
  const t = token();
  if (!t || syncing) return;
  const s = read();
  if (!s.queue.length) return;
  syncing = true;
  const batch = s.queue.slice();
  try {
    await axios.post(
      `${API}/privacy/consents`,
      { events: batch, user_agent: navigator.userAgent },
      { headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, timeout: 10000 },
    );
    const now = read();
    now.queue = now.queue.filter((e) => !batch.some((b) => b.at === e.at && b.purpose === e.purpose));
    write(now);
  } catch {
    /* kept in the queue; retried on the next change or sign-in */
  } finally {
    syncing = false;
  }
}

export const OPEN_COOKIE_SETTINGS = "shivai:open-cookie-settings";
/** Re-open the cookie choices (footer link, Privacy Center). */
export const openCookieSettings = () => window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS));

/** Sign-up: the person ticked the box. Recorded before the account exists, sent once it does. */
export function recordSignupConsent(marketing: boolean) {
  setConsent({ terms: true, privacy: true, age: true, marketing }, "signup");
}
