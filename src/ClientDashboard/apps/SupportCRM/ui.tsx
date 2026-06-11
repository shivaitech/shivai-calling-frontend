import React from "react";
import GlassCard from "../../../components/GlassCard";
import { AgentStatus, statusMeta } from "./mockData";

/**
 * Shared, ShivAI-themed UI atoms for the control CRMs.
 * Kept generic so Lead/Campaign CRMs can reuse them.
 */

// ── Generated agent avatar (initial on a soft hue tile) ──────────────────────
export const AgentAvatar: React.FC<{
  name: string;
  hue: number;
  size?: number;
  status?: AgentStatus;
}> = ({ name, hue, size = 40, status }) => {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-xl flex items-center justify-center font-semibold text-white"
        style={{
          background: `linear-gradient(135deg, hsl(${hue},70%,55%), hsl(${hue + 25},65%,45%))`,
          fontSize: size * 0.42,
        }}
      >
        {initial}
      </div>
      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-white dark:ring-slate-800 ${statusMeta(status).dot}`}
          style={{ width: size * 0.3, height: size * 0.3 }}
        />
      )}
    </div>
  );
};

// ── Status pill ──────────────────────────────────────────────────────────────
export const StatusPill: React.FC<{ status: AgentStatus; pulse?: boolean }> = ({ status, pulse }) => {
  const m = statusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot} ${pulse && status === "on-call" ? "animate-pulse" : ""}`} />
      {m.label}
    </span>
  );
};

// ── KPI stat card — mirrors the dashboard Overview stat cards ────────────────
export const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: string;
  subTone?: "up" | "down" | "muted" | "warn";
  color?: "blue" | "green" | "emerald" | "purple" | "amber" | "red" | "sky";
}> = ({ icon: Icon, label, value, sub, subTone = "muted", color = "blue" }) => {
  const iconColor: Record<string, string> = {
    blue: "text-blue-600 dark:text-blue-400",
    green: "text-green-600 dark:text-green-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    purple: "text-purple-600 dark:text-purple-400",
    amber: "text-amber-600 dark:text-amber-400",
    red: "text-red-600 dark:text-red-400",
    sky: "text-sky-600 dark:text-sky-400",
  };
  const subColor =
    subTone === "up" ? "text-green-600 dark:text-green-400"
    : subTone === "down" ? "text-red-600 dark:text-red-400"
    : subTone === "warn" ? "text-amber-600 dark:text-amber-400"
    : "text-slate-500 dark:text-slate-400";
  return (
    <GlassCard hover>
      <div className="p-3 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 sm:p-2.5 rounded-xl common-bg-icons">
            <Icon className={`w-4 sm:w-5 h-4 sm:h-5 ${iconColor[color]}`} />
          </div>
        </div>
        <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white leading-tight">{value}</p>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">{label}</p>
        {sub && <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>}
      </div>
    </GlassCard>
  );
};

// ── Section heading ──────────────────────────────────────────────────────────
export const SectionTitle: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode }> = ({ title, subtitle, right }) => (
  <div className="flex items-end justify-between gap-4 mb-4">
    <div>
      <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
      {subtitle && <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
    {right}
  </div>
);
