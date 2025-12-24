import { useState, useEffect } from "react";
import GlassCard from "../../components/GlassCard";
import { useAuth } from "../../contexts/AuthContext";
import { isDeveloperUser } from "../../lib/utils";
import Slider from "react-slick";
import { agentAPI } from "../../services/agentAPI";
import SessionTranscriptModal from "../Employees/agents/SessionTranscriptModal";
import Pagination from "../../components/Pagination";
import {
  TrendingUp,
  Clock,
  Users,
  MessageSquare,
  Eye,
  Filter,
  Search,
  ChevronDown,
  Phone,
  MapPin,
  XCircle,
} from "lucide-react";

const Analytics = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState(""); // For input value only
  const [searchQuery, setSearchQuery] = useState(""); // For API calls
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [agentsList, setAgentsList] = useState<any[]>([]);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const pageSize = 10;

  // Date range state
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
    preset: "all", // all, today, week, month, custom
  });

  // Check if current user is developer
  const isDeveloper = isDeveloperUser(user?.email);

  // Get real agents from API
  const employees = isDeveloper ? agentsList : [];

  // Debounced search effect - separate from API calls
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery(searchTerm);
      if (currentPage !== 1) {
        setCurrentPage(1); // Reset to first page for new search
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  // Reset to first page when filters change (but not search - handled above)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [deviceFilter, dateRange]);

  // Load agents on mount
  useEffect(() => {
    const fetchAgents = async () => {
      if (!isDeveloper) return;

      try {
        console.log("🚀 Fetching agents...");
        const fetchedAgents = await agentAPI.getAgents();
        setAgentsList(fetchedAgents || []);
        console.log("✅ Agents loaded:", fetchedAgents.length);

        // Auto-select first agent
        if (fetchedAgents.length > 0 && !selectedEmployee) {
          console.log(
            "✅ Setting default agent:",
            fetchedAgents[0].id,
            fetchedAgents[0].name
          );
          setSelectedEmployee(fetchedAgents[0].id);
        }
      } catch (error) {
        console.error("❌ Error fetching agents:", error);
      }
    };

    fetchAgents();
  }, [isDeveloper]);

  // Fetch session history from API with pagination
  const fetchSessionHistory = async (agentId: string, page: number = 1) => {
    if (!agentId) {
      console.log("⚠️ No agent ID provided, skipping fetch");
      return;
    }

    setSessionLoading(true);
    setSessionError(null);

    try {
      console.log("🔄 Fetching sessions for agent:", agentId, "page:", page);
      
      // Build API query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });

      // Add device type filter
      if (deviceFilter !== "all") {
        queryParams.append("deviceType", deviceFilter);
      }

      // Add date range filters
      if (dateRange.startDate) {
        queryParams.append("startDate", dateRange.startDate);
      }
      if (dateRange.endDate) {
        queryParams.append("endDate", dateRange.endDate);
      }

      // Add search term if exists
      if (searchQuery.trim()) {
        queryParams.append("q", searchQuery.trim());
      }

      // Convert query params to string
      const payload = queryParams.toString();
      console.log("API Query Params:", payload);
      
      // Call API with query parameters
      const response = await agentAPI.getAgentSessions(payload, agentId);

      // Use server-side pagination data
      const sessions = response?.sessions || [];
      const pagination = response?.pagination || {};

      setSessionHistory(sessions);
      setTotalPages(pagination.totalPages || 1);
      setTotalSessions(pagination.total || sessions.length);
      setCurrentPage(pagination.page || page);

      console.log("✅ Session history loaded:", sessions.length, "sessions");
      console.log("📊 Pagination:", pagination);
    } catch (error) {
      console.error("❌ Error fetching session history:", error);
      setSessionError(
        error instanceof Error
          ? error.message
          : "Failed to load session history"
      );
      setSessionHistory([]);
      setTotalPages(1);
      setTotalSessions(0);
    } finally {
      setSessionLoading(false);
    }
  };

  // Fetch sessions when employee changes (reset to page 1)
  useEffect(() => {
    console.log(
      "📊 Analytics useEffect triggered - isDeveloper:",
      isDeveloper,
      "selectedEmployee:",
      selectedEmployee
    );
    if (isDeveloper && selectedEmployee) {
      setCurrentPage(1);
      fetchSessionHistory(selectedEmployee, 1);
    }
  }, [selectedEmployee, isDeveloper, deviceFilter, dateRange, searchQuery]);

  // Filter handlers
  const handleDeviceTypeFilter = (deviceType: string) => {
    setDeviceFilter(deviceType);
  };

  const handleDatePresetFilter = (preset: string) => {
    const today = new Date();
    let startDate = "";
    let endDate = "";

    switch (preset) {
      case "today":
        startDate = today.toISOString().split("T")[0];
        endDate = startDate;
        break;
      case "week":
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split("T")[0];
        endDate = today.toISOString().split("T")[0];
        break;
      case "month":
        const monthAgo = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          today.getDate()
        );
        startDate = monthAgo.toISOString().split("T")[0];
        endDate = today.toISOString().split("T")[0];
        break;
      case "all":
      default:
        startDate = "";
        endDate = "";
        break;
    }

    setDateRange({
      startDate,
      endDate,
      preset,
    });
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSearchQuery("");
    setDeviceFilter("all");
    setDateRange({
      startDate: "",
      endDate: "",
      preset: "all",
    });
    setCurrentPage(1);
  };

  // Calculate dynamic stats
  const calculateStats = () => {
    if (!isDeveloper) {
      return {
        totalSessions: 0,
        performanceScore: 0,
        avgDuration: 0,
        activeAgents: 0,
      };
    }

    const avgDuration =
      sessionHistory.length > 0
        ? sessionHistory.reduce(
            (sum, s) => sum + (s.duration_seconds || 0),
            0
          ) / sessionHistory.length
        : 0;

    // Calculate performance score based on average duration (higher duration = better engagement)
    const performanceScore =
      avgDuration > 0
        ? Math.min(100, Math.round((avgDuration / 300) * 100))
        : 0;

    return {
      totalSessions: totalSessions,
      performanceScore,
      avgDuration,
      activeAgents: agentsList.length,
    };
  };

  const dynamicStats = calculateStats();

  const formatDurationStat = (seconds: number) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const stats = isDeveloper
    ? [
        {
          title: "Sessions",
          subtitle: "Total",
          value: dynamicStats.totalSessions.toString(),
          change:
            sessionHistory.length > 0
              ? `${sessionHistory.length} on page`
              : "No data",
          trend: "neutral",
          icon: MessageSquare,
          color: "blue",
        },
        {
          title: "Performance",
          subtitle: "Score",
          value: `${dynamicStats.performanceScore}%`,
          change: dynamicStats.performanceScore > 50 ? "Good" : "Low",
          trend: dynamicStats.performanceScore > 50 ? "positive" : "neutral",
          icon: TrendingUp,
          color: "green",
        },
        {
          title: "Duration",
          subtitle: "Average",
          value: formatDurationStat(dynamicStats.avgDuration),
          change:
            sessionHistory.length > 0
              ? `${sessionHistory.length} sessions`
              : "No data",
          trend: "neutral",
          icon: Clock,
          color: "purple",
        },
        {
          title: "Agents",
          subtitle: "Active",
          value: dynamicStats.activeAgents.toString(),
          change: dynamicStats.activeAgents > 0 ? "Online" : "Offline",
          trend: "neutral",
          icon: Users,
          color: "orange",
        },
      ]
    : [
        {
          title: "Sessions",
          subtitle: "Total",
          value: "0",
          change: "No data",
          trend: "neutral",
          icon: MessageSquare,
          color: "blue",
        },
        {
          title: "Performance",
          subtitle: "Score",
          value: "0%",
          change: "No data",
          trend: "neutral",
          icon: TrendingUp,
          color: "green",
        },
        {
          title: "Duration",
          subtitle: "Average",
          value: "0s",
          change: "No data",
          trend: "neutral",
          icon: Clock,
          color: "purple",
        },
        {
          title: "Demo",
          subtitle: "All-Time Active",
          value: "",
          change: "",
          trend: "neutral",
          icon: Users,
          color: "orange",
        },
      ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Header with Employee Selector */}
      <div className="mb-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="relative">
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              disabled={!isDeveloper}
              className={`text-sm sm:text-base font-semibold px-3 py-1.5 pr-8 rounded-lg border-2 appearance-none cursor-pointer transition-all ${
                isDeveloper
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700 text-slate-800 dark:text-white hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md"
                  : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              {employees.map((employee) => (
                <option
                  key={employee.id}
                  value={employee.id}
                  className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                >
                  {employee.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${
                isDeveloper
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-400"
              }`}
            />
          </div>
          {isDeveloper && employees.length > 1 && (
            <span className="text-xs text-slate-500 dark:text-slate-400 italic">
              ({employees.length} more agents)
            </span>
          )}
        </div>
      </div>

      {/* Stats Section - Mobile Slider, Desktop Grid */}
      <div className="stats-section">
        {/* Mobile Slider (sm and below) */}
        <div className="block sm:hidden">
          <Slider
            dots={true}
            infinite={false}
            speed={300}
            slidesToShow={2.2}
            slidesToScroll={1}
            swipeToSlide={true}
            touchThreshold={10}
            arrows={false}
            className="mobile-stats-slider"
            customPaging={() => (
              <div className="w-2 h-2 bg-gray-300 rounded-full hover:bg-gray-600 transition-colors duration-200"></div>
            )}
            dotsClass="slick-dots !bottom-[-20px] !flex !justify-center !gap-2"
          >
            {stats.map((stat, index) => (
              <div key={index} className="px-1">
                <GlassCard hover>
                  <div className="p-3 min-h-[90px]">
                    <div className="flex items-center gap-1 mb-2">
                      <div className="p-1 rounded-lg common-bg-icons">
                        <stat.icon
                          className={`w-3.5 h-3.5 ${
                            stat.color === "blue"
                              ? "text-blue-600 dark:text-blue-400"
                              : stat.color === "green"
                              ? "text-green-600 dark:text-green-400"
                              : stat.color === "purple"
                              ? "text-purple-600 dark:text-purple-400"
                              : "text-orange-600 dark:text-orange-400"
                          }`}
                        />
                      </div>
                      {stat.change && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          {stat.change}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-800 dark:text-white mb-0.5">
                        {stat.value}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
                        {stat.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 leading-tight">
                        {stat.subtitle}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            ))}
          </Slider>
        </div>

        {/* Desktop Grid (sm and above) */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, index) => (
            <GlassCard key={index} hover>
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg common-bg-icons">
                    <stat.icon
                      className={`w-4 sm:w-5 h-4 sm:h-5 ${
                        stat.color === "blue"
                          ? "text-blue-600 dark:text-blue-400"
                          : stat.color === "green"
                          ? "text-green-600 dark:text-green-400"
                          : stat.color === "purple"
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-orange-600 dark:text-orange-400"
                      }`}
                    />
                  </div>
                  {stat.change && (
                    <span className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                      {stat.change}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {stat.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    {stat.subtitle}
                  </p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      <GlassCard>
        <div className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
              Session History ({sessionHistory.length} sessions)
            </h3>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={!isDeveloper}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm touch-manipulation ${
                  isDeveloper
                    ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                    : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 cursor-not-allowed"
                }`}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={deviceFilter}
                  onChange={(e) => handleDeviceTypeFilter(e.target.value)}
                  disabled={!isDeveloper}
                  className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm appearance-none pr-8 touch-manipulation ${
                    isDeveloper
                      ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                      : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <option value="all">All Devices</option>
                  <option value="mobile">Mobile</option>
                  <option value="desktop">Desktop</option>
                  <option value="tablet">Tablet</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={dateRange.preset}
                  onChange={(e) => handleDatePresetFilter(e.target.value)}
                  disabled={!isDeveloper}
                  className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm appearance-none pr-8 touch-manipulation ${
                    isDeveloper
                      ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                      : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Clear Filters Button - Icon */}
              {(searchTerm ||
                deviceFilter !== "all" ||
                dateRange.preset !== "all") && (
                <button
                  onClick={handleResetFilters}
                  disabled={!isDeveloper}
                  className={`p-2 rounded-lg border transition-colors ${
                    isDeveloper
                      ? "border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-900/20"
                      : "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50"
                  }`}
                  title="Clear all filters"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}

              <button
                disabled={!isDeveloper}
                className={`p-2 border rounded-lg transition-colors ${
                  isDeveloper
                    ? "border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    : "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50"
                }`}
                onClick={() => fetchSessionHistory(selectedEmployee, currentPage)}
                title="Refresh sessions"
              >
                <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>

          {/* Session Cards */}
          <div className="space-y-3">
            {sessionLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : sessionError ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-base text-red-600 dark:text-red-400 mb-1">
                  Error loading sessions
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  {sessionError}
                </p>
              </div>
            ) : sessionHistory.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-base text-slate-600 dark:text-slate-400 mb-1">
                  No sessions yet
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  Session history will appear here once agents start handling
                  calls
                </p>
              </div>
            ) : (
              sessionHistory.map((session) => {
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

                return (
                  <div
                    key={session.session_id || session.id}
                    className="group p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 space-y-3">
                        {/* Session ID with Eye Button */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                              <Phone className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Session ID</p>
                              <span className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
                                {session.session_id || "N/A"}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedSession(session)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all duration-200 text-xs font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">View Details</span>
                          </button>
                        </div>

                        {/* Agent Info */}
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30 px-3 py-1.5 rounded-lg">
                          {session.agent?.name && (
                            <>
                              <span className="font-medium">{session.agent.name}</span>
                              <span>•</span>
                            </>
                          )}
                          <MapPin className="w-3 h-3" />
                          <span>{session.user_ip || "Unknown IP"}</span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-full text-xs font-medium border border-green-200 dark:border-green-800">
                            {session.status || "Completed"}
                          </span>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                              Time
                            </p>
                            <p className="text-sm text-slate-800 dark:text-white font-semibold">
                              {formatTime(session.start_time)}
                            </p>
                          </div>
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
                              Messages
                            </p>
                            <p className="text-sm text-slate-800 dark:text-white font-semibold">
                              {session.total_messages || 0}
                            </p>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>
                            {session.location?.city ||
                              session.user_ip ||
                              "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {!sessionLoading && !sessionError && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalSessions}
              itemsPerPage={pageSize}
              onPageChange={(page) =>
                fetchSessionHistory(selectedEmployee, page)
              }
              className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700"
            />
          )}
        </div>
      </GlassCard>

      {/* Session Transcript Modal */}
      {selectedSession && (
        <SessionTranscriptModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
};

export default Analytics;
