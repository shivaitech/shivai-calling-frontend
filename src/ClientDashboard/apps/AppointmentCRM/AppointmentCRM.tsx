import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Check,
  Mail,
  MessageSquare,
  Phone,
  Save,
  Settings2,
} from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import { AgentAvatar, SectionTitle, StatusPill, StatCard } from "../SupportCRM/ui";
import { useAppointmentIndustry, APPOINTMENT_INDUSTRY_PRESETS, setActiveIndustryId } from "./industryConfig";
import { rebuildOrgFromIndustry, useEnsureOrgSeeded } from "./orgSeed";
import { useActiveBranch } from "./branchesStore";
import { useAppointmentSetup, writeSetup, isSetupComplete } from "./setupStore";
import SetupModal from "./SetupModal";
import BranchSwitcher from "./BranchSwitcher";
import OverviewView from "./OverviewView";
import BookingsView from "./BookingsView";
import CalendarView from "./CalendarView";
import BranchesView from "./BranchesView";
import CustomersView from "./CustomersView";
import StaffView from "./StaffView";
import { SCHEDULING_AGENTS, getSchedulingAgent } from "./mockData";

interface Props {
  section?: string;
}

const AppointmentCRM: React.FC<Props> = ({ section = "calendar" }) => {
  const [setupOpen, setSetupOpen] = useState(!isSetupComplete());
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const { branches, activeBranch } = useActiveBranch();
  useEnsureOrgSeeded(branches);

  const handleSetupComplete = () => setSetupOpen(false);

  if (selectedAgentId) {
    const agent = getSchedulingAgent(selectedAgentId);
    if (agent) {
      return (
        <>
          <SetupModal open={setupOpen} onComplete={handleSetupComplete} />
          <AgentDetail agent={agent} onBack={() => setSelectedAgentId(null)} />
        </>
      );
    }
  }

  let content: React.ReactNode;
  switch (section) {
    case "calendar":
      content = <CalendarView />;
      break;
    case "bookings":
      content = <BookingsView />;
      break;
    case "branches":
      content = <BranchesView />;
      break;
    case "staff":
      content = <StaffView />;
      break;
    case "customers":
      content = <CustomersView />;
      break;
    case "agents":
      content = <AgentsView onOpen={setSelectedAgentId} />;
      break;
    case "reminders":
      content = <RemindersView />;
      break;
    case "settings":
      content = <SettingsView onRerunSetup={() => setSetupOpen(true)} />;
      break;
    default:
      content = <OverviewView onOpenAgent={setSelectedAgentId} />;
  }

  const showBranchBar = section !== "overview" && section !== "settings" && activeBranch;

  return (
    <>
      <SetupModal open={setupOpen} onComplete={handleSetupComplete} />
      {showBranchBar && <BranchSwitcher variant="compact" className="mb-4" />}
      {content}
    </>
  );
};

// ── AI Agents ────────────────────────────────────────────────────────────────
const AgentsView: React.FC<{ onOpen: (id: string) => void }> = ({ onOpen }) => {
  const { terms } = useAppointmentIndustry();
  return (
    <div className="space-y-5">
      <SectionTitle
        title={`AI ${terms.agent}s`}
        subtitle="Voice & chat agents that book, reschedule, and confirm appointments 24/7"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SCHEDULING_AGENTS.map((a) => (
          <GlassCard key={a.id} hover>
            <button type="button" onClick={() => onOpen(a.id)} className="w-full p-5 text-left">
              <div className="flex items-start gap-3">
                <AgentAvatar name={a.name} hue={a.avatarHue} status={a.status} size={52} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 dark:text-white">{a.name}</p>
                  <p className="text-xs text-slate-500">{a.role}</p>
                  <div className="mt-2"><StatusPill status={a.status} pulse /></div>
                  <p className="text-[11px] text-slate-400 mt-2">{a.bookingsToday} bookings today</p>
                </div>
              </div>
            </button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

const AgentDetail: React.FC<{ agent: (typeof SCHEDULING_AGENTS)[0]; onBack: () => void }> = ({ agent, onBack }) => {
  const { terms } = useAppointmentIndustry();
  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 font-medium">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <GlassCard>
        <div className="p-6 flex flex-col sm:flex-row gap-6">
          <AgentAvatar name={agent.name} hue={agent.avatarHue} status={agent.status} size={72} />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{agent.name}</h2>
            <p className="text-sm text-slate-500">{agent.role}</p>
            <div className="mt-2"><StatusPill status={agent.status} pulse /></div>
            <p className="text-xs text-slate-400 mt-3">Languages: {agent.languages.join(", ")}</p>
          </div>
        </div>
      </GlassCard>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Phone} color="purple" label={`${terms.appointments} Today`} value={agent.bookingsToday} />
        <StatCard icon={Check} color="emerald" label="No-show Rate" value={`${agent.noShowRate}%`} subTone="down" />
        <StatCard icon={Bell} color="amber" label="Reminders Sent" value="41" sub="Today" />
      </div>
    </div>
  );
};

// ── Reminders ────────────────────────────────────────────────────────────────
const RemindersView = () => {
  const { preset, terms } = useAppointmentIndustry();
  const rules = [
    { id: "r1", name: "24h confirmation", channel: "voice", timing: "24 hours before", active: true },
    { id: "r2", name: "2h SMS reminder", channel: "sms", timing: "2 hours before", active: true },
    { id: "r3", name: "Same-day WhatsApp", channel: "whatsapp", timing: "Morning of appointment", active: preset.reminderChannels.includes("whatsapp") },
    { id: "r4", name: "No-show follow-up", channel: "voice", timing: "30 min after missed slot", active: true },
  ];

  const channelIcon: Record<string, React.ElementType> = {
    voice: Phone,
    sms: MessageSquare,
    email: Mail,
    whatsapp: MessageSquare,
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Reminders & Confirmations"
        subtitle="Reduce no-shows with automated voice, SMS & messaging"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((r) => {
          const Icon = channelIcon[r.channel] ?? Bell;
          return (
            <GlassCard key={r.id}>
              <div className="p-5 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.active ? "bg-violet-50 dark:bg-violet-900/30 text-violet-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-800 dark:text-white">{r.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${r.active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-slate-100 text-slate-500"}`}>
                      {r.active ? "Active" : "Off"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{r.timing}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Channel: {r.channel}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">
        Reminders reference your {terms.appointment.toLowerCase()} types and {terms.branch.toLowerCase()} hours automatically.
      </p>
    </div>
  );
};

// ── Settings ───────────────────────────────────────────────────────────────────
const SettingsView: React.FC<{ onRerunSetup: () => void }> = ({ onRerunSetup }) => {
  const setup = useAppointmentSetup();
  const { branches } = useActiveBranch();
  const { preset, activeId } = useAppointmentIndustry();
  const [draftIndustry, setDraftIndustry] = useState(activeId);
  const [dirty, setDirty] = useState(false);

  const save = () => {
    setActiveIndustryId(draftIndustry);
    writeSetup({ industryId: draftIndustry });
    if (draftIndustry !== activeId) {
      rebuildOrgFromIndustry(branches);
    }
    setDirty(false);
  };

  return (
    <div className="space-y-5 pb-20">
      <SectionTitle
        title="Setup & Industry"
        subtitle="Organization profile, terminology & booking templates"
        right={
          <button
            type="button"
            onClick={onRerunSetup}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium common-button-bg2"
          >
            <Settings2 className="w-3.5 h-3.5" /> Run setup wizard
          </button>
        }
      />

      <GlassCard>
        <div className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Organization</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-500 text-xs">Company</dt>
              <dd className="font-medium text-slate-800 dark:text-white">{setup.companyName || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500 text-xs">Branches</dt>
              <dd className="font-medium text-slate-800 dark:text-white capitalize">{setup.branchMode}</dd>
            </div>
            <div>
              <dt className="text-slate-500 text-xs">Timezone</dt>
              <dd className="font-medium text-slate-800 dark:text-white">{setup.timezone}</dd>
            </div>
            <div>
              <dt className="text-slate-500 text-xs">Slot duration</dt>
              <dd className="font-medium text-slate-800 dark:text-white">{preset.slotDurationMin} min</dd>
            </div>
          </dl>
        </div>
      </GlassCard>

      <div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Industry template</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {APPOINTMENT_INDUSTRY_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setDraftIndustry(p.id);
                setDirty(p.id !== activeId);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                draftIndustry === p.id
                  ? "border-violet-400 bg-violet-50 dark:bg-violet-900/25 ring-1 ring-violet-500/30"
                  : "border-slate-200 dark:border-slate-700 common-bg-icons hover:border-slate-300"
              }`}
            >
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{p.name}</p>
              <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{p.tagline}</p>
            </button>
          ))}
        </div>
      </div>

      <GlassCard>
        <div className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">Terminology preview</h3>
          <p className="text-xs text-slate-500">
            {preset.terms.customer} · {preset.terms.appointment} · {preset.terms.provider} · {preset.terms.branch}
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            {preset.appointmentTypes.slice(0, 4).join(" · ")}…
          </p>
        </div>
      </GlassCard>

      {dirty && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl"
        >
          <span className="text-sm font-medium">Unsaved industry change</span>
          <button type="button" onClick={() => { setDraftIndustry(activeId); setDirty(false); }} className="text-sm opacity-80 hover:opacity-100">
            Discard
          </button>
          <button type="button" onClick={save} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-500 text-white text-sm font-medium">
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default AppointmentCRM;
