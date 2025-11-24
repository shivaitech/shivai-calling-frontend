import { useState, useEffect, useCallback } from "react";
import debounce from "lodash/debounce";
import { authAPI } from "../services/authAPI";
import { AUTH_MESSAGES } from "../constants/validation";

export interface ValidationState {
  isValid: boolean;
  error: string | null;
  isChecking: boolean;
}

interface PasswordRequirements {
  length: boolean;
  lowercase: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
}

export const useEmailValidation = (
  email: string,
  mode: "signin" | "signup"
) => {
  const [state, setState] = useState<ValidationState>({
    isValid: true,
    error: null,
    isChecking: false,
  });

  const validateEmail = useCallback(
    debounce(async (email: string) => {
      if (!email) {
        setState({ isValid: false, error: null, isChecking: false });
        return;
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setState({
          isValid: false,
          error: AUTH_MESSAGES.error.email_invalid,
          isChecking: false,
        });
        return;
      }

      try {
        setState((prev) => ({ ...prev, isChecking: true }));

        if (email.match(/\.(temp|tmp|disposable)\./i)) {
          setState({
            isValid: false,
            error: AUTH_MESSAGES.error.email_disposable,
            isChecking: false,
          });
          return;
        }

        const { data } = await authAPI.checkEmailAvailability(email, mode);

        if (mode === "signup" && !data) {
          setState({
            isValid: false,
            error: AUTH_MESSAGES.error.email_already_registered,
            isChecking: false,
          });
        } else {
          setState({
            isValid: true,
            error: null,
            isChecking: false,
          });
        }
      } catch (error: any) {
        if (mode === "signin" && error.response?.status === 401) {
          const errorMessage = error.response?.data?.message;
          if (
            errorMessage &&
            errorMessage.toLowerCase().includes("email not found")
          ) {
            setState({
              isValid: false,
              error: AUTH_MESSAGES.error.email_not_registered,
              isChecking: false,
            });
            return;
          }
        }

        if (mode === "signup" && error.response?.status === 409) {
          const errorMessage = error.response?.data?.message;
          if (
            errorMessage &&
            errorMessage.toLowerCase().includes("email is already")
          ) {
            setState({
              isValid: false,
              error: AUTH_MESSAGES.error.email_already_registered,
              isChecking: false,
            });
            return;
          }
        }

        setState({
          isValid: false,
          error: AUTH_MESSAGES.error.signin_generic,
          isChecking: false,
        });
      }
    }, 500),
    [mode]
  );

  useEffect(() => {
    validateEmail(email);
    return () => validateEmail.cancel();
  }, [email, validateEmail]);

  return state;
};

export const usePasswordValidation = (
  password: string,
  email: string = "",
  mode: "signin" | "signup" = "signup"
) => {
  const [state, setState] = useState<
    ValidationState & { requirements: PasswordRequirements }
  >({
    isValid: false,
    error: null,
    isChecking: false,
    requirements: {
      length: false,
      lowercase: false,
      uppercase: false,
      number: false,
      special: false,
    },
  });

  const validatePassword = useCallback(
    debounce(async (password: string) => {
      if (!password) {
        setState((prev) => ({
          ...prev,
          isValid: false,
          error: null,
          isChecking: false,
        }));
        return;
      }

      try {
        setState((prev) => ({ ...prev, isChecking: true }));

        const requirements = {
          length: password.length >= 8,
          lowercase: /[a-z]/.test(password),
          uppercase: /[A-Z]/.test(password),
          number: /[0-9]/.test(password),
          special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password),
        };

        let isValid = Object.values(requirements).every(Boolean);
        let error = null;

        if (!requirements.length) {
          error = AUTH_MESSAGES.error.password_too_short;
        } else if (!requirements.lowercase || !requirements.uppercase || !requirements.number || !requirements.special) {
          error = AUTH_MESSAGES.error.password_requirements;
        }

        if (mode === "signin" && isValid) {
          await authAPI.validatePassword(password, email, mode);
        }

        setState({
          isValid,
          error,
          isChecking: false,
          requirements,
        });
      } catch (error: any) {
        if (mode === "signin" && error.response?.status === 401) {
          const errorMessage = error.response?.data?.message;
          if (
            errorMessage &&
            errorMessage.toLowerCase().includes("Invalid password")
          ) {
            setState((prev) => ({
              ...prev,
              isValid: false,
              error: AUTH_MESSAGES.error.invalid_password,
              isChecking: false,
              requirements: prev.requirements,
            }));
            return;
          } else {
            setState((prev) => ({
              ...prev,
              isValid: false,
              error: AUTH_MESSAGES.error.signin_generic,
              isChecking: false,
              requirements: prev.requirements,
            }));
          }
        }
      }
    }, 500),
    [email, mode]
  );

  useEffect(() => {
    validatePassword(password);
    return () => validatePassword.cancel();
  }, [password, validatePassword]);

  return state;
};

export const useAuthValidation = () => {
  const validateCredentials = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      const { valid } = await authAPI.validateCredentials(email, password);
      return valid;
    } catch (error) {
      return false;
    }
  };

  return { validateCredentials };
};
