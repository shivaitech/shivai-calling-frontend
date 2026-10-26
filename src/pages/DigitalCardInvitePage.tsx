import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Bot, Check, ChevronDown, ImagePlus, Linkedin, Mail, Phone, QrCode as QrCodeIcon, Share2, Sparkles, UserPlus, Wallet } from "lucide-react";
import { useInlineAuth } from "../hooks/useInlineAuth";
import AuthModel from "../components/AuthModel";
import SEO from "../components/SEO";
import Navbar from "./Website/Navbar";
import CardView, { LinkIcon } from "../ClientDashboard/apps/DigitalCard/CardView";
import { sampleCard, type SocialType } from "../ClientDashboard/apps/DigitalCard/types";
import samplePortrait from "../resources/images/sample-portrait.jpg";
import heroImage from "../resources/images/digital-card-hero-phones.webp";
import ShivAiLogo from "../resources/images/ShivaiLogo.svg";
import "../ClientDashboard/apps/DigitalCard/digitalCard.css";

/** Where every "Create" CTA on this page leads (no account needed to start). */
const CREATE_ROUTE = "/digital-card/create";

const DEMO = { ...sampleCard(), image_url: samplePortrait };
const DEMO_LINK = "alex-morgan-morgan-consulting.callshivai.com";

const btnPrimary =
  "inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 active:scale-[0.99] transition";
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
const DEMO_ACTIONS: { key: ActionKey; label: React.ReactNode; light?: boolean }[] = [
  { key: "call", label: "↗ Call" },
  { key: "myAi", label: "✦ My AI" },
  { key: "whatsapp", label: "↗ WhatsApp" },
  { key: "email", label: "✉ Email", light: true },
  { key: "linkedin", label: <><Linkedin size={15} /> LinkedIn</>, light: true },
  { key: "saveContact", label: "＋ Save Contact", light: true },
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
              <span key={a.key} className={`action${a.light ? " light" : ""} ${a.key === focus ? "is-focus" : "is-dim"}`}>
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
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
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
        <label className="flex items-center justify-between gap-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">Label</span>
          <input
            value={label}
            maxLength={24}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Add a label"
            className="w-full max-w-[190px] rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-400"
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
  reverse,
  icon: Icon,
  eyebrow,
  title,
  body,
  bullets,
  visual,
  tone = "light",
}: {
  reverse?: boolean;
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  body: string;
  bullets?: string[];
  visual: React.ReactNode;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <section className={dark ? "bg-slate-950 text-white" : "bg-white text-slate-900"}>
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
  { q: "What's the “My AI” button?", a: "Connect a trained ShivAI agent to your card in one click, and visitors can talk to it directly from your profile — day or night." },
  { q: "Can I change my card after sharing it?", a: "Yes — edit any time and the same link and QR code update instantly, nothing to reprint." },
  { q: "Will Apple/Google Wallet work?", a: "It's on the way — the explainer below shows how it will work. The button goes live the moment it ships." },
];

// ═════════════════════════════════════════════════════════════════════════════

export default function DigitalCardInvitePage() {
  const navigate = useNavigate();
  const auth = useInlineAuth({ googleReturn: CREATE_ROUTE, onSuccess: () => navigate(CREATE_ROUTE) });
  const create = () => navigate(CREATE_ROUTE);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SEO
        title="Free Digital Business Card — Share Your Profile on WhatsApp | ShivAI"
        description="Create a digital business card in minutes. Share by QR code or WhatsApp, connect your AI agent, and let people save your contact in one tap — free with every ShivAI account."
        path="/digital-card"
      />
      <Navbar setAuthMode={auth.setAuthMode} setShowAuthModal={auth.setShowAuthModal} showLinks={false} />

      {/* ── Hero: the card on a real surface ── */}
      <header className="bg-[#F5F5F2] overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-28 sm:pt-32 lg:pt-36 pb-12 sm:pb-[68px] lg:pb-24 grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200">
              <Sparkles className="w-3.5 h-3.5" /> Free with every ShivAI account
            </span>
            <h1 className="mt-6 text-[2.5rem] leading-[1.05] sm:text-6xl lg:text-[4.25rem] font-semibold tracking-tight">
              A business card<br />that talks back.
            </h1>
            <p className="mt-5 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 lg:max-w-lg">
              One link for your QR code, your call button, your socials, your AI agent — everything a paper card can't do.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row sm:justify-center lg:justify-start gap-3">
              <button onClick={create} className={`w-full sm:w-auto ${btnPrimary}`}>Create your card now</button>
              <button onClick={() => auth.open("signin")} className={`w-full sm:w-auto ${btnSecondary}`}>I already have an account</button>
            </div>
            <ul className="mt-10 hidden lg:flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              {["QR code", "One-tap call", "My AI", "WhatsApp", "Save contact"].map((f) => (
                <li key={f} className="inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" /> {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] aspect-square rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9),transparent_65%)]"
            />
            <img
              src={heroImage}
              alt="Two phones: Alex Morgan's digital business card, and its QR code with a share link"
              width={900}
              height={1064}
              className="relative w-full max-w-[320px] lg:max-w-[460px] drop-shadow-[0_30px_40px_rgba(15,23,42,0.18)]"
              fetchPriority="high"
            />
          </div>
        </div>
      </header>

      {/* ── Feature 1: QR code ── */}
      <FeatureSection
        icon={QrCodeIcon}
        eyebrow="Share instantly"
        title="Scan it. That's the whole handshake."
        body="Every card comes with its own QR code — and it's yours to style. Pick its colour, background and label to match your brand, then print it, screen-share it, or stick it on your desk. Try it right here."
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
        body="The Call button dials your number directly from the card — no saving a contact first, no switching apps to find it again."
        bullets={["Works on any phone, any browser", "Your number, never guessed or mistyped", "Shown right at the top of your card"]}
        visual={<DemoCard focus="call" />}
      />

      {/* ── Feature 3: My AI (the differentiator — dark section) ── */}
      <FeatureSection
        tone="dark"
        icon={Bot}
        eyebrow="Unique to ShivAI"
        title="Connect your AI agent. One click."
        body="This is the one button no other digital card has. Link a trained ShivAI agent to your card and a “My AI” button appears — so a visitor can ask questions, book time, or get help, without waiting for you to reply."
        bullets={["Works with any agent you've already trained", "Connect or disconnect any time, no code", "The button only appears once an agent is linked"]}
        visual={<DemoCard focus="myAi" />}
      />

      {/* ── Feature 4: WhatsApp ── */}
      <FeatureSection
        reverse
        icon={Share2}
        eyebrow="Start the conversation"
        title="Straight into WhatsApp."
        body="One tap opens a WhatsApp chat with you — and when you share your card link itself in WhatsApp, it shows your photo and role right in the message."
        bullets={["No need to save your number first", "Rich photo preview when your link is shared", "Works on mobile and WhatsApp Web"]}
        visual={<DemoCard focus="whatsapp" />}
      />

      {/* ── Feature 5: Email ── */}
      <FeatureSection
        icon={Mail}
        eyebrow="Formal, when it matters"
        title="Email, pre-addressed."
        body="The Email button opens a new message already addressed to you — useful for the conversations that are better off in writing."
        visual={<DemoCard focus="email" />}
      />

      {/* ── Feature 6: Social links ── */}
      <FeatureSection
        reverse
        icon={Share2}
        eyebrow="Everywhere else you show up"
        title="Your socials, in one tidy list."
        body="Add LinkedIn, Instagram, X, Facebook, YouTube or a plain website — paste a profile link and ShivAI fills in the username for you."
        bullets={["Add as many as you need", "Each one shows its own recognisable icon", "Paste a link or type a username — either works"]}
        visual={<DemoCard links />}
      />

      {/* ── Feature 7: Save Contact ── */}
      <FeatureSection
        icon={UserPlus}
        eyebrow="Leaves a trace"
        title="Save Contact, done in one tap."
        body="One button downloads a standard .vcf file with your name, number, email and company — their phone opens it straight into a new contact card."
        bullets={["Works on iPhone and Android", "No app needed to open it", "Updates automatically if you edit your card later"]}
        visual={<DemoCard focus="saveContact" />}
      />

      {/* ── Feature 8: Wallet (coming soon) ── */}
      <FeatureSection
        reverse
        icon={Wallet}
        eyebrow="Coming soon"
        title="Add to Apple Wallet & Google Wallet."
        body="Your card as a real Wallet pass — double-tap your phone and it's right there, even offline. We're building it now."
        visual={
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 w-full max-w-sm text-center">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 mx-auto">
              <Wallet className="w-5 h-5 text-white" />
            </span>
            <p className="mt-4 text-sm font-semibold text-slate-900">Add to Wallet</p>
            <p className="mt-1.5 text-xs text-slate-500">Coming soon — we'll let you know the moment it's ready.</p>
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

      {auth.showAuthModal && <AuthModel {...auth.modalProps} />}
    </div>
  );
}
