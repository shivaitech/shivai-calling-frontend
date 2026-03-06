export interface User {
  id: string;
  email: string;
  fullName: string;
  profilePicture?: string;
  emailVerified: boolean;
  company?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}
