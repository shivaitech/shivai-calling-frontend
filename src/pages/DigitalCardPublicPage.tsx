import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CardView from "../ClientDashboard/apps/DigitalCard/CardView";
import { BusinessCardError, businessCardAPI, PUBLIC_APP_URL, PublicBusinessCard, cardUrl } from "../services/businessCardAPI";
import { DIGITAL_CARD_HOME } from "./digitalCardRoutes";
import "../ClientDashboard/apps/DigitalCard/digitalCard.css";

type State =
  | { kind: "loading" }
  | { kind: "ok"; card: PublicBusinessCard }
  | { kind: "notfound" }
  | { kind: "error"; message: string };

/** Public, no-login page for a shared digital business card: /card/:slug,
 *  or <slug>.callshivai.com (App.tsx passes the slug in via `slug`). */
export default function DigitalCardPublicPage({ slug: slugProp }: { slug?: string }) {
  const { code } = useParams<{ code: string }>();
  const slug = slugProp ?? code ?? "";
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let live = true;
    setState({ kind: "loading" });
    businessCardAPI
      .getPublic(slug)
      .then((card) => live && setState({ kind: "ok", card }))
      .catch((e: BusinessCardError) => {
        if (!live) return;
        // 404 = no such card; 422 = slug fails validation (e.g. too short) — both are "not found" to a visitor.
        setState(e.status === 404 || e.status === 422 ? { kind: "notfound" } : { kind: "error", message: e.message });
      });
    return () => {
      live = false;
    };
  }, [slug]);

  useEffect(() => {
    if (state.kind !== "ok") return;
    const prev = document.title;
    document.title = `${state.card.full_name} | ${state.card.job_title || "Digital Card"}`;
    return () => {
      document.title = prev;
    };
  }, [state]);

  return (
    <div className="dc dc-public">
      {state.kind === "loading" && <p className="center muted">Loading…</p>}
      {state.kind === "notfound" && (
        <div className="center">
          <h2 style={{ fontSize: 20, fontWeight: 650 }}>Card not found</h2>
          <p className="muted">This card doesn’t exist, or its link has changed.</p>
        </div>
      )}
      {state.kind === "error" && (
        <div className="center">
          <h2 style={{ fontSize: 20, fontWeight: 650 }}>Couldn’t load this card</h2>
          <p className="muted">{state.message}</p>
        </div>
      )}
      {state.kind === "ok" && (
        <div style={{ paddingBottom: 36 }}>
          <CardView card={state.card} wide shareUrl={cardUrl(state.card)} />
          <a className="make" href={`${PUBLIC_APP_URL}${DIGITAL_CARD_HOME}`}>Create your own digital card →</a>
        </div>
      )}
    </div>
  );
}
