import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { authAPI } from '../services/authAPI';

interface User {
  id: string;
  email: string;
  fullName: string;
  profilePicture?: string;
  emailVerified: boolean;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: User | null;
  tokens: Tokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  googleAuth: (code: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  getGoogleAuthUrl: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to prevent concurrent requests without causing re-renders
  const isAuthenticating = useRef(false);
  const authAbortController = useRef<AbortController | null>(null);

  // Check if user is authenticated
  const isAuthenticated = !!(user && tokens);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedTokens = localStorage.getItem('auth_tokens');
        const storedUser = localStorage.getItem('auth_user');
        
        if (storedTokens && storedUser) {
          setTokens(JSON.parse(storedTokens));
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to initialize auth state:', error);
        // Clear invalid stored data
        localStorage.removeItem('auth_tokens');
        localStorage.removeItem('auth_user');
      }
    };

    initializeAuth();
  }, []);

  const clearError = () => setError(null);

  const googleAuth = async (code: string): Promise<void> => {
    // Prevent concurrent authentication requests
    if (isAuthenticating.current) {
      console.log('Authentication already in progress, skipping duplicate request');
      return;
    }

    // Cancel any previous auth request
    if (authAbortController.current) {
      authAbortController.current.abort();
    }

    // Create new abort controller for this request
    authAbortController.current = new AbortController();

    try {
      isAuthenticating.current = true;
      setIsLoading(true);
      setError(null);
      
      console.log('AuthContext: Starting Google authentication');
      
      const response = await authAPI.googleAuth({ 
        code 
      }, { 
        signal: authAbortController.current.signal 
      });
      
      console.log('AuthContext: Google authentication successful');
      
      // Update state
      setUser(response.user);
      setTokens(response.tokens);
      
      // Persist to localStorage
      localStorage.setItem('auth_tokens', JSON.stringify(response.tokens));
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      
    } catch (err: any) {
      // Don't handle aborted requests as errors
      if (err.name === 'AbortError') {
        console.log('AuthContext: Google auth request was cancelled');
        return;
      }
      
      console.error('AuthContext: Google authentication failed:', err);
      
      // Clear any stored auth data on failure
      localStorage.removeItem('auth_tokens');
      localStorage.removeItem('auth_user');
      setUser(null);
      setTokens(null);
      
      const errorMessage = err.response?.data?.message || err.message || 'Google authentication failed';
      setError(errorMessage);
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
      isAuthenticating.current = false;
      authAbortController.current = null;
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authAPI.login({ email, password });
      
      setUser(response.user);
      setTokens(response.tokens);
      localStorage.setItem('auth_tokens', JSON.stringify(response.tokens));
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (registerData: any): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authAPI.register(registerData);
      
      setUser(response.user);
      setTokens(response.tokens);
      localStorage.setItem('auth_tokens', JSON.stringify(response.tokens));
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Cancel any ongoing auth request
    if (authAbortController.current) {
      authAbortController.current.abort();
    }
    
    // Clear state
    setUser(null);
    setTokens(null);
    setError(null);
    isAuthenticating.current = false;
    
    // Clear localStorage
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('auth_user');
    
    console.log('AuthContext: User logged out');
  };

  const getGoogleAuthUrl = async (): Promise<string> => {
    try {
      setError(null);
      const response = await authAPI.getGoogleAuthUrl();
      return response.authUrl;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to get Google auth URL';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    isLoading,
    isAuthenticated,
    error,
    googleAuth,
    login,
    register,
    logout,
    clearError,
    getGoogleAuthUrl
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
