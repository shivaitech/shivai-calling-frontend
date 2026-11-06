import { CSSProperties, MouseEvent, ReactNode, useCallback, useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { ArrowRight, Award, Check, Crown, Star, Facebook, Instagram, Link2, Linkedin, LucideIcon, Mail, Phone, Share2, Sparkles, Twitter, UserPlus, Wallet, Youtube } from "lucide-react";
import WhatsAppIcon from "./WhatsAppIcon";
import { defaultCountries } from "../../../types/country";
import { downloadVCard, fullPhone } from "./vcard";
import SaveContactSheet from "./SaveContactSheet";
import PayMeSheet from "./PayMeSheet";
import WhatsAppPickerSheet, { type WhatsAppNumber } from "./WhatsAppPickerSheet";
import { visiblePayMethods } from "./payMe";
import { openCardAgent } from "./openCardAgent";
import { trackCardEvent, type CardEventType } from "./cardEvents";
import { CardData, PHONE_LABELS, SOCIAL_TYPES, SocialType } from "./types";
import { ventureKind } from "./ventureKinds";
import prestigeBadge from "../../../resources/images/prestige-badge.webp";
import { foundingOfferActive } from "../../../pages/foundingOffer";

const FOUNDING_SHORT = "31 Dec 2026";
import { PUBLIC_APP_URL, publicCardUrl, type CardHighlight } from "../../../services/businessCardAPI";

const host = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

/** A link as people read it: domain plus a short path, never the query string.
 *  "https://www.youtube.com/watch?v=…&list=…" → "youtube.com/watch…". Capped at `max` characters. */
export function shortLink(u: string, max = 34): string {
  const clean = host(u.trim());
  const cut = clean.search(/[?#]/);
  const base = cut >= 0 ? clean.slice(0, cut) + "…" : clean;
  return base.length > max ? base.slice(0, max - 1).replace(/[/.\-_]+$/, "") + "…" : base;
}
const href = (u: string) => (/^[a-z]+:/i.test(u) ? u : `https://${u}`);

type Social = CardData["social_media"][number];

/** A document with a folded corner and "PDF" on it — marks items that open a PDF. */
function PdfIcon() {
  return (
    <svg className="company-pdf" viewBox="0 0 26 30" role="img" aria-label="PDF">
      <path d="M4.5 1h12.5l7.5 7.5V27a2 2 0 0 1-2 2H4.5a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M17 1v6.5a1 1 0 0 0 1 1h6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <text x="13.5" y="21.5" textAnchor="middle" fontSize="6.6" fontWeight="700" fill="currentColor" fontFamily="inherit" letterSpacing=".3">
        PDF
      </text>
    </svg>
  );
}

/** A venture, or something to browse (catalog, PDF, menu, portfolio), with its logo at the chosen size. */
function VentureItem({ v, onOpen }: { v: CardData["ventures"][number]; onOpen?: () => void }) {
  const kind = ventureKind(v.type);
  const size = v.logo_size ?? "s";
  const [broken, setBroken] = useState(false);
  // Sized by the image's shape: wordmarks sit bare, photos fill a square tile, the rest get a padded tile.
  const [shape, setShape] = useState<"wide" | "photo" | "tile">("wide");
  const img =
    v.logo_url && !broken ? (
      <img className={`company-logo size-${size}`} src={v.logo_url} alt={`${v.name} ${kind.id === "venture" ? "logo" : "cover"}`} onError={() => setBroken(true)}
        onLoad={(e) => {
          const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
          const r = h ? w / h : 1;
          setShape(r >= 1.6 ? "wide" : r >= 0.8 && r <= 1.25 ? "photo" : "tile");
        }}
      />
    ) : null;
  const cover = size === "l" && img;
  // Uploaded PDFs (and links straight to a .pdf) get a small PDF badge.
  const isPdf = !!v.file_name?.trim() || /\.pdf($|[?#])/i.test(v.url ?? "");
  const body = (
    <>
      {!cover && img && (
        <>
          <span className={`company-thumb size-${size} shape-${shape}`}>{img}</span>
          <span className="company-sep" aria-hidden="true" />
        </>
      )}
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
      {isPdf && <PdfIcon />}
      {v.url && (
        <span className="company-go" aria-hidden="true">
          ›
        </span>
      )}
    </>
  );
  // One compact row (the same pattern as the Connect list); the whole row opens the link.
  return (
    <article className={`company kind-${kind.id}${cover ? " has-cover" : ""}`}>
      {cover && <div className="company-cover">{img}</div>}
      {v.url ? (
        <a className="company-row" href={href(v.url)} target="_blank" rel="noopener noreferrer" aria-label={`${kind.cta(v.name)} (opens in a new tab)`} onClick={onOpen}>
          {body}
        </a>
      ) : (
        <div className="company-row">{body}</div>
      )}
    </article>
  );
}

/** Dial code → country for the flag. Shared codes go to their most common country. */
const DIAL_DEFAULT: Record<string, string> = { "+1": "us", "+7": "ru", "+44": "gb", "+61": "au", "+39": "it" };
function flagIso(dialCode: string): string | null {
  const d = dialCode.trim().startsWith("+") ? dialCode.trim() : `+${dialCode.trim()}`;
  if (DIAL_DEFAULT[d]) return DIAL_DEFAULT[d];
  return defaultCountries.find((x) => x.dialCode === d)?.code.toLowerCase() ?? null;
}

/** A tap-to-call tile: flag, number, "Click to call directly", call icon. */
function PhoneTile({ code, number, tel, label, onClick }: { code: string; number: string; tel: string; label?: string; onClick?: () => void }) {
  const iso = flagIso(code);
  const [flagOk, setFlagOk] = useState(true);
  return (
    <a className="phone-tile" href={`tel:${tel}`} aria-label={`Call ${code} ${number}`} onClick={onClick}>
      {iso && flagOk ? (
        <img className="phone-flag" src={`https://flagcdn.com/${iso}.svg`} alt="" width={22} height={16} loading="lazy" onError={() => setFlagOk(false)} />
      ) : (
        <span className="phone-flag phone-flag-text">{code}</span>
      )}
      <span className="phone-text">
        <span className="phone-num">
          {code} {number}
        </span>
        <span className="phone-sub">{label ? `${label} · Click to call` : "Click to call directly"}</span>
      </span>
      <span className="phone-ico" aria-hidden="true">
        <Phone size={13} />
      </span>
    </a>
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
  s.username.trim() ? (s.type === "website" ? shortLink(s.username) : `@${s.username.trim().replace(/^@/, "")}`) : shortLink(s.url);

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
  foundingMember = false,
  trackSlug,
}: {
  /** Public page only: send visitor taps to the owner's Monitoring. */
  trackSlug?: string;
  /** Shows the small "Founding Member" badge (cards created under the offer). */
  foundingMember?: boolean;
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
  // The Prestige look uses the client's fonts (Playfair Display, Inter, Cinzel); load them once, only when needed.
  useEffect(() => {
    if (tier !== "prestige" || document.getElementById("prestige-font")) return;
    const l = document.createElement("link");
    l.id = "prestige-font";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..700;1,400..600&family=Inter:wght@400..700&family=Cinzel:wght@500..700&display=swap";
    document.head.appendChild(l);
  }, [tier]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [waOpen, setWaOpen] = useState(false);
  // Share: the phone's own share sheet where there is one, else copy the link (shown as "Link copied").
  const [shared, setShared] = useState(false);
  const shareLink = shareUrl || (slug ? publicCardUrl(slug) : "");
  const shareCard = async () => {
    if (!shareLink) return;
    track("share");
    const role = [c.job_title, c.company_name].filter(Boolean).join(", ");
    const data = { title: c.full_name ? `${c.full_name}, digital business card` : "Digital business card", text: [c.full_name, role].filter(Boolean).join(" · "), url: shareLink };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch (e) {
        if ((e as DOMException)?.name === "AbortError") return; // closed the sheet
      }
    }
    try {
      await navigator.clipboard.writeText(shareLink);
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    } catch {
      /* clipboard blocked: nothing more we can do quietly */
    }
  };
  const closeWa = useCallback(() => setWaOpen(false), []);
  const closePay = useCallback(() => setPayOpen(false), []);
  const [aiLoading, setAiLoading] = useState(false);
  const closeSave = useCallback(() => setSaveOpen(false), []);
  const tel = fullPhone(c);
  const payMethods = visiblePayMethods(c.payment_methods);
  const track = (type: CardEventType) => trackCardEvent(trackSlug, type);
  // The featured button: the owner’s pick when that action exists on the card, else My AI.
  const available: Record<CardHighlight, boolean> = {
    ai: !!c.agent_id,
    whatsapp: (!!tel && c.is_whatsapp_number) || (c.additional_phones ?? []).some((p) => p.is_whatsapp_number && !!fullPhone(p)),
    email: !!c.email,
    pay: payMethods.length > 0,
    save: true,
  };
  const featured: CardHighlight | null = c.highlight && available[c.highlight] ? c.highlight : available.ai ? "ai" : null;
  const firstName = c.full_name.trim().split(/s+/)[0] || "me";
  const BANNERS: Record<CardHighlight, { icon: ReactNode; title: string; sub: string }> = {
    ai: { icon: <Sparkles size={20} />, title: "Talk to My AI Manager", sub: "Get answers about me, my work and my ventures" },
    whatsapp: { icon: <WhatsAppIcon mono size={21} />, title: "Message me on WhatsApp", sub: "Start a chat with me directly" },
    email: { icon: <Mail size={20} />, title: "Email me", sub: c.email },
    pay: { icon: <Wallet size={20} />, title: "Pay Me", sub: "Pay me securely using your preferred payment method" },
    save: { icon: <UserPlus size={20} />, title: "Save my contact", sub: `Add ${firstName} to your phone in one tap` },
  };
  const agentHref = `${PUBLIC_APP_URL}/MyAIEmployee/${encodeURIComponent(c.agent_id)}`;
  // Open the chat widget right here; Ctrl/Cmd/Shift/middle-click still opens the agent page.
  const openAgent = async (e: MouseEvent<HTMLAnchorElement>) => {
    track("ask_ai");
    if (!inlineAgent || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (aiLoading) return;
    const href = e.currentTarget.href;
    setAiLoading(true);
    const ok = await openCardAgent(c.agent_id, agentUserId);
    setAiLoading(false);
    if (!ok) window.open(href, "_blank", "noopener,noreferrer"); // widget unavailable → the agent page
  };
  const extraPhones = (c.additional_phones ?? []).map((p) => ({ p, num: fullPhone(p) })).filter((x) => x.num);
  const extraWa = extraPhones.filter(({ p }) => p.is_whatsapp_number);
  const waNumbers: WhatsAppNumber[] = [
    ...(tel && c.is_whatsapp_number
      ? [{ display: `${c.country_code} ${c.phone_number}`, iso: flagIso(c.country_code), href: `https://wa.me/${tel.replace(/\D/g, "")}`, label: extraWa.length ? "Main number" : undefined }]
      : []),
    ...extraWa.map(({ p, num }) => ({
      display: `${p.country_code} ${p.phone_number}`,
      iso: flagIso(p.country_code),
      href: `https://wa.me/${num.replace(/\D/g, "")}`,
      label: PHONE_LABELS.find((l) => l.value === p.label)?.label,
    })),
  ].filter((n, i, all) => all.findIndex((m) => m.href === n.href) === i);
  // One WhatsApp number opens the chat; several open a picker so the visitor chooses.
  const openWhatsApp = (e: MouseEvent<HTMLAnchorElement>) => {
    if (waNumbers.length > 1) {
      e.preventDefault();
      setWaOpen(true);
      return;
    }
    track("whatsapp");
  };
  const socials = c.social_media.map((s) => ({ s, url: socialUrl(s) })).filter((x) => x.url);
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
        <div className="portrait-box">
          <div className="portrait-wrap">
            {showPhoto ? (
              <img className="portrait" src={c.image_url} alt={`Portrait of ${c.full_name}`} onError={() => setImgBroken(true)} />
            ) : (
              <div className="portrait ph">{initials || "＋"}</div>
            )}
          </div>
          {/* Prestige: the gold verified seal on the photo's bottom-right corner. */}
          {tier === "prestige" && (
            <img className="portrait-seal" src={prestigeBadge} alt="Verified Prestige member" title="Verified Prestige member" width={30} height={30} />
          )}
        </div>
        <div className="hero-text">
        {foundingMember && (
          <span className="founding-badge">
            <Star size={10} aria-hidden="true" /> Founding Member
          </span>
        )}
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

      {/* Featured button: the action the owner picked (My AI by default), first under the profile */}
      {featured &&
        (() => {
          const b = BANNERS[featured];
          const inner = (
            <>
              <span className="ai-spark" aria-hidden="true">
                {b.icon}
              </span>
              <span className="ai-div" aria-hidden="true" />
              <span className="ai-text">
                <span className="ai-title">{featured === "ai" && aiLoading ? "Connecting…" : b.title}</span>
                <span className="ai-sub">{b.sub}</span>
              </span>
              <span className="ai-go" aria-hidden="true">
                <ArrowRight size={15} />
              </span>
            </>
          );
          if (featured === "ai")
            return (
              <a className="ai-banner" href={agentHref} target="_blank" rel="noopener noreferrer" aria-busy={aiLoading} onClick={openAgent}>
                {inner}
              </a>
            );
          if (featured === "whatsapp")
            return (
              <a className="ai-banner" href={waNumbers[0]?.href} target="_blank" rel="noopener noreferrer" onClick={openWhatsApp}>
                {inner}
              </a>
            );
          if (featured === "email")
            return (
              <a className="ai-banner" href={`mailto:${c.email}`} onClick={() => track("email")}>
                {inner}
              </a>
            );
          if (featured === "pay")
            return (
              <button type="button" className="ai-banner" onClick={() => (track("pay"), setPayOpen(true))}>
                {inner}
              </button>
            );
          return (
            <button type="button" className="ai-banner" disabled={!c.full_name} onClick={() => setSaveOpen(true)}>
              {inner}
            </button>
          );
        })()}

      {/* Numbers: one tap-to-call tile each (primary first) */}
      {(tel || extraPhones.length > 0) && (
        <div className={`phones${(tel ? 1 : 0) + extraPhones.length === 1 ? " one" : ""}`} aria-label="Phone numbers">
          {tel && <PhoneTile code={c.country_code} number={c.phone_number} tel={tel} onClick={() => track("call")} />}
          {extraPhones.map(({ p, num }, i) => (
            <PhoneTile
              key={i}
              code={p.country_code}
              number={p.phone_number}
              tel={num}
              onClick={() => track("call")}
              label={p.label !== "mobile" ? PHONE_LABELS.find((l) => l.value === p.label)?.label : undefined}
            />
          ))}
        </div>
      )}

      {/* Quick actions: everything else, icon over label */}
      <nav className="quick" aria-label="Contact actions">
        {available.ai && featured !== "ai" && (
          <a className="quick-btn" href={agentHref} target="_blank" rel="noopener noreferrer" aria-busy={aiLoading} onClick={openAgent}>
            <Sparkles size={20} strokeWidth={1.7} />
            {aiLoading ? "Connecting…" : "My AI"}
          </a>
        )}
        {available.whatsapp && featured !== "whatsapp" && (
          <a className="quick-btn" href={waNumbers[0]?.href} target="_blank" rel="noopener noreferrer" onClick={openWhatsApp}>
            <WhatsAppIcon mono size={20} />
            WhatsApp
          </a>
        )}
        {available.email && featured !== "email" && (
          <a className="quick-btn" href={`mailto:${c.email}`} onClick={() => track("email")}>
            <Mail size={20} strokeWidth={1.7} />
            Email
          </a>
        )}
        {available.pay && featured !== "pay" && (
          <button className="quick-btn" type="button" onClick={() => (track("pay"), setPayOpen(true))}>
            <Wallet size={20} strokeWidth={1.7} />
            Pay Me
          </button>
        )}
        {featured !== "save" && (
          <button className="quick-btn" type="button" disabled={!c.full_name} onClick={() => setSaveOpen(true)}>
            <UserPlus size={20} strokeWidth={1.7} />
            Save Contact
          </button>
        )}
        {shareLink && (
          <button className="quick-btn" type="button" onClick={() => void shareCard()} aria-label="Share this card">
            {shared ? <Check size={20} strokeWidth={1.9} /> : <Share2 size={20} strokeWidth={1.7} />}
            {shared ? "Link copied" : "Share"}
          </button>
        )}
      </nav>
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
              <a href={href(c.website)} target="_blank" rel="noopener noreferrer" onClick={() => track("link")}>
                <span className="link-main"><LinkIcon type="website" /><span><span className="link-title">Website</span><span className="link-sub">{shortLink(c.website)}</span></span></span><span className="arrow">›</span>
              </a>
            )}
            {connect.map(({ s, url }, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" onClick={() => track(s.type === "linkedin" ? "linkedin" : "link")}>
                <span className="link-main"><LinkIcon type={s.type} /><span><span className="link-title">{socialLabel(s)}</span><span className="link-sub">{socialSub(s)}</span></span></span><span className="arrow">›</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {ventures.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>What I’m building</h2><span className="section-note">Projects, products and resources</span></div>
          <div className="build-list">
            {[...companies, ...resources].map((v, i) => (
              <VentureItem key={i} v={v} onOpen={() => track("link")} />
            ))}
          </div>
        </section>
      )}

      </div>
      </div>

      <footer className="footer">
        <span className="footer-id">
          <strong>{(c.full_name || "YOUR NAME").toUpperCase()}</strong>
          <span>{[c.job_title, c.company_name].filter(Boolean).join(", ") || "Digital card"}</span>
        </span>
        {poweredBy && (
          <span className="footer-powered">
            Powered by{" "}
            <a href="https://www.callshivai.com" target="_blank" rel="noopener noreferrer">
              <strong>ShivAI</strong>
            </a>
          </span>
        )}
      </footer>
      {createCardHref && (
        <a className="make-cta" href={createCardHref}>
          <span className="make-cta-main">
            <span className="make-cta-text">
              {/* Prestige: one italic line, as in the client's design. */}
              {tier === "prestige" && foundingOfferActive() ? "Create your own digital card — Free for a limited time" : "Create your own digital card"}
            </span>
            <span className="make-cta-arrow" aria-hidden="true">→</span>
          </span>
          {foundingOfferActive() && tier !== "prestige" && (
            <span className="make-cta-sub">
              <span className="make-cta-dot" aria-hidden="true" />
              Free for life · Founding offer until {FOUNDING_SHORT}
            </span>
          )}
        </a>
      )}
      {payOpen && <PayMeSheet name={c.full_name} slug={slug} methods={payMethods} onClose={closePay} />}
      {waOpen && <WhatsAppPickerSheet name={c.full_name} numbers={waNumbers} onPick={() => track("whatsapp")} onClose={closeWa} />}
      {saveOpen && (
        <SaveContactSheet name={c.full_name} slug={slug} onSaveToPhone={() => (track("save_contact"), downloadVCard(c, socialUrl))} onClose={closeSave} />
      )}
    </main>
  );
}
