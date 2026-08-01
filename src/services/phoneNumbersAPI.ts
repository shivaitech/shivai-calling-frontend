import axios, { AxiosResponse } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Campaign dialer (start/pause) lives on the phone-service, not the main backend.
// Mirror the staging/prod split used by agentAPI's voiceApiClient.
const _isStaging = import.meta.env.VITE_API_BASE_URL?.includes("staging");
const PHONE_SERVICE_URL = _isStaging
  ? "https://staging.voice.callshivai.com/phone"
  : "https://voice.callshivai.com/phone";

// Get the access token from localStorage. The app stores tokens as a JSON
// object under "auth_tokens" (same as agentAPI); read accessToken from there.
const getAuthToken = () => {
  try {
    const stored = localStorage.getItem("auth_tokens");
    if (stored) {
      const { accessToken } = JSON.parse(stored);
      if (accessToken) return accessToken;
    }
  } catch (e) {
    console.warn("Failed to parse auth tokens:", e);
  }
  // Fallback for any legacy plain-string token
  return localStorage.getItem("authToken");
};

// Create axios instance with auth header
const createAuthenticatedRequest = () => {
  const token = getAuthToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

// Auth header for multipart uploads — let the browser set the boundary itself
const createUploadRequest = () => {
  const token = getAuthToken();
  return { headers: { Authorization: `Bearer ${token}` } };
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DidType {
  id: number;
  name: string;
  requires_request: number; // 0 = buyable directly, 1 = needs a request
}

export interface CatalogNumber {
  id: number;
  did_number: number;
  country_code: number;
  type_label: string;
  expiry_date: string;
}

export interface ProvisionedNumber {
  _id: string;
  phone_number: string;
  display_name: string;
  provider: string;
  agent_id: string | null;
  outbound_agent_id?: string | null;
  tenant_id: string;
  language: string;
  inbound_enabled: boolean;
  outbound_enabled?: boolean;
  recording_enabled: boolean;
  is_active: boolean;
  provisioned_at: string;
  livekit_trunk_id?: string;
  livekit_dispatch_rule_id?: string;
  voicelink_client_id?: number;
  voicelink_trunk_id?: number;
  voicelink_did_id?: number;
}

export interface BuyNumberRequest {
  voicelink_did_id: number;
  did_number: number | string;
  agent_id: string;
  display_name: string;
  language?: string;
}

export interface BuyNumberResult {
  phone_number_id: string;
  phone_number: string;
  livekit_trunk_id: string;
  livekit_dispatch_rule_id: string;
  // Present in some backend versions; not guaranteed by the buy response.
  voicelink_trunk_id?: number;
  voicelink_call_routing_id?: number;
  voicelink_call_setting_id?: number;
}

export interface CallLogEntry {
  _id: string;
  voicelink_unique_id: string;
  event: "Initiated" | "Ringing" | "Connected" | "Hangup" | "Failed";
  call_type: string;
  did_number: string;
  caller_number: string;
  phone_number_id: string;
  agent_id: string;
  tenant_id: string;
  duration_seconds: number | null;
  created_at: string;
}

interface ListResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Campaign types ──────────────────────────────────────────────────────────

export type CampaignStatus =
  | "draft"
  | "running"
  | "paused"
  | "completed"
  | "stopped"
  | string;

export interface CampaignStats {
  total: number;
  pending: number;
  dialing: number;
  answered?: number;
  completed: number;
  failed?: number;
  no_answer: number;
  voicemail?: number;
  [key: string]: number | undefined;
}

export interface Campaign {
  _id: string;
  agent_id: string;
  name: string;
  caller_number: string;
  language: string;
  max_concurrent: number;
  status: CampaignStatus;
  /** Why the campaign is calling — guides the agent. */
  objective?: string;
  /** Measurable outcome the agent should aim for. */
  goal?: string;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
  started_at?: string;
  completed_at?: string | null;
  livekit_outbound_trunk_id?: string;
  /** Embedded stats from list/get responses (prefer live status when polling). */
  stats?: CampaignStats;
}

export interface CreateCampaignRequest {
  agent_id: string;
  name: string;
  caller_number: string;
  language?: string;
  max_concurrent?: number;
  objective?: string;
  goal?: string;
}

// Live dialer stats from GET /campaigns/:id/status
export interface CampaignLiveStatus {
  total: number;
  pending: number;
  dialing: number;
  completed: number;
  no_answer: number;
  answered?: number;
  failed?: number;
  voicemail?: number;
  [key: string]: number | undefined;
}

export interface CampaignContact {
  _id: string;
  campaign_id: string;
  phone_number: string;
  name?: string;
  status: "pending" | "dialing" | "completed" | "no_answer" | string;
  custom_fields?: Record<string, string>;
  created_at?: string;
}

// Backend errors come back as { success: false, error: "..." }
const errMessage = (error: any, fallback: string) =>
  error.response?.data?.error || error.response?.data?.message || fallback;

// ─── Endpoints ───────────────────────────────────────────────────────────────

// Browse unassigned DIDs available for purchase for a given DID type.
// The backend REQUIRES a type (`type` query param) — see GET /phone-numbers/did-types.
export const getNumberCatalog = async (didTypeId: number): Promise<CatalogNumber[]> => {
  try {
    const response: AxiosResponse<{ success: boolean; data: CatalogNumber[] }> =
      await axios.get(`${API_BASE_URL}/phone-numbers/catalog`, {
        ...createAuthenticatedRequest(),
        params: { type: didTypeId },
      });
    return response.data.data || [];
  } catch (error: any) {
    console.error("Error fetching number catalog:", error);
    throw new Error(errMessage(error, "Failed to load available numbers"));
  }
};

// Buy + provision a number (VoiceLink trunk, routing, LiveKit dispatch — all server-side)
export const buyPhoneNumber = async (payload: BuyNumberRequest): Promise<BuyNumberResult> => {
  try {
    const response: AxiosResponse<{ success: boolean; message: string; data: BuyNumberResult }> =
      await axios.post(
        `${API_BASE_URL}/phone-numbers/buy`,
        { language: "en-in", ...payload },
        createAuthenticatedRequest()
      );
    return response.data.data;
  } catch (error: any) {
    console.error("Error buying phone number:", error);
    throw new Error(errMessage(error, "Failed to provision number"));
  }
};

// List the tenant's active numbers
export const getPhoneNumbers = async (
  params: { agent_id?: string; page?: number; limit?: number } = {}
): Promise<{ data: ProvisionedNumber[]; total: number }> => {
  try {
    const { page = 1, limit = 20, agent_id } = params;
    const response: AxiosResponse<ListResponse<ProvisionedNumber>> = await axios.get(
      `${API_BASE_URL}/phone-numbers`,
      { ...createAuthenticatedRequest(), params: { page, limit, ...(agent_id ? { agent_id } : {}) } }
    );
    return { data: response.data.data || [], total: response.data.total || 0 };
  } catch (error: any) {
    console.error("Error fetching phone numbers:", error);
    throw new Error(errMessage(error, "Failed to load phone numbers"));
  }
};

// Get a single number's details
export const getPhoneNumber = async (id: string): Promise<ProvisionedNumber> => {
  try {
    const response: AxiosResponse<{ success: boolean; data: ProvisionedNumber }> = await axios.get(
      `${API_BASE_URL}/phone-numbers/${id}`,
      createAuthenticatedRequest()
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching phone number:", error);
    throw new Error(errMessage(error, "Failed to load number details"));
  }
};

// Change which agent answers this number — rebuilds the LiveKit dispatch rule
export const reassignPhoneNumber = async (id: string, agentId: string): Promise<string> => {
  try {
    const response: AxiosResponse<{ success: boolean; message: string }> = await axios.patch(
      `${API_BASE_URL}/phone-numbers/${id}/reassign`,
      { agent_id: agentId },
      createAuthenticatedRequest()
    );
    return response.data.message;
  } catch (error: any) {
    console.error("Error reassigning phone number:", error);
    throw new Error(errMessage(error, "Failed to reassign number"));
  }
};

// Remove LiveKit trunk + dispatch rule — inbound calls stop routing
export const deprovisionPhoneNumber = async (id: string): Promise<string> => {
  try {
    const response: AxiosResponse<{ success: boolean; message: string }> = await axios.delete(
      `${API_BASE_URL}/phone-numbers/${id}/provision`,
      createAuthenticatedRequest()
    );
    return response.data.message;
  } catch (error: any) {
    console.error("Error deprovisioning phone number:", error);
    throw new Error(errMessage(error, "Failed to deprovision number"));
  }
};

// Flip VoiceLink routing so this number can be used as an outbound campaign caller.
// Must be called before an outbound agent can be set.
export const enableOutbound = async (phoneNumberId: string): Promise<string> => {
  try {
    const response: AxiosResponse<{ success: boolean; message: string }> = await axios.post(
      `${API_BASE_URL}/phone-numbers/${phoneNumberId}/enable-outbound`,
      {},
      createAuthenticatedRequest()
    );
    return response.data.message;
  } catch (error: any) {
    console.error("Error enabling outbound:", error);
    throw new Error(errMessage(error, "Failed to enable outbound calling"));
  }
};

// Set/replace the agent that places OUTBOUND calls on this number.
// Number must be outbound-enabled first (else the API returns 409).
export const setOutboundAgent = async (
  phoneNumberId: string,
  agentId: string
): Promise<ProvisionedNumber> => {
  try {
    const response: AxiosResponse<{ success: boolean; data: ProvisionedNumber }> = await axios.post(
      `${API_BASE_URL}/phone-numbers/${phoneNumberId}/outbound-agent`,
      { agent_id: agentId },
      createAuthenticatedRequest()
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error setting outbound agent:", error);
    // 409 = outbound not enabled yet — surface a clear message
    if (error.response?.status === 409) {
      throw new Error("Enable outbound on this number before assigning an outbound agent.");
    }
    throw new Error(errMessage(error, "Failed to set outbound agent"));
  }
};

// Remove the outbound agent (outbound_agent_id → null).
export const removeOutboundAgent = async (
  phoneNumberId: string
): Promise<string> => {
  try {
    const response: AxiosResponse<{ success: boolean; message: string }> = await axios.delete(
      `${API_BASE_URL}/phone-numbers/${phoneNumberId}/outbound-agent`,
      createAuthenticatedRequest()
    );
    return response.data.message;
  } catch (error: any) {
    console.error("Error removing outbound agent:", error);
    throw new Error(errMessage(error, "Failed to remove outbound agent"));
  }
};

// List DID categories (shown in the dropdown before browsing the buy catalog).
export const getDidTypes = async (): Promise<DidType[]> => {
  try {
    const response: AxiosResponse<{ success: boolean; data: DidType[] }> = await axios.get(
      `${API_BASE_URL}/phone-numbers/did-types`,
      createAuthenticatedRequest()
    );
    return response.data.data || [];
  } catch (error: any) {
    console.error("Error fetching DID types:", error);
    throw new Error(errMessage(error, "Failed to load number types"));
  }
};

// Call history from the VoiceLink webhook log
export const getCallLogs = async (
  params: {
    did_number?: string;
    agent_id?: string;
    event?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ data: CallLogEntry[]; total: number }> => {
  try {
    const { page = 1, limit = 50, ...rest } = params;
    const response: AxiosResponse<ListResponse<CallLogEntry>> = await axios.get(
      `${API_BASE_URL}/webhook/voicelink/call-logs`,
      { ...createAuthenticatedRequest(), params: { page, limit, ...rest } }
    );
    return { data: response.data.data || [], total: response.data.total || 0 };
  } catch (error: any) {
    console.error("Error fetching call logs:", error);
    throw new Error(errMessage(error, "Failed to load call logs"));
  }
};

// ─── Campaigns ───────────────────────────────────────────────────────────────

// Create a campaign. caller_number must be a number with outbound already enabled.
export const createCampaign = async (payload: CreateCampaignRequest): Promise<Campaign> => {
  try {
    const response: AxiosResponse<{ success: boolean; data: Campaign }> = await axios.post(
      `${API_BASE_URL}/campaigns`,
      { language: "en-in", max_concurrent: 3, ...payload },
      createAuthenticatedRequest()
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error creating campaign:", error);
    throw new Error(errMessage(error, "Failed to create campaign"));
  }
};

// Upload contacts spreadsheet (.xlsx/.xls/.csv). Columns: phone_number (required),
// name (optional), any extra columns become custom_fields for the agent.
export const uploadCampaignContacts = async (
  campaignId: string,
  file: File
): Promise<{ uploaded: number }> => {
  try {
    const form = new FormData();
    form.append("file", file);
    const response: AxiosResponse<{ success: boolean; data: { uploaded: number } }> =
      await axios.post(
        `${API_BASE_URL}/campaigns/${campaignId}/contacts/upload`,
        form,
        createUploadRequest()
      );
    return response.data.data;
  } catch (error: any) {
    console.error("Error uploading contacts:", error);
    throw new Error(errMessage(error, "Failed to upload contacts"));
  }
};

// Start the dialer (draft → running). Phone-service.
export const startCampaign = async (
  campaignId: string
): Promise<{ message: string; pending?: number }> => {
  try {
    const response: AxiosResponse<{ message: string; campaign_id: string; pending: number }> =
      await axios.post(
        `${PHONE_SERVICE_URL}/campaigns/${campaignId}/start`,
        {},
        createAuthenticatedRequest()
      );
    return { message: response.data.message, pending: response.data.pending };
  } catch (error: any) {
    console.error("Error starting campaign:", error);
    throw new Error(errMessage(error, "Failed to start campaign"));
  }
};

// Pause — running → paused (resumable). Phone-service.
export const pauseCampaign = async (campaignId: string): Promise<{ message: string }> => {
  try {
    const response: AxiosResponse<{ message: string }> = await axios.post(
      `${PHONE_SERVICE_URL}/campaigns/${campaignId}/pause`,
      {},
      createAuthenticatedRequest()
    );
    return { message: response.data.message };
  } catch (error: any) {
    console.error("Error pausing campaign:", error);
    throw new Error(errMessage(error, "Failed to pause campaign"));
  }
};

// Resume — paused → running, continues remaining contacts. Phone-service.
export const resumeCampaign = async (campaignId: string): Promise<{ message: string }> => {
  try {
    const response: AxiosResponse<{ message: string }> = await axios.post(
      `${PHONE_SERVICE_URL}/campaigns/${campaignId}/resume`,
      {},
      createAuthenticatedRequest()
    );
    return { message: response.data.message };
  } catch (error: any) {
    console.error("Error resuming campaign:", error);
    throw new Error(errMessage(error, "Failed to resume campaign"));
  }
};

// Stop — running/paused → stopped (terminal). Phone-service.
export const stopCampaign = async (campaignId: string): Promise<{ message: string }> => {
  try {
    const response: AxiosResponse<{ message: string }> = await axios.post(
      `${PHONE_SERVICE_URL}/campaigns/${campaignId}/stop`,
      {},
      createAuthenticatedRequest()
    );
    return { message: response.data.message };
  } catch (error: any) {
    console.error("Error stopping campaign:", error);
    throw new Error(errMessage(error, "Failed to stop campaign"));
  }
};

/** @deprecated Prefer resumeCampaign for paused campaigns; kept for older dialers. */
export const restartCampaign = async (
  campaignId: string
): Promise<{ message: string }> => {
  try {
    const response: AxiosResponse<{ message: string }> = await axios.post(
      `${PHONE_SERVICE_URL}/campaigns/${campaignId}/restart`,
      {},
      createAuthenticatedRequest()
    );
    return { message: response.data.message };
  } catch (error: any) {
    console.error("Error restarting campaign:", error);
    throw new Error(errMessage(error, "Failed to restart campaign"));
  }
};

// Delete a campaign and its contacts.
export const deleteCampaign = async (campaignId: string): Promise<string> => {
  try {
    const response: AxiosResponse<{ success: boolean; message?: string }> =
      await axios.delete(
        `${API_BASE_URL}/campaigns/${campaignId}`,
        createAuthenticatedRequest()
      );
    return response.data.message || "Campaign deleted";
  } catch (error: any) {
    console.error("Error deleting campaign:", error);
    throw new Error(errMessage(error, "Failed to delete campaign"));
  }
};

// List all campaigns for the tenant
export const getCampaigns = async (): Promise<Campaign[]> => {
  try {
    const response: AxiosResponse<{ success: boolean; data: Campaign[] }> = await axios.get(
      `${API_BASE_URL}/campaigns`,
      createAuthenticatedRequest()
    );
    return response.data.data || [];
  } catch (error: any) {
    console.error("Error fetching campaigns:", error);
    throw new Error(errMessage(error, "Failed to load campaigns"));
  }
};

// Get a single campaign
export const getCampaign = async (campaignId: string): Promise<Campaign> => {
  try {
    const response: AxiosResponse<{ success: boolean; data: Campaign }> = await axios.get(
      `${API_BASE_URL}/campaigns/${campaignId}`,
      createAuthenticatedRequest()
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching campaign:", error);
    throw new Error(errMessage(error, "Failed to load campaign"));
  }
};

export interface CampaignStatusResponse {
  campaign_id: string;
  name: string;
  status: CampaignStatus;
  started_at?: string;
  completed_at?: string | null;
  stats: CampaignLiveStatus;
}

// Live dialer stats from GET /campaigns/:id/status
// Response shape: { success, data: { campaign_id, name, status, started_at, completed_at, stats: {...} } }
export const getCampaignStatus = async (campaignId: string): Promise<CampaignLiveStatus> => {
  const detail = await getCampaignStatusDetail(campaignId);
  return detail.stats;
};

export const getCampaignStatusDetail = async (
  campaignId: string
): Promise<CampaignStatusResponse> => {
  try {
    const response: AxiosResponse<{ success: boolean; data: any }> = await axios.get(
      `${API_BASE_URL}/campaigns/${campaignId}/status`,
      createAuthenticatedRequest()
    );
    const data = response.data?.data ?? {};
    const statsRaw = data.stats && typeof data.stats === "object" ? data.stats : data;
    const stats: CampaignLiveStatus = {
      total: Number(statsRaw.total) || 0,
      pending: Number(statsRaw.pending) || 0,
      dialing: Number(statsRaw.dialing) || 0,
      completed: Number(statsRaw.completed) || 0,
      no_answer: Number(statsRaw.no_answer) || 0,
      answered: Number(statsRaw.answered) || 0,
      failed: Number(statsRaw.failed) || 0,
      voicemail: Number(statsRaw.voicemail) || 0,
    };
    return {
      campaign_id: data.campaign_id || campaignId,
      name: data.name || "",
      status: data.status || "draft",
      started_at: data.started_at,
      completed_at: data.completed_at ?? null,
      stats,
    };
  } catch (error: any) {
    console.error("Error fetching campaign status:", error);
    throw new Error(errMessage(error, "Failed to load campaign status"));
  }
};

// List a campaign's contacts, optionally filtered by status
export const getCampaignContacts = async (
  campaignId: string,
  params: { status?: string; page?: number; limit?: number } = {}
): Promise<{ data: CampaignContact[]; total: number }> => {
  try {
    const { page = 1, limit = 50, status } = params;
    const response: AxiosResponse<any> = await axios.get(
      `${API_BASE_URL}/campaigns/${campaignId}/contacts`,
      { ...createAuthenticatedRequest(), params: { page, limit, ...(status ? { status } : {}) } }
    );
    const body = response.data;
    // Backend may return data as an array, or nest it (data.contacts / data.items)
    const raw =
      body?.data?.contacts ??
      body?.data?.items ??
      body?.contacts ??
      body?.data ??
      body;
    const list: CampaignContact[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.contacts)
        ? raw.contacts
        : [];
    const total =
      typeof body?.total === "number"
        ? body.total
        : typeof body?.data?.total === "number"
          ? body.data.total
          : list.length;
    return { data: list, total };
  } catch (error: any) {
    console.error("Error fetching campaign contacts:", error);
    throw new Error(errMessage(error, "Failed to load campaign contacts"));
  }
};

// ─── Display helpers ─────────────────────────────────────────────────────────

// Catalog DIDs come back as raw digits (919876543210) — render them dial-ready
export const formatDid = (did: number | string): string => `+${String(did).replace(/^\+/, "")}`;

// Turn manually-entered contacts into a CSV File the upload endpoint accepts.
// Header: phone_number, name, plus any extra keys (e.g. call_context) as custom_fields for the agent.
export const contactsToCsvFile = (
  contacts: { phone: string; name?: string; [key: string]: string | undefined }[],
  filename = "contacts.csv"
): File => {
  const esc = (v: string) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // Collect extra custom-field keys beyond phone/name (stable order: call_context first if present)
  const extraKeys = Array.from(
    new Set(contacts.flatMap((c) => Object.keys(c).filter((k) => k !== "phone" && k !== "name")))
  ).sort((a, b) => {
    if (a === "call_context") return -1;
    if (b === "call_context") return 1;
    return a.localeCompare(b);
  });
  const header = ["phone_number", "name", ...extraKeys].join(",");
  const rows = [
    header,
    ...contacts.map((c) =>
      [esc(c.phone), esc(c.name || ""), ...extraKeys.map((k) => esc(c[k] || ""))].join(",")
    ),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  return new File([blob], filename, { type: "text/csv" });
};

export default {
  getNumberCatalog,
  buyPhoneNumber,
  getPhoneNumbers,
  getPhoneNumber,
  reassignPhoneNumber,
  deprovisionPhoneNumber,
  enableOutbound,
  setOutboundAgent,
  removeOutboundAgent,
  getDidTypes,
  getCallLogs,
  createCampaign,
  uploadCampaignContacts,
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  stopCampaign,
  restartCampaign,
  deleteCampaign,
  getCampaigns,
  getCampaign,
  getCampaignStatus,
  getCampaignStatusDetail,
  getCampaignContacts,
  formatDid,
  contactsToCsvFile,
};
