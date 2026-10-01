import { useMemo, useState } from "react";
import { Plus, Sparkles, X } from "lucide-react";
import { getVisibleApps, type MarketplaceApp } from "../../../marketplace/apps";
import { useInstalledApps } from "../../../marketplace/useInstalledApps";
import { useAgentSkills } from "../../../marketplace/useAgentSkills";

/**
 * Skills assigned to one agent. A "skill" is an installed marketplace app
 * attached to this agent — the agent stays the single conversational
 * orchestrator; skills are capabilities it can invoke, not separate agents.
 */
interface AgentSkillsPanelProps {
  agentId: string;
  userEmail?: string;
  /** Read-only card (Agent View) vs. editable picker (Edit Agent). */
  editable?: boolean;
}

const AgentSkillsPanel = ({ agentId, userEmail, editable = false }: AgentSkillsPanelProps) => {
  const { skillIds, toggleSkill } = useAgentSkills(agentId);
  const { installedIds } = useInstalledApps();
  const [pickerOpen, setPickerOpen] = useState(false);

  const visibleApps = useMemo(() => getVisibleApps(userEmail), [userEmail]);
  const installedApps = useMemo(
    () => visibleApps.filter((a) => installedIds.includes(a.id)),
    [visibleApps, installedIds],
  );
  const assignedApps = useMemo(
    () => installedApps.filter((a) => skillIds.includes(a.id)),
    [installedApps, skillIds],
  );
  const availableApps = useMemo(
    () => installedApps.filter((a) => !skillIds.includes(a.id)),
    [installedApps, skillIds],
  );

  const renderSkillCard = (app: MarketplaceApp, assigned: boolean) => {
    const Icon = app.icon;
    return (
      <div
        key={app.id}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60"
      >
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${app.gradient} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{app.name}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{app.tagline}</p>
        </div>
        {editable && (
          <button
            type="button"
            onClick={() => toggleSkill(app.id)}
            className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${
              assigned
                ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            }`}
            aria-label={assigned ? `Remove ${app.name} skill` : `Add ${app.name} skill`}
            title={assigned ? "Remove skill" : "Add skill"}
          >
            {assigned ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-violet-500" /> Skills
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Installed apps this agent can use as capabilities during a conversation.
          </p>
        </div>
        {editable && installedApps.length > 0 && (
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium common-button-bg flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> {pickerOpen ? "Done" : "Add Skill"}
          </button>
        )}
      </div>

      {installedApps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 px-4 py-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">No apps installed yet.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Install a feature from Skill and Features to make it assignable here.
          </p>
        </div>
      ) : assignedApps.length === 0 && !pickerOpen ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 px-4 py-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">No skills assigned yet.</p>
          {editable && (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium common-button-bg"
            >
              <Plus className="w-3.5 h-3.5" /> Add a skill
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {assignedApps.map((app) => renderSkillCard(app, true))}
        </div>
      )}

      {editable && pickerOpen && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Installed apps available to assign
          </p>
          {availableApps.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              {installedApps.length === assignedApps.length
                ? "All installed apps are already assigned to this agent."
                : "Nothing available."}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableApps.map((app) => renderSkillCard(app, false))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentSkillsPanel;
