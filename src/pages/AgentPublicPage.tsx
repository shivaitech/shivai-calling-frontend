"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Orb, oceanDepthsPreset } from "react-ai-orb";
import bgNew from "../resources/AiImages/bg22.webp";
import { isKunalPrakashClient, isNagarNigamMoradabadClient, isGrowithNovaClient } from "../lib/utils";
import AgentPublicPageNLP from "./AgentPublicPageNLP";
import NagarNigamMoradabad from "./agentTestPages/NagarNigamMoradabad";
import GrowthLive from "./agentTestPages/GrowthLive";
import GrowithNova from "./agentTestPages/GrowithNova";

interface AgentInfo {
  name: string;
  status: string;
  industry?: string;
  language?: string;
  business_process?: string;
  company_name?: string;
}

export default function AgentPublicPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");

  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [agentInfoLoaded, setAgentInfoLoaded] = useState(false);
  const agentFetchRef = useRef<string | null>(null);
  const scriptRef = useRef(false);

  const getUserEmailFromStorage = () => {
    try {
      const authUser = localStorage.getItem("auth_user");
      if (authUser) {
        const parsed = JSON.parse(authUser);
        return parsed?.email || parsed?.user?.email || null;
      }
    } catch {}
    return null;
  };

  const userEmail = getUserEmailFromStorage();

  const isKunalClient    = isKunalPrakashClient(userEmail || undefined);
  const isTradeFxClient  = (agentInfo?.name || "") === "Saanvi" || (userEmail || "").toLowerCase() === "tradefxservicesofficial@gmail.com";
  const isNagarNigamClient = isNagarNigamMoradabadClient(userEmail || undefined, agentInfo?.name, agentInfo?.company_name);
  const isGrowithNova    = isGrowithNovaClient(agentInfo?.name, agentInfo?.company_name);

  const badgePhrases = isTradeFxClient
    ? [
        "Ask about accounts, spreads & leverage",
        "500:1 Max Leverage · $100 Min Deposit",
        "Available 24/7 · Instant answers",
        "Forex · Metals · Indices · Crypto",
        "Trained on New TradeFx · Ready now",
      ]
    : [
        "Not pre-recorded · This is live",
        "Understands your customers instantly",
        "Handles calls while you focus on growth",
        "Available 24/7 · Never calls in sick",
        "Trained on your business · Ready now",
      ];

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    const cycle = setInterval(() => setPhraseIndex((i) => (i + 1) % badgePhrases.length), 5500);
    return () => clearInterval(cycle);
  }, []);

  useEffect(() => {
    const phrase = badgePhrases[phraseIndex];
    setDisplayText("");
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplayText(phrase.slice(0, i));
      if (i >= phrase.length) clearInterval(t);
    }, 55);
    return () => clearInterval(t);
  }, [phraseIndex]);

  useEffect(() => {
    if (agentInfo?.name) {
      document.title = `${agentInfo.name} — AI Employee Test | ShivAI`;
    }
    return () => {
      document.title = "Call ShivAI - Voice-Powered AI Assistant & No-Code AI Platform";
    };
  }, [agentInfo?.name]);

  // Fetch agent info
  useEffect(() => {
    if (!agentId || agentFetchRef.current === agentId) return;
    agentFetchRef.current = agentId;
    setAgentInfoLoaded(false);
    (async () => {
      try {
        const res = await fetch(`https://nodejs.service.callshivai.com/api/v1/agent-configs/${agentId}`);
        if (res.ok) {
          const data = await res.json();
          if (agentFetchRef.current === agentId) setAgentInfo(data?.data?.agent || data);
        }
      } catch {} finally {
        if (agentFetchRef.current === agentId) setAgentInfoLoaded(true);
      }
    })();
    return () => { agentFetchRef.current = null; };
  }, [agentId]);

  // Load widget5.js after agent info is known (Nova test page needs novaPage flag on mobile).
  useEffect(() => {
    if (!agentId || !agentInfoLoaded || scriptRef.current) return;
    scriptRef.current = true;
    const params = new URLSearchParams();
    params.set("agentId", agentId);
    if (userId) params.set("userId", userId);
    params.set("bypass", "true");
    if (isGrowithNovaClient(agentInfo?.name, agentInfo?.company_name)) {
      params.set("novaPage", "1");
    }
    params.set("v", Date.now().toString());
    const script = document.createElement("script");
    script.src = `/widget5.js?${params.toString()}`;
    script.async = false;
    document.body.appendChild(script);
  }, [agentId, userId, agentInfoLoaded, agentInfo?.name, agentInfo?.company_name]);

  const agentName = agentInfo?.name || "Your AI Employee";

  if (agentId && !agentInfoLoaded) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Custom client branches ────────────────────────────────────────────────
  if (isKunalClient) {
    return (
      <div className="min-h-screen w-full relative font-sans overflow-hidden" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `url(${bgNew})`, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "cover", backgroundAttachment: "fixed" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/40 pointer-events-none" aria-hidden="true" />
        <div className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white/70 text-xs">Live</span>
          </div>
        </div>
        <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 py-10 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[160px] h-[160px] rounded-full bg-white opacity-10 blur-3xl" />
            </div>
            <Orb {...oceanDepthsPreset} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="flex flex-col items-center gap-3 max-w-2xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-medium backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              AI Politician · Ready to Talk
            </span>
            <h1 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight">
              Talk to <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-white to-slate-300">PMJC</span>
            </h1>
            <p className="text-white/70 text-sm sm:text-base md:text-lg max-w-lg leading-relaxed">
              Click the chat button in the bottom-right corner to start a conversation.
            </p>
          </motion.div>
        </main>
        <div className="relative z-20 text-center pb-6" />
      </div>
    );
  }

  // New Nova UI is the default for growith clients; old page stays at ?ui=old
  const legacyGrowthUi = searchParams.get("ui") === "old";

  if (isTradeFxClient) return <AgentPublicPageNLP />;
  if (isNagarNigamClient) return <NagarNigamMoradabad />;
  if (isGrowithNova) return legacyGrowthUi ? <GrowthLive /> : <GrowithNova />;

  // ── Default test page ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full relative font-sans flex flex-col overflow-hidden" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `url(${bgNew})`, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "cover", backgroundAttachment: "fixed" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-black/75 pointer-events-none" aria-hidden="true" />

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-8 py-5">
        <span className="font-black text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-blue-300" style={{ filter: "drop-shadow(0 0 16px rgba(103,232,249,0.5))" }}>
          Callshivai.com
        </span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-white text-xs font-semibold tracking-widest uppercase">Live</span>
        </div>
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 gap-7 sm:gap-5 -translate-y-[8%]">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05 }} className="flex flex-col items-center gap-2">
          <p className="text-white/70 text-sm font-semibold tracking-[0.3em] uppercase">This is not a Bot.</p>
          <p className="text-white font-bold text-lg tracking-[0.2em] uppercase">This is an AI Employee.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: "easeOut" }} className="relative flex items-center justify-center my-2 sm:my-0">
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.18, 0.38, 0.18] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} className="absolute w-[220px] h-[220px] rounded-full bg-cyan-400/25 blur-2xl pointer-events-none" />
          <motion.div animate={{ scale: [1, 1.35, 1], opacity: [0.1, 0.22, 0.1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }} className="absolute w-[320px] h-[320px] rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
          <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.05, 0.13, 0.05] }} transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.4 }} className="absolute w-[420px] h-[420px] rounded-full bg-indigo-400/15 blur-3xl pointer-events-none" />
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}>
            <Orb {...oceanDepthsPreset} />
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }} className="flex flex-col items-center gap-3">
          <p className="text-white/70 text-sm font-medium tracking-[0.35em] uppercase">Meet your AI Employee</p>
          <h1 className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/70 font-black leading-none tracking-tight text-6xl sm:text-7xl md:text-8xl lg:text-9xl" style={{ filter: "drop-shadow(0 0 60px rgba(103,232,249,0.5))" }}>
            {agentName}
          </h1>
        </motion.div>

        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }} className="text-white text-lg sm:text-xl md:text-2xl font-bold mt-1 sm:mt-0">
          Sales. Support. Conversations. <span className="text-cyan-300">Handled Instantly.</span>
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.8 }} className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/20 bg-white/8 backdrop-blur-sm mt-1 sm:mt-0">
          <span className="w-1.5 h-1.5 shrink-0 bg-green-400 rounded-full animate-pulse" />
          <span className="text-white text-[10px] sm:text-xs font-semibold tracking-widest uppercase">{displayText}</span>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 1 }} className="flex flex-col items-center gap-2 mt-1 sm:mt-0">
          <p className="text-white/60 text-xs font-medium tracking-widest uppercase">Trusted by businesses to handle real customer conversations</p>
          <p className="text-white/40 text-xs">The future of work — human + AI employees.</p>
        </motion.div>
      </main>
    </div>
  );
}
