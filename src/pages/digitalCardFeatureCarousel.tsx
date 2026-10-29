import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import {
  Bot,
  CalendarCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Link2,
  Linkedin,
  LucideIcon,
  Mail,
  MessageCircle,
  Phone,
  Plug,
  Sparkles,
  UserPlus,
  Wallet,
} from "lucide-react";
import { LinkIcon } from "../ClientDashboard/apps/DigitalCard/CardView";
import WhatsAppIcon from "../ClientDashboard/apps/DigitalCard/WhatsAppIcon";
import GmailIcon from "../ClientDashboard/apps/DigitalCard/GmailIcon";
import { WALLETS } from "../ClientDashboard/apps/DigitalCard/wallets";
import { sampleCard, type SocialType } from "../ClientDashboard/apps/DigitalCard/types";
import samplePortrait from "../resources/images/sample-portrait.jpg";

/**
 * "Everything your card can do" — one section that walks through the card's features.
 * A single demo card on the left reveals each feature (3D turn + the feature's button lit,
 * or the links list / wallet pass); the copy on the right slides in alongside.
 * Auto-advances while on screen (the tab's progress line is the timer); hover pauses it,
 * any manual choice stops it, and reduced-motion users never get auto-play.
 */

type ActionKey = "call" | "myAi" | "whatsapp" | "email" | "linkedin" | "saveContact";
type View = { kind: "actions"; focus: ActionKey } | { kind: "links" } | { kind: "wallet" };

interface Feature {
  id: string;
  tab: string;
  Icon: LucideIcon;
  /** Colour of the soft glow behind the card for this feature. */
  glow: string;
  eyebrow: string;
  title: string;
  body: string;
  bullets?: string[];
  items?: { Icon: LucideIcon; title: string; text: string }[];
  soon?: boolean;
  view: View;
}

const FEATURES: Feature[] = [
  {
    id: "call",
    tab: "Call",
    Icon: Phone,
    glow: "rgba(16,185,129,.28)",
    eyebrow: "One tap",
    title: "Call, without the copy-paste.",
    body: "One tap takes people straight to your call, WhatsApp or email. No copying numbers, searching for details or switching apps to find your contact information.",
    bullets: ["Call directly from your digital card", "Works across phones and browsers", "Save contact details in one tap"],
    view: { kind: "actions", focus: "call" },
  },
  {
    id: "ai",
    tab: "Ask My AI",
    Icon: Bot,
    glow: "rgba(99,102,241,.32)",
    eyebrow: "The digital card that does more",
    title: "Your card introduces you. Your AI Manager takes it from there.",
    body: "Visitors can chat with your AI Manager directly from your digital business card. It can answer questions about you and your business, share information and help book appointments—even when you're unavailable.",
    items: [
      { Icon: MessageCircle, title: "Answers enquiries", text: "Give visitors useful answers without waiting for you to reply." },
      { Icon: CalendarCheck, title: "Helps book appointments", text: "Turn interest into a next step, right from your card." },
      { Icon: Plug, title: "Connects to your ShivAI agent", text: "Link an agent you've already trained to activate the “Ask My AI” button on your card." },
    ],
    view: { kind: "actions", focus: "myAi" },
  },
  {
    id: "whatsapp",
    tab: "WhatsApp",
    Icon: MessageCircle,
    glow: "rgba(37,211,102,.3)",
    eyebrow: "Start the conversation",
    title: "Straight into WhatsApp.",
    body: "One tap opens a WhatsApp chat with you. Share your card in a message, and its preview helps people recognise who they're connecting with.",
    view: { kind: "actions", focus: "whatsapp" },
  },
  {
    id: "email",
    tab: "Email",
    Icon: Mail,
    glow: "rgba(234,67,53,.24)",
    eyebrow: "Formal, when it matters",
    title: "Email, ready to write.",
    body: "One tap opens a new email addressed to you. No copying, no searching for an email address.",
    view: { kind: "actions", focus: "email" },
  },
  {
    id: "links",
    tab: "Links",
    Icon: Link2,
    glow: "rgba(14,165,233,.28)",
    eyebrow: "Everywhere else you show up",
    title: "Your whole professional world. One link.",
    body: "Bring your online presence together. Add LinkedIn, Instagram, YouTube, your website and more—all in one place, ready to explore.",
    bullets: ["All your important links, together", "Recognisable icons make every profile easy to find", "Add a link or username in seconds"],
    view: { kind: "links" },
  },
  {
    id: "save",
    tab: "Save Contact",
    Icon: UserPlus,
    glow: "rgba(15,23,42,.22)",
    eyebrow: "Leaves a trace",
    title: "Save contact. Done in one tap.",
    body: "Let people save your contact details straight to their phone—with your name, number, email and company ready to go.",
    bullets: ["Works on iPhone and Android", "No app needed", "Update your card anytime"],
    view: { kind: "actions", focus: "saveContact" },
  },
  {
    id: "wallet",
    tab: "Wallet",
    Icon: Wallet,
    glow: "rgba(217,178,90,.34)",
    eyebrow: "Coming soon",
    title: "A connection that stays with them.",
    body: "Let people save your digital business card to Apple Wallet, Google Wallet or Samsung Wallet. Stay connected and send updates to your saved audience, with notifications through ShivAI.",
    soon: true,
    view: { kind: "wallet" },
  },
];

const SLIDE_MS = 6500;
const DEMO = sampleCard();

const ACTIONS: { key: ActionKey; label: React.ReactNode; light?: boolean; save?: boolean }[] = [
  { key: "call", label: <><Phone size={15} /> Call</> },
  { key: "myAi", label: <><Sparkles size={15} /> Ask My AI</> },
  { key: "whatsapp", label: <><WhatsAppIcon /> WhatsApp</> },
  { key: "email", label: <><GmailIcon /> Email</>, light: true },
  { key: "linkedin", label: <><Linkedin size={15} /> LinkedIn</>, light: true },
  { key: "saveContact", label: <><UserPlus size={15} /> Save Contact</>, save: true },
];

const LINKS: { type: SocialType; title: string; sub: string }[] = [
  { type: "website", title: "Website", sub: "alexmorgan.co" },
  { type: "linkedin", title: "LinkedIn", sub: "/alexmorgan" },
  { type: "instagram", title: "Instagram", sub: "@alexmorgan" },
  { type: "youtube", title: "YouTube", sub: "@alexmorgan" },
];

function DemoCardView({ view, link }: { view: View; link: string }) {
  return (
    <div className="dc w-full max-w-sm mx-auto" aria-hidden="true">
      <div className="demo-card">
        <div className="demo-head">
          <img className="demo-avatar" src={samplePortrait} alt="" />
          <div className="min-w-0">
            <strong>{DEMO.full_name}</strong>
            <span>
              {DEMO.job_title}, {DEMO.company_name}
            </span>
          </div>
        </div>
        {view.kind === "links" && (
          <div className="link-list">
            {LINKS.map(({ type, title, sub }) => (
              <div key={title} className="demo-link">
                <span className="link-main">
                  <LinkIcon type={type} />
                  <span>
                    <span className="link-title">{title}</span>
                    <span className="link-sub">{sub}</span>
                  </span>
                </span>
                <span className="arrow">↗</span>
              </div>
            ))}
          </div>
        )}
        {view.kind === "actions" && (
          <div className="actions">
            {ACTIONS.map((a) => (
              <span key={a.key} className={`action${a.light ? " light" : ""}${a.save ? " save" : ""} ${a.key === view.focus ? "is-focus" : "is-dim"}`}>
                {a.label}
              </span>
            ))}
          </div>
        )}
        {view.kind === "wallet" && (
          <div className="fc-pass">
            <div className="fc-pass-top">
              <span className="fc-pass-brand">
                <Wallet size={13} /> {DEMO.company_name}
              </span>
              <span className="fc-pass-soon">Coming soon</span>
            </div>
            <div className="fc-pass-body">
              <div className="min-w-0">
                <span className="fc-pass-label">Name</span>
                <strong>{DEMO.full_name}</strong>
                <span className="fc-pass-label">Title</span>
                <span>{DEMO.job_title}</span>
              </div>
              <div className="fc-pass-qr">
                <QRCode value={link} size={76} />
              </div>
            </div>
            <div className="fc-pass-wallets">
              {WALLETS.slice(0, 3).map((w) => (
                <span key={w.id}>
                  <i style={{ background: w.color }} />
                  {w.name}
                </span>
              ))}
              <span>+ more</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FeatureCarousel({ link }: { link: string }) {
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  const [inView, setInView] = useState(false);
  const [hover, setHover] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const touchX = useRef<number | null>(null);
  const feature = FEATURES[index];

  // No auto-play for people who asked for less motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setAuto(false);
  }, []);

  // Only run the timer while the section is actually on screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const go = useCallback((i: number, manual = true) => {
    const next = (i + FEATURES.length) % FEATURES.length;
    setIndex(next);
    if (manual) setAuto(false);
  }, []);

  // Keep the active tab visible in the scrollable tab row (phones). Scroll only the row —
  // scrollIntoView would also yank the whole page to the tabs on load and on auto-advance.
  useEffect(() => {
    const tab = tabRefs.current[index];
    const row = tab?.parentElement;
    if (!tab || !row || row.scrollWidth <= row.clientWidth) return;
    row.scrollTo({ left: tab.offsetLeft - (row.clientWidth - tab.clientWidth) / 2, behavior: "smooth" });
  }, [index]);

  const onTabKey = (e: React.KeyboardEvent) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = (index + d + FEATURES.length) % FEATURES.length;
    go(next);
    tabRefs.current[next]?.focus();
  };

  const running = auto && inView && !hover;

  return (
    <section ref={rootRef} className="bg-white text-slate-900 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-[68px]">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Everything in one card</p>
          <h2 className="mt-2 text-3xl sm:text-5xl font-semibold tracking-tight">One card. Every way to connect.</h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">Tap through what your card does for the people you meet.</p>
        </div>

        {/* Tabs — the active one's line fills up while it's showing. */}
        <div
          role="tablist"
          aria-label="Card features"
          onKeyDown={onTabKey}
          className="mt-8 sm:mt-10 -mx-6 px-6 flex gap-2 overflow-x-auto snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center"
        >
          {FEATURES.map((f, i) => {
            const active = i === index;
            return (
              <button
                key={f.id}
                ref={(el) => (tabRefs.current[i] = el)}
                role="tab"
                id={`fc-tab-${f.id}`}
                aria-selected={active}
                aria-controls="fc-panel"
                tabIndex={active ? 0 : -1}
                onClick={() => go(i)}
                className={`fc-tab snap-start ${active ? "is-active" : ""}`}
              >
                <f.Icon className="w-4 h-4" />
                {f.tab}
                {f.soon && <span className="fc-tab-soon">Soon</span>}
                <span className="fc-tab-track" aria-hidden="true">
                  {active && (
                    <span
                      key={`${index}-${auto}`}
                      className={`fc-tab-fill ${auto ? "is-timing" : ""}`}
                      style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: running ? "running" : "paused" }}
                      onAnimationEnd={() => auto && go(index + 1, false)}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Stage */}
        <div
          id="fc-panel"
          role="tabpanel"
          aria-labelledby={`fc-tab-${feature.id}`}
          className="mt-8 sm:mt-12 grid lg:grid-cols-2 gap-8 lg:gap-14 items-center"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1));
          }}
        >
          <div className="fc-stage">
            <span className="fc-glow" style={{ background: `radial-gradient(circle, ${feature.glow}, transparent 65%)` }} aria-hidden="true" />
            <div key={feature.id} className="fc-card-reveal">
              <DemoCardView view={feature.view} link={link} />
            </div>
            <div className="fc-arrows">
              <button type="button" aria-label="Previous feature" onClick={() => go(index - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="fc-count" aria-live="polite">
                {index + 1} / {FEATURES.length}
              </span>
              <button type="button" aria-label="Next feature" onClick={() => go(index + 1)}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div key={feature.id} className="fc-copy">
            <span className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl ${feature.soon ? "bg-[#d9b25a]" : "bg-slate-900"}`}>
              <feature.Icon className="w-5 h-5 text-white" />
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{feature.eyebrow}</p>
            <h3 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.08]">{feature.title}</h3>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">{feature.body}</p>
            {feature.bullets && (
              <ul className="mt-6 space-y-2.5">
                {feature.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <Check className="w-4 h-4 mt-0.5 flex-none text-emerald-600" /> {b}
                  </li>
                ))}
              </ul>
            )}
            {feature.items && (
              <ul className="mt-7 pt-7 border-t border-slate-200 space-y-5">
                {feature.items.map(({ Icon, title, text }) => (
                  <li key={title} className="flex gap-3.5">
                    <Icon className="w-5 h-5 mt-0.5 flex-none text-indigo-600" />
                    <div>
                      <p className="font-semibold text-slate-900">{title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
