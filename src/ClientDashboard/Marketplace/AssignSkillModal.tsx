import { useEffect, useState } from "react";
import { Bot, Check, Loader2, X } from "lucide-react";
import ModalOverlay from "../../components/ModalOverlay";
import type { MarketplaceApp } from "../../marketplace/apps";
import { agentAPI, type ApiAgent } from "../../services/agentAPI";
import { readAgentSkillIds, assignSkillToAgent, unassignSkillFromAgent } from "../../marketplace/useAgentSkills";

/**
 * Assign this installed app (skill) to one or more agents. The agent stays
 * the single conversational orchestrator; this just attaches the capability
 * so it shows up as a Skill card in that agent's View/Edit.
 *
 * Two contexts reuse this:
 *  - Marketplace / App Detail: dismissible, opens right after install.
 *  - AppWorkspace's persistent nag: `allowSkip` controls whether "Skip for
 *    now" is offered; the nag re-shows on every visit regardless, since
 *    skipping doesn't mark anything "handled" — only an actual assignment
 *    (checked via useAgentIdsForSkill) stops it from reappearing.
 */
interface AssignSkillModalProps {
  open: boolean;
  onClose: () => void;
  app: MarketplaceApp;
  /** Hide the explicit "Skip for now" footer action (X close is always available). */
  allowSkip?: boolean;
  /** Called whenever an agent is toggled, with the resulting assigned count. */
  onAssignmentChange?: (assignedCount: number) => void;
}

const AssignSkillModal = ({ open, onClose, app, allowSkip = true, onAssignmentChange }: AssignSkillModalProps) => {
  const [agents, setAgents] = useState<ApiAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    agentAPI
      .getAgents()
      .then((list) => {
        setAgents(list);
        setAssignedIds(new Set(list.filter((a) => readAgentSkillIds(a.id).includes(app.id)).map((a) => a.id)));
      })
      .catch(() => {
        setAgents([]);
        setAssignedIds(new Set());
      })
      .finally(() => setLoading(false));
  }, [open, app.id]);

  const toggle = (agentId: string) => {
    setAssignedIds((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        unassignSkillFromAgent(agentId, app.id);
        next.delete(agentId);
      } else {
        assignSkillToAgent(agentId, app.id);
        next.add(agentId);
      }
      onAssignmentChange?.(next.size);
      return next;
    });
  };

  return (
    <ModalOverlay open={open} onClose={allowSkip ? onClose : undefined} closeOnBackdrop={allowSkip} panelClassName="max-w-md">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${app.gradient} flex items-center justify-center flex-shrink-0`}>
              <app.icon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-800 dark:text-white truncate">Assign to Agents</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Give an agent the {app.name} skill
              </p>
            </div>
          </div>
          {allowSkip && (
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex-shrink-0">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>

        {!allowSkip && (
          <div className="px-4 pt-3">
            <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-800/60 rounded-lg px-3 py-2">
              {app.name} has no AI agent assigned yet — calls and conversations for this app won't be handled until you assign at least one.
            </p>
          </div>
        )}

        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
            </div>
          ) : agents.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
              No AI agents found. Create one from AI Employees first.
            </p>
          ) : (
            <div className="space-y-1.5">
              {agents.map((a) => {
                const assigned = assignedIds.has(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggle(a.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left border transition-all ${
                      assigned
                        ? "border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-900/15"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{a.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{a.status}</p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        assigned ? "bg-violet-600 border-violet-600" : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {assigned && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex gap-2.5">
          {allowSkip && assignedIds.size === 0 && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80"
            >
              Skip for now
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={!allowSkip && assignedIds.size === 0}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium common-button-bg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Done
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default AssignSkillModal;
