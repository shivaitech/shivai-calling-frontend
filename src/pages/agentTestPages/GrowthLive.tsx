import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hand } from "lucide-react";
import { Orb, oceanDepthsPreset } from "react-ai-orb";

const PHRASES = [
  "Private Opportunities · Verified Investors Only",
  "Digital Ownership Stakes (DOS)",
  "High-growth business opportunities",
  "UAE-Holding licensed platform",
  "Legally documented digital ownership",
];

const HERO_CARDS = [
  {
    icon: "🌐",
    title: "Private Opportunities",
    text: "Discover private investment opportunities and own a small part of high-growth businesses through secure digital ownership.",
  },
  {
    icon: "📈",
    title: "High-Growth Access",
    text: "Buy digital ownership units in carefully selected high-growth opportunities.",
  },
  {
    icon: "🏛️",
    title: "UAE-Licensed Platform",
    text: "Invest in high-growth opportunities through legally documented digital ownership units issued through a UAE-Holding licensed platform.",
  },
];

const FEATURES = [
  { icon: "🔐", title: "KYC / AML Verified" },
  { icon: "⛓️", title: "On-Chain Transparent" },
  { icon: "🏛️", title: "UAE Regulated" },
  { icon: "🔒", title: "Custodial Wallets" },
];

const PG = "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)";
const PTG = "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)";
const PGLOW = "0 0 40px rgba(124,58,237,0.45)";

function NovaOrbCTA({
  onClick,
  compact = false,
}: {
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      onClick={onClick}
      className={`pointer-events-auto flex flex-col items-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-2xl ${
        compact ? "gap-0.5" : "gap-3 sm:gap-4"
      }`}
      aria-label="Talk to Nova — open AI investment assistant"
    >
      <motion.div
        initial={{ scale: 0.88 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`relative flex items-center justify-center ${
          compact
            ? "w-[108px] h-[108px]"
            : "w-[200px] h-[200px] lg:w-[260px] lg:h-[260px]"
        }`}
      >
        <motion.div
          animate={
            compact
              ? { scale: [1, 1.08, 1], opacity: [0.2, 0.35, 0.2] }
              : { scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }
          }
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute rounded-full pointer-events-none ${
            compact ? "inset-1" : "inset-0"
          }`}
          style={{
            background:
              "radial-gradient(circle, rgba(124,58,237,0.5) 0%, transparent 70%)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`rounded-full blur-3xl opacity-50 ${
              compact ? "w-[72px] h-[72px]" : "w-[130px] h-[130px] lg:w-[160px] lg:h-[160px]"
            }`}
            style={{ background: "#a78bfa" }}
          />
        </div>
        <Orb {...oceanDepthsPreset} size={compact ? 0.62 : 1.05} />
      </motion.div>
      <div
        className={`flex flex-col items-center pointer-events-none text-center ${
          compact ? "gap-0 -mt-1" : "gap-1"
        }`}
      >
        <p
          className={`flex items-center justify-center gap-1.5 text-white/60 font-medium tracking-[0.2em] uppercase ${
            compact ? "text-[9px]" : "text-[10px]"
          }`}
        >
          <motion.span
            animate={{ y: [0, -3, 0], opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex"
            aria-hidden="true"
          >
            <Hand
              className={compact ? "w-3 h-3" : "w-3.5 h-3.5"}
              strokeWidth={2.25}
            />
          </motion.span>
          Tap to start
        </p>
        <p
          className={`text-white font-bold tracking-tight ${
            compact ? "text-base" : "text-xl lg:text-2xl"
          }`}
        >
          Talk to{" "}
          <span
            style={{
              background: PTG,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: PGLOW,
            }}
          >
            Nova
          </span>
        </p>
      </div>
    </motion.button>
  );
}

export default function GrowithLive() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [heroDescIndex, setHeroDescIndex] = useState(0);

  useEffect(() => {
    const cycle = setInterval(
      () => setPhraseIndex((i) => (i + 1) % PHRASES.length),
      5000
    );
    return () => clearInterval(cycle);
  }, []);

  useEffect(() => {
    const cycle = setInterval(
      () => setHeroDescIndex((i) => (i + 1) % HERO_CARDS.length),
      6000
    );
    return () => clearInterval(cycle);
  }, []);

  const openNovaWidget = useCallback(() => {
    const api = (
      window as Window & { ShivAIWidget?: { open?: () => void } }
    ).ShivAIWidget;
    if (api?.open) {
      api.open();
      return;
    }
    document.querySelector<HTMLButtonElement>(".shivai-trigger")?.click();
  }, []);

  return (
    <div
      className="min-h-screen w-full flex flex-col relative"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      {/* Background image */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "url(/NovaBH.png)",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
        aria-hidden="true"
      />
      <div className="fixed inset-0 pointer-events-none bg-black/78" aria-hidden="true" />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(11,13,26,0.55) 0%, rgba(11,13,26,0.72) 45%, rgba(11,13,26,0.92) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Subtle brand glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-24 left-1/4 w-[500px] h-[300px] rounded-full"
          style={{ background: "rgba(109,40,217,0.08)", filter: "blur(120px)" }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: "rgba(124,58,237,0.06)", filter: "blur(130px)" }}
        />
      </div>

      {/* Desktop — orb fixed at viewport center */}
      <div className="hidden lg:flex fixed inset-0 z-[25] items-center justify-center pointer-events-none">
        <NovaOrbCTA onClick={openNovaWidget} />
      </div>

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 sm:px-8 py-4 border-b border-white/5 flex-shrink-0">
        <span
          className="font-black text-lg text-white"
          style={{ letterSpacing: "-0.03em" }}
        >
          gro<span style={{ color: "#a78bfa" }}>with</span>
        </span>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm"
          style={{
            borderColor: "rgba(167,139,250,0.3)",
            background: "rgba(124,58,237,0.12)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#a78bfa" }}
          />
          <span
            className="text-[8px] font-bold tracking-widest uppercase"
            style={{ color: "#a78bfa" }}
          >
            Live · Private Offering
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-start lg:items-center px-6 sm:px-10 lg:px-16 gap-2 lg:gap-14 py-6 lg:py-10 pointer-events-none">
        {/* LEFT — Hero */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full lg:flex-1 flex flex-col items-center lg:items-start gap-4 lg:gap-5 pointer-events-auto"
        >
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border backdrop-blur-sm"
            style={{
              borderColor: "rgba(167,139,250,0.35)",
              background: "rgba(124,58,237,0.14)",
              boxShadow: "0 0 24px rgba(124,58,237,0.2)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
              style={{ background: "#a78bfa" }}
            />
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-center lg:text-left">
              <span
                className="font-bold"
                style={{
                  background: PTG,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Meet Your AI
              </span>{" "}
              <span className="text-white/55">Investment Assistant</span>
            </p>
          </div>

          <h1
            className="font-black leading-none tracking-tight text-[3.6rem] sm:text-[4.8rem] lg:text-[5.6rem] text-center lg:text-left"
            style={{
              background: PTG,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: PGLOW,
            }}
          >
            Nova
          </h1>

          <div className="text-center lg:text-left w-full max-w-lg flex flex-col gap-1.5">
            <p className="text-white font-bold text-xl sm:text-2xl lg:text-[1.8rem] leading-tight">
              Build Ownership in
            </p>
            <p
              className="font-bold text-xl sm:text-2xl lg:text-[1.8rem] leading-tight"
              style={{
                background: PTG,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Tomorrow&apos;s Businesses
            </p>
            <div className="relative mt-3 lg:mt-4 w-full hidden lg:block">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={heroDescIndex}
                  initial={{ opacity: 0, x: -32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 32 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl border px-4 py-3.5 backdrop-blur-sm text-left"
                  style={{
                    borderColor: "rgba(167,139,250,0.28)",
                    background: "rgba(124,58,237,0.1)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
                      style={{
                        background: "rgba(124,58,237,0.2)",
                        border: "1px solid rgba(167,139,250,0.25)",
                      }}
                      aria-hidden="true"
                    >
                      {HERO_CARDS[heroDescIndex].icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[11px] sm:text-xs font-bold mb-1"
                        style={{ color: "#c4b5fd" }}
                      >
                        {HERO_CARDS[heroDescIndex].title}
                      </p>
                      <p className="text-white/55 text-[11px] sm:text-[13px] leading-relaxed">
                        {HERO_CARDS[heroDescIndex].text}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="flex justify-center lg:justify-start gap-1.5 mt-2.5">
                {HERO_CARDS.map((_, i) => (
                  <span
                    key={i}
                    className="h-1 rounded-full transition-all duration-300"
                    style={{
                      width: i === heroDescIndex ? 18 : 6,
                      background:
                        i === heroDescIndex
                          ? "#a78bfa"
                          : "rgba(167,139,250,0.25)",
                    }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile — orb in document flow between hero and cards */}
        <div className="flex lg:hidden w-full justify-center py-2 pointer-events-auto relative z-10">
          <NovaOrbCTA onClick={openNovaWidget} compact />
        </div>

        {/* RIGHT */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="w-full lg:flex-1 flex flex-col gap-4 lg:max-w-md pointer-events-auto"
        >
          {/* Rotating ticker */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border backdrop-blur-sm w-fit mx-auto lg:mx-0"
            style={{
              borderColor: "rgba(167,139,250,0.25)",
              background: "rgba(124,58,237,0.1)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
              style={{ background: "#a78bfa" }}
            />
            <span
              className="text-[10px] font-semibold min-w-[200px] sm:min-w-[240px] overflow-hidden block"
              style={{ color: "#c4b5fd" }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={phraseIndex}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="block"
                >
                  {PHRASES[phraseIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </div>

          {/* Live offering card */}
          <div
            className="flex items-start gap-3 px-4 py-4 rounded-2xl border"
            style={{
              borderColor: "rgba(167,139,250,0.25)",
              background: "rgba(124,58,237,0.09)",
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "#a78bfa" }}
                >
                  Live · Private Offering
                </span>
              </div>
              <p className="text-white font-bold text-[11px] leading-snug">
                ShivAI — Voice AI SaaS Private Offering
              </p>
              <p className="text-white/55 text-[10px] mt-2 leading-relaxed">
                DOS — Digital Ownership Stake Value:{" "}
                <span className="text-white font-semibold">$0.01</span>
              </p>
              <p className="text-white/55 text-[10px] mt-1 leading-relaxed">
                Minimum Participation:{" "}
                <span className="text-white font-semibold">$500</span>
              </p>
            </div>
            <a
              href="https://www.growithlive.com/token/shivai"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide text-white mt-1"
              style={{ background: PG }}
            >
              View
            </a>
          </div>

          {/* DOS definition */}
          <p
            className="text-[10px] leading-relaxed px-1"
            style={{ color: "rgba(196,181,253,0.75)" }}
          >
            <span className="font-semibold text-violet-300">
              Digital Ownership Stakes (DOS)
            </span>{" "}
            represent a small fractional ownership interest in an investment
            opportunity.
          </p>

          {/* Stats */}
          <div className="flex items-center gap-6 sm:gap-8 justify-center lg:justify-start py-1 flex-wrap">
            {[
              { value: "$0.01", label: "DOS value" },
              { value: "$500", label: "Min. participation" },
              { value: "Live", label: "Private offering" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center lg:items-start gap-0.5"
              >
                <span
                  className="font-black text-xl lg:text-2xl"
                  style={{
                    background: PTG,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 0 8px rgba(124,58,237,0.5))",
                  }}
                >
                  {value}
                </span>
                <span className="text-white/45 text-[8px] uppercase tracking-widest text-center lg:text-left">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {FEATURES.map(({ icon, title }) => (
              <div
                key={title}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-medium"
                style={{
                  borderColor: "rgba(167,139,250,0.15)",
                  background: "rgba(124,58,237,0.07)",
                  color: "#c4b5fd",
                }}
              >
                <span>{icon}</span>
                <span>{title}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 mt-1">
            <a
              href="https://www.growithlive.com/token/shivai"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-xl text-[13px] font-bold text-white text-center hover:opacity-90 transition-opacity"
              style={{ background: PG, boxShadow: "0 4px 24px rgba(124,58,237,0.4)" }}
            >
              Explore Live Offering
            </a>
            <a
              href="https://www.growithlive.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-xl text-[13px] font-semibold text-center border hover:bg-white/5 transition-colors"
              style={{ borderColor: "rgba(167,139,250,0.3)", color: "#c4b5fd" }}
            >
              Review Documentation
            </a>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
