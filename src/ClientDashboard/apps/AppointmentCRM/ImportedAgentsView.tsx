import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Plus, Search, X } from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import appToast from "../../../components/AppToast";
import { SectionTitle } from "../SupportCRM/ui";
import { useAppointmentIndustry } from "./industryConfig";
import { mergeAgentsById } from "../../GoogleSheets/agentPickerUtils";
import {
  assignAgentCrmConfig,
  deleteAgentCrmConfig,
  fetchAssignedAgentIds,
} from "../../../marketplace/useAgentCrmConfig";
import { AppointmentCrmApiError } from "./api/client";
import { formatAgentLanguages } from "../../../lib/utils";
import { AgentDetail } from "./AppointmentCRM";
import { agentAPI, type ApiAgent } from "../../../services/agentAPI";

const APP_ID = "appointment-crm";

interface Props {
  /** Deep-link from elsewhere (e.g. Overview's "open agent" shortcut) —
   * pre-selects this agent's tab once it's confirmed assigned. */
  initialAgentId?: string | null;
  onInitialHandled?: () => void;
}

/**
 * AI Configuration page: the one agent assigned to Appointment CRM (if any),
 * showing its full configuration inline. Assignment is NOT a localStorage
 * flag — it's read directly from GET /ai-config (an agent is "assigned" iff
 * its saved config has assigned:true), since that's the real backend record
 * and there's no separate assign endpoint. Picking a new agent replaces
 * whichever was assigned before — Appointment CRM allows exactly one.
 */
const ImportedAgentsView: React.FC<Props> = ({ initialAgentId, onInitialHandled }) => {
  const { terms } = useAppointmentIndustry();
  const [assignedAgents, setAssignedAgents] = useState<ApiAgent[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Fetch each assigned agent directly by id (GET /agent-configs/:id) rather
  // than looking it up in rawAgents — GET /agents is paginated with no limit
  // override, so an assigned agent outside that default page would otherwise
  // silently look unassigned even though /ai-config correctly says it is.
  // GET /agents/:id is a different, tenant-scoped endpoint that 404s here;
  // /agent-configs/:id is the one that actually resolves any agent by id.
  //
  // /ai-config can report more than one assigned id (e.g. a stale/deleted
  // agent still marked assigned alongside the real current one) even though
  // the UI only shows one at a time — try every id in order and use the
  // first that actually resolves, instead of only ever trying the first id
  // and showing nothing if that one 404s.
  const loadAssignments = useCallback(() => {
    setAssignmentsLoading(true);
    setAssignmentsError(null);
    fetchAssignedAgentIds()
      .then(async (ids) => {
        for (const id of ids) {
          try {
            const { agent } = await agentAPI.getAgentConfig(id);
            setAssignedAgents([agent as ApiAgent]);
            return;
          } catch {
            // try the next assigned id
          }
        }
        setAssignedAgents([]);
      })
      .catch((err) => {
        setAssignmentsError(
          err instanceof AppointmentCrmApiError ? err.message : "Couldn't load the assigned agent.",
        );
      })
      .finally(() => setAssignmentsLoading(false));
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

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

  const assignedIds = new Set(assignedAgents.map((a) => a.id));
  const loading = assignmentsLoading;
  const error = assignmentsError;

  // Appointment CRM allows exactly ONE assigned agent at a time — picking a
  // new one replaces whichever was assigned before. There is no separate
  // "assign" endpoint: per the API spec, a saved /ai-config record with
  // assigned:true IS the assignment, so this writes straight to the backend.
  const handleAssign = async (picked: ApiAgent) => {
    if (switching) return;
    setAddOpen(false);
    setSwitching(true);
    try {
      const previous = assignedAgents.find((a) => a.id !== picked.id);
      if (previous) {
        try {
          await deleteAgentCrmConfig(previous.id, APP_ID);
        } catch {
          /* best-effort — the new assignment below is what actually matters */
        }
      }
      await assignAgentCrmConfig(picked.id, APP_ID);
      setAssignedAgents([picked]);
      setActiveAgentId(picked.id);
    } catch {
      appToast.error("Could not assign this agent. Please try again.");
    } finally {
      setSwitching(false);
    }
  };

  const handleUnassign = async (agentId: string) => {
    try {
      await deleteAgentCrmConfig(agentId, APP_ID);
      setAssignedAgents((prev) => prev.filter((a) => a.id !== agentId));
    } catch {
      appToast.error("Could not unassign this agent. Please try again.");
    }
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
          <button
            onClick={loadAssignments}
            className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline"
          >
            Retry
          </button>
        </GlassCard>
      ) : assignedAgents.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <Bot className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">No AI agent assigned yet</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
            Assign an AI employee from your dashboard to handle this app's inquiries.
          </p>
          <AddAgentControl excludeIds={assignedIds} open onToggle={() => setAddOpen((v) => !v)} onPick={handleAssign} inline />
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
                disabled={switching}
                title="Only one agent can be assigned to this app — picking a new one replaces the current one"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-sm font-medium border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 transition-colors disabled:opacity-60"
              >
                {switching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Change agent
              </button>
              {addOpen && (
                <AddAgentControl
                  excludeIds={assignedIds}
                  open={addOpen}
                  onToggle={() => setAddOpen(false)}
                  onPick={handleAssign}
                  replacing
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
// Pages through every real agent (GET /agents is paginated), with search.
// Scrolling to the end of the list loads the next page; one click assigns.
const AGENT_PAGE_SIZE = 20;

function usePagedAgents(active: boolean) {
  const [agents, setAgents] = useState<ApiAgent[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  // Ignores responses from a search the user has since changed.
  const requestId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadFirst = useCallback(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    agentAPI
      .getAgentsWithFilters({ page: 1, limit: AGENT_PAGE_SIZE, ...(query ? { search: query } : {}) })
      .then((res) => {
        if (id !== requestId.current) return;
        setAgents(res.agents);
        setPage(res.page);
        setTotalPages(res.totalPages);
        setTotal(res.total);
      })
      .catch(() => id === requestId.current && setError("Couldn't load AI employees."))
      .finally(() => id === requestId.current && setLoading(false));
  }, [query]);

  useEffect(() => {
    if (active) loadFirst();
  }, [active, loadFirst]);

  const hasMore = page < totalPages;
  const loadMore = () => {
    if (!hasMore || loading || loadingMore) return;
    const id = requestId.current;
    setLoadingMore(true);
    setError("");
    agentAPI
      .getAgentsWithFilters({ page: page + 1, limit: AGENT_PAGE_SIZE, ...(query ? { search: query } : {}) })
      .then((res) => {
        if (id !== requestId.current) return;
        setAgents((prev) => mergeAgentsById(prev, res.agents));
        setPage(res.page);
        setTotalPages(res.totalPages);
        setTotal(res.total);
      })
      .catch(() => id === requestId.current && setError("Couldn't load more AI employees."))
      .finally(() => setLoadingMore(false));
  };

  return { agents, search, setSearch, query, total, loading, loadingMore, error, hasMore, loadMore, retry: loadFirst };
}

const AddAgentControl: React.FC<{
  /** Agents already assigned — left out of the list. */
  excludeIds: Set<string>;
  open: boolean;
  onToggle: () => void;
  onPick: (agent: ApiAgent) => void | Promise<void>;
  inline?: boolean;
  /** One agent is already assigned — picking here replaces it. */
  replacing?: boolean;
}> = ({ excludeIds, open, onToggle, onPick, inline, replacing }) => {
  const { agents, search, setSearch, query, total, loading, loadingMore, error, hasMore, loadMore, retry } = usePagedAgents(open);
  const searchRef = useRef<HTMLInputElement>(null);
  const available = agents.filter((a) => !excludeIds.has(a.id));

  useEffect(() => {
    if (open && !inline) searchRef.current?.focus();
  }, [open, inline]);

  // Near the bottom of the list → fetch the next page.
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) loadMore();
  };

  const body = (
    <>
      <div className={inline ? "mb-2" : "p-2 border-b border-slate-100 dark:border-slate-700"}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search AI employees…"
            aria-label="Search AI employees"
            className="w-full pl-8 pr-8 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-300"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div
        onScroll={onScroll}
        className={`overflow-y-auto ${inline ? "max-h-80 rounded-xl border border-slate-200 dark:border-slate-700 p-1.5" : "max-h-72 p-2"}`}
      >
        {loading && agents.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
          </div>
        ) : error && agents.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-xs text-rose-500 mb-1.5">{error}</p>
            <button type="button" onClick={retry} className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline">
              Retry
            </button>
          </div>
        ) : available.length === 0 && !hasMore ? (
          <p className="text-xs text-slate-400 text-center py-4 px-2">
            {query
              ? `No AI employees match “${query}”.`
              : replacing
                ? "No other AI employees to switch to — create one from AI Employees in your main dashboard first."
                : "No more AI employees to assign — create one from AI Employees in your main dashboard first."}
          </p>
        ) : (
          <div className="space-y-1">
            {available.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => void onPick(a)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-violet-50 dark:hover:bg-violet-900/15"
              >
                <div className="w-7 h-7 common-bg-icons rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{a.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {formatAgentLanguages(a.language)} · {a.status}
                  </p>
                </div>
              </button>
            ))}
            {hasMore && (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full mt-1 py-2 rounded-lg text-xs font-medium text-violet-600 dark:text-violet-400 border border-dashed border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/15 disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading more…
                  </>
                ) : (
                  "Load more"
                )}
              </button>
            )}
            {error && agents.length > 0 && <p className="text-[11px] text-rose-500 text-center pt-1">{error}</p>}
          </div>
        )}
      </div>

      {total > 0 && (
        <p className={`text-[11px] text-slate-400 ${inline ? "mt-2" : "px-3 py-2 border-t border-slate-100 dark:border-slate-700"}`}>
          {hasMore ? `Showing ${agents.length} of ${total} AI employees` : `All ${total} AI employee${total === 1 ? "" : "s"} shown`}
        </p>
      )}
    </>
  );

  if (inline) {
    return (
      <div className="mt-1 max-w-sm mx-auto text-left">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Pick an AI employee to assign</p>
        {body}
      </div>
    );
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onToggle} />
      <div className="absolute top-full mt-1.5 left-0 z-30 w-[min(20rem,calc(100vw-2rem))] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-700">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {replacing ? "Switch to a different AI employee" : "Assign an AI employee"}
          </span>
          <button onClick={onToggle} aria-label="Close" className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
        {body}
      </div>
    </>
  );
};

export default ImportedAgentsView;
