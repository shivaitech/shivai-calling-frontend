import { useEffect, useMemo, useState } from "react";
import { Bot, Loader2, Plus, X } from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import { SectionTitle } from "../SupportCRM/ui";
import { useAppointmentIndustry } from "./industryConfig";
import { useRealSchedulingAgents } from "./realAgents";
import {
  getAgentIdsForSkill,
  assignSkillToAgent,
  unassignSkillFromAgent,
} from "../../../marketplace/useAgentSkills";
import { formatAgentLanguages } from "../../../lib/utils";
import { AgentDetail } from "./AppointmentCRM";
import type { ApiAgent } from "../../../services/agentAPI";

const APP_ID = "appointment-crm";

interface Props {
  /** Deep-link from elsewhere (e.g. Overview's "open agent" shortcut) —
   * pre-selects this agent's tab once it's confirmed assigned. */
  initialAgentId?: string | null;
  onInitialHandled?: () => void;
}

/**
 * AI Configuration page: one tab per agent that has the Appointment CRM
 * skill assigned (the SAME assignment used by the Marketplace install flow
 * and Edit Agent's Skills tab — not a separate local list), each tab showing
 * that agent's full configuration inline. Adding an agent assigns the skill
 * to it directly; no separate "import" concept.
 */
const ImportedAgentsView: React.FC<Props> = ({ initialAgentId, onInitialHandled }) => {
  const { terms } = useAppointmentIndustry();
  const { rawAgents, loading, error, reload } = useRealSchedulingAgents();
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [, forceSync] = useState(0);

  useEffect(() => {
    const sync = () => forceSync((n) => n + 1);
    window.addEventListener("shivai:agent-skills-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("shivai:agent-skills-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const assignedAgents = useMemo(
    () => getAgentIdsForSkill(APP_ID, rawAgents.map((a) => a.id))
      .map((id) => rawAgents.find((a) => a.id === id))
      .filter((a): a is ApiAgent => Boolean(a)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawAgents],
  );

  // Keep the active tab valid as assignments change; prefer a pending deep-link.
  useEffect(() => {
    if (assignedAgents.length === 0) {
      setActiveAgentId(null);
      return;
    }
    if (initialAgentId && assignedAgents.some((a) => a.id === initialAgentId)) {
      setActiveAgentId(initialAgentId);
      onInitialHandled?.();
      return;
    }
    if (!activeAgentId || !assignedAgents.some((a) => a.id === activeAgentId)) {
      setActiveAgentId(assignedAgents[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedAgents, initialAgentId]);

  const availableToAdd = rawAgents.filter((a) => !assignedAgents.some((x) => x.id === a.id));

  const handleAssign = (agentId: string) => {
    assignSkillToAgent(agentId, APP_ID);
    setActiveAgentId(agentId);
    setAddOpen(false);
  };

  const handleUnassign = (agentId: string) => {
    unassignSkillFromAgent(agentId, APP_ID);
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title="AI Configuration"
        subtitle={`Set up how each AI ${terms.agent.toLowerCase()} handles data access, responses, escalation, and booking scenarios`}
      />

      {loading && assignedAgents.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
        </div>
      ) : error && assignedAgents.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-rose-600 dark:text-rose-400 mb-3">{error}</p>
          <button onClick={reload} className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline">
            Retry
          </button>
        </GlassCard>
      ) : assignedAgents.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <Bot className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">No AI agents assigned yet</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
            Assign an AI employee from your dashboard to handle this app's inquiries.
          </p>
          <AddAgentControl
            loading={loading}
            available={availableToAdd}
            open={addOpen}
            onToggle={() => setAddOpen((v) => !v)}
            onPick={handleAssign}
            inline
          />
        </GlassCard>
      ) : (
        <>
          <div className="flex items-center gap-1.5 flex-wrap">
            {assignedAgents.map((agent) => {
              const isActive = agent.id === activeAgentId;
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setActiveAgentId(agent.id)}
                  className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                    isActive
                      ? "bg-violet-600 border-violet-600 text-white"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-700"
                  }`}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? "bg-white/20" : "common-bg-icons"}`}>
                    <Bot className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-700 dark:text-slate-200"}`} />
                  </span>
                  <span className="max-w-[10rem] truncate">{agent.name}</span>
                </button>
              );
            })}

            <div className="relative">
              <button
                type="button"
                onClick={() => setAddOpen((v) => !v)}
                title="Assign another agent"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-sm font-medium border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
              {addOpen && (
                <AddAgentControl
                  loading={loading}
                  available={availableToAdd}
                  open={addOpen}
                  onToggle={() => setAddOpen(false)}
                  onPick={handleAssign}
                />
              )}
            </div>
          </div>

          {activeAgentId && (
            <AgentDetail agentId={activeAgentId} onUnassign={() => handleUnassign(activeAgentId)} />
          )}
        </>
      )}
    </div>
  );
};

// ── Inline add-agent picker — a popover (or embedded block when `inline`) ────
// listing every real agent not yet assigned this skill. One click assigns it.
const AddAgentControl: React.FC<{
  loading: boolean;
  available: ApiAgent[];
  open: boolean;
  onToggle: () => void;
  onPick: (agentId: string) => void;
  inline?: boolean;
}> = ({ loading, available, open, onToggle, onPick, inline }) => {
  const body = (
    <div className={inline ? "max-w-sm mx-auto text-left" : "p-2 max-h-72 overflow-y-auto"}>
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
        </div>
      ) : available.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4 px-2">
          No more AI employees to assign — create one from AI Employees in your main dashboard first.
        </p>
      ) : (
        <div className="space-y-1">
          {available.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onPick(a.id)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-violet-50 dark:hover:bg-violet-900/15"
            >
              <div className="w-7 h-7 common-bg-icons rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{a.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{formatAgentLanguages(a.language)} · {a.status}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (inline) {
    return (
      <div className="mt-1">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Pick an AI employee to assign</p>
        {body}
      </div>
    );
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onToggle} />
      <div className="absolute top-full mt-1.5 left-0 z-30 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-700">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Assign an AI employee</span>
          <button onClick={onToggle} className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
        {body}
      </div>
    </>
  );
};

export default ImportedAgentsView;
