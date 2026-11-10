import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CardView from "../ClientDashboard/apps/DigitalCard/CardView";
import { BusinessCardError, businessCardAPI, PUBLIC_APP_URL, PublicBusinessCard, cardUrl } from "../services/businessCardAPI";
import { DIGITAL_CARD_HOME } from "./digitalCardRoutes";
import { trackCardView } from "../ClientDashboard/apps/DigitalCard/cardEvents";
import { complimentaryCardPlan } from "./complimentaryPlans";
import "../ClientDashboard/apps/DigitalCard/digitalCard.css";

/** The plans with their own look (Essential uses the standard one). */
const lookOf = (plan?: string | null) => (plan === "signature" || plan === "prestige" ? plan : undefined);

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
      .then((card) => {
        if (!live) return;
        setState({ kind: "ok", card });
        trackCardView(card.slug); // one view per tab session, for the owner's Monitoring
      })
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
          <CardView
            card={state.card}
            // No `wide`: desktop shows the same single card as phones and the editor preview.
            shareUrl={cardUrl(state.card)}
            poweredBy
            slug={state.card.slug}
            createCardHref={`${PUBLIC_APP_URL}${DIGITAL_CARD_HOME}`}
            inlineAgent
            // The public API sometimes returns tenant_id as an object; only pass a real id.
            agentUserId={typeof state.card.tenant_id === "string" ? state.card.tenant_id : undefined}
            // The owner's plan look (gold for Prestige): the API's plan, else a complimentary card's.
            tier={lookOf(state.card.plan) ?? lookOf(complimentaryCardPlan(state.card.slug))}
            foundingMember={!!state.card.founding_member}
            trackSlug={state.card.slug}
          />
        </div>
      )}
    </div>
  );
}
