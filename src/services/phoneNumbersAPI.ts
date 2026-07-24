import axios, { AxiosResponse } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Campaign dialer (start/pause) lives on the phone-service, not the main backend.
// Mirror the staging/prod split used by agentAPI's voiceApiClient.
const _isStaging = import.meta.env.VITE_API_BASE_URL?.includes("staging");
const PHONE_SERVICE_URL = _isStaging
  ? "https://staging.voice.callshivai.com/phone"
  : "https://voice.callshivai.com/phone";

// Get auth token from localStorage
const getAuthToken = () => {
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
  | string;

export interface Campaign {
  _id: string;
  agent_id: string;
  name: string;
  caller_number: string;
  language: string;
  max_concurrent: number;
  status: CampaignStatus;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCampaignRequest {
  agent_id: string;
  name: string;
  caller_number: string;
  language?: string;
  max_concurrent?: number;
}

// Live dialer stats from GET /campaigns/:id/status
export interface CampaignLiveStatus {
  total: number;
  pending: number;
  dialing: number;
  completed: number;
  no_answer: number;
  [key: string]: number;
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

// Browse unassigned DIDs available for purchase
export const getNumberCatalog = async (): Promise<CatalogNumber[]> => {
  try {
    const response: AxiosResponse<{ success: boolean; data: CatalogNumber[] }> =
      await axios.get(`${API_BASE_URL}/phone-numbers/catalog`, createAuthenticatedRequest());
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
// Must be called before the number is usable as a campaign caller_number.
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

// Start (or resume) the dialer loop. Lives on the phone-service, not the backend.
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

// Pause the dialer — active calls finish, no new calls placed. Phone-service.
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

// Live dialer stats (total/pending/dialing/completed/no_answer)
export const getCampaignStatus = async (campaignId: string): Promise<CampaignLiveStatus> => {
  try {
    const response: AxiosResponse<{ success: boolean; data: CampaignLiveStatus }> = await axios.get(
      `${API_BASE_URL}/campaigns/${campaignId}/status`,
      createAuthenticatedRequest()
    );
    return response.data.data;
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
    const response: AxiosResponse<ListResponse<CampaignContact>> = await axios.get(
      `${API_BASE_URL}/campaigns/${campaignId}/contacts`,
      { ...createAuthenticatedRequest(), params: { page, limit, ...(status ? { status } : {}) } }
    );
    return { data: response.data.data || [], total: response.data.total || 0 };
  } catch (error: any) {
    console.error("Error fetching campaign contacts:", error);
    throw new Error(errMessage(error, "Failed to load campaign contacts"));
  }
};

// ─── Display helpers ─────────────────────────────────────────────────────────

// Catalog DIDs come back as raw digits (919876543210) — render them dial-ready
export const formatDid = (did: number | string): string => `+${String(did).replace(/^\+/, "")}`;

// Turn manually-entered contacts into a CSV File the upload endpoint accepts.
// Header matches the sheet spec: phone_number, name.
export const contactsToCsvFile = (
  contacts: { phone: string; name?: string }[],
  filename = "contacts.csv"
): File => {
  const esc = (v: string) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [
    "phone_number,name",
    ...contacts.map((c) => `${esc(c.phone)},${esc(c.name || "")}`),
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
  getCallLogs,
  createCampaign,
  uploadCampaignContacts,
  startCampaign,
  pauseCampaign,
  getCampaigns,
  getCampaign,
  getCampaignStatus,
  getCampaignContacts,
  formatDid,
  contactsToCsvFile,
};
