import { CSSProperties, useCallback, useState } from "react";
import QRCode from "react-qr-code";
import { Award, Crown, Facebook, Instagram, Link2, Linkedin, LucideIcon, Phone, Sparkles, Twitter, UserPlus, Wallet, Youtube } from "lucide-react";
import WhatsAppIcon from "./WhatsAppIcon";
import GmailIcon from "./GmailIcon";
import { downloadVCard, fullPhone } from "./vcard";
import SaveContactSheet from "./SaveContactSheet";
import PayMeSheet from "./PayMeSheet";
import { visiblePayMethods } from "./payMe";
import { openCardAgent } from "./openCardAgent";
import { CardData, PHONE_LABELS, SOCIAL_TYPES, SocialType } from "./types";
import { ventureKind } from "./ventureKinds";
import { PUBLIC_APP_URL } from "../../../services/businessCardAPI";

const host = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
const href = (u: string) => (/^[a-z]+:/i.test(u) ? u : `https://${u}`);

type Social = CardData["social_media"][number];

/** A venture, or something to browse (catalog, PDF, menu, portfolio), with its logo at the chosen size. */
function VentureItem({ v }: { v: CardData["ventures"][number] }) {
  const kind = ventureKind(v.type);
  const size = v.logo_size ?? "s";
  const [broken, setBroken] = useState(false);
  const img =
    v.logo_url && !broken ? (
      <img className={`company-logo size-${size}`} src={v.logo_url} alt={`${v.name} ${kind.id === "venture" ? "logo" : "cover"}`} onError={() => setBroken(true)} />
    ) : null;
  const cover = size === "l" && img;
  const body = (
    <>
      {!cover && img && <span className={`company-thumb size-${size}`}>{img}</span>}
      <span className="company-body">
        {kind.id !== "venture" && (
          <span className="company-kind">
            <kind.Icon size={11} aria-hidden="true" />
            {kind.label}
          </span>
        )}
        <span className="company-name">{v.name}</span>
        {v.description?.trim() && <span className="company-desc">{v.description.trim()}</span>}
      </span>
      {v.url && (
        <span className="company-go" aria-hidden="true">
          ↗
        </span>
      )}
    </>
  );
  // One compact row (the same pattern as the Connect list); the whole row opens the link.
  return (
    <article className={`company kind-${kind.id}${cover ? " has-cover" : ""}`}>
      {cover && <div className="company-cover">{img}</div>}
      {v.url ? (
        <a className="company-row" href={href(v.url)} target="_blank" rel="noopener noreferrer" aria-label={`${kind.cta(v.name)} (opens in a new tab)`}>
          {body}
        </a>
      ) : (
        <div className="company-row">{body}</div>
      )}
    </article>
  );
}

/** Public URL for a social entry: the stored url, else built from the username. */
export function socialUrl(s: Social): string {
  if (s.url.trim()) return href(s.url.trim());
  const base = SOCIAL_TYPES.find((t) => t.value === s.type)?.base ?? "";
  return s.username.trim() && base ? base + s.username.trim().replace(/^@/, "") : "";
}

/** Brand badge per social type: white glyph on the brand colour. Website has no
 *  brand, so it's a plain link glyph. */
const SOCIAL_ICON: Record<SocialType, { Icon: LucideIcon; bg?: string }> = {
  linkedin: { Icon: Linkedin, bg: "#0a66c2" },
  instagram: { Icon: Instagram, bg: "radial-gradient(circle at 30% 107%,#fdf497 0%,#fd5949 45%,#d6249f 60%,#285aeb 90%)" },
  twitter: { Icon: Twitter, bg: "#111111" },
  facebook: { Icon: Facebook, bg: "#1877f2" },
  youtube: { Icon: Youtube, bg: "#ff0000" },
  website: { Icon: Link2 },
};

export function LinkIcon({ type }: { type: SocialType }) {
  const { Icon, bg } = SOCIAL_ICON[type];
  if (!bg) {
    return (
      <span className="link-ico plain" aria-hidden="true">
        <Icon size={18} strokeWidth={2} />
      </span>
    );
  }
  return (
    <span className="link-ico" style={{ background: bg }} aria-hidden="true">
      <Icon size={13} strokeWidth={2.4} />
    </span>
  );
}

const socialLabel = (s: Social) => SOCIAL_TYPES.find((t) => t.value === s.type)?.label ?? s.type;
const socialSub = (s: Social) =>
  s.username.trim() ? (s.type === "website" ? s.username : `@${s.username.trim().replace(/^@/, "")}`) : host(s.url);

/** Accent colour → CSS vars, keeping button text readable on light/white accents
 *  (the API default colour is #ffffff). */
function accentVars(hex: string): CSSProperties {
  let h = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex) ? hex : "#161616";
  if (h.length === 4) h = "#" + [...h.slice(1)].map((c) => c + c).join("");
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return {
    "--accent": h,
    "--accent-ink": lum > 0.6 ? "#161616" : "#ffffff",
    "--accent-border": lum > 0.85 ? "#c9c9c3" : h,
  } as CSSProperties;
}

/** `wide` enables the two-column desktop layout (public page only — the editor
 *  preview stays a phone-width card). `shareUrl` adds a "scan to open on your phone" QR. */
export default function CardView({
  card: c,
  wide = false,
  shareUrl,
  placeholders = false,
  poweredBy = false,
  slug,
  createCardHref,
  inlineAgent = true,
  agentUserId,
  tier,
}: {
  card: CardData;
  wide?: boolean;
  shareUrl?: string;
  /** Editor preview: show grey instructions for empty fields (never on the public page). */
  placeholders?: boolean;
  /** Adds a "Powered by ShivAI" line under the card (used by the marketing sample). */
  poweredBy?: boolean;
  /** Public page: a "Create your own digital card" button above the Powered-by line. */
  createCardHref?: string;
  /** "Ask My AI" opens the chat widget on the page (default) instead of the agent page. */
  inlineAgent?: boolean;
  /** Plan look: "signature" adds a silver mark, "prestige" the gold premium design. */
  tier?: "essential" | "signature" | "prestige";
  /** The card owner's tenant id, passed to the widget when known. */
  agentUserId?: string;
  /** The saved card's slug — lets "Save Contact" offer wallet passes (public page only). */
  slug?: string;
}) {
  const [imgBroken, setImgBroken] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const closePay = useCallback(() => setPayOpen(false), []);
  const [aiLoading, setAiLoading] = useState(false);
  const closeSave = useCallback(() => setSaveOpen(false), []);
  const tel = fullPhone(c);
  const waNumber = tel.replace(/\D/g, "");
  const payMethods = visiblePayMethods(c.payment_methods);
  const extraPhones = (c.additional_phones ?? []).map((p) => ({ p, num: fullPhone(p) })).filter((x) => x.num);
  const socials = c.social_media.map((s) => ({ s, url: socialUrl(s) })).filter((x) => x.url);
  // LinkedIn also gets a quick-action button, but stays in the list so every added link shows there.
  const linkedin = socials.find((x) => x.s.type === "linkedin");
  const connect = socials;
  const ventures = c.ventures.filter((v) => v.name.trim());
  const companies = ventures.filter((v) => ventureKind(v.type).id === "venture");
  const resources = ventures.filter((v) => ventureKind(v.type).id !== "venture");
  const initials = c.full_name.split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  const showPhoto = c.image_url && !imgBroken;
  const hasRight = connect.length > 0 || !!c.website || ventures.length > 0;

  return (
    <main className={"card" + (wide ? " wide" : "") + (tier && tier !== "essential" ? ` tier-${tier}` : "")} style={accentVars(c.color_code)}>
      <div className="topline">
        <span className={"wordmark" + (!c.full_name ? " ph-text" : "")}>{c.full_name || "Your name"}</span>
        <span className="toplabel">
          Digital Profile
          {(tier === "prestige" || tier === "signature") && (
            <span className={`tier-mark ${tier}`}>
              {tier === "prestige" ? <Crown size={11} aria-hidden="true" /> : <Award size={11} aria-hidden="true" />}
              {tier === "prestige" ? "Prestige" : "Signature"}
            </span>
          )}
        </span>
      </div>

      <div className={"cols" + (!hasRight ? " solo" : "")}>
      <div className="col-l">
      <header className="hero">
        <div className="portrait-wrap">
          {showPhoto ? (
            <img className="portrait" src={c.image_url} alt={`Portrait of ${c.full_name}`} onError={() => setImgBroken(true)} />
          ) : (
            <div className="portrait ph">{initials || "＋"}</div>
          )}
        </div>
        <div className="hero-text">
        <h1 className={!c.full_name ? "ph-text" : undefined}>{c.full_name || "Your name"}</h1>
        {c.job_title || c.company_name ? (
          <p className="role">{[c.job_title, c.company_name].filter(Boolean).join(", ")}</p>
        ) : (
          placeholders && <p className="role ph-text">Job title, Company</p>
        )}
        {c.tagline ? (
          <>
            <div className="hero-rule" />
            <p className="tagline">{c.tagline}</p>
          </>
        ) : (
          placeholders && (
            <>
              <div className="hero-rule" />
              <p className="tagline ph-text">Your tagline</p>
            </>
          )
        )}
        </div>
      </header>

      <nav className="actions" aria-label="Contact actions">
        {tel && <a className="action" href={`tel:${tel}`}><Phone size={15} /> Call</a>}
        {c.agent_id && (
          <a
            className="action"
            href={`${PUBLIC_APP_URL}/MyAIEmployee/${encodeURIComponent(c.agent_id)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-busy={aiLoading}
            onClick={async (e) => {
              // Open the chat widget right here; Ctrl/Cmd/Shift/middle-click still opens the agent page.
              if (!inlineAgent || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              if (aiLoading) return;
              const href = e.currentTarget.href;
              setAiLoading(true);
              const ok = await openCardAgent(c.agent_id, agentUserId);
              setAiLoading(false);
              if (!ok) window.open(href, "_blank", "noopener,noreferrer"); // widget unavailable → the agent page
            }}
          >
            <Sparkles size={15} /> {aiLoading ? "Connecting…" : "Ask My AI"}
          </a>
        )}
        {tel && c.is_whatsapp_number && (
          <a className="action" href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> WhatsApp</a>
        )}
        {payMethods.length > 0 && (
          <button className="action pay" type="button" onClick={() => setPayOpen(true)}><Wallet size={15} /> Pay Me</button>
        )}
        {c.email && <a className="action light" href={`mailto:${c.email}`}><GmailIcon /> Email</a>}
        {linkedin && <a className="action light" href={linkedin.url} target="_blank" rel="noopener noreferrer"><Linkedin size={15} /> LinkedIn</a>}
        <button className="action save" type="button" disabled={!c.full_name} onClick={() => setSaveOpen(true)}><UserPlus size={15} /> Save Contact</button>
      </nav>
      {extraPhones.length > 0 && (
        <ul className="xphones" aria-label="More phone numbers">
          {extraPhones.map(({ p, num }, i) => (
            <li key={i}>
              <a className="xphones-call" href={`tel:${num}`}>
                <span className="xphones-icon"><Phone size={14} /></span>
                <span>
                  <span className="xphones-label">{PHONE_LABELS.find((l) => l.value === p.label)?.label ?? "Phone"}</span>
                  <span className="xphones-num">{p.country_code} {p.phone_number}</span>
                </span>
              </a>
              {p.is_whatsapp_number && (
                <a className="xphones-wa" href={`https://wa.me/${num.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${p.country_code} ${p.phone_number}`}>
                  <WhatsAppIcon />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
      {placeholders && !tel && !c.email && (
        <p className="ph-hint">Add your phone and email to show Call, WhatsApp and Email buttons here.</p>
      )}

      {wide && shareUrl && (
        <div className="qr-desk">
          <div className="qr-desk-box"><QRCode value={shareUrl} size={96} /></div>
          <div>
            <strong>Open on your phone</strong>
            <span>Scan to save this card and contact details.</span>
          </div>
        </div>
      )}
      </div>

      <div className="col-r">

      {(connect.length > 0 || c.website) && (
        <section className="section">
          <div className="section-head"><h2>Connect</h2><span className="section-note">Across platforms</span></div>
          <div className="link-list">
            {c.website && (
              <a href={href(c.website)} target="_blank" rel="noopener noreferrer">
                <span className="link-main"><LinkIcon type="website" /><span><span className="link-title">Website</span><span className="link-sub">{host(c.website)}</span></span></span><span className="arrow">↗</span>
              </a>
            )}
            {connect.map(({ s, url }, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <span className="link-main"><LinkIcon type={s.type} /><span><span className="link-title">{socialLabel(s)}</span><span className="link-sub">{socialSub(s)}</span></span></span><span className="arrow">↗</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {companies.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Ventures</h2><span className="section-note">What I’m building</span></div>
          {companies.map((v, i) => (
            <VentureItem key={i} v={v} />
          ))}
        </section>
      )}

      {resources.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Catalogs &amp; documents</h2><span className="section-note">Take a look</span></div>
          {resources.map((v, i) => (
            <VentureItem key={i} v={v} />
          ))}
        </section>
      )}

      </div>
      </div>

      <footer className="footer"><strong>{(c.full_name || "YOUR NAME").toUpperCase()}</strong><span>{c.company_name || "Digital card"}</span></footer>
      {createCardHref && (
        <a className="make-cta" href={createCardHref}>
          <span className="make-cta-text">Create your own digital card</span>
          <span className="make-cta-arrow" aria-hidden="true">→</span>
        </a>
      )}
      {poweredBy && (
        <p className="powered">
          Powered by <a href="https://www.callshivai.com" target="_blank" rel="noopener noreferrer"><strong>ShivAI</strong></a>
        </p>
      )}
      {payOpen && <PayMeSheet name={c.full_name} slug={slug} methods={payMethods} onClose={closePay} />}
      {saveOpen && (
        <SaveContactSheet name={c.full_name} slug={slug} onSaveToPhone={() => downloadVCard(c, socialUrl)} onClose={closeSave} />
      )}
    </main>
  );
}
