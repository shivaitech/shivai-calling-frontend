import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { Check, ChevronDown, PenLine, QrCode as QrCodeIcon, Send, Sparkles } from "lucide-react";
import { useInlineAuth } from "../hooks/useInlineAuth";
import AuthModel from "../components/AuthModel";
import SEO from "../components/SEO";
import Navbar from "./Website/Navbar";
import CardView from "../ClientDashboard/apps/DigitalCard/CardView";
import { sampleCard } from "../ClientDashboard/apps/DigitalCard/types";
import samplePortrait from "../resources/images/sample-portrait.jpg";
import heroImage from "../resources/images/digital-card-hero-ai.webp";
import heroImageMobile from "../resources/images/digital-card-hero-ai-mobile.webp";
import ShivAiLogo from "../resources/images/ShivaiLogo.svg";
import { DIGITAL_CARD_CREATE, DIGITAL_CARD_HOME } from "./digitalCardRoutes";
import QrPlayground from "../ClientDashboard/apps/DigitalCard/QrPlayground";
import DigitalCardPricing from "./digitalCardPricing";
import CreateChooser from "./digitalCardCreateChooser";
import DigitalCardReferral from "./digitalCardReferral";
import FeatureCarousel from "./digitalCardFeatureCarousel";
import { useAuth } from "../contexts/AuthContext";
import "../ClientDashboard/apps/DigitalCard/digitalCard.css";

/** Where every "Create" CTA on this page leads (no account needed to start). */
const CREATE_ROUTE = DIGITAL_CARD_CREATE;

const DEMO = { ...sampleCard(), image_url: samplePortrait };
const DEMO_LINK = "alex-morgan-morgan-consulting.callshivai.com";

/** The one vertical padding every section uses, so the gap between any two sections is the same. */
const SECTION_Y = "py-10 sm:py-14";

const btnPrimary =
  "cta-glow inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 active:scale-[0.99] transition";
const btnSecondary =
  "inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-slate-300 bg-white/70 text-sm font-semibold hover:bg-white transition";

// ── Card-on-a-surface + feature-window helpers ─────────────────────────────

/** The realistic "card sitting on a surface" presentation — a tilted CardView
 *  over a textured background, shown in the Prestige look (the best we offer). */
function CardOnSurface({ className = "", tilt = true }: { className?: string; tilt?: boolean }) {
  return (
    <div className={`dc card-surface ${className}`}>
      <div className={tilt ? "card-tilt" : undefined}>
        <div className="phone-frame" style={{ pointerEvents: "none" }} aria-hidden="true">
          <CardView card={DEMO} tier="prestige" />
        </div>
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
  stickyText,
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
  /** For tall visuals: top-align and keep the text in view while the visual scrolls (desktop). */
  stickyText?: boolean;
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
      <div className={`max-w-6xl mx-auto px-6 sm:px-8 ${SECTION_Y}`}>
        <div
          className={`grid lg:grid-cols-2 gap-10 sm:gap-14 ${stickyText ? "items-start" : "items-center"} ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}
        >
          <div className={`${reverse ? "lg:pl-4" : "lg:pr-4"} ${stickyText ? "lg:sticky lg:top-28" : ""}`}>
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
  { q: "What is a digital business card?", a: "A mobile page that replaces a printed card. Your photo, role, contact details and links, shared with one link or QR code instead of cardstock." },
  {
    q: "How much does it cost?",
    a: "Essential is free for life for Founding Members who create their card before 31 December 2026. Signature and Prestige add AI managers and premium features, from $14.99 a month billed annually. Every plan includes unlimited sharing. See Pricing above for what each plan adds.",
  },
  { q: "Do people need an app to view my card?", a: "No. Your card opens in any browser. Nothing to install to view, call, message or save your details." },
  { q: "What's the “Ask My AI” button?", a: "Connect a trained ShivAI agent to your card in one click, and visitors can talk to it directly from your profile, day or night." },
  { q: "Can I change my card after sharing it?", a: "Yes. Edit it any time and the same link and QR code update instantly. There's nothing to reprint." },
  { q: "Will Apple/Google Wallet work?", a: "It's on the way, and the explainer above shows how it will work. The button goes live the moment it ships." },
];

// ═════════════════════════════════════════════════════════════════════════════

/** The Share instantly (QR) section — the navbar's "QR Card Preview" link. */
const FIRST_FEATURE_ID = "features";
/** "One card. More possibilities." — first section under the hero ("Scroll to learn more"). */
const POSSIBILITIES_ID = "possibilities";

function scrollToId(id: string) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}

const FINAL_CTA_ID = "make-yours";

/**
 * "Create your card now" that slides up once the visitor starts scrolling (past the hero's
 * own call to action) and slides away again when the closing CTA section is on screen.
 * Phones: a full-width bar along the bottom. Larger screens: a pill bottom-right.
 */
function FloatingCreate({ onClick }: { onClick: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [finalInView, setFinalInView] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 320);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const target = document.getElementById(FINAL_CTA_ID);
    const io = target ? new IntersectionObserver(([e]) => setFinalInView(e.isIntersecting), { threshold: 0.2 }) : null;
    if (target) io!.observe(target);
    return () => {
      window.removeEventListener("scroll", onScroll);
      io?.disconnect();
    };
  }, []);

  const shown = scrolled && !finalInView;

  return (
    <div className={`floating-cta${shown ? " is-shown" : ""}`} aria-hidden={!shown}>
      <button type="button" onClick={onClick} tabIndex={shown ? 0 : -1} className={`${btnPrimary} floating-cta-btn`}>
        Create your card now
      </button>
    </div>
  );
}

export default function DigitalCardInvitePage() {
  const navigate = useNavigate();
  const auth = useInlineAuth({ googleReturn: CREATE_ROUTE, onSuccess: () => navigate(CREATE_ROUTE) });
  // Every "create" button asks who the card is for first; plan/billing come along from the pricing cards.
  const [chooser, setChooser] = useState<{ query: string } | null>(null);
  const create = () => setChooser({ query: "" });
  const closeChooser = useCallback(() => setChooser(null), []);
  const { isAuthenticated } = useAuth();

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
        title="Meet Your New Digital Business Card | ShivAI"
        description="One link does it all. Share your details, showcase your work, connect instantly and let your AI Manager help you turn introductions into opportunities through conversation. Free to create."
        path={DIGITAL_CARD_HOME}
      />
      <Navbar
        setAuthMode={auth.setAuthMode}
        setShowAuthModal={auth.setShowAuthModal}
        topBgClass="bg-white"
        pageLinks={[
          { label: "QR Card Preview", targetId: FIRST_FEATURE_ID },
          { label: "Digital Card Preview", targetId: "preview" },
          { label: "Pricing", targetId: "pricing" },
          { label: "Rewards", targetId: "rewards", highlight: true },
        ]}
      />

      {/* ── Hero ── */}
      <header className="bg-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-24 sm:pt-32 lg:pt-36 pb-10 sm:pb-14 grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-center">
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
              Your digital identity, with an AI Manager built right in. Let people connect with you, discover your work and get answers from
              your AI Manager, even when you're unavailable.
            </p>
            <button
              type="button"
              onClick={() => scrollToId(POSSIBILITIES_ID)}
              className="mt-10 group inline-flex items-center gap-3 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              <span className="scroll-cue" aria-hidden="true">
                <ChevronDown className="w-4 h-4" />
              </span>
              Scroll to learn more
            </button>
          </div>

          <div className="flex flex-col items-center lg:items-end">
            {/* Phones: on phones, a copy cropped to the phones' full outline (plus a little air),
                at most 340px wide and centred inside the page margins. Tablet and desktop keep the
                framed image. */}
            <picture className="block w-full max-w-[340px] self-center sm:max-w-none">
              <source media="(max-width: 639px)" srcSet={heroImageMobile} width={999} height={1153} />
              <img
                src={heroImage}
                alt="Two phones: Alex Morgan's Prestige digital card, and his AI Manager ready to take a call"
                width={1312}
                height={1199}
                className="block w-full h-auto sm:mx-auto sm:max-w-[480px] lg:mr-0 lg:max-w-[560px]"
                fetchPriority="high"
              />
            </picture>
            {/* Just below the image */}
            <div className="mt-4 sm:mt-6 w-full max-w-[400px] sm:max-w-[500px] lg:max-w-[560px] text-center">
              <p className="text-[17px] sm:text-xl font-semibold tracking-tight text-slate-900 text-balance">
                Your card makes the introduction. Your AI Manager takes the conversation forward.
              </p>
              <p className="mt-2 text-[15px] sm:text-[17px] text-slate-500 text-balance">
                Your work, your expertise and your opportunities. Always within reach, even when you aren't.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── One card, more possibilities: the feature carousel (Call, AI, WhatsApp, Email, Links, Save Contact, Wallet) ── */}
      <FeatureCarousel id={POSSIBILITIES_ID} link={`https://${DEMO_LINK}`} sectionY={SECTION_Y} />

      {/* ── Share instantly: the QR card ── */}
      <FeatureSection
        id={FIRST_FEATURE_ID}
        stickyText
        icon={QrCodeIcon}
        eyebrow="Share instantly"
        title="Your QR. Your style. Always within reach."
        body="Create your own designer QR card. Customise it to match your style, then give your phone a new look with your QR card right on your wallpaper."
        bullets={[
          "Wallpapers for phone, tablet, desktop and wallet card",
          "Resize, drag and fade your QR on any background, even your own photo",
          "Download in full resolution, ready to set as your wallpaper",
          "Always live. Edit your card and the same QR code keeps working, so there's nothing to reprint",
        ]}
        visual={<QrPlayground link={`https://${DEMO_LINK}`} />}
      />

      {/* ── Full showcase: the card as a real object ── */}
      <section id="preview" className="scroll-mt-16 sm:scroll-mt-20 bg-[#F5F5F2]">
        <div className={`max-w-5xl mx-auto px-6 sm:px-8 ${SECTION_Y} text-center`}>
          <Eyebrow>Preview</Eyebrow>
          <h2 className="mt-2 text-3xl sm:text-5xl font-semibold tracking-tight">All yours. All in one card.</h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-xl mx-auto">
            A professional profile designed to help people discover you, connect with you and interact with your AI Manager.
          </p>
          <div className="mt-10 sm:mt-14 max-w-md mx-auto">
            <CardOnSurface />
          </div>
          <button onClick={create} className={`mt-10 w-full sm:w-auto ${btnPrimary}`}>Create your card now</button>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className={SECTION_Y}>
        <div className="max-w-5xl mx-auto px-6 sm:px-8 text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-balance">Three steps to your smarter business card.</h2>
          <ol className="mt-9 sm:mt-12 grid sm:grid-cols-3 gap-3 sm:gap-5 text-left">
            {[
              {
                n: 1,
                icon: PenLine,
                title: "Create your card",
                body: "Add your details, photo, social links and contact options. No sign up needed to get started.",
              },
              {
                n: 2,
                icon: Sparkles,
                title: "Add your AI Manager",
                body: "Give people a smarter way to learn about you, your work and your services. (Optional)",
              },
              {
                n: 3,
                icon: Send,
                title: "Share it everywhere",
                body: "Get your personal link and QR code. Share once or a thousand times. It's yours to use.",
              },
            ].map(({ n, icon: Icon, title, body }) => (
              <li
                key={n}
                className="flex sm:flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)]"
              >
                <span className="flex shrink-0 items-center justify-center w-11 h-11 rounded-xl bg-slate-900 text-white">
                  <Icon size={19} strokeWidth={2} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Step {n}</span>
                  <h3 className="mt-1 text-base font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Pricing ── */}
      <DigitalCardPricing
        signedIn={isAuthenticated}
        sectionY={SECTION_Y}
        // The chosen plan rides into the card creator (its preview takes that plan's look),
        // then on through sign-up to checkout for that plan once the card is saved.
        onChoose={(plan, billing) => setChooser({ query: `?plan=${plan}&billing=${billing}` })}
      />

      {/* ── ShivAI Points (referral program, coming soon) ── */}
      <DigitalCardReferral sectionY={SECTION_Y} />

      {/* ── FAQ ── */}
      <section id="faq" className={`scroll-mt-16 sm:scroll-mt-20 bg-[#FAFAF8] ${SECTION_Y}`}>
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
      <section id={FINAL_CTA_ID} className={SECTION_Y}>
        <div className="max-w-2xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight">Make yours today.</h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600">Build your card first. You'll create your account when you save it. No app needed for your visitors.</p>
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
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} ShivAI. A ShivAI product.</p>
        </div>
      </footer>

      <FloatingCreate onClick={create} />
      {chooser && <CreateChooser onIndividual={() => navigate(`${CREATE_ROUTE}${chooser.query}`)} onClose={closeChooser} />}
      {auth.showAuthModal && <AuthModel {...auth.modalProps} />}
    </div>
  );
}
