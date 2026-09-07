import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import { authAPI } from "../services/authAPI";
import { getMyProfile } from "../services/subTenantsAPI";

// Sub Tenants: a user optionally belongs to a tenant hierarchy (see
// src/permissions/types.ts). Both fields are optional so accounts with no
// tenant context (i.e. every account today, until the backend ships tenant
// support) behave exactly as before — no tenant means no restrictions.
export type TenantRole =
  | 'MAIN_OWNER'
  | 'MAIN_ADMIN'
  | 'MAIN_MEMBER'
  | 'SUBTENANT_OWNER'
  | 'SUBTENANT_MEMBER';

interface User {
  id: string;
  email: string;
  fullName: string;
  profilePicture?: string;
  emailVerified: boolean;
  company?: string;
  tenantId?: string;
  tenantRole?: TenantRole;
  parentTenantId?: string | null;
}

// localStorage key holding the signed-in user's resolved permission grant map
// (from GET /users/profile). TenantPermissionsContext reads it so it doesn't
// re-fetch the profile after login already did.
export const TENANT_GRANTS_STORAGE_KEY = "tenant_grants";

// Enrich the login user with tenant context resolved from GET /users/profile:
// sub-tenants get a SUBTENANT role + their parent's id as tenantId so
// usePermission() gates them; everyone else stays a fail-open MAIN role.
const enrichUserFromProfile = (baseUser: User, profile: Awaited<ReturnType<typeof getMyProfile>>): User => {
  if (!profile.isSubTenant) {
    return { ...baseUser, tenantRole: baseUser.tenantRole ?? "MAIN_OWNER" };
  }
  const parentTenantId = profile.user?.parentTenantId ?? profile.permission?.tenantId ?? null;
  return {
    ...baseUser,
    parentTenantId,
    // A truthy tenantId + SUBTENANT role is what switches usePermission() into
    // deny-by-default. Use the sub-tenant's own id as their tenant context.
    tenantId: String(baseUser.id),
    tenantRole: "SUBTENANT_MEMBER",
  };
};

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
  login: (email: string, password: string) => Promise<any>;
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
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Set to true initially to prevent premature redirects
  const [error, setError] = useState<string | null>(null);

  // Use ref to prevent concurrent requests without causing re-renders
  const isAuthenticating = useRef(false);
  const authAbortController = useRef<AbortController | null>(null);

  // Check if user is authenticated
  const isAuthenticated = !!(user && tokens);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      let hasSession = false;
      try {
        const storedTokens = localStorage.getItem("auth_tokens");
        const storedUser = localStorage.getItem("auth_user");

        if (storedTokens && storedUser) {
          setTokens(JSON.parse(storedTokens));
          setUser(JSON.parse(storedUser));
          hasSession = true;
        }
      } catch (error) {
        localStorage.removeItem("auth_tokens");
        localStorage.removeItem("auth_user");
      } finally {
        // Always set loading to false after initialization attempt
        setIsLoading(false);
      }

      // Re-resolve tenant context / permissions from /auth/me on every reload of
      // an authenticated session, so existing sessions (stored before this
      // resolution existed, or with stale grants) get enriched too. Best-effort.
      if (hasSession) {
        try {
          const storedUser = JSON.parse(localStorage.getItem("auth_user") || "null") as User | null;
          if (storedUser) {
            const profile = await getMyProfile();
            const enriched = enrichUserFromProfile(storedUser, profile);
            setUser(enriched);
            localStorage.setItem("auth_user", JSON.stringify(enriched));
            localStorage.setItem(TENANT_GRANTS_STORAGE_KEY, JSON.stringify(profile.grants));
          }
        } catch (profileErr) {
          console.error("Failed to refresh profile on init:", profileErr);
        }
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

      setTokens(response.tokens);
      localStorage.setItem("auth_tokens", JSON.stringify(response.tokens));

      // Resolve tenant context / permissions from the profile (same as login).
      let finalUser = response.user as User;
      try {
        const profile = await getMyProfile();
        finalUser = enrichUserFromProfile(response.user as User, profile);
        localStorage.setItem(TENANT_GRANTS_STORAGE_KEY, JSON.stringify(profile.grants));
      } catch (profileErr) {
        console.error("Failed to load profile after Google login:", profileErr);
        localStorage.removeItem(TENANT_GRANTS_STORAGE_KEY);
      }

      setUser(finalUser);
      localStorage.setItem("auth_user", JSON.stringify(finalUser));
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

  const login = async (email: string, password: string): Promise<any> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.login({ email, password });
      // Persist tokens first so the profile call below is authenticated.
      setTokens(response.tokens);
      localStorage.setItem("auth_tokens", JSON.stringify(response.tokens));

      // The login payload doesn't carry tenant context / permissions, so fetch
      // the signed-in user's profile to learn if they're a sub-tenant and what
      // they can access. Never let a profile hiccup block sign-in.
      let finalUser = response.user as User;
      try {
        const profile = await getMyProfile();
        finalUser = enrichUserFromProfile(response.user as User, profile);
        localStorage.setItem(TENANT_GRANTS_STORAGE_KEY, JSON.stringify(profile.grants));
      } catch (profileErr) {
        console.error("Failed to load profile after login:", profileErr);
        localStorage.removeItem(TENANT_GRANTS_STORAGE_KEY);
      }

      setUser(finalUser);
      localStorage.setItem("auth_user", JSON.stringify(finalUser));
      return { ...response, user: finalUser };
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

      localStorage.setItem(
        "pending_auth_tokens",
        JSON.stringify(response.tokens)
      );
      localStorage.setItem("pending_auth_user", JSON.stringify(response.user));
    } catch (err: any) {
      console.error("Registration error details:", err.response);

      if (err.response?.status === 422) {
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
    localStorage.removeItem(TENANT_GRANTS_STORAGE_KEY);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem("auth_user", JSON.stringify(updated));
      return updated;
    });
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
    updateUser,
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
