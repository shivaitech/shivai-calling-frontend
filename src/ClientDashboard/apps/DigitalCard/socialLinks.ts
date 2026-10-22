import type { SocialType } from "./types";

/**
 * Keeps a social entry's `username` and `url` in sync:
 *   - type a username  → the profile URL is built for that platform
 *   - paste a URL      → the username is extracted from it
 */

export interface SocialValue {
  url: string;
  username: string;
}

const HOSTS: Record<SocialType, string[]> = {
  linkedin: ["linkedin.com"],
  instagram: ["instagram.com", "instagr.am"],
  twitter: ["x.com", "twitter.com"],
  facebook: ["facebook.com", "fb.com", "fb.me"],
  youtube: ["youtube.com", "youtu.be"],
  website: [],
};

const SKIP: Record<string, string[]> = {
  instagram: ["p", "reel", "reels", "tv", "stories", "explore", "accounts", "direct"],
  twitter: ["i", "intent", "home", "search", "hashtag", "share", "explore", "settings", "messages"],
  facebook: ["profile.php", "pages", "groups", "people", "sharer", "sharer.php", "share", "watch", "events", "marketplace", "story.php"],
};

const stripAt = (s: string) => s.trim().replace(/^@+/, "");
const cleanName = (s: string) => stripAt(s).replace(/\s+/g, "");
const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

/** Parses what the user typed as a URL (adds https:// when missing). */
function toUrl(raw: string): URL | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`);
    return u.hostname.includes(".") ? u : null;
  } catch {
    return null;
  }
}

const bareHost = (u: URL) => u.hostname.toLowerCase().replace(/^(www|m|mobile|web)\./, "");

/** Profile URL for a username on a platform ("" when there is no username). */
export function buildUrl(type: SocialType, username: string): string {
  const u = cleanName(username);
  if (!u) return "";
  switch (type) {
    case "linkedin":
      return `https://www.linkedin.com/in/${u}`;
    case "instagram":
      return `https://www.instagram.com/${u}`;
    case "twitter":
      return `https://x.com/${u}`;
    case "facebook":
      return `https://www.facebook.com/${u}`;
    case "youtube":
      return `https://www.youtube.com/@${u}`;
    default:
      return `https://${u.replace(/^https?:\/\//i, "").replace(/\/+$/, "")}`;
  }
}

/** Extracts the username (and a clean URL) from a pasted link. null = not a usable URL. */
export function parseProfile(type: SocialType, raw: string): SocialValue | null {
  const u = toUrl(raw);
  if (!u) return null;
  const host = bareHost(u);
  const segs = u.pathname.split("/").filter(Boolean).map(safeDecode);
  const origin = `https://${u.hostname.toLowerCase()}`;

  if (type === "website") {
    const path = u.pathname === "/" ? "" : u.pathname.replace(/\/+$/, "");
    return { username: host, url: `${origin}${path}${u.search}` };
  }

  // A link from another platform (e.g. a LinkedIn URL pasted into Instagram) is kept as-is.
  if (!HOSTS[type].some((h) => host === h || host.endsWith(`.${h}`))) {
    return { username: "", url: u.href.replace(/\/+$/, "") };
  }

  const keep = (username: string, url: string): SocialValue => ({ username: stripAt(username), url });

  switch (type) {
    case "linkedin": {
      if (["in", "company", "school"].includes(segs[0]) && segs[1]) {
        return keep(segs[1], `https://www.linkedin.com/${segs[0]}/${segs[1]}`);
      }
      return { username: "", url: u.href.replace(/\/+$/, "") };
    }
    case "instagram": {
      if (segs[0] && !SKIP.instagram.includes(segs[0].toLowerCase())) return keep(segs[0], buildUrl(type, segs[0]));
      return { username: "", url: u.href.replace(/\/+$/, "") };
    }
    case "twitter": {
      if (segs[0] && !SKIP.twitter.includes(segs[0].toLowerCase())) return keep(segs[0], buildUrl(type, stripAt(segs[0])));
      return { username: "", url: u.href.replace(/\/+$/, "") };
    }
    case "facebook": {
      if (segs[0] && !SKIP.facebook.includes(segs[0].toLowerCase())) return keep(segs[0], buildUrl(type, segs[0]));
      return { username: "", url: u.href.replace(/\/+$/, "") };
    }
    case "youtube": {
      if (segs[0]?.startsWith("@")) return keep(segs[0], buildUrl(type, stripAt(segs[0])));
      if (["c", "user", "channel"].includes(segs[0]) && segs[1]) {
        return keep(segs[1], `https://www.youtube.com/${segs[0]}/${segs[1]}`);
      }
      return { username: "", url: u.href.replace(/\/+$/, "") };
    }
  }
}

/** Does this text look like a link (rather than a bare username)? */
function looksLikeUrl(type: SocialType, v: string): boolean {
  if (/^https?:\/\//i.test(v) || v.includes("/")) return true;
  const lower = v.toLowerCase();
  return HOSTS[type].some((h) => lower.includes(h));
}

/** The user edited the USERNAME box. */
export function fromUsernameInput(type: SocialType, value: string): SocialValue {
  const v = value.trim();
  if (!v) return { username: "", url: "" };
  if (type === "website") {
    const p = parseProfile(type, v);
    return p ? { username: p.username, url: p.url } : { username: v, url: "" };
  }
  if (looksLikeUrl(type, v)) {
    const p = parseProfile(type, v);
    return p ? p : { username: v, url: "" }; // still typing a link
  }
  const name = cleanName(v);
  return { username: name, url: buildUrl(type, name) };
}

/** The user edited the URL box (kept as typed so the cursor isn't disturbed). */
export function fromUrlInput(type: SocialType, value: string, current: SocialValue): SocialValue {
  const v = value.trim();
  if (!v) return { url: "", username: "" };
  const p = parseProfile(type, v);
  if (p) return { url: value, username: p.username }; // a link we can read; "" if it isn't a profile link
  return { url: value, username: current.username }; // still typing
}

/** On leaving the URL box: tidy it into the platform's canonical profile URL. */
export function finalizeUrl(type: SocialType, value: string): SocialValue | null {
  const p = parseProfile(type, value);
  return p ? p : null;
}

/** Switching platform: rebuild the URL for the new platform from the username. */
export function changeType(type: SocialType, current: SocialValue): SocialValue {
  if (current.username.trim()) return fromUsernameInput(type, current.username);
  const p = current.url.trim() ? parseProfile(type, current.url) : null;
  return p ?? current;
}

export const USERNAME_PLACEHOLDER: Record<SocialType, string> = {
  linkedin: "Your LinkedIn username",
  instagram: "Your Instagram username",
  twitter: "Your X (Twitter) username",
  facebook: "Your Facebook username",
  youtube: "Your YouTube handle",
  website: "Your website, e.g. yourcompany.com",
};
