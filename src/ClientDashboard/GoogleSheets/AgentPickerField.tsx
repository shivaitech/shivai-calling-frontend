import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { agentAPI, ApiAgent } from "../../services/agentAPI";
import { mergeAgentsById } from "./agentPickerUtils";

const AGENT_PAGE_SIZE = 20;

interface AgentPickerFieldProps {
  value: string;
  onChange: (agentId: string) => void;
  /** Agents already linked elsewhere — shown disabled, not selectable */
  blockedAgentIds?: Set<string>;
  label?: string;
  required?: boolean;
  placeholder?: string;
  /** Remount / refetch when opened / active */
  active?: boolean;
  /** `horizontal` — label left, control right on md+ */
  layout?: "vertical" | "horizontal";
  /** Allow clearing selection (e.g. “No agent”) */
  allowClear?: boolean;
  clearLabel?: string;
  disabled?: boolean;
  /** Compact trigger for inline rows */
  compact?: boolean;
  hideLabel?: boolean;
  className?: string;
  /**
   * `dropdown` — absolute overlay (default).
   * `panel` — always-open list in document flow (for modals).
   */
  variant?: "dropdown" | "panel";
  /** Start open when variant is dropdown */
  defaultOpen?: boolean;
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
  allowClear = false,
  clearLabel = "— No agent —",
  disabled = false,
  compact = false,
  hideLabel = false,
  className = "",
  variant = "dropdown",
  defaultOpen = false,
}: AgentPickerFieldProps) => {
  const isPanel = variant === "panel";
  const [agents, setAgents] = useState<ApiAgent[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [open, setOpen] = useState(isPanel || defaultOpen);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const blocked = blockedAgentIds ?? new Set<string>();

  const loadPage = useCallback(
    async (pageNum: number, append: boolean, search: string) => {
      const res = await agentAPI.getAgentsWithFilters({
        page: pageNum,
        limit: AGENT_PAGE_SIZE,
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      setAgents((prev) => (append ? mergeAgentsById(prev, res.agents) : res.agents));
      setPage(res.page);
      setTotalPages(res.totalPages);
      return res;
    },
    [],
  );

  // Debounce search → query
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Initial / search refetch
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    setPage(1);
    setTotalPages(1);
    loadPage(1, false, searchQuery)
      .catch(() => {
        if (!cancelled) setLoadError("Could not load AI employees. Try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active, loadPage, searchQuery]);

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

  // Close on outside click (dropdown only)
  useEffect(() => {
    if (!open || isPanel) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, isPanel]);

  useEffect(() => {
    if (open || isPanel) {
      const t = setTimeout(() => searchRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open, isPanel, active]);

  useEffect(() => {
    if (isPanel) setOpen(true);
  }, [isPanel]);

  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === value),
    [agents, value],
  );

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
      await loadPage(page + 1, true, searchQuery);
    } catch {
      setLoadError("Could not load more AI employees.");
    } finally {
      setLoadingMore(false);
    }
  };

  const selectAgent = (id: string) => {
    onChange(id);
    if (!isPanel) {
      setOpen(false);
      setSearchTerm("");
    }
  };

  const labelNode = !hideLabel ? (
    <label
      className={`${labelClass} ${
        layout === "horizontal" ? "md:pt-2.5 md:text-right" : "block mb-1.5"
      }`}
    >
      {label} {required && <span className="text-red-400">*</span>}
    </label>
  ) : null;

  const listBody = (
    <>
      <div className="p-2 border-b border-slate-100 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            ref={searchRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search agents…"
            disabled={disabled}
            className="w-full pl-8 pr-8 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div
        className={`${isPanel ? "max-h-[min(320px,50vh)]" : "max-h-56"} overflow-y-auto py-1`}
      >
        {allowClear && (
          <button
            type="button"
            onClick={() => selectAgent("")}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
              !value
                ? "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200"
                : "text-slate-500"
            }`}
          >
            {clearLabel}
          </button>
        )}

        {loading && sortedAgents.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : sortedAgents.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-slate-400">No agents found</p>
        ) : (
          sortedAgents.map((agent) => {
            const isBlocked = blocked.has(agent.id);
            const isSelected = value === agent.id;
            return (
              <button
                key={agent.id}
                type="button"
                disabled={isBlocked || disabled}
                onClick={() => !isBlocked && selectAgent(agent.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100"
                }`}
              >
                <span className="truncate flex-1">
                  {agent.name}
                  {isBlocked ? " (already linked)" : ""}
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
              </button>
            );
          })
        )}
      </div>

      {hasMore && (
        <div className="p-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore || disabled}
            className="w-full py-2 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-dashed border-blue-200 dark:border-blue-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading more…
              </>
            ) : (
              <>Load more ({sortedAgents.length} loaded)</>
            )}
          </button>
        </div>
      )}

      {loadError && (
        <p className="px-3 py-2 text-[11px] text-red-500 dark:text-red-400 border-t border-slate-100 dark:border-slate-800">
          {loadError}
        </p>
      )}
    </>
  );

  const trigger = (
    <button
      type="button"
      disabled={disabled || (loading && sortedAgents.length === 0 && !value)}
      onClick={() => !disabled && setOpen((o) => !o)}
      className={`w-full text-left rounded-xl common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-800 dark:text-white appearance-none disabled:opacity-60 flex items-center justify-between gap-2 ${
        compact ? "px-3 py-2 text-sm sm:w-56" : "px-3 py-2.5 text-sm"
      }`}
    >
      <span className={`truncate ${!value ? "text-slate-400" : ""}`}>
        {value
          ? selectedAgent?.name || "Selected agent"
          : loading && sortedAgents.length === 0
            ? "Loading AI employees…"
            : placeholder}
      </span>
      {disabled ? (
        <Loader2 className="w-4 h-4 animate-spin text-slate-400 flex-shrink-0" />
      ) : (
        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      )}
    </button>
  );

  const controls = isPanel ? (
    <div ref={rootRef} className={`min-w-0 ${className}`}>
      {value && selectedAgent && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          Selected:{" "}
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {selectedAgent.name}
          </span>
        </p>
      )}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        {listBody}
      </div>
    </div>
  ) : (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      {trigger}
      {open && (
        <div className="absolute z-[100] mt-1.5 left-0 right-0 sm:min-w-[16rem] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
          {listBody}
        </div>
      )}
    </div>
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
