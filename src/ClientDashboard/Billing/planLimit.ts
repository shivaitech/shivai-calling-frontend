import { useEffect, useState } from "react";
import { cardBillingAPI, isPaying, type LimitResource, type LimitsData, type ResourceLimit } from "../../services/billingAPI";

/**
 * Digital Card plan limits — how many business cards an account may create, and on how many of
 * them an AI agent may be connected ("ai_agents"). These are app-only: they never limit creating
 * AI agents anywhere else in the dashboard.
 *
 * Digital Card screens read GET /billing/limits (usePlanLimits) and redirect Create / Connect to the
 * upgrade dialog before a form is filled in. The card save itself can still be refused (two tabs, a
 * stale page): 403 with errors[0].code === "PLAN_LIMIT_REACHED". handlePlanLimit() turns that into
 * the upgrade dialog.
 */

export interface PlanLimitHit {
  /** Ready to show as it is, e.g. "The Essential plan allows 1 business card and you already have 1. …" */
  message: string;
  resource: LimitResource | null;
  limit?: number | null;
  used?: number;
  plan?: string;
}

const RESOURCE_NAMES: Record<LimitResource, [one: string, many: string]> = {
  business_cards: ["business card", "business cards"],
  ai_agents: ["AI agent", "AI agents"],
};

/** The refusal in an error from axios (err.response) or from our API wrappers (err.planLimit), else null. */
export function planLimitFrom(err: unknown): PlanLimitHit | null {
  const e = err as { planLimit?: PlanLimitHit; status?: number; response?: { status?: number; data?: any } } | null;
  if (!e) return null;
  if (e.planLimit) return e.planLimit;
  const status = e.response?.status ?? e.status;
  const body = e.response?.data;
  const first = Array.isArray(body?.errors) ? body.errors[0] : null;
  if (status !== 403 || first?.code !== "PLAN_LIMIT_REACHED") return null;
  return {
    message: body?.message || "Your plan's limit is reached. Upgrade your plan to add more.",
    resource: first.resource === "business_cards" || first.resource === "ai_agents" ? first.resource : null,
    limit: first.limit ?? null,
    used: first.used,
    plan: first.plan,
  };
}

const DIALOG_EVENT = "shivai:plan-limit";
const LIMITS_EVENT = "shivai:plan-limits-changed";

/** Opens the upgrade dialog (PlanLimitDialog, mounted once in the app). */
export function showPlanLimit(hit: PlanLimitHit): void {
  window.dispatchEvent(new CustomEvent<PlanLimitHit>(DIALOG_EVENT, { detail: hit }));
}

export function onPlanLimit(handler: (hit: PlanLimitHit) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<PlanLimitHit>).detail);
  window.addEventListener(DIALOG_EVENT, listener);
  return () => window.removeEventListener(DIALOG_EVENT, listener);
}

/** If `err` is a plan-limit refusal: open the upgrade dialog, refresh the counts, and return true. */
export function handlePlanLimit(err: unknown): boolean {
  const hit = planLimitFrom(err);
  if (!hit) return false;
  showPlanLimit(hit);
  refreshPlanLimits();
  return true;
}

/** The dialog for a Create button that's already over the limit (no request needed). */
export function showLimitFor(resource: LimitResource, r: ResourceLimit, planName?: string): void {
  const [one, many] = RESOURCE_NAMES[resource];
  const plan = planName ? `The ${planName} plan` : "Your plan";
  const upgradeTo = /prestige/i.test(planName ?? "") ? "" : /signature/i.test(planName ?? "") ? "Prestige" : "Signature or Prestige";
  if (resource === "business_cards" && r.limit && upgradeTo) {
    // e.g. "Your Essential plan includes one card. Upgrade to Signature or Prestige to create more cards."
    const count = r.limit === 1 ? "one card" : `${r.limit} cards`;
    return showPlanLimit({
      message: `Your ${planName ?? "current"} plan includes ${count}. Upgrade to ${upgradeTo} to create more cards.`,
      resource,
      limit: r.limit,
      used: r.used,
      plan: planName,
    });
  }
  if (resource === "ai_agents") {
    // Digital Card only: the limit is how many cards may have an AI agent connected.
    const message =
      r.limit === 0
        ? `${plan} doesn't include an AI Manager on business cards. Upgrade${upgradeTo ? ` to ${upgradeTo}` : ""} to connect an AI agent to your card.`
        : `${plan} lets you connect an AI agent to ${r.limit} ${r.limit === 1 ? "card" : "cards"}, and ${r.used} already ${r.used === 1 ? "has" : "have"} one.${upgradeTo ? ` Upgrade to ${upgradeTo} to add AI to more cards.` : ""}`;
    return showPlanLimit({ message, resource, limit: r.limit, used: r.used, plan: planName });
  }
  const message =
    r.limit === 0
      ? `${plan} does not include ${many}. Upgrade your plan to add ${many}.`
      : `${plan} allows ${r.limit} ${r.limit === 1 ? one : many} and you already have ${r.used}. Upgrade your plan to add more.`;
  showPlanLimit({ message, resource, limit: r.limit, used: r.used, plan: planName });
}

// ── GET /billing/limits, shared and refreshed after creates ────────────────────
let cached: Promise<LimitsData | null> | null = null;
// The account the cache belongs to: signing in as someone else must not reuse their limits.
let cachedFor: string | null = null;

function fetchLimits(): Promise<LimitsData | null> {
  const who = localStorage.getItem("auth_tokens");
  if (who !== cachedFor) {
    cached = null;
    cachedFor = who;
  }
  if (!cached) cached = cardBillingAPI.limits().catch(() => null); // 403 "No tenant", offline… → don't gate
  return cached;
}

/** Re-reads the limits (call after a create or delete). */
export function refreshPlanLimits(): void {
  cached = null;
  window.dispatchEvent(new Event(LIMITS_EVENT));
}

/** One resource's limit, or null when it isn't limited (unknown, admin, limits switched off, unlimited). */
export function limitOf(data: LimitsData | null, resource: LimitResource): ResourceLimit | null {
  if (!data || !data.enforced) return null;
  const r = data.resources?.[resource];
  return r && r.limit !== null ? r : null;
}

/** "1 of 2 used" · "Not in your plan" · "" (unlimited). */
export function limitLabel(r: ResourceLimit | null): string {
  if (!r || r.limit === null) return "";
  if (r.limit === 0) return "Not in your plan";
  return `${r.used} of ${r.limit} used`;
}

// The plan the account has really paid for (a Stripe subscription), cached like the limits.
let paidCached: Promise<string | null> | null = null;
let paidFor: string | null = null;
function fetchPaidPlan(): Promise<string | null> {
  const who = localStorage.getItem("auth_tokens");
  if (who !== paidFor) {
    paidCached = null;
    paidFor = who;
  }
  if (!paidCached) paidCached = cardBillingAPI.overview().then((o) => (isPaying(o) ? o.plan!.key : null), () => null);
  return paidCached;
}

/**
 * "signature" / "prestige" once paid for, otherwise null (= Essential). Never a plan picked but
 * not paid for, whatever the server's plan field says. Re-read with refreshPlanLimits().
 */
export function usePaidPlan(enabled = true) {
  const [plan, setPlan] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    const load = () =>
      void fetchPaidPlan().then((p) => {
        if (!live) return;
        setPlan(p);
        setLoaded(true);
      });
    load();
    const reload = () => {
      paidCached = null;
      load();
    };
    window.addEventListener(LIMITS_EVENT, reload);
    return () => {
      live = false;
      window.removeEventListener(LIMITS_EVENT, reload);
    };
  }, [enabled]);
  return { plan, loaded };
}

/** `enabled` false: no request (for hooks that only need limits for some accounts). */
export function usePlanLimits(enabled = true) {
  const [data, setData] = useState<LimitsData | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    const load = () =>
      void fetchLimits().then((d) => {
        if (!live) return;
        setData(d);
        setLoaded(true);
      });
    load();
    window.addEventListener(LIMITS_EVENT, load);
    return () => {
      live = false;
      window.removeEventListener(LIMITS_EVENT, load);
    };
  }, [enabled]);
  return {
    loaded,
    data,
    planName: data?.plan?.name,
    cards: limitOf(data, "business_cards"),
    agents: limitOf(data, "ai_agents"),
  };
}
