import { CSSProperties, useCallback, useState } from "react";
import QRCode from "react-qr-code";
import { Facebook, Instagram, Link2, Linkedin, LucideIcon, Twitter, Youtube } from "lucide-react";
import { downloadVCard, fullPhone } from "./vcard";
import SaveContactSheet from "./SaveContactSheet";
import { CardData, SOCIAL_TYPES, SocialType } from "./types";
import { PUBLIC_APP_URL } from "../../../services/businessCardAPI";

const host = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
const href = (u: string) => (/^[a-z]+:/i.test(u) ? u : `https://${u}`);

type Social = CardData["social_media"][number];

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
}: {
  card: CardData;
  wide?: boolean;
  shareUrl?: string;
  /** Editor preview: show grey instructions for empty fields (never on the public page). */
  placeholders?: boolean;
  /** Adds a "Powered by ShivAI" line under the card (used by the marketing sample). */
  poweredBy?: boolean;
  /** The saved card's slug — lets "Save Contact" offer wallet passes (public page only). */
  slug?: string;
}) {
  const [imgBroken, setImgBroken] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const closeSave = useCallback(() => setSaveOpen(false), []);
  const tel = fullPhone(c);
  const waNumber = tel.replace(/\D/g, "");
  const socials = c.social_media.map((s) => ({ s, url: socialUrl(s) })).filter((x) => x.url);
  // LinkedIn also gets a quick-action button, but stays in the list so every added link shows there.
  const linkedin = socials.find((x) => x.s.type === "linkedin");
  const connect = socials;
  const ventures = c.ventures.filter((v) => v.name.trim());
  const initials = c.full_name.split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  const showPhoto = c.image_url && !imgBroken;
  const hasRight = connect.length > 0 || !!c.website || ventures.length > 0;

  return (
    <main className={"card" + (wide ? " wide" : "")} style={accentVars(c.color_code)}>
      <div className="topline">
        <span className={"wordmark" + (!c.full_name ? " ph-text" : "")}>{c.full_name || "Your name"}</span>
        <span className="toplabel">Digital Profile</span>
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
      </header>

      <nav className="actions" aria-label="Contact actions">
        {tel && <a className="action" href={`tel:${tel}`}>↗ Call</a>}
        {c.agent_id && (
          <a className="action" href={`${PUBLIC_APP_URL}/MyAIEmployee/${encodeURIComponent(c.agent_id)}`} target="_blank" rel="noopener noreferrer">✦ Ask My AI</a>
        )}
        {tel && c.is_whatsapp_number && (
          <a className="action" href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer">↗ WhatsApp</a>
        )}
        {c.email && <a className="action light" href={`mailto:${c.email}`}>✉ Email</a>}
        {linkedin && <a className="action light" href={linkedin.url} target="_blank" rel="noopener noreferrer"><Linkedin size={15} /> LinkedIn</a>}
        <button className="action save" type="button" disabled={!c.full_name} onClick={() => setSaveOpen(true)}>＋ Save Contact</button>
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

      {ventures.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Ventures</h2><span className="section-note">What I’m building</span></div>
          {ventures.map((v, i) => (
            <article key={i} className="company">
              <div className="company-top">
                <span className="company-name">{v.name}</span>
                {v.logo_url && <img className="company-logo" src={v.logo_url} alt={`${v.name} logo`} onError={(e) => (e.currentTarget.style.display = "none")} />}
              </div>
              {v.url && <a className="company-link" href={href(v.url)} target="_blank" rel="noopener noreferrer">Explore {v.name} ↗</a>}
            </article>
          ))}
        </section>
      )}

      </div>
      </div>

      <footer className="footer"><strong>{(c.full_name || "YOUR NAME").toUpperCase()}</strong><span>{c.company_name || "Digital card"}</span></footer>
      {poweredBy && (
        <p className="powered">
          Powered by <a href="https://www.callshivai.com" target="_blank" rel="noopener noreferrer"><strong>ShivAI</strong></a>
        </p>
      )}
      {saveOpen && (
        <SaveContactSheet name={c.full_name} slug={slug} onSaveToPhone={() => downloadVCard(c, socialUrl)} onClose={closeSave} />
      )}
    </main>
  );
}
