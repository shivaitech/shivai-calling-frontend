export const FORGOT_PASSWORD_MESSAGES = {
  // Entry point - forgot password link
  link_text: "Forgot password?",
  
  // Request page
  request: {
    title: "Reset your password",
    subtitle: "Enter your email and we'll send a reset link.",
    email_label: "Email address",
    email_placeholder: "you@example.com",
    submit_button: "Send reset link",
    back_to_signin: "Back to sign in",
    // Security-focused success message (doesn't reveal if email exists)
    success: "If this email is registered, you'll get reset instructions.",
    // Error messages
    errors: {
      required: "Enter your email address.",
      invalid: "Enter a valid email address.",
      rate_limited: "Too many attempts. Try again in a few minutes.",
      server: "Something went wrong. Please try again."
    }
  },
  
  // Reset page (from email link)
  reset: {
    title: "Set a new password",
    subtitle: "Create a password that's at least 8 characters, with a mix of letters and numbers.",
    password_label: "New password",
    password_placeholder: "Enter new password",
    confirm_label: "Confirm password",
    confirm_placeholder: "Confirm new password",
    submit_button: "Update password",
    request_new_link: "Request a new reset link",
    back_to_signin: "Back to sign in",
    // Success message
    success: "Password reset successful. Please sign in.",
    // Error messages
    errors: {
      password_required: "Enter a new password.",
      confirm_required: "Confirm your new password.",
      mismatch: "Passwords don't match.",
      too_short: "Use at least 8 characters.",
      no_letters: "Include at least one letter.",
      no_numbers: "Include at least one number.",
      token_invalid: "Link expired or invalid. Request a new reset link.",
      server: "Couldn't update password. Please try again."
    }
  },
  
  // Password requirements for validation
  requirements: [
    { id: 'length', label: '8+ characters', check: (password: string) => password.length >= 8 },
    { id: 'letter', label: 'Include a letter', check: (password: string) => /[a-zA-Z]/.test(password) },
    { id: 'number', label: 'Include a number', check: (password: string) => /[0-9]/.test(password) }
  ]
} as const;

export type ForgotPasswordMessages = typeof FORGOT_PASSWORD_MESSAGES;