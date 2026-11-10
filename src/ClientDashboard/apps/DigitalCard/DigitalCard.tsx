import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import QRCode from "react-qr-code";
import toast from "react-hot-toast";
import { Award, BarChart3, Bot, Clock, Copy, CreditCard, Crown, ExternalLink, Eye, Lock, Mail, Pencil, Plus, Share2, Sparkles } from "lucide-react";
import { cardInsightsAPI } from "../../../services/cardInsightsAPI";
import CardView from "./CardView";
import CardForm, { type CardPatch } from "./CardForm";
import CardMonitoring from "./CardMonitoring";
import CardAffiliate from "./CardAffiliate";
import CardBilling from "../../Billing/CardBilling";
import PlanLookSwitcher from "./PlanLookSwitcher";
import type { PlanTier } from "./PlanCardPreview";
import { cardBillingAPI } from "../../../services/billingAPI";
import { clearPendingPlan, loadPendingPlan, pendingPlanHref, type PendingPlan } from "../../Billing/pendingPlan";
import { handlePlanLimit, limitLabel, refreshPlanLimits, showLimitFor, usePlanLimits } from "../../Billing/planLimit";
import { createWithUsername } from "./autoUsername";
import EmailSignatureSheet from "./EmailSignatureSheet";
import QrPlayground from "./QrPlayground";
import { loadQrDesign, saveQrDesign } from "./qrDesignStore";
import { CardData, emptyCard, withSuggestedTagline } from "./types";
import { clearDraft, loadDraft, saveDraft } from "./draft";
import { validateCard } from "./validate";
import { type ImageKind, uploadPhoto } from "./photo";
import { useAgent } from "../../../contexts/AgentContext";
import { useAuth } from "../../../contexts/AuthContext";
import { complimentaryPlan, complimentarySavePlan } from "../../../pages/complimentaryPlans";
import {
  BusinessCard,
  BusinessCardError,
  businessCardAPI,
  Pagination,
  cardLabel,
  cardQrImage,
  cardErrorMessage,
  cardUrl,
  toPayload,
} from "../../../services/businessCardAPI";
import "./digitalCard.css";

const PAGE_SIZE = 10;

// ── Card cache (list responses + saves) so the editor / share views can open
// a card by id. There is no GET /business-cards/:id, only the list. ──────────
const cardCache = new Map<string, BusinessCard>();

async function findCard(id: string): Promise<BusinessCard> {
  const hit = cardCache.get(id);
  if (hit) return hit;
  let page = 1;
  for (;;) {
    const { cards, pagination } = await businessCardAPI.list({ page, limit: 100, sortBy: "updatedAt", sortOrder: "desc" });
    cards.forEach((c) => cardCache.set(c._id, c));
    if (cardCache.has(id)) return cardCache.get(id)!;
    if (page >= pagination.totalPages) throw new BusinessCardError("Business card not found", 404);
    page++;
  }
}

const fromCard = (c: BusinessCard): CardData => ({
  full_name: c.full_name ?? "",
  job_title: c.job_title ?? "",
  company_name: c.company_name ?? "",
  tagline: c.tagline ?? "",
  image_url: c.image_url ?? "",
  color_code: c.color_code || "#161616",
  country_code: c.country_code ?? "",
  phone_number: c.phone_number ?? "",
  is_whatsapp_number: !!c.is_whatsapp_number,
  highlight: c.highlight,
  payment_methods: (c.payment_methods ?? []).map((m) => ({
    provider: m.provider,
    label: m.label ?? "",
    value: m.value ?? "",
    qr_url: m.qr_url ?? "",
    currency: m.currency ?? "",
    is_default: !!m.is_default,
    enabled: m.enabled !== false,
  })),
  additional_phones: (c.additional_phones ?? []).map((p) => ({
    label: p.label ?? "mobile",
    country_code: p.country_code ?? "",
    phone_number: p.phone_number ?? "",
    is_whatsapp_number: !!p.is_whatsapp_number,
  })),
  additional_emails: (c.additional_emails ?? []).map((m) => ({ label: m.label ?? "work", email: m.email ?? "" })),
  ...(c.card_name != null ? { card_name: c.card_name } : {}),
  ...(c.video_url != null ? { video_url: c.video_url } : {}),
  email: c.email ?? "",
  website: c.website ?? "",
  social_media: (c.social_media ?? []).map((s) => ({ type: s.type, url: s.url ?? "", username: s.username ?? "" })),
  ventures: (c.ventures ?? []).map((v) => ({
    name: v.name ?? "",
    logo_url: v.logo_url ?? "",
    url: v.url ?? "",
    type: v.type ?? "venture",
    logo_size: v.logo_size ?? "s",
    file_name: v.file_name ?? "",
    description: v.description ?? "",
    ...(v.document_url ? { document_url: v.document_url, document_name: v.document_name ?? "" } : {}),
  })),
  agent_id: c.agent_id ?? "",
  username: c.username ?? "",
});

const initials = (n: string) => n.split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase();

// ═════════════════════════════════════════════════════════════════════════════
export default function DigitalCard({ section = "cards" }: { section?: string }) {
  const [params, setParams] = useSearchParams();
  const id = params.get("id");

  const go = useCallback(
    (sec: string, cardId?: string | null) => {
      const next = new URLSearchParams(params);
      next.set("section", sec);
      if (cardId) next.set("id", cardId);
      else next.delete("id");
      // Opening the editor from another section remembers where from, for its Back button.
      if (sec === "card" && section !== "card") {
        next.set("from", section);
        if (id) next.set("fromId", id);
        else next.delete("fromId");
      } else if (sec !== "card") {
        next.delete("from");
        next.delete("fromId");
      }
      setParams(next);
    },
    [params, setParams, section, id],
  );
  const from = params.get("from");
  const back = from && BACK_LABELS[from] ? { label: BACK_LABELS[from], go: () => go(from, params.get("fromId")) } : undefined;

  // Plan & billing reuse the dashboard's billing panel (Tailwind), so they render outside the
  // .dc scope — its generic rules (.grid, small, button…) would restyle that panel.
  if (section === "plan" || section === "billing") {
    const planParam = params.get("plan");
    const preselect =
      planParam === "essential" || planParam === "signature" || planParam === "prestige"
        ? { plan: planParam as "essential" | "signature" | "prestige", billing: (params.get("billing") === "monthly" ? "monthly" : "annual") as "monthly" | "annual" }
        : null;
    const checkout = params.get("checkout");
    return (
      // One "Plan & Billing" page; ?section=billing (older links) lands here too.
      <CardBilling
        inApp
        preselect={preselect}
        askToPay={params.get("pay") === "1"}
        checkoutResult={checkout === "success" || checkout === "cancelled" ? checkout : null}
        onCheckoutHandled={() => {
          const next = new URLSearchParams(params);
          ["checkout", "session_id", "plan", "billing", "pay"].forEach((k) => next.delete(k));
          setParams(next, { replace: true });
        }}
      />
    );
  }

  return (
    <div className="dc">
      {section === "share" ? (
        <SharePanel key={id ?? "none"} id={id} go={go} />
      ) : section === "monitoring" ? (
        <CardMonitoring cardId={id} go={go} />
      ) : section === "affiliate" ? (
        <CardAffiliate go={go} />
      ) : section === "card" ? (
        // "Edit" opens the owner's card; creating is only from My cards (id "new").
        id ? <CardEditor key={id} id={id} go={go} back={back} /> : <EditLanding go={go} />
      ) : (
        <CardsList go={go} />
      )}
    </div>
  );
}

// ── My Cards ─────────────────────────────────────────────────────────────────
/**
 * A paid plan chosen when the card was created but not paid for yet (closed Stripe, came back
 * later, logged in again…): ask to finish it. Checks billing first, so it never asks someone who
 * has already paid; and it clears itself then.
 */
function PendingPlanBanner() {
  const [pending, setPending] = useState<PendingPlan | null>(() => loadPendingPlan());
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!pending) return;
    let live = true;
    cardBillingAPI
      .overview()
      .then((o) => {
        if (!live) return;
        // Paid, or a founding member (no billing, everything included): nothing left to finish.
        if (o?.paid || o?.founding_member) {
          clearPendingPlan();
          setPending(null);
        }
        setChecked(true);
      })
      .catch(() => live && setChecked(true));
    return () => {
      live = false;
    };
    // Checked once per visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!pending || !checked) return null;
  const name = pending.plan === "prestige" ? "Prestige" : "Signature";
  return (
    <section className={`panel pend-plan is-${pending.plan}`} role="status">
      <div className="grow">
        <strong>Complete your {name} plan</strong>
        <p className="muted">Your card is ready. Finish payment to unlock {name}. Until then your card stays on Essential.</p>
      </div>
      <div className="btns">
        <Link className="btn small" to={pendingPlanHref(pending)}>
          Continue to payment
        </Link>
        <button
          type="button"
          className="btn small ghost"
          onClick={() => {
            clearPendingPlan();
            setPending(null);
          }}
        >
          Stay on Essential
        </button>
      </div>
    </section>
  );
}

const PLAN_LOOK: Record<PlanTier, { label: string; Icon: typeof Crown }> = {
  essential: { label: "Essential", Icon: Sparkles },
  signature: { label: "Signature", Icon: Award },
  prestige: { label: "Prestige", Icon: Crown },
};

/** "today", "yesterday", "3 days ago", "2 weeks ago", "5 Mar 2026". */
function updatedAgo(iso?: string): string {
  const t = iso ? Date.parse(iso) : NaN;
  if (Number.isNaN(t)) return "";
  const days = Math.floor((Date.now() - t) / 864e5);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/**
 * One card in My cards: who it is, its plan, what's set up, how it's doing this week (real
 * numbers only, never sample data), its QR code, and every action in one row.
 */
function CardRow({
  card: c,
  plan,
  complimentary,
  go,
  onCopy,
}: {
  card: BusinessCard;
  /** null while the plan is still being checked: plan bits wait, so nothing flickers. */
  plan: PlanTier | null;
  complimentary: boolean;
  go: (s: string, id?: string | null) => void;
  onCopy: () => void;
}) {
  const [week, setWeek] = useState<{ views: number; taps: number } | null>(null);
  const [sigOpen, setSigOpen] = useState(false);
  useEffect(() => {
    let live = true;
    cardInsightsAPI
      .analytics(c._id, "7d")
      .then((r) => {
        if (!live || !r.live) return; // sample data (stats not served yet) is never shown here
        const taps = Object.values(r.data.actions ?? {}).reduce((s, n) => s + (Number(n) || 0), 0);
        setWeek({ views: r.data.totals?.views ?? 0, taps });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [c._id]);

  const look = plan ? PLAN_LOOK[plan] : null;
  const planButton = !plan
    ? null
    : complimentary || plan === "prestige"
      ? { label: "Manage plan", href: "/app/digital-card?section=plan", upgrade: false }
      : plan === "signature"
        ? { label: "Upgrade to Prestige", href: "/app/digital-card?section=plan&plan=prestige&billing=annual", upgrade: true }
        : { label: "Upgrade", href: "/app/digital-card?section=plan", upgrade: true };
  const numbers = (c.phone_number ? 1 : 0) + (c.additional_phones?.length ?? 0);
  const ago = updatedAgo(c.updatedAt);

  return (
    <section className="panel cardrow">
      {/* Who: photo, name + plan, role, link, last update — QR on the right (wider screens) */}
      <div className="cardrow-main">
        <div className="avatar">
          {c.image_url ? <img src={c.image_url} alt="" onError={(e) => (e.currentTarget.style.display = "none")} /> : initials(c.full_name)}
        </div>
        <div className="grow">
          {c.card_name && <div className="card-label">{c.card_name}</div>}
          <div className="cardrow-title">
            <strong>{c.full_name}</strong>
            {look && (
              <span className={`plan-chip is-${plan}`}>
                <look.Icon size={11} aria-hidden="true" /> {look.label}
              </span>
            )}
          </div>
          {(c.job_title || c.company_name) && <div className="cardrow-role">{[c.job_title, c.company_name].filter(Boolean).join(" · ")}</div>}
          <div className="cardrow-link">
            <a className="slug" href={cardUrl(c)} target="_blank" rel="noopener noreferrer">
              {cardLabel(c)}
            </a>
            <button type="button" className="cardrow-copy" onClick={onCopy} aria-label="Copy link" title="Copy link">
              <Copy size={13} aria-hidden="true" />
            </button>
          </div>
          {ago && (
            <div className="cardrow-updated">
              <Clock size={12} aria-hidden="true" /> Updated {ago}
            </div>
          )}
        </div>
        {c.qr_code && (
          <a className="cardrow-qr" href={c.qr_code} target="_blank" rel="noopener noreferrer" title="Open the QR code">
            <img src={c.qr_code} alt={`QR code for ${cardLabel(c)}`} />
          </a>
        )}
      </div>

      {/* At a glance: this week's views and taps (real numbers only), and the AI Manager */}
      <dl className="cardrow-stats">
        <div>
          <dt>
            <Eye size={13} aria-hidden="true" /> Views
          </dt>
          <dd>{week ? week.views : "—"}</dd>
          <small>this week</small>
        </div>
        <div>
          <dt>
            <BarChart3 size={13} aria-hidden="true" /> Taps
          </dt>
          <dd>{week ? week.taps : "—"}</dd>
          <small>this week</small>
        </div>
        <div className={c.agent_id ? "is-on" : undefined}>
          <dt>
            <Bot size={13} aria-hidden="true" /> AI Manager
          </dt>
          <dd>{c.agent_id ? "On" : "Off"}</dd>
          <small>{c.agent_id ? "connected" : numbers ? `${numbers} number${numbers === 1 ? "" : "s"}` : "not set"}</small>
        </div>
      </dl>

      {/* Actions: the two main ones, then quick icons */}
      <div className="cardrow-actions">
        <button className="btn small" onClick={() => go("card", c._id)}>
          <Pencil size={14} aria-hidden="true" /> Edit card
        </button>
        <button className="btn small ghost" onClick={() => go("share", c._id)}>
          <Share2 size={14} aria-hidden="true" /> Share
        </button>
        <span className="cardrow-icons">
          <button type="button" className="icon-btn" onClick={() => setSigOpen(true)} aria-label="Add to email signature" title="Add to email signature">
            <Mail size={16} aria-hidden="true" />
          </button>
          <a className="icon-btn" href={cardUrl(c)} target="_blank" rel="noopener noreferrer" aria-label="Open card" title="Open card">
            <ExternalLink size={16} aria-hidden="true" />
          </a>
          <button type="button" className="icon-btn" onClick={() => go("monitoring", c._id)} aria-label="Insights" title="Insights">
            <BarChart3 size={16} aria-hidden="true" />
          </button>
        </span>
      </div>

      {/* Plan */}
      {planButton && look && (
        <div className={`cardrow-plan is-${plan}`}>
          <span>
            <look.Icon size={13} aria-hidden="true" /> {look.label} plan{complimentary ? " · Complimentary" : ""}
          </span>
          <Link className={planButton.upgrade ? "cardrow-plan-cta is-upgrade" : "cardrow-plan-cta"} to={planButton.href}>
            {planButton.upgrade ? <Crown size={13} aria-hidden="true" /> : <CreditCard size={13} aria-hidden="true" />} {planButton.label} ›
          </Link>
        </div>
      )}
      {sigOpen && <EmailSignatureSheet card={c} tier={plan ?? undefined} onClose={() => setSigOpen(false)} />}
    </section>
  );
}

function CardsList({ go }: { go: (s: string, id?: string | null) => void }) {
  // How many cards this plan allows (GET /billing/limits).
  const limits = usePlanLimits();
  const [page, setPage] = useState(1);
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [pg, setPg] = useState<Pagination | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [error, setError] = useState<BusinessCardError | null>(null);

  // The account's card plan (plans are per account): shown on each card, and picks its plan button.
  const { user } = useAuth();
  const comp = complimentaryPlan(user?.email);
  const [tier, setTier] = useState<PlanTier | null>(null);
  useEffect(() => {
    if (comp) return setTier(comp);
    let live = true;
    cardBillingAPI
      .overview()
      .then((o) => {
        const key = o?.paid ? o.plan?.key : null;
        if (live) setTier(key === "signature" || key === "prestige" ? key : "essential");
      })
      .catch(() => live && setTier("essential"));
    return () => {
      live = false;
    };
  }, [comp]);

  const load = useCallback(() => {
    setState("loading");
    businessCardAPI
      .list({ page, limit: PAGE_SIZE, sortBy: "updatedAt", sortOrder: "desc" })
      .then(({ cards, pagination }) => {
        cards.forEach((c) => cardCache.set(c._id, c));
        setCards(cards);
        setPg(pagination);
        setState("ok");
      })
      .catch((e: BusinessCardError) => {
        setError(e);
        setState("error");
      });
  }, [page]);

  useEffect(load, [load]);

  const copy = async (c: BusinessCard) => {
    await navigator.clipboard.writeText(cardUrl(c));
    toast.success("Link copied");
  };

  return (
    <div className="stackv">
      <div className="head cards-head">
        <div>
          <h2 className="title">
            My cards
            {state === "ok" && pg && pg.total > 0 && <span className="cards-count">{pg.total}</span>}
          </h2>
          <p className="muted">
            Each card gets its own public link and QR code.
            {limits.cards && <span className="cards-usage"> · {limitLabel(limits.cards)}</span>}
          </p>
        </div>
        {limits.cards && !limits.cards.allowed ? (
          // Full: say so, and offer the upgrade instead of opening an empty form.
          <button className="btn is-limit" aria-disabled="true" title="Upgrade to create more cards" onClick={() => showLimitFor("business_cards", limits.cards!, limits.planName)}>
            <Lock size={14} aria-hidden="true" /> New card
          </button>
        ) : (
          <button className="btn" onClick={() => go("card", "new")}>
            <Plus size={16} aria-hidden="true" /> New card
          </button>
        )}
      </div>

      <PendingPlanBanner />

      {state === "loading" && <p className="muted">Loading cards…</p>}

      {state === "error" && (
        <section className="panel">
          <p className="err">
            {error?.status === 403
              ? "Your account type can’t manage business cards. Only admin and tenant accounts can."
              : error?.message || "Couldn’t load your cards."}
          </p>
          {error?.status !== 403 && <button className="btn small" onClick={load}>Retry</button>}
        </section>
      )}

      {state === "ok" && cards.length === 0 && (
        <section className="panel empty">
          <h3>No cards yet</h3>
          <p className="muted">Create your first digital business card and share it in seconds.</p>
          <button className="btn small" onClick={() => go("card", "new")}>Create a card</button>
        </section>
      )}

      {state === "ok" &&
        cards.map((c) => (
          <CardRow
            key={c._id}
            card={c}
            // Complimentary accounts may keep a card on Signature (saved on the card).
            plan={tier && comp ? complimentarySavePlan(comp, c.plan) ?? comp : tier}
            complimentary={!!comp}
            go={go}
            onCopy={() => copy(c)}
          />
        ))}

      {pg && pg.totalPages > 1 && (
        <div className="pager">
          <button className="btn small ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="muted">Page {pg.page} of {pg.totalPages} · {pg.total} cards</span>
          <button className="btn small ghost" disabled={page >= pg.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}

/**
 * The Edit section opened without a card: open the owner's card straight away (their most
 * recently updated one), replacing the URL so Back doesn't bounce here. No card yet → point to
 * My cards, where cards are created.
 */
function EditLanding({ go }: { go: (s: string, id?: string | null) => void }) {
  const [params, setParams] = useSearchParams();
  const [state, setState] = useState<"loading" | "none" | "error">("loading");
  useEffect(() => {
    let live = true;
    businessCardAPI
      .list({ page: 1, limit: 1, sortBy: "updatedAt", sortOrder: "desc" })
      .then(({ cards }) => {
        if (!live) return;
        const first = cards[0];
        if (!first) return setState("none");
        cardCache.set(first._id, first);
        const next = new URLSearchParams(params);
        next.set("section", "card");
        next.set("id", first._id);
        setParams(next, { replace: true });
      })
      .catch(() => live && setState("error"));
    return () => {
      live = false;
    };
    // Once, when the section opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "loading") return <p className="muted">Opening your card…</p>;
  return (
    <section className="panel empty">
      <h3>{state === "none" ? "No card to edit yet" : "Couldn’t open your card"}</h3>
      <p className="muted">{state === "none" ? "Create your card in My cards, then edit it here any time." : "Please try again from My cards."}</p>
      <button className="btn small" onClick={() => go("cards", null)}>
        Go to My cards
      </button>
    </section>
  );
}

// ── Editor ───────────────────────────────────────────────────────────────────
/** Where the editor's Back button returns to, by the section it was opened from. */
const BACK_LABELS: Record<string, string> = {
  cards: "My cards",
  share: "Share & QR",
  monitoring: "Monitoring",
  affiliate: "Affiliate",
  plan: "Plan & Billing",
};

function CardEditor({
  id,
  go,
  back,
}: {
  id: string;
  go: (s: string, id?: string | null) => void;
  /** Shown when the editor was opened from another section. */
  back?: { label: string; go: () => void };
}) {
  const isNew = id === "new";
  const { agents, isLoading: agentsLoading, refreshAgents } = useAgent();
  const [load, setLoad] = useState<"loading" | "ready" | "missing" | "forbidden">(isNew ? "ready" : "loading");
  const [saved, setSaved] = useState<BusinessCard | null>(null);
  const [form, setForm] = useState<CardData>(() => (isNew ? loadDraft("dashboard") : emptyCard()));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [oldLink, setOldLink] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  // "Preview as": the card in each plan's look. Starts on the account's own plan.
  const [currentTier, setCurrentTier] = useState<PlanTier>("essential");
  // Choosing the card's link is a Prestige option; other plans get one made from the name.
  const chooseUsername = currentTier === "prestige";
  const [sigOpen, setSigOpen] = useState(false);
  const [previewTier, setPreviewTier] = useState<PlanTier>("essential");
  // Complimentary accounts: their plan without billing; the card's saved look (Signature) wins.
  const { user } = useAuth();
  const comp = complimentaryPlan(user?.email);
  const savedPlan = saved?.plan;
  useEffect(() => {
    if (!comp) return;
    const tier = complimentarySavePlan(comp, savedPlan) ?? comp;
    setCurrentTier(tier);
    setPreviewTier(tier);
  }, [comp, savedPlan]);
  useEffect(() => {
    if (comp) return;
    let live = true;
    cardBillingAPI
      .overview()
      .then((o) => {
        const key = o?.paid ? o.plan?.key : null;
        const tier: PlanTier = key === "signature" || key === "prestige" ? key : "essential";
        if (!live) return;
        setCurrentTier(tier);
        setPreviewTier(tier);
      })
      .catch(() => {
        /* no billing info: preview starts on Essential */
      });
    return () => {
      live = false;
    };
  }, [comp]);
  const set = (patch: CardPatch) => setForm((f) => ({ ...f, ...(typeof patch === "function" ? patch(f) : patch) }));

  // The plan's "AI agents" limit counts cards with an AI agent connected (Essential: none,
  // Signature: 2, Prestige: 5). It only applies here — creating agents elsewhere in the
  // dashboard is never limited by this app's plan. A card that already has an agent can
  // switch to another one without using up a new slot.
  const planLimits = usePlanLimits();
  const setCardField = (patch: CardPatch) => {
    const slot = planLimits.agents;
    if (typeof patch !== "function" && patch.agent_id && !saved?.agent_id && slot && !slot.allowed) {
      showLimitFor("ai_agents", slot, planLimits.planName);
      return;
    }
    set(patch);
  };

  // AgentProvider only auto-loads on agent-related routes (not /app/*).
  useEffect(() => {
    if (agents.length === 0) refreshAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isNew) return;
    let live = true;
    findCard(id)
      .then((c) => {
        if (!live) return;
        setSaved(c);
        setForm(withSuggestedTagline(fromCard(c)));
        setLoad("ready");
      })
      .catch((e: BusinessCardError) => live && setLoad(e.status === 403 ? "forbidden" : "missing"));
    return () => {
      live = false;
    };
  }, [id, isNew]);

  // Keep the not-yet-saved card as a local draft — until it's created, then never write it back.
  const created = useRef(false);
  useEffect(() => {
    if (isNew && !created.current) saveDraft("dashboard", form);
  }, [form, isNew]);

  // Signed-in editor: images upload straight away.
  const onImageFile = async (file: File, kind: ImageKind) => {
    try {
      const url = await uploadPhoto(file, kind);
      toast.success(kind === "logo" ? "Logo uploaded" : "Photo uploaded");
      return url;
    } catch (e: any) {
      toast.error(e?.message || "Couldn’t upload the image");
      return null;
    }
  };

  const submit = async () => {
    const v = validateCard(form, { skipUsername: !isNew || !chooseUsername });
    setErrors(v);
    if (Object.keys(v).length) {
      toast.error("Fix the highlighted fields");
      // Bring the first problem into view (it may be far down the form).
      requestAnimationFrame(() => {
        const first = document.querySelector<HTMLElement>(".dc .form .err");
        first?.closest(".field, .panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    setSaving(true);
    // Complimentary accounts save the look they're previewing (Prestige, or Signature).
    const plan = complimentarySavePlan(comp, previewTier);
    try {
      if (isNew) {
        const card = await createWithUsername(form, chooseUsername, { plan });
        cardCache.set(card._id, card);
        refreshPlanLimits();
        created.current = true;
        clearDraft();
        toast.success("Card created");
        go("share", card._id);
      } else {
        // The username is set once, at creation: never send it on update.
        const { username: _username, ...changes } = toPayload(form);
        const card = await businessCardAPI.update(id, changes, { plan });
        cardCache.set(card._id, card);
        if (plan) setCurrentTier(plan);
        if (saved && card.slug !== saved.slug) setOldLink(cardLabel(saved));
        setSaved(card);
        setErrors({});
        toast.success("Card updated");
      }
    } catch (e: any) {
      const be = e as BusinessCardError;
      if (handlePlanLimit(be)) {
        // Over the plan's card limit: the upgrade dialog explains (the form stays as typed).
      } else if (be.status === 404 && !isNew) {
        cardCache.delete(id);
        setLoad("missing");
      } else {
        if (be.status === 422) {
          setErrors(be.fieldErrors);
          requestAnimationFrame(() => {
            const first = document.querySelector<HTMLElement>(".dc .form .err");
            first?.closest(".field, .panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
        }
        toast.error(cardErrorMessage(be, "Couldn’t save the card"));
      }
    } finally {
      setSaving(false);
    }
  };

  if (load === "loading") return <p className="muted">Loading card…</p>;
  if (load === "forbidden")
    return <section className="panel"><p className="err">Your account type can’t manage business cards. Only admin and tenant accounts can.</p></section>;
  if (load === "missing")
    return (
      <section className="panel empty">
        <h3>This card is no longer available</h3>
        <p className="muted">It may have been removed, or it belongs to another account.</p>
        <button className="btn small" onClick={() => go("cards", null)}>Back to my cards</button>
      </section>
    );

  return (
    <div className="grid">
      <div className="form">
        {back && (
          <button type="button" className="link-back" onClick={back.go}>
            ← Back to {back.label}
          </button>
        )}
        {!isNew && saved && (
          <section className="panel notice">
            <div className="muted">Public link</div>
            <a href={cardUrl(saved)} target="_blank" rel="noopener noreferrer" className="slug">{cardUrl(saved)}</a>
            {oldLink && (
              <small className="warn">Your name or company changed, so the link changed too. The old link ({oldLink}) no longer works — re-share the new one.</small>
            )}
            <div className="btns">
              <button className="btn small" disabled={saving} onClick={submit}>
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button className="btn small ghost" onClick={() => go("share", saved._id)}>Share & QR</button>
              <button className="btn small ghost" onClick={() => setSigOpen(true)}>
                <Mail size={14} aria-hidden="true" /> Email signature
              </button>
              <button
                className="btn small ghost"
                onClick={() => document.getElementById("card-basics")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                Edit details ↓
              </button>
            </div>
            {/* Built from the saved card, so it matches what people see at the public link. */}
            {sigOpen && <EmailSignatureSheet card={saved} tier={currentTier} onClose={() => setSigOpen(false)} />}
          </section>
        )}

        <CardForm
          form={form}
          set={setCardField}
          errors={errors}
          onImageFile={onImageFile}
          agents={agents.map((a) => ({ id: a.id, name: a.name, status: a.status }))}
          agentsLoading={agentsLoading}
          savedUsername={saved?.username || saved?.slug || undefined}
          usernameLocked={!isNew}
          chooseUsername={chooseUsername}
          cardName={currentTier !== "essential"}
          onDocumentFile={(file) =>
            businessCardAPI.uploadDocument(file).then((r) => {
              toast.success("PDF uploaded");
              return r;
            })
          }
          onDocumentError={(m) => toast.error(m)}
          onVideoFile={(file, onProgress) => businessCardAPI.uploadVideo(file, onProgress)}
          videoLocked={currentTier === "essential"}
          onRefreshAgents={() => void refreshAgents()}
          onUpgrade={() => {
            const next = new URLSearchParams(params);
            next.set("section", "plan");
            next.delete("id");
            setParams(next);
          }}
        />

        <div className="savebar">
          <button className="btn" disabled={saving} onClick={submit}>{saving ? "Saving…" : isNew ? "Create card" : "Save changes"}</button>
          <button type="button" className="btn ghost preview-jump" onClick={() => document.querySelector(".dc .preview")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
            <Eye size={17} aria-hidden="true" /> Preview
          </button>
          <button className="btn ghost cancel-btn" disabled={saving} onClick={() => go("cards", null)}>Cancel</button>
        </div>
      </div>

      <aside className="preview">
        <div className="preview-head">
          <span className="fsec-ico" aria-hidden="true">
            <Eye size={19} strokeWidth={1.8} />
          </span>
          <span>
            <strong>Preview your card</strong>
            <small>See how it looks on each plan</small>
          </span>
        </div>
        <PlanLookSwitcher
          value={previewTier}
          current={currentTier}
          included={comp ?? undefined}
          onChange={setPreviewTier}
          onUpgrade={(tier) => {
            const next = new URLSearchParams(params);
            next.set("section", "plan");
            next.delete("id");
            next.set("plan", tier);
            next.set("billing", "annual");
            setParams(next);
          }}
        />
        <div className="phone-frame"><CardView card={form} placeholders tier={previewTier} /></div>
      </aside>
    </div>
  );
}

// ── Share & QR ───────────────────────────────────────────────────────────────
function SharePanel({ id, go }: { id: string | null; go: (s: string, id?: string | null) => void }) {
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "none" | "missing">(id ? "loading" : "none");
  const [copied, setCopied] = useState(false);
  const [qrImageBroken, setQrImageBroken] = useState(false);
  const [sigOpen, setSigOpen] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    let live = true;
    findCard(id)
      .then((c) => live && (setCard(c), setState("ready")))
      .catch(() => live && setState("missing"));
    return () => {
      live = false;
    };
  }, [id]);

  if (state === "none") return <QrListing go={go} />;
  if (state === "loading") return <p className="muted">Loading…</p>;
  if (state === "missing" || !card)
    return (
      <section className="panel empty">
        <h3>This card is no longer available</h3>
        <p className="muted">It may have been deleted. Pick another card to share.</p>
        <button className="btn small" onClick={() => go("share", null)}>All QR codes</button>
      </section>
    );

  const link = cardUrl(card);
  const qrImage = qrImageBroken ? null : cardQrImage(card);
  const qrFileName = `${card.slug}-qr.png`;
  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const share = () => navigator.share({ title: `${card.full_name} – Digital Card`, url: link }).catch(() => {});
  const downloadQR = async () => {
    if (qrImage) {
      // A cross-origin <a download> is ignored by browsers, so fetch it as a blob (S3 allows CORS).
      try {
        const res = await fetch(qrImage);
        if (!res.ok) throw new Error(String(res.status));
        const url = URL.createObjectURL(await res.blob());
        const a = document.createElement("a");
        a.href = url;
        a.download = qrFileName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch {
        window.open(qrImage, "_blank", "noopener,noreferrer");
      }
      return;
    }
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = c.height = 1024;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.drawImage(img, 0, 0, 1024, 1024);
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = qrFileName;
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(new XMLSerializer().serializeToString(svg));
  };

  return (
    <div className="stackv">
      <button type="button" className="link-back" onClick={() => go("share", null)}>
        ← All QR codes
      </button>
      <div className="qr-studio">
        <section className="panel share">
          <h3>
            Share {card.full_name}’s card{card.card_name && <span className="muted"> · {card.card_name}</span>}
          </h3>
          <div className="linkbox"><input readOnly value={link} onFocus={(e) => e.currentTarget.select()} /></div>
          <div className="btns">
            <button className="btn" onClick={copy}>{copied ? "Copied ✓" : "Copy link"}</button>
            {"share" in navigator && <button className="btn ghost" onClick={share}>Share…</button>}
            <a className="btn ghost" href={`https://wa.me/?text=${encodeURIComponent(link)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a className="btn ghost" href={link} target="_blank" rel="noopener noreferrer">Open card ↗</a>
            <button type="button" className="btn ghost" onClick={() => setSigOpen(true)}>
              <Mail size={15} aria-hidden="true" /> Email signature
            </button>
          </div>
          {sigOpen && <EmailSignatureSheet card={card} onClose={() => setSigOpen(false)} />}
          <div className="qr">
            <div ref={qrRef} className="qrbox">
              {qrImage ? (
                <img
                  src={qrImage}
                  alt={`QR code for ${card.full_name}'s card`}
                  width={168}
                  height={168}
                  style={{ display: "block", objectFit: "contain" }}
                  onError={() => setQrImageBroken(true)}
                />
              ) : (
                <QRCode value={link} size={168} />
              )}
            </div>
            <div>
              <p className="muted">Scan to open the card. The code stays valid until the name or company changes, which changes the link.</p>
              <button className="btn small" onClick={downloadQR}>Download QR (PNG)</button>
            </div>
          </div>
          <div className="btns"><button className="btn small ghost" onClick={() => go("card", card._id)}>Edit card</button></div>
        </section>

        <section className="panel qr-studio-design">
          <div>
            <h3>Design your QR wallpaper</h3>
            <p className="muted">
              Pick a format, background and colours, place your QR anywhere, then download it for your phone, tablet, desktop or wallet.
              Your design is saved to your card, so it’s there on any device.
            </p>
          </div>
          <QrPlayground
            key={card._id}
            link={link}
            initial={loadQrDesign(card)}
            onSave={async (d) => {
              // Errors surface inside the studio; only success gets a toast.
              const updated = await saveQrDesign(card, d);
              cardCache.set(updated._id, updated);
              toast.success("QR design saved to your card");
            }}
          />
        </section>
      </div>
    </div>
  );
}

// ── QR listing: every card's QR at a glance ─────────────────────────────────
function QrListing({ go }: { go: (s: string, id?: string | null) => void }) {
  const [cards, setCards] = useState<BusinessCard[] | null>(null);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    businessCardAPI
      .list({ limit: 50, sortBy: "updatedAt", sortOrder: "desc" })
      .then(({ cards }) => {
        cards.forEach((c) => cardCache.set(c._id, c));
        setCards(cards);
      })
      .catch((e: BusinessCardError) => setError(e.message || "Couldn’t load your cards"));
  }, []);

  const copy = async (c: BusinessCard) => {
    await navigator.clipboard.writeText(cardUrl(c));
    setCopiedId(c._id);
    setTimeout(() => setCopiedId((id) => (id === c._id ? null : id)), 1800);
  };

  return (
    <div className="stackv">
      <div className="head">
        <div>
          <h2 className="title">Share &amp; QR</h2>
          <p className="muted">Your cards’ QR codes. Open one to share it or design a QR wallpaper.</p>
        </div>
      </div>

      {error && (
        <section className="panel">
          <p className="err">{error}</p>
        </section>
      )}
      {!cards && !error && <p className="muted">Loading…</p>}
      {cards && cards.length === 0 && (
        <section className="panel empty">
          <h3>No QR codes yet</h3>
          <p className="muted">Every card gets its own QR code. Create your card to get yours.</p>
          <button className="btn small" onClick={() => go("card", "new")}>Create a card</button>
        </section>
      )}
      {cards && cards.length > 0 && (
        <div className="qr-list">
          {cards.map((c) => {
            const design = loadQrDesign(c);
            return (
              <article key={c._id} className="qr-list-item">
                <button type="button" className="qr-list-code" onClick={() => go("share", c._id)} aria-label={`Open ${c.full_name}'s QR`}>
                  <QRCode value={cardUrl(c)} size={132} fgColor={design?.fg ?? "#161616"} />
                </button>
                <div className="qr-list-meta">
                  {c.card_name && <span className="card-label">{c.card_name}</span>}
                  <strong>{c.full_name}</strong>
                  <span className="muted">{[c.job_title, c.company_name].filter(Boolean).join(" · ")}</span>
                  <span className="qr-list-link">{cardLabel(c)}</span>
                  {design && <span className="qr-list-badge">Custom design saved</span>}
                </div>
                <div className="qr-list-actions">
                  <button className="btn small" onClick={() => go("share", c._id)}>
                    Design QR
                  </button>
                  <button className="btn small ghost" onClick={() => copy(c)}>
                    {copiedId === c._id ? "Copied ✓" : "Copy link"}
                  </button>
                  <a className="btn small ghost" href={cardUrl(c)} target="_blank" rel="noopener noreferrer">
                    Open ↗
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
