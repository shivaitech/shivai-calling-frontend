// Digital card Monitoring (analytics) + Affiliate (ShivAI Points) data.
//
// The backend doesn't serve these yet. Each call tries the real endpoint; a 404
// (route not deployed) returns clearly-flagged SAMPLE data (`live: false`) so the
// dashboards can be reviewed. Anything else (401, 5xx, network) is a real error.
// Once the endpoints return the shapes below, live data shows with no frontend change.
//
//   GET /business-cards/:id/analytics?range=7d|30d|90d|all   → { data: CardAnalytics }
//   GET /me/loyalty/summary                                   → { data: LoyaltySummary }
//   GET /me/loyalty/activity?limit=20                         → { data: { activity: LoyaltyActivity[] } }
//   GET /me/loyalty/rewards                                   → { data: { rewards: LoyaltyReward[] } }

import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL;

export type Range = "7d" | "30d" | "90d" | "all";

export interface CardAnalytics {
  range: Range;
  totals: { views: number; uniqueVisitors: number; qrScans: number; contactSaves: number; shares: number };
  /** Same totals for the previous equal-length period (omit for "all"). */
  previous?: CardAnalytics["totals"];
  /** One point per day (or per week for long ranges), oldest first. ISO dates. */
  series: { date: string; views: number }[];
  /** Button taps on the card. */
  actions: { call: number; whatsapp: number; email: number; askMyAi: number; linkedin: number; saveContact: number; links: number };
  /** Where views came from. */
  sources: { qr: number; direct: number; whatsapp: number; social: number; other: number };
}

export interface LoyaltySummary {
  totals: { views: number; shares: number; cardsCreated: number; paidReferrals: number };
  points: { available: number; pending: number; lifetime: number; redeemed: number };
  funnel: { views: number; referralClicks: number; newCards: number; paidSubscriptions: number };
}

export interface LoyaltyActivity {
  id: string;
  date: string;
  kind: "referral_signup" | "referral_paid" | "views_bonus" | "shares_bonus" | "redeemed" | "reversed";
  status: "pending" | "available" | "redeemed" | "reversed";
  /** Plan category only — never the referred person's details. */
  plan?: "Essential" | "Signature" | "Prestige";
  billing?: "monthly" | "annual";
  points: number;
}

export interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  available: boolean;
}

export interface Result<T> {
  data: T;
  /** false = sample data because the endpoint isn't deployed yet. */
  live: boolean;
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

async function getOrSample<T>(path: string, sample: () => T): Promise<Result<T>> {
  try {
    const res = await axios.get(`${API}${path}`, { headers: { Authorization: `Bearer ${token()}` } });
    return { data: res.data?.data as T, live: true };
  } catch (e: any) {
    if (e?.response?.status === 404) return { data: sample(), live: false };
    throw new Error(e?.response?.data?.message || e?.message || "Couldn't load this data");
  }
}

// ── sample data (deterministic, so a card/range always shows the same preview) ──

function rng(seedText: string) {
  let s = [...seedText].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

const RANGE_DAYS: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90, all: 180 };

function sampleAnalytics(cardId: string, range: Range): CardAnalytics {
  const r = rng(`${cardId}:${range}`);
  const days = RANGE_DAYS[range];
  const step = days > 60 ? 7 : 1; // weekly buckets for long ranges
  const series: CardAnalytics["series"] = [];
  const now = Date.now();
  for (let d = days - step; d >= 0; d -= step) {
    const base = 6 + Math.sin((days - d) / 5) * 3 + r() * 9;
    series.push({ date: new Date(now - d * 864e5).toISOString().slice(0, 10), views: Math.round(base * step) });
  }
  const views = series.reduce((a, p) => a + p.views, 0);
  const totals = {
    views,
    uniqueVisitors: Math.round(views * (0.62 + r() * 0.1)),
    qrScans: Math.round(views * (0.28 + r() * 0.08)),
    contactSaves: Math.round(views * (0.09 + r() * 0.04)),
    shares: Math.round(views * (0.06 + r() * 0.03)),
  };
  const scale = (f: number) => Math.round(views * f * (0.8 + r() * 0.4));
  return {
    range,
    totals,
    previous:
      range === "all"
        ? undefined
        : {
            views: Math.round(views * (0.7 + r() * 0.4)),
            uniqueVisitors: Math.round(totals.uniqueVisitors * (0.7 + r() * 0.4)),
            qrScans: Math.round(totals.qrScans * (0.7 + r() * 0.4)),
            contactSaves: Math.round(totals.contactSaves * (0.7 + r() * 0.4)),
            shares: Math.round(totals.shares * (0.7 + r() * 0.4)),
          },
    series,
    actions: {
      call: scale(0.12),
      whatsapp: scale(0.18),
      email: scale(0.05),
      askMyAi: scale(0.07),
      linkedin: scale(0.04),
      saveContact: totals.contactSaves,
      links: scale(0.1),
    },
    sources: { qr: totals.qrScans, direct: scale(0.3), whatsapp: scale(0.22), social: scale(0.1), other: scale(0.05) },
  };
}

const SAMPLE_SUMMARY: LoyaltySummary = {
  totals: { views: 1284, shares: 96, cardsCreated: 7, paidReferrals: 3 },
  points: { available: 640, pending: 400, lifetime: 1240, redeemed: 200 },
  funnel: { views: 1284, referralClicks: 41, newCards: 7, paidSubscriptions: 3 },
};

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString();
const SAMPLE_ACTIVITY: LoyaltyActivity[] = [
  { id: "a1", date: daysAgo(1), kind: "referral_paid", status: "pending", plan: "Signature", billing: "annual", points: 400 },
  { id: "a2", date: daysAgo(3), kind: "referral_signup", status: "available", points: 0 },
  { id: "a3", date: daysAgo(6), kind: "shares_bonus", status: "available", points: 24 },
  { id: "a4", date: daysAgo(9), kind: "referral_paid", status: "available", plan: "Essential", billing: "monthly", points: 100 },
  { id: "a5", date: daysAgo(14), kind: "views_bonus", status: "available", points: 116 },
  { id: "a6", date: daysAgo(21), kind: "redeemed", status: "redeemed", points: -200 },
  { id: "a7", date: daysAgo(30), kind: "referral_paid", status: "available", plan: "Essential", billing: "annual", points: 200 },
];

const SAMPLE_REWARDS: LoyaltyReward[] = [
  { id: "credit-5", title: "$5 off your next bill", description: "Applied to your next subscription payment.", pointsCost: 500, available: true },
  { id: "upgrade-signature-1m", title: "1 month of Signature", description: "Try the AI Business Manager for a month.", pointsCost: 1000, available: true },
  { id: "upgrade-prestige-1m", title: "1 month of Prestige", description: "Gold identity, both AI managers, for a month.", pointsCost: 2500, available: true },
  { id: "ai-calls-100", title: "+100 AI calls", description: "Top up your AI managers.", pointsCost: 300, available: false },
];

// ── API ──────────────────────────────────────────────────────────────────────

export const cardInsightsAPI = {
  analytics: (cardId: string, range: Range) =>
    getOrSample(`/business-cards/${encodeURIComponent(cardId)}/analytics?range=${range}`, () => sampleAnalytics(cardId, range)),
  loyaltySummary: () => getOrSample("/me/loyalty/summary", () => SAMPLE_SUMMARY),
  loyaltyActivity: () =>
    getOrSample("/me/loyalty/activity?limit=20", () => ({ activity: SAMPLE_ACTIVITY })).then((r) => ({ ...r, data: r.data.activity ?? [] })),
  loyaltyRewards: () =>
    getOrSample("/me/loyalty/rewards", () => ({ rewards: SAMPLE_REWARDS })).then((r) => ({ ...r, data: r.data.rewards ?? [] })),
};
