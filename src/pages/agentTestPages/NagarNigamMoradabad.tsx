"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Orb, oceanDepthsPreset } from "react-ai-orb";

import nagar1 from "./NagarImages/nagar.png";
import nagar2 from "./NagarImages/nagar2.png";
import nagar3 from "./NagarImages/nagar3.png";
import nagar4 from "./NagarImages/nagar4.png";

const BG_IMAGES = [nagar1, nagar2, nagar3, nagar4];

const AI_FEATURES = [
  { icon: "🕐", title: "24/7 उपलब्ध",    titleEn: "Always Available",  desc: "कार्यालय बंद हो या खुला — AI कभी नहीं सोता।" },
  { icon: "📋", title: "तुरंत शिकायत",    titleEn: "Instant Grievance", desc: "सड़क, पानी, सफाई — सेकंडों में दर्ज।" },
  { icon: "💰", title: "कर जानकारी",      titleEn: "Tax Information",   desc: "संपत्ति कर व जल कर की बकाया राशि जानें।" },
  { icon: "📄", title: "प्रमाण पत्र",     titleEn: "Certificates",      desc: "जन्म-मृत्यु प्रमाण पत्र मार्गदर्शन।" },
  { icon: "🏗️", title: "भवन अनुज्ञा",    titleEn: "Building Permit",   desc: "नक्शा पास हेतु दस्तावेज़ व प्रक्रिया।" },
  { icon: "🌐", title: "हिंदी + English", titleEn: "Bilingual Support", desc: "हिंदी या अंग्रेजी — जैसे चाहें बात करें।" },
];

const CITY_STATS = [
  { value: "8.87 लाख", label: "नागरिक" },
  { value: "70",       label: "वार्ड" },
  { value: "75 km²",   label: "क्षेत्रफल" },
  { value: "24/7",     label: "AI सहायक" },
];

const BADGE_PHRASES = [
  "संपत्ति कर · जल कर · ऑनलाइन मार्गदर्शन",
  "शिकायत दर्ज करें · 24/7 उपलब्ध",
  "जन्म-मृत्यु प्रमाण पत्र सेवाएं",
  "भवन अनुज्ञा · नक्शा पास जानकारी",
  "स्वच्छ मोरादाबाद · स्मार्ट सिटी सेवाएं",
];

export default function NagarNigamMoradabad() {
  const { agentId } = useParams<{ agentId: string }>();
  const [searchParams] = useSearchParams();
  void searchParams;

  const agentFetchRef = useRef<string | null>(null);
  const [agentInfo, setAgentInfo] = useState<{ name: string } | null>(null);

  // Background carousel
  const [bgIndex, setBgIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setBgIndex((i) => (i + 1) % BG_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Typewriter badge
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  useEffect(() => {
    const c = setInterval(() => setPhraseIndex((i) => (i + 1) % BADGE_PHRASES.length), 5500);
    return () => clearInterval(c);
  }, []);
  useEffect(() => {
    const phrase = BADGE_PHRASES[phraseIndex];
    setDisplayText("");
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplayText(phrase.slice(0, i));
      if (i >= phrase.length) clearInterval(t);
    }, 52);
    return () => clearInterval(t);
  }, [phraseIndex]);

  useEffect(() => {
    if (!agentId || agentFetchRef.current === agentId) return;
    agentFetchRef.current = agentId;
    fetch(`https://nodejs.service.callshivai.com/api/v1/agent-configs/${agentId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && agentFetchRef.current === agentId)
          setAgentInfo(data?.data?.agent || data);
      })
      .catch(() => {});
    return () => { agentFetchRef.current = null; };
  }, [agentId]);

  const agentName = agentInfo?.name || "नगर सहायक";

  return (
    <div
      className="w-full h-screen overflow-hidden relative flex flex-col"
      style={{ fontFamily: "'Noto Sans Devanagari','Poppins',sans-serif" }}
    >
      {/* ── Background image carousel ── */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence>
          <motion.img
            key={bgIndex}
            src={BG_IMAGES[bgIndex]}
            alt=""
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AnimatePresence>
      </div>

      {/* ── Dark overlay — enough to read text, light enough to see images ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, background: "rgba(4,9,20,0.58)" }} />
      {/* Bottom-up gradient so lower cards stay readable */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, background: "linear-gradient(to top,rgba(4,9,20,0.80) 0%,transparent 55%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, background: "radial-gradient(ellipse at 50% 0%,rgba(249,115,22,0.10) 0%,transparent 55%)" }} />

      {/* Tricolour stripe */}
      <div className="absolute top-0 left-0 right-0 h-[3px] z-30 pointer-events-none" style={{ background: "linear-gradient(90deg,#f97316 33%,#ffffff 33% 66%,#16a34a 66%)" }} aria-hidden="true" />

      {/* ── Top bar ── */}
      <div className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-2.5 shrink-0 border-b" style={{ borderColor: "rgba(249,115,22,0.15)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-white" style={{ boxShadow: "0 0 14px rgba(249,115,22,0.5)" }}>
            <img
              src="https://www.nagarnigammoradabad.in/HOME/assets/images/nnm-logo-98x98.png"
              alt="NNM"
              className="w-9 h-9 object-contain"
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                el.style.display = "none";
                const p = el.parentElement;
                if (p) {
                  p.style.background = "linear-gradient(135deg,#f97316,#dc2626)";
                  const fb = p.querySelector<HTMLElement>(".nnm-fallback");
                  if (fb) fb.style.display = "flex";
                }
              }}
            />
            <span className="nnm-fallback text-white font-black text-[10px] hidden items-center justify-center w-full h-full">NNM</span>
          </div>
          <div className="flex flex-col leading-none gap-0.5">
            <span className="font-black text-sm tracking-tight" style={{ background: "linear-gradient(90deg,#fdba74,#fcd34d,#fb923c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              नगर निगम मोरादाबाद
            </span>
            <span className="text-[9px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.32)" }}>
              Nagar Nigam Moradabad · UP
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>AI Live</span>
        </div>
      </div>

      {/* ── Body: fills remaining height, no scroll ── */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0 px-3 sm:px-6 py-2 gap-2 sm:gap-3">

        {/* Hero row: orb + text */}
        <div className="flex items-center justify-center gap-4 sm:gap-10 flex-1 min-h-0">

          {/* Orb */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative flex items-center justify-center shrink-0"
          >
            <motion.div animate={{ scale: [1,1.3,1], opacity: [0.2,0.38,0.2] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} className="absolute w-28 h-28 sm:w-48 sm:h-48 rounded-full blur-2xl pointer-events-none" style={{ background: "rgba(249,115,22,0.28)" }} />
            <motion.div animate={{ y: [0,-8,0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}>
              <Orb {...oceanDepthsPreset} />
            </motion.div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col gap-1.5 max-w-xs sm:max-w-md"
          >
            <p className="text-[9px] sm:text-[10px] font-semibold tracking-[0.3em] uppercase" style={{ color: "rgba(255,255,255,0.38)" }}>
              उत्तर प्रदेश सरकार · Govt. of UP
            </p>
            <p className="text-xs sm:text-sm font-semibold tracking-wide" style={{ color: "rgba(253,186,116,0.9)" }}>
              आपका AI सेवक · Your AI Employee
            </p>
            <h1 className="font-black leading-none text-3xl sm:text-5xl md:text-6xl" style={{ background: "linear-gradient(180deg,#fff7ed 0%,#fb923c 50%,#ea580c 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 32px rgba(249,115,22,0.5))" }}>
              {agentName}
            </h1>
            <p className="text-xs sm:text-base font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>
              शिकायत करें। जानकारी पाएं।{" "}
              <span style={{ background: "linear-gradient(90deg,#fb923c,#fcd34d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                तुरंत समाधान।
              </span>
            </p>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full w-fit" style={{ border: "1px solid rgba(249,115,22,0.25)", background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}>
              <span className="w-1.5 h-1.5 shrink-0 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[10px] sm:text-xs font-semibold tracking-wide" style={{ color: "rgba(253,186,116,0.85)" }}>{displayText}</span>
            </div>
            <p className="text-[9px] sm:text-[10px]" style={{ color: "rgba(255,255,255,0.28)" }}>
              👇 नीचे दाएं चैट बटन पर क्लिक करें
            </p>
          </motion.div>
        </div>

        {/* ── AI help banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="shrink-0 rounded-xl px-3 py-2.5 flex items-center gap-3"
          style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(249,115,22,0.22)", backdropFilter: "blur(12px)" }}
        >
          <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: "rgba(249,115,22,0.18)" }}>🤖</div>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs font-bold" style={{ color: "rgba(253,186,116,1)" }}>
              AI आपकी कैसे मदद करता है?
            </p>
            <p className="text-[9px] sm:text-[10px] leading-snug" style={{ color: "rgba(255,255,255,0.62)" }}>
              बस माइक बटन दबाएं और बोलें — कर भुगतान, शिकायत, प्रमाण पत्र, नक्शा पास — सब कुछ हिंदी में, 24 घंटे।
            </p>
          </div>
          <div className="shrink-0 hidden sm:flex flex-col items-end gap-1">
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.18)", color: "rgba(134,239,172,1)", border: "1px solid rgba(34,197,94,0.3)" }}>✓ हिंदी</span>
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.18)", color: "rgba(134,239,172,1)", border: "1px solid rgba(34,197,94,0.3)" }}>✓ English</span>
          </div>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2 shrink-0"
        >
          {AI_FEATURES.map((f, i) => (
            <motion.div
              key={f.titleEn}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 + i * 0.06 }}
              className="rounded-lg p-2 sm:p-3 flex flex-col gap-1"
              style={{ background: "rgba(0,0,0,0.50)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}
            >
              <span className="text-base sm:text-lg leading-none">{f.icon}</span>
              <p className="font-bold text-[9px] sm:text-xs leading-tight" style={{ color: "rgba(253,186,116,0.92)" }}>{f.title}</p>
              <p className="text-[8px] sm:text-[9px] leading-snug hidden sm:block" style={{ color: "rgba(255,255,255,0.42)" }}>{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="relative z-20 text-center py-2 shrink-0 border-t" style={{ borderColor: "rgba(249,115,22,0.08)" }}>
        <p className="text-[8px] tracking-wider" style={{ color: "rgba(255,255,255,0.18)" }}>
          Powered by Callshivai.com AI · नगर निगम मोरादाबाद · पीतलनगरी 🏺
        </p>
      </div>
    </div>
  );
}