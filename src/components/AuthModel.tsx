import {
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Mic,
  X,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  useEmailValidation,
  usePasswordValidation,
} from "../hooks/useAuthValidation";
import { debounce } from "lodash";
import { AUTH_MESSAGES } from "../constants/validation";
import ForgotPassword from "./ForgotPassword";

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

  const inputClasses =
    "w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-xl shadow-2xl w-full max-h-[85vh] overflow-y-auto  ${
          authMode === "signup" ? "max-w-xl" : "max-w-md"
        }`}
      >
        <div className="p-4 sm:p-6">
          <div className="text-center mb-4">
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {authMode === "signup" ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-sm text-gray-600">
              {authMode === "signup"
                ? "Start building amazing voice AI agents today"
                : "Sign in to your ShivAI account"}
            </p>
          </div>

          {error && (
            <div
              className={`mb-4 p-3 bg-red-50 border border-red-200 rounded-lg ${
                shake ? "animate-shake" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-3 mb-4">
            <button
              onClick={() => handleSocialAuth("google")}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 px-4 py-2.5 border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <span className="text-sm font-medium text-gray-700">
                Continue with Google
              </span>
            </button>
          </div>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-3">
            <div
              className={`${
                authMode === "signup"
                  ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
                  : ""
              }`}
            >
              {authMode === "signup" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className={`${inputClasses} ${
                      fieldErrors.fullName
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter your full name"
                    required
                    disabled={isLoading}
                  />
                  {fieldErrors.fullName && (
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.fullName}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
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
                    className={`${inputClasses} pr-10 ${
                      shake ? "animate-shake" : ""
                    } ${
                      emailValidation.error
                        ? "border-red-500"
                        : emailValidation.isValid
                        ? "border-emerald-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter your email"
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
                  <p className="mt-1 text-xs text-red-600">
                    {emailValidation.error}
                  </p>
                )}
              </div>
            </div>

            <div
              className={
                authMode === "signup"
                  ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
                  : ""
              }
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                    }}
                    className={`${inputClasses} pr-20 ${
                      shake ? "animate-shake" : ""
                    } ${
                      passwordValidation.error
                        ? "border-red-500"
                        : passwordValidation.isValid
                        ? "border-emerald-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                  <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                    {formData.password &&
                      (!passwordValidation.isValid ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : passwordValidation.isValid ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : null)}
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
                {passwordValidation.error && authMode === "signin" && (
                  <p className="mt-1 text-xs text-red-600">
                    {AUTH_MESSAGES.error.signin_generic2}
                  </p>
                )}
                {authMode === "signup" && (
                  <div className="mt-1.5 space-y-1">
                    {AUTH_MESSAGES.validation.password_requirements.map((req) =>
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

              {authMode === "signup" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
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
                      className={`${inputClasses} pr-10 ${
                        confirmPasswordError
                          ? "border-red-500"
                          : formData.confirmPassword && !confirmPasswordError
                          ? "border-emerald-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Confirm your password"
                      required
                      disabled={isLoading}
                    />
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
                  {confirmPasswordError && (
                    <p className="mt-1 text-xs text-red-600">
                      {confirmPasswordError}
                    </p>
                  )}
                </div>
              )}
            </div>

            
            {authMode !== "signup" && (
              <div className={authMode === "signin" ? "text-right" : "hidden"}>
                <button
                  type="button"
                  onClick={() => {
                    console.log("Forgot password clicked for:", formData.email);
                    setShowForgotPassword(true);
                  }}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                  disabled={isLoading}
                >
                  Forgot Password?
                </button>
              </div>
            )}
            
            <button
              type="submit"
              disabled={
                isLoading ||
                !emailValidation.isValid ||
                !passwordValidation.isValid ||
                (authMode === "signup" &&
                  (!!confirmPasswordError || !formData.confirmPassword))
              }
              className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : authMode === "signup" ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {authMode === "signup"
                ? "Already have an account?"
                : "Don't have an account?"}
              <button
                onClick={() => {
                  setAuthMode(authMode === "signup" ? "signin" : "signup");
                  // Reset form data
                  setFormData({
                    email: "",
                    password: "",
                    confirmPassword: "",
                    name: "",
                  });
                  // Reset any error states
                  setConfirmPasswordError(null);
                  setShake(false);
                }}
                className="ml-1 text-emerald-600 hover:text-emerald-700 font-medium"
                disabled={isLoading}
              >
                {authMode === "signup" ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>

        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {showForgotPassword && (
        <ForgotPassword
          onBack={() => setShowForgotPassword(false)}
          onClose={closeModal}
          onSubmit={async (email: string) => {
            // Handle forgot password API call
            console.log("Forgot password for:", email);
            // Add your API call here
          }}
        />
      )}
    </div>
  );
};

export default AuthModel;
