import { useEffect, useRef, useState } from "react";
import { Check, ClipboardPaste, ExternalLink, X } from "lucide-react";
import { LinkIcon } from "./CardView";
import type { CardData, SocialType } from "./types";
import { detectPlatform, findUrl, fromUsernameInput, parseProfile } from "./socialLinks";

type Social = CardData["social_media"][number];

/**
 * Social links, the quick way: tap a platform → we open it on the user's own profile →
 * they copy the profile link → when they come back we pick it up from the clipboard
 * (where the browser allows) or they tap Paste. Typing a username always works too.
 *
 * Why not a "log in with Instagram" button: Instagram's API no longer covers personal
 * accounts, and Facebook/LinkedIn logins don't reveal a public profile URL — only X and
 * YouTube could, through a backend OAuth app. Copy-the-link works for every platform.
 */

const PLATFORMS: { type: SocialType; name: string; openUrl?: string; steps?: string }[] = [
  {
    type: "instagram",
    name: "Instagram",
    openUrl: "https://www.instagram.com/",
    steps: "Go to your profile, tap Share profile → Copy link, then come back here.",
  },
  {
    type: "linkedin",
    name: "LinkedIn",
    openUrl: "https://www.linkedin.com/in/me/",
    steps: "Your profile opens. Tap More → Share via → Copy link (or copy the address bar), then come back.",
  },
  {
    type: "facebook",
    name: "Facebook",
    openUrl: "https://www.facebook.com/me",
    steps: "Your profile opens. Tap ••• → Copy link to profile (or copy the address bar), then come back.",
  },
  {
    type: "twitter",
    name: "X",
    openUrl: "https://x.com/",
    steps: "Open your profile, tap Share → Copy link to profile, then come back.",
  },
  {
    type: "youtube",
    name: "YouTube",
    openUrl: "https://www.youtube.com/profile",
    steps: "Your channel opens. Tap Share → Copy link, then come back.",
  },
  { type: "website", name: "Website" },
];

const PASTE_HINT: Partial<Record<SocialType, string>> = {
  instagram: "instagram.com/yourname",
  linkedin: "linkedin.com/in/yourname",
  facebook: "facebook.com/yourname",
  twitter: "x.com/yourname",
  youtube: "youtube.com/@yourchannel",
};

const nameOf = (t: SocialType) => PLATFORMS.find((p) => p.type === t)?.name ?? t;
const subOf = (s: Social) =>
  s.type === "website" ? s.username || s.url.replace(/^https?:\/\/(www\.)?/, "") : s.username ? `@${s.username.replace(/^@/, "")}` : s.url.replace(/^https?:\/\/(www\.)?/, "");

type Msg = { tone: "ok" | "hint" | "err"; text: string } | null;

export default function SocialLinksEditor({
  value,
  onChange,
  errorFor,
}: {
  value: Social[];
  onChange: (next: Social[]) => void;
  /** Validation message for the entry at index i, if any. */
  errorFor: (i: number) => string | undefined;
}) {
  const [open, setOpen] = useState<SocialType | null>(null);
  const [awaiting, setAwaiting] = useState(false);
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const latest = useRef(value);
  latest.current = value;

  const platform = PLATFORMS.find((p) => p.type === open);

  const start = (type: SocialType) => {
    const existing = value.find((s) => s.type === type);
    setOpen(type);
    setAwaiting(false);
    setDraft(existing ? existing.url || existing.username : "");
    setMsg(null);
    if (type === "website") setTimeout(() => inputRef.current?.focus(), 0);
  };

  const close = () => {
    setOpen(null);
    setAwaiting(false);
    setMsg(null);
  };

  /** Add or replace this platform's entry (one per platform; extra legacy entries are left alone). */
  const save = (type: SocialType, entry: { url: string; username: string }) => {
    const list = latest.current;
    const i = list.findIndex((s) => s.type === type);
    onChange(i >= 0 ? list.map((s, j) => (j === i ? { type, ...entry } : s)) : [...list, { type, ...entry }]);
  };

  /**
   * Try to use some text (pasted or from the clipboard) as this platform's profile.
   * Returns "ok", or a message explaining why it couldn't be used ("" = nothing usable).
   */
  const apply = (type: SocialType, text: string, fromClipboard: boolean): string => {
    const raw = text.trim();
    if (!raw) return "";
    if (type === "website") {
      const v = fromUsernameInput("website", findUrl(raw) ?? raw);
      if (!v.url) return "";
      save(type, v);
      return "ok";
    }
    const url = findUrl(raw);
    if (!url) {
      // Not a link: treat as a username (but never guess from whatever was on the clipboard).
      if (fromClipboard) return "";
      const v = fromUsernameInput(type, raw);
      if (!v.username) return "";
      save(type, v);
      return "ok";
    }
    const other = detectPlatform(url);
    if (other && other !== type) return `That's a ${nameOf(other)} link. Copy your ${nameOf(type)} profile link instead.`;
    const parsed = parseProfile(type, url);
    // Facebook's "Copy link to profile" gives facebook.com/share/…, and profiles without a
    // custom name are profile.php?id=… — both real profile links, just without a username.
    const fbProfileLink = type === "facebook" && /facebook\.com\/(profile\.php\?id=\d+|share\/)/i.test(url);
    if (!parsed || (!parsed.username && !fbProfileLink)) return "That looks like a post or page, not a profile. Copy the link to your profile.";
    save(type, parsed);
    return "ok";
  };

  const succeed = (type: SocialType) => {
    setMsg({ tone: "ok", text: `${nameOf(type)} connected.` });
    setAwaiting(false);
    setTimeout(() => setOpen((o) => (o === type ? null : o)), 1100);
  };

  // Back from the other app/tab: look for the copied profile link on the clipboard.
  useEffect(() => {
    if (!awaiting || !open) return;
    const type = open;
    const onBack = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const text = await navigator.clipboard.readText();
        // Silent here: whatever was already on the clipboard may be unrelated.
        if (apply(type, text, true) === "ok") succeed(type);
        else setMsg({ tone: "hint", text: "Copied your profile link? Tap Paste link — or type your username below." });
      } catch {
        // Most mobile browsers only allow reading the clipboard from a tap.
        setMsg({ tone: "hint", text: "Welcome back! Tap Paste link to bring your profile in." });
      }
    };
    document.addEventListener("visibilitychange", onBack);
    window.addEventListener("focus", onBack);
    return () => {
      document.removeEventListener("visibilitychange", onBack);
      window.removeEventListener("focus", onBack);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awaiting, open]);

  const paste = async () => {
    if (!open) return;
    try {
      const text = await navigator.clipboard.readText();
      const result = apply(open, text, false);
      if (result === "ok") succeed(open);
      else if (result) setMsg({ tone: "err", text: result });
      else if (text.trim()) setMsg({ tone: "err", text: "That doesn't look like a profile link." });
      else {
        // Empty can also mean the browser quietly declined to share the clipboard.
        setMsg({ tone: "hint", text: `Nothing to paste yet — copy your profile link in ${nameOf(open)} first, or paste it into the box.` });
        inputRef.current?.focus();
      }
    } catch {
      setMsg({ tone: "hint", text: "Your browser blocked the Paste button — long-press the box and choose Paste." });
      inputRef.current?.focus();
    }
  };

  const submitDraft = () => {
    if (!open) return;
    const result = apply(open, draft, false);
    if (result === "ok") succeed(open);
    else setMsg({ tone: "err", text: result || (open === "website" ? "Enter a website, like yourcompany.com." : "Enter your username or paste your profile link.") });
  };

  return (
    <div className="soc">
      <div className="soc-grid" role="list">
        {PLATFORMS.map((p) => {
          const connected = value.some((s) => s.type === p.type && (s.url || s.username));
          return (
            <button
              key={p.type}
              type="button"
              role="listitem"
              className={`soc-tile${open === p.type ? " is-open" : ""}${connected ? " is-on" : ""}`}
              onClick={() => (open === p.type ? close() : start(p.type))}
              aria-expanded={open === p.type}
            >
              <span className="soc-tile-ico">
                <LinkIcon type={p.type} />
              </span>
              <span className="soc-tile-name">{p.name}</span>
              <span className="soc-tile-state">{connected ? <><Check size={12} /> Added</> : "Add"}</span>
            </button>
          );
        })}
      </div>

      {platform && (
        <div className="soc-connect" role="region" aria-label={`Connect ${platform.name}`}>
          <div className="soc-connect-head">
            <span className="soc-tile-ico">
              <LinkIcon type={platform.type} />
            </span>
            <strong>{platform.type === "website" ? "Add your website" : `Connect ${platform.name}`}</strong>
            <button type="button" className="soc-close" aria-label="Close" onClick={close}>
              <X size={14} />
            </button>
          </div>

          {platform.openUrl && (
            <ol className="soc-steps">
              <li>
                <a
                  className="btn small"
                  href={platform.openUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setAwaiting(true);
                    setMsg(null);
                  }}
                >
                  Open {platform.name} <ExternalLink size={13} />
                </a>
                <span className="muted">{platform.steps}</span>
              </li>
            </ol>
          )}

          {/* Paste the profile link here — pasting fills it in straight away. */}
          <form
            className="soc-paste"
            onSubmit={(e) => {
              e.preventDefault();
              submitDraft();
            }}
          >
            <label className="soc-paste-label" htmlFor={`soc-input-${platform.type}`}>
              {platform.type === "website" ? "Your website" : `Paste your ${platform.name} profile link`}
            </label>
            <div className="soc-paste-row">
              <input
                id={`soc-input-${platform.type}`}
                ref={inputRef}
                value={draft}
                inputMode="url"
                autoComplete="off"
                onChange={(e) => {
                  setDraft(e.target.value);
                  setMsg(null);
                }}
                onPaste={(e) => {
                  const text = e.clipboardData.getData("text");
                  if (!text) return;
                  e.preventDefault();
                  setDraft(text.trim());
                  const result = apply(platform.type, text, false);
                  if (result === "ok") succeed(platform.type);
                  else setMsg({ tone: "err", text: result || "That doesn't look like a profile link." });
                }}
                placeholder={platform.type === "website" ? "yourcompany.com" : PASTE_HINT[platform.type] ?? "https://…"}
              />
              {platform.type !== "website" && (
                <button type="button" className="btn small ghost soc-paste-btn" onClick={paste} title="Paste from clipboard">
                  <ClipboardPaste size={14} /> Paste
                </button>
              )}
              <button type="submit" className="btn small">
                Save
              </button>
            </div>
          </form>

          {msg && <p className={`soc-msg ${msg.tone}`}>{msg.tone === "ok" && <Check size={14} />} {msg.text}</p>}
        </div>
      )}

      {value.length > 0 && (
        <ul className="soc-list">
          {value.map((s, i) => (
            <li key={`${s.type}-${i}`}>
              <span className="soc-tile-ico">
                <LinkIcon type={s.type} />
              </span>
              <span className="soc-list-text">
                <strong>{nameOf(s.type)}</strong>
                <span>{subOf(s) || "Not set yet"}</span>
                {errorFor(i) && <small className="err">{errorFor(i)}</small>}
              </span>
              <button type="button" className="link-btn" onClick={() => start(s.type)}>
                Change
              </button>
              <button
                type="button"
                className="link-btn danger"
                onClick={() => {
                  onChange(value.filter((_, j) => j !== i));
                  if (open === s.type) close();
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
