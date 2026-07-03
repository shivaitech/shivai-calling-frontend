import { useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  FileText,
  Landmark,
  Link2,
  Lock,
  Mic,
  MessageCircleQuestion,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   Sampled palette
────────────────────────────────────────────────────────────────────────── */
const C = {
  bg: "#060814",
  card: "#0D1224",
  /* sampled from gradient ref — not layout/content ref */
  deepViolet: "#5A39CC",
  midViolet: "#683AFF",
  navPurple: "#7B59FF",
  purple: "#7B59FF",
  purpleSoft: "#A084FF",
  paleLilac: "#C6ABFF",
  blue: "#4CC3FF",
  white: "#F8F8FF",
  gray: "#BEC4D4",
  body: "#C8CEDE",
  label: "#B8C0D2",
  muted: "#AEB6C8",
};
/* subtle shadow so secondary text stays readable over glows/graphics */
const TEXT_READABLE = "0 1px 4px rgba(6,8,20,0.92), 0 0 14px rgba(6,8,20,0.55)";
const LABEL_HIGHLIGHT = "0 0 10px rgba(160,132,255,0.35)";
/* "Regulated Investments" — vertical: deep violet top → bright lavender bottom */
const NOVA_GRADIENT = "linear-gradient(180deg,#5A39CC 0%,#7B59FF 42%,#A084FF 100%)";
const FONT_STACK = '"Inter", -apple-system, "SF Pro Display", "Segoe UI", system-ui, sans-serif';
const OFFERING_URL = "https://www.growithlive.com/token/shivai";

/* "Explore Live Offering" — diagonal: saturated violet left → pale lilac right */
const CTA_BG = "linear-gradient(135deg,#683AFF 0%,#8B5CFF 38%,#C6ABFF 100%)";
const CTA_SHADOW =
  "0 1px 0 rgba(255,255,255,0.52) inset, 0 -10px 18px rgba(58,28,140,0.48) inset, 0 0 0 1px rgba(160,132,255,0.5), 0 10px 30px -8px rgba(104,58,255,0.78), 0 0 26px rgba(104,58,255,0.42), 0 0 44px rgba(198,171,255,0.2)";
const CTA_GLOSS =
  "linear-gradient(180deg, rgba(255,255,255,0.58) 0%, rgba(255,255,255,0.1) 55%, transparent 100%)";

  
const GLOW = {
  violet: "rgba(104,58,255",
  deep: "rgba(90,57,204",
  soft: "rgba(160,132,255",
  lilac: "rgba(198,171,255",
  blue: "rgba(76,195,255",
};

/* soft fractal-noise texture */
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/* ─────────────────────────────────────────────────────────────────────────
   Motion — per-element entrance (no variant propagation, so infinite
   loops below keep running)
────────────────────────────────────────────────────────────────────────── */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
function entrance(delay = 0) {
  return {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: EASE },
  };
}
/* CSS + SVG SMIL for continuous loops — immune to Framer Motion parent overrides */
function NovaLoopStyles() {
  return (
    <style>{`
      @keyframes nova-glow-blue {
        0%, 100% { transform: scale(1); opacity: 0.45; }
        50% { transform: scale(1.12); opacity: 0.75; }
      }
      @keyframes nova-glow-violet {
        0%, 100% { transform: scale(1.08); opacity: 0.4; }
        50% { transform: scale(1); opacity: 0.66; }
      }
      @keyframes nova-ring-pulse {
        0%, 100% { transform: scale(1); opacity: 0.45; }
        50% { transform: scale(1.07); opacity: 0.95; }
      }
      @keyframes nova-ring-ripple {
        0% { transform: scale(1); opacity: 0.55; }
        100% { transform: scale(1.22); opacity: 0; }
      }
      @keyframes nova-globe-glow {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 0.85; }
      }
      @keyframes nova-globe-spin {
        to { transform: rotate(360deg); }
      }
      @keyframes nova-node-twinkle {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }
      .nova-glow-blue {
        animation: nova-glow-blue 2.4s ease-in-out infinite;
        will-change: transform, opacity;
      }
      .nova-glow-violet {
        animation: nova-glow-violet 2.4s ease-in-out 0.3s infinite;
        will-change: transform, opacity;
      }
      .nova-ring-pulse {
        animation: nova-ring-pulse 1.75s ease-in-out infinite;
        will-change: transform, opacity;
      }
      .nova-ring-ripple {
        animation: nova-ring-ripple 1.75s ease-out infinite;
        will-change: transform, opacity;
      }
      .nova-globe-glow {
        animation: nova-globe-glow 5s ease-in-out infinite;
      }
      .nova-globe-spin {
        animation: nova-globe-spin 90s linear infinite;
        transform-origin: center;
        will-change: transform;
      }
      .nova-node-twinkle {
        animation: nova-node-twinkle 2.5s ease-in-out infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .nova-glow-blue, .nova-glow-violet, .nova-ring-pulse, .nova-ring-ripple,
        .nova-globe-glow, .nova-globe-spin, .nova-node-twinkle { animation: none; }
      }
    `}</style>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Background — 8 independent layers
────────────────────────────────────────────────────────────────────────── */
function BackgroundEffects() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* L1 · deep navy base */}
      <div className="absolute inset-0" style={{ background: C.bg }} />

      {/* plexus source image, held very subtle */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/nova-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.4,
          mixBlendMode: "screen",
        }}
      />

      {/* L2 · very large radial blue glow from center */}
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(62% 52% at 50% 46%, ${GLOW.blue},0.14) 0%, transparent 70%)` }}
      />

      {/* L3 · purple radial glow, upper-right */}
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(46% 42% at 86% 8%, ${GLOW.violet},0.24) 0%, transparent 62%)` }}
      />
      {/* companion purple, lower-left for balance */}
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(44% 40% at 12% 88%, ${GLOW.deep},0.18) 0%, transparent 60%)` }}
      />

      {/* L7 · horizontal glow band behind microphone (~ hero/orb band) */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: "34%",
          height: 260,
          background: `radial-gradient(60% 100% at 50% 50%, ${GLOW.soft},0.16) 0%, ${GLOW.violet},0.1) 40%, transparent 78%)`,
          filter: "blur(18px)",
        }}
      />

      {/* L4 · vignette around edges */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 88% at 50% 42%, transparent 52%, rgba(3,5,12,0.72) 100%)" }}
      />

      {/* L6 · bottom dark fade */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, transparent 52%, rgba(3,5,12,0.9) 100%)" }}
      />

      {/* L5 · soft noise texture */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: NOISE, backgroundSize: "140px 140px", opacity: 0.05, mixBlendMode: "overlay" }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Animated wave — thin blue-purple line behind the mic
────────────────────────────────────────────────────────────────────────── */
const WAVE_ROWS = [
  { amp: 13, off: 0, w: 1.5, base: 0.5, dur: 3.2 },
  { amp: 9, off: -9, w: 1.2, base: 0.4, dur: 3.8 },
  { amp: 9, off: 9, w: 1.2, base: 0.4, dur: 4.2 },
  { amp: 5, off: -18, w: 1, base: 0.28, dur: 4.5 },
  { amp: 5, off: 18, w: 1, base: 0.28, dur: 4.8 },
];

function AnimatedWave() {
  return (
    <svg
      className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-[440%] -translate-x-1/2 -translate-y-1/2 sm:w-[380%] lg:h-28 lg:w-[420%] xl:h-32"
      viewBox="0 0 1200 120"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {WAVE_ROWS.map((r, i) => {
        const flat = `M0 60 Q 150 ${60 - r.amp} 300 60 T 600 60 T 900 60 T 1200 60`;
        const peak = `M0 60 Q 150 ${60 + r.amp} 300 60 T 600 60 T 900 60 T 1200 60`;
        const lo = r.base * 0.5;
        return (
          <g key={i} transform={`translate(0 ${r.off})`}>
            <path
              stroke="url(#novaWave)"
              strokeWidth={r.w}
              strokeLinecap="round"
              d={flat}
            >
              <animate attributeName="d" dur={`${r.dur}s`} repeatCount="indefinite" values={`${flat};${peak};${flat}`} calcMode="spline" keyTimes="0;0.5;1" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" begin={`${i * 0.25}s`} />
              <animate attributeName="opacity" dur={`${r.dur}s`} repeatCount="indefinite" values={`${lo};${r.base};${lo}`} begin={`${i * 0.25}s`} />
            </path>
          </g>
        );
      })}
      <defs>
        <linearGradient id="novaWave" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4CC3FF" stopOpacity="0" />
          <stop offset="0.32" stopColor="#4CC3FF" />
          <stop offset="0.5" stopColor="#A084FF" />
          <stop offset="0.68" stopColor="#683AFF" />
          <stop offset="1" stopColor="#4CC3FF" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Navbar
────────────────────────────────────────────────────────────────────────── */
function Navbar() {
  return (
    <motion.header {...entrance(0)} className="flex items-center justify-between py-4 lg:mb-6 lg:py-5 xl:mb-8">
      <img
        src="/growith_logo_transparent.png"
        alt="growith"
        className="h-8 w-auto sm:h-9 lg:h-10"
        style={{ filter: `drop-shadow(0 0 14px ${GLOW.violet},0.32))` }}
      />
      <button
        type="button"
        className="flex items-center gap-2 rounded-full px-3.5 py-2 lg:px-4 lg:py-2.5"
        style={{
          background:
            `linear-gradient(rgba(13,18,36,0.92),rgba(13,18,36,0.92)) padding-box, linear-gradient(135deg, rgba(255,255,255,0.14), ${GLOW.soft},0.22)) border-box`,
          border: "1px solid transparent",
          boxShadow: `0 0 14px ${GLOW.violet},0.14), inset 0 1px 0 rgba(255,255,255,0.06)`,
          backdropFilter: "blur(8px)",
        }}
      >
        <Lock className="h-3 w-3" style={{ color: C.label }} />
        <span className="text-[9px] font-bold uppercase tracking-[0.18em] lg:text-[10px]" style={{ color: C.body }}>
          Private Offering
        </span>
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: C.midViolet, boxShadow: `0 0 8px ${GLOW.violet},0.9)` }}
        />
      </button>
    </motion.header>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Hero (with dedicated soft glow behind the wordmark)
────────────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <>
      

      <motion.h1
        {...entrance(0.12)}
        className="relative mt-4 text-center text-[3rem] font-extrabold leading-[1.02] tracking-[-0.02em] sm:text-[3.6rem] lg:text-left lg:text-[3.75rem] xl:text-[4.25rem]"
        style={{ color: C.white }}
      >
        {/* hero glow — layered radials behind the type */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[160px] w-[360px] -translate-x-1/2 -translate-y-1/2 lg:left-0 lg:translate-x-0 lg:w-[420px] lg:h-[180px]"
          style={{
            background:
              `radial-gradient(50% 60% at 50% 50%, ${GLOW.violet},0.3) 0%, transparent 70%), radial-gradient(40% 50% at 65% 40%, ${GLOW.blue},0.2) 0%, transparent 72%)`,
            filter: "blur(14px)",
          }}
        />
        Meet{" "}
        <span
          style={{
            background: NOVA_GRADIENT,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: `drop-shadow(0 0 24px ${GLOW.violet},0.5)) drop-shadow(0 0 10px ${GLOW.soft},0.35))`,
          }}
        >
          Nova
        </span>
      </motion.h1>

      <motion.p {...entrance(0.18)} className="mt-2 text-center text-[20px] font-semibold sm:text-[22px] lg:text-left lg:text-[24px] xl:text-[26px]" style={{ color: C.white }}>
        Your AI Investment Assistant
      </motion.p>

      <motion.p {...entrance(0.24)} className="mx-auto mt-2.5 max-w-[340px] text-center text-[13px] leading-[1.55] lg:mx-0 lg:max-w-[420px] lg:text-left lg:text-[14px] xl:max-w-[460px] xl:text-[15px]" style={{ color: C.body, textShadow: TEXT_READABLE }}>
        Explore opportunities, understand Digital Ownership Stakes, and get answers instantly.
      </motion.p>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   VoiceButton — volumetric, many discrete layers
────────────────────────────────────────────────────────────────────────── */
function VoiceButton({ onClick, delay = 0 }: { onClick: () => void; delay?: number }) {
  return (
    <div className="relative my-10 flex w-full flex-col items-center lg:my-0 lg:flex-1 lg:justify-end lg:pb-1 lg:pt-4 xl:pt-6">
      <div className="relative flex h-[190px] w-[190px] items-center justify-center lg:h-[215px] lg:w-[215px] xl:h-[235px] xl:w-[235px]">
        <AnimatedWave />

        {/* L1 · outer blue glow (large blurred radial) */}
        <div
          className="nova-glow-blue absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle, ${GLOW.blue},0.5) 0%, transparent 62%)`, filter: "blur(8px)" }}
        />
        {/* L2 · purple glow */}
        <div
          className="nova-glow-violet absolute inset-[8%] rounded-full"
          style={{ background: `radial-gradient(circle, ${GLOW.violet},0.58) 0%, transparent 62%)`, filter: "blur(5px)" }}
        />

        {/* L3 · separated bright outer ring (with gap) — pulsing */}
        <div
          className="nova-ring-pulse absolute inset-[9%] rounded-full"
          style={{
            border: `1px solid ${GLOW.lilac},0.42)`,
            boxShadow: `0 0 20px ${GLOW.violet},0.4), inset 0 0 18px ${GLOW.blue},0.18)`,
          }}
        />
        {/* expanding ripple ring */}
        <div
          className="nova-ring-ripple absolute inset-[9%] rounded-full"
          style={{ border: `1px solid ${GLOW.violet},0.5)` }}
        />

        <button
          type="button"
          onClick={onClick}
          aria-label="Tap to talk to Nova"
          className="group absolute inset-[18.5%] flex items-center justify-center rounded-full outline-none transition-transform duration-300 hover:scale-[1.05] focus-visible:ring-2 focus-visible:ring-[#683AFF]/70"
        >
          {/* L4 · filled glossy sphere — ref violet→lavender */}
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 34% 26%, #C6ABFF 0%, #A084FF 22%, #7B59FF 48%, #683AFF 72%, #5A39CC 100%)",
              boxShadow:
                `inset 0 3px 12px rgba(255,255,255,0.42), inset 0 -16px 30px rgba(58,28,120,0.72), 0 0 42px ${GLOW.violet},0.55), 0 0 26px ${GLOW.blue},0.42)`,
            }}
          />
          {/* L5 · top-left specular highlight */}
          <span
            className="absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(42% 34% at 34% 24%, rgba(255,255,255,0.52) 0%, transparent 62%)" }}
          />
          {/* L6 · bright rim ring (lilac→violet, masked) */}
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background: "conic-gradient(from 200deg, #C6ABFF, #A084FF, #683AFF, #4CC3FF, #C6ABFF)",
              padding: "1.5px",
              WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              boxShadow: `0 0 22px ${GLOW.violet},0.5)`,
            }}
          />
          {/* hover glow intensifier */}
          <span
            className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ boxShadow: `0 0 46px ${GLOW.violet},0.8), 0 0 78px ${GLOW.lilac},0.45)` }}
          />
          {/* L7 · microphone with bloom */}
          <Mic
            className="relative h-8 w-8 lg:h-9 lg:w-9"
            strokeWidth={2}
            style={{ color: C.white, filter: "drop-shadow(0 0 9px rgba(210,228,255,0.9)) drop-shadow(0 0 2px rgba(255,255,255,0.95))" }}
          />
        </button>
      </div>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.32em] lg:text-[12px]" style={{ color: C.body, textShadow: TEXT_READABLE }}>
        Tap to Talk
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   QuickActions
────────────────────────────────────────────────────────────────────────── */
const QUICK = [
  { icon: MessageCircleQuestion, text: "How does DOS work?" },
  { icon: BarChart3, text: "What investment opportunities are live?" },
  { icon: Users, text: "How do I participate?" },
  { icon: FileText, text: "What is ShivAI?" },
];

function QuickActions({ onClick, delay = 0 }: { onClick: () => void; delay?: number }) {
  return (
    <motion.div {...entrance(delay)} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-4 lg:gap-3 xl:gap-4">
      {QUICK.map(({ icon: Icon, text }) => (
        <button
          key={text}
          type="button"
          onClick={onClick}
          className="group flex items-center gap-2.5 rounded-2xl p-3 text-left transition-all duration-200 hover:-translate-y-0.5 lg:gap-3 lg:p-3.5 lg:rounded-[18px]"
          style={{
            background:
              `linear-gradient(160deg, rgba(16,20,40,0.92), rgba(10,14,28,0.92)) padding-box, linear-gradient(135deg, rgba(255,255,255,0.12), ${GLOW.soft},0.14) 60%, rgba(255,255,255,0.02)) border-box`,
            border: "1px solid transparent",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 28px -18px rgba(0,0,0,0.9)",
          }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
            style={{
              background: `radial-gradient(circle at 50% 30%, ${GLOW.violet},0.28), ${GLOW.deep},0.1))`,
              border: `1px solid ${GLOW.soft},0.28)`,
              boxShadow: `0 0 14px ${GLOW.violet},0.22), inset 0 1px 0 rgba(255,255,255,0.08)`,
            }}
          >
            <Icon className="h-4 w-4" style={{ color: C.purpleSoft, filter: `drop-shadow(0 0 5px ${GLOW.violet},0.6)) drop-shadow(0 0 8px ${GLOW.blue},0.22))` }} />
          </span>
          <span className="text-[12px] font-medium leading-[1.25] lg:text-[13px] xl:text-[13.5px]" style={{ color: C.body, textShadow: TEXT_READABLE }}>
            {text}
          </span>
        </button>
      ))}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   NetworkSphere — multi-glow nodes, gradient links, halos
────────────────────────────────────────────────────────────────────────── */
const NODES: Array<[number, number, number]> = [
  [100, 26, 2.4], [138, 40, 1.7], [166, 70, 2.2], [180, 108, 2.6], [172, 148, 1.7],
  [150, 174, 2.1], [112, 182, 1.8], [72, 178, 2.3], [40, 156, 1.7], [22, 118, 2.4],
  [20, 78, 1.7], [38, 46, 2], [70, 26, 1.7], [96, 100, 2.9], [130, 84, 1.9],
  [66, 88, 1.7], [86, 138, 2], [140, 128, 1.8], [110, 62, 1.6], [58, 122, 1.7],
  [150, 108, 1.6], [92, 60, 1.5],
];
const LINKS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9],
  [9, 10], [10, 11], [11, 12], [12, 0], [13, 2], [13, 5], [13, 8], [13, 11],
  [14, 3], [14, 18], [15, 9], [15, 19], [16, 6], [16, 8], [17, 4], [17, 20],
  [18, 1], [19, 7], [20, 3], [21, 0], [21, 12],
];

function NetworkSphere({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none aspect-square ${className}`}>
      {/* sphere radial purple glow */}
      <div
        className="nova-globe-glow absolute inset-[8%] rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, ${GLOW.violet},0.38) 0%, transparent 66%)` }}
      />
      {/* blue bloom */}
      <div
        className="absolute inset-[2%] rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle at 60% 60%, ${GLOW.blue},0.2) 0%, transparent 62%)` }}
      />
      {/* outer transparent halo */}
      <div
        className="absolute -inset-[6%] rounded-full blur-[26px]"
        style={{ background: `radial-gradient(circle, ${GLOW.soft},0.14) 0%, transparent 72%)` }}
      />

      <svg
        viewBox="0 0 200 200"
        className="nova-globe-spin relative h-full w-full"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sLink" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop stopColor="#683AFF" />
            <stop offset="1" stopColor="#4CC3FF" />
          </linearGradient>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#A084FF" />
            <stop offset="100%" stopColor="#4CC3FF" stopOpacity="0" />
          </radialGradient>
          <filter id="nodeBlur" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>

        {/* wireframe orbits */}
        <circle cx="100" cy="100" r="72" stroke="#4CC3FF" strokeOpacity="0.26" strokeWidth="0.8" />
        <ellipse cx="100" cy="100" rx="72" ry="28" stroke="#683AFF" strokeOpacity="0.3" strokeWidth="0.8" />
        <ellipse cx="100" cy="100" rx="72" ry="50" stroke="#7B59FF" strokeOpacity="0.2" strokeWidth="0.8" />
        <ellipse cx="100" cy="100" rx="28" ry="72" stroke="#4CC3FF" strokeOpacity="0.22" strokeWidth="0.8" />
        <ellipse cx="100" cy="100" rx="50" ry="72" stroke="#4CC3FF" strokeOpacity="0.16" strokeWidth="0.8" />

        {/* links with graded opacity */}
        {LINKS.map(([a, b], i) => (
          <line
            key={i}
            x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]}
            stroke="url(#sLink)" strokeWidth="0.7" strokeOpacity={0.28 + (i % 5) * 0.1}
          />
        ))}

        {/* nodes — blue halo + purple glow + white core */}
        {NODES.map(([cx, cy, r], i) => (
          <g
            key={i}
            className="nova-node-twinkle"
            style={{
              animationDuration: `${2 + (i % 5) * 0.5}s`,
              animationDelay: `${i * 0.18}s`,
            }}
          >
            <circle cx={cx} cy={cy} r={r * 3.4} fill="url(#nodeGlow)" opacity="0.55" filter="url(#nodeBlur)" />
            <circle cx={cx} cy={cy} r={r * 1.7} fill="#A084FF" opacity="0.5" />
            <circle cx={cx} cy={cy} r={r} fill="#ffffff" />
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   FeaturedOpportunity — layered card background
────────────────────────────────────────────────────────────────────────── */
const STATS = [
  { label: "Minimum Participation", value: "$500" },
  { label: "DOS Value", value: "$0.01" },
  { label: "Status", value: "Live", accent: true },
];

function FeaturedOpportunity({ delay = 0 }: { delay?: number }) {
  const cardStyle = {
    background:
      `radial-gradient(120% 90% at 12% -10%, ${GLOW.violet},0.2) 0%, transparent 52%) padding-box,` +
      `radial-gradient(90% 90% at 108% 8%, ${GLOW.blue},0.14) 0%, transparent 58%) padding-box,` +
      "linear-gradient(160deg, #121834 0%, #0A0E1E 72%) padding-box," +
      `linear-gradient(135deg, ${GLOW.violet},0.55), ${GLOW.blue},0.2) 55%, rgba(255,255,255,0.06)) border-box`,
    border: "1px solid transparent",
    boxShadow:
      `0 0 22px ${GLOW.violet},0.14), 0 24px 60px -30px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.08)`,
  };

  return (
    <div
      className="relative mt-4 overflow-hidden rounded-[20px] p-5 lg:mt-0 lg:min-h-[320px] lg:p-7 xl:min-h-[340px] xl:rounded-[24px] xl:p-8"
      style={cardStyle}
    >
      {/* inner vignette */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[20px]"
        style={{ background: "radial-gradient(120% 90% at 50% 20%, transparent 55%, rgba(4,6,16,0.55) 100%)" }}
        aria-hidden="true"
      />
      {/* top highlight line */}
      <div
        className="pointer-events-none absolute inset-x-4 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)" }}
        aria-hidden="true"
      />

      <NetworkSphere className="absolute right-[-8%] top-0 aspect-square w-[54%] max-w-[215px] -translate-y-[40%] lg:right-[-4%] lg:w-[46%] lg:max-w-[300px] lg:-translate-y-[38%] xl:max-w-[340px] xl:-translate-y-[36%]" />

      <motion.div {...entrance(delay)} className="relative">
        {/* scrim so left-side copy stays legible over the globe */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-4 -right-[18%] rounded-2xl"
          style={{
            background:
              "linear-gradient(90deg, rgba(10,14,30,0.92) 0%, rgba(10,14,30,0.72) 68%, transparent 100%)",
          }}
        />

        <div className="relative">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] lg:text-[11px]" style={{ color: C.paleLilac, textShadow: `0 0 12px ${GLOW.violet},0.55), ${LABEL_HIGHLIGHT}` }}>
          Featured Opportunity
        </span>
        <h2 className="mt-2 max-w-[62%] text-[18px] font-bold leading-[1.25] lg:max-w-[58%] lg:text-[22px] xl:max-w-[56%] xl:text-[24px]" style={{ color: C.white, textShadow: TEXT_READABLE }}>
          ShivAI – AI Workforce
          <br />
          Operating System
        </h2>
        <p className="mt-2 max-w-[74%] text-[12.5px] font-medium leading-[1.55] lg:max-w-[62%] lg:text-[14px] xl:max-w-[58%] xl:text-[15px]" style={{ color: C.body, textShadow: TEXT_READABLE }}>
          Own a stake in the future of AI-driven customer engagement and automation.
        </p>

        <div className="mt-5 flex flex-wrap items-end gap-x-7 gap-y-3 lg:mt-6 lg:gap-x-10 xl:gap-x-12">
          {STATS.map(({ label, value, accent }) => (
            <div key={label} className="flex flex-col gap-1">
              <span
                className="text-[9px] font-bold uppercase tracking-[0.14em] lg:text-[10px]"
                style={{ color: C.paleLilac, textShadow: LABEL_HIGHLIGHT }}
              >
                {label}
              </span>
              <span
                className="text-[17px] font-bold lg:text-[19px] xl:text-[21px]"
                style={
                  accent
                    ? { color: C.paleLilac, textShadow: `0 0 16px ${GLOW.violet},0.7), ${TEXT_READABLE}` }
                    : { color: C.white, textShadow: TEXT_READABLE }
                }
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        <a
          href={OFFERING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative mt-5 inline-flex items-center gap-1.5 overflow-hidden rounded-xl px-4 py-2.5 text-[12px] font-bold transition-transform duration-200 hover:-translate-y-0.5 lg:mt-6 lg:px-5 lg:py-3 lg:text-[13px] xl:text-[14px]"
          style={{ background: CTA_BG, color: C.white, boxShadow: CTA_SHADOW }}
        >
          {/* gloss layer (top light reflection) */}
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2" style={{ background: CTA_GLOSS }} />
          {/* blue reflection sweeping the base */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
            style={{ background: `linear-gradient(180deg, transparent, ${GLOW.lilac},0.16))`, mixBlendMode: "screen" }}
          />
          {/* hover bloom */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ boxShadow: `0 0 30px ${GLOW.violet},0.75), 0 0 52px ${GLOW.lilac},0.4)` }}
          />
          <span className="relative">Explore Opportunity</span>
          <ArrowRight className="relative h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </a>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   FeatureGrid
────────────────────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: ShieldCheck, label: "KYC Verified" },
  { icon: ScanSearch, label: "AML Scored" },
  { icon: Wallet, label: "Custodial Wallets" },
  { icon: Landmark, label: "UAE Structured" },
  { icon: Link2, label: "On-Chain Transparency" },
];

function FeatureGrid({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      {...entrance(delay)}
      className="mt-4 flex items-start justify-between gap-1 rounded-[20px] px-3 py-3.5 lg:mt-4 lg:gap-2 lg:px-5 lg:py-4 xl:rounded-[24px] xl:px-6"
      style={{
        background:
          `linear-gradient(rgba(13,18,36,0.62),rgba(10,14,28,0.62)) padding-box, linear-gradient(135deg, rgba(255,255,255,0.1), ${GLOW.soft},0.1)) border-box`,
        border: "1px solid transparent",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 18px ${GLOW.violet},0.08)`,
      }}
    >
      {FEATURES.map(({ icon: Icon, label }) => (
        <div key={label} className="flex flex-1 flex-col items-center gap-2 text-center">
          <Icon className="h-4 w-4 lg:h-[18px] lg:w-[18px] xl:h-5 xl:w-5" style={{ color: C.purpleSoft, filter: `drop-shadow(0 0 5px ${GLOW.violet},0.55)) drop-shadow(0 0 8px ${GLOW.blue},0.22))` }} />
          <span className="text-[9px] font-medium leading-tight lg:text-[10px] xl:text-[11px]" style={{ color: C.label, textShadow: TEXT_READABLE }}>
            {label}
          </span>
        </div>
      ))}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Footer
────────────────────────────────────────────────────────────────────────── */
function Footer({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div {...entrance(delay)} className="mt-5 flex flex-col items-center gap-1 text-center lg:mt-10 xl:mt-12">
      <p className="flex items-center gap-1.5 text-[12px] font-semibold lg:text-[13px] xl:text-[14px]" style={{ color: C.body, textShadow: TEXT_READABLE }}>
        <Lock className="h-3 w-3" style={{ color: C.paleLilac, filter: `drop-shadow(0 0 4px ${GLOW.violet},0.6))` }} />
        Secure. Compliant. Transparent.
      </p>
      <p className="text-[11px] lg:text-[12px] xl:text-[13px]" style={{ color: C.label, textShadow: TEXT_READABLE }}>
        Built for long-term value creation.
      </p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Page
────────────────────────────────────────────────────────────────────────── */
export default function GrowithNova() {
  const openNovaWidget = useCallback(() => {
    const api = (window as Window & { ShivAIWidget?: { open?: () => void } }).ShivAIWidget;
    if (api?.open) {
      api.open();
      return;
    }
    document.querySelector<HTMLButtonElement>(".shivai-trigger")?.click();
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden" style={{ fontFamily: FONT_STACK, background: C.bg }}>
      <NovaLoopStyles />
      <BackgroundEffects />
      <main className="relative z-10 mx-auto flex w-full max-w-[480px] flex-col px-5 pb-12 sm:max-w-[520px] sm:px-6 lg:max-w-[1320px] lg:px-6 lg:pb-16 xl:max-w-[1400px] xl:px-8">
        <Navbar />

        {/* Mobile: hero → voice → quick → card → trust. Desktop: 2-col hero + full-width quick row */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-x-8 xl:gap-x-10">
          {/* Left — hero + orb (orb centered in column) */}
          <div className="order-1 flex min-w-0 flex-col lg:order-none lg:h-full">
            <Hero />
            <VoiceButton onClick={openNovaWidget} delay={0.3} />
          </div>

          {/* Right — featured card + trust (top-aligned with hero) */}
          <div className="order-3 flex min-w-0 flex-col lg:order-none">
            <FeaturedOpportunity delay={0.46} />
            <FeatureGrid delay={0.54} />
          </div>

          {/* Quick actions — full width below hero row on desktop */}
          <div className="order-2 lg:order-none lg:col-span-2 lg:mt-8 xl:mt-10">
            <QuickActions onClick={openNovaWidget} delay={0.38} />
          </div>
        </div>

        <Footer delay={0.6} />
      </main>
    </div>
  );
}
