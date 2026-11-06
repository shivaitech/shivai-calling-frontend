// Installed marketplace apps, per tenant — /api/v1/skill-apps.
// The server resolves the tenant from the token; never send tenant_id.
// Needs an admin or tenant token (other roles get 403).
//
//   POST   /skill-apps        { app_id, agent_id? } → { skillApp }   (app_id = the global App catalog record's _id)
//   GET    /skill-apps                              → { skillApps }  (app_id populated: { _id, name, description, icon })
//   GET    /skill-apps/:id                          → { skillApp }   (:id = the installed record's _id)
//   DELETE /skill-apps/:id
//
// Errors: 401 token, 403 role, 404 catalog app / installed app / agent not found,
// 409 already installed (for this agent assignment), 422 bad body or id.

import axios from "axios";
import { BILLING_APP_ID } from "./billingAPI";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/skill-apps`;

/** The global App catalog record, as populated on installed apps. */
export interface CatalogApp {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface SkillApp {
  /** The installed record's id (what GET/DELETE /skill-apps/:id take). */
  _id: string;
  tenant_id: string;
  /** Populated catalog record (an id string if the server didn't populate it). */
  app_id: CatalogApp | string | null;
  agent_id: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Marketplace app id (src/marketplace/apps.ts) → the names its catalog record may carry. Matched
 * ignoring case, spaces and punctuation, so "Digital Business Card", "Business_Card" and
 * "business card" all mean digital-card.
 */
const APP_NAMES: Record<string, string[]> = {
  "digital-card": ["Digital Business Card", "Business_Card", "Business Card"],
  "website-builder": ["Website Builder", "Website_Builder"],
  "google-sheets": ["Google Sheets", "Google_Sheet", "Google Sheet"],
  "support-crm": ["Inquiry, Help & Support CRM", "Support_CRM", "Support CRM"],
  "lead-crm": ["Lead Management CRM", "Lead_Management", "Lead Management"],
  "appointment-crm": ["Appointment Scheduling CRM", "Appointment_CRM", "Appointment CRM"],
  "campaign-crm": ["Inbound & Outbound Campaign CRM", "Campaign_CRM", "Campaign CRM"],
  "healthcare-crm": ["Healthcare CRM", "Health_Care_CRM", "Health Care CRM"],
  "ai-receptionist": ["AI Receptionist", "AI_Receptionist"],
  "feedback-reviews": ["Feedback & Reviews", "Feedback_And_Reviews", "Feedback and Reviews"],
};

/** Marketplace apps the server can store. */
export const SERVER_APP_IDS = Object.keys(APP_NAMES);

/**
 * Catalog record ids, when known up front (from the App catalog in the admin panel).
 * Optional: ids are also learned from the installed-apps list (see rememberCatalogIds).
 */
const CATALOG_IDS: Partial<Record<string, string>> = {
  "digital-card": BILLING_APP_ID,
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const NAME_TO_APP_ID = new Map<string, string>();
for (const [id, names] of Object.entries(APP_NAMES)) for (const n of names) NAME_TO_APP_ID.set(norm(n), id);

/** Which marketplace app an installed record is, from its catalog record's name. */
export function marketplaceIdOf(s: SkillApp): string | null {
  const name = s.app_id && typeof s.app_id === "object" ? s.app_id.name : (s as unknown as { name?: string }).name;
  return name ? NAME_TO_APP_ID.get(norm(name)) ?? null : null;
}

// Catalog ids learned from the list, kept across visits (they're the same for every tenant).
const LEARNED_KEY = "shivai_app_catalog_ids";
function learned(): Record<string, string> {
  try {
    const v = JSON.parse(localStorage.getItem(LEARNED_KEY) || "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

/** Notes the catalog id of every installed app in a list, for installing it again later. */
export function rememberCatalogIds(list: SkillApp[]): void {
  const known = learned();
  let changed = false;
  for (const s of list) {
    const id = marketplaceIdOf(s);
    const catalogId = s.app_id && typeof s.app_id === "object" ? s.app_id._id : typeof s.app_id === "string" ? s.app_id : "";
    if (id && catalogId && known[id] !== catalogId) {
      known[id] = catalogId;
      changed = true;
    }
  }
  if (changed) {
    try {
      localStorage.setItem(LEARNED_KEY, JSON.stringify(known));
    } catch {
      /* storage unavailable */
    }
  }
}

/** The catalog _id to install a marketplace app with, or null when not known yet. */
export function catalogIdFor(appId: string): string | null {
  return CATALOG_IDS[appId] ?? learned()[appId] ?? null;
}

export class SkillAppsError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "SkillAppsError";
    this.status = status;
  }
}

const toError = (e: any) =>
  new SkillAppsError(e?.response?.data?.message || e?.message || "Request failed", e?.response?.status ?? 0);

function getAuthToken(): string | null {
  try {
    const stored = localStorage.getItem("auth_tokens");
    if (stored) {
      const { accessToken } = JSON.parse(stored);
      if (accessToken) return accessToken;
    }
  } catch {
    /* fall through */
  }
  return localStorage.getItem("authToken");
}

export const hasAuthToken = () => !!getAuthToken();

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
});

export const skillAppsAPI = {
  async list(): Promise<SkillApp[]> {
    try {
      const res = await axios.get(BASE, authHeaders());
      const list: SkillApp[] = res.data?.data?.skillApps ?? [];
      rememberCatalogIds(list);
      return list;
    } catch (e) {
      throw toError(e);
    }
  },

  async get(id: string): Promise<SkillApp> {
    try {
      const res = await axios.get(`${BASE}/${encodeURIComponent(id)}`, authHeaders());
      return res.data.data.skillApp;
    } catch (e) {
      throw toError(e);
    }
  },

  /** `catalogAppId` is the global App record's _id. 409 = already installed (for this agent assignment). */
  async install(catalogAppId: string, opts: { agent_id?: string | null } = {}): Promise<SkillApp> {
    try {
      const res = await axios.post(BASE, { app_id: catalogAppId, agent_id: opts.agent_id ?? null }, authHeaders());
      return res.data.data.skillApp;
    } catch (e) {
      throw toError(e);
    }
  },

  /** `id` is the installed record's _id from list/install, not the catalog app's id. */
  async uninstall(id: string): Promise<void> {
    try {
      await axios.delete(`${BASE}/${encodeURIComponent(id)}`, authHeaders());
    } catch (e) {
      throw toError(e);
    }
  },
};
