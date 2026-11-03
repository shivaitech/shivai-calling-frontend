/**
 * Accounts with Multilingual Mode (an enterprise feature), in the create wizard and Edit Agent.
 * Lower-case emails. Kept apart from the publish allowlist so granting one doesn't grant the other.
 */
export const MULTILINGUAL_ALLOWED_EMAILS = ["demo@callshivai.com", "atharkatheri@gmail.com", "mhegc2025@gmail.com", "rs@shivaitech.com"];

export const canUseMultilingual = (email?: string | null) => MULTILINGUAL_ALLOWED_EMAILS.includes((email || "").trim().toLowerCase());
