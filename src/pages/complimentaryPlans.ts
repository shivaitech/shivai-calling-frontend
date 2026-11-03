import type { CardPlan } from "../services/businessCardAPI";

/**
 * Accounts given a card plan free: no checkout anywhere, the editor and creator start on that
 * plan's look, and saving a card sends the plan (Prestige accounts may pick Signature instead).
 * Lower-case emails. Front-end only: the server still decides what a public card shows.
 */
const COMPLIMENTARY: Record<string, CardPlan> = {
  "rs@shivaitech.com": "prestige",
};

export const complimentaryPlan = (email?: string | null): CardPlan | null => COMPLIMENTARY[(email || "").trim().toLowerCase()] ?? null;

/** The plan to save for a complimentary account: the look they picked, if their plan includes it. */
export function complimentarySavePlan(comp: CardPlan | null, picked?: string | null): CardPlan | undefined {
  if (!comp) return undefined;
  if (comp === "prestige" && picked === "signature") return "signature";
  return comp;
}
