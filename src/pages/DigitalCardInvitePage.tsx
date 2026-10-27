import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import {
  Bot,
  CalendarCheck,
  Check,
  ChevronDown,
  ImagePlus,
  Linkedin,
  Mail,
  MessageCircle,
  Phone,
  Plug,
  QrCode as QrCodeIcon,
  Share2,
  UserPlus,
  Wallet,
} from "lucide-react";
import { useInlineAuth } from "../hooks/useInlineAuth";
import AuthModel from "../components/AuthModel";
import SEO from "../components/SEO";
import Navbar from "./Website/Navbar";
import CardView, { LinkIcon } from "../ClientDashboard/apps/DigitalCard/CardView";
import { sampleCard, type SocialType } from "../ClientDashboard/apps/DigitalCard/types";
import samplePortrait from "../resources/images/sample-portrait.jpg";
import heroImage from "../resources/images/digital-card-hero-phones.webp";
import ShivAiLogo from "../resources/images/ShivaiLogo.svg";
import { DIGITAL_CARD_CREATE, DIGITAL_CARD_HOME } from "./digitalCardRoutes";
import { WALLETS } from "../ClientDashboard/apps/DigitalCard/wallets";
import "../ClientDashboard/apps/DigitalCard/digitalCard.css";

/** Where every "Create" CTA on this page leads (no account needed to start). */
const CREATE_ROUTE = DIGITAL_CARD_CREATE;

const DEMO = { ...sampleCard(), image_url: samplePortrait };
const DEMO_LINK = "alex-morgan-morgan-consulting.callshivai.com";

const btnPrimary =
  "cta-glow inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 active:scale-[0.99] transition";
const btnSecondary =
  "inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-slate-300 bg-white/70 text-sm font-semibold hover:bg-white transition";

// ── Card-on-a-surface + feature-window helpers ─────────────────────────────

/** The realistic "card sitting on a surface" presentation — a tilted CardView
 *  over a textured background, used for the hero and the full showcase. */
function CardOnSurface({ className = "", tilt = true }: { className?: string; tilt?: boolean }) {
  return (
    <div className={`dc card-surface ${className}`}>
      <div className={tilt ? "card-tilt" : undefined}>
        <div className="phone-frame" style={{ pointerEvents: "none" }} aria-hidden="true">
          <CardView card={DEMO} />
        </div>
      </div>
    </div>
  );
}

type ActionKey = "call" | "myAi" | "whatsapp" | "email" | "linkedin" | "saveContact";

// Same labels, order and light/dark variants as CardView's action grid.
const DEMO_ACTIONS: { key: ActionKey; label: React.ReactNode; light?: boolean; save?: boolean }[] = [
  { key: "call", label: "↗ Call" },
  { key: "myAi", label: "✦ Ask My AI" },
  { key: "whatsapp", label: "↗ WhatsApp" },
  { key: "email", label: "✉ Email", light: true },
  { key: "linkedin", label: <><Linkedin size={15} /> LinkedIn</>, light: true },
  { key: "saveContact", label: "＋ Save Contact", save: true },
];

const DEMO_LINKS: { type: SocialType; title: string; sub: string }[] = [
  { type: "website", title: "Website", sub: "alexmorgan.co" },
  { type: "linkedin", title: "LinkedIn", sub: "/alexmorgan" },
  { type: "instagram", title: "Instagram", sub: "@alexmorgan" },
  { type: "youtube", title: "YouTube", sub: "@alexmorgan" },
];

/** A compact card with the card's actual button UI (same .action styles) at
 *  full size. The featured button is highlighted and the rest are dimmed. */
function DemoCard({ focus, links }: { focus?: ActionKey; links?: boolean }) {
  return (
    <div className="dc w-full max-w-sm mx-auto" aria-hidden="true">
      <div className="demo-card">
        <div className="demo-head">
          <img className="demo-avatar" src={samplePortrait} alt="" />
          <div className="min-w-0">
            <strong>{DEMO.full_name}</strong>
            <span>{DEMO.job_title}, {DEMO.company_name}</span>
          </div>
        </div>
        {links ? (
          <div className="link-list">
            {DEMO_LINKS.map(({ type, title, sub }) => (
              <div key={title} className="demo-link">
                <span className="link-main">
                  <LinkIcon type={type} />
                  <span><span className="link-title">{title}</span><span className="link-sub">{sub}</span></span>
                </span>
                <span className="arrow">↗</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="actions">
            {DEMO_ACTIONS.map((a) => (
              <span key={a.key} className={`action${a.light ? " light" : ""}${a.save ? " save" : ""} ${a.key === focus ? "is-focus" : "is-dim"}`}>
                {a.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const QR_COLORS = [
  { name: "Ink", value: "#0f172a" },
  { name: "Indigo", value: "#4338ca" },
  { name: "Teal", value: "#0f766e" },
  { name: "Rose", value: "#be123c" },
  { name: "Amber", value: "#b45309" },
];

// Each gradient loops back to its first stop so the shifting animation is seamless.
const QR_BACKGROUNDS = [
  { name: "Aurora", value: "linear-gradient(120deg,#6366f1,#ec4899,#14b8a6,#6366f1)" },
  { name: "Sunset", value: "linear-gradient(120deg,#f97316,#ec4899,#8b5cf6,#f97316)" },
  { name: "Ocean", value: "linear-gradient(120deg,#0ea5e9,#22d3ee,#6366f1,#0ea5e9)" },
  { name: "Forest", value: "linear-gradient(120deg,#10b981,#84cc16,#0d9488,#10b981)" },
  { name: "Mono", value: "linear-gradient(120deg,#cbd5e1,#f1f5f9,#94a3b8,#cbd5e1)" },
];

function SwatchRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    // Stacked on phones: label + six swatches don't fit on one line at 375px.
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="flex flex-wrap items-center gap-2 p-1 -m-1">{children}</div>
    </div>
  );
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const PHOTO_BG = -1;

/** Try-it-yourself QR styler: live QR over an animated gradient stage. Uploaded
 *  images stay in the browser as object URLs — nothing is sent anywhere. */
function QrSandbox() {
  const [fg, setFg] = useState(QR_COLORS[0].value);
  const [bg, setBg] = useState(0);
  const [bgPhoto, setBgPhoto] = useState<string | null>(null);
  const [label, setLabel] = useState("Scan to connect");
  const [imageError, setImageError] = useState("");

  // Cleanup runs with the previous URL whenever it's replaced, and on unmount.
  useEffect(() => () => { if (bgPhoto) URL.revokeObjectURL(bgPhoto); }, [bgPhoto]);

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>, onPick: (url: string) => void) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) return setImageError("Please choose an image file.");
    if (file.size > MAX_IMAGE_BYTES) return setImageError("Image must be under 5 MB.");
    setImageError("");
    onPick(URL.createObjectURL(file));
  };

  const photoActive = bg === PHOTO_BG && !!bgPhoto;
  const swatch = (selected: boolean) =>
    `w-7 h-7 rounded-full border border-black/10 transition ${selected ? "ring-2 ring-offset-2 ring-slate-900 scale-110" : "hover:scale-110"}`;

  return (
    <div className="w-full max-w-sm mx-auto">
      <div
        className={`qr-stage${photoActive ? " is-photo" : ""}`}
        style={{ backgroundImage: photoActive ? `url("${bgPhoto}")` : QR_BACKGROUNDS[Math.max(bg, 0)].value }}
      >
        <div className="qr-stage-shine" aria-hidden="true" />
        <div className="relative rounded-[22px] bg-white p-5 shadow-2xl shadow-slate-900/30 flex flex-col items-center">
          <QRCode value={`https://${DEMO_LINK}`} size={180} fgColor={fg} />
        </div>
        {label.trim() && (
          <p
            className="relative mt-4 max-w-full rounded-full bg-white/90 px-4 py-1.5 text-sm font-semibold tracking-tight text-center break-words backdrop-blur shadow-sm transition-colors"
            style={{ color: fg }}
          >
            {label}
          </p>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 space-y-4 shadow-sm">
        <SwatchRow label="QR colour">
          {QR_COLORS.map((c) => (
            <button key={c.value} type="button" aria-label={c.name} aria-pressed={fg === c.value}
              className={swatch(fg === c.value)} style={{ background: c.value }} onClick={() => setFg(c.value)} />
          ))}
        </SwatchRow>
        <SwatchRow label="Background">
          {QR_BACKGROUNDS.map((b, i) => (
            <button key={b.name} type="button" aria-label={b.name} aria-pressed={bg === i}
              className={swatch(bg === i)} style={{ backgroundImage: b.value }} onClick={() => setBg(i)} />
          ))}
          <label
            title="Upload your own background"
            className={`${swatch(photoActive)} cursor-pointer grid place-items-center bg-slate-100 bg-cover bg-center text-slate-500`}
            style={bgPhoto ? { backgroundImage: `url("${bgPhoto}")` } : undefined}
          >
            {!bgPhoto && <ImagePlus className="w-3.5 h-3.5" />}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Upload background image"
              onChange={(e) => pickImage(e, (url) => { setBgPhoto(url); setBg(PHOTO_BG); })}
            />
          </label>
        </SwatchRow>
        <label className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">Label</span>
          <input
            value={label}
            maxLength={24}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Add a label"
            className="w-full sm:max-w-[190px] rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-400"
          />
        </label>
        {imageError && <p role="alert" className="text-xs text-rose-600">{imageError}</p>}
      </div>
    </div>
  );
}

// ── Page building blocks ────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{children}</span>;
}

/** One full feature section: icon, headline, body, bullets on one side; a
 *  real cropped look at the feature on the other. Alternates side by request. */
function FeatureSection({
  id,
  reverse,
  icon: Icon,
  eyebrow,
  title,
  body,
  bullets,
  items,
  visual,
  tone = "light",
}: {
  id?: string;
  reverse?: boolean;
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  body: string;
  bullets?: string[];
  /** Richer alternative to bullets: icon + title + one line each, under a divider. */
  items?: { icon: React.ElementType; title: string; text: string }[];
  visual: React.ReactNode;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <section id={id} className={`scroll-mt-16 sm:scroll-mt-20 ${dark ? "bg-slate-950 text-white" : "bg-white text-slate-900"}`}>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-[68px]">
        <div className={`grid lg:grid-cols-2 gap-10 sm:gap-14 items-center ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
          <div className={reverse ? "lg:pl-4" : "lg:pr-4"}>
            <span className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl ${dark ? "bg-white/10" : "bg-slate-900"}`}>
              <Icon className={`w-5 h-5 ${dark ? "text-white" : "text-white"}`} />
            </span>
            <div className="mt-5">
              <Eyebrow>{eyebrow}</Eyebrow>
            </div>
            <h2 className={`mt-2 text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.08] ${dark ? "text-white" : "text-slate-900"}`}>
              {title}
            </h2>
            <p className={`mt-4 text-base sm:text-lg leading-relaxed ${dark ? "text-slate-300" : "text-slate-600"}`}>{body}</p>
            {bullets && (
              <ul className="mt-6 space-y-2.5">
                {bullets.map((b) => (
                  <li key={b} className={`flex items-start gap-2.5 text-sm ${dark ? "text-slate-200" : "text-slate-700"}`}>
                    <Check className={`w-4 h-4 mt-0.5 flex-none ${dark ? "text-emerald-400" : "text-emerald-600"}`} /> {b}
                  </li>
                ))}
              </ul>
            )}
            {items && (
              <ul className={`mt-7 pt-7 border-t space-y-5 ${dark ? "border-white/10" : "border-slate-200"}`}>
                {items.map(({ icon: ItemIcon, title: itemTitle, text }) => (
                  <li key={itemTitle} className="flex gap-3.5">
                    <ItemIcon className={`w-5 h-5 mt-0.5 flex-none ${dark ? "text-emerald-400" : "text-emerald-600"}`} />
                    <div>
                      <p className={`font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{itemTitle}</p>
                      <p className={`mt-1 text-sm leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}>{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex justify-center">{visual}</div>
        </div>
      </div>
    </section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 py-4">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-4 text-left" aria-expanded={open}>
        <span className="text-sm sm:text-base font-semibold text-slate-900">{q}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 flex-none transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="mt-2.5 text-sm text-slate-600 leading-relaxed pr-8">{a}</p>}
    </div>
  );
}

const FAQS = [
  { q: "What is a digital business card?", a: "A mobile page that replaces a printed card — your photo, role, contact details and links, shared with one link or QR code instead of cardstock." },
  { q: "Is it really free?", a: "Yes — a ShivAI digital business card is included free with every ShivAI account, no separate plan." },
  { q: "Do people need an app to view my card?", a: "No. Your card opens in any browser. Nothing to install to view, call, message or save your details." },
  { q: "What's the “Ask My AI” button?", a: "Connect a trained ShivAI agent to your card in one click, and visitors can talk to it directly from your profile — day or night." },
  { q: "Can I change my card after sharing it?", a: "Yes — edit any time and the same link and QR code update instantly, nothing to reprint." },
  { q: "Will Apple/Google Wallet work?", a: "It's on the way — the explainer below shows how it will work. The button goes live the moment it ships." },
];

// ═════════════════════════════════════════════════════════════════════════════

const FIRST_FEATURE_ID = "features";

function scrollToId(id: string) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}

/**
 * "Create your card now", pinned bottom-right. The site's chat widget lives in the same
 * corner and loads late, with a size that depends on its content — so this measures it
 * and sits just above it (or in the corner when there's no widget).
 */
function FloatingCreate({ onClick }: { onClick: () => void }) {
  const GAP = 12;
  const [bottom, setBottom] = useState<number | null>(null);

  useEffect(() => {
    let observer: ResizeObserver | null = null;
    const place = (el: Element | null) => {
      if (!el) return setBottom(null);
      const r = el.getBoundingClientRect();
      setBottom(r.height ? window.innerHeight - r.top + GAP : null);
    };
    const attach = () => {
      const el = document.querySelector(".shivai-trigger");
      if (!el) return false;
      place(el);
      observer = new ResizeObserver(() => place(el));
      observer.observe(el);
      return true;
    };
    // The widget script runs after the app, so look for it for a few seconds.
    let tries = 0;
    const timer = window.setInterval(() => {
      if (attach() || ++tries > 20) window.clearInterval(timer);
    }, 500);
    const onResize = () => place(document.querySelector(".shivai-trigger"));
    window.addEventListener("resize", onResize);
    return () => {
      window.clearInterval(timer);
      observer?.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      className="floating-cta fixed right-4 sm:right-6 z-40"
      style={{ bottom: bottom ?? "calc(1.25rem + env(safe-area-inset-bottom))" }}
    >
      <button type="button" onClick={onClick} className={`${btnPrimary} shadow-xl shadow-slate-900/25`}>
        Create your card now
      </button>
    </div>
  );
}

export default function DigitalCardInvitePage() {
  const navigate = useNavigate();
  const auth = useInlineAuth({ googleReturn: CREATE_ROUTE, onSuccess: () => navigate(CREATE_ROUTE) });
  const create = () => navigate(CREATE_ROUTE);

  // Smooth scrolling for the whole page (in-page links included) while it's open.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "smooth";
    return () => {
      html.style.scrollBehavior = prev;
    };
  }, []);

  return (
    // overflow-x-clip: anything wider than a phone screen makes mobile Safari zoom the
    // whole page out (tiny text + blank space under the footer). clip, unlike hidden,
    // doesn't create a scroll container, so fixed/sticky elements keep working.
    <div className="min-h-screen bg-white text-slate-900 overflow-x-clip">
      <SEO
        title="Free Digital Business Card — Share Your Profile on WhatsApp | ShivAI"
        description="Create a digital business card in minutes. Share by QR code or WhatsApp, connect your AI agent, and let people save your contact in one tap — free with every ShivAI account."
        path={DIGITAL_CARD_HOME}
      />
      <Navbar setAuthMode={auth.setAuthMode} setShowAuthModal={auth.setShowAuthModal} showLinks={false} topBgClass="bg-white" />

      {/* ── Hero ── */}
      <header className="bg-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-24 sm:pt-32 lg:pt-36 pb-12 sm:pb-16 lg:pb-24 grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-center">
          <div>
            <h1 className="text-[2.6rem] leading-[1.04] sm:text-6xl lg:text-[4.5rem] font-semibold tracking-tight">
              Your business card.
              <br />
              Reimagined.
            </h1>
            <p className="mt-5 text-lg sm:text-2xl font-medium text-slate-800 max-w-lg">
              Meet the smartest business card you'll ever need.
            </p>
            <p className="mt-3 text-base sm:text-lg text-slate-500 max-w-lg">
              Everything you want people to know about you, ready to share in one short link or QR Code.
            </p>
            <button
              type="button"
              onClick={() => scrollToId(FIRST_FEATURE_ID)}
              className="mt-10 group inline-flex items-center gap-3 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              <span className="scroll-cue" aria-hidden="true">
                <ChevronDown className="w-4 h-4" />
              </span>
              Scroll to learn more
            </button>
          </div>

          <div className="flex justify-center lg:justify-end">
            <img
              src={heroImage}
              alt="Two phones: Alex Morgan's digital business card, and its QR code with a share link"
              width={900}
              height={1064}
              className="w-full max-w-[320px] sm:max-w-[400px] lg:max-w-[460px] drop-shadow-[0_28px_36px_rgba(15,23,42,0.18)]"
              fetchPriority="high"
            />
          </div>
        </div>
      </header>

      {/* ── Feature 1: QR code ── */}
      <FeatureSection
        id={FIRST_FEATURE_ID}
        icon={QrCodeIcon}
        eyebrow="Share instantly"
        title="Your QR. Your style. Always within reach."
        body="Create your own designer QR card. Customise it to match your style, then give your phone a new look with your QR code right on your wallpaper."
        bullets={[
          "Customise colour, background and label",
          "Downloadable as a high-resolution PNG",
          "Always live — edit your card and the same QR code keeps working, nothing to reprint",
        ]}
        visual={<QrSandbox />}
      />

      {/* ── Feature 2: Call ── */}
      <FeatureSection
        reverse
        icon={Phone}
        eyebrow="One tap"
        title="Call, without the copy-paste."
        body="One tap takes people straight to your call, WhatsApp or email. No copying numbers, searching for details or switching apps to find your contact information."
        bullets={["Call directly from your digital card", "Works across phones and browsers", "Save contact details in one tap"]}
        visual={<DemoCard focus="call" />}
      />

      {/* ── Feature 3: AI Manager (the differentiator — dark section) ── */}
      <FeatureSection
        tone="dark"
        icon={Bot}
        eyebrow="The digital card that does more"
        title="Your card introduces you. Your AI Manager takes it from there."
        body="Visitors can chat with your AI Manager directly from your digital business card. It can answer questions about you and your business, share information and help book appointments—even when you're unavailable."
        items={[
          { icon: MessageCircle, title: "Answers enquiries", text: "Give visitors useful answers without waiting for you to reply." },
          { icon: CalendarCheck, title: "Helps book appointments", text: "Turn interest into a next step, right from your card." },
          {
            icon: Plug,
            title: "Connects to your ShivAI agent",
            text: "Link an agent you've already trained to activate the “Ask My AI” button on your card.",
          },
        ]}
        visual={<DemoCard focus="myAi" />}
      />

      {/* ── Feature 4: WhatsApp ── */}
      <FeatureSection
        reverse
        icon={Share2}
        eyebrow="Start the conversation"
        title="Straight into WhatsApp."
        body="One tap opens a WhatsApp chat with you. Share your card in a message, and its preview helps people recognise who they're connecting with."
        visual={<DemoCard focus="whatsapp" />}
      />

      {/* ── Feature 5: Email ── */}
      <FeatureSection
        icon={Mail}
        eyebrow="Formal, when it matters"
        title="Email, ready to write."
        body="One tap opens a new email addressed to you. No copying, no searching for an email address."
        visual={<DemoCard focus="email" />}
      />

      {/* ── Feature 6: Social links ── */}
      <FeatureSection
        reverse
        icon={Share2}
        eyebrow="Everywhere else you show up"
        title="Your whole professional world. One link."
        body="Bring your online presence together. Add LinkedIn, Instagram, YouTube, your website and more—all in one place, ready to explore."
        bullets={[
          "All your important links, together",
          "Recognisable icons make every profile easy to find",
          "Add a link or username in seconds",
        ]}
        visual={<DemoCard links />}
      />

      {/* ── Feature 7: Save Contact ── */}
      <FeatureSection
        icon={UserPlus}
        eyebrow="Leaves a trace"
        title="Save contact. Done in one tap."
        body="Let people save your contact details straight to their phone—with your name, number, email and company ready to go."
        bullets={["Works on iPhone and Android", "No app needed", "Update your card anytime"]}
        visual={<DemoCard focus="saveContact" />}
      />

      {/* ── Feature 8: Wallet (coming soon) ── */}
      <FeatureSection
        reverse
        icon={Wallet}
        eyebrow="Coming soon"
        title="A connection that stays with them."
        body="Let people save your digital business card to Apple Wallet, Google Wallet or Samsung Wallet. Stay connected and send updates to your saved audience, with notifications through ShivAI."
        visual={
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 w-full max-w-sm text-center overflow-hidden">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 mx-auto">
              <Wallet className="w-5 h-5 text-white" />
            </span>
            <p className="mt-4 text-sm font-semibold text-slate-900">Add to Wallet</p>
            {/* Phones: one swipeable row (edges fade to hint at more). Larger screens: wraps, centred. */}
            <ul
              aria-label="Wallets your card can be saved to"
              className="mt-4 -mx-8 px-8 flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,transparent,black_28px,black_calc(100%-28px),transparent)] sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:[mask-image:none]"
            >
              {WALLETS.map((w) => (
                <li
                  key={w.name}
                  className="snap-start flex-none inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 whitespace-nowrap"
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: w.color }} aria-hidden="true" />
                  {w.name}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-400">Coming soon — we'll let you know the moment it's ready.</p>
            <button disabled className="mt-5 w-full px-5 py-3 rounded-full bg-slate-200 text-slate-500 text-sm font-semibold cursor-not-allowed">
              Add to Wallet (coming soon)
            </button>
          </div>
        }
      />

      {/* ── Full showcase: the card as a real object ── */}
      <section className="bg-[#F5F5F2]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-12 sm:py-[68px] text-center">
          <Eyebrow>Preview</Eyebrow>
          <h2 className="mt-2 text-3xl sm:text-5xl font-semibold tracking-tight">This is what you're building.</h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-xl mx-auto">
            Every feature above, together, on one card — photo, buttons, AI agent, socials and Save Contact.
          </p>
          <div className="mt-12 sm:mt-16 max-w-md mx-auto">
            <CardOnSurface />
          </div>
          <button onClick={create} className={`mt-10 w-full sm:w-auto ${btnPrimary}`}>Create your card now</button>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-12 sm:py-[68px]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Three steps. A few minutes.</h2>
          <div className="mt-14 grid sm:grid-cols-3 gap-10 text-left">
            {[
              { n: "1", title: "Build it", body: "Open the card builder — no sign-up needed to start filling it in." },
              { n: "2", title: "Connect your AI (optional)", body: "Link a trained agent so visitors can talk to it directly." },
              { n: "3", title: "Share it", body: "Save your account, get your link and QR code, send it anywhere." },
            ].map(({ n, title, body }) => (
              <div key={n}>
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 text-white text-sm font-semibold">{n}</span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-[#FAFAF8] py-12 sm:py-[68px]">
        <div className="max-w-2xl mx-auto px-6 sm:px-8">
          <div className="text-center">
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">Frequently asked questions</h2>
          </div>
          <div className="mt-10">
            {FAQS.map((f) => (
              <FaqItem key={f.q} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-12 sm:py-[68px]">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight">Make yours today.</h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600">Free with every ShivAI account — no credit card, no app for your visitors.</p>
          <div className="mt-8 flex flex-col sm:flex-row sm:justify-center gap-3">
            <button onClick={create} className={`w-full sm:w-auto ${btnPrimary}`}>Create your card now</button>
            <button onClick={() => auth.open("signin")} className={`w-full sm:w-auto ${btnSecondary}`}>Sign in</button>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-10">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2">
            <img src={ShivAiLogo} alt="ShivAI" className="h-6 w-auto" />
          </a>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} ShivAI — a ShivAI product</p>
        </div>
      </footer>

      <FloatingCreate onClick={create} />
      {auth.showAuthModal && <AuthModel {...auth.modalProps} />}
    </div>
  );
}
