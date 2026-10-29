import { useEffect, useState } from "react";
import { AtSign, Check, Loader2, X } from "lucide-react";
import { businessCardAPI, cardLabel, hasSession } from "../../../services/businessCardAPI";
import { normalizeUsername, suggestUsername, usernameProblem } from "./username";

type Status =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "ok"; note?: string }
  | { kind: "taken"; note?: string; suggestions?: string[] }
  | { kind: "unknown"; note: string };

/**
 * The card's username = its link (https://<username>.callshivai.com). Checks availability
 * live while signed in; before sign-up (the public creator) the server confirms on save.
 */
export default function UsernameField({
  value,
  onChange,
  fullName,
  savedUsername,
  error,
}: {
  value: string;
  onChange: (username: string) => void;
  fullName: string;
  /** The card's current username when editing — never reported as "taken". */
  savedUsername?: string;
  error?: string;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const problem = usernameProblem(value);

  useEffect(() => {
    if (!value || problem) return setStatus({ kind: "idle" });
    if (savedUsername && value === savedUsername) return setStatus({ kind: "ok", note: "This is your current link." });
    if (!hasSession()) return setStatus({ kind: "unknown", note: "We’ll confirm it’s available when you save your card." });
    setStatus({ kind: "checking" });
    let live = true;
    const t = setTimeout(async () => {
      try {
        const r = await businessCardAPI.usernameAvailability(value);
        if (!live) return;
        setStatus(r.available ? { kind: "ok" } : { kind: "taken", note: r.message, suggestions: r.suggestions });
      } catch {
        if (live) setStatus({ kind: "unknown", note: "Couldn’t check right now — we’ll confirm when you save." });
      }
    }, 450);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [value, problem, savedUsername]);

  const suggestion = !value ? suggestUsername(fullName) : "";
  const shownError = error || problem;

  return (
    <div className="field un">
      <label htmlFor="card-username" className="un-label">
        Username <small>— your card’s link</small>
      </label>
      <div className={`un-input${shownError || status.kind === "taken" ? " is-bad" : status.kind === "ok" ? " is-good" : ""}`}>
        <AtSign size={15} className="un-at" aria-hidden="true" />
        <input
          id="card-username"
          value={value}
          placeholder={suggestion || "your-name"}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={30}
          aria-describedby="card-username-status"
          // Strip only an edge hyphen on blur, so typing "athar-" mid-word isn't fought.
          onChange={(e) => onChange(normalizeUsername(e.target.value))}
          onBlur={() => value !== value.replace(/^-+|-+$/g, "") && onChange(value.replace(/^-+|-+$/g, ""))}
        />
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

      {status.kind === "taken" && !!status.suggestions?.length && (
        <div className="un-chips">
          <span className="un-muted">Try:</span>
          {status.suggestions.slice(0, 4).map((s) => (
            <button key={s} type="button" className="un-chip" onClick={() => onChange(normalizeUsername(s))}>
              {s}
            </button>
          ))}
        </div>
      )}
      {suggestion && (
        <div className="un-chips">
          <button type="button" className="un-chip" onClick={() => onChange(suggestion)}>
            Use “{suggestion}”
          </button>
        </div>
      )}

      <small className="un-link">
        {value && !problem ? (
          <>
            Your link: <strong>{cardLabel({ slug: value })}</strong>. Changing it later changes your link.
          </>
        ) : (
          "Pick the name for your card’s link. Leave it empty and we’ll make one from your name and company."
        )}
      </small>
    </div>
  );
}
