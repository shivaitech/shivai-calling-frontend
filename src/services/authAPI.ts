import axios, { AxiosResponse } from "axios";
import type {
  GoogleSheetsIntegrationConfig,
  GoogleSheetsIntegrationPayload,
  DiscoverGoogleSheetsResult,
  StandaloneSheetResult,
} from "../ClientDashboard/GoogleSheets/sheetTypes";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


export interface SheetColumn {
  header: string;
  field: string;
  required: boolean;
  ask_as?: string;
  prefix?: string;
  role?: 'caller' | 'system' | 'internal' | 'tracking';
  auto_classify?: boolean;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface GoogleAuthRequest {
  code: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    profilePicture?: string;
    emailVerified: boolean;
    isOnboarded: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  codeVerified?: boolean;
  onboarding?: {
    _id: string;
  };
}

interface OnboardingRequest {
  company_basics: {
    name?: string;
    phone?: string;
    company_size?: string;
    company_email?: string;
    company_phone?: string;
    website?: string;
    linkedin_profile?: string;
    description?: string;
    industry?: string[];
    business_regions?: {
      countries?: string[];
      states?: string[];
      cities?: string[];
    };
    primary_region?: {
      countries?: string[];
      states?: string[];
      cities?: string[];
    };
  };
  plan_details: {
    type: string;
    ai_employee_limit: number;
    monthly_price?: number;
    features?: string[];
    billing_contact?: {
      name: string;
      email: string;
      phone: string;
      company_name?: string;
    };
    billing_address?: {
      street: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  ai_employees?: Array<{
    name: string;
    type: string;
    template?: string;
    preferred_language: string;
    voice_gender: string;
    agent_personality?: string;
    voice_style?: string;
    special_instructions?: string;
    workflows?: Array<{
      name: string;
      instruction: string;
    }>;
  }>;
  knowledge_sources?: {
    website_url?: string;
    social_links?: {
      linkedin?: string;
      twitter?: string;
      facebook?: string;
    };
    uploaded_files?: Array<{
      id: string;
      filename: string;
      original_name: string;
      file_type: string;
      file_size: number;
      upload_date: string;
      file_path: string;
      file_url: string;
      s3_key: string;
    }>;
    faqs_text?: string;
  };
  instructions?: {
    dos_and_donts?: string;
    fallback_contacts?: string;
  };
  targets?: {
    success_goals?: string;
    success_metrics?: string;
  };
  deployment_targets?: {
    channels?: string[];
    deployment_notes?: string;
  };
  deployment_service?: {
    service_type: string;
  };
  consent_options?: {
    recording_enabled: boolean;
    transcript_email_optin: boolean;
    privacy_notes?: string;
  };
}

interface OnboardingResponse {
  success: boolean;
  onboarding_id: string;
  message: string;
  data: {
    company_id: string;
    ai_employees_created: number;
    deployment_timeline: string;
    next_steps: string[];
  };
}

// Create axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem("auth_tokens");
    if (tokens) {
      const { accessToken } = JSON.parse(tokens);
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = localStorage.getItem("auth_tokens");
        if (tokens) {
          const { refreshToken } = JSON.parse(tokens);
          const response = await authAPI.refreshToken(refreshToken);

          localStorage.setItem("auth_tokens", JSON.stringify(response.tokens));
          originalRequest.headers.Authorization = `Bearer ${response.tokens.accessToken}`;

          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem("auth_tokens");
        window.location.href = "/landing";
      }
    }

    return Promise.reject(error);
  }
);

export type ZohoConnectionStatus = 'active' | 'expired' | 'revoked' | null;

export interface ZohoConnection {
  connected: boolean;
  status: ZohoConnectionStatus;
  apiDomain: string | null;
  scopes: string[];
  expiresAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export const ZOHO_DATA_CENTERS: { id: string; label: string }[] = [
  { id: 'in', label: 'India (.in)' },
  { id: 'com', label: 'United States (.com)' },
  { id: 'eu', label: 'Europe (.eu)' },
  { id: 'au', label: 'Australia (.au)' },
  { id: 'jp', label: 'Japan (.jp)' },
  { id: 'ca', label: 'Canada (.ca)' },
  { id: 'sa', label: 'Saudi Arabia (.sa)' },
  { id: 'cn', label: 'China (.cn)' },
];

export type GoogleCalendarConnectionStatus = 'active' | 'expired' | 'revoked' | null;

export interface GoogleCalendarConnection {
  connected: boolean;
  status: GoogleCalendarConnectionStatus;
  email: string | null;
  googleAccountId: string | null;
  scopes: string[];
  expiresAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// ── Google Calendar events (/api/v1/calendar) ───────────────────────────────
// Separate from OAuth connect/status/disconnect above — these read/write actual
// events on the connected Google account. Calendar must be connected first.

export type CalendarSendUpdates = 'all' | 'externalOnly' | 'none';

export interface CalendarEventDateTime {
  dateTime: string | null;
  date: string | null;
  timeZone: string | null;
}

export interface CalendarAttendee {
  email: string | null;
  displayName: string | null;
  responseStatus: string | null;
}

export interface CalendarEvent {
  id: string | null;
  calendarId: string;
  status: string | null;
  htmlLink: string | null;
  summary: string | null;
  description: string | null;
  location: string | null;
  start: CalendarEventDateTime | null;
  end: CalendarEventDateTime | null;
  attendees: CalendarAttendee[];
  created: string | null;
  updated: string | null;
}

export interface ListCalendarEventsParams {
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  pageToken?: string;
  q?: string;
}

export interface CreateCalendarEventPayload {
  summary: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  timeZone?: string;
  calendarId?: string;
  attendees?: string[];
  sendUpdates?: CalendarSendUpdates;
}

export interface UpdateCalendarEventPayload {
  calendarId?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: string;
  end?: string;
  timeZone?: string;
  attendees?: string[];
  sendUpdates?: CalendarSendUpdates;
}

export const authAPI = {
  healthCheck: (): Promise<AxiosResponse> => apiClient.get("/health"),
  login: (data: LoginRequest): Promise<AuthResponse> =>
    apiClient.post("/auth/login", data).then((res) => res.data.data),

  register: (data: RegisterRequest): Promise<AuthResponse> =>
    apiClient.post("/auth/register", data).then((res) => res.data.data),

  checkUser: (
    data: Omit<RegisterRequest, "fullName" | "confirmPassword">
  ): Promise<AuthResponse> =>
    apiClient.post("/auth/validate-email", data).then((res) => res.data.data),

  googleAuth: (data: GoogleAuthRequest): Promise<AuthResponse> =>
    apiClient.post("/auth/google", data).then((res) => res.data.data),

  getGoogleAuthUrl: (): Promise<{ authUrl: string }> =>
    apiClient.get("/auth/google/url").then((res) => res.data.data),

  refreshToken: (refreshToken: string): Promise<{ tokens: any }> =>
    apiClient
      .post("/auth/refresh-token", { refreshToken })
      .then((res) => res.data.data),

  logout: (accessToken: string): Promise<void> =>
    apiClient
      .post(
        "/auth/logout",
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      .then(() => {}),

  getCurrentUser: (accessToken: string): Promise<{ user: any }> =>
    apiClient
      .get("/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => res.data.data),

  getUserProfile: (): Promise<{ user: any }> =>
    apiClient.get("/users/profile").then((res) => res.data.data),

  updateProfile: (data: any): Promise<{ user: any }> =>
    apiClient.put("/users/profile", data).then((res) => res.data.data),

  checkEmailAvailability: (
    email: string,
    mode: "signin" | "signup"
  ): Promise<{ data: any }> =>
    apiClient
      .post("/auth/validate-email", { email, mode })
      .then((res) => res.data),

  validatePassword: (
    password: string,
    email?: string,
    mode?: string
  ): Promise<{
    isValid: boolean;
    requirements: {
      length: boolean;
      common: boolean;
      personal: boolean;
    };
  }> =>
    apiClient
      .post("/auth/validate-email", { password, email, mode })
      .then((res) => res.data.data),

  validateCredentials: (
    email: string,
    password: string
  ): Promise<{ valid: boolean }> =>
    apiClient
      .post("/auth/validate-credentials", { email, password })
      .then((res) => res.data.data),

  // Password reset endpoints
  requestPasswordReset: (email: string): Promise<{ message: string }> =>
    apiClient.post("/auth/forgot-password", { email }).then((res) => res.data),

  resetPassword: (
    token: string,
    password: string
  ): Promise<{ message: string }> =>
    apiClient
      .post("/auth/reset-password", { token, password })
      .then((res) => res.data),

  // Onboarding endpoints
  createOnboarding: (data: OnboardingRequest, token?: string): Promise<OnboardingResponse> => {
    const config: any = {};
    
    // Add Authorization header if token is provided
    if (token) {
      config.headers = {
        Authorization: `Bearer ${token}`
      };
    }
    
    return apiClient.post("/onboarding", data, config).then((res) => res.data);
  },

  // Save onboarding as draft
  saveDraftOnboarding: (data: OnboardingRequest, token?: string): Promise<OnboardingResponse> => {
    const config: any = {};
    
    // Add Authorization header if token is provided
    if (token) {
      config.headers = {
        Authorization: `Bearer ${token}`
      };
    }
    
    return apiClient.post("/onboarding?draft=true", data, config).then((res) => res.data);
  },

  getOnboardingStatus: (
    onboardingId: string
  ): Promise<{
    status: string;
    progress: number;
    current_step: string;
    estimated_completion: string;
  }> =>
    apiClient
      .get(`/onboarding/${onboardingId}/status`)
      .then((res) => res.data.data),

  updateOnboarding: (
    onboardingId: string,
    data: Partial<OnboardingRequest>
  ): Promise<OnboardingResponse> =>
    apiClient
      .put(`/onboarding/${onboardingId}`, data)
      .then((res) => res.data.data),

  getOnboardingHistory: (): Promise<
    Array<{
      id: string;
      company_name: string;
      created_date: string;
      status: string;
      ai_employees_count: number;
    }>
  > => apiClient.get("/onboarding/history").then((res) => res.data.data),

  // Code verification endpoint
  verifyOnboardingCode: (code: string, token?: string): Promise<{ 
    success: boolean; 
    valid?: boolean;
    statusCode: number;
    message: string;
    data?: {
      userId: string;
      code: string;
      isVerified: boolean;
      id: string;
      createdAt: string;
      updatedAt: string;
      verifiedAt: string | null;
    };
    meta?: {
      timestamp: string;
    };
  }> => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    return apiClient
      .post("/code-verify", { code }, config)
      .then((res) => res.data);
  },

  // Upload files endpoint
  uploadOnboardingFiles: (files: File[], token?: string): Promise<{
    success: boolean;
    message: string;
    data: {
      uploaded_files: Array<{
        id: string;
        filename: string;
        original_name: string;
        file_type: string;
        file_size: number;
        upload_date: string;
        file_path: string;
        file_url: string;
        s3_key: string;
      }>;
    };
  }> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const config: any = {
      headers: { 'Content-Type': 'multipart/form-data' }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return apiClient
      .post('/onboarding/upload-files', formData, config)
      .then((res) => res.data);
  },

  // ── Unified OAuth (new backend) ─────────────────────────────────────────────
  // Navigate directly so the server's 302 redirect to Google is followed
  // natively (Axios XHR cannot follow cross-origin redirects).

  connectGmail: (): void => {
    const tokens = localStorage.getItem('auth_tokens');
    const accessToken = tokens ? JSON.parse(tokens).accessToken : '';
    window.location.href = `${API_BASE_URL}/oauth/connect/google?token=${encodeURIComponent(accessToken)}`;
  },

  connectGoogleSheets: (): void => {
    const tokens = localStorage.getItem('auth_tokens');
    const accessToken = tokens ? JSON.parse(tokens).accessToken : '';
    window.location.href = `${API_BASE_URL}/oauth/connect/google?token=${encodeURIComponent(accessToken)}`;
  },

  // GET /oauth/status — returns all connected providers for the current user
  getOAuthStatus: (): Promise<{ provider: string; email?: string; status: string; credential_id?: string }[]> =>
    apiClient.get('/oauth/status').then(res => res.data?.data ?? res.data ?? []),

  // GET /integrations — list all integrations (optionally filter by service)
  getIntegrations: (serviceName?: string): Promise<any[]> =>
    apiClient
      .get('/integrations', { params: serviceName ? { service_name: serviceName } : undefined })
      .then(res => res.data?.data ?? res.data ?? []),

  // Fetch list of user's Google Sheets after OAuth (simple list)
  fetchGoogleSheets: (): Promise<{ id: string; name: string }[]> =>
    apiClient
      .get('/integrations/service/google_sheets/discover', { params: { ownedOnly: true } })
      .then(res => {
        const sheets: any[] = res.data?.data?.sheets ?? res.data?.sheets ?? [];
        return sheets.map(s => ({ id: s.sheet_id, name: s.sheet_name }));
      }),

  // Discover sheets in user's Drive (full metadata for link-existing flow)
  discoverGoogleSheets: (params?: {
    credentialId?: string;
    ownedOnly?: boolean;
  }): Promise<DiscoverGoogleSheetsResult> =>
    apiClient
      .get('/integrations/service/google_sheets/discover', {
        params: {
          credentialId: params?.credentialId,
          ownedOnly: params?.ownedOnly ?? true,
        },
      })
      .then(res => {
        const data = res.data?.data ?? res.data ?? {};
        return {
          credential_id: data.credential_id,
          email: data.email,
          sheets: data.sheets ?? [],
        };
      }),

  // ── Zoho CRM OAuth ───────────────────────────────────────────────────────────
  // Own route namespace (/auth/zoho/*), not the unified /oauth/* used by Google.
  // Connect is a two-step flow: an authenticated GET (Bearer header, via apiClient)
  // returns { authUrl }, then the browser is redirected there via a full-page
  // navigation (a plain fetch/XHR cannot follow Zoho's cross-origin login redirect).
  // Never call /auth/zoho/callback from the app; Zoho redirects the browser there
  // directly and the backend bounces the user back to the settings page.

  connectZoho: (dc: string = 'in'): Promise<void> =>
    apiClient.get('/auth/zoho/connect', { params: { dc } }).then(res => {
      const authUrl = res.data?.data?.authUrl ?? res.data?.authUrl;
      if (!authUrl) throw new Error('Zoho did not return an authorization URL');
      window.location.assign(authUrl);
    }),

  // GET /auth/zoho/status — current user's Zoho CRM connection state
  getZohoStatus: (): Promise<ZohoConnection> =>
    apiClient.get('/auth/zoho/status').then(res => {
      const data = res.data?.data ?? res.data ?? {};
      return (
        data.connection ?? {
          connected: false,
          status: null,
          apiDomain: null,
          scopes: [],
          expiresAt: null,
          createdAt: null,
          updatedAt: null,
        }
      );
    }),

  // DELETE /auth/zoho/disconnect — 404 if nothing is connected for this user
  disconnectZoho: (): Promise<void> =>
    apiClient.delete('/auth/zoho/disconnect').then(() => undefined),

  // ── Google Calendar OAuth ────────────────────────────────────────────────────
  // Own route namespace (/auth/gc/*). Google's authorized redirect URI is the
  // Gmail callback path (backend-only) — the backend detects the Calendar OAuth
  // state on that URL and saves Calendar tokens there. Never call
  // /gmail-auth/callback or /auth/gc/callback from the app.

  connectGoogleCalendar: (): void => {
    const tokens = localStorage.getItem('auth_tokens');
    const accessToken = tokens ? JSON.parse(tokens).accessToken : '';
    const url = new URL(`${API_BASE_URL}/auth/gc/connect`);
    url.searchParams.set('token', accessToken);
    window.location.assign(url.toString());
  },

  // GET /auth/gc/status — current user's Google Calendar connection state
  getGoogleCalendarStatus: (): Promise<GoogleCalendarConnection> =>
    apiClient.get('/auth/gc/status').then(res => {
      const data = res.data?.data ?? res.data ?? {};
      return (
        data.connection ?? {
          connected: false,
          status: null,
          email: null,
          googleAccountId: null,
          scopes: [],
          expiresAt: null,
          createdAt: null,
          updatedAt: null,
        }
      );
    }),

  // DELETE /auth/gc/disconnect — 404 if nothing is connected for this user
  disconnectGoogleCalendar: (): Promise<void> =>
    apiClient.delete('/auth/gc/disconnect').then(() => undefined),

  // ── Google Calendar events (/calendar/events) ─────────────────────────────
  // Requires Calendar to be connected (getGoogleCalendarStatus().connected === true).

  // GET /calendar/events — paginate with nextPageToken via params.pageToken
  listCalendarEvents: (
    params: ListCalendarEventsParams = {}
  ): Promise<{ calendarId: string; nextPageToken: string | null; events: CalendarEvent[] }> =>
    apiClient
      .get('/calendar/events', {
        params: {
          calendarId: params.calendarId,
          timeMin: params.timeMin,
          timeMax: params.timeMax,
          maxResults: params.maxResults,
          pageToken: params.pageToken,
          q: params.q,
        },
      })
      .then(res => {
        const data = res.data?.data ?? {};
        return {
          calendarId: data.calendarId || 'primary',
          nextPageToken: data.nextPageToken ?? null,
          events: Array.isArray(data.events) ? data.events : [],
        };
      }),

  // POST /calendar/events — summary, start, end required
  createCalendarEvent: (payload: CreateCalendarEventPayload): Promise<CalendarEvent> =>
    apiClient.post('/calendar/events', payload).then(res => res.data?.data?.event),

  // PUT /calendar/events/:eventId — partial update; send both start and end if changing time
  updateCalendarEvent: (eventId: string, payload: UpdateCalendarEventPayload): Promise<CalendarEvent> =>
    apiClient
      .put(`/calendar/events/${encodeURIComponent(eventId)}`, payload)
      .then(res => res.data?.data?.event),

  // DELETE /calendar/events/:eventId
  deleteCalendarEvent: (
    eventId: string,
    calendarId: string = 'primary',
    sendUpdates: CalendarSendUpdates = 'none'
  ): Promise<void> =>
    apiClient
      .delete(`/calendar/events/${encodeURIComponent(eventId)}`, { params: { calendarId, sendUpdates } })
      .then(() => undefined),

  // GET /integrations/agent/:agentId/service/:serviceName
  getAgentServiceIntegrations: (agentId: string, serviceName: string): Promise<any[]> =>
    apiClient
      .get(`/integrations/agent/${agentId}/service/${serviceName}`)
      .then(res => res.data?.data ?? res.data ?? []),

  // Create a standalone roster/directory sheet (no integration saved)
  createStandaloneSheet: (payload: {
    title: string;
    tab_name?: string;
    columns?: SheetColumn[];
    credential_id?: string;
  }): Promise<StandaloneSheetResult> =>
    apiClient
      .post('/integrations/sheets/create-standalone', payload)
      .then(res => res.data?.data ?? res.data),

  // Save the selected sheet for the user
  saveSelectedSheet: (sheetId: string, sheetName: string): Promise<any> =>
    apiClient
      .post('/oauth/sheets/select', { sheetId, sheetName })
      .then(res => res.data),

  // PUT /integrations/:id — replace integration fields (full config)
  updateIntegration: (integrationId: string, payload: {
    agent_id?: string;
    label?: string;
    config?: Partial<GoogleSheetsIntegrationPayload> & {
      google_sheets?: Partial<GoogleSheetsIntegrationConfig> & { assignment?: GoogleSheetsIntegrationConfig['assignment'] | null };
    };
  }): Promise<any> =>
    apiClient.put(`/integrations/${integrationId}`, payload).then(res => res.data?.data ?? res.data),

  // PATCH /integrations/:id — partial update (send only what changes)
  patchIntegration: (integrationId: string, payload: {
    agent_id?: string;
    label?: string;
    config?: {
      google_sheets?: Partial<GoogleSheetsIntegrationConfig> & {
        assignment?: GoogleSheetsIntegrationConfig['assignment'] | null;
      };
      timezone?: string;
    };
  }): Promise<any> =>
    apiClient.patch(`/integrations/${integrationId}`, payload).then(res => res.data?.data ?? res.data),

  // DELETE /integrations/:id — remove integration (sheet remains in Drive)
  deleteIntegration: (integrationId: string): Promise<void> =>
    apiClient.delete(`/integrations/${integrationId}`).then(() => undefined),

  // GET /integrations/sheets/:sheetId/columns — read header row from Google Sheet
  fetchSheetColumns: (
    sheetId: string,
    params?: { tab_name?: string; credential_id?: string },
  ): Promise<SheetColumn[]> =>
    apiClient
      .get(`/integrations/sheets/${sheetId}/columns`, {
        params: {
          tab_name: params?.tab_name,
          credential_id: params?.credential_id,
        },
      })
      .then(res => {
        const data = res.data?.data ?? res.data;
        return data?.columns ?? data ?? [];
      }),

  // POST /integrations — link an existing sheet to an agent
  createIntegration: (payload: {
    agent_id: string;
    service_name: string;
    label: string;
    credential_id?: string;
    config: GoogleSheetsIntegrationPayload;
  }): Promise<any> =>
    apiClient.post('/integrations', payload).then(res => res.data?.data ?? res.data),

  // Create a new Google Sheet linked to an agent
  createGoogleSheet: (payload: {
    agent_id: string;
    title: string;
    tab_name?: string;
    columns?: SheetColumn[];
    credential_id?: string;
  }): Promise<{
    sheet_id: string;
    sheet_name: string;
    web_view_link: string;
    columns: SheetColumn[];
    tab_gid?: number | string;
    gid?: number | string;
  }> =>
    apiClient
      .post('/integrations/sheets/create', payload)
      .then(res => res.data?.data ?? res.data),
};
