import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import { authAPI } from "../services/authAPI";

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
  register: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<void>;
  completeOnboarding: () => void;
  checkUserEmailPass: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  getGoogleAuthUrl: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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
        const storedTokens = localStorage.getItem("auth_tokens");
        const storedUser = localStorage.getItem("auth_user");

        if (storedTokens && storedUser) {
          setTokens(JSON.parse(storedTokens));
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        localStorage.removeItem("auth_tokens");
        localStorage.removeItem("auth_user");
      }
    };

    initializeAuth();
  }, []);

  const clearError = () => setError(null);

  const googleAuth = async (code: string): Promise<void> => {
    if (isAuthenticating.current) {
      return;
    }

    if (authAbortController.current) {
      authAbortController.current.abort();
    }

    authAbortController.current = new AbortController();

    try {
      isAuthenticating.current = true;
      setIsLoading(true);
      setError(null);

      const response = await authAPI.googleAuth({
        code,
      });

      // Update state
      setUser(response.user);
      setTokens(response.tokens);

      localStorage.setItem("auth_tokens", JSON.stringify(response.tokens));
      localStorage.setItem("auth_user", JSON.stringify(response.user));
    } catch (err: any) {
      if (err.name === "AbortError") {
        return;
      }

      localStorage.removeItem("auth_tokens");
      localStorage.removeItem("auth_user");
      setUser(null);
      setTokens(null);

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Google authentication failed";
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
      localStorage.setItem("auth_tokens", JSON.stringify(response.tokens));
      localStorage.setItem("auth_user", JSON.stringify(response.user));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Login failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserEmailPass = async (
    email: string,
    password: string
  ): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.checkUser({
        email,
        password,
        // fullName: "",
        // confirmPassword: password // Or provide correct confirmPassword
      });
      setUser(response.user);
      setTokens(response.tokens);
      localStorage.setItem("auth_tokens", JSON.stringify(response.tokens));
      localStorage.setItem("auth_user", JSON.stringify(response.user));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "User check failed";
      setError(errorMessage);
      setUser(null);
      setTokens(null);
      localStorage.removeItem("auth_tokens");

      localStorage.removeItem("auth_user");
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const registerData = {
        fullName: name,
        email,
        password,
        confirmPassword,
      };

      const response = await authAPI.register(registerData);

      localStorage.setItem("pending_auth_tokens", JSON.stringify(response.tokens));
      localStorage.setItem("pending_auth_user", JSON.stringify(response.user));
    } catch (err: any) {
      console.error("Registration error details:", err.response);

      // Handle different error types
      if (err.response?.status === 422) {
        // Don't set general error for validation - let Landing component handle field errors
        const errorMessage =
          err.response?.data?.message || err.message || "Registration failed";
        setError(errorMessage);
      } else {
        const errorMessage =
          err.response?.data?.message || err.message || "Registration failed";
        setError(errorMessage);
      }

      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = () => {
    const pendingTokens = localStorage.getItem("pending_auth_tokens");
    const pendingUser = localStorage.getItem("pending_auth_user");

    if (pendingTokens && pendingUser) {
      const tokens = JSON.parse(pendingTokens);
      const user = JSON.parse(pendingUser);

      setUser(user);
      setTokens(tokens);
      localStorage.setItem("auth_tokens", JSON.stringify(tokens));
      localStorage.setItem("auth_user", JSON.stringify(user));

      localStorage.removeItem("pending_auth_tokens");
      localStorage.removeItem("pending_auth_user");
    }
  };

  const logout = () => {
    if (authAbortController.current) {
      authAbortController.current.abort();
    }

    setUser(null);
    setTokens(null);
    setError(null);
    isAuthenticating.current = false;

    localStorage.removeItem("auth_tokens");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("pending_auth_tokens");
    localStorage.removeItem("pending_auth_user");
  };

  const getGoogleAuthUrl = async (): Promise<string> => {
    try {
      setError(null);
      const response = await authAPI.getGoogleAuthUrl();
      return response.authUrl;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to get Google auth URL";
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
    completeOnboarding,
    logout,
    clearError,
    getGoogleAuthUrl,
    checkUserEmailPass,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
