import { BookOpen, FileSpreadsheet, UserCog, Workflow } from "lucide-react";
import { useNavigate } from "react-router-dom";

export type AgentWorkflowChip = {
  id: string;
  label: string;
  kind: "google_sheets" | "roster" | "ai_document";
  href?: string;
};

const KIND_STYLES: Record<AgentWorkflowChip["kind"], string> = {
  google_sheets:
    "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/60",
  roster:
    "bg-teal-50 text-teal-800 border-teal-200/80 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800/60",
  ai_document:
    "bg-blue-50 text-blue-800 border-blue-200/80 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/60",
};

function ChipIcon({ kind }: { kind: AgentWorkflowChip["kind"] }) {
  const cls = "w-3 h-3 flex-shrink-0";
  if (kind === "google_sheets") return <FileSpreadsheet className={cls} />;
  if (kind === "roster") return <UserCog className={cls} />;
  return <BookOpen className={cls} />;
}

interface AgentCardWorkflowsProps {
  agentId: string;
  chips: AgentWorkflowChip[];
  loading?: boolean;
  maxVisible?: number;
}

const AgentCardWorkflows = ({
  agentId,
  chips,
  loading = false,
  maxVisible = 3,
}: AgentCardWorkflowsProps) => {
  const navigate = useNavigate();
  const visible = chips.slice(0, maxVisible);
  const overflow = chips.length - visible.length;

  return (
    <div className="mb-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-gradient-to-br from-slate-50/90 to-white/50 dark:from-slate-800/40 dark:to-slate-900/20 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Workflow className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400 flex-shrink-0" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Integrated workflows
          </span>
        </div>
        {loading ? (
          <span className="text-[10px] text-slate-400 animate-pulse">Syncing…</span>
        ) : chips.length > 0 ? (
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tabular-nums">
            {chips.length}
          </span>
        ) : null}
      </div>

      {!loading && chips.length === 0 ? (
        <button
          type="button"
          onClick={() => navigate(`/agents/${agentId}`)}
          className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-left"
        >
          No workflows connected — set up in agent profile
        </button>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {visible.map((chip) => {
            const inner = (
              <>
                <ChipIcon kind={chip.kind} />
                <span className="truncate max-w-[9rem]">{chip.label}</span>
              </>
            );
            const className = `inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border ${KIND_STYLES[chip.kind]}`;
            return chip.href ? (
              <button
                key={chip.id}
                type="button"
                onClick={() => navigate(chip.href!)}
                className={`${className} hover:opacity-90 transition-opacity`}
                title={chip.label}
              >
                {inner}
              </button>
            ) : (
              <span key={chip.id} className={className} title={chip.label}>
                {inner}
              </span>
            );
          })}
          {overflow > 0 && (
            <button
              type="button"
              onClick={() => navigate(`/agents/${agentId}`)}
              className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              +{overflow} more
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentCardWorkflows;
