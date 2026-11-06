import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, X } from "lucide-react";
import CardView from "./CardView";
import { emptyCard, type CardData } from "./types";
import samplePortrait from "../../../resources/images/sample-portrait.jpg";
import raminderPortrait from "../../../resources/images/sample-raminder.webp";
import shivaiLogo from "../../../resources/images/sample-logo-shivai.webp";
import celebfieLogo from "../../../resources/images/sample-logo-celebfie.webp";
import { foundingOfferActive } from "../../../pages/foundingOffer";
import "./digitalCard.css";

export type PlanTier = "essential" | "signature" | "prestige";

/** One sample person, dressed up by what each plan adds. */
function sampleFor(tier: PlanTier): CardData {
  const base: CardData = {
    ...emptyCard(),
    full_name: "Alex Morgan",
    image_url: samplePortrait,
    job_title: "Founder & CEO",
    company_name: "Morgan Studio",
    tagline: "Strategy, design and growth for modern brands.",
    color_code: "#161616",
    country_code: "+1",
    phone_number: "415 555 0134",
    is_whatsapp_number: true,
    email: "alex@morganstudio.co",
    website: "https://morganstudio.co",
    social_media: [
      { type: "linkedin", url: "https://www.linkedin.com/in/alexmorgan", username: "alexmorgan" },
      { type: "instagram", url: "https://www.instagram.com/alexmorgan", username: "alexmorgan" },
    ],
    ventures: [{ name: "Morgan Studio", logo_url: "", url: "https://morganstudio.co", description: "Strategy and design studio for modern brands" }],
    agent_id: "",
  };
  if (tier === "essential") return base;
  const withAi = { ...base, agent_id: "demo" };
  if (tier === "signature") return withAi;
  // Prestige: the client's reference card (Raminder Singh), as in the DBC design.
  return {
    ...emptyCard(),
    full_name: "Raminder Singh",
    image_url: raminderPortrait,
    job_title: "Founder & Co-CEO",
    company_name: "ShivAI Tech",
    tagline: "Entrepreneur. Builder. Investor. Driving AI for Business and Entertainment.",
    color_code: "#161616",
    country_code: "+91",
    phone_number: "98100 12345",
    is_whatsapp_number: true,
    additional_phones: [{ label: "mobile", country_code: "+971", phone_number: "50 123 4567", is_whatsapp_number: false }],
    email: "rs@shivaitech.com",
    website: "https://www.callshivai.com",
    social_media: [
      { type: "linkedin", url: "https://www.linkedin.com/in/Raminders", username: "Raminders" },
      { type: "instagram", url: "https://www.instagram.com/Ramindersinggh", username: "Ramindersinggh" },
      { type: "facebook", url: "https://www.facebook.com/share/19bENQwjFa", username: "" },
    ],
    ventures: [
      { name: "ShivAI", logo_url: shivaiLogo, url: "https://www.callshivai.com/profile.pdf", description: "AI Employees for Real Workflows", file_name: "ShivAI-Profile.pdf" },
      { name: "Celebfie AI", logo_url: celebfieLogo, url: "https://celebfie.ai/profile.pdf", description: "Celebrity & Talent Booking Platform", file_name: "Celebfie-Profile.pdf" },
    ],
    payment_methods: [{ provider: "upi", label: "Pay Me", value: "raminder@okbank", currency: "INR", is_default: true, enabled: true }],
    highlight: "ai",
    agent_id: "demo",
  };
}

/** Prestige previews follow the client's reference design (styles scoped to .pp-ref). */
const refClass = (tier: PlanTier) => (tier === "prestige" ? " pp-ref" : "");

const TITLES: Record<PlanTier, string> = { essential: "Essential", signature: "Signature", prestige: "Prestige" };
const STAGE_W = 390;

/** Sample cards are look-only: block taps on buttons and links inside them. */
const block = (e: React.SyntheticEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

/** Loads the serif used by the Prestige name, once. */
function usePrestigeFont(on: boolean) {
  useEffect(() => {
    if (!on || document.getElementById("prestige-font")) return;
    const l = document.createElement("link");
    l.id = "prestige-font";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..700;1,400..600&family=Inter:wght@400..700&family=Cinzel:wght@500..700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..600&display=swap";
    document.head.appendChild(l);
  }, [on]);
}

/**
 * A live, scaled-down sample of the card each plan gets — tap to see it full size.
 * Rendered with the real CardView, so it always matches what members actually get.
 */
export default function PlanCardPreview({ tier, height = 300 }: { tier: PlanTier; height?: number }) {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.7);
  const [open, setOpen] = useState(false);
  const card = sampleFor(tier);
  usePrestigeFont(tier === "prestige");

  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / STAGE_W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="dc">
      <div
        ref={frame}
        role="button"
        tabIndex={0}
        aria-label={`Preview the ${TITLES[tier]} card`}
        className={`pp-frame${tier !== "essential" ? ` is-${tier}` : ""}`}
        style={{ ["--pp-h" as string]: `${height}px` }}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpen(true))}
      >
        <div className={`pp-stage${refClass(tier)}`} style={{ transform: `scale(${scale})` }} aria-hidden="true">
          <CardView
            card={card}
            tier={tier}
            poweredBy={tier === "prestige"}
            createCardHref={tier === "prestige" ? "#" : undefined}
            foundingMember={tier === "essential" && foundingOfferActive()}
          />
        </div>
        <div className="pp-fade" />
        <span className="pp-open">
          <Eye size={13} /> Preview card
        </span>
      </div>

      {open &&
        createPortal(
          <div className="dc">
            <div className="pp-modal" onClick={() => setOpen(false)}>
              <div
                className={`pp-sheet${tier !== "essential" ? ` is-${tier}` : ""}`}
                role="dialog"
                aria-modal="true"
                aria-label={`${TITLES[tier]} card preview`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pp-sheet-head">
                  <span>
                    <strong>{TITLES[tier]} card</strong>
                    <small>Sample preview. Your details appear here.</small>
                  </span>
                  <button type="button" className="sheet-x" aria-label="Close preview" onClick={() => setOpen(false)}>
                    <X size={18} />
                  </button>
                </div>
                <div className={`pp-sheet-body${refClass(tier)}`} onClickCapture={block} onSubmitCapture={block}>
                  <CardView
                    card={card}
                    tier={tier}
                    poweredBy
                    createCardHref={tier === "prestige" ? "#" : undefined}
                    foundingMember={tier === "essential" && foundingOfferActive()}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
