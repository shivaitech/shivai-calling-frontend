import { useState } from "react";
import {
  Bot,
  Check,
  Download,
  Globe,
  Loader2,
  PhoneIncoming,
  PhoneOutgoing,
  X,
} from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import ModalOverlay from "../../../components/ModalOverlay";
import { SectionTitle } from "../SupportCRM/ui";
import { useAppointmentIndustry } from "./industryConfig";
import { useRealSchedulingAgents } from "./realAgents";
import { useImportedAgents, type ImportedAgent } from "./importedAgents";
import { formatAgentLanguages } from "../../../lib/utils";
import type { ApiAgent } from "../../../services/agentAPI";

interface Props {
  onOpen: (importId: string) => void;
}

const channelMeta = (agent: ApiAgent) => {
  const t = agent.agent_type;
  if (t === "inbound") return { label: "Inbound", Icon: PhoneIncoming };
  if (t === "outbound") return { label: "Outbound", Icon: PhoneOutgoing };
  return { label: "Web", Icon: Globe };
};

const ImportedAgentsView: React.FC<Props> = ({ onOpen }) => {
  const { terms } = useAppointmentIndustry();
  const { rawAgents, loading, error, reload } = useRealSchedulingAgents();
  const { imported } = useImportedAgents();
  const [importOpen, setImportOpen] = useState(false);

  const agentById = (id: string) => rawAgents.find((a) => a.id === id);

  return (
    <div className="space-y-5">
      <SectionTitle
        title={`AI ${terms.agent}s`}
        subtitle="Import AI employees from your dashboard and assign each one a role in this workspace"
        right={
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium common-button-bg"
          >
            <Download className="w-3.5 h-3.5" /> Import Agent
          </button>
        }
      />

      {loading && imported.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
        </div>
      ) : error && imported.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-rose-600 dark:text-rose-400 mb-3">{error}</p>
          <button onClick={reload} className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline">
            Retry
          </button>
        </GlassCard>
      ) : imported.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <Bot className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">No AI agents imported yet</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
            Import an AI employee from your dashboard and give it a role here — e.g. "AI Receptionist".
          </p>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium common-button-bg"
          >
            <Download className="w-4 h-4" /> Import Agent
          </button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {imported.map((rec) => {
            const agent = agentById(rec.agentId);
            if (!agent) return null;
            const { label: channelLabel, Icon: ChannelIcon } = channelMeta(agent);
            return (
              <GlassCard key={rec.importId} hover>
                <button type="button" onClick={() => onOpen(rec.importId)} className="w-full text-left p-4 sm:p-5 lg:p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 common-bg-icons rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 sm:w-6 h-5 sm:h-6 text-slate-900 dark:text-slate-100" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-800 dark:text-white text-sm sm:text-base truncate">
                            {agent.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-violet-600 dark:text-violet-400 font-medium truncate">
                            {rec.aiRoleName}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-white bg-black flex-shrink-0">
                          <ChannelIcon className="w-3 h-3" />
                          {channelLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs sm:text-sm">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Voice</span>
                      <span className="text-slate-800 dark:text-white font-medium truncate">{agent.voice}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Language</span>
                      <span className="text-slate-800 dark:text-white font-medium truncate">{formatAgentLanguages(agent.language)}</span>
                    </div>
                    {agent.gender && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Gender</span>
                        <span className="text-slate-800 dark:text-white font-medium capitalize truncate">{agent.gender}</span>
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Status</span>
                      <span className="text-slate-800 dark:text-white font-medium truncate">{agent.status}</span>
                    </div>
                  </div>
                </button>
              </GlassCard>
            );
          })}
        </div>
      )}

      <ImportAgentModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        rawAgents={rawAgents}
        loading={loading}
      />
    </div>
  );
};

const ImportAgentModal: React.FC<{
  open: boolean;
  onClose: () => void;
  rawAgents: ApiAgent[];
  loading: boolean;
}> = ({ open, onClose, rawAgents, loading }) => {
  const { importAgent } = useImportedAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState("");

  const close = () => {
    setSelectedAgentId(null);
    setRoleName("");
    onClose();
  };

  const confirmImport = () => {
    if (!selectedAgentId) return;
    importAgent(selectedAgentId, roleName);
    close();
  };

  return (
    <ModalOverlay open={open} onClose={close} closeOnBackdrop panelClassName="max-w-lg">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">
            {selectedAgentId ? "Name this agent's role" : "Import an AI agent"}
          </h3>
          <button onClick={close} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {!selectedAgentId ? (
          <div className="p-4 overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
              </div>
            ) : rawAgents.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                No AI employees found. Create one from AI Employees in your main dashboard first.
              </p>
            ) : (
              <div className="space-y-1.5">
                {rawAgents.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setSelectedAgentId(a.id);
                      setRoleName("");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50/30 dark:hover:bg-violet-900/10"
                  >
                    <div className="w-9 h-9 common-bg-icons rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-slate-900 dark:text-slate-100" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{a.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {formatAgentLanguages(a.language)} · {a.status}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 common-bg-icons rounded-xl flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-slate-900 dark:text-slate-100" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                {rawAgents.find((a) => a.id === selectedAgentId)?.name}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                AI Role Name <span className="text-red-400">*</span>
              </label>
              <input
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. AI Receptionist, AI Officer"
                className="w-full px-3 py-2.5 rounded-xl text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40 text-slate-800 dark:text-white"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                How this agent shows up in this workspace — you can change it later.
              </p>
            </div>
          </div>
        )}

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex gap-2.5">
          {selectedAgentId ? (
            <>
              <button
                onClick={() => setSelectedAgentId(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80"
              >
                Back
              </button>
              <button
                onClick={confirmImport}
                disabled={!roleName.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium common-button-bg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Import
              </button>
            </>
          ) : (
            <button
              onClick={close}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
};

export default ImportedAgentsView;
export type { ImportedAgent };
