import { RESERVED } from "../../../utils/cardSubdomain";

/**
 * Card usernames become the link host: https://<username>.callshivai.com. Lowercase letters and
 * numbers only. That's the one format both sides accept: the server refuses hyphens ("Only
 * underscores, letters, and numbers are allowed"), and a host can't hold an underscore
 * (`rahul_sharma.callshivai.com` isn't recognised by the card page or the link-preview function).
 */
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

/** Tidies what the user types: lowercase, separators and anything else dropped ("Athar-Ahmad" → "atharahmad"). */
export function normalizeUsername(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, USERNAME_MAX);
}

/** Why a username can't be used, or "" if it's fine. An empty username is allowed (optional). */
export function usernameProblem(u: string): string {
  if (!u) return "";
  if (u.length < USERNAME_MIN) return `Use at least ${USERNAME_MIN} characters.`;
  if (u.length > USERNAME_MAX) return `Use at most ${USERNAME_MAX} characters.`;
  if (!/^[a-z0-9]+$/.test(u)) return "Use only letters and numbers (no spaces, hyphens or underscores).";
  if (RESERVED.has(u)) return "That name is reserved. Try another.";
  return "";
}

/** The words of a name, plain lowercase: "José Ahmad-Khan" → ["jose", "ahmad", "khan"]. */
export function nameWords(s: string): string[] {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents: "José" → "jose"
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** A starting suggestion from the person's name, e.g. "Athar Ahmad" → "atharahmad". */
export function suggestUsername(fullName: string): string {
  const s = nameWords(fullName).join("").slice(0, USERNAME_MAX);
  return usernameProblem(s) ? "" : s;
}
