"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Orb, oceanDepthsPreset } from "react-ai-orb";
import bgNew from "../resources/AiImages/bg22.webp";

interface AgentInfo {
  name: string;
  status: string;
  industry?: string;
  language?: string;
  business_process?: string;
}

export default function AgentPublicPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");

  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);

  // Fetch basic agent info from public endpoint
  useEffect(() => {
    if (!agentId) return;
    const fetchAgent = async () => {
      try {
        const response = await fetch(
          `https://nodejs.service.callshivai.com/api/v1/agent-configs/${agentId}
`,
        );
        if (response.ok) {
          const data = await response.json();
          setAgentInfo(data?.data?.agent || data);
        }
      } catch {
        // Agent info not critical — widget still loads
      }
    };
    fetchAgent();
  }, [agentId]);

  console.log("Loaded agent info:", agentInfo);

  // Append widget2.js script once — window flag survives StrictMode double-invoke
  useEffect(() => {
    if (!agentId) return;
    if ((window as any).__shivaiWidgetInjected) return;
    (window as any).__shivaiWidgetInjected = true;
    const params = new URLSearchParams();
    params.set("agentId", agentId);
    if (userId) params.set("userId", userId);
    const script = document.createElement("script");
    script.src = `/widget2.js?${params.toString()}`;
    script.async = true;
    document.body.appendChild(script);
  }, [agentId, userId]);

  const agentName = agentInfo?.name || "Your AI Employee";

  return (
    <div
      className="min-h-screen w-full relative font-sans overflow-hidden"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      {/* Background */}
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
      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-black/40 pointer-events-none"
        aria-hidden="true"
      />

      {/* Top branding bar */}
      <div className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xs">AI</span>
          </div>
          <span className="text-white/90 text-sm font-semibold tracking-wide">
            callshivai.com
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-white/70 text-xs">Live AI Agent</span>
        </div>
      </div>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 py-10 text-center">
        {/* Orb */}
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

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex flex-col items-center gap-3 max-w-2xl"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-medium backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            AI Employee · Ready to Talk
          </span>

          <h1 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight">
            Talk to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-white to-slate-300">
              {agentName}
            </span>
          </h1>

          <p className="text-white/70 text-sm sm:text-base md:text-lg max-w-lg leading-relaxed">
            Your AI employee is ready. Click the chat button in the bottom-right
            corner to start a conversation.
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-wrap justify-center gap-2 mt-8"
        >
          {[
            "🌐 56+ Languages",
            "⚡ Real-time Voice",
            "🤖 AI Powered",
            "📞 24/7 Available",
          ].map((pill) => (
            <span
              key={pill}
              className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/80 text-xs font-medium backdrop-blur-sm"
            >
              {pill}
            </span>
          ))}
        </motion.div>

        {/* Agent info card (if loaded) */}
        {agentInfo && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-10 bg-white/5 backdrop-blur-md rounded-2xl border border-white/15 px-6 py-5 max-w-sm w-full text-left"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-bold text-base">
                  {agentName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{agentName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400 text-xs font-medium">
                    Live
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
              {agentInfo.industry && (
                <div>
                  <span className="text-white/40 uppercase tracking-wide text-[10px]">
                    Industry
                  </span>
                  <p className="text-white/80 capitalize mt-0.5">
                    {agentInfo.industry.replace(/-/g, " ")}
                  </p>
                </div>
              )}
              {agentInfo.language && (
                <div>
                  <span className="text-white/40 uppercase tracking-wide text-[10px]">
                    Language
                  </span>
                  <p className="text-white/80 mt-0.5">{agentInfo.language}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Arrow hint pointing to widget */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-10 flex flex-col items-center gap-1 text-white/40 text-xs"
        >
          <svg
            className="w-5 h-5 animate-bounce"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 9l-7 7-7-7"
            />
          </svg>
          <span>Click the chat button to begin</span>
        </motion.div>
      </main>

      {/* Footer */}
      <div className="relative z-20 text-center pb-6">
        <p className="text-white/30 text-xs">
          Powered by{" "}
          <a
            href="https://www.callshivai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white/80 transition-colors underline underline-offset-2"
          >
            callshivai.com
          </a>
        </p>
      </div>
    </div>
  );
}
