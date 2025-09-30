import { CheckCircle, Eye, EyeOff, Loader2, X, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  useEmailValidation,
  usePasswordValidation,
} from "../hooks/useAuthValidation";
import { debounce } from "lodash";
import { AUTH_MESSAGES } from "../constants/validation";
import ForgotPassword from "./ForgotPassword";
import "./AuthModel.css";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

interface AuthModelProps {
  authMode: "signin" | "signup";
  setAuthMode: (mode: "signin" | "signup") => void;
  error: string | null;
  closeModal: () => void;
  handleAuth: (e: React.FormEvent) => Promise<void>;
  handleSocialAuth: (provider: string) => Promise<void>;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  isLoading: boolean;
  fieldErrors: Record<string, string>;
}

const AuthModel: React.FC<AuthModelProps> = ({
  authMode,
  setAuthMode,
  error,
  closeModal,
  handleAuth,
  handleSocialAuth,
  formData,
  setFormData,
  showPassword,
  setShowPassword,
  isLoading,
  fieldErrors,
}) => {
  // Validation states using hooks
  const emailValidation = useEmailValidation(formData.email, authMode);
  const passwordValidation = usePasswordValidation(
    formData.password,
    formData.email,
    authMode
  );
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = React.useState<
    string | null
  >(null);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [shake, setShake] = useState(false);

  // Debounced validation function for signin only
  const debouncedValidateEmail = debounce(async (email: string) => {
    if (email && emailValidation.isValid && authMode === "signin") {
      setIsValidatingEmail(true);
      try {
        // const { data } = await checkUserEmailPass(email, formData.password);
        // if (!data?.error) {
        //   emailValidation.isValid = true;
        // }
      } catch (error) {
        setShake(true);
      }
      setIsValidatingEmail(false);
    }
  }, 500);

  // Handle shake animation reset
  useEffect(() => {
    if (shake) {
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [shake]);

  console.log("Field Errors:", authMode);

  // Validate confirm password
  useEffect(() => {
    if (authMode === "signup" && formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setConfirmPasswordError(AUTH_MESSAGES.error.password_mismatch);
      } else {
        setConfirmPasswordError(null);
      }
    }
  }, [formData.password, formData.confirmPassword, authMode]);

  // Render password requirement check
  const renderPasswordRequirement = (
    satisfied: boolean,
    label: string,
    isActive: boolean
  ) => (
    <div className="flex items-center space-x-1.5">
      {satisfied ? (
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
          satisfied
            ? "text-emerald-600"
            : isActive
            ? "text-red-600"
            : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );

  // Common reusable classes are defined in the style tag for consistency

  return (
    <div className="fixed inset-0 bg-black/50 auth-modal-backdrop z-50 flex items-center justify-center p-3 sm:p-6">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full relative ${
          authMode === "signup" ? "max-w-[600px]" : "max-w-[400px]"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-3 right-3 md:top-4 md:right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          disabled={isLoading}
        >
          <X className="w-4 md:w-5 h-4 md:h-5" />
        </button>

        <div className="px-6 py-14 sm:px-8 md:px-8 md:py-8">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-[36px] md:text-2xl font-[600] text-gray-900 mb-1 md:mb-2">
              {authMode === "signup" ? "Sign up" : "Sign in"}
            </h1>
            <p className="text-[14px] md:text-sm text-[#00000066]/60 font-[400]">
              {authMode === "signup"
                ? "Sign up with open account"
                : "Sign in with open account"}
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div
              className={`mb-4 md:mb-6 p-2 md:p-3 bg-red-50 border border-red-200 rounded-lg ${
                shake ? "animate-shake" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <XCircle className="w-3 md:w-4 h-3 md:h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs md:text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-3 md:space-y-4">
            {/* Name and Email Fields for Signup - Side by side on desktop */}
            {authMode === "signup" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* Name Field */}
                <div>
                  <label className="auth-label">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className={`auth-input ${
                      fieldErrors.fullName ? "border-red-500" : ""
                    }`}
                    placeholder="Enter your full name"
                    required
                    disabled={isLoading}
                  />
                  {fieldErrors.fullName && (
                    <p className="auth-error">{fieldErrors.fullName}</p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label className="auth-label">EMAIL</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        debouncedValidateEmail(e.target.value);
                      }}
                      className={`auth-input pr-10 ${
                        shake ? "animate-shake" : ""
                      } ${
                        emailValidation.error
                          ? "border-red-500"
                          : emailValidation.isValid
                          ? "border-black"
                          : ""
                      }`}
                      placeholder="Email"
                      required
                      disabled={isLoading}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isValidatingEmail ? (
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                      ) : emailValidation.error ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : emailValidation.isValid ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : null}
                    </div>
                  </div>
                  {emailValidation.error && (
                    <p className="auth-error">{emailValidation.error}</p>
                  )}
                </div>
              </div>
            ) : (
              /* Email Field for Signin - Full width */
              <div>
                <label className="auth-label">EMAIL</label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (authMode === "signin") {
                        debouncedValidateEmail(e.target.value);
                      }
                    }}
                    className={`auth-input pr-10 ${
                      shake ? "animate-shake" : ""
                    } ${
                      emailValidation.error
                        ? "border-red-500"
                        : emailValidation.isValid
                        ? "border-black"
                        : ""
                    }`}
                    placeholder="Email"
                    required
                    disabled={isLoading}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isValidatingEmail ? (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : emailValidation.error ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : emailValidation.isValid ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : null}
                  </div>
                </div>
                {emailValidation.error && (
                  <p className="auth-error">{emailValidation.error}</p>
                )}
              </div>
            )}

            {/* Password Fields - Side by side for signup on desktop */}
            {authMode === "signup" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* Password Field */}
                <div>
                  <label className="auth-label">PASSWORD</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className={`auth-input pr-10 ${
                        shake ? "animate-shake" : ""
                      } ${
                        passwordValidation.error
                          ? "border-red-500"
                          : passwordValidation.isValid
                          ? "border-black"
                          : ""
                      }`}
                      placeholder="Password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="mt-2 space-y-1">
                      {AUTH_MESSAGES.validation.password_requirements.map(
                        (req) =>
                          renderPasswordRequirement(
                            passwordValidation.requirements[req.id],
                            req.label,
                            formData.password.length > 0 &&
                              !passwordValidation.requirements[req.id]
                          )
                      )}
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="auth-label">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className={`auth-input pr-10 ${
                        confirmPasswordError
                          ? "border-red-500"
                          : formData.confirmPassword && !confirmPasswordError
                          ? "border-black"
                          : ""
                      }`}
                      placeholder="Confirm your password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {confirmPasswordError && (
                    <p className="auth-error">{confirmPasswordError}</p>
                  )}
                </div>
              </div>
            ) : (
              /* Password Field for Signin - Full width */
              <div>
                <label className="auth-label">PASSWORD</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className={`auth-input pr-10 ${
                      shake ? "animate-shake" : ""
                    } ${
                      passwordValidation.error
                        ? "border-red-500"
                        : passwordValidation.isValid
                        ? "border-emerald-500"
                        : ""
                    }`}
                    placeholder="Password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {passwordValidation.error && (
                  <p className="auth-error">
                    {AUTH_MESSAGES.error.signin_generic2}
                  </p>
                )}
              </div>
            )}

            {/* Forgot Password Link */}
            {authMode === "signin" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    console.log("Forgot password clicked for:", formData.email);
                    setShowForgotPassword(true);
                  }}
                  className="auth-link"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                isLoading ||
                !emailValidation.isValid ||
                !passwordValidation.isValid ||
                (authMode === "signup" &&
                  (!!confirmPasswordError || !formData.confirmPassword))
              }
              className="auth-button auth-button-primary mt-6"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : authMode === "signup" ? (
                "Sign up"
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4 md:my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs md:text-sm">
              <span className="px-3 md:px-4 bg-white text-gray-500 uppercase tracking-wide">
                OR
              </span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={() => handleSocialAuth("google")}
            disabled={isLoading}
            className="  auth-button-secondary mb-4 md:mb-6"
          >
            <svg className="w-4 md:w-5 h-4 md:h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Switch Mode */}
          <div className="text-center">
            <span className="text-sm text-gray-600">
              {authMode === "signup"
                ? "Already have an account? "
                : "Don't have an account yet? "}
            </span>
            <button
              onClick={() => {
                window.scrollTo({ top: 10, behavior: "smooth" });
                setAuthMode(authMode === "signup" ? "signin" : "signup");
                setFormData({
                  email: "",
                  password: "",
                  confirmPassword: "",
                  name: "",
                });
                setConfirmPasswordError(null);
                setShake(false);
              }}
              className="text-sm text-gray-900 font-semibold underline hover:no-underline transition-all"
              disabled={isLoading}
            >
              {authMode === "signup" ? "Sign in here" : "Register here"}
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <ForgotPassword
          onBack={() => setShowForgotPassword(false)}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default AuthModel;
