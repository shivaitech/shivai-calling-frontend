"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Orb, oceanDepthsPreset } from "react-ai-orb";
import bgNew from "../resources/AiImages/bg22.webp";
import { isKunalPrakashClient } from "../lib/utils";

interface AgentInfo {
  name: string;
  status: string;
  industry?: string;
  language?: string;
  business_process?: string;
}

const VIDEO_FILES = [
  "/videos/YTDown.com_YouTube_4K-Free-Stock-Footage-Market-Values-_-St_Media_kPEPFizOFdQ_002_720p.mp4",
  "/videos/7579564-uhd_4096_2160_25fps.mp4",
  "/videos/9365669-hd_1920_1080_25fps.mp4",
];

export default function AgentPublicPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");

  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [videoVisible, setVideoVisible] = useState(false);
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const agentFetchRef = useRef<string | null>(null);

  // Get user email from localStorage
  const getUserEmailFromStorage = () => {
    try {
      const authUser = localStorage.getItem("auth_user");
      if (authUser) {
        const userData = JSON.parse(authUser);
        return userData?.email || userData?.user?.email || null;
      }
    } catch (error) {
      console.error("Error parsing auth_user from localStorage:", error);
    }
    return null;
  };

  const userEmail = getUserEmailFromStorage();

  // Check if this is the Kunal Prakash client with custom UI
  const isKunalClient = isKunalPrakashClient(userEmail || undefined);

  const badgePhrases = [
    "Ask about accounts, spreads & leverage",
    "500:1 Max Leverage · $100 Min Deposit",
    "Available 24/7 · Instant answers",
    "Forex · Metals · Indices · Crypto",
    "Trained on New TradeFx · Ready now",
  ];
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  useEffect(() => {
    const cycle = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % badgePhrases.length);
    }, 5500);
    return () => clearInterval(cycle);
  }, []);
  useEffect(() => {
    const phrase = badgePhrases[phraseIndex];
    setDisplayText("");
    let i = 0;
    const typer = setInterval(() => {
      i++;
      setDisplayText(phrase.slice(0, i));
      if (i >= phrase.length) clearInterval(typer);
    }, 55);
    return () => clearInterval(typer);
  }, [phraseIndex]);

  useEffect(() => {
    if (!agentId) return;

    // Prevent duplicate fetches for the same agent
    if (agentFetchRef.current === agentId) return;
    agentFetchRef.current = agentId;

    const fetchAgent = async () => {
      try {
        const response = await fetch(
          `https://nodejs.service.callshivai.com/api/v1/agent-configs/${agentId}`,
        );
        if (response.ok) {
          const data = await response.json();
          // Only set agent info if this is still the current agentId
          if (agentFetchRef.current === agentId) {
            setAgentInfo(data?.data?.agent || data);
          }
        }
      } catch {
        // Silently fail
      }
    };

    fetchAgent();

    return () => {
      // Reset fetch ref on unmount
      agentFetchRef.current = null;
    };
  }, [agentId]);

  const agentName = agentInfo?.name || "Your AI Employee";

  // Kunal client: render original simple UI unchanged
  if (isKunalClient) {
    return (
      <div
        className="min-h-screen w-full relative font-sans overflow-hidden"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `url(${bgNew})`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundAttachment: "fixed",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-black/40 pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white/70 text-xs">Live</span>
          </div>
        </div>
        <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 py-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative flex items-center justify-center mb-6"
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[160px] h-[160px] rounded-full bg-white opacity-10 blur-3xl" />
            </div>
            <Orb {...oceanDepthsPreset} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col items-center gap-3 max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-medium backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              AI Politician Â· Ready to Talk
            </span>
            <h1 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight">
              Talk to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-white to-slate-300">
                PMJC
              </span>
            </h1>
            <p className="text-white/70 text-sm sm:text-base md:text-lg max-w-lg leading-relaxed">
              Click the chat button in the bottom-right corner to start a
              conversation.
            </p>
          </motion.div>
        </main>
        <div className="relative z-20 text-center pb-6" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full relative font-sans flex flex-col overflow-hidden"
      style={{ fontFamily: "Poppins, sans-serif", background: "#020b18" }}
    >
      {/* Fallback gradient — always visible, shows through when video not loaded */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, #020b18 0%, #041428 30%, #071e3d 60%, #04111f 100%)",
          zIndex: 0,
        }}
        aria-hidden="true"
      />
      {/* Local video background — fades in once loaded, cycles through all videos */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0, overflow: "hidden" }}
        aria-hidden="true"
      >
        <video
          key={currentVideoIdx}
          autoPlay
          muted
          playsInline
          onCanPlayThrough={() => setVideoVisible(true)}
          onEnded={() => {
            setVideoVisible(false);
            setTimeout(
              () => setCurrentVideoIdx((i) => (i + 1) % VIDEO_FILES.length),
              1000,
            );
          }}
          onError={() =>
            setCurrentVideoIdx((i) => (i + 1) % VIDEO_FILES.length)
          }
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "100vw",
            height: "56.25vw",
            minHeight: "100vh",
            minWidth: "177.78vh",
            transform: "translate(-50%, -50%)",
            objectFit: "cover",
            pointerEvents: "none",
            opacity: videoVisible ? 1 : 0,
            transition: "opacity 0.9s ease",
          }}
        >
          <source src={VIDEO_FILES[currentVideoIdx]} type="video/mp4" />
        </video>
      </div>
      {/* Dark overlay so text remains readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "rgba(2, 11, 24, 0.88)", zIndex: 1 }}
        aria-hidden="true"
      />
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          zIndex: 1,
        }}
        aria-hidden="true"
      />
      {/* Gold glow top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(234,179,8,0.10) 0%, transparent 70%)",
          zIndex: 1,
        }}
        aria-hidden="true"
      />

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-6 sm:px-10 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
            <img
              src="https://www.tradefxservices.com/assets/4be76a46/images/favicon.png"
              alt="New TradeFx Services"
              className="w-6 h-6 rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <span
            className="font-black text-sm sm:text-base tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 truncate max-w-[150px] sm:max-w-none"
            style={{ filter: "drop-shadow(0 0 12px rgba(234,179,8,0.4))" }}
          >
            New TradeFx Services
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-white/60 text-xs font-semibold tracking-widest uppercase">
            Live
          </span>
        </div>
      </div>

      {/* CENTER — hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 gap-4 sm:gap-5 sm:-translate-y-[5%]">
        {/* Pre-headline */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="flex flex-col items-center gap-1.5"
        >
          <p className="text-white/50 text-xs font-semibold tracking-[0.3em] uppercase"></p>
          <p className="text-white font-bold text-xs sm:text-lg tracking-[0.15em] uppercase">
            New-Age Trading Technology + AI
          </p>
        </motion.div>

        {/* Orb — 3 rings, gold-tinted */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative flex items-center justify-center my-2 sm:my-0"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-[150px] h-[150px] sm:w-[220px] sm:h-[220px] rounded-full blur-2xl pointer-events-none"
            style={{ background: "rgba(234,179,8,0.18)" }}
          />
          <motion.div
            animate={{ scale: [1, 1.35, 1], opacity: [0.1, 0.22, 0.1] }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.7,
            }}
            className="absolute w-[230px] h-[230px] sm:w-[320px] sm:h-[320px] rounded-full blur-3xl pointer-events-none"
            style={{ background: "rgba(59,130,246,0.18)" }}
          />
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.05, 0.12, 0.05] }}
            transition={{
              duration: 6.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.4,
            }}
            className="absolute w-[290px] h-[290px] sm:w-[420px] sm:h-[420px] rounded-full blur-3xl pointer-events-none"
            style={{ background: "rgba(234,179,8,0.08)" }}
          />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Orb {...oceanDepthsPreset} />
          </motion.div>
        </motion.div>

        {/* Name block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
          className="flex flex-col items-center gap-3"
        >
          <p className="text-white text-sm font-semibold tracking-[0.35em] uppercase">
            Your AI Trading Expert
          </p>
          <h1
            className="text-transparent bg-clip-text font-black leading-none tracking-tight text-5xl xs:text-5xl sm:text-7xl md:text-8xl"
            style={{
              backgroundImage:
                "linear-gradient(180deg, #fef9c3 0%, #fde047 40%, #f59e0b 100%)",
              filter: "drop-shadow(0 0 50px rgba(234,179,8,0.45))",
            }}
          >
            {agentName}
          </h1>
        </motion.div>

        {/* Power line */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="text-white/80 text-sm sm:text-lg md:text-xl font-semibold mt-1 sm:mt-0 w-full max-w-lg"
        >
          Forex. Metals. Crypto.{" "}
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(90deg, #fde047, #f59e0b)",
            }}
          >
            All Handled Instantly.
          </span>
        </motion.p>

        {/* Live badge — scrolling text */}
        {/* <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/20 bg-yellow-500/5 backdrop-blur-sm mt-0 max-w-[calc(100vw-3rem)] overflow-hidden"
        >
          <span className="w-1.5 h-1.5 shrink-0 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-yellow-200/80 text-[10px] sm:text-xs font-semibold tracking-widest uppercase truncate">
            {displayText}
          </span>
        </motion.div> */}

        {/* AI capabilities */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.0 }}
          className="flex flex-wrap justify-center gap-2 w-full max-w-lg mt-1 sm:mt-0 px-2"
        >
          {[
            "Explains Spreads & Leverage",
            "Guides Account Opening",
            "Real-time Market Q&A",
            "Available 24/7",
          ].map((feat) => (
            <span
              key={feat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide border border-yellow-500/20 bg-yellow-500/5 text-yellow-200/70"
            >
              <span className="w-1 h-1 rounded-full bg-yellow-400/60 shrink-0" />
              {feat}
            </span>
          ))}
        </motion.div>

        {/* Social proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.1 }}
          className="text-white/80 text-xs mt-1"
        >
          Trusted by 35,000+ traders · Zero Commission · Lightning-Fast
          Execution
        </motion.p>
      </main>

      {/* Bottom branding */}
      <div className="relative z-20 text-center pb-5">
        <p className="text-white/20 text-[10px] tracking-widest uppercase">
          tradefxservices.com
        </p>
      </div>
    </div>
  );
}
