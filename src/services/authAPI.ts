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
};
