import { useEffect, useRef, useState } from "react";
import { AtSign, Check, Loader2, Lock, X } from "lucide-react";
import { businessCardAPI, cardLabel, hasSession } from "../../../services/businessCardAPI";
import { availableUsernames, isUsernameFree } from "./autoUsername";
import { normalizeUsername, suggestUsername, usernameProblem } from "./username";

type Status =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "ok"; note?: string }
  | { kind: "taken"; note?: string; suggestions?: string[] }
  | { kind: "unknown"; note: string };

/**
 * The card's username = its link (https://<username>.callshivai.com), chosen once when the card is
 * created. Checks availability live (signed in: the availability endpoint; signed out: looks the
 * link up), and offers a few available links made from the name and company. Until the person
 * types their own, the best available one is filled in for them.
 */
export default function UsernameField({
  value,
  onChange,
  fullName,
  companyName = "",
  savedUsername,
  error,
  locked = false,
}: {
  /** The card already exists: show its link read-only (usernames can't be changed). */
  locked?: boolean;
  value: string;
  onChange: (username: string) => void;
  fullName: string;
  /** Used for link ideas ("athar-shivai"). */
  companyName?: string;
  /** The card's current username when editing — never reported as "taken". */
  savedUsername?: string;
  error?: string;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [ideas, setIdeas] = useState<string[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  // The value we filled in ourselves: replaced as the name changes, kept once the person types.
  const autoFilled = useRef<string | null>(null);
  const problem = usernameProblem(value);

  useEffect(() => {
    if (locked || !value || problem) return setStatus({ kind: "idle" });
    if (savedUsername && value === savedUsername) return setStatus({ kind: "ok", note: "This is your current link." });
    setStatus({ kind: "checking" });
    let live = true;
    const t = setTimeout(async () => {
      try {
        if (hasSession()) {
          const r = await businessCardAPI.usernameAvailability(value);
          if (!live) return;
          setStatus(
            r.available === true
              ? { kind: "ok" }
              : r.available === false
                ? { kind: "taken", note: r.message, suggestions: r.suggestions }
                : { kind: "unknown", note: "We’ll confirm it’s available when you save your card." },
          );
        } else {
          // Before sign-up: a card already at this link means it's taken.
          const free = await isUsernameFree(value);
          if (!live) return;
          setStatus(free === true ? { kind: "ok" } : free === false ? { kind: "taken" } : { kind: "unknown", note: "We’ll confirm it’s available when you save your card." });
        }
      } catch {
        if (live) setStatus({ kind: "unknown", note: "Couldn’t check right now — we’ll confirm when you save." });
      }
    }, 450);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [value, problem, savedUsername, locked]);

  // Available links from the name and company, refreshed shortly after they stop typing.
  useEffect(() => {
    if (locked || !fullName.trim()) return setIdeas([]);
    setIdeasLoading(true);
    let live = true;
    const t = setTimeout(async () => {
      const found = await availableUsernames({ full_name: fullName, company_name: companyName }, { limit: 4 }).catch(() => []);
      if (!live) return;
      setIdeas(found);
      setIdeasLoading(false);
    }, 700);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [fullName, companyName, locked]);

  // Fill in the best available link until the person picks or types their own.
  useEffect(() => {
    if (locked || !ideas[0]) return;
    if (value && value !== autoFilled.current) return;
    if (value === ideas[0]) return;
    autoFilled.current = ideas[0];
    onChange(ideas[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideas, locked]);

  const pick = (u: string) => {
    autoFilled.current = null;
    onChange(normalizeUsername(u));
  };
  const placeholder = suggestUsername(fullName);
  const shownError = error || problem;
  // Server suggestions for a taken link first, then our own available ideas.
  const chips = [...new Set([...(status.kind === "taken" ? status.suggestions ?? [] : []), ...ideas])].filter((u) => u !== value).slice(0, 4);

  // Usernames are chosen once: after the card is created the link is read-only.
  if (locked) {
    return (
      <div className="field un">
        <span className="un-label">
          Username <small>· your card’s link</small>
        </span>
        <div className="un-input is-locked" aria-readonly="true">
          <Lock size={14} className="un-at" aria-hidden="true" />
          <span className="un-locked-value">{value || "—"}</span>
          <span className="un-suffix">.callshivai.com</span>
        </div>
        <small className="un-link">Your card link is permanent. It can’t be changed after the card is created.</small>
      </div>
    );
  }

  return (
    <div className="field un">
      <label htmlFor="card-username" className="un-label">
        Username <small>· your card’s link</small>
        <b className="req" aria-hidden="true"> *</b>
      </label>
      <div className={`un-input${shownError || status.kind === "taken" ? " is-bad" : status.kind === "ok" ? " is-good" : ""}`}>
        <AtSign size={15} className="un-at" aria-hidden="true" />
        <input
          id="card-username"
          value={value}
          placeholder={placeholder || "your-name"}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={30}
          aria-describedby="card-username-status"
          // Strip only an edge hyphen on blur, so typing "athar-" mid-word isn't fought.
          onChange={(e) => pick(e.target.value)}
          onBlur={() => value !== value.replace(/^-+|-+$/g, "") && onChange(value.replace(/^-+|-+$/g, ""))}
        />
        {status.kind === "ok" && !shownError && <Check size={16} className="un-ok-ico" aria-hidden="true" />}
        <span className="un-suffix">.callshivai.com</span>
      </div>

      <div id="card-username-status" className="un-status" aria-live="polite">
        {shownError ? (
          <span className="err">{shownError}</span>
        ) : status.kind === "checking" ? (
          <span className="un-muted">
            <Loader2 size={13} className="un-spin" /> Checking…
          </span>
        ) : status.kind === "ok" ? (
          <span className="un-good">
            <Check size={13} /> {status.note ?? "Available"}
          </span>
        ) : status.kind === "taken" ? (
          <span className="un-bad">
            <X size={13} /> {status.note || "That username is taken."}
          </span>
        ) : status.kind === "unknown" ? (
          <span className="un-muted">{status.note}</span>
        ) : null}
      </div>

      {(chips.length > 0 || (ideasLoading && !ideas.length && !!fullName.trim())) && (
        <div className="un-chips" aria-label="Available links">
          <span className="un-muted">{status.kind === "taken" ? "Try one of these:" : "Available:"}</span>
          {chips.length ? (
            chips.map((s) => (
              <button key={s} type="button" className="un-chip is-free" onClick={() => pick(s)}>
                <Check size={12} strokeWidth={3} aria-hidden="true" />
                {s}
              </button>
            ))
          ) : (
            <span className="un-muted">
              <Loader2 size={12} className="un-spin" /> Finding links…
            </span>
          )}
        </div>
      )}

      <small className="un-link">
        {value && !problem ? (
          <>
            Your link: <strong>{cardLabel({ slug: value })}</strong>. Choose carefully: you can’t change it after the card is created.
          </>
        ) : (
          "Pick the name for your card’s link. It’s required, and you can’t change it after the card is created."
        )}
      </small>
    </div>
  );
}
