import type { Billing, PlanId } from "../../pages/digitalCardPricing";

/**
 * A paid card plan the visitor chose (marketing page → card creator) but hasn't paid for yet.
 * Saved when their card is created, so Billing can ask them to finish — and so can the Digital
 * Card app on a later visit (after logging in again, a closed Stripe tab…). Cleared once the
 * plan is active, or when they say they don't want it.
 */
export interface PendingPlan {
  plan: Exclude<PlanId, "essential">;
  billing: Billing;
  /** When it was chosen (ms). Reminders stop after PENDING_DAYS. */
  at: number;
}

const KEY = "shivai-card-pending-plan";
const PENDING_DAYS = 30;

export function savePendingPlan(plan: PlanId, billing: Billing): void {
  if (plan !== "signature" && plan !== "prestige") return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ plan, billing, at: Date.now() } satisfies PendingPlan));
  } catch {
    /* storage blocked — Billing still opens with the plan from the URL */
  }
}

export function loadPendingPlan(): PendingPlan | null {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || "null") as PendingPlan | null;
    if (!p || (p.plan !== "signature" && p.plan !== "prestige")) return null;
    if (Date.now() - (p.at || 0) > PENDING_DAYS * 864e5) {
      localStorage.removeItem(KEY);
      return null;
    }
    return { plan: p.plan, billing: p.billing === "monthly" ? "monthly" : "annual", at: p.at };
  } catch {
    return null;
  }
}

export function clearPendingPlan(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Billing, opened on the card's plans with the pending plan ready to pay. */
export const pendingPlanHref = (p: Pick<PendingPlan, "plan" | "billing">) =>
  `/billing?${new URLSearchParams({ view: "apps", app: "digital-card", plan: p.plan, billing: p.billing, pay: "1" })}`;
