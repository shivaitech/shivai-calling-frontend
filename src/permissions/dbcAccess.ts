import { useAuth } from "../contexts/AuthContext";
import { usePaidPlan } from "../ClientDashboard/Billing/planLimit";
import { APPS } from "../marketplace/apps";

/**
 * Digital Business Card accounts. Someone who signs up from the card pages (marketing site,
 * card creator) is tagged userBase: "DBC" and gets the card app only, not the ShivAI platform:
 *   · always open: the Digital Card app, Billing, Settings, the Dashboard (a tour of ShivAI's
 *     modules, see DbcPlatformHome), Skills and Features (only the card
 *     app can be installed there; other apps show locked) and the card's marketplace page;
 *   · AI Employees, Training and Analytics: open on Signature / Prestige (an AI agent for their
 *     card and its calls), an upgrade prompt on Essential;
 *   · everything else: locked, with a "Request ShivAI Platform access" button.
 * Once the team approves a request, the account has platformAccess and none of this applies.
 */

export const USER_BASE_DBC = "DBC";
export const DBC_HOME = "/app/digital-card?section=cards";
/** The one marketplace app a card-only account can install. */
export const DBC_APP_ID = "digital-card";

export const isDbcUser = (u: { userBase?: string | null; platformAccess?: boolean } | null | undefined): boolean =>
  !!u && String(u.userBase ?? "").toUpperCase() === USER_BASE_DBC && !u.platformAccess;

const OPEN = ["/app/digital-card", "/billing", "/settings", `/marketplace/${DBC_APP_ID}`];
/** Open as a page but not below it: /marketplace/zoho stays locked. */
const OPEN_EXACT = ["/dashboard", "/marketplace"];
const PAID_PLAN_ONLY = ["/agents", "/training", "/analytics"];
const under = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

/** null = open; "upgrade" = needs Signature / Prestige; "platform" = needs platform access. */
export type DbcLock = "platform" | "upgrade" | null;

export function dbcLockFor(path: string, paidPlan: boolean): DbcLock {
  if (OPEN_EXACT.includes(path.replace(/\/+$/, "")) || OPEN.some((p) => under(path, p))) return null;
  if (PAID_PLAN_ONLY.some((p) => under(path, p))) return paidPlan ? null : "upgrade";
  return "platform";
}

const MODULE_NAMES: [string, string][] = [
  ["/dashboard", "Dashboard"],
  ["/agents", "AI Employees"],
  ["/training", "Training"],
  ["/call-setup", "Call Setup"],
  ["/campaigns", "Campaigns"],
  ["/contacts", "Contacts"],
  ["/command-center", "Command Center"],
  ["/staff", "Departments & Staff"],
  ["/workflows", "Workflows"],
  ["/marketplace", "Skills and Features"],
  ["/analytics", "Analytics & Call History"],
  ["/monitoring", "Monitoring & Reports"],
  ["/sub-tenants", "Sub Tenants"],
  ["/google-sheets", "Google Sheets"],
  ["/google-calendar", "Google Calendar"],
  ["/zoho", "Zoho"],
];

/** "Workflows" for /workflows#canvas… */
export const dbcModuleName = (path: string) => {
  // /marketplace/zoho → "Zoho CRM"
  const appId = path.match(/^\/marketplace\/([^/]+)/)?.[1];
  const app = appId ? APPS.find((a) => a.id === appId) : undefined;
  return app?.name ?? MODULE_NAMES.find(([p]) => under(path, p))?.[1] ?? "This page";
};

/** The signed-in account's card-only access. Fetches the plan only for DBC accounts. */
export function useDbcAccess() {
  const { user } = useAuth();
  const isDbc = isDbcUser(user);
  // Only a plan really paid for opens the Signature / Prestige pages; picked but unpaid = Essential.
  const paid = usePaidPlan(isDbc);
  const planKey = paid.plan;
  const paidPlan = planKey === "signature" || planKey === "prestige";
  return {
    isDbc,
    /** The plan is known (only matters for the Signature / Prestige pages). */
    ready: !isDbc || paid.loaded,
    paidPlan,
    lockFor: (path: string): DbcLock => (isDbc ? dbcLockFor(path, paidPlan) : null),
  };
}
