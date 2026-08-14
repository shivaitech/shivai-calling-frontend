import axios, { AxiosResponse } from "axios";
import { placeDirectOutboundCall } from "./contactsAPI";
export { placeDirectOutboundCall };
export type {
  DirectOutboundRecipient,
  DirectOutboundCallRequest,
  DirectOutboundCallResult,
} from "./contactsAPI";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Legacy dialer host — kept only as a 404 fallback while routes move to the main API.
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
  | "archived"
  | "scheduled"
  | string;

export type CampaignPriority = "low" | "medium" | "high";
export type CampaignRecurrence = "none" | "daily" | "weekly";
export type CampaignScheduleMode = "now" | "once" | "recurring" | string;

export const WEEKDAY_OPTIONS = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
] as const;

/** JS-style weekday numbers used by the campaign schedule API (Sun=0 … Sat=6). */
export const WEEKDAY_ID_TO_NUMBER: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export const WEEKDAY_NUMBER_TO_ID: Record<number, string> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

/** Map UI priority labels to the numeric priority the campaign API expects. */
export const priorityToApiNumber = (priority: CampaignPriority | string | number | undefined): number => {
  if (typeof priority === "number" && Number.isFinite(priority)) return priority;
  const key = String(priority || "medium").toLowerCase();
  if (key === "high" || key === "20") return 20;
  if (key === "low" || key === "1") return 1;
  return 10;
};

export const priorityFromApi = (priority: unknown): CampaignPriority => {
  const n = typeof priority === "number" ? priority : Number(priority);
  if (!Number.isNaN(n)) {
    if (n >= 15) return "high";
    if (n <= 5) return "low";
    return "medium";
  }
  const key = String(priority || "medium").toLowerCase();
  if (key === "high" || key === "low") return key;
  return "medium";
};

export const workingDaysToApi = (days: string[] | number[] | undefined): number[] => {
  if (!days?.length) return [0, 1, 2, 3, 4, 5, 6];
  return Array.from(
    new Set(
      days
        .map((d) => {
          if (typeof d === "number") return d;
          const key = String(d).toLowerCase().slice(0, 3);
          return WEEKDAY_ID_TO_NUMBER[key];
        })
        .filter((n): n is number => typeof n === "number" && n >= 0 && n <= 6)
    )
  ).sort((a, b) => a - b);
};

export const workingDaysFromApi = (days: Array<string | number> | undefined): string[] => {
  if (!days?.length) return ["mon", "tue", "wed", "thu", "fri"];
  return days
    .map((d) => {
      if (typeof d === "number") return WEEKDAY_NUMBER_TO_ID[d];
      const key = String(d).toLowerCase();
      if (WEEKDAY_ID_TO_NUMBER[key] != null) return key;
      const n = Number(d);
      return Number.isFinite(n) ? WEEKDAY_NUMBER_TO_ID[n] : undefined;
    })
    .filter((d): d is string => !!d);
};

export interface CampaignScheduleConfig {
  mode: CampaignScheduleMode;
  timezone: string;
  start_at?: string | null;
  end_at?: string | null;
  daily_start?: string;
  daily_end?: string;
  working_days?: number[];
  recurrence?: CampaignRecurrence | string;
  recurrence_interval?: number;
}

export interface CampaignScheduleInput {
  startNow: boolean;
  scheduledAt?: string;
  endDate?: string;
  timezone: string;
  recurrence: CampaignRecurrence | string;
  windowStart: string;
  windowEnd: string;
  workingDays: string[];
  recurrenceInterval?: number;
}

/** Build the nested `schedule` object for POST /campaigns/:id/schedule. */
export const buildCampaignScheduleConfig = (
  input: CampaignScheduleInput
): CampaignScheduleConfig => {
  const recurrence = input.recurrence || "none";
  const mode: CampaignScheduleMode = input.startNow
    ? "now"
    : recurrence !== "none"
      ? "recurring"
      : "once";
  const startAt =
    !input.startNow && input.scheduledAt
      ? new Date(input.scheduledAt).toISOString()
      : null;
  const endAt = input.endDate
    ? new Date(`${input.endDate}T23:59:59`).toISOString()
    : null;

  return {
    mode,
    timezone: input.timezone || "Asia/Kolkata",
    start_at: startAt,
    end_at: endAt,
    daily_start: input.windowStart || "09:00",
    daily_end: input.windowEnd || "18:00",
    working_days: workingDaysToApi(input.workingDays),
    recurrence: recurrence === "none" ? "none" : recurrence,
    recurrence_interval: input.recurrenceInterval || 1,
  };
};

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
  /** When set, dialer starts at this time instead of immediately. */
  scheduled_at?: string | null;
  end_date?: string | null;
  timezone?: string;
  recurrence?: CampaignRecurrence | string;
  window_start?: string;
  window_end?: string;
  business_hours_start?: string;
  business_hours_end?: string;
  working_days?: Array<string | number>;
  calls_per_minute?: number;
  daily_limit?: number;
  /** Numeric (preferred) or legacy label priority from the API. */
  priority?: CampaignPriority | number | string;
  /** Nested schedule object returned by create/get/schedule. */
  schedule?: CampaignScheduleConfig;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
  started_at?: string;
  completed_at?: string | null;
  archived_at?: string | null;
  livekit_outbound_trunk_id?: string;
  preflight_status?: "passed" | "blocked" | "pending" | string;
  preflight_blockers?: string[];
  last_preflight_at?: string | null;
  /** Embedded stats from list/get responses (prefer live status when polling). */
  stats?: CampaignStats;
  /** Present when created via POST /contact-batches. */
  source?: string;
  origin?: string;
  kind?: string;
  batch_id?: string;
  is_direct?: boolean;
}

/** Direct contact-batch runs share campaign storage; detect them for UI tabs. */
export const isDirectCallCampaign = (c: {
  name?: string;
  source?: string;
  origin?: string;
  kind?: string;
  batch_id?: string;
  is_direct?: boolean;
}): boolean => {
  if (c.is_direct === true) return true;
  if (c.batch_id) return true;
  const src = String(c.source || c.origin || c.kind || "").toLowerCase();
  if (
    src.includes("direct") ||
    src.includes("contact_batch") ||
    src.includes("contact-batch") ||
    src === "batch"
  ) {
    return true;
  }
  return /^direct(\s*[·•\-]|\s+)/i.test(String(c.name || "").trim());
};

export interface CreateCampaignRequest {
  agent_id: string;
  name: string;
  caller_number: string;
  language?: string;
  max_concurrent?: number;
  objective?: string;
  goal?: string;
  scheduled_at?: string;
  end_date?: string;
  timezone?: string;
  recurrence?: CampaignRecurrence | string;
  window_start?: string;
  window_end?: string;
  business_hours_start?: string;
  business_hours_end?: string;
  working_days?: Array<string | number>;
  calls_per_minute?: number;
  daily_limit?: number;
  priority?: CampaignPriority | number | string;
}

export type UpdateCampaignRequest = Partial<CreateCampaignRequest>;

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
  /** Linked agent session when the dial completed (field names vary by backend). */
  session_id?: string;
  call_id?: string;
  room_name?: string;
  room_id?: string;
  agent_session_id?: string;
  updated_at?: string;
  called_at?: string;
  completed_at?: string;
}

export interface UploadContactsResult {
  uploaded: number;
  sample?: Array<{
    phone_number: string;
    name?: string;
    custom_fields?: Record<string, string>;
  }>;
}

export interface CampaignActionResult {
  message: string;
  campaign_id?: string;
  pending?: number;
  data?: Campaign;
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

const unwrapData = <T = any>(body: any): T => (body?.data !== undefined ? body.data : body);

/** Backend may return `id` instead of `_id` — normalize so UI never navigates to /campaigns/undefined. */
export const normalizeCampaign = (raw: any): Campaign => {
  if (!raw || typeof raw !== "object") return raw;
  const id = String(raw._id || raw.id || raw.campaign_id || "").trim();
  return {
    ...raw,
    _id: id,
    agent_id: String(raw.agent_id || raw.agentId || "").trim(),
    name: String(raw.name || "").trim() || "Untitled",
    caller_number: String(raw.caller_number || raw.callerNumber || "").trim(),
    language: String(raw.language || "en-IN"),
  } as Campaign;
};

export const isValidCampaignId = (id?: string | null): boolean => {
  const v = String(id || "").trim();
  return !!v && v !== "undefined" && v !== "null";
};

const normalizeCampaignWritePayload = <T extends CreateCampaignRequest | UpdateCampaignRequest>(
  payload: T
): T => {
  const next: any = { ...payload };
  if (next.priority !== undefined) {
    next.priority = priorityToApiNumber(next.priority);
  }
  if (Array.isArray(next.working_days)) {
    next.working_days = workingDaysToApi(next.working_days as Array<string | number>);
  }
  return next as T;
};

/** POST campaign lifecycle actions on the main API, with legacy phone-service fallback. */
const postCampaignAction = async (
  campaignId: string,
  action: string,
  body: Record<string, unknown> = {}
): Promise<any> => {
  try {
    const response: AxiosResponse<any> = await axios.post(
      `${API_BASE_URL}/campaigns/${campaignId}/${action}`,
      body,
      createAuthenticatedRequest()
    );
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      const response: AxiosResponse<any> = await axios.post(
        `${PHONE_SERVICE_URL}/campaigns/${campaignId}/${action}`,
        body,
        createAuthenticatedRequest()
      );
      return response.data;
    }
    throw error;
  }
};

const toActionResult = (body: any, fallbackMessage: string): CampaignActionResult => {
  const data = unwrapData<any>(body) || {};
  return {
    message: data.message || body?.message || fallbackMessage,
    campaign_id: data.campaign_id,
    pending: typeof data.pending === "number" ? data.pending : undefined,
    data: data._id ? (data as Campaign) : data.campaign,
  };
};

// Create a campaign. caller_number must be a number with outbound already enabled.
export const createCampaign = async (payload: CreateCampaignRequest): Promise<Campaign> => {
  try {
    const response: AxiosResponse<{ success: boolean; data: Campaign }> = await axios.post(
      `${API_BASE_URL}/campaigns`,
      normalizeCampaignWritePayload({ language: "en-in", max_concurrent: 3, ...payload }),
      createAuthenticatedRequest()
    );
    return normalizeCampaign(response.data.data);
  } catch (error: any) {
    console.error("Error creating campaign:", error);
    throw new Error(errMessage(error, "Failed to create campaign"));
  }
};

export const updateCampaign = async (
  campaignId: string,
  payload: UpdateCampaignRequest
): Promise<Campaign> => {
  try {
    const response: AxiosResponse<{ success: boolean; data: Campaign }> = await axios.patch(
      `${API_BASE_URL}/campaigns/${campaignId}`,
      normalizeCampaignWritePayload(payload),
      createAuthenticatedRequest()
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error updating campaign:", error);
    throw new Error(errMessage(error, "Failed to update campaign"));
  }
};

export const archiveCampaign = async (campaignId: string): Promise<Campaign | string> => {
  try {
    const response: AxiosResponse<{ success: boolean; data?: Campaign; message?: string }> =
      await axios.post(
        `${API_BASE_URL}/campaigns/${campaignId}/archive`,
        {},
        createAuthenticatedRequest()
      );
    return response.data.data || response.data.message || "Campaign archived";
  } catch (error: any) {
    try {
      const response: AxiosResponse<{ success: boolean; data?: Campaign; message?: string }> =
        await axios.patch(
          `${API_BASE_URL}/campaigns/${campaignId}`,
          { status: "archived" },
          createAuthenticatedRequest()
        );
      return response.data.data || response.data.message || "Campaign archived";
    } catch (fallbackErr: any) {
      console.error("Error archiving campaign:", fallbackErr);
      throw new Error(errMessage(fallbackErr, "Failed to archive campaign"));
    }
  }
};

export const duplicateCampaign = async (
  campaignId: string,
  opts: { include_contacts?: boolean; name?: string } = {}
): Promise<Campaign> => {
  if (!isValidCampaignId(campaignId)) {
    throw new Error("Campaign id is missing");
  }
  const includeContacts = opts.include_contacts !== false;
  try {
    const response: AxiosResponse<{ success: boolean; data: Campaign }> = await axios.post(
      `${API_BASE_URL}/campaigns/${campaignId}/${includeContacts ? "duplicate" : "clone"}`,
      { name: opts.name, include_contacts: includeContacts },
      createAuthenticatedRequest()
    );
    const cloned = normalizeCampaign(unwrapData(response.data) || response.data?.data);
    if (isValidCampaignId(cloned?._id)) return cloned;
  } catch {
    /* fall through to client-side copy */
  }

  const source = await getCampaign(campaignId);
  const created = await createCampaign({
    agent_id: source.agent_id,
    name: opts.name || `${source.name} ${includeContacts ? "(copy)" : "(clone)"}`,
    caller_number: source.caller_number,
    language: source.language,
    max_concurrent: source.max_concurrent,
    objective: source.objective,
    goal: source.goal,
    timezone: source.timezone,
    recurrence: source.recurrence === "none" ? undefined : source.recurrence,
    window_start: source.window_start || source.business_hours_start,
    window_end: source.window_end || source.business_hours_end,
    business_hours_start: source.business_hours_start || source.window_start,
    business_hours_end: source.business_hours_end || source.window_end,
    working_days: source.working_days,
    calls_per_minute: source.calls_per_minute,
    daily_limit: source.daily_limit,
    priority: source.priority,
  });

  if (includeContacts) {
    const contacts = await getCampaignContacts(campaignId, { page: 1, limit: 500 });
    if (contacts.data.length > 0) {
      const file = contactsToCsvFile(
        contacts.data.map((c) => ({
          phone: c.phone_number,
          name: c.name,
          call_context:
            c.custom_fields?.call_context || c.custom_fields?.context || c.custom_fields?.reason,
        }))
      );
      await uploadCampaignContacts(created._id, file);
    }
  }

  return created;
};

export const cloneCampaign = async (campaignId: string, name?: string): Promise<Campaign> =>
  duplicateCampaign(campaignId, { include_contacts: false, name });

// Upload contacts spreadsheet (.xlsx/.xls/.csv). Columns: phone_number (required),
// name (optional), any extra columns become custom_fields for the agent.
export const uploadCampaignContacts = async (
  campaignId: string,
  file: File
): Promise<UploadContactsResult> => {
  try {
    const form = new FormData();
    form.append("file", file);
    const response: AxiosResponse<{ success: boolean; data: UploadContactsResult }> =
      await axios.post(
        `${API_BASE_URL}/campaigns/${campaignId}/contacts/upload`,
        form,
        createUploadRequest()
      );
    const data = unwrapData<UploadContactsResult>(response.data) || { uploaded: 0 };
    return {
      uploaded: Number(data.uploaded) || 0,
      sample: Array.isArray(data.sample) ? data.sample : undefined,
    };
  } catch (error: any) {
    console.error("Error uploading contacts:", error);
    throw new Error(errMessage(error, "Failed to upload contacts"));
  }
};

/** Start dialing immediately — POST /campaigns/:id/start */
export const startCampaign = async (campaignId: string): Promise<CampaignActionResult> => {
  try {
    const body = await postCampaignAction(campaignId, "start");
    return toActionResult(body, "Campaign started");
  } catch (error: any) {
    console.error("Error starting campaign:", error);
    throw new Error(errMessage(error, "Failed to start campaign"));
  }
};

/**
 * Schedule a future or recurring run — POST /campaigns/:id/schedule
 * Body: { schedule: CampaignScheduleConfig }
 */
export const scheduleCampaign = async (
  campaignId: string,
  schedule: CampaignScheduleConfig | CampaignScheduleInput
): Promise<Campaign> => {
  try {
    const scheduleBody =
      "mode" in schedule && "timezone" in schedule && !("startNow" in schedule)
        ? (schedule as CampaignScheduleConfig)
        : buildCampaignScheduleConfig(schedule as CampaignScheduleInput);

    const body = await postCampaignAction(campaignId, "schedule", { schedule: scheduleBody });
    const data = unwrapData<any>(body);
    if (data?._id) return data as Campaign;
    if (data?.campaign?._id) return data.campaign as Campaign;

    const response: AxiosResponse<{ success: boolean; data: Campaign }> = await axios.get(
      `${API_BASE_URL}/campaigns/${campaignId}`,
      createAuthenticatedRequest()
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error scheduling campaign:", error);
    throw new Error(errMessage(error, "Failed to schedule campaign"));
  }
};

/** Pause new dialing; active calls continue — POST /campaigns/:id/pause */
export const pauseCampaign = async (campaignId: string): Promise<CampaignActionResult> => {
  try {
    const body = await postCampaignAction(campaignId, "pause");
    return toActionResult(body, "Campaign paused");
  } catch (error: any) {
    console.error("Error pausing campaign:", error);
    throw new Error(errMessage(error, "Failed to pause campaign"));
  }
};

/** Resume a paused campaign — POST /campaigns/:id/resume */
export const resumeCampaign = async (campaignId: string): Promise<CampaignActionResult> => {
  try {
    const body = await postCampaignAction(campaignId, "resume");
    return toActionResult(body, "Campaign resumed");
  } catch (error: any) {
    console.error("Error resuming campaign:", error);
    throw new Error(errMessage(error, "Failed to resume campaign"));
  }
};

/** Stop new dialing and cancel active calls — POST /campaigns/:id/stop */
export const stopCampaign = async (campaignId: string): Promise<CampaignActionResult> => {
  try {
    const body = await postCampaignAction(campaignId, "stop");
    return toActionResult(body, "Campaign stopped");
  } catch (error: any) {
    console.error("Error stopping campaign:", error);
    throw new Error(errMessage(error, "Failed to stop campaign"));
  }
};

/** Reset contacts and start a fresh run — POST /campaigns/:id/restart */
export const restartCampaign = async (campaignId: string): Promise<CampaignActionResult> => {
  try {
    const body = await postCampaignAction(campaignId, "restart");
    return toActionResult(body, "Campaign restarted");
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
    const list = response.data.data || [];
    return list.map(normalizeCampaign).filter((c) => isValidCampaignId(c._id));
  } catch (error: any) {
    console.error("Error fetching campaigns:", error);
    throw new Error(errMessage(error, "Failed to load campaigns"));
  }
};

// Get a single campaign
export const getCampaign = async (campaignId: string): Promise<Campaign> => {
  if (!isValidCampaignId(campaignId)) {
    throw new Error("Campaign id is missing");
  }
  try {
    const response: AxiosResponse<{ success: boolean; data: Campaign }> = await axios.get(
      `${API_BASE_URL}/campaigns/${campaignId}`,
      createAuthenticatedRequest()
    );
    return normalizeCampaign(response.data.data);
  } catch (error: any) {
    console.error("Error fetching campaign:", error);
    throw new Error(errMessage(error, "Failed to load campaign"));
  }
};

export interface CampaignStatusResponse {
  campaign_id: string;
  name: string;
  status: CampaignStatus;
  is_running?: boolean;
  active_calls?: number;
  started_at?: string;
  completed_at?: string | null;
  calls_per_minute?: number;
  daily_limit?: number;
  priority?: number | string;
  preflight_status?: "passed" | "blocked" | "pending" | string;
  preflight_blockers?: string[];
  last_preflight_at?: string | null;
  stats: CampaignLiveStatus;
}

// Live dialer stats from GET /campaigns/:id/status
export const getCampaignStatus = async (campaignId: string): Promise<CampaignLiveStatus> => {
  const detail = await getCampaignStatusDetail(campaignId);
  return detail.stats;
};

export const getCampaignStatusDetail = async (
  campaignId: string
): Promise<CampaignStatusResponse> => {
  if (!isValidCampaignId(campaignId)) {
    throw new Error("Campaign id is missing");
  }
  try {
    const response: AxiosResponse<{ success: boolean; data: any }> = await axios.get(
      `${API_BASE_URL}/campaigns/${campaignId}/status`,
      createAuthenticatedRequest()
    );
    const data = unwrapData<any>(response.data) ?? {};
    const statsRaw = data.stats && typeof data.stats === "object" ? data.stats : data;
    const blockers = Array.isArray(data.preflight_blockers)
      ? data.preflight_blockers.map((b: unknown) => String(b))
      : [];
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
      is_running: Boolean(data.is_running),
      active_calls: Number(data.active_calls) || 0,
      started_at: data.started_at,
      completed_at: data.completed_at ?? null,
      calls_per_minute: data.calls_per_minute,
      daily_limit: data.daily_limit,
      priority: data.priority,
      preflight_status: data.preflight_status,
      preflight_blockers: blockers,
      last_preflight_at: data.last_preflight_at ?? null,
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
  if (!isValidCampaignId(campaignId)) {
    throw new Error("Campaign id is missing");
  }
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

/** Tenant-wide contacts from past campaigns — GET /campaigns/contacts (all-contact API). */
export const getAllCampaignContacts = async (
  params: { page?: number; limit?: number; status?: string; q?: string } = {}
): Promise<{ data: CampaignContact[]; total: number }> => {
  try {
    const { page = 1, limit = 100, status, q } = params;
    const response: AxiosResponse<any> = await axios.get(
      `${API_BASE_URL}/campaigns/contacts`,
      {
        ...createAuthenticatedRequest(),
        params: {
          page,
          limit,
          ...(status ? { status } : {}),
          ...(q ? { q } : {}),
        },
      }
    );
    const body = response.data;
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
    // Some deployments expose the same list at /campaigns/all-contacts
    if (error?.response?.status === 404) {
      try {
        const { page = 1, limit = 100, status, q } = params;
        const response: AxiosResponse<any> = await axios.get(
          `${API_BASE_URL}/campaigns/all-contacts`,
          {
            ...createAuthenticatedRequest(),
            params: {
              page,
              limit,
              ...(status ? { status } : {}),
              ...(q ? { q } : {}),
            },
          }
        );
        const body = response.data;
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
      } catch (fallbackErr: any) {
        console.error("Error fetching all campaign contacts:", fallbackErr);
        throw new Error(errMessage(fallbackErr, "Failed to load previous contacts"));
      }
    }
    console.error("Error fetching all campaign contacts:", error);
    throw new Error(errMessage(error, "Failed to load previous contacts"));
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
  placeDirectOutboundCall,
  createCampaign,
  updateCampaign,
  archiveCampaign,
  duplicateCampaign,
  cloneCampaign,
  uploadCampaignContacts,
  startCampaign,
  scheduleCampaign,
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
  getAllCampaignContacts,
  formatDid,
  contactsToCsvFile,
  buildCampaignScheduleConfig,
  priorityToApiNumber,
  priorityFromApi,
  workingDaysToApi,
  workingDaysFromApi,
};
