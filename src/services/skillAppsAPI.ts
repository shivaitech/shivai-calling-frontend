// Installed marketplace apps, per tenant — /api/v1/skill-apps.
// The server resolves the tenant from the token; never send tenant_id.
// Needs an admin or tenant token (other roles get 403).

import axios from "axios";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/skill-apps`;

export type SkillAppName =
  | "Business_Card"
  | "Website_Builder"
  | "Google_Sheet"
  | "Support_CRM"
  | "Lead_Management"
  | "Appointment_CRM"
  | "Campaign_CRM"
  | "Health_Care_CRM"
  | "AI_Receptionist"
  | "Feedback_And_Reviews";

export interface SkillApp {
  _id: string;
  tenant_id: string;
  name: SkillAppName;
  description: string;
  agent_id: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Marketplace app id (src/marketplace/apps.ts) ↔ the API's app name. */
export const APP_ID_TO_SKILL_NAME: Record<string, SkillAppName> = {
  "digital-card": "Business_Card",
  "website-builder": "Website_Builder",
  "google-sheets": "Google_Sheet",
  "support-crm": "Support_CRM",
  "lead-crm": "Lead_Management",
  "appointment-crm": "Appointment_CRM",
  "campaign-crm": "Campaign_CRM",
  "healthcare-crm": "Health_Care_CRM",
  "ai-receptionist": "AI_Receptionist",
  "feedback-reviews": "Feedback_And_Reviews",
};

export const SKILL_NAME_TO_APP_ID = Object.fromEntries(
  Object.entries(APP_ID_TO_SKILL_NAME).map(([id, name]) => [name, id]),
) as Record<SkillAppName, string>;

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
      return res.data?.data?.skillApps ?? [];
    } catch (e) {
      throw toError(e);
    }
  },

  /** 409 = already installed for this tenant (and agent association). */
  async install(name: SkillAppName, opts: { description?: string; agent_id?: string } = {}): Promise<SkillApp> {
    try {
      const body = { name, ...(opts.description ? { description: opts.description } : {}), ...(opts.agent_id ? { agent_id: opts.agent_id } : {}) };
      const res = await axios.post(BASE, body, authHeaders());
      return res.data.data.skillApp;
    } catch (e) {
      throw toError(e);
    }
  },

  /** `id` is the document _id from list/install, not the app name. */
  async uninstall(id: string): Promise<void> {
    try {
      await axios.delete(`${BASE}/${encodeURIComponent(id)}`, authHeaders());
    } catch (e) {
      throw toError(e);
    }
  },
};
