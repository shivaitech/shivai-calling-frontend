import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Bot,
  Building2,
  Check,
  Layers,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Save,
  Search,
  Settings2,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import { SectionTitle, StatusPill, StatCard } from "../SupportCRM/ui";
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
import { useImportedAgents } from "./importedAgents";
import { formatAgentLanguages } from "../../../lib/utils";
import { useAgentStaffAssignments } from "./agentStaffAssignments";
import { useCombinedStaffDirectory, type CombinedStaffRow } from "./combinedStaffDirectory";

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
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);
  const { branches, activeBranch } = useActiveBranch();
  const { apiReady, bootstrap } = useAppointmentCRM();
  const { imported } = useImportedAgents();

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

  if (selectedImportId) {
    const record = imported.find((r) => r.importId === selectedImportId);
    if (record) {
      return (
        <>
          <SetupModal open={setupOpen} onComplete={handleSetupComplete} onSkip={handleSetupSkip} />
          <AgentDetail importId={selectedImportId} onBack={() => setSelectedImportId(null)} />
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
      content = <ImportedAgentsView onOpen={setSelectedImportId} />;
      break;
    case "reminders":
      content = <RemindersView />;
      break;
    case "settings":
      content = <SettingsView onRerunSetup={() => setSetupOpen(true)} />;
      break;
    default:
      content = <OverviewView onOpenAgent={setSelectedImportId} />;
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

const AgentDetail: React.FC<{ importId: string; onBack: () => void }> = ({ importId, onBack }) => {
  const { terms } = useAppointmentIndustry();
  const { rawAgents } = useRealSchedulingAgents();
  const { imported, updateRoleName, remove } = useImportedAgents();
  const [editingRole, setEditingRole] = useState(false);
  const [roleDraft, setRoleDraft] = useState("");

  const record = imported.find((r) => r.importId === importId);
  const agent = record ? rawAgents.find((a) => a.id === record.agentId) : undefined;

  if (!record || !agent) {
    return (
      <div className="space-y-5">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading agent…</p>
        </GlassCard>
      </div>
    );
  }

  const status: AgentStatus = agent.status === "Published" ? "available" : "paused";
  const startEdit = () => { setRoleDraft(record.aiRoleName); setEditingRole(true); };
  const saveEdit = () => { updateRoleName(record.importId, roleDraft); setEditingRole(false); };

  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 font-medium">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <GlassCard>
        <div className="p-6 flex flex-col sm:flex-row gap-6">
          <div className="w-16 h-16 common-bg-icons rounded-2xl flex items-center justify-center flex-shrink-0">
            <Bot className="w-8 h-8 text-slate-900 dark:text-slate-100" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{agent.name}</h2>
            {editingRole ? (
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  value={roleDraft}
                  onChange={(e) => setRoleDraft(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40"
                  autoFocus
                />
                <button onClick={saveEdit} className="p-1.5 rounded-lg common-button-bg"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setEditingRole(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <button type="button" onClick={startEdit} className="flex items-center gap-1.5 mt-1 group">
                <span className="text-sm font-medium text-violet-600 dark:text-violet-400">{record.aiRoleName}</span>
                <Pencil className="w-3 h-3 text-slate-400 group-hover:text-violet-500" />
              </button>
            )}
            <div className="mt-2"><StatusPill status={status} pulse /></div>
            <p className="text-xs text-slate-400 mt-3">Voice: {agent.voice} · Language: {formatAgentLanguages(agent.language)}</p>
          </div>
          <button
            type="button"
            onClick={() => { remove(record.importId); onBack(); }}
            className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove import
          </button>
        </div>
      </GlassCard>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Phone} color="purple" label="Conversations" value={agent.stats?.conversations ?? 0} />
      </div>
      <AgentStaffAssignmentPanel agentId={record.importId} staffLabel={terms.staff} />
    </div>
  );
};

// ── Assigns an agent to specific staff members it's allowed to book for ─────
// Shows EVERY staff member across every branch, plus the org-wide tenant
// staff roster — the picker doesn't assume which one a business books
// against, so both are listed with their branch/department/designation.
const AgentStaffAssignmentPanel: React.FC<{ agentId: string; staffLabel: string }> = ({ agentId, staffLabel }) => {
  const { rows, loading } = useCombinedStaffDirectory();
  const assignments = useAgentStaffAssignments();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const assignedIds = assignments.assignedStaffIds(agentId);
  const assignedStaff = rows.filter((r) => assignedIds.includes(r.id));

  const toggleStaff = (id: string) => {
    const next = assignedIds.includes(id) ? assignedIds.filter((x) => x !== id) : [...assignedIds, id];
    assignments.setAssignedStaffIds(agentId, next);
  };

  const q = search.trim().toLowerCase();
  const availableStaff = rows.filter((r) => {
    if (!q) return true;
    const hay = `${r.name} ${r.designation} ${r.branchName ?? ""} ${r.departmentName ?? ""}`.toLowerCase();
    return hay.includes(q);
  });

  const sourceLabel = (source: CombinedStaffRow["source"]) => (source === "branch" ? "Branch Staff" : "Tenant Staff");

  return (
    <GlassCard>
      <div className="p-5">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <UsersRound className="w-4 h-4 text-violet-600" /> Assigned {staffLabel}
          </h3>
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium common-button-bg"
          >
            <UserPlus className="w-3.5 h-3.5" /> {pickerOpen ? "Done" : "Assign"}
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          This agent can look up and book appointments for the {staffLabel.toLowerCase()} assigned below — from any branch or your org-wide staff roster.
        </p>

        {assignedStaff.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            No {staffLabel.toLowerCase()} assigned yet — click Assign to pick who this agent can book for.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {assignedStaff.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, hsl(${r.hue},70%,55%), hsl(${r.hue + 20},65%,45%))` }}
                >
                  {r.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{r.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{r.designation}</p>
                  <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5 flex-wrap">
                    {r.branchName && (
                      <span className="inline-flex items-center gap-0.5"><Building2 className="w-2.5 h-2.5" /> {r.branchName}</span>
                    )}
                    {r.departmentName && (
                      <span className="inline-flex items-center gap-0.5"><Layers className="w-2.5 h-2.5" /> {r.departmentName}</span>
                    )}
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{sourceLabel(r.source)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleStaff(r.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 flex-shrink-0"
                  aria-label={`Unassign ${r.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {pickerOpen && (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${staffLabel.toLowerCase()} by name, role, branch, department…`}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700"
                autoFocus
              />
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : availableStaff.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No {staffLabel.toLowerCase()} found.</p>
            ) : (
              <div className="space-y-1.5 max-h-[360px] overflow-y-auto">
                {availableStaff.map((r) => {
                  const checked = assignedIds.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleStaff(r.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left border transition-all ${
                        checked
                          ? "border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-900/15"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, hsl(${r.hue},70%,55%), hsl(${r.hue + 20},65%,45%))` }}
                      >
                        {r.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{r.name}</p>
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 flex-wrap">
                          <span>{r.designation}</span>
                          {r.branchName && <span className="inline-flex items-center gap-0.5"><Building2 className="w-2.5 h-2.5" /> {r.branchName}</span>}
                          {r.departmentName && <span className="inline-flex items-center gap-0.5"><Layers className="w-2.5 h-2.5" /> {r.departmentName}</span>}
                          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">{sourceLabel(r.source)}</span>
                        </p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                          checked ? "bg-violet-600 border-violet-600" : "border-slate-300 dark:border-slate-600"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </GlassCard>
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
