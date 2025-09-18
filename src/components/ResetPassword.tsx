import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Mic,
  XCircle,
} from "lucide-react";
import { FORGOT_PASSWORD_MESSAGES } from "../constants/forgotPassword";
import { authAPI } from "../services/authAPI";
import axios from "axios";

interface ResetPasswordProps {
  token?: string;
  onSuccess?: () => void;
  onRequestNewLink?: () => void;
  onSubmit?: (token: string, password: string) => Promise<void>;
}

interface PasswordRequirements {
  length: boolean;
  letter: boolean;
  number: boolean;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({
  token: propToken,
  onSuccess,
  onRequestNewLink,
  onSubmit,
}) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Get token from props or URL query params
  const token = useMemo(() => {
    if (propToken) return propToken;
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("token") || "";
  }, [propToken]);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError(
        "Invalid or missing reset token. Please request a new reset link."
      );
    }
  }, [token]);

  // Optimized password validation with memoization
  const requirements = useMemo(() => {
    return {
      length: password.length >= 8,
      letter: /[a-zA-Z]/.test(password),
      number: /[0-9]/.test(password),
    };
  }, [password]);

  const isPasswordValid = useMemo(() => {
    return Object.values(requirements).every(Boolean);
  }, [requirements]);

  const doPasswordsMatch = useMemo(() => {
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const renderRequirement = (
    met: boolean,
    label: string,
    isActive: boolean
  ) => (
    <div key={label} className="flex items-center space-x-1.5">
      {met ? (
        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <span
          className={`w-3.5 h-3.5 flex items-center justify-center ${
            isActive ? "text-red-500" : "text-gray-300"
          }`}
        >
          {isActive ? <XCircle className="w-3.5 h-3.5" /> : "•"}
        </span>
      )}
      <span
        className={`text-xs ${
          met ? "text-emerald-600" : isActive ? "text-red-600" : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("Invalid reset token. Please request a new reset link.");
      return;
    }

    if (!password) {
      setError(FORGOT_PASSWORD_MESSAGES.reset.errors.password_required);
      return;
    }

    if (!confirmPassword) {
      setError(FORGOT_PASSWORD_MESSAGES.reset.errors.confirm_required);
      return;
    }

    if (!isPasswordValid) {
      if (!requirements.length) {
        setError(FORGOT_PASSWORD_MESSAGES.reset.errors.too_short);
      } else if (!requirements.letter) {
        setError(FORGOT_PASSWORD_MESSAGES.reset.errors.no_letters);
      } else if (!requirements.number) {
        setError(FORGOT_PASSWORD_MESSAGES.reset.errors.no_numbers);
      }
      return;
    }

    if (!doPasswordsMatch) {
      setError(FORGOT_PASSWORD_MESSAGES.reset.errors.mismatch);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(
        "https://shivai-com-backend.onrender.com/api/v1/auth/reset-password",
        {
          token: token,
          newPassword: password,
          confirmPassword: password,
        }
      );
      if (data.success) {
        setIsSuccess(true);
        // Call success callback if provided, otherwise redirect
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        } else {
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
        }
      }
    } catch (err: any) {
      console.error("Reset password error:", err);

      if (err.response?.status === 400 || err.response?.status === 410) {
        setError(FORGOT_PASSWORD_MESSAGES.reset.errors.token_invalid);
      } else if (err.response?.status === 404) {
        setError(FORGOT_PASSWORD_MESSAGES.reset.errors.token_invalid);
      } else {
        setError(FORGOT_PASSWORD_MESSAGES.reset.errors.server);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestNewLink = () => {
    if (onRequestNewLink) {
      onRequestNewLink();
    } else {
      window.location.href = "/forgot-password";
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Password updated!
            </h2>
            <p className="text-sm text-gray-600">
              {FORGOT_PASSWORD_MESSAGES.reset.success}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {FORGOT_PASSWORD_MESSAGES.reset.title}
            </h2>
            <p className="text-sm text-gray-600">
              {FORGOT_PASSWORD_MESSAGES.reset.subtitle}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {FORGOT_PASSWORD_MESSAGES.reset.password_label}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm pr-20 ${
                    password && !isPasswordValid
                      ? "border-red-500"
                      : password && isPasswordValid
                      ? "border-emerald-500"
                      : "border-gray-300"
                  }`}
                  placeholder={
                    FORGOT_PASSWORD_MESSAGES.reset.password_placeholder
                  }
                  disabled={isLoading}
                  autoFocus
                />
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                  {password &&
                    (isPasswordValid ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {password && (
                <div className="mt-2 space-y-1">
                  {FORGOT_PASSWORD_MESSAGES.requirements.map((req) =>
                    renderRequirement(
                      requirements[req.id as keyof PasswordRequirements],
                      req.label,
                      password.length > 0 &&
                        !requirements[req.id as keyof PasswordRequirements]
                    )
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {FORGOT_PASSWORD_MESSAGES.reset.confirm_label}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm pr-10 ${
                    confirmPassword && !doPasswordsMatch
                      ? "border-red-500"
                      : confirmPassword && doPasswordsMatch
                      ? "border-emerald-500"
                      : "border-gray-300"
                  }`}
                  placeholder={
                    FORGOT_PASSWORD_MESSAGES.reset.confirm_placeholder
                  }
                  disabled={isLoading}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {confirmPassword &&
                    (doPasswordsMatch ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ))}
                </div>
              </div>
              {confirmPassword && !doPasswordsMatch && (
                <p className="mt-1 text-xs text-red-600">
                  {FORGOT_PASSWORD_MESSAGES.reset.errors.mismatch}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={
                isLoading ||
                !password ||
                !confirmPassword ||
                !isPasswordValid ||
                !doPasswordsMatch
              }
              className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                FORGOT_PASSWORD_MESSAGES.reset.submit_button
              )}
            </button>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => (window.location.href = "/")}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{FORGOT_PASSWORD_MESSAGES.reset.back_to_signin}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
