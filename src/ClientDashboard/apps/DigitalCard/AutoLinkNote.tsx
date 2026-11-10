import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { pickUsername, preferredUsername } from "./autoUsername";

type State = { kind: "empty" } | { kind: "checking"; hoped: string } | { kind: "ready"; username: string; hoped: string };

/**
 * "Your card's link" for plans that don't choose their own: as the name is typed, finds the link
 * the card will really get (checked live, so a taken name shows the alternative) and hands it to
 * the form, which saves with exactly that link.
 */
export default function AutoLinkNote({
  fullName,
  companyName,
  onUsername,
  error,
}: {
  fullName: string;
  companyName: string;
  onUsername: (username: string) => void;
  error?: string;
}) {
  const [state, setState] = useState<State>({ kind: "empty" });

  useEffect(() => {
    const card = { full_name: fullName, company_name: companyName };
    const hoped = preferredUsername(card);
    if (!fullName.trim() || !hoped) {
      setState({ kind: "empty" });
      onUsername("");
      return;
    }
    setState({ kind: "checking", hoped });
    // Cleared while checking, so saving mid-check picks a fresh link rather than the old name's.
    onUsername("");
    let live = true;
    const t = setTimeout(async () => {
      const username = await pickUsername(card);
      if (!live) return;
      setState({ kind: "ready", username, hoped });
      onUsername(username);
    }, 500);
    return () => {
      live = false;
      clearTimeout(t);
    };
    // onUsername is a fresh closure each render; the link only depends on the name and company.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullName, companyName]);

  const link = (u: string) => <strong>{u}.callshivai.com</strong>;

  return (
    <div className="field">
      <span>Your card’s link</span>
      {state.kind === "empty" && <small className="field-help">Your link is made from your name, like {link("your-name")}.</small>}
      {state.kind === "checking" && (
        <small className="field-help auto-link is-checking">
          <Loader2 size={13} className="un-spin" aria-hidden="true" /> Checking {link(state.hoped)}…
        </small>
      )}
      {state.kind === "ready" &&
        (state.username === state.hoped ? (
          <small className="field-help auto-link is-ok" role="status">
            <Check size={13} strokeWidth={3} aria-hidden="true" /> {link(state.username)} is available. This will be your link.
          </small>
        ) : (
          <small className="field-help auto-link" role="status">
            {link(state.hoped)} is taken, so your link will be {link(state.username)}.
          </small>
        ))}
      <small className="field-help">Want to choose your own link? You can with Prestige.</small>
      {error && <small className="err">{error}</small>}
    </div>
  );
}
