import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Mail,
  MessageSquare,
  Phone,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import AgentCrmConfigPanel from "../../../components/AgentCrmConfigPanel";
import { getAppById } from "../../../marketplace/apps";
import { SectionTitle, StatusPill } from "../SupportCRM/ui";
import type { AgentStatus } from "../SupportCRM/mockData";
import {
  useAppointmentIndustry,
  APPOINTMENT_INDUSTRY_PRESETS,
  setActiveIndustryId,
  CustomPresetInput,
  readCustomPresetInput,
  saveCustomPreset,
} from "./industryConfig";
import { rebuildOrgFromIndustry, ensureOrgSeeded } from "./orgSeed";
import { useActiveBranch } from "./branchesStore";
import { useAppointmentSetup, writeSetup, isSetupComplete } from "./setupStore";
import { isAppointmentCrmApiMode } from "./api/apiMode";
import SetupModal, { CustomPresetForm } from "./SetupModal";
import BranchSwitcher from "./BranchSwitcher";
import { AppointmentCRMProvider, useAppointmentCRM } from "./AppointmentCRMProvider";
import OverviewView from "./OverviewView";
import BookingsView from "./BookingsView";
import CalendarView from "./CalendarView";
import BranchesView from "./BranchesView";
import CustomersView from "./CustomersView";
import StaffView from "./StaffView";
import ImportedAgentsView from "./ImportedAgentsView";
import { useRealSchedulingAgents } from "./realAgents";

interface Props {
  section?: string;
}

const AppointmentCRM: React.FC<Props> = ({ section = "calendar" }) => (
  <AppointmentCRMProvider>
    <AppointmentCRMContent section={section} />
  </AppointmentCRMProvider>
);

const AppointmentCRMContent: React.FC<Props> = ({ section = "calendar" }) => {
  const [setupOpen, setSetupOpen] = useState(!isSetupComplete());
  // Deep-link from Overview's "open agent" shortcut — jumps to Agents and
  // pre-selects that agent's tab. Agents itself manages tab selection after.
  const [pendingAgentId, setPendingAgentId] = useState<string | null>(null);
  const { branches, activeBranch } = useActiveBranch();
  const { apiReady, bootstrap } = useAppointmentCRM();

  useEffect(() => {
    if (!isAppointmentCrmApiMode() && !apiReady) {
      ensureOrgSeeded(branches);
    }
  }, [branches.length, apiReady]);

  useEffect(() => {
    if (apiReady && bootstrap) {
      setSetupOpen(!bootstrap.setup.setupComplete);
    }
  }, [apiReady, bootstrap?.setup.setupComplete]);

  const handleSetupComplete = () => setSetupOpen(false);
  // Skip only hides the modal for this render — setup is still marked
  // incomplete, so it reappears on the next refresh/visit until finished.
  const handleSetupSkip = () => setSetupOpen(false);

  const openAgent = (agentId: string) => setPendingAgentId(agentId);

  // Overview's "open agent" shortcut jumps straight to the Agents tabs view
  // regardless of the sidebar's current section, pre-selecting that agent.
  if (pendingAgentId && section !== "agents") {
    return (
      <>
        <SetupModal open={setupOpen} onComplete={handleSetupComplete} onSkip={handleSetupSkip} />
        <ImportedAgentsView initialAgentId={pendingAgentId} onInitialHandled={() => setPendingAgentId(null)} />
      </>
    );
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
      content = <ImportedAgentsView initialAgentId={pendingAgentId} onInitialHandled={() => setPendingAgentId(null)} />;
      break;
    case "reminders":
      content = <RemindersView />;
      break;
    case "settings":
      content = <SettingsView onRerunSetup={() => setSetupOpen(true)} />;
      break;
    default:
      content = <OverviewView onOpenAgent={openAgent} />;
  }

  const showBranchBar = section !== "overview" && section !== "settings" && activeBranch;

  return (
    <>
      <SetupModal open={setupOpen} onComplete={handleSetupComplete} onSkip={handleSetupSkip} />
      {showBranchBar && <BranchSwitcher variant="compact" className="mb-3 sm:mb-4" />}
      {content}
    </>
  );
};

/** The agent's full AI configuration surface — rendered inline under its tab
 * in ImportedAgentsView (no separate page/navigation). `onBack` is optional:
 * omit it when embedded in tabs, where switching tabs replaces "Back". */
export const AgentDetail: React.FC<{ agentId: string; onBack?: () => void; onUnassign?: () => void }> = ({ agentId, onBack, onUnassign }) => {
  const { rawAgents } = useRealSchedulingAgents();
  const agent = rawAgents.find((a) => a.id === agentId);

  if (!agent) {
    return (
      <div className="space-y-5">
        {onBack && (
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 font-medium">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading agent…</p>
        </GlassCard>
      </div>
    );
  }

  const status: AgentStatus = agent.status === "Published" ? "available" : "paused";

  return (
    <div className="space-y-5">
      {onBack && (
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white truncate">{agent.name}</h2>
          <StatusPill status={status} pulse />
        </div>
        {onUnassign && (
          <button
            type="button"
            onClick={onUnassign}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" /> Unassign
          </button>
        )}
      </div>
      {appointmentCrmApp && <AgentCrmConfigPanel app={appointmentCrmApp} agent={agent} />}
    </div>
  );
};

const appointmentCrmApp = getAppById("appointment-crm");

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
const emptyCustomInput = (): CustomPresetInput => ({
  customerLabel: "",
  appointmentLabel: "",
  providerLabel: "",
  branchLabel: "",
  services: [""],
  appointmentTypes: [""],
});

const SettingsView: React.FC<{ onRerunSetup: () => void }> = ({ onRerunSetup }) => {
  const setup = useAppointmentSetup();
  const { branches } = useActiveBranch();
  const { preset, activeId } = useAppointmentIndustry();
  const [draftIndustry, setDraftIndustry] = useState(activeId);
  const [dirty, setDirty] = useState(false);
  const [customInput, setCustomInput] = useState<CustomPresetInput>(() => readCustomPresetInput() ?? emptyCustomInput());

  const isCustomValid =
    draftIndustry !== "generic" ||
    (customInput.customerLabel.trim() &&
      customInput.appointmentLabel.trim() &&
      customInput.providerLabel.trim() &&
      customInput.branchLabel.trim() &&
      customInput.services.some((s) => s.trim()));

  const save = () => {
    if (draftIndustry === "generic") saveCustomPreset(customInput);
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

        {draftIndustry === "generic" && (
          <div className="mt-3">
            <CustomPresetForm value={customInput} onChange={setCustomInput} />
          </div>
        )}
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
          <button
            type="button"
            onClick={save}
            disabled={!isCustomValid}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-500 text-white text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default AppointmentCRM;
