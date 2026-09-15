import { useEffect, useMemo, useRef, useState } from "react";
import GlassCard from "../../../components/GlassCard";
import Pagination from "../../../components/Pagination";
import SessionTranscriptModal from "./SessionTranscriptModal";
import { agentAPI } from "../../../services/agentAPI";
import {
  BarChart3,
  History,
  Clock,
  MessageSquare,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Eye,
  Search,
  MapPin,
  Smartphone,
  Monitor,
  Tablet,
  Loader2,
} from "lucide-react";
import {
  resolveIPLocationsBatch,
  needsLocationResolution,
  normalizeSessionLocation,
  formatIPLocationLabel,
  type IPLocationResult,
} from "../../../lib/ipGeolocation";
import {
  callTypeBadgeClass,
  formatCallTypeLabel,
  resolveSessionCallType,
  resolveSessionLeadNumber,
} from "../../../lib/sessionDirection";

interface AgentAnalyticsPanelProps {
  agentId: string;
  /** Scope to a sub-tenant's data when viewing this agent inside a sub-tenant. */
  subTenantId?: string;
}

type TabKey = "analytics" | "history";

const PAGE_SIZE = 10;

const formatDuration = (seconds: number) => {
  if (!seconds) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

const formatTime = (timestamp: string) => {
  if (!timestamp) return "N/A";
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (timestamp: string) => {
  if (!timestamp) return "N/A";
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
};

const getDeviceIcon = (deviceType: string) => {
  const type = deviceType?.toLowerCase() || "";
  if (type.includes("mobile") || type.includes("phone")) return Smartphone;
  if (type.includes("tablet")) return Tablet;
  return Monitor;
};

const AgentAnalyticsPanel: React.FC<AgentAnalyticsPanelProps> = ({
  agentId,
  subTenantId,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("analytics");
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingLocations, setLoadingLocations] = useState<Set<string>>(
    new Set()
  );

  // Guard against stale responses when paging/searching quickly.
  const reqRef = useRef(0);

  // Debounce the search box → searchQuery.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchSessions = async (page: number) => {
    if (!agentId) return;
    const reqId = ++reqRef.current;
    const isStale = () => reqId !== reqRef.current;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
      });
      if (searchQuery.trim()) {
        params.append("q", searchQuery.trim());
        params.append("search", searchQuery.trim());
      }
      // Per-agent session history — GET /agent-sessions/agent/:id.
      const response = await agentAPI.getAgentSessions(params.toString(), agentId);
      if (isStale()) return;

      const list = response?.sessions || [];
      const pagination = response?.pagination || {};

      // Resolve missing/stub locations from IP (same behavior as Analytics).
      const ids = new Set<string>(list.map((s: any) => s.id || s.call_id));
      setLoadingLocations(ids);
      const ipsToResolve = list
        .filter((s: any) => {
          const ip = s?.user_ip || s?.ip;
          return ip && needsLocationResolution(s?.location);
        })
        .map((s: any) => s?.user_ip || s?.ip);
      const locationMap = await resolveIPLocationsBatch(ipsToResolve, 2);
      const withLocations = list.map((s: any) => {
        const ip = s?.user_ip || s?.ip;
        if (ip && needsLocationResolution(s?.location) && locationMap[ip]) {
          return { ...s, location: locationMap[ip] };
        }
        const normalized = normalizeSessionLocation(s?.location, ip);
        return normalized ? { ...s, location: normalized } : s;
      });
      setLoadingLocations(new Set());
      if (isStale()) return;

      setSessions(withLocations);
      setTotalPages(pagination.totalPages || 1);
      setTotalSessions(pagination.total || list.length);
      setCurrentPage(pagination.page || page);
    } catch (err) {
      if (isStale()) return;
      console.error("Error loading agent sessions:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load call history"
      );
      setSessions([]);
      setTotalPages(1);
      setTotalSessions(0);
    } finally {
      if (!isStale()) setLoading(false);
    }
  };

  // Fetch when agent / search changes → reset to page 1.
  useEffect(() => {
    setCurrentPage(1);
    fetchSessions(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, subTenantId, searchQuery]);

  // Aggregate stats from the currently loaded sessions.
  const stats = useMemo(() => {
    const total = totalSessions || sessions.length;
    const durations = sessions
      .map((s: any) => Number(s.duration_seconds) || 0)
      .filter((n) => n > 0);
    const avgDuration = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;
    const messages = sessions.reduce(
      (sum: number, s: any) => sum + (Number(s.total_messages) || 0),
      0
    );
    const inbound = sessions.filter(
      (s: any) => resolveSessionCallType(s) === "inbound"
    ).length;
    const outbound = sessions.filter(
      (s: any) => resolveSessionCallType(s) === "outbound"
    ).length;
    return { total, avgDuration, messages, inbound, outbound };
  }, [sessions, totalSessions]);

  // Client-side fallback filter (backend may not honor q/search on this route).
  const displayed = useMemo(() => {
    const sq = searchQuery.trim().toLowerCase();
    if (!sq) return sessions;
    return sessions.filter((s: any) => {
      const haystack = [
        s.session_id,
        s.id,
        s.call_id,
        resolveSessionLeadNumber(s),
        resolveSessionCallType(s),
        s?.contact_name,
        s?.contact?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(sq);
    });
  }, [sessions, searchQuery]);

  const statCards = [
    {
      icon: History,
      label: "Total Sessions",
      value: stats.total.toLocaleString(),
      cls: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    },
    {
      icon: Clock,
      label: "Avg Duration",
      value: formatDuration(stats.avgDuration),
      cls: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
    },
    {
      icon: MessageSquare,
      label: "Messages",
      value: stats.messages.toLocaleString(),
      cls: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: PhoneIncoming,
      label: "Inbound",
      value: stats.inbound.toLocaleString(),
      cls: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
    },
    {
      icon: PhoneOutgoing,
      label: "Outbound",
      value: stats.outbound.toLocaleString(),
      cls: "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400",
    },
  ];

  return (
    <GlassCard>
      <div className="p-4 lg:p-5">
        {/* Header + Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-white leading-tight">
                Analytics &amp; Call History
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Performance and session history for this agent
              </p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "analytics"
                  ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "history"
                  ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Call History
            </button>
          </div>
        </div>

        {/* ── Analytics tab ─────────────────────────────────────────────── */}
        {activeTab === "analytics" && (
          <div>
            <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
              {statCards.map(({ icon: Icon, label, value, cls }) => (
                <div
                  key={label}
                  className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-1.5 sm:mb-2 ${cls}`}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-white leading-none truncate">
                    {loading ? "—" : value}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    {label}
                  </p>
                </div>
              ))}
            </div>
            {!loading && stats.total === 0 && (
              <div className="text-center py-8 mt-2">
                <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No sessions yet for this agent
                </p>
              </div>
            )}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
              Averages are computed from the latest {sessions.length} loaded
              session{sessions.length !== 1 ? "s" : ""}.
            </p>
          </div>
        )}

        {/* ── Call History tab ──────────────────────────────────────────── */}
        {activeTab === "history" && (
          <div>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search sessions..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : error ? (
              <div className="text-center py-10">
                <MessageSquare className="w-10 h-10 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            ) : displayed.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {searchQuery.trim()
                    ? `No sessions match “${searchQuery.trim()}”`
                    : "No call history yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayed.map((session: any) => {
                  const type = resolveSessionCallType(session);
                  const number = resolveSessionLeadNumber(session);
                  const label = formatCallTypeLabel(type);
                  const TypeIcon =
                    type === "inbound"
                      ? PhoneIncoming
                      : type === "outbound"
                        ? PhoneOutgoing
                        : Phone;
                  const deviceType =
                    session?.device?.device_type || session.deviceType || "";
                  const DeviceIcon = getDeviceIcon(deviceType);
                  const deviceLabel = deviceType
                    ? deviceType.charAt(0).toUpperCase() +
                      deviceType.slice(1).toLowerCase()
                    : "Desktop";
                  const ip = session?.user_ip || session?.ip;
                  const sessionKey = session.id || session.call_id;
                  const isResolvingLocation = loadingLocations.has(sessionKey);
                  const locationData: IPLocationResult | null =
                    normalizeSessionLocation(session.location, ip) ||
                    (session.location as IPLocationResult | null);
                  const locationText = formatIPLocationLabel(locationData, ip);

                  return (
                    <div
                      key={session.session_id || session.id || session.call_id}
                      className="group p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
                    >
                      {/* Top row: session id + view */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                            <Phone className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Session ID
                            </p>
                            <span className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400 truncate block">
                              {session.session_id ||
                                session.id ||
                                session.call_id ||
                                "N/A"}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedSession(session)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all text-xs font-medium flex-shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {label && (
                          <div
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${callTypeBadgeClass(type)}`}
                          >
                            <TypeIcon className="w-3.5 h-3.5" />
                            {label}
                          </div>
                        )}
                        {number && (
                          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/30 px-3 py-1.5 rounded-lg text-xs">
                            <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                              {number}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/30 px-3 py-1.5 rounded-lg text-xs">
                          <DeviceIcon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {deviceLabel}
                          </span>
                        </div>
                        {isResolvingLocation ? (
                          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/40 px-3 py-1.5 rounded-lg text-xs animate-pulse">
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 border-t-slate-600 dark:border-slate-600 dark:border-t-slate-300 animate-spin" />
                            <span className="font-medium text-slate-600 dark:text-slate-400">
                              Resolving...
                            </span>
                          </div>
                        ) : locationText &&
                          !locationText.startsWith("Resolving") ? (
                          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/30 px-3 py-1.5 rounded-lg text-xs">
                            <MapPin className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {locationText}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-lg">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Date
                          </p>
                          <p className="text-sm text-slate-800 dark:text-white font-semibold">
                            {formatDate(session.start_time)}
                          </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-lg">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Time
                          </p>
                          <p className="text-sm text-slate-800 dark:text-white font-semibold">
                            {formatTime(session.start_time)}
                          </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-lg">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Duration
                          </p>
                          <p className="text-sm text-slate-800 dark:text-white font-semibold">
                            {formatDuration(session.duration_seconds)}
                          </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-lg">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Messages
                          </p>
                          <p className="text-sm text-slate-800 dark:text-white font-semibold">
                            {session.total_messages || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalSessions}
                itemsPerPage={PAGE_SIZE}
                onPageChange={(page) => fetchSessions(page)}
                className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700"
              />
            )}
          </div>
        )}
      </div>

      {/* Transcript modal */}
      {selectedSession && (
        <SessionTranscriptModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </GlassCard>
  );
};

export default AgentAnalyticsPanel;
