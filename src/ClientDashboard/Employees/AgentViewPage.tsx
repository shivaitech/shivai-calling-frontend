import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import GlassCard from "../../components/GlassCard";
import { agentAPI } from "../../services/agentAPI";
import appToast from "../../components/AppToast";
import { formatAgentLanguages } from "../../lib/utils";
import {
  AgentWidgetCustomization,
  AgentQRModal,
  AgentIntegrationCode,
} from "./agents";
import { Agent } from "../../contexts/AgentContext";

import {
  ArrowLeft,
  Bot,
  QrCode,
  Edit,
  Play,
  Pause,
  Globe,
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  Lightbulb,
  Download,
  Zap,
  Phone,
  PhoneCall,
  Settings,
  X,
  Send,
  Mic,
  MicOff,
  UploadCloud,
  PauseCircle,
  Trash2,
  Languages,
  Volume2,
} from "lucide-react";

interface AgentViewPageProps {
  currentAgent: Agent;
  publishingAgents: Set<string>;

  // QR Modal
  showQRModal: boolean;
  setShowQRModal: (v: boolean) => void;

  // Test page
  openAgentTestPage: () => void;

  // Publish
  handlePublish: (id: string) => void;
  showPublishConfirm: boolean;
  handlePublishCancel: () => void;
  handlePublishConfirm: () => void;
  isPublishing: boolean;

  // Pause
  handlePause: (id: string) => void;
  showPauseConfirm: boolean;
  handlePauseCancel: () => void;
  handlePauseConfirm: () => void;
  isPausing: boolean;

  // Delete
  showDeleteConfirm: boolean;
  handleDeleteCancel: () => void;
  handleDeleteConfirm: () => void;
  isDeleting: boolean;

  // Test Chat modal
  showTestChat: boolean;
  setShowTestChat: (v: boolean) => void;
  room: any;
  setIsCallActive: (v: boolean) => void;
  setIsRecording: (v: boolean) => void;
  setConnectionStatus: (v: string) => void;
  setStatusMessage: (v: string) => void;
  callTimerInterval: number | null;
  setCallTimerInterval: (v: number | null) => void;
  setCallDuration: (v: number) => void;
  activeTestTab: "call" | "conversation";
  setActiveTestTab: (v: "call" | "conversation") => void;
  connectionStatus: string;
  statusMessage: string;
  isCallActive: boolean;
  callDuration: number;
  formatCallDuration: (seconds: number) => string;
  handleStartCall: () => void;
  isTestLoading: boolean;
  isConnecting: boolean;
  handleToggleMute: () => void;
  isMuted: boolean;
  handleEndCall: () => void;
  testConnection: () => void;
  messages: Array<{
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    source?: string;
  }>;
  testInput: string;
  setTestInput: (v: string) => void;
  handleTestSend: () => void;
}

const AgentViewPage: React.FC<AgentViewPageProps> = ({
  currentAgent,
  publishingAgents,
  showQRModal,
  setShowQRModal,
  openAgentTestPage,
  handlePublish,
  showPublishConfirm,
  handlePublishCancel,
  handlePublishConfirm,
  isPublishing,
  handlePause,
  showPauseConfirm,
  handlePauseCancel,
  handlePauseConfirm,
  isPausing,
  showDeleteConfirm,
  handleDeleteCancel,
  handleDeleteConfirm,
  isDeleting,
  showTestChat,
  setShowTestChat,
  room,
  setIsCallActive,
  setIsRecording,
  setConnectionStatus,
  setStatusMessage,
  callTimerInterval,
  setCallTimerInterval,
  setCallDuration,
  activeTestTab,
  setActiveTestTab,
  connectionStatus,
  statusMessage,
  isCallActive,
  callDuration,
  formatCallDuration,
  handleStartCall,
  isTestLoading,
  isConnecting,
  handleToggleMute,
  isMuted,
  handleEndCall,
  testConnection,
  messages,
  testInput,
  setTestInput,
  handleTestSend,
}) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [agentData, setAgentData] = useState<any>(null);

  // Fetch agent config data using same API as Edit page
  useEffect(() => {
    if (!id) return;

    const fetchAgentConfig = async () => {
      try {
        const { agent: fetchedAgent } = await agentAPI.getAgentConfig(id);
        setAgentData(fetchedAgent);
      } catch (error: any) {
        console.error("Error fetching agent config:", error);
        appToast.error("Failed to load agent data");
        navigate("/agents");
      }
    };

    fetchAgentConfig();
  }, [id, navigate]);

  // Re-fetch when navigating back from edit page with refreshed flag
  useEffect(() => {
    if (!id || !location.state?.refreshed) return;
    const fetchLatest = async () => {
      try {
        const { agent: fetchedAgent } = await agentAPI.getAgentConfig(id);
        setAgentData(fetchedAgent);
      } catch {}
    };
    fetchLatest();
    // Clear the flag so it doesn't re-fire on subsequent renders
    navigate(location.pathname, { replace: true, state: {} });
  }, [id, location.state?.refreshed, navigate, location.pathname]);

  // Listen for agentUpdated event (e.g. name change from widget customization)
  useEffect(() => {
    const handleAgentUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.agentId && String(detail.agentId) === String(id)) {
        setAgentData((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            ...detail.updatedFields,
          };
        });
      }
    };
    window.addEventListener("agentUpdated", handleAgentUpdate);
    return () => window.removeEventListener("agentUpdated", handleAgentUpdate);
  }, [id]);

  // Use fetched agent data if available, otherwise use prop
  const agent = agentData || currentAgent;

  // Provide default stats if not available
  const stats = agent?.stats || {
    conversations: 0,
    successRate: 0,
    avgResponseTime: 0,
    activeUsers: 0,
  };

  const isActive =
    agent?.status === "Published" || (agent as any)?.is_active;

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 w-full">
      <GlassCard>
        <div className="p-3 sm:p-4 md:p-6">
          {/* Mobile: Stacked layout */}
          <div className="flex flex-col gap-3 sm:hidden mb-4">
            {/* Top row: Back button + Agent info */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/agents")}
                className="common-button-bg2 p-2 rounded-lg flex-shrink-0 touch-manipulation"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>

              <div className="w-9 h-9 common-bg-icons flex items-center justify-center flex-shrink-0 rounded-lg">
                <Bot className="w-4 h-4 text-black dark:text-white" />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-bold text-slate-800 dark:text-white leading-tight truncate">
                  {agent.name}
                </h1>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                    isActive
                      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                  }`}
                >
                  {isActive ? "Live" : "Unpublished"}
                </span>
              </div>
            </div>

            {/* Action buttons row - Mobile */}
            <div className="flex items-center gap-2 flex-wrap">
              {isActive && (
                <button
                  onClick={() => setShowQRModal(true)}
                  className="common-button-bg2 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg touch-manipulation text-xs font-medium"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  QR
                </button>
              )}
              <button
                onClick={() => navigate(`/agents/${agent.id}/edit`)}
                className="common-button-bg2 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg touch-manipulation text-xs font-medium"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </button>

              {isActive && (
                <>
                  <button
                    onClick={openAgentTestPage}
                    className="common-button-bg flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg touch-manipulation text-xs font-medium text-white"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Test
                  </button>
                  <button
                    onClick={() => handlePause(agent.id)}
                    disabled={publishingAgents.has(agent.id)}
                    className={`common-button-bg2 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg touch-manipulation text-xs font-medium ${
                      publishingAgents.has(agent.id)
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {publishingAgents.has(agent.id) ? (
                      <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    ) : (
                      <Pause className="w-3.5 h-3.5" />
                    )}
                    {publishingAgents.has(agent.id) ? "..." : "Pause"}
                  </button>
                </>
              )}

              {!isActive && (
                <button
                  onClick={() => handlePublish(agent.id)}
                  disabled={publishingAgents.has(agent.id)}
                  className={`common-button-bg flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg touch-manipulation text-xs font-medium text-white ${
                    publishingAgents.has(agent.id)
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {publishingAgents.has(agent.id) ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  {publishingAgents.has(agent.id) ? "..." : "Publish"}
                </button>
              )}
            </div>
          </div>

          {/* Tablet/Desktop: Horizontal layout */}
          <div className="hidden sm:flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => navigate("/agents")}
                className="common-button-bg2 p-2.5 rounded-xl flex-shrink-0 touch-manipulation"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>

              <div className="w-12 h-12 common-bg-icons flex items-center justify-center flex-shrink-0 rounded-xl">
                <Bot className="w-6 h-6 text-black dark:text-white" />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-white leading-tight truncate">
                  {agent.name}
                </h1>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                    isActive
                      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                  }`}
                >
                  {isActive ? "Live" : "Unpublished"}
                </span>
              </div>
            </div>

            {/* Action buttons - Tablet/Desktop */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isActive && (
                <button
                  onClick={() => setShowQRModal(true)}
                  className="common-button-bg2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg touch-manipulation"
                >
                  <QrCode className="w-4 h-4" />
                  <span className="text-sm font-medium">QR</span>
                </button>
              )}
              <button
                onClick={() => navigate(`/agents/${agent.id}/edit`)}
                className="common-button-bg2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg touch-manipulation"
              >
                <Edit className="w-4 h-4" />
                <span className="text-sm font-medium">Edit</span>
              </button>

              {isActive && (
                <>
                  <button
                    onClick={openAgentTestPage}
                    className="common-button-bg flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg touch-manipulation"
                  >
                    <Play className="w-4 h-4" />
                    <span className="text-sm font-medium text-white">Test</span>
                  </button>
                  <button
                    onClick={() => handlePause(agent.id)}
                    disabled={publishingAgents.has(agent.id)}
                    className={`common-button-bg2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg touch-manipulation ${
                      publishingAgents.has(agent.id)
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {publishingAgents.has(agent.id) ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    ) : (
                      <Pause className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {publishingAgents.has(agent.id) ? "..." : "Pause"}
                    </span>
                  </button>
                </>
              )}

              {!isActive && (
                <button
                  onClick={() => handlePublish(agent.id)}
                  disabled={publishingAgents.has(agent.id)}
                  className={`common-button-bg flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg touch-manipulation ${
                    publishingAgents.has(agent.id)
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {publishingAgents.has(agent.id) ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium text-white">
                    {publishingAgents.has(agent.id) ? "..." : "Publish"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-1">
                <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">
                  Language
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white truncate">
                {formatAgentLanguages((agent as any).language)}
              </p>
            </div>

            <div className="p-2 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-1">
                <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">
                  Voice
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white truncate">
                {agent.voice}
              </p>
            </div>

            <div className="p-2 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">
                  Persona
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white truncate">
                {(agent as any).personality || agent.persona}
              </p>
            </div>

            <div className="p-2 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">
                  Created
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white truncate">
                {new Date(agent.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Multilingual cards — shown only when "multilingual" is in the language array */}
            {Array.isArray((agent as any).language) &&
              (agent as any).language.some(
                (l: string) => String(l).toLowerCase() === "multilingual"
              ) && (
                <>
                  <div className="p-2 sm:p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700/50 overflow-hidden">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Languages className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs font-medium text-purple-600 dark:text-purple-400">
                        Multilingual Mode
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                      Enabled
                    </p>
                  </div>

                  <div className="p-2 sm:p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700/50 overflow-hidden">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs font-medium text-purple-600 dark:text-purple-400">
                        Multilingual Voice
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-purple-700 dark:text-purple-300 truncate capitalize">
                      {(agent as any).multilingual_voice || "—"}
                    </p>
                  </div>
                </>
              )}
          </div>
        </div>
      </GlassCard>

      {/* <div className="hidden">
        <div className="flex gap-2 overflow-x-auto pb-2 px-0.5 snap-x snap-mandatory scrollbar-hide -mx-0.5">
          {[
            {
              icon: MessageSquare,
              value: stats.conversations.toLocaleString(),
              label: "Conversations",
              colorClass: "bg-blue-50 dark:bg-blue-900/20",
              iconColor: "text-blue-600 dark:text-blue-400",
              count: stats.conversations,
            },
            {
              icon: CheckCircle,
              value: `${stats.successRate}%`,
              label: "Success Rate",
              colorClass: "bg-green-50 dark:bg-green-900/20",
              iconColor: "text-green-600 dark:text-green-400",
              count: stats.successRate,
            },
            {
              icon: Clock,
              value: `${stats.avgResponseTime}s`,
              label: "Avg Response",
              colorClass: "bg-purple-50 dark:bg-purple-900/20",
              iconColor: "text-purple-600 dark:text-purple-400",
              count: stats.avgResponseTime,
            },
            {
              icon: Users,
              value: stats.activeUsers,
              label: "Active Users",
              colorClass: "bg-orange-50 dark:bg-orange-900/20",
              iconColor: "text-orange-600 dark:text-orange-400",
              count: stats.activeUsers,
            },
          ].map(({ icon: Icon, value, label, colorClass, iconColor, count }) => (
            <GlassCard
              key={label}
              className="flex-shrink-0 w-[calc(50%-4px)] min-w-[120px] max-w-[140px] snap-start"
            >
              <div className="p-2.5">
                <div className="flex flex-col items-center gap-0.5">
                  <div
                    className={`w-6 h-6 ${colorClass} rounded-md flex items-center justify-center mb-1`}
                  >
                    <Icon className={`w-3 h-3 ${iconColor}`} />
                  </div>
                  <p className="text-base font-bold text-slate-800 dark:text-white">
                    {value}
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 text-center leading-tight">
                    {label}
                  </p>
                  {count > 0 ? (
                    <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
                      No data
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 dark:text-slate-500">
                      No data
                    </span>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {[
          {
            icon: MessageSquare,
            value: stats.conversations.toLocaleString(),
            label: "Conversations",
            colorClass: "bg-blue-50 dark:bg-blue-900/20",
            iconColor: "text-blue-600 dark:text-blue-400",
            count: stats.conversations,
          },
          {
            icon: CheckCircle,
            value: `${stats.successRate}%`,
            label: "Success Rate",
            colorClass: "bg-green-50 dark:bg-green-900/20",
            iconColor: "text-green-600 dark:text-green-400",
            count: stats.successRate,
          },
          {
            icon: Clock,
            value: `${stats.avgResponseTime}s`,
            label: "Avg Response",
            colorClass: "bg-purple-50 dark:bg-purple-900/20",
            iconColor: "text-purple-600 dark:text-purple-400",
            count: stats.avgResponseTime,
          },
          {
            icon: Users,
            value: stats.activeUsers,
            label: "Active Users",
            colorClass: "bg-orange-50 dark:bg-orange-900/20",
            iconColor: "text-orange-600 dark:text-orange-400",
            count: stats.activeUsers,
          },
        ].map(({ icon: Icon, value, label, colorClass, iconColor, count }) => (
          <GlassCard
            key={label}
            className="hover:shadow-md transition-all duration-200"
          >
            <div className="p-3 md:p-3.5">
              <div className="flex items-center justify-between mb-2 gap-2">
                <div
                  className={`w-8 h-8 md:w-10 md:h-10 ${colorClass} rounded-lg flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-4 h-4 md:w-5 md:h-5 ${iconColor}`} />
                </div>
                <div className="text-right min-w-0">
                  <p className="text-lg md:text-xl font-bold text-slate-800 dark:text-white truncate">
                    {value}
                  </p>
                  <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400">
                    {label}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-500">
                  {count > 0 ? "No data" : "No data yet"}
                </span>
              </div>
            </div>
          </GlassCard>
        ))}
      </div> */}

      {/* Widget Customization Section */}
      <div className="mt-3 sm:mt-4 lg:mt-6">
        <AgentWidgetCustomization
          agentId={agent.id}
          agentName={agent.name}
          isPublished={true}
        />
      </div>

      {/* Integration Code Section */}
      {isActive && (
        <div className="mt-4 sm:mt-6">
          <AgentIntegrationCode currentAgent={agent} />
        </div>
      )}

      {showQRModal && (
        <AgentQRModal
          agent={agent}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white text-center mb-2">
                Delete Agent?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
                Are you sure you want to delete this agent? This action cannot
                be undone and all associated data will be permanently removed.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 sm:mt-6">
        {/* Mobile */}
        <div className="lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                navigate(`/agents/${agent.id}/train`, {
                  state: { from: "view" },
                })
              }
              className="common-bg-icons hover:shadow-md transition-all duration-200 p-2 rounded-lg touch-manipulation group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-white">
                  Train
                </p>
              </div>
            </button>

            <button className="common-bg-icons hover:shadow-md transition-all duration-200 p-2 rounded-lg touch-manipulation group">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Download className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-white">
                  Export
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden lg:block">
          <GlassCard>
            <div className="p-4 lg:p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                  Quick Actions
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() =>
                    navigate(`/agents/${agent.id}/train`, {
                      state: { from: "view" },
                    })
                  }
                  className="common-bg-icons hover:shadow-md transition-all duration-200 p-4 rounded-lg touch-manipulation group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        Train Agent
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Improve responses
                      </p>
                    </div>
                  </div>
                </button>

                <button className="common-bg-icons hover:shadow-md transition-all duration-200 p-4 rounded-lg touch-manipulation group">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Download className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        Export Data
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Download config
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Test Chat Modal - Only for published agents */}
      {showTestChat && agent.status === "Published" && (
        <div
          className="fixed inset-0 bg-black/20 z-[60] flex items-center justify-center p-3 sm:p-4 -top-8"
          onTouchMove={(e) =>
            e.target === e.currentTarget && e.preventDefault()
          }
        >
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl w-full max-w-2xl h-[80vh] max-h-[600px] relative flex flex-col shadow-xl border border-white/20 dark:border-slate-700/50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Test {agent.name}
                </h3>
              </div>
              <button
                onClick={async () => {
                  if (room) {
                    try {
                      await room.disconnect();
                    } catch (error) {
                      console.error("Error disconnecting on close:", error);
                    }
                  }
                  setShowTestChat(false);
                  setIsCallActive(false);
                  setIsRecording(false);
                  setConnectionStatus("disconnected");
                  setStatusMessage("Ready to connect");
                  if (callTimerInterval) {
                    clearInterval(callTimerInterval);
                    setCallTimerInterval(null);
                  }
                  setCallDuration(0);
                  setActiveTestTab("call");
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200/50 dark:border-slate-700/50">
              {[
                { id: "call", label: "Voice", icon: Phone },
                { id: "conversation", label: "Conversation", icon: MessageSquare },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTestTab(id as "call" | "conversation")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors ${
                    activeTestTab === id
                      ? "text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white bg-slate-50/50 dark:bg-slate-800/50"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
              {/* Call Tab */}
              {activeTestTab === "call" && (
                <div className="h-full flex flex-col items-center justify-center p-6">
                  <div className="text-center mb-6">
                    <div
                      className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 mx-auto transition-all ${
                        connectionStatus === "connected"
                          ? "bg-green-100 dark:bg-green-900/20"
                          : connectionStatus === "connecting"
                            ? "bg-yellow-100 dark:bg-yellow-900/20 animate-pulse"
                            : "bg-slate-100 dark:bg-slate-800/50"
                      }`}
                    >
                      <Phone
                        className={`w-8 h-8 ${
                          connectionStatus === "connected"
                            ? "text-green-600 dark:text-green-400"
                            : connectionStatus === "connecting"
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-slate-400"
                        }`}
                      />
                    </div>

                    <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-1">
                      {connectionStatus === "connected"
                        ? "Connected"
                        : connectionStatus === "connecting"
                          ? "Connecting..."
                          : "Ready to Call"}
                    </h3>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {statusMessage}
                    </p>

                    {isCallActive && (
                      <p className="text-sm font-mono text-slate-600 dark:text-slate-300 mt-2">
                        {formatCallDuration(callDuration)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {!isCallActive && !isConnecting ? (
                      <>
                        <button
                          onClick={handleStartCall}
                          disabled={isTestLoading || isConnecting}
                          className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          <PhoneCall className="w-4 h-4" />
                          {isConnecting ? "Connecting..." : "Start Call"}
                        </button>

                        <button
                          onClick={testConnection}
                          className="flex items-center gap-2 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-sm"
                        >
                          <Settings className="w-4 h-4" />
                          Test
                        </button>
                      </>
                    ) : isCallActive ? (
                      <>
                        <button
                          onClick={handleToggleMute}
                          className={`p-3 rounded-xl transition-colors ${
                            isMuted
                              ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                              : "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                          }`}
                          title={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted ? (
                            <MicOff className="w-5 h-5" />
                          ) : (
                            <Mic className="w-5 h-5" />
                          )}
                        </button>

                        <button
                          onClick={handleEndCall}
                          className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                          title="End Call"
                        >
                          <Phone className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                        <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
                        <span>Connecting...</span>
                      </div>
                    )}
                  </div>

                  {isCallActive && (
                    <div className="mt-6 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <div
                          className={`w-2 h-2 rounded-full ${!isMuted ? "bg-green-500" : "bg-red-500"}`}
                        />
                        {!isMuted ? "Listening" : "Muted"}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Conversation Tab */}
              {activeTestTab === "conversation" && (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Start a conversation to see messages
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex mb-4 ${message.isUser ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`flex gap-3 max-w-[80%] ${message.isUser ? "flex-row-reverse" : ""}`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                message.isUser
                                  ? "bg-blue-500 text-white"
                                  : "bg-green-500 text-white"
                              }`}
                            >
                              <span className="text-sm font-medium">
                                {message.isUser ? "U" : "AI"}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                  {message.isUser ? "You" : "AI Employee"}
                                </span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  {message.timestamp.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {message.source && (
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      message.source === "voice"
                                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                                        : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                    }`}
                                  >
                                    {message.source === "voice" ? "🎙️" : "💬"}
                                  </span>
                                )}
                              </div>
                              <div
                                className={`px-4 py-2 rounded-2xl text-sm ${
                                  message.isUser
                                    ? "bg-blue-500 text-white"
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                                }`}
                              >
                                {message.text}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {isTestLoading && (
                      <div className="flex justify-start mb-4">
                        <div className="flex gap-3 max-w-[80%]">
                          <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium">AI</span>
                          </div>
                          <div className="flex flex-col">
                            <div className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" />
                                <div
                                  className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"
                                  style={{ animationDelay: "0.1s" }}
                                />
                                <div
                                  className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"
                                  style={{ animationDelay: "0.2s" }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={testInput}
                        onChange={(e) => setTestInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !isTestLoading) {
                            handleTestSend();
                          }
                        }}
                        placeholder={
                          connectionStatus === "connected"
                            ? "Type a message or use voice..."
                            : "Type a message..."
                        }
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 text-slate-700 dark:text-slate-300 text-sm placeholder-slate-400 dark:placeholder-slate-500"
                        disabled={isTestLoading}
                      />
                      <button
                        onClick={handleTestSend}
                        disabled={!testInput.trim() || isTestLoading}
                        className="px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                    {connectionStatus === "connected" && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                        🔴 Live conversation • Voice and text messages
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {showPublishConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full mx-auto mb-4">
                <UploadCloud className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white text-center mb-2">
                Publish Agent?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
                Are you sure you want to publish this agent? It will become
                available to users.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePublishCancel}
                  disabled={isPublishing}
                  className="flex-1 h-11 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublishConfirm}
                  disabled={isPublishing}
                  className="flex-1 h-11 px-4 rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 common-button-bg"
                >
                  {isPublishing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Publish</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pause Confirmation Modal */}
      {showPauseConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-full mx-auto mb-4">
                <PauseCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white text-center mb-2">
                Pause Agent?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
                Are you sure you want to pause this agent? It will no longer be
                available to users.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePauseCancel}
                  disabled={isPausing}
                  className="flex-1 h-11 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePauseConfirm}
                  disabled={isPausing}
                  className="flex-1 h-11 px-4 rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 common-button-bg2"
                >
                  {isPausing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 dark:border-slate-300 border-t-slate-700 dark:border-t-slate-100" />
                      <span>Pausing...</span>
                    </>
                  ) : (
                    <>
                      <PauseCircle className="w-4 h-4" />
                      <span>Pause</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentViewPage;
