import axios, { AxiosResponse } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ── Single-flight token refresh ──────────────────────────────────────────────
// When a page mounts it often fires several authenticated requests at once. If
// the access token is expired they all 401 together. Without coordination each
// would POST /auth/refresh-token independently — and if the backend rotates
// (single-use) refresh tokens, only the first succeeds and the rest fail,
// logging the user out or bubbling up a "Failed to load" error. We serialise the
// refresh so concurrent 401s await ONE refresh call and then retry.
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const stored = localStorage.getItem("auth_tokens");
      if (!stored) return null;
      const { refreshToken } = JSON.parse(stored);
      if (!refreshToken) return null;

      const res = await axios.post(
        `${API_BASE_URL}/auth/refresh-token`,
        { refreshToken },
        { headers: { "Content-Type": "application/json" } }
      );
      const newTokens = res.data?.data?.tokens ?? res.data?.tokens;
      if (newTokens?.accessToken) {
        localStorage.setItem("auth_tokens", JSON.stringify(newTokens));
        return newTokens.accessToken as string;
      }
      return null;
    } catch {
      return null;
    } finally {
      // Allow the next genuine expiry to trigger a fresh refresh
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Shared 401 handler: refresh once (deduped) then retry the original request.
const makeAuthRetryInterceptor = (client: ReturnType<typeof axios.create>) =>
  async (error: any) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return client(originalRequest);
      }
      // Refresh failed — clear and send the user to sign in
      localStorage.removeItem("auth_tokens");
      window.location.href = "/landing";
    }
    return Promise.reject(error);
  };

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const tokens = localStorage.getItem("auth_tokens");
  if (tokens) {
    try {
      const { accessToken } = JSON.parse(tokens);
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (error) {
      console.warn("Failed to parse auth tokens:", error);
    }
  }
  return config;
});

// Response interceptor — single-flight token refresh before logging out
apiClient.interceptors.response.use(
  (response) => response,
  makeAuthRetryInterceptor(apiClient)
);

// Separate client for voice API — env-aware
const _isStaging = import.meta.env.VITE_API_BASE_URL?.includes('staging');
const voiceApiClient = axios.create({
  baseURL: _isStaging ? 'https://staging.voice.callshivai.com' : 'https://voice.callshivai.com',
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

voiceApiClient.interceptors.request.use((config) => {
  const tokens = localStorage.getItem("auth_tokens");
  if (tokens) {
    try {
      const { accessToken } = JSON.parse(tokens);
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (error) {
      console.warn("Failed to parse auth tokens:", error);
    }
  }
  return config;
});

voiceApiClient.interceptors.response.use(
  (response) => response,
  makeAuthRetryInterceptor(voiceApiClient)
);

// ── TTS voice catalog ────────────────────────────────────────────────────────
// GET /api/v1/voice/catalog — control-plane only, never called during a live
// call. See docs: TTS Provider Catalog API.

export type TtsProviderId = "google_chirp" | "cartesia" | "openai";

export interface VoiceCatalogVoice {
  id: string;
  name: string;
  gender?: string;
}

export interface VoiceCatalogModel {
  id: string;
  name: string;
  streaming: boolean;
  voice_id_format?: string;
  voices: VoiceCatalogVoice[];
}

export interface VoiceCatalogProvider {
  id: TtsProviderId;
  name: string;
  configured: boolean;
  supports_emotions: boolean;
  emotion_profiles: string[];
  models: VoiceCatalogModel[];
}

export interface VoiceCatalog {
  languages: string[];
  providers: VoiceCatalogProvider[];
}

/** Persisted on the agent document and sent back from create/get/update. */
export interface TtsConfig {
  provider: TtsProviderId;
  model: string;
  voice_id: string;
  language: string;
  speed: number;
  emotion_enabled: boolean;
  emotion_profile: string;
}

// ── Call summary (/api/v1/summaries/*) ──────────────────────────────────────
// The analytics service owns this shape and can add fields without notice, so
// every field below the "always present" block is treated as optional at the
// call site — never assume presence, default with `?? ''` / `?? []`.

export type CallSummaryUrgency = "high" | "medium" | "low" | "unknown";
export type CallSummaryOutcome =
  | "resolved"
  | "partially_resolved"
  | "unresolved"
  | "callback_required"
  | "no_action_needed";
export type CallSummarySentiment = "positive" | "neutral" | "negative";

export interface CallSummaryLead {
  name?: string;
  organisation?: string;
  requirement?: string;
  eventDate?: string;
  location?: string;
  budget?: string;
  timeline?: string;
  quantity?: string;
  email?: string;
  phone?: string;
  qualified?: boolean;
  missingInfo?: string[];
}

export interface CallSummary {
  id: string;
  agentId: string;
  callId: string;
  direction: "inbound" | "outbound" | null;
  callerNumber: string | null;
  createdAt: string;
  updatedAt: string;
  summaryUrl?: string | null;

  urgency?: CallSummaryUrgency;
  urgencyReason?: string;
  callerIntent?: string;
  summary?: string;
  outcome?: CallSummaryOutcome;
  sentiment?: CallSummarySentiment;
  followUpRequired?: boolean;
  followUpReason?: string;

  keyPoints?: string[];
  questionsAsked?: string[];
  questionsUnanswered?: string[];
  actionItems?: string[];

  lead?: CallSummaryLead;

  requestedData?: string;
  responseData?: string;
  contactEmail?: string;
  contactPhone?: string;
  deliveryChannels?: string[];
}

export interface ApiAgent {
  id: string;
  name: string;
  status: "Pending" | "Published";
  personality: string;
  language?: string | string[];
  voice: string;
  createdAt: string;
  updatedAt?: string;
  gender?: string;
  business_process?: string;
  industry?: string;
  sub_industry?: string;
  custom_instructions?: string;
  guardrails_level?: string;
  response_style?: string;
  max_response_length?: string;
  context_window?: string;
  temperature?: number;
  /** Primary channel the agent communicates on. */
  agent_type?: "webrtc" | "inbound" | "outbound";
  /** TTS provider/model/voice selection — see TTS Provider Catalog API. */
  tts?: TtsConfig;
  greeting_message?: {
    [key: string]: string;
  };
  template?: {
    name: string;
    description: string;
    icon: string;
    features: string[];
    systemPrompt?: string;
    firstMessage?: string;
    openingScript?: string;
    keyTalkingPoints?: string;
    closingScript?: string;
    objections?: Array<{ objection: string; response: string }>;
    conversationExamples?: Array<{
      customerInput: string;
      expectedResponse: string;
    }>;
  };

  stats?: {
    conversations: number;
    successRate: number;
    avgResponseTime: number;
    activeUsers: number;
  };
}

interface AgentsResponse {
  success: boolean;
  data: {
    agents: ApiAgent[];
  };
  meta?: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp?: string;
  };
  message?: string;
}

interface CreateAgentRequest {
  name: string;
  gender: string;
  business_process: string;
  industry: string;
  personality: string;
  language: string;
  voice: string;
  custom_instructions: string;
  guardrails_level: string;
  response_style: string;
  max_response_length: string;
  context_window: string;
  temperature: number;
  /** Primary channel the agent communicates on. */
  agent_type?: "webrtc" | "inbound" | "outbound";
  /** TTS provider/model/voice selection — see TTS Provider Catalog API. */
  tts?: TtsConfig;
}

interface UpdateAgentRequest {
  name?: string;
  persona?: string;
  personality?: string;
  language?: string;
  voice?: string;
  gender?: string;
  business_process?: string;
  industry?: string;
  sub_industry?: string;
  custom_instructions?: string;
  guardrails_level?: string;
  response_style?: string;
  max_response_length?: string;
  context_window?: string;
  temperature?: number;
  status?: "Pending" | "Published";
  /** Primary channel the agent communicates on. */
  agent_type?: "webrtc" | "inbound" | "outbound";
  /** TTS provider/model/voice selection — see TTS Provider Catalog API. */
  tts?: TtsConfig;
  template?: {
    name: string;
    description: string;
    icon: string;
    features: string[];
    systemPrompt?: string;
    firstMessage?: string;
    openingScript?: string;
    keyTalkingPoints?: string;
    closingScript?: string;
    objections?: Array<{ objection: string; response: string }>;
    conversationExamples?: Array<{
      customerInput: string;
      expectedResponse: string;
    }>;
  };
}

export interface PublicationRequest {
  agent_id: string;
  is_published: boolean;
}

export interface PublicationResponse {
  success: boolean;
  message: string;
  data?: {
    agent_id: string;
    is_published: boolean;
    published_at?: string;
    unpublished_at?: string;
  };
}

class AgentAPI {
  // Get all agents
  async getAgents(): Promise<ApiAgent[]> {
    try {
      const response: AxiosResponse<AgentsResponse> = await apiClient.get(
        "/agents"
      );

      if (response.data.success && response.data.data.agents) {
        const agents = response.data.data.agents.map((agent) => ({
          ...agent,
          stats: agent.stats || {
            conversations: 0,
            successRate: 0,
            avgResponseTime: 0,
            activeUsers: 0,
          },
        }));

        return agents;
      }

      return [];
    } catch (error: any) {
      console.error("Error fetching agents:", error);
      throw error;
    }
  }

  // Get agents with filters and pagination
  async getAgentsWithFilters(params: {
    gender?: string;
    sort?: string;
    search?: string;
    page?: number;
    limit?: number;
    industry?: string;
    business_process?: string;
  }): Promise<{
    agents: ApiAgent[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      
      if (params.gender && params.gender !== 'all') {
        queryParams.append('gender', params.gender);
      }
      if (params.sort) {
        queryParams.append('sort', params.sort);
      }
      if (params.search) {
        queryParams.append('search', params.search);
      }
      if (params.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params.industry) {
        queryParams.append('industry', params.industry);
      }
      if (params.business_process) {
        queryParams.append('business_process', params.business_process);
      }

      const queryString = queryParams.toString();
      const url = `/agents${queryString ? `?${queryString}` : ''}`;
      
      const response: AxiosResponse<AgentsResponse> = await apiClient.get(url);

      if (response.data.success && response.data.data.agents) {
        const agents = response.data.data.agents.map((agent) => ({
          ...agent,
          // Normalise status: the API returns is_active=true for published agents
          // but may not set status="Published". Ensure both fields are consistent.
          status: (agent as any).is_active ? 'Published' : (agent.status || 'Pending'),
          stats: agent.stats || {
            conversations: 0,
            successRate: 0,
            avgResponseTime: 0,
            activeUsers: 0,
          },
        }));

        // Extract pagination from meta.pagination
        const pagination = response.data.meta?.pagination;
        const total = pagination?.total || agents.length;
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 6;
        const totalPages = pagination?.totalPages || Math.ceil(total / limit);

        return {
          agents,
          total,
          page,
          limit,
          totalPages,
        };
      }

      return {
        agents: [],
        total: 0,
        page: 1,
        limit: params.limit || 6,
        totalPages: 0,
      };
    } catch (error: any) {
      console.error("Error fetching agents with filters:", error);
      throw error;
    }
  }

  // Get agent by ID
  async getAgent(id: string): Promise<{ agent: ApiAgent }> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data?: {
          agent: ApiAgent;
          stats?: {
            conversations: number;
            successRate: number;
            avgResponseTime: number;
            activeUsers: number;
          };
        };
        message?: string;
      }> = await apiClient.get(`/agents/${id}`);

      if (response.data.success && response.data.data?.agent) {
        const agent = {
          ...response.data.data.agent,
          stats: response.data.data.stats || {
            conversations: 0,
            successRate: 0,
            avgResponseTime: 0,
            activeUsers: 0,
          },
        };
        return { agent };
      }

      throw new Error(response.data.message || "Agent not found");
    } catch (error: any) {
      console.error("Error fetching agent:", error);
      throw error;
    }
  }

  // Fetch full agent config (used in edit/view pages)
  // Endpoint: GET /agent-configs/:id
  async getAgentConfig(id: string): Promise<{ agent: any }> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data?: { agent: any };
        message?: string;
      }> = await apiClient.get(`/agent-configs/${id}`);

      if (response.data.success && response.data.data?.agent) {
        return { agent: response.data.data.agent };
      }

      throw new Error(response.data.message || "Agent config not found");
    } catch (error: any) {
      console.error("Error fetching agent config:", error);
      throw error;
    }
  }

  // Create a new agent
  async createAgent(agentData: CreateAgentRequest): Promise<ApiAgent> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: ApiAgent;
        message?: string;
      }> = await apiClient.post("/agents/create-agent", agentData, { timeout: 0 });

      if (response.data.success && response.data.data) {
        return {
          ...response.data.data,
          stats: response.data.data.stats || {
            conversations: 0,
            successRate: 0,
            avgResponseTime: 0,
            activeUsers: 0,
          },
        };
      }

      throw new Error(response.data.message || "Failed to create agent");
    } catch (error: any) {
      console.error("Error creating agent:", error);
      throw error;
    }
  }

  // Update an existing agent
  async updateAgent(
    id: string,
    agentData: UpdateAgentRequest
  ): Promise<ApiAgent> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: ApiAgent;
        message?: string;
      }> = await apiClient.put(`/agents/${id}`, agentData);

      if (response.data.success && response.data.data) {
        return {
          ...response.data.data,
          stats: response.data.data.stats || {
            conversations: 0,
            successRate: 0,
            avgResponseTime: 0,
            activeUsers: 0,
          },
        };
      }

      throw new Error(response.data.message || "Failed to update agent");
    } catch (error: any) {
      console.error("Error updating agent:", error);
      throw error;
    }
  }

  // Delete an agent
  async deleteAgent(id: string): Promise<void> {
    try {
      const response: AxiosResponse<{ success: boolean; message?: string }> =
        await apiClient.delete(`/agents/${id}`);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete agent");
      }
    } catch (error: any) {
      console.error("Error deleting agent:", error);
      throw error;
    }
  }

  // Publication API functions
  async publishAgent(agentId: string): Promise<PublicationResponse> {
    try {
      const response: AxiosResponse<PublicationResponse> = await apiClient.post(
        `/publications/publish`,
        {
          agent_id: agentId,
          is_published: true,
        } as PublicationRequest
      );
      return response.data;
    } catch (error: any) {
      console.error("Error publishing agent:", error);
      throw new Error(
        error.response?.data?.message || "Failed to publish agent"
      );
    }
  }

  async unpublishAgent(agentId: string): Promise<PublicationResponse> {
    try {
      const response: AxiosResponse<PublicationResponse> = await apiClient.post(
        `/publications/publish`,
        {
          agent_id: agentId,
          is_published: false,
        } as PublicationRequest
      );
      return response.data;
    } catch (error: any) {
      console.error("Error unpublishing agent:", error);
      throw new Error(
        error.response?.data?.message || "Failed to unpublish agent"
      );
    }
  }

  // Get agent session history
  async getAgentSessions(payload: string, agentId: string): Promise<any> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: any;
        message?: string;
      }> = await apiClient.get(`/agent-sessions/agent/${agentId}?${payload}`);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(
        response.data.message || "Failed to fetch agent sessions"
      );
    } catch (error: any) {
      console.error("Error fetching agent sessions:", error);
      throw error;
    }
  }

  async getSessionTranscripts(sessionId: string): Promise<any> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: any;
        message?: string;
      }> = await apiClient.get(`/agent-sessions/${sessionId}/transcripts`);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(
        response.data.message || "Failed to fetch session transcripts"
      );
    } catch (error: any) {
      console.error("Error fetching session transcripts:", error);
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<any> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        message?: string;
      }> = await apiClient.delete(`/agent-sessions/${sessionId}`);

      if (response.data.success) {
        return response.data;
      }

      throw new Error(response.data.message || "Failed to delete session");
    } catch (error: any) {
      console.error("Error deleting session:", error);
      throw error;
    }
  }

  // Call summary keyed by the same call id the recording/transcript use — direct lookup, no matching needed.
  async getCallSummaryByCallId(callId: string): Promise<CallSummary | null> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: { summary: CallSummary };
        message?: string;
      }> = await apiClient.get(`/summaries/call/${encodeURIComponent(callId)}`);

      if (response.data.success && response.data.data?.summary) {
        return response.data.data.summary;
      }
      return null;
    } catch (error: any) {
      if (error?.response?.status === 404) return null;
      console.error("Error fetching call summary:", error);
      throw error;
    }
  }

  // Paginated, newest-first summaries for an agent — used as a fallback when a call id isn't known yet.
  async getCallSummariesForAgent(
    agentId: string,
    params: { page?: number; limit?: number; sortOrder?: "asc" | "desc" } = {}
  ): Promise<{ summaries: CallSummary[]; pagination?: any }> {
    try {
      const { page = 1, limit = 10, sortOrder = "desc" } = params;
      const response: AxiosResponse<{
        success: boolean;
        data: { summaries: CallSummary[] };
        meta?: { pagination?: any };
      }> = await apiClient.get(`/summaries/agent/${agentId}`, {
        params: { page, limit, sortOrder },
      });

      if (response.data.success) {
        return {
          summaries: response.data.data?.summaries || [],
          pagination: response.data.meta?.pagination,
        };
      }
      return { summaries: [] };
    } catch (error: any) {
      console.error("Error fetching agent call summaries:", error);
      throw error;
    }
  }

  // Leads captured for an agent — separate from /summaries: this is lead-management data
  // (status, tags, qualification), not the AI-generated per-call summary.
  async getLeadsForAgent(agentId: string): Promise<any> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: any;
        message?: string;
      }> = await apiClient.get(`/leads/agent/${agentId}`);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || "Failed to fetch leads");
    } catch (error: any) {
      console.error("Error fetching leads:", error);
      throw error;
    }
  }

  // Widget Configuration API
  async saveWidgetConfig(widgetData: {
    agent_id: string;
    company_logo?: string;
    trigger_button_image?: string;
    ai_employee_name: string;
    ai_employee_description: string;
    theme?: string;
    position?: string;
    button_text?: string;
    welcome_message?: string;
    primary_color?: string;
    gradient_start?: string;
    gradient_end?: string;
    visibility?: 'public' | 'private';
    allowed_domains?: string[];
  }): Promise<any> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: any;
        message?: string;
      }> = await apiClient.post(`/widgets`, widgetData); // Assuming PUT for saving configuration

      return response.data;
    } catch (error: any) {
      console.error("Error saving widget configuration:", error);
      throw error;
    }
  }

  // Logo Upload API
  async uploadLogo(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const response = await apiClient.post("/upload/logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      throw error;
    }
  }

  // Create agent with full payload (includes voice_speed, voice_style, template, knowledge base URLs)
  async createAgentFull(agentData: Record<string, any>): Promise<any> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: any;
        message?: string;
      }> = await voiceApiClient.post("/agents/create-agent", agentData, { timeout: 0 });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || "Failed to create agent");
    } catch (error: any) {
      console.error("Error creating agent (full):", error);
      throw error;
    }
  }

  // ── TTS voice catalog ────────────────────────────────────────────────────
  // Control-plane only — call once after login and cache the result. Never
  // call this during token issuance or a live call.
  private voiceCatalogPromise: Promise<VoiceCatalog> | null = null;

  async getVoiceCatalog(options?: { provider?: TtsProviderId; forceRefresh?: boolean }): Promise<VoiceCatalog> {
    // Only cache the unfiltered (all-providers) fetch — a provider-scoped
    // fetch always hits the network fresh.
    if (!options?.provider && !options?.forceRefresh && this.voiceCatalogPromise) {
      return this.voiceCatalogPromise;
    }

    const request = (async () => {
      try {
        const response: AxiosResponse<{
          success: boolean;
          data: VoiceCatalog;
        }> = await apiClient.get("/voice/catalog", {
          params: options?.provider ? { provider: options.provider } : undefined,
        });

        if (response.data.success && response.data.data) {
          return response.data.data;
        }
        throw new Error("Failed to load voice catalog");
      } catch (error: any) {
        console.error("Error fetching voice catalog:", error);
        throw error;
      }
    })();

    if (!options?.provider) {
      this.voiceCatalogPromise = request;
      // Don't cache a rejected promise — let the next call retry.
      request.catch(() => { this.voiceCatalogPromise = null; });
    }

    return request;
  }

  // Generate AI Prompt API - with extended timeout for AI generation
  async generatePrompt(prompt: string): Promise<any> {
    try {
      const response = await apiClient.post("/generate-prompt/generate", {
        prompt,
      }, {
        timeout: 120000, // 2 minutes timeout for AI generation
      });
      return response.data;
    } catch (error: any) {
      console.error("Error generating prompt:", error);
      throw error;
    }
  }

  // Generate Presigned URL for knowledge base file editing
  async getPresignedUrl(agentId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      presignedUrl: string;
      downloadUrl: string;
    };
  }> {
    try {
      const response = await apiClient.get(`/agents/${agentId}/presigned-url`);
      return response.data;
    } catch (error: any) {
      console.error("Error getting presigned URL:", error);
      throw error;
    }
  }

  // Knowledge Base Upload API
  async uploadKnowledgeBase(files: File[]): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      files: Array<{
        filename: string;
        size: number;
        url: string;
      }>;
      count: number;
    };
  }> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      const response = await apiClient.post("/agents/upload/knowledge-bases", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 1 minute timeout for file uploads
      });
      return response.data;
    } catch (error: any) {
      console.error("Error uploading knowledge base files:", error);
      throw error;
    }
  }
}

export const agentAPI = new AgentAPI();

// Export convenience functions
export const publishAgent = (agentId: string): Promise<PublicationResponse> =>
  agentAPI.publishAgent(agentId);

export const unpublishAgent = (agentId: string): Promise<PublicationResponse> =>
  agentAPI.unpublishAgent(agentId);
