interface PasswordRequirement {
  id: 'length' | 'letter' | 'number' | 'special';
  label: string;
}

interface AuthMessages {
  error: {
    email_invalid: string;
    email_disposable: string;
    email_already_registered: string;
    email_not_registered: string;
    signin_generic: string;
    signin_generic2: string;
    signin_too_many_attempts: string;
    password_too_short: string;
    password_requirements: string;
    password_mismatch: string;
    reset_link_expired: string;
    one_time_code_incorrect: string;
    one_time_code_expired: string;
    invalid_password: string;
  };
  helper: {
    signup_email: string;
    signup_password: string;
    password_guidance_title: string;
    password_guidance_tips: string;
    forgot_password_label: string;
    forgot_password_cta: string;
  };
  success: {
    forgot_password_request: string;
    password_reset: string;
  };
  validation: {
    password_requirements: PasswordRequirement[];
  };
}

export const AUTH_MESSAGES: AuthMessages = {
  error: {
    email_invalid: "Enter a valid email address.",
    email_disposable: "Please use a personal or work email.",
    email_already_registered: "That email is already registered. Sign in or reset your password.",
    email_not_registered: "Email is not registered", // Specific message for signin when email not found
    signin_generic: "Invalid or Incorrect Email.",
    signin_generic2: "Invalid or Incorrect Password.",
    signin_too_many_attempts: "Too many attempts. Try again in 30 seconds.",
    password_too_short: "Use at least 8 characters",
    password_requirements: "Password must include a letter, number, and special character",
    password_mismatch: "Passwords don't match",
    reset_link_expired: "This reset link has expired. Request a new one.",
    one_time_code_incorrect: "That code isn't correct.",
    one_time_code_expired: "Code expired. Get a new code.",
    invalid_password: "Invalid password. Please try again."
  },
  
  helper: {
    signup_email: "We'll send confirmations here.",
    signup_password: "Use 8+ characters with letters, numbers, and special characters",
    password_guidance_title: "Create a password",
    password_guidance_tips: "Include at least one letter, number, and special character",
    forgot_password_label: "Email",
    forgot_password_cta: "Send reset link"
  },
  success: {
    forgot_password_request: "If that email is registered, we've sent a reset link. It expires in 15 minutes.",
    password_reset: "Your password has been updated.",
  },
  validation: {
    password_requirements: [
      { id: 'length', label: '8+ characters' },
      { id: 'letter', label: 'Include a letter' },
      { id: 'number', label: 'Include a number' },
      { id: 'special', label: 'Include special character (@, #, $, etc.)' }
    ]
  }
} as const;