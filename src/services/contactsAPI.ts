import axios, { AxiosResponse } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
  return localStorage.getItem("authToken");
};

const authHeaders = (extra?: Record<string, string>) => {
  const token = getAuthToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...extra,
    },
  };
};

const errMessage = (error: any, fallback: string) =>
  error.response?.data?.error || error.response?.data?.message || fallback;

const unwrapData = <T = any>(body: any): T => (body?.data !== undefined ? body.data : body);

const contactId = (c: { id?: string; _id?: string } | null | undefined): string =>
  String(c?.id || c?._id || "");

// ─── Contacts ────────────────────────────────────────────────────────────────

export type ContactDirection = "inbound" | "outbound" | "both";

export interface TenantContact {
  id: string;
  _id?: string;
  name: string;
  phone_number: string;
  email?: string;
  direction?: ContactDirection;
  agent_id?: string | null;
  phone_number_id?: string | null;
  language?: string;
  custom_fields?: Record<string, string>;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateContactRequest {
  name: string;
  phone_number: string;
  email?: string;
  direction?: ContactDirection;
  agent_id?: string;
  phone_number_id?: string;
  language?: string;
  custom_fields?: Record<string, string>;
}

export type UpdateContactRequest = Partial<CreateContactRequest>;

export interface ListContactsParams {
  page?: number;
  limit?: number;
  search?: string;
  phone_number?: string;
  direction?: ContactDirection | "all";
  agent_id?: string;
  include_inactive?: boolean;
}

export interface ListContactsResult {
  data: TenantContact[];
  total: number;
  page: number;
  limit: number;
}

const normalizeContact = (raw: any): TenantContact => {
  const id = contactId(raw);
  return {
    ...raw,
    id,
    _id: raw._id || id,
    name: String(raw.name || "").trim() || "Unnamed",
    phone_number: String(raw.phone_number || raw.phone || "").trim(),
    custom_fields:
      raw.custom_fields && typeof raw.custom_fields === "object" ? raw.custom_fields : undefined,
    is_active: raw.is_active !== false,
  };
};

export const createContact = async (payload: CreateContactRequest): Promise<TenantContact> => {
  try {
    const response: AxiosResponse<any> = await axios.post(
      `${API_BASE_URL}/contacts`,
      payload,
      authHeaders()
    );
    return normalizeContact(unwrapData(response.data) || response.data);
  } catch (error: any) {
    if (error?.response?.status === 409) {
      throw new Error(errMessage(error, "A contact with this phone number already exists"));
    }
    throw new Error(errMessage(error, "Failed to create contact"));
  }
};

export const listContacts = async (
  params: ListContactsParams = {}
): Promise<ListContactsResult> => {
  try {
    const { page = 1, limit = 50, ...rest } = params;
    const clean: Record<string, any> = { page, limit };
    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "" && v !== "all") clean[k] = v;
    });
    const response: AxiosResponse<any> = await axios.get(`${API_BASE_URL}/contacts`, {
      ...authHeaders(),
      params: clean,
    });
    const body = response.data;
    const dataRaw = unwrapData<any>(body);
    const list = Array.isArray(dataRaw)
      ? dataRaw
      : Array.isArray(dataRaw?.contacts)
        ? dataRaw.contacts
        : Array.isArray(dataRaw?.data)
          ? dataRaw.data
          : [];
    const pagination = dataRaw?.pagination || body?.pagination || {};
    return {
      data: list.map(normalizeContact),
      total: Number(pagination.total ?? body?.total ?? list.length) || list.length,
      page: Number(pagination.page ?? page) || page,
      limit: Number(pagination.limit ?? limit) || limit,
    };
  } catch (error: any) {
    throw new Error(errMessage(error, "Failed to load contacts"));
  }
};

export const getContact = async (id: string): Promise<TenantContact> => {
  try {
    const response: AxiosResponse<any> = await axios.get(
      `${API_BASE_URL}/contacts/${id}`,
      authHeaders()
    );
    return normalizeContact(unwrapData(response.data) || response.data);
  } catch (error: any) {
    throw new Error(errMessage(error, "Failed to load contact"));
  }
};

export const updateContact = async (
  id: string,
  payload: UpdateContactRequest
): Promise<TenantContact> => {
  try {
    const response: AxiosResponse<any> = await axios.patch(
      `${API_BASE_URL}/contacts/${id}`,
      payload,
      authHeaders()
    );
    return normalizeContact(unwrapData(response.data) || response.data);
  } catch (error: any) {
    if (error?.response?.status === 409) {
      throw new Error(errMessage(error, "A contact with this phone number already exists"));
    }
    throw new Error(errMessage(error, "Failed to update contact"));
  }
};

/** Soft-deactivate a contact (does not delete call history). */
export const archiveContact = async (id: string): Promise<string> => {
  try {
    const response: AxiosResponse<any> = await axios.delete(
      `${API_BASE_URL}/contacts/${id}`,
      authHeaders()
    );
    return response.data?.message || "Contact archived";
  } catch (error: any) {
    throw new Error(errMessage(error, "Failed to archive contact"));
  }
};

/** Find an active contact by exact phone, or null. */
export const findContactByPhone = async (phone: string): Promise<TenantContact | null> => {
  const normalized = String(phone || "").trim();
  if (!normalized) return null;
  try {
    const byPhone = await listContacts({ phone_number: normalized, limit: 5, include_inactive: false });
    const exact = byPhone.data.find((c) => c.phone_number === normalized);
    if (exact) return exact;
  } catch {
    /* fall through to search */
  }
  try {
    const digits = normalized.replace(/\D/g, "");
    const searched = await listContacts({ search: digits.slice(-10) || normalized, limit: 20 });
    return (
      searched.data.find((c) => c.phone_number === normalized) ||
      searched.data.find((c) => c.phone_number.replace(/\D/g, "") === digits) ||
      null
    );
  } catch {
    return null;
  }
};

// ─── Direct contact batch calling ────────────────────────────────────────────

export interface ContactBatchRequest {
  contact_ids: string[];
  agent_id: string;
  caller_number: string;
  language?: string;
  name?: string;
  max_concurrent?: number;
  calls_per_minute?: number;
  objective?: string;
  goal?: string;
  /** Client idempotency key — reuse on retry/timeout. */
  idempotency_key?: string;
}

export interface ContactBatchResult {
  batch_id: string;
  campaign_id: string;
  status: string;
  total_contacts: number;
  message?: string;
}

export const startContactBatch = async (
  payload: ContactBatchRequest
): Promise<ContactBatchResult> => {
  const { idempotency_key, ...body } = payload;
  if (!body.contact_ids?.length) {
    throw new Error("Select at least one contact");
  }
  try {
    const key =
      idempotency_key ||
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `batch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
    const response: AxiosResponse<any> = await axios.post(
      `${API_BASE_URL}/contact-batches`,
      body,
      authHeaders({ "Idempotency-Key": key })
    );
    const data = unwrapData<any>(response.data) || {};
    const campaignId = String(data.campaign_id || data.batch_id || "");
    return {
      batch_id: String(data.batch_id || campaignId),
      campaign_id: campaignId,
      status: String(data.status || "running"),
      total_contacts: Number(data.total_contacts ?? body.contact_ids.length) || body.contact_ids.length,
      message: response.data?.message,
    };
  } catch (error: any) {
    if (error?.response?.status === 409) {
      const data = unwrapData<any>(error.response?.data) || {};
      if (data.campaign_id || data.batch_id) {
        return {
          batch_id: String(data.batch_id || data.campaign_id),
          campaign_id: String(data.campaign_id || data.batch_id),
          status: String(data.status || "running"),
          total_contacts: Number(data.total_contacts ?? body.contact_ids.length) || body.contact_ids.length,
          message: errMessage(error, "Batch already started"),
        };
      }
    }
    throw new Error(errMessage(error, "Failed to start contact batch"));
  }
};

export interface DirectOutboundRecipient {
  to: string;
  name?: string;
  call_context?: string;
  /** Existing tenant contact id when known. */
  contact_id?: string;
}

export interface DirectOutboundCallRequest {
  phone_number_id: string;
  caller_number: string;
  agent_id: string;
  language?: string;
  name?: string;
  objective?: string;
  goal?: string;
  recipients: DirectOutboundRecipient[];
  idempotency_key?: string;
}

export interface DirectOutboundCallResult {
  message: string;
  campaign_id?: string;
  batch_id?: string;
  recipient_count?: number;
  status?: string;
}

/**
 * Direct call from a contact list / ad-hoc numbers.
 * Ensures each recipient exists as a tenant contact (with per-contact call_context
 * in custom_fields), then starts POST /contact-batches.
 */
export const placeDirectOutboundCall = async (
  payload: DirectOutboundCallRequest
): Promise<DirectOutboundCallResult> => {
  const recipients = (payload.recipients || [])
    .map((r) => ({
      to: String(r.to || "").trim(),
      name: r.name?.trim() || undefined,
      call_context: r.call_context?.trim() || undefined,
      contact_id: r.contact_id?.trim() || undefined,
    }))
    .filter((r) => !!r.to || !!r.contact_id);

  if (recipients.length === 0) {
    throw new Error("Add at least one phone number");
  }
  if (recipients.length > 500) {
    throw new Error("A batch can include at most 500 contacts");
  }

  const language = payload.language || "en-in";
  const contactIds: string[] = [];

  for (const r of recipients) {
    let id = r.contact_id || "";

    if (!id && r.to) {
      const existing = await findContactByPhone(r.to);
      if (existing) id = existing.id;
    }

    if (id) {
      if (r.call_context || r.name) {
        try {
          const patch: UpdateContactRequest = {};
          if (r.name) patch.name = r.name;
          if (r.call_context) {
            patch.custom_fields = { call_context: r.call_context };
          }
          await updateContact(id, patch);
        } catch {
          /* non-fatal — still dial with existing contact snapshot */
        }
      }
      contactIds.push(id);
      continue;
    }

    if (!r.to) {
      throw new Error("Each recipient needs a phone number or contact id");
    }

    try {
      const created = await createContact({
        name: r.name || r.to,
        phone_number: r.to,
        direction: "outbound",
        agent_id: payload.agent_id,
        phone_number_id: payload.phone_number_id,
        language,
        ...(r.call_context ? { custom_fields: { call_context: r.call_context } } : {}),
      });
      contactIds.push(created.id);
    } catch (err: any) {
      // Race / duplicate — resolve by phone and continue
      if (String(err.message || "").toLowerCase().includes("already exists")) {
        const existing = await findContactByPhone(r.to);
        if (existing) {
          contactIds.push(existing.id);
          continue;
        }
      }
      throw err;
    }
  }

  const uniqueIds = Array.from(new Set(contactIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    throw new Error("Could not resolve any contacts to call");
  }

  const label =
    uniqueIds.length === 1
      ? recipients[0]?.name || recipients[0]?.to || "1 contact"
      : `${uniqueIds.length} contacts`;

  const batch = await startContactBatch({
    contact_ids: uniqueIds,
    agent_id: payload.agent_id,
    caller_number: payload.caller_number,
    language,
    name: (payload.name || `Direct · ${label}`).slice(0, 80),
    max_concurrent: Math.min(Math.max(uniqueIds.length, 1), 5),
    calls_per_minute: Math.min(10, Math.max(uniqueIds.length, 1)),
    objective:
      payload.objective ||
      (uniqueIds.length === 1 && recipients[0]?.call_context
        ? recipients[0].call_context
        : `Direct outbound call${uniqueIds.length > 1 ? "s" : ""} to ${label}`),
    goal: payload.goal,
    idempotency_key: payload.idempotency_key,
  });

  return {
    message:
      batch.message ||
      (uniqueIds.length > 1
        ? `Started calling ${uniqueIds.length} contacts`
        : "Direct call started"),
    campaign_id: batch.campaign_id,
    batch_id: batch.batch_id,
    recipient_count: uniqueIds.length,
    status: batch.status,
  };
};

// ─── Call history ────────────────────────────────────────────────────────────

export interface CallHistoryItem {
  id: string;
  call_id?: string;
  direction: "inbound" | "outbound" | string;
  status: string;
  agent_id?: string;
  agent_name?: string;
  contact_id?: string;
  contact_name?: string;
  phone_number?: string;
  source_number?: string;
  language?: string;
  start_time?: string;
  end_time?: string;
  duration_seconds?: number;
}

export interface CallHistoryListResult {
  calls: CallHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface ListCallHistoryParams {
  page?: number;
  limit?: number;
  direction?: "all" | "inbound" | "outbound";
  agent_id?: string;
  contact_id?: string;
  phone_number?: string;
  status?: string;
  from?: string;
  to?: string;
}

export interface CallHistoryByNumberParams extends Omit<ListCallHistoryParams, "phone_number"> {
  phone_number: string;
}

const parseCallHistoryList = (
  body: any,
  fallback: { page: number; limit: number }
): CallHistoryListResult => {
  const data = unwrapData<any>(body) || {};
  const calls = Array.isArray(data.calls)
    ? data.calls
    : Array.isArray(data.inbound) || Array.isArray(data.outbound)
      ? [
          ...(Array.isArray(data.inbound) ? data.inbound : []),
          ...(Array.isArray(data.outbound) ? data.outbound : []),
        ]
      : Array.isArray(data)
        ? data
        : [];
  const pagination = data.pagination || {
    page: fallback.page,
    limit: fallback.limit,
    total: calls.length,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  };
  return { calls, pagination };
};

/** GET /call-history — optional filters including phone_number. */
export const listCallHistory = async (
  params: ListCallHistoryParams = {}
): Promise<CallHistoryListResult> => {
  try {
    const { page = 1, limit = 20, direction, ...rest } = params;
    const clean: Record<string, any> = { page, limit: Math.min(limit, 100) };
    if (direction && direction !== "all") clean.direction = direction;
    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") clean[k] = v;
    });
    const response: AxiosResponse<any> = await axios.get(`${API_BASE_URL}/call-history`, {
      ...authHeaders(),
      params: clean,
    });
    return parseCallHistoryList(response.data, { page, limit });
  } catch (error: any) {
    throw new Error(errMessage(error, "Failed to load call history"));
  }
};

/**
 * GET /call-history/by-number/:phone
 * Returns inbound + outbound history for a specific E.164 number.
 */
export const getCallHistoryByNumber = async (
  params: CallHistoryByNumberParams
): Promise<CallHistoryListResult> => {
  const phone = String(params.phone_number || "").trim();
  if (!phone) {
    throw new Error("Phone number is required");
  }
  try {
    const { page = 1, limit = 20, direction, ...rest } = params;
    const clean: Record<string, any> = { page, limit: Math.min(limit, 100) };
    if (direction && direction !== "all") clean.direction = direction;
    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "" && k !== "phone_number") {
        clean[k] = v;
      }
    });
    const phoneNumber = phone;
    const response: AxiosResponse<any> = await axios.get(
      `${API_BASE_URL}/call-history/by-number/${phoneNumber}`,
      { ...authHeaders(), params: clean }
    );
    return parseCallHistoryList(response.data, { page, limit });
  } catch (error: any) {
    throw new Error(errMessage(error, "Failed to load call history for this number"));
  }
};

export const getCallHistoryStats = async (params: {
  direction?: "all" | "inbound" | "outbound";
  from?: string;
  to?: string;
  agent_id?: string;
  contact_id?: string;
  phone_number?: string;
} = {}): Promise<any> => {
  try {
    const clean: Record<string, any> = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "" && v !== "all") clean[k] = v;
    });
    const response: AxiosResponse<any> = await axios.get(`${API_BASE_URL}/call-history/stats`, {
      ...authHeaders(),
      params: clean,
    });
    return unwrapData(response.data) || {};
  } catch (error: any) {
    throw new Error(errMessage(error, "Failed to load call history stats"));
  }
};

export const getCallHistoryItem = async (callId: string): Promise<CallHistoryItem> => {
  try {
    const response: AxiosResponse<any> = await axios.get(
      `${API_BASE_URL}/call-history/${callId}`,
      authHeaders()
    );
    return unwrapData(response.data) || response.data;
  } catch (error: any) {
    throw new Error(errMessage(error, "Failed to load call details"));
  }
};

export default {
  createContact,
  listContacts,
  getContact,
  updateContact,
  archiveContact,
  findContactByPhone,
  startContactBatch,
  placeDirectOutboundCall,
  listCallHistory,
  getCallHistoryByNumber,
  getCallHistoryStats,
  getCallHistoryItem,
};
