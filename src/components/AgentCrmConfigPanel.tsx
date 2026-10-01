import { useEffect, useMemo, useState } from "react";
import {
  GitBranch,
  ListChecks,
  Plus,
  Save,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { MarketplaceApp } from "../marketplace/apps";
import type { ApiAgent } from "../services/agentAPI";
import {
  readAgentCrmConfig,
  useAgentCrmConfig,
  defaultFlowsForApp,
  type AgentCrmConfig,
  type AgentFlow,
  type UnknownQuestionAction,
  type AgentTone,
} from "../marketplace/useAgentCrmConfig";

const TONE_OPTIONS: { value: AgentTone; label: string }[] = [
  { value: "friendly", label: "Friendly" },
  { value: "formal", label: "Formal" },
  { value: "concise", label: "Concise" },
];

/**
 * Full agent ↔ app behavior config: data access, response behavior,
 * escalation/handoff, and per-scenario data-collection flows. Inline page
 * section (not a modal) — this is the single source for configuring how an
 * agent handles an assigned skill's data, meant to live on the agent's own
 * detail page (e.g. AppointmentCRM's AgentDetail) rather than a header popup.
 */
const AgentCrmConfigPanel = ({ app, agent }: { app: MarketplaceApp; agent: ApiAgent }) => {
  const { config, save } = useAgentCrmConfig(agent.id, app.id);
  const [draft, setDraft] = useState<AgentCrmConfig>(config);
  const [savedPulse, setSavedPulse] = useState(false);

  useEffect(() => {
    setDraft(readAgentCrmConfig(agent.id, app.id));
  }, [agent.id, app.id]);

  const dataDomains = useMemo(
    () => (app.workspaceSections ?? []).filter((s) => !["overview", "agents", "settings"].includes(s.key)),
    [app.workspaceSections],
  );

  const toggleDataDomain = (key: string) => {
    setDraft((d) => ({
      ...d,
      dataAccess: d.dataAccess.includes(key)
        ? d.dataAccess.filter((k) => k !== key)
        : [...d.dataAccess, key],
    }));
  };

  const handleSave = () => {
    save(draft);
    setSavedPulse(true);
    setTimeout(() => setSavedPulse(false), 1500);
  };

  const keywordsText = draft.escalation.escalateOnKeywords.join(", ");

  const flows = draft.flows ?? [];

  const updateFlow = (flowId: string, patch: Partial<AgentFlow>) => {
    setDraft((d) => ({
      ...d,
      flows: (d.flows ?? []).map((f) => (f.id === flowId ? { ...f, ...patch } : f)),
    }));
  };

  const removeFlow = (flowId: string) => {
    setDraft((d) => ({ ...d, flows: (d.flows ?? []).filter((f) => f.id !== flowId) }));
  };

  const addFlow = () => {
    const newFlow: AgentFlow = {
      id: `custom-${Date.now()}`,
      name: "New scenario",
      trigger: "Describe when this flow should start",
      enabled: true,
      fields: [],
    };
    setDraft((d) => ({ ...d, flows: [...(d.flows ?? []), newFlow] }));
  };

  const addField = (flowId: string) => {
    updateFlow(flowId, {
      fields: [
        ...(flows.find((f) => f.id === flowId)?.fields ?? []),
        { key: `field_${Date.now()}`, label: "New field to collect", required: false },
      ],
    });
  };

  const updateField = (flowId: string, fieldKey: string, patch: Partial<AgentFlow["fields"][number]>) => {
    const flow = flows.find((f) => f.id === flowId);
    if (!flow) return;
    updateFlow(flowId, {
      fields: flow.fields.map((fld) => (fld.key === fieldKey ? { ...fld, ...patch } : fld)),
    });
  };

  const removeField = (flowId: string, fieldKey: string) => {
    const flow = flows.find((f) => f.id === flowId);
    if (!flow) return;
    updateFlow(flowId, { fields: flow.fields.filter((fld) => fld.key !== fieldKey) });
  };

  const resetFlowsToDefault = () => {
    setDraft((d) => ({ ...d, flows: defaultFlowsForApp(app.id) }));
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200/80 dark:border-slate-700 overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${app.gradient} flex items-center justify-center flex-shrink-0`}>
            <app.icon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white truncate">Assigned AI configuration</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              How {agent.name} handles {app.name} inquiries
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium common-button-bg"
        >
          {savedPulse ? "Saved!" : <><Save className="w-4 h-4" /> Save</>}
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-6">
        {/* Data access */}
        <section>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" /> Data the agent can read
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            Choose which parts of {app.name} the agent may look up to answer customer questions.
          </p>
          {dataDomains.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">No configurable data domains for this app yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {dataDomains.map((section) => {
                const Icon = section.icon;
                const checked = draft.dataAccess.includes(section.key);
                return (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => toggleDataDomain(section.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${
                      checked
                        ? "border-violet-300 dark:border-violet-700 bg-violet-50/60 dark:bg-violet-900/15"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate flex-1">
                      {section.label}
                    </span>
                    <div
                      className={`w-3.5 h-3.5 rounded flex-shrink-0 border-2 ${
                        checked ? "bg-violet-600 border-violet-600" : "border-slate-300 dark:border-slate-600"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Response behavior */}
        <section>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-2.5">Response behavior</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 sm:col-span-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Can take action directly</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Lets the agent create/modify records (e.g. book an appointment) instead of only informing the customer.
                </p>
              </div>
              <input
                type="checkbox"
                checked={draft.behavior.canModifyRecords}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, behavior: { ...d.behavior, canModifyRecords: e.target.checked } }))
                }
                className="w-4 h-4 accent-violet-600 flex-shrink-0"
              />
            </label>

            <div className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                When the agent doesn't know the answer
              </p>
              <div className="flex gap-2">
                {(["escalate", "apologize"] as UnknownQuestionAction[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({ ...d, behavior: { ...d.behavior, unknownQuestionAction: opt } }))
                    }
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                      draft.behavior.unknownQuestionAction === opt
                        ? "bg-violet-600 text-white border-violet-600"
                        : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {opt === "escalate" ? "Escalate to human" : "Apologize & note it"}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">Tone</p>
              <div className="flex gap-2">
                {TONE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, behavior: { ...d.behavior, tone: opt.value } }))}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      draft.behavior.tone === opt.value
                        ? "bg-violet-600 text-white border-violet-600"
                        : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Escalation / handoff */}
        <section>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-1.5 mb-2.5">
            <ShieldAlert className="w-3.5 h-3.5 text-violet-500" /> Escalation &amp; handoff
          </h4>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 sm:col-span-2">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Enable escalation to a human</p>
              <input
                type="checkbox"
                checked={draft.escalation.enabled}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, escalation: { ...d.escalation, enabled: e.target.checked } }))
                }
                className="w-4 h-4 accent-violet-600 flex-shrink-0"
              />
            </label>

            {draft.escalation.enabled && (
              <>
                <div className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                    Hand off after this many unclear replies
                  </p>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={draft.escalation.maxFailedAttempts}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        escalation: { ...d.escalation, maxFailedAttempts: Math.max(1, Number(e.target.value) || 1) },
                      }))
                    }
                    className="w-20 px-2.5 py-1.5 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>

                <div className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                    Notify this email on escalation
                  </p>
                  <input
                    type="email"
                    value={draft.escalation.notifyEmail}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, escalation: { ...d.escalation, notifyEmail: e.target.value } }))
                    }
                    placeholder="team@yourcompany.com"
                    className="w-full px-2.5 py-1.5 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>

                <div className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 sm:col-span-2">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                    Always escalate if the customer mentions
                  </p>
                  <input
                    type="text"
                    value={keywordsText}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        escalation: {
                          ...d.escalation,
                          escalateOnKeywords: e.target.value
                            .split(",")
                            .map((k) => k.trim())
                            .filter(Boolean),
                        },
                      }))
                    }
                    placeholder="cancel, complaint, refund"
                    className="w-full px-2.5 py-1.5 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Comma-separated keywords</p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Scenario flows — what the agent must collect per customer intent */}
        <section>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-violet-500" /> Scenarios &amp; what to collect
            </h4>
            <button
              type="button"
              onClick={resetFlowsToDefault}
              className="text-[11px] text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 flex-shrink-0"
            >
              Reset to defaults
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            For each customer scenario, define what the agent must ask for before it acts.
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            {flows.map((flow) => (
              <div key={flow.id} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={flow.enabled}
                      onChange={(e) => updateFlow(flow.id, { enabled: e.target.checked })}
                      className="w-4 h-4 accent-violet-600 flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={flow.name}
                      onChange={(e) => updateFlow(flow.id, { name: e.target.value })}
                      className="flex-1 min-w-0 px-2 py-1 rounded-lg text-sm font-semibold common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => removeFlow(flow.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex-shrink-0"
                      aria-label="Remove scenario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={flow.trigger}
                    onChange={(e) => updateFlow(flow.id, { trigger: e.target.value })}
                    placeholder="When does this scenario start?"
                    className="w-full px-2 py-1 rounded-lg text-xs common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40 text-slate-500 dark:text-slate-400"
                  />
                </div>

                <div className="p-3 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1 mb-1.5">
                    <ListChecks className="w-3 h-3" /> Data to collect
                  </p>
                  {flow.fields.length === 0 && (
                    <p className="text-xs text-slate-400 py-1">No fields yet — add what the agent should ask for.</p>
                  )}
                  {flow.fields.map((field) => (
                    <div key={field.key} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(flow.id, field.key, { label: e.target.value })}
                        className="flex-1 min-w-0 px-2 py-1 rounded-lg text-xs common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40"
                      />
                      <label className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(flow.id, field.key, { required: e.target.checked })}
                          className="w-3 h-3 accent-violet-600"
                        />
                        Required
                      </label>
                      <button
                        type="button"
                        onClick={() => removeField(flow.id, field.key)}
                        className="p-1 rounded-lg text-slate-300 hover:text-rose-500 flex-shrink-0"
                        aria-label="Remove field"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addField(flow.id)}
                    className="flex items-center gap-1 text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:underline pt-1"
                  >
                    <Plus className="w-3 h-3" /> Add field
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addFlow}
            className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add scenario
          </button>
        </section>
      </div>

      <div className="px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium common-button-bg"
        >
          {savedPulse ? "Saved!" : <><Save className="w-4 h-4" /> Save configuration</>}
        </button>
      </div>
    </div>
  );
};

export default AgentCrmConfigPanel;
