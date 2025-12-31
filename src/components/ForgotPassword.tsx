import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Mail,
  Mic,
  X,
  XCircle,
} from "lucide-react";
import { FORGOT_PASSWORD_MESSAGES } from "../constants/forgotPassword";
import { authAPI } from "../services/authAPI";
import { debounce } from "lodash";
import axios from "axios";
import "./AuthModel.css";

interface ForgotPasswordProps {
  onBack: () => void;
  onClose: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({
  onBack,
  onClose,
}) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [emailValidationError, setEmailValidationError] = useState<
    string | null
  >(null);

  // Simple email validation
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // API email validation with debouncing
  const debouncedValidateEmail = useCallback(
    debounce(async (email: string) => {
      if (!email || !isValidEmail(email)) {
        setEmailValidationError(null);
        return;
      }

      setIsValidatingEmail(true);
      setEmailValidationError(null);

      try {
        await authAPI.checkEmailAvailability(email, "signin");
        setEmailValidationError(null);
      } catch (error: any) {
        if (error.response?.status === 401) {
          const errorMessage = error.response?.data?.message;
          if (
            errorMessage &&
            errorMessage.toLowerCase().includes("email not found")
          ) {
            setEmailValidationError("Email is not registered");
          } else {
            setEmailValidationError("Unable to verify email");
          }
        } else {
          setEmailValidationError("Unable to verify email");
        }
      } finally {
        setIsValidatingEmail(false);
      }
    }, 500),
    []
  );

  // Trigger API validation when email changes
  useEffect(() => {
    debouncedValidateEmail(email);
    return () => debouncedValidateEmail.cancel();
  }, [email, debouncedValidateEmail]);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setError(null);
    // Clear validation error when user types
    if (emailValidationError) {
      setEmailValidationError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!email.trim()) {
      setError(FORGOT_PASSWORD_MESSAGES.request.errors.required);
      return;
    }

    if (!isValidEmail(email)) {
      setError(FORGOT_PASSWORD_MESSAGES.request.errors.invalid);
      return;
    }

    // Check if email validation failed
    if (emailValidationError) {
      setError(emailValidationError);
      return;
    }

    // Wait for any ongoing validation to complete
    if (isValidatingEmail) {
      setError("Please wait while we verify your email...");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await axios.post("https://nodejs.service.callshivai.com/api/v1/auth/forgot-password", { email });
      setIsSubmitted(true);
    } catch (err: any) {
      // Handle different error types
      if (err.response?.status === 429) {
      } else if (err.response?.status === 404) {
      } else {
        setError(FORGOT_PASSWORD_MESSAGES.request.errors.server);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Success state - shows generic message for security
  if (isSubmitted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Check your email
              </h2>
              <p className="text-sm text-gray-600">
                {FORGOT_PASSWORD_MESSAGES.request.success}
              </p>
            </div>

            <button
              onClick={onBack}
              className="auth-button auth-button-secondary"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{FORGOT_PASSWORD_MESSAGES.request.back_to_signin}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {FORGOT_PASSWORD_MESSAGES.request.title}
            </h2>
            <p className="text-sm text-gray-600">
              {FORGOT_PASSWORD_MESSAGES.request.subtitle}
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
              <label className="auth-label">
                {FORGOT_PASSWORD_MESSAGES.request.email_label}
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={`auth-input pr-10 ${
                    error || emailValidationError
                      ? "border-red-500"
                      : email &&
                        isValidEmail(email) &&
                        !emailValidationError &&
                        !isValidatingEmail
                      ? "border-black"
                      : ""
                  }`}
                  placeholder={
                    FORGOT_PASSWORD_MESSAGES.request.email_placeholder
                  }
                  disabled={isLoading}
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isValidatingEmail ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : email && isValidEmail(email) ? (
                    emailValidationError ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    )
                  ) : email && !isValidEmail(email) ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : null}
                </div>
              </div>

              {/* Show validation error if exists */}
              {emailValidationError && email && (
                <p className="auth-error">
                  {emailValidationError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={
                isLoading ||
                !email ||
                !isValidEmail(email) ||
                isValidatingEmail ||
                emailValidationError !== null
              }
              className="auth-button auth-button-primary"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isValidatingEmail ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking email...
                </span>
              ) : (
                FORGOT_PASSWORD_MESSAGES.request.submit_button
              )}
            </button>

            <button
              type="button"
              onClick={onBack}
              className=" auth-button-secondary"
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{FORGOT_PASSWORD_MESSAGES.request.back_to_signin}</span>
            </button>
          </form>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
