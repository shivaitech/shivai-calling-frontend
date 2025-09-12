import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/authAPI';

interface User {
  id: string;
  email: string;
  fullName: string;
  profilePicture?: string;
  emailVerified: boolean;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  googleAuth: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getGoogleAuthUrl: () => Promise<string>;
  clearError: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const savedTokens = localStorage.getItem('auth_tokens');
      if (savedTokens) {
        const parsedTokens = JSON.parse(savedTokens);
        setTokens(parsedTokens);
        
        // Verify token and get user data
        const userData = await authAPI.getCurrentUser(parsedTokens.accessToken);
        setUser(userData.user);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      localStorage.removeItem('auth_tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authAPI.login({ email, password });
      
      setUser(response.user);
      setTokens(response.tokens);
      localStorage.setItem('auth_tokens', JSON.stringify(response.tokens));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authAPI.register({
        fullName: name,
        email,
        password,
        confirmPassword
      });
      
      setUser(response.user);
      setTokens(response.tokens);
      localStorage.setItem('auth_tokens', JSON.stringify(response.tokens));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const googleAuth = async (code: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authAPI.googleAuth({ code });
      
      setUser(response.user);
      setTokens(response.tokens);
      localStorage.setItem('auth_tokens', JSON.stringify(response.tokens));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google authentication failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (tokens) {
        await authAPI.logout(tokens.accessToken);
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      setUser(null);
      setTokens(null);
      localStorage.removeItem('auth_tokens');
    }
  };

  const refreshToken = async () => {
    try {
      if (!tokens?.refreshToken) throw new Error('No refresh token available');
      
      const response = await authAPI.refreshToken(tokens.refreshToken);
      const newTokens = response.tokens;
      
      setTokens(newTokens);
      localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout(); // Force logout on refresh failure
    }
  };

  const getGoogleAuthUrl = async (): Promise<string> => {
    const response = await authAPI.getGoogleAuthUrl();
    return response.authUrl;
  };

  const clearError = () => setError(null);

  const value = {
    user,
    tokens,
    isLoading,
    isAuthenticated: !!user && !!tokens, // Real authentication check
    login,
    register,
    googleAuth,
    logout,
    refreshToken,
    getGoogleAuthUrl,
    clearError,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
