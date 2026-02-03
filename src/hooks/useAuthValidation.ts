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

  // Immediate format validation (no debounce)
  const validateFormat = useCallback((email: string) => {
    if (!email) {
      setState({ isValid: false, error: null, isChecking: false });
      return false;
    }

    // Basic email format validation - instant feedback
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setState({
        isValid: false,
        error: AUTH_MESSAGES.error.email_invalid,
        isChecking: false,
      });
      return false;
    }

    return true;
  }, []);

  // API validation (debounced)
  const validateEmailAPI = useCallback(
    debounce(async (email: string) => {
      if (!email) return;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return;

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
    }, 300),
    [mode]
  );

  useEffect(() => {
    // First do instant format validation
    const isValidFormat = validateFormat(email);
    
    // Then do API validation if format is valid
    if (isValidFormat && email) {
      validateEmailAPI(email);
    }
    
    return () => validateEmailAPI.cancel();
  }, [email, validateFormat, validateEmailAPI]);

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

  // Immediate requirement validation (no debounce)
  const validateRequirements = useCallback((password: string) => {
    if (!password) {
      setState((prev) => ({
        ...prev,
        isValid: false,
        error: null,
        isChecking: false,
      }));
      return { isValid: false, requirements: {
        length: false,
        lowercase: false,
        uppercase: false,
        number: false,
        special: false,
      }};
    }

    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password),
    };

    const isValid = Object.values(requirements).every(Boolean);
    let error = null;

    if (!requirements.length) {
      error = AUTH_MESSAGES.error.password_too_short;
    } else if (!requirements.lowercase || !requirements.uppercase || !requirements.number || !requirements.special) {
      error = AUTH_MESSAGES.error.password_requirements;
    }

    setState({
      isValid,
      error,
      isChecking: false,
      requirements,
    });

    return { isValid, requirements };
  }, []);

  // API validation for signin (debounced)
  const validatePasswordAPI = useCallback(
    debounce(async (password: string, requirements: PasswordRequirements) => {
      if (!password || mode !== "signin") return;
      
      const isValid = Object.values(requirements).every(Boolean);
      if (!isValid) return;

      try {
        setState((prev) => ({ ...prev, isChecking: true }));
        await authAPI.validatePassword(password, email, mode);
        
        setState((prev) => ({
          ...prev,
          isValid: true,
          error: null,
          isChecking: false,
        }));
      } catch (error: any) {
        if (mode === "signin" && error.response?.status === 401) {
          const errorMessage = error.response?.data?.message;
          if (
            errorMessage &&
            errorMessage.toLowerCase().includes("invalid password")
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
    }, 300),
    [email, mode]
  );

  useEffect(() => {
    // First do instant requirement validation
    const result = validateRequirements(password);
    
    // Then do API validation if requirements are met (for signin only)
    if (mode === "signin" && result.isValid && password) {
      validatePasswordAPI(password, result.requirements);
    }
    
    return () => validatePasswordAPI.cancel();
  }, [password, mode, validateRequirements, validatePasswordAPI]);

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
