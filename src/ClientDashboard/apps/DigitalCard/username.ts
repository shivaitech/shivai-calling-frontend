import { RESERVED } from "../../../utils/cardSubdomain";

/**
 * Card usernames become the link host: https://<username>.callshivai.com. So they follow
 * DNS-label rules — lowercase letters, numbers and hyphens, not starting/ending with a
 * hyphen. No underscores: `rahul_sharma.callshivai.com` isn't recognised by the card page
 * (utils/cardSubdomain.ts) or the link-preview function, so the card would never open.
 */
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

/** Tidies what the user types: lowercase; spaces, underscores and dots become hyphens. */
export function normalizeUsername(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[\s_.]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, USERNAME_MAX);
}

/** Why a username can't be used, or "" if it's fine. An empty username is allowed (optional). */
export function usernameProblem(u: string): string {
  if (!u) return "";
  if (u.length < USERNAME_MIN) return `Use at least ${USERNAME_MIN} characters.`;
  if (u.length > USERNAME_MAX) return `Use at most ${USERNAME_MAX} characters.`;
  if (!/^[a-z0-9-]+$/.test(u)) return "Use only lowercase letters, numbers and hyphens.";
  if (u.startsWith("-") || u.endsWith("-")) return "It can't start or end with a hyphen.";
  if (RESERVED.has(u)) return "That name is reserved. Try another.";
  return "";
}

/** A starting suggestion from the person's name, e.g. "Athar Ahmad" → "athar-ahmad". */
export function suggestUsername(fullName: string): string {
  const s = normalizeUsername(
    fullName
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, ""), // strip accents: "José" → "jose"
  ).replace(/^-+|-+$/g, "");
  return usernameProblem(s) ? "" : s;
}
