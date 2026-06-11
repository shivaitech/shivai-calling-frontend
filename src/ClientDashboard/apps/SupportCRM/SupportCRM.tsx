import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import GlassCard from "../../../components/GlassCard";
import {
  Phone, PhoneCall, Users, CheckCircle2, Clock, Star, ShieldCheck,
  AlertTriangle, Activity, ArrowLeft, Search, ChevronRight, Timer,
  TrendingUp, TrendingDown, Headphones, MessageSquare, Mail, Mic,
  Pause, Play, BarChart3, Inbox, Trophy, Plus, Tag, Trash2, Check, Save, Building2,
  Globe, Settings2, Copy, X,
} from "lucide-react";
import {
  AGENTS, TICKETS, LIVE_CALLS, TEAM_METRICS, getAgent,
  fmtDuration, sentimentMeta, outcomeMeta, priorityMeta, ticketStatusMeta,
  AIAgentEmployee, SupportTicket, Channel,
} from "./mockData";
import { AgentAvatar, StatusPill, StatCard, SectionTitle } from "./ui";
import { Customers } from "./Customers";
import { Departments } from "./Departments";
import { useDepartments } from "./departmentsStore";
import { useAgentChannels, mockNumberFor, webEmbedFor } from "./channelsStore";
import { useIndustry, INDUSTRY_PRESETS, CustomField } from "./industryConfig";

interface Props {
  section?: string;
}

const channelIcon: Record<Channel, React.ElementType> = {
  voice: Phone, chat: MessageSquare, email: Mail, whatsapp: MessageSquare,
};

const SupportCRM: React.FC<Props> = ({ section = "overview" }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Agent detail takes over the surface when an agent is selected
  if (selectedAgentId) {
    const agent = getAgent(selectedAgentId);
    if (agent) return <AgentDetail agent={agent} onBack={() => setSelectedAgentId(null)} />;
  }

  switch (section) {
    case "agents":      return <AgentsRoster onOpen={setSelectedAgentId} />;
    case "departments": return <Departments />;
    case "customers":   return <Customers />;
    case "tickets":     return <TicketsBoard />;
    case "live":        return <LiveActivity onOpen={setSelectedAgentId} />;
    case "reports":     return <Reports />;
    case "settings":    return <SettingsView />;
    default:            return <OverviewDash onOpen={setSelectedAgentId} />;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW — command center
// ─────────────────────────────────────────────────────────────────────────────
const OverviewDash: React.FC<{ onOpen: (id: string) => void }> = ({ onOpen }) => {
  const t = TEAM_METRICS;
  const maxVol = Math.max(...t.hourlyVolume.map((h) => h.calls));
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Command Center"
        subtitle="Live view of your AI support workforce — today"
        right={
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200/70 dark:border-green-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
          </span>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={PhoneCall} color="green" label="Live Calls Now" value={t.liveCalls} sub={`${t.inQueue} in queue · ${t.avgWaitSec}s wait`} subTone="muted" />
        <StatCard icon={Phone} color="blue" label="Calls Handled Today" value={t.callsToday.toLocaleString()} sub="+12% vs yesterday" subTone="up" />
        <StatCard icon={CheckCircle2} color="emerald" label="Resolution Rate" value={`${t.resolutionRate}%`} sub="Auto-resolved by AI" subTone="up" />
        <StatCard icon={Star} color="amber" label="CSAT" value={t.csat} sub="out of 5.0" subTone="muted" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Hourly volume chart */}
        <GlassCard className="xl:col-span-2">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">Call Volume — Today</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">09:00 – 18:00</span>
            </div>
            <div className="flex items-end justify-between gap-2 sm:gap-3 h-40">
              {t.hourlyVolume.map((h) => (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-medium text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">{h.calls}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(h.calls / maxVol) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className="w-full rounded-t-md bg-gradient-to-t from-slate-400 to-slate-600 dark:from-slate-600 dark:to-slate-400 group-hover:from-blue-500 group-hover:to-blue-400 transition-colors min-h-[4px]"
                  />
                  <span className="text-[10px] text-slate-400">{h.hour}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Operational health */}
        <GlassCard>
          <div className="p-4 sm:p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white">Operational Health</h3>
            <HealthRow icon={ShieldCheck} color="emerald" label="SLA Compliance" value={`${t.slaCompliance}%`} bar={t.slaCompliance} />
            <HealthRow icon={Clock} color="blue" label="Avg Handle Time" value={fmtDuration(t.avgHandleSec)} bar={70} />
            <HealthRow icon={Inbox} color="amber" label="Open Tickets" value={`${t.openTickets}`} bar={55} />
            <HealthRow icon={AlertTriangle} color="red" label="SLA Breaches" value={`${t.breachedSla}`} bar={t.breachedSla * 12} warn />
          </div>
        </GlassCard>
      </div>

      {/* Workforce snapshot */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white">AI Workforce</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">{AGENTS.length} agents on shift</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {AGENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => onOpen(a.id)}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all text-left bg-white/50 dark:bg-slate-800/40"
              >
                <AgentAvatar name={a.name} hue={a.avatarHue} status={a.status} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-slate-800 dark:text-white truncate">{a.name}</p>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{a.metrics.callsToday} calls</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{a.role}</p>
                  <div className="mt-1.5"><StatusPill status={a.status} pulse /></div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

const HealthRow: React.FC<{ icon: React.ElementType; color: string; label: string; value: string; bar: number; warn?: boolean }> = ({ icon: Icon, color, label, value, bar, warn }) => {
  const colorCls: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400", blue: "text-blue-600 dark:text-blue-400",
    amber: "text-amber-600 dark:text-amber-400", red: "text-red-600 dark:text-red-400",
  };
  const barCls = warn ? "bg-red-500" : "bg-slate-500 dark:bg-slate-400";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Icon className={`w-4 h-4 ${colorCls[color]}`} /> {label}
        </span>
        <span className="text-sm font-semibold text-slate-800 dark:text-white">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full ${barCls}`} style={{ width: `${Math.min(100, bar)}%` }} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AGENTS ROSTER — employees
// ─────────────────────────────────────────────────────────────────────────────
const AgentsRoster: React.FC<{ onOpen: (id: string) => void }> = ({ onOpen }) => {
  const { terms } = useIndustry();
  const depts = useDepartments();
  const channels = useAgentChannels();
  const [q, setQ] = useState("");
  const list = AGENTS.filter((a) => `${a.name} ${a.role}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-5">
      <SectionTitle
        title={`AI ${terms.agent}s`}
        subtitle={`Your AI workforce — manage them like employees, organised by ${terms.department.toLowerCase()}`}
        right={
          <div className="relative hidden sm:block w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search agents…"
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm common-bg-icons" />
          </div>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((a) => {
          const ch = channels.getChannels(a.id);
          return (
          <GlassCard key={a.id} hover>
            <div className="p-5">
              <div className="flex items-start gap-3">
                <button onClick={() => onOpen(a.id)} className="flex-shrink-0">
                  <AgentAvatar name={a.name} hue={a.avatarHue} status={a.status} size={52} />
                </button>
                <button onClick={() => onOpen(a.id)} className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-800 dark:text-white truncate">{a.name}</p>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{a.role}</p>
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <StatusPill status={a.status} pulse />
                    {(() => {
                      const d = depts.departments.find((x) => x.id === depts.assignments[a.id]);
                      return d ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400">
                          <Building2 className="w-2.5 h-2.5" /> {d.name}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </button>
              </div>

              {a.status === "on-call" && a.liveCustomer && (
                <div className="mt-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200/60 dark:border-green-800/40">
                  <Mic className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-xs text-green-700 dark:text-green-300 truncate">On call · {a.liveCustomer}</span>
                  <span className="text-xs font-mono text-green-600 dark:text-green-400 ml-auto">{fmtDuration(a.liveSinceSec || 0)}</span>
                </div>
              )}

              {/* Channels row: active-channel chips + setup */}
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <ChannelChip active={ch.inbound} icon={PhoneCall} label="Inbound" />
                  <ChannelChip active={ch.web} icon={Globe} label="Web" />
                </div>
                <ChannelSetup agent={a} />
              </div>

              <button onClick={() => onOpen(a.id)} className="w-full grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-left">
                <MiniStat label="Calls" value={a.metrics.callsToday} />
                <MiniStat label="AHT" value={fmtDuration(a.metrics.avgHandleSec)} />
                <MiniStat label="CSAT" value={a.metrics.csat.toFixed(1)} />
              </button>
            </div>
          </GlassCard>
          );
        })}
      </div>
    </div>
  );
};

const MiniStat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="text-center">
    <p className="text-sm font-bold text-slate-800 dark:text-white">{value}</p>
    <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
  </div>
);

// Small chip showing whether a channel is active for the agent.
const ChannelChip: React.FC<{ active: boolean; icon: React.ElementType; label: string }> = ({ active, icon: Icon, label }) => (
  <span
    title={`${label}: ${active ? "On" : "Off"}`}
    className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
      active
        ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/70 dark:border-emerald-800/50"
        : "text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
    }`}
  >
    <Icon className="w-2.5 h-2.5" /> {label}
  </span>
);

// Per-agent channel setup popover: toggle Inbound Call / Web Integration and
// reveal the mock number / embed snippet for each.
const ChannelSetup: React.FC<{ agent: AIAgentEmployee }> = ({ agent }) => {
  const channels = useAgentChannels();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const ch = channels.getChannels(agent.id);

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium common-bg-icons"
      >
        <Settings2 className="w-3.5 h-3.5" /> Setup
      </button>

      {open && (
        <>
          {/* click-outside backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-800 dark:text-white">Channels · {agent.name}</p>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">Let this agent work over phone, web, or both.</p>

            {/* Inbound Call */}
            <ChannelRow
              icon={PhoneCall}
              title="Inbound Call"
              desc="Answers calls to a phone number"
              on={ch.inbound}
              onToggle={(v) => channels.setChannel(agent.id, "inbound", v)}
            >
              <div className="flex items-center gap-2">
                <code className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                  {mockNumberFor(agent.id)}
                </code>
                <button onClick={() => copy(mockNumberFor(agent.id), "num")} className="common-button-bg2 !p-2 rounded-lg">
                  {copied === "num" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </ChannelRow>

            {/* Web Integration */}
            <ChannelRow
              icon={Globe}
              title="Web Integration"
              desc="Chat/call widget on your website"
              on={ch.web}
              onToggle={(v) => channels.setChannel(agent.id, "web", v)}
            >
              <div className="space-y-1.5">
                <code className="block px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-[10px] leading-relaxed text-slate-600 dark:text-slate-300 break-all">
                  {webEmbedFor(agent.id)}
                </code>
                <button onClick={() => copy(webEmbedFor(agent.id), "embed")} className="common-button-bg2 inline-flex items-center gap-1.5 !px-2.5 !py-1.5 rounded-lg text-xs">
                  {copied === "embed" ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy embed</>}
                </button>
              </div>
            </ChannelRow>
          </div>
        </>
      )}
    </div>
  );
};

const ChannelRow: React.FC<{
  icon: React.ElementType;
  title: string;
  desc: string;
  on: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}> = ({ icon: Icon, title, desc, on, onToggle, children }) => (
  <div className="py-2.5 border-t border-slate-100 dark:border-slate-700/60 first:border-t-0">
    <div className="flex items-center gap-2.5">
      <span className="w-8 h-8 rounded-lg common-bg-icons flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-white">{title}</p>
        <p className="text-[11px] text-slate-400">{desc}</p>
      </div>
      <Toggle on={on} onChange={onToggle} />
    </div>
    {on && <div className="mt-2.5 pl-10">{children}</div>}
  </div>
);

const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void }> = ({ on, onChange }) => (
  <button
    onClick={() => onChange(!on)}
    role="switch"
    aria-checked={on}
    className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${on ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : ""}`} />
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// AGENT DETAIL — full work history
// ─────────────────────────────────────────────────────────────────────────────
const AgentDetail: React.FC<{ agent: AIAgentEmployee; onBack: () => void }> = ({ agent, onBack }) => {
  const { terms } = useIndustry();
  const depts = useDepartments();
  const currentDept = depts.departments.find((d) => d.id === depts.assignments[agent.id]);
  const maxShift = Math.max(...agent.todayShift.map((s) => s.calls));
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> All agents
      </button>

      {/* Header */}
      <GlassCard>
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <AgentAvatar name={agent.name} hue={agent.avatarHue} status={agent.status} size={64} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{agent.name}</h2>
                <StatusPill status={agent.status} pulse />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{agent.role} · {agent.languages.join(", ")}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Building2 className="w-3.5 h-3.5" /> {terms.department}:
                </span>
                <div className="relative">
                  <select
                    value={currentDept?.id || ""}
                    onChange={(e) => depts.assignAgent(agent.id, e.target.value)}
                    className="appearance-none text-xs font-medium pl-2.5 pr-7 py-1 rounded-full common-bg-icons cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {depts.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 rotate-90 pointer-events-none" />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">{agent.hiredOn} · Shift {agent.shiftStart}–{agent.shiftEnd}</p>
            </div>
            <div className="flex gap-2">
              <ChannelSetup agent={agent} />
              <button className="common-button-bg2 flex items-center gap-1.5 !px-3 !py-2 rounded-lg text-sm">
                {agent.status === "paused" ? <><Play className="w-4 h-4" /> Resume</> : <><Pause className="w-4 h-4" /> Pause</>}
              </button>
            </div>
          </div>

          {agent.status === "on-call" && agent.liveCustomer && (
            <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200/60 dark:border-green-800/40">
              <span className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-800/40 flex items-center justify-center flex-shrink-0">
                <Mic className="w-4 h-4 text-green-600 dark:text-green-400" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">Live call · {agent.liveCustomer}</p>
                <p className="text-xs text-green-600 dark:text-green-400">{agent.recentCalls[0]?.topic}</p>
              </div>
              <span className="font-mono text-sm font-semibold text-green-700 dark:text-green-400">{fmtDuration(agent.liveSinceSec || 0)}</span>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Performance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Phone} color="blue" label="Calls Today" value={agent.metrics.callsToday} sub={`${agent.metrics.callsHandledTotal.toLocaleString()} all-time`} subTone="muted" />
        <StatCard icon={CheckCircle2} color="emerald" label="Resolution Rate" value={`${agent.metrics.resolutionRate}%`} />
        <StatCard icon={Star} color="amber" label="CSAT" value={agent.metrics.csat.toFixed(1)} sub="out of 5.0" subTone="muted" />
        <StatCard icon={ShieldCheck} color="purple" label="SLA Compliance" value={`${agent.metrics.slaCompliance}%`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Shift timeline */}
        <GlassCard>
          <div className="p-4 sm:p-6">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4">Today's Shift</h3>
            <div className="space-y-3">
              {agent.todayShift.map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{s.label}</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{s.calls} calls · {s.talkMinutes}m</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(s.calls / maxShift) * 100}%` }} transition={{ duration: 0.4 }}
                      className="h-full rounded-full bg-gradient-to-r from-slate-400 to-slate-600 dark:from-slate-500 dark:to-slate-300" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Activity className="w-4 h-4" /> Occupancy</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-white">{agent.metrics.occupancy}%</span>
            </div>
          </div>
        </GlassCard>

        {/* Work history — call log */}
        <GlassCard className="xl:col-span-2">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">Work History — Call Log</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">Today</span>
            </div>
            <div className="space-y-2">
              {agent.recentCalls.map((c) => {
                const out = outcomeMeta(c.outcome);
                const sent = sentimentMeta(c.sentiment);
                return (
                  <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <span className="w-9 h-9 rounded-lg common-bg-icons flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{c.customer}</p>
                        <span className="text-xs text-slate-400 flex-shrink-0">{c.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{c.summary}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{c.topic}</span>
                        <span className={`text-[11px] font-medium ${out.cls}`}>● {out.label}</span>
                        <span className={`text-[11px] ${sent.cls}`}>{sent.label}</span>
                        <span className="text-[11px] text-slate-400 ml-auto font-mono">{fmtDuration(c.durationSec)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TICKETS BOARD
// ─────────────────────────────────────────────────────────────────────────────
const TicketsBoard: React.FC = () => {
  const { terms } = useIndustry();
  const [filter, setFilter] = useState<string>("all");
  const filters = ["all", "open", "in-progress", "pending", "resolved"];
  const list = TICKETS.filter((t) => filter === "all" || t.status === filter);
  return (
    <div className="space-y-5">
      <SectionTitle title={`Inquiries & ${terms.tickets}`} subtitle={`Every ${terms.customer.toLowerCase()} inquiry, auto-logged and tracked to resolution`} />
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = filter === f;
          const count = f === "all" ? TICKETS.length : TICKETS.filter((t) => t.status === f).length;
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all capitalize ${
                active ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}>
              {f.replace("-", " ")} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      <GlassCard>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {list.map((t) => <TicketRow key={t.id} ticket={t} />)}
          {list.length === 0 && <div className="p-10 text-center text-sm text-slate-400">No tickets in this view.</div>}
        </div>
      </GlassCard>
    </div>
  );
};

const TicketRow: React.FC<{ ticket: SupportTicket }> = ({ ticket: t }) => {
  const agent = getAgent(t.assignedAgentId);
  const pr = priorityMeta(t.priority);
  const st = ticketStatusMeta(t.status);
  const ChIcon = channelIcon[t.channel];
  const breached = t.slaMinutesLeft < 0;
  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
      <span className="w-9 h-9 rounded-lg common-bg-icons flex items-center justify-center flex-shrink-0">
        <ChIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{t.subject}</p>
          <span className="text-[11px] text-slate-400 font-mono flex-shrink-0">{t.id}</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{t.lastMessage}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-slate-500 dark:text-slate-400">{t.customer}</span>
          {agent && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              · <AgentAvatar name={agent.name} hue={agent.avatarHue} size={16} /> {agent.name}
            </span>
          )}
        </div>
      </div>
      <div className="hidden sm:flex flex-col items-end gap-1.5 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${pr.cls}`}>{pr.label}</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${st.cls}`}>{st.label}</span>
        </div>
        <span className={`flex items-center gap-1 text-[11px] font-medium ${breached ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
          <Timer className="w-3 h-3" />
          {breached ? `SLA breached ${Math.abs(t.slaMinutesLeft)}m` : t.slaMinutesLeft === 0 ? "Met" : `${t.slaMinutesLeft}m left`}
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LIVE ACTIVITY
// ─────────────────────────────────────────────────────────────────────────────
const LiveActivity: React.FC<{ onOpen: (id: string) => void }> = ({ onOpen }) => {
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Live Activity"
        subtitle="Calls happening right now across your AI workforce"
        right={
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200/70 dark:border-green-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> {LIVE_CALLS.length} live
          </span>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={PhoneCall} color="green" label="On Call" value={LIVE_CALLS.length} />
        <StatCard icon={Users} color="blue" label="Available" value={AGENTS.filter((a) => a.status === "available").length} />
        <StatCard icon={Inbox} color="amber" label="In Queue" value={TEAM_METRICS.inQueue} sub={`${TEAM_METRICS.avgWaitSec}s avg wait`} subTone="muted" />
        <StatCard icon={Clock} color="purple" label="Avg Handle" value={fmtDuration(TEAM_METRICS.avgHandleSec)} />
      </div>

      <GlassCard>
        <div className="p-4 sm:p-6">
          <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4">Calls In Progress</h3>
          {LIVE_CALLS.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">No live calls right now.</div>
          ) : (
            <div className="space-y-3">
              {LIVE_CALLS.map((c) => {
                const agent = getAgent(c.agentId)!;
                return (
                  <div key={c.id} className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl border border-green-200/60 dark:border-green-800/40 bg-green-50/50 dark:bg-green-900/10">
                    <button onClick={() => onOpen(agent.id)}><AgentAvatar name={agent.name} hue={agent.avatarHue} status="on-call" size={44} /></button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{agent.name}</p>
                        <span className="text-xs text-slate-400">→</span>
                        <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{c.customer}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">{c.topic}</span>
                        <span className="text-xs text-slate-400">{c.phone}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="hidden sm:flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
                      </span>
                      <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">{fmtDuration(c.elapsedSec)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────────────────────
const Reports: React.FC = () => {
  const ranked = [...AGENTS].sort((a, b) => b.metrics.csat - a.metrics.csat);
  const t = TEAM_METRICS;
  return (
    <div className="space-y-5">
      <SectionTitle title="Performance & Reports" subtitle="Team analytics for your AI support workforce" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Phone} color="blue" label="Total Calls Today" value={t.callsToday.toLocaleString()} sub="+12% vs yesterday" subTone="up" />
        <StatCard icon={CheckCircle2} color="emerald" label="Resolution Rate" value={`${t.resolutionRate}%`} sub="+3% this week" subTone="up" />
        <StatCard icon={Star} color="amber" label="Avg CSAT" value={t.csat} sub="+0.2 this week" subTone="up" />
        <StatCard icon={ShieldCheck} color="purple" label="SLA Compliance" value={`${t.slaCompliance}%`} sub="-1% this week" subTone="down" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Leaderboard */}
        <GlassCard>
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">Agent Leaderboard</h3>
            </div>
            <div className="space-y-2">
              {ranked.map((a, i) => (
                <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <span className={`w-6 text-center text-sm font-bold ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-orange-400" : "text-slate-300 dark:text-slate-600"}`}>{i + 1}</span>
                  <AgentAvatar name={a.name} hue={a.avatarHue} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{a.name}</p>
                    <p className="text-xs text-slate-400 truncate">{a.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> {a.metrics.csat.toFixed(1)}</p>
                    <p className="text-[11px] text-slate-400">{a.metrics.callsToday} calls</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Outcome breakdown + AI impact */}
        <div className="space-y-4">
          <GlassCard>
            <div className="p-4 sm:p-6">
              <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4">Resolution Breakdown</h3>
              {[
                { label: "Auto-resolved by AI", pct: 71, cls: "bg-emerald-500" },
                { label: "Escalated to human", pct: 14, cls: "bg-orange-500" },
                { label: "Callback scheduled", pct: 9, cls: "bg-blue-500" },
                { label: "Transferred", pct: 6, cls: "bg-violet-500" },
              ].map((r) => (
                <div key={r.label} className="mb-3 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-300">{r.label}</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">{r.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div className={`h-full rounded-full ${r.cls}`} style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <Headphones className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h3 className="text-base font-semibold text-slate-800 dark:text-white">AI Impact</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ImpactBox icon={TrendingUp} value="71%" label="Calls handled without a human" tone="up" />
                <ImpactBox icon={Clock} value="≈ 312h" label="Agent-hours saved today" tone="up" />
                <ImpactBox icon={Phone} value="24/7" label="Coverage, no overtime" tone="muted" />
                <ImpactBox icon={TrendingDown} value="-38%" label="Cost per resolved call" tone="up" />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

const ImpactBox: React.FC<{ icon: React.ElementType; value: string; label: string; tone: "up" | "muted" }> = ({ icon: Icon, value, label, tone }) => (
  <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30">
    <Icon className={`w-4 h-4 mb-1.5 ${tone === "up" ? "text-emerald-500" : "text-slate-400"}`} />
    <p className="text-lg font-bold text-slate-800 dark:text-white">{value}</p>
    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{label}</p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS — industry preset + custom fields (makes the CRM dynamic per vertical)
// ─────────────────────────────────────────────────────────────────────────────
const SettingsView: React.FC = () => {
  const { activeId, setIndustry, customFields, saveCustomFields } = useIndustry();
  const [adding, setAdding] = useState(false);
  const [newField, setNewField] = useState<CustomField>({ key: "", label: "", type: "text" });

  // Staged (draft) state — changes only persist when the user clicks Save.
  const [draftIndustry, setDraftIndustry] = useState(activeId);
  const [draftFields, setDraftFields] = useState<CustomField[]>(customFields);
  const [savedFlash, setSavedFlash] = useState(false);

  // Keep the draft in sync if the underlying saved values change elsewhere.
  useEffect(() => { setDraftIndustry(activeId); }, [activeId]);
  useEffect(() => { setDraftFields(customFields); /* eslint-disable-next-line */ }, [customFields.length]);

  // Preview reflects the DRAFT industry, not the saved one.
  const draftPreset = INDUSTRY_PRESETS.find((p) => p.id === draftIndustry) || INDUSTRY_PRESETS[0];
  const terms = draftPreset.terms;
  const categories = draftPreset.categories;

  const dirty =
    draftIndustry !== activeId ||
    JSON.stringify(draftFields) !== JSON.stringify(customFields);

  const addField = () => {
    const label = newField.label.trim();
    if (label.length < 2) return;
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    setDraftFields((prev) => [...prev, { ...newField, label, key }]);
    setNewField({ key: "", label: "", type: "text" });
    setAdding(false);
  };
  const removeField = (key: string) => setDraftFields((prev) => prev.filter((f) => f.key !== key));

  const handleSave = () => {
    setIndustry(draftIndustry);
    saveCustomFields(draftFields);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };
  const handleDiscard = () => {
    setDraftIndustry(activeId);
    setDraftFields(customFields);
    setAdding(false);
    setNewField({ key: "", label: "", type: "text" });
  };

  return (
    <div className="space-y-5 max-w-3xl pb-24">
      <SectionTitle title="Setup & Configuration" subtitle="Tailor this CRM to your industry — terminology, categories & fields" />

      {/* Industry preset */}
      <GlassCard>
        <div className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-1">Industry</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Pick the preset closest to your business. It sets the right terminology and categories everywhere.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {INDUSTRY_PRESETS.map((p) => {
              const active = p.id === draftIndustry;
              return (
                <button key={p.id} onClick={() => setDraftIndustry(p.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${active ? "common-bg-icons border-slate-300 dark:border-slate-500 ring-2 ring-slate-300/50 dark:ring-slate-600/50" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{p.name}</p>
                    {active && <Check className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{p.tagline}</p>
                </button>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* Draft terminology + categories preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <GlassCard>
          <div className="p-5 sm:p-6">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-3">Terminology</h3>
            <div className="space-y-2 text-sm">
              <TermRow label="Customers called" value={terms.customers} />
              <TermRow label="Tickets called" value={terms.tickets} />
              <TermRow label="Agents called" value={terms.agent} />
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="p-5 sm:p-6">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-3">{terms.ticket} Categories</h3>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <span key={c} className="text-[11px] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">{c}</span>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Custom fields */}
      <GlassCard>
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white">Fields</h3>
            {!adding && (
              <button onClick={() => setAdding(true)} className="common-button-bg2 flex items-center gap-1.5 !px-3 !py-1.5 rounded-lg text-xs">
                <Plus className="w-3.5 h-3.5" /> Add custom field
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Default fields come from your industry. Add your own to capture anything specific.</p>

          {/* Default fields */}
          <div className="space-y-2">
            {draftPreset.defaultFields.map((f) => (
              <div key={f.key} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <span className="w-8 h-8 rounded-lg common-bg-icons flex items-center justify-center flex-shrink-0">
                  <Tag className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{f.label}</p>
                  <p className="text-[11px] text-slate-400 capitalize">{f.type}{f.required ? " · required" : ""}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400">Default</span>
              </div>
            ))}
            {draftFields.map((f) => (
              <div key={f.key} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-600">
                <span className="w-8 h-8 rounded-lg common-bg-icons flex items-center justify-center flex-shrink-0">
                  <Tag className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{f.label}</p>
                  <p className="text-[11px] text-slate-400 capitalize">{f.type}</p>
                </div>
                <button onClick={() => removeField(f.key)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {draftFields.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-2">No custom fields yet — add one above.</p>
            )}
          </div>

          {/* Add custom field form */}
          {adding && (
            <div className="mt-3 p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                <input autoFocus value={newField.label} onChange={(e) => setNewField((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Field name (e.g. Account Number)" className="px-3 py-2 rounded-lg text-sm common-bg-icons" />
                <select value={newField.type} onChange={(e) => setNewField((f) => ({ ...f, type: e.target.value as CustomField["type"] }))}
                  className="px-3 py-2 rounded-lg text-sm common-bg-icons">
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="date">Date</option>
                  <option value="select">Dropdown</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-2.5">
                <button onClick={() => { setAdding(false); setNewField({ key: "", label: "", type: "text" }); }} className="common-button-bg2 !px-3 !py-1.5 rounded-lg text-xs">Cancel</button>
                <button onClick={addField} disabled={newField.label.trim().length < 2} className="common-button-bg !px-3 !py-1.5 rounded-lg text-xs disabled:opacity-50">Add field</button>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Other config (preview) */}
      <GlassCard>
        <div className="p-5 sm:p-6 space-y-3">
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">Operations</h3>
          {[
            { icon: BarChart3, label: "SLA targets", desc: "First-response and resolution time goals" },
            { icon: Users, label: "Escalation rules", desc: `When the AI should hand off to a human ${terms.agent.toLowerCase()}` },
            { icon: MessageSquare, label: "Channels", desc: "Voice, chat, email & WhatsApp routing" },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <span className="w-10 h-10 rounded-xl common-bg-icons flex items-center justify-center flex-shrink-0">
                <row.icon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-white">{row.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{row.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Inline action row (always visible at the end of the form) */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-xs text-slate-400">
          {dirty ? "You have unsaved changes." : savedFlash ? "All changes saved." : "Everything is up to date."}
        </p>
        <div className="flex items-center gap-2">
          {dirty && (
            <button onClick={handleDiscard} className="common-button-bg2 !px-4 !py-2 rounded-lg text-sm">Discard</button>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty}
            className="common-button-bg flex items-center gap-1.5 !px-5 !py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savedFlash ? <><Check className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save changes</>}
          </button>
        </div>
      </div>

      {/* Sticky save bar — appears only when there are unsaved changes */}
      {dirty && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 lg:left-auto lg:right-6 lg:translate-x-0 z-40 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-2xl"
        >
          <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Unsaved changes
          </span>
          <button onClick={handleDiscard} className="common-button-bg2 !px-3 !py-1.5 rounded-lg text-xs">Discard</button>
          <button onClick={handleSave} className="common-button-bg flex items-center gap-1.5 !px-4 !py-1.5 rounded-lg text-xs">
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </motion.div>
      )}
    </div>
  );
};

const TermRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
    <span className="font-semibold text-slate-800 dark:text-white">{value}</span>
  </div>
);

export default SupportCRM;
