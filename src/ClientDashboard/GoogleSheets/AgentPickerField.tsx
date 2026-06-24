import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { agentAPI, ApiAgent } from "../../services/agentAPI";
import { mergeAgentsById } from "./agentPickerUtils";

const AGENT_PAGE_SIZE = 20;

interface AgentPickerFieldProps {
  value: string;
  onChange: (agentId: string) => void;
  /** Agents already linked to another sheet — shown disabled, not selectable */
  blockedAgentIds?: Set<string>;
  label?: string;
  required?: boolean;
  placeholder?: string;
  /** Remount / refetch when opened */
  active?: boolean;
  /** `horizontal` — label left, control right on md+ */
  layout?: "vertical" | "horizontal";
}

const labelClass =
  "text-xs font-medium text-slate-600 dark:text-slate-400 shrink-0";

const AgentPickerField = ({
  value,
  onChange,
  blockedAgentIds,
  label = "Link to AI Employee",
  required = false,
  placeholder = "Choose an AI Employee…",
  active = true,
  layout = "vertical",
}: AgentPickerFieldProps) => {
  const [agents, setAgents] = useState<ApiAgent[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");

  const blocked = blockedAgentIds ?? new Set<string>();

  const loadPage = useCallback(async (pageNum: number, append: boolean) => {
    const res = await agentAPI.getAgentsWithFilters({
      page: pageNum,
      limit: AGENT_PAGE_SIZE,
    });
    setAgents((prev) => (append ? mergeAgentsById(prev, res.agents) : res.agents));
    setPage(res.page);
    setTotalPages(res.totalPages);
    return res;
  }, []);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    setAgents([]);
    setPage(1);
    setTotalPages(1);
    loadPage(1, false)
      .catch(() => {
        if (!cancelled) setLoadError("Could not load AI employees. Try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active, loadPage]);

  // Keep selected agent visible even if not on loaded pages yet
  useEffect(() => {
    if (!value || agents.some((a) => a.id === value)) return;
    let cancelled = false;
    agentAPI
      .getAgent(value)
      .then(({ agent }) => {
        if (!cancelled) setAgents((prev) => mergeAgentsById(prev, [agent]));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [value, agents]);

  const sortedAgents = useMemo(
    () => [...agents].sort((a, b) => a.name.localeCompare(b.name)),
    [agents],
  );

  const hasMore = page < totalPages;

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    setLoadError("");
    try {
      await loadPage(page + 1, true);
    } catch {
      setLoadError("Could not load more AI employees.");
    } finally {
      setLoadingMore(false);
    }
  };

  const labelNode = (
    <label
      className={`${labelClass} ${
        layout === "horizontal" ? "md:pt-2.5 md:text-right" : "block mb-1.5"
      }`}
    >
      {label} {required && <span className="text-red-400">*</span>}
    </label>
  );

  const controls = (
    <>
      <div className="relative min-w-0">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading && sortedAgents.length === 0}
          className="w-full px-3 py-2.5 rounded-xl text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-800 dark:text-white appearance-none pr-8 disabled:opacity-60"
        >
          <option value="" disabled>
            {loading && sortedAgents.length === 0 ? "Loading AI employees…" : placeholder}
          </option>
          {sortedAgents.map((agent) => {
            const isBlocked = blocked.has(agent.id);
            return (
              <option key={agent.id} value={agent.id} disabled={isBlocked}>
                {agent.name}
                {isBlocked ? " (already linked)" : ""}
              </option>
            );
          })}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="mt-2 w-full py-2 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-dashed border-blue-200 dark:border-blue-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {loadingMore ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading more…
            </>
          ) : (
            <>Load more AI employees ({sortedAgents.length} loaded)</>
          )}
        </button>
      )}
      {loadError && (
        <p className="mt-1.5 text-[11px] text-red-500 dark:text-red-400">{loadError}</p>
      )}
    </>
  );

  if (layout === "horizontal") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-[11rem_1fr] gap-2 md:gap-5 md:items-start">
        {labelNode}
        <div className="min-w-0">{controls}</div>
      </div>
    );
  }

  return (
    <div>
      {labelNode}
      {controls}
    </div>
  );
};

export default AgentPickerField;
