import { useEffect, useState } from "react";
import { cardBillingAPI, type LimitResource, type LimitsData, type ResourceLimit } from "../../services/billingAPI";

/**
 * Plan limits — how many business cards and AI agents an account may create.
 *
 * Screens with a Create button read GET /billing/limits (usePlanLimits) and disable or redirect the
 * button before a form is filled in. The create calls themselves can still be refused (two tabs, a
 * stale page): 403 with errors[0].code === "PLAN_LIMIT_REACHED", from the Node API (business cards)
 * or the Python API (agents). handlePlanLimit() turns that into the upgrade dialog.
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
  const message =
    r.limit === 0
      ? `${plan} does not include ${many}. Upgrade your plan to add ${many}.`
      : `${plan} allows ${r.limit} ${r.limit === 1 ? one : many} and you already have ${r.used}. Upgrade your plan to add more.`;
  showPlanLimit({ message, resource, limit: r.limit, used: r.used, plan: planName });
}

// ── GET /billing/limits, shared and refreshed after creates ────────────────────
let cached: Promise<LimitsData | null> | null = null;

function fetchLimits(): Promise<LimitsData | null> {
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

export function usePlanLimits() {
  const [data, setData] = useState<LimitsData | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
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
  }, []);
  return {
    loaded,
    data,
    planName: data?.plan?.name,
    cards: limitOf(data, "business_cards"),
    agents: limitOf(data, "ai_agents"),
  };
}
