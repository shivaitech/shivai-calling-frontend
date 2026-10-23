/**
 * Card subdomains: <slug>.callshivai.com shows that business card.
 *
 * Needs a wildcard DNS record + certificate for *.callshivai.com pointing at the
 * same site as www (infrastructure — see infra/card-og-edge/README.md).
 * `localhost` subdomains (slug.localhost:5173) work for local testing.
 */

/** First labels that are real services/sites, never a card. */
const RESERVED = new Set([
  "www", "api", "app", "admin", "mail", "email", "dashboard", "staging", "stage", "dev", "test", "demo",
  "nodejs", "voice", "cdn", "static", "assets", "auth", "login", "signup", "support", "help", "docs",
  "blog", "status", "widget", "ftp", "smtp", "imap", "pop", "ns1", "ns2",
]);

const HOST_RE = /^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\.(callshivai\.com|localhost)$/;

/** The card slug encoded in the hostname, or null when this isn't a card subdomain. */
export function getCardSubdomain(hostname: string = window.location.hostname): string | null {
  const m = HOST_RE.exec(hostname.toLowerCase());
  if (!m) return null;
  const sub = m[1];
  // Card slugs are 3–100 chars; a DNS label can only hold 63, so longer slugs can't be subdomains.
  if (sub.length < 3 || RESERVED.has(sub)) return null;
  return sub;
}
