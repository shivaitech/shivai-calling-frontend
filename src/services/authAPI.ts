import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = 'https://shivai-com-backend.onrender.com/api/v1';

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

// Create axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('auth_tokens');
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
        const tokens = localStorage.getItem('auth_tokens');
        if (tokens) {
          const { refreshToken } = JSON.parse(tokens);
          const response = await authAPI.refreshToken(refreshToken);
          
          localStorage.setItem('auth_tokens', JSON.stringify(response.tokens));
          originalRequest.headers.Authorization = `Bearer ${response.tokens.accessToken}`;
          
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('auth_tokens');
        window.location.href = '/landing';
      }
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Health check
  healthCheck: (): Promise<AxiosResponse> => 
    apiClient.get('/health'),

  // Authentication endpoints
  login: (data: LoginRequest): Promise<AuthResponse> =>
    apiClient.post('/auth/login', data).then(res => res.data.data),

  register: (data: RegisterRequest): Promise<AuthResponse> =>
    apiClient.post('/auth/register', data).then(res => res.data.data),

  googleAuth: (data: GoogleAuthRequest): Promise<AuthResponse> =>
    apiClient.post('/auth/google', data).then(res => res.data.data),

  getGoogleAuthUrl: (): Promise<{ authUrl: string }> =>
    apiClient.get('/auth/google/url').then(res => res.data.data),

  refreshToken: (refreshToken: string): Promise<{ tokens: any }> =>
    apiClient.post('/auth/refresh-token', { refreshToken }).then(res => res.data.data),

  logout: (accessToken: string): Promise<void> =>
    apiClient.post('/auth/logout', {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then(() => {}),

  // User endpoints
  getCurrentUser: (accessToken: string): Promise<{ user: any }> =>
    apiClient.get('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then(res => res.data.data),

  getUserProfile: (): Promise<{ user: any }> =>
    apiClient.get('/users/profile').then(res => res.data.data),

  updateProfile: (data: any): Promise<{ user: any }> =>
    apiClient.put('/users/profile', data).then(res => res.data.data),
};
