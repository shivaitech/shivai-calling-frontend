import axios, { AxiosResponse } from "axios";

const API_BASE_URL = "https://shivai-com-backend.onrender.com/api/v1";

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
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

interface OnboardingRequest {
  company_basics: {
    name: string;
    industry: string;
    description: string;
    website: string;
    primary_region: string;
    business_processes: string[];
    headquarters_address: {
      city: string;
      state_province: string;
      country: string;
    };
    time_zone: string;
    primary_phone: string;
    primary_contact: {
      name: string;
      email: string;
      phone: string;
      title: string;
    };
  };
  plan_details: {
    type: string;
    ai_employee_limit: number;
    monthly_price: number;
    features: string[];
  };
  ai_employees: Array<{
    name: string;
    type: string;
    preferred_language: string;
    voice_gender: string;
    personality_traits: string[];
    specialization: string;
  }>;
  knowledge_sources: {
    website_url: string;
    social_links: {
      linkedin?: string;
      twitter?: string;
      facebook?: string;
    };
    uploaded_files: Array<{
      id: string;
      filename: string;
      original_name: string;
      file_type: string;
      file_size: number;
      upload_date: string;
      file_path: string;
      file_url: string;
    }>;
    faqs_text: string;
    additional_context: string;
  };
  instructions: {
    dos: string[];
    donts: string[];
    escalation_rules: Array<{
      condition: string;
      action: string;
      priority: string;
      notify_contacts: string[];
    }>;
    fallback_contacts: Array<{
      name: string;
      email: string;
      phone: string;
      role: string;
      availability: string;
    }>;
    tone_guidelines: string;
    response_style: string;
  };
  targets: {
    primary_goals: string[];
    success_metrics: Array<{
      metric_name: string;
      target_value: string;
      measurement_period: string;
      description: string;
    }>;
    kpis: string[];
    target_response_time: number;
    quality_threshold: number;
  };
  deployment_targets: {
    channels: string[];
    priority_channel: string;
    integration_requirements: string[];
    custom_requirements: string;
  };
  deployment_service: {
    service_type: string;
    requires_access: boolean;
    access_details: {
      platforms: string[];
      access_type: string;
      credentials_required: boolean;
      additional_info: string;
    };
    timeline_preference: string;
    technical_contact: {
      name: string;
      email: string;
      phone: string;
      role: string;
      availability: string;
    };
  };
  consent_options: {
    recording_enabled: boolean;
    transcript_email_optin: boolean;
    data_retention_period: number;
    privacy_preferences: string[];
    gdpr_compliance: boolean;
  };
  billing_contact: {
    name: string;
    email: string;
    phone: string;
    company_role: string;
    billing_address: {
      street: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  shivai_team_notes: {
    internal_notes: string;
    priority_level: string;
    assigned_team_member: string;
    special_requirements: string[];
    follow_up_date: string;
    tags: string[];
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

export const authAPI = {
  // Health check
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

  // User endpoints
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
  createOnboarding: (data: OnboardingRequest): Promise<OnboardingResponse> =>
    apiClient.post("/onboarding/create", data).then((res) => {
      console.log("Onboarding response:", res.data);
      return res.data;
    }),

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
};
