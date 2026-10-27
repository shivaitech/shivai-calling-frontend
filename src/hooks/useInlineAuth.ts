import React, { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

/** Read by GoogleCallback so OAuth sign-in returns to the page that started it. */
export const POST_AUTH_RETURN_KEY = "post_auth_return";

/**
 * State + handlers for the main site's sign-in / sign-up modal (AuthModel), for
 * pages that show it inline instead of Landing.
 *   const auth = useInlineAuth({ googleReturn: "/some/path", onSuccess: () => ... });
 *   <AuthModel {...auth.modalProps} />   when auth.showAuthModal
 */
export function useInlineAuth(opts: { onSuccess: () => void; googleReturn: string }) {
  const { login, register, completeOnboarding, getGoogleAuthUrl, isLoading, error, clearError } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "", name: "" });

  // Always call the latest onSuccess without re-creating handlers.
  const onSuccessRef = useRef(opts.onSuccess);
  onSuccessRef.current = opts.onSuccess;

  useEffect(() => {
    if (!showAuthModal) {
      setFormData({ email: "", password: "", name: "", confirmPassword: "" });
      clearError();
    }
  }, [showAuthModal, clearError]);

  /** `prefill`: details the visitor already typed elsewhere (e.g. their card) — only the password is left to enter. */
  const open = useCallback((mode: "signin" | "signup", prefill?: { name?: string; email?: string }) => {
    if (prefill) {
      setFormData((f) => ({
        ...f,
        name: mode === "signup" ? prefill.name?.trim() || f.name : f.name,
        email: prefill.email?.trim() || f.email,
      }));
    }
    setAuthMode(mode);
    setShowAuthModal(true);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFieldErrors({});
    try {
      if (authMode === "signup") {
        await register(formData.name, formData.email, formData.password, formData.confirmPassword);
        completeOnboarding();
        toast.success("Account created successfully! Welcome aboard.");
      } else {
        const response = await login(formData.email, formData.password);
        localStorage.setItem("auth_tokens", JSON.stringify(response.tokens));
        localStorage.setItem("auth_user", JSON.stringify(response.user));
      }
      setShowAuthModal(false);
      onSuccessRef.current();
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const next: Record<string, string> = {};
        err.response.data.errors.forEach((item: any) => {
          next[item.field] = item.message;
        });
        setFieldErrors(next);
      }
      throw err;
    }
  };

  const handleSocialAuth = async (provider: string) => {
    if (provider !== "google") return;
    try {
      // Google sends the user away and back through /auth/google/callback.
      sessionStorage.setItem(POST_AUTH_RETURN_KEY, opts.googleReturn);
      window.location.href = await getGoogleAuthUrl();
    } catch {
      sessionStorage.removeItem(POST_AUTH_RETURN_KEY);
    }
  };

  return {
    showAuthModal,
    setShowAuthModal,
    setAuthMode,
    open,
    modalProps: {
      closeModal: () => setShowAuthModal(false),
      authMode,
      setAuthMode,
      error,
      handleAuth,
      handleSocialAuth,
      formData,
      setFormData,
      showPassword,
      setShowPassword,
      isLoading,
      fieldErrors,
    },
  };
}
