import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

import appToast from "../../components/AppToast";
import {
  useParams,
  useNavigate,
  useLocation,
  Navigate,
  useSearchParams,
} from "react-router-dom";
import GlassCard from "../../components/GlassCard";
import SearchableSelect from "../../components/SearchableSelect";
import Pagination from "../../components/Pagination";
import {
  AgentQRModal,
} from "./agents";
import AgentViewPage from "./AgentViewPage";
import { useAgent } from "../../contexts/AgentContext";
import { useAuth } from "../../contexts/AuthContext";
import { formatAgentLanguages } from "../../lib/utils";
import { buildWidgetEmbedScript } from "../../lib/widgetConfig";
import {
  liveKitService,
  LiveKitMessage,
  LiveKitCallbacks,
} from "../../services/liveKitService";
import { agentAPI } from "../../services/agentAPI";
import { authAPI } from "../../services/authAPI";
import { workflowAPI } from "../../services/workflowAPI";
import AgentCardWorkflows from "./agents/AgentCardWorkflows";
import QuickCreateAgentWizard from "./agents/QuickCreateAgentWizard";
import realAgentDataSource from "./agents/realAgentDataSource";
import { loadWorkflowChipsForAgents } from "./agents/agentWorkflowSummary";
import type { AgentWorkflowChip } from "./agents/AgentCardWorkflows";
import { openInNewBrowserTab } from "../../utils/openInBrowser";
import {
  Bot,
  Play,
  Pause,
  Eye,
  Edit,
  Trash2,
  Copy,
  Globe,
  Zap,
  Plus,
  Search,
  Filter,
  X,
  Link,
  Share2,
  ChevronRight,
  FileText,
  Upload,
  File,
  UploadCloud,
  PauseCircle,
  QrCode,
  AlertTriangle,
  Mail,
  MessageCircle,
  PhoneIncoming,
  PhoneOutgoing,
} from "lucide-react";

const AGENTS_PER_PAGE = 6;
const PUBLISH_ALLOWED_EMAILS = ["demo@callshivai.com", "atharkatheri@gmail.com"];
const SALES_EMAIL = "hello@shivaitech.com";
const SALES_WHATSAPP_NUMBER = "919211490707";
const SALES_WHATSAPP_MESSAGE =
  "Hi ShivAI sales team, I want to activate live publishing for my ShivAI agent. Please help me get started.";
const SALES_EMAIL_SUBJECT = "Activate live agent publishing";



const AgentManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    agents,
    currentAgent,
    setCurrentAgent,
    publishAgentStatus,
    unpublishAgentStatus,
    refreshAgents,
    deleteAgent,
  } = useAgent();
  const { user } = useAuth();
  const normalizedUserEmail = (user?.email || "").toLowerCase();
  const canPublishAgent = PUBLISH_ALLOWED_EMAILS.includes(normalizedUserEmail);
  const shouldBlockPublish = !canPublishAgent;
  const salesWhatsAppHref = `https://wa.me/${SALES_WHATSAPP_NUMBER}?text=${encodeURIComponent(SALES_WHATSAPP_MESSAGE)}`;
  const salesEmailHref = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(SALES_EMAIL_SUBJECT)}`;

  // Check if current user is developer
  const isDeveloper = true; // Open to all users

  const isTrain = location.pathname.includes("/train");
  const isView = id && !isTrain;
  const isList = !id; // Main agent list page

  const [_formData, setFormData] = useState({
    name: "",
    gender: "Female",
    businessProcess: "",
    industry: "",
    persona: "Empathetic",
    language: "English (US)",
    voice: "Sarah - Professional",
    customInstructions: "",
    guardrailsLevel: "Medium",
    responseStyle: "Balanced",
    maxResponseLength: "Medium (150 words)",
    contextWindow: "Standard (8K tokens)",
    temperature: 50,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [genderFilter, setGenderFilter] = useState("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Server-side filtered agents state
  const [filteredAgents, setFilteredAgents] = useState<any[]>([]);
  const [totalAgents, setTotalAgents] = useState(0);
  // Increment to force fetchFilteredAgents to re-run (e.g. after agent creation)
  const [agentListRefreshToken, setAgentListRefreshToken] = useState(0);
  // Ref kept in sync with context agents — used in fetchFilteredAgents fallback
  // WITHOUT adding `agents` to the callback dep array (avoids stale-filter race on publish/pause)
  const agentsRef = useRef<any[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [agentWorkflowChips, setAgentWorkflowChips] = useState<Record<string, AgentWorkflowChip[]>>({});
  const [workflowsLoading, setWorkflowsLoading] = useState(false);

  // Pagination state - read from URL query params
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showTestChat, setShowTestChat] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showPublishContactModal, setShowPublishContactModal] = useState(false);
  const [agentToPublish, setAgentToPublish] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [agentToPause, setAgentToPause] = useState<string | null>(null);
  const [isPausing, setIsPausing] = useState(false);
  const [showIntegrationCodeModal, setShowIntegrationCodeModal] = useState(false);
  const [agentForIntegration, setAgentForIntegration] = useState<string | null>(null);
  const [activeTestTab, setActiveTestTab] = useState<"call" | "conversation">(
    "call",
  );
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callTimerInterval, setCallTimerInterval] = useState<number | null>(
    null,
  );
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      text: string;
      isUser: boolean;
      timestamp: Date;
      source?: string;
    }>
  >([
    {
      id: "1",
      text: `Hello! I am ${
        currentAgent?.name || "your AI assistant"
      }${user?.company ? ` from ${user.company}` : ""}, here to assist you. How can I help you today?`,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [testInput, setTestInput] = useState("");
  const recentMessagesRef = useRef<Set<string>>(new Set());
  const lastMessageTimeRef = useRef<number>(0);
  const [isTestLoading, setIsTestLoading] = useState(false);

  // Quick Create wizard open state. Host-owned (rather than wizard-internal) so
  // the grid's "Create AI Employee" button, the navigate-with-openCreate effect,
  // and the minimized KB-progress overlay can all open it. Everything else the
  // wizard needs lives inside ./agents/QuickCreateAgentWizard.tsx.
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);

  // KB re-upload modal (shown when knowledge_base_status === 'failed')
  const [kbFailedAgent, setKbFailedAgent] = useState<any | null>(null);
  const [kbReuploadFiles, setKbReuploadFiles] = useState<File[]>([]);
  const [kbReuploadUrls, setKbReuploadUrls] = useState<string[]>([]);
  const [kbReuploadWebsiteUrls, setKbReuploadWebsiteUrls] = useState<string[]>(['']);
  const [kbReuploadSocialUrls, setKbReuploadSocialUrls] = useState<string[]>(['']);
  const [isKbReuploading, setIsKbReuploading] = useState(false);



  const openAgentTestPage = () => {
    if (!currentAgent?.id) return;
    // Trigger widget config save before opening test page
    window.dispatchEvent(new CustomEvent("shivai:save-widget-config", { detail: { agentId: currentAgent.id } }));
    const params = new URLSearchParams();
    params.set("agentId", currentAgent.id);
    if (user?.id) params.set("userId", user.id);
    const url = `/MyAIEmployee/${currentAgent.id}?${params.toString()}`;
    setTimeout(() => openInNewBrowserTab(url), 300);
  };



  // NOTE: the Quick Create wizard handlers (handleQuickCreateNext/Back/Close,
  // generateAITemplates, file upload + quality validation, URL list handlers,
  // handleProceedToCreate, canProceedToNextStep) moved into
  // ./agents/QuickCreateAgentWizard.tsx.

  // Refresh both the context agent list and the server-filtered grid.
  const handleAgentListRefresh = useCallback(() => {
    refreshAgents();
    setAgentListRefreshToken((t) => t + 1);
  }, [refreshAgents]);
  // ── KB Re-upload (for failed KB status) ────────────────────────────────────
  const handleKbReuploadFiles = async (files: FileList | File[] | null) => {
    if (!files || (files as any).length === 0) return;
    const validFiles = Array.from(files as any).filter((f: any) => f.size <= 25 * 1024 * 1024) as File[];
    if (validFiles.length === 0) { appToast.error('Files must be under 25 MB.'); return; }
    setIsKbReuploading(true);
    try {
      const response = await agentAPI.uploadKnowledgeBase(validFiles);
      const urls = response.data?.files?.map((f: any) => f.url) || [];
      setKbReuploadFiles((prev) => [...prev, ...validFiles]);
      setKbReuploadUrls((prev) => [...prev, ...urls]);
      appToast.success(`${validFiles.length} file(s) uploaded.`);
    } catch {
      appToast.error('Upload failed. Please try again.');
    } finally {
      setIsKbReuploading(false);
    }
  };

  const handleKbReuploadSubmit = async () => {
    if (!kbFailedAgent) return;
    const validWebsiteUrls = kbReuploadWebsiteUrls.filter(u => u.trim());
    const validSocialUrls = kbReuploadSocialUrls.filter(u => u.trim());
    if (kbReuploadUrls.length === 0 && validWebsiteUrls.length === 0 && validSocialUrls.length === 0) {
      appToast.error('Please add at least one file or URL.');
      return;
    }
    setIsKbReuploading(true);
    try {
      const updatePayload: any = {};
      if (kbReuploadUrls.length > 0) updatePayload.knowledge_base_file_urls = kbReuploadUrls;
      if (validWebsiteUrls.length > 0) updatePayload.website_urls = validWebsiteUrls;
      if (validSocialUrls.length > 0) updatePayload.social_media_urls = validSocialUrls;
      await agentAPI.updateAgent(kbFailedAgent.id, updatePayload);
      appToast.success('Knowledge base re-submitted! Training will start shortly.');
      setKbFailedAgent(null);
      setKbReuploadFiles([]);
      setKbReuploadUrls([]);
      setKbReuploadWebsiteUrls(['']);
      setKbReuploadSocialUrls(['']);
      refreshAgents();
      setAgentListRefreshToken((t) => t + 1);
    } catch {
      appToast.error('Failed to submit. Please try again.');
    } finally {
      setIsKbReuploading(false);
    }
  };
  const [publishingAgents, setPublishingAgents] = useState<Set<string>>(
    new Set(),
  );
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [kbCreationProgress, setKbCreationProgress] = useState<{
    agentId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    message?: string;
  } | null>(null);
  const [isModalMinimized, setIsModalMinimized] = useState(false);
  const [creatingAgentId, setCreatingAgentId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [statusMessage, setStatusMessage] = useState("Ready to connect");
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<any>(null);
  const [_sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [_sessionLoading, setSessionLoading] = useState(false);
  const [_sessionError, setSessionError] = useState<string | null>(null);
  const [_isRecording, setIsRecording] = useState(false);
  const [_testStatus, setTestStatus] = useState("📞 Ready to start call");

  useEffect(() => {
    // Setup LiveKit callbacks
    const callbacks: LiveKitCallbacks = {
      onMessage: (message: LiveKitMessage) => {
        setMessages((prev) => [
          ...prev,
          {
            id: String(message.id),
            text: message.text,
            isUser: message.isUser,
            timestamp: message.timestamp,
            source: message.source,
          },
        ]);
      },
      onConnected: () => {
        setIsCallActive(true);
        setConnectionStatus("connected");
        setStatusMessage("Connected - Speak now!");
        setIsTestLoading(false);
      },
      onDisconnected: () => {
        setIsCallActive(false);
        setConnectionStatus("disconnected");
        setStatusMessage("Disconnected");
        setIsTestLoading(false);
        if (callTimerInterval) {
          clearInterval(callTimerInterval);
          setCallTimerInterval(null);
        }
        setCallDuration(0);
      },
      onConnectionStateChange: (state) => {
        console.log("Connection state changed:", state);
      },
      onError: (error) => {
        setConnectionStatus("disconnected");
        setStatusMessage(error);
        setIsTestLoading(false);
        setIsCallActive(false);
        console.error("LiveKit error:", error);
      },
      onStatusUpdate: (status, state) => {
        setStatusMessage(status);
        setConnectionStatus(state);
      },
    };

      liveKitService.setCallbacks(callbacks);

    // Cleanup on unmount
    return () => {
      liveKitService.disconnect();
      if (callTimerInterval) {
        clearInterval(callTimerInterval);
      }
    };
  }, [callTimerInterval]);

  // NOTE: connectKbWebSocket moved to ./agents/realAgentDataSource.ts
  // (connectKbProgress) and is reached through the wizard's dataSource prop.

  // NOTE: the reload-reconnect effect (restore an in-flight KB training session
  // from localStorage) moved into QuickCreateAgentWizard, which owns the KB
  // progress channel. It calls onRequestOpen() to reopen this page's wizard.

  // Prevent body scroll when any modal is open
  useEffect(() => {
    // NOTE: showTemplateDetails moved into QuickCreateAgentWizard, which runs its
    // own identical (idempotent) scroll-lock for its two modals. This effect still
    // observes the wizard's open state so combined behaviour is unchanged.
    const isAnyModalOpen = (showQuickCreateModal && !isModalMinimized) || showTestChat;
    
    if (isAnyModalOpen) {
      // Blur any currently focused element to prevent keyboard auto-open on mobile
      if (showQuickCreateModal && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      // Prevent background scrolling - comprehensive fix for mobile
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scrolling when all modals are closed
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
    };
  }, [showQuickCreateModal, isModalMinimized, showTestChat]);

  useEffect(() => {
    if (id) {
      // For view/edit pages, fetch full agent config from API
      if (isView || id) {
        const fetchAgentForEdit = async () => {
          try {
            const { agent: fetchedAgent } = await agentAPI.getAgentConfig(id);
            
            // Transform API response to match component expectations
            const transformedAgent = {
              ...fetchedAgent,
              // Map is_active to status
              status: fetchedAgent.is_active ? "Published" : "Pending",
              // Map personality to persona
              persona: fetchedAgent.personality || "Professional",
              // Ensure language is a string (API returns array)
              language: Array.isArray(fetchedAgent.language) 
                ? fetchedAgent.language[0] || "en"
                : fetchedAgent.language || "en",
              // Add default stats if missing
              stats: fetchedAgent.stats || {
                conversations: 0,
                successRate: 0,
                avgResponseTime: 0,
                activeUsers: 0,
              },
            };
            
            setCurrentAgent(transformedAgent as any);
            setFormData({
              name: transformedAgent.name,
              gender: "Female",
              businessProcess: "",
              industry: "",
              persona: transformedAgent.persona,
              language: transformedAgent.language,
              voice: transformedAgent.voice,
              customInstructions: "",
              guardrailsLevel: "Medium",
              responseStyle: "Balanced",
              maxResponseLength: "Medium (150 words)",
              contextWindow: "Standard (8K tokens)",
              temperature: 50,
            });
            // Reset messages when agent changes with correct agent name and company
            setMessages([
              {
                id: "1",
                text: `Hello! I am ${transformedAgent.name}${user?.company ? ` from ${user.company}` : ""}, here to assist you. How can I help you today?`,
                isUser: false,
                timestamp: new Date(),
              },
            ]);
            // Fetch session history for this agent
            fetchSessionHistory(transformedAgent.id);
          } catch (error) {
            console.error("Error fetching agent config:", error);
            appToast.error("Failed to load agent");
            navigate("/agents");
          }
        };
        fetchAgentForEdit();
      } else {
        // Fallback: search in local agents list
        const agent = agents.find((a) => a.id === id);
        if (agent) {
          setCurrentAgent(agent);
          setFormData({
            name: agent.name,
            gender: "Female",
            businessProcess: "",
            industry: "",
            persona: agent.persona,
            language: agent.language,
            voice: agent.voice,
            customInstructions: "",
            guardrailsLevel: "Medium",
            responseStyle: "Balanced",
            maxResponseLength: "Medium (150 words)",
            contextWindow: "Standard (8K tokens)",
            temperature: 50,
          });
          // Reset messages when agent changes with correct agent name and company
          setMessages([
            {
              id: "1",
              text: `Hello! I am ${agent.name}${user?.company ? ` from ${user.company}` : ""}, here to assist you. How can I help you today?`,
              isUser: false,
              timestamp: new Date(),
            },
          ]);
          // Fetch session history for this agent
          fetchSessionHistory(agent.id);
        }
      }
    }
  }, [id, agents, setCurrentAgent]);

  // Refresh agents when navigating back from edit page
  useEffect(() => {
    if (location.state?.refresh) {
      refreshAgents();
      // Clear the state to prevent re-fetching on subsequent renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.refresh, refreshAgents, navigate, location.pathname]);

  // Auto-open create modal when navigated with openCreate state (e.g. from dashboard)
  useEffect(() => {
    if (location.state?.openCreate) {
      setShowQuickCreateModal(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.openCreate, navigate, location.pathname]);

  // Listen for agent updates (e.g., name change from widget customization)
  useEffect(() => {
    const handleAgentUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.agentId && currentAgent?.id === detail.agentId) {
        console.log("🔄 Agent updated event received, updating header...");
        
        // Update currentAgent with new values
        if (currentAgent) {
          setCurrentAgent({
            ...currentAgent,
            name: detail.updatedFields?.name || currentAgent.name,
            custom_instructions:
              detail.updatedFields?.custom_instructions ||
              currentAgent.custom_instructions,
            template: detail.updatedFields?.template || currentAgent.template,
          });
        }
      }
    };

    window.addEventListener("agentUpdated", handleAgentUpdate);
    return () => window.removeEventListener("agentUpdated", handleAgentUpdate);
  }, [currentAgent?.id, setCurrentAgent]);

  const fetchSessionHistory = async (agentId: string) => {
    setSessionLoading(true);
    setSessionError(null);

    try {
      const response = await agentAPI.getAgentSessions("", agentId);
      // response is already response.data.data from the API service
      // which contains { sessions: [...], pagination: {...} }
      const sessions = response?.sessions || [];
      setSessionHistory(sessions);
      console.log("✅ Session history loaded:", sessions.length, "sessions");
    } catch (error) {
      console.error("❌ Error fetching session history:", error);
      setSessionError(
        error instanceof Error
          ? error.message
          : "Failed to load session history",
      );
      setSessionHistory([]);
    } finally {
      setSessionLoading(false);
    }
  };

  const handlePublish = (agentId: string) => {
    setAgentToPublish(agentId);
    if (shouldBlockPublish) {
      setShowPublishContactModal(true);
      return;
    }
    setShowPublishConfirm(true);
  };

  const handlePublishConfirm = async () => {
    if (!agentToPublish) return;

    setIsPublishing(true);
    try {
      // Trigger widget config save before publishing so widget has latest data
      window.dispatchEvent(new CustomEvent("shivai:save-widget-config", { detail: { agentId: agentToPublish } }));

      // Add to publishing set for loading state
      setPublishingAgents((prev) => new Set(prev).add(agentToPublish));

      await publishAgentStatus(agentToPublish);
      // Optimistically update filteredAgents so the UI reflects Published state
      // immediately — before refreshAgents() triggers any background re-fetch.
      const publishedId = agentToPublish;
      setFilteredAgents((prev) =>
        prev.map((a) =>
          a.id === publishedId ? { ...a, status: 'Published', is_active: true } : a
        )
      );
      // Also update currentAgent directly — the context's publishAgentStatus has a
      // stale-closure guard (currentAgent?.id === id) that can miss in some cases.
      if (currentAgent && currentAgent.id === publishedId) {
        setCurrentAgent({ ...currentAgent, status: 'Published' });
      }
      // Note: refreshAgents() intentionally omitted — publishAgentStatus() already
      // updates context agents in-memory. A server re-fetch here would race with
      // the optimistic filteredAgents update above.
      console.log("✅ Agent published successfully");
      
      // Show success toast
      appToast.success("Agent published successfully!", { duration: 3000 });
      setShowPublishConfirm(false);
      // Notify AgentViewPage (and any other listeners) of the status change
      window.dispatchEvent(new CustomEvent("agentUpdated", {
        detail: { agentId: publishedId, updatedFields: { status: 'Published', is_active: true } }
      }));
      setAgentToPublish(null);
    } catch (error: any) {
      console.error("❌ Error publishing agent:", error);
      appToast.error(error.message || "Failed to publish agent. Please try again.", { duration: 4000 });
    } finally {
      setIsPublishing(false);
      // Remove from publishing set
      setPublishingAgents((prev) => {
        const next = new Set(prev);
        next.delete(agentToPublish);
        return next;
      });
    }
  };

  const handlePublishCancel = () => {
    setShowPublishConfirm(false);
    setShowPublishContactModal(false);
    setAgentToPublish(null);
  };

  const handlePause = (agentId: string) => {
    setAgentToPause(agentId);
    setShowPauseConfirm(true);
  };

  const handlePauseConfirm = async () => {
    if (!agentToPause) return;

    setIsPausing(true);
    try {
      // Add to publishing set for loading state
      setPublishingAgents((prev) => new Set(prev).add(agentToPause));

      await unpublishAgentStatus(agentToPause);
      // Optimistically update filteredAgents so the UI reflects Pending state immediately.
      const pausedId = agentToPause;
      setFilteredAgents((prev) =>
        prev.map((a) =>
          a.id === pausedId ? { ...a, status: 'Pending', is_active: false } : a
        )
      );
      // Also update currentAgent directly for the view page.
      if (currentAgent && currentAgent.id === pausedId) {
        setCurrentAgent({ ...currentAgent, status: 'Pending' });
      }
      // Note: refreshAgents() intentionally omitted — unpublishAgentStatus() already
      // updates context agents in-memory.
      console.log("✅ Agent paused successfully");
      
      // Show success toast
      appToast.success("Agent paused successfully!", { duration: 3000 });
      setShowPauseConfirm(false);
      // Notify AgentViewPage (and any other listeners) of the status change
      window.dispatchEvent(new CustomEvent("agentUpdated", {
        detail: { agentId: pausedId, updatedFields: { status: 'Pending', is_active: false } }
      }));
      setAgentToPause(null);
    } catch (error: any) {
      console.error("❌ Error pausing agent:", error);
      appToast.error(error.message || "Failed to pause agent. Please try again.", { duration: 4000 });
    } finally {
      setIsPausing(false);
      // Remove from publishing set
      setPublishingAgents((prev) => {
        const next = new Set(prev);
        next.delete(agentToPause);
        return next;
      });
    }
  };

  const handlePauseCancel = () => {
    setShowPauseConfirm(false);
    setAgentToPause(null);
  };

  const handleDeleteClick = (agentId: string) => {
    setAgentToDelete(agentId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!agentToDelete) return;

    setIsDeleting(true);
    const deletedId = agentToDelete;
    try {
      await deleteAgent(deletedId);
      console.log("✅ Agent deleted successfully");
      // Re-fetch the list from the server to reflect actual state
      await fetchFilteredAgents();
      refreshAgents();
      appToast.success("Agent deleted successfully!", { duration: 3000 });
      setShowDeleteConfirm(false);
      setAgentToDelete(null);

      // If we're viewing the deleted agent, navigate back to list
      if (currentAgent?.id === deletedId) {
        navigate("/agents");
      }
    } catch (error: any) {
      console.error("❌ Error deleting agent:", error);
      appToast.error(error.message || "Failed to delete agent. Please try again.", { duration: 4000 });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setAgentToDelete(null);
  };

  const handleTestSend = async () => {
    if (!testInput.trim() || isTestLoading) return;

    const message = testInput.trim();
    const now = Date.now();

    // Prevent rapid duplicate sends
    if (now - lastMessageTimeRef.current < 1000) {
      console.log("🚫 Message sent too quickly, preventing duplicate");
      return;
    }

    // Create unique message key
    const messageKey = `user-${message}-${Math.floor(now / 1000)}`; // Group by second

    if (recentMessagesRef.current.has(messageKey)) {
      console.log("🚫 Duplicate message prevented:", message);
      setTestInput("");
      return;
    }

    // Track this message
    recentMessagesRef.current.add(messageKey);
    lastMessageTimeRef.current = now;

    // Clear old messages from tracking (keep only last 10 seconds)
    setTimeout(() => {
      recentMessagesRef.current.delete(messageKey);
    }, 10000);

    setTestInput("");
    setIsTestLoading(true);

    try {
      // Add user message to UI immediately
      const userMessage = {
        id: `user-chat-${now}-${Math.random()}`,
        text: message,
        isUser: true,
        timestamp: new Date(),
        source: "chat",
      };
      setMessages((prev) => [...prev, userMessage]);

      // If connected to LiveKit room, send via room's data channel - same as widget.js
      if (room && connectionStatus === "connected") {
        const LiveKit = (window as any).LivekitClient;
        const messageData = JSON.stringify({
          type: "chat",
          text: message,
          timestamp: new Date().toISOString(),
          source: "typed",
        });

        // Send to all participants via data channel
        const encoder = new TextEncoder();
        const data = encoder.encode(messageData);
        await room.localParticipant.publishData(
          data,
          LiveKit.DataPacket_Kind.RELIABLE,
        );

        console.log("💬 Message sent via LiveKit:", message);
      } else {
        // Fallback to simulation if not connected
        setTimeout(
          () => {
            const responses = [
              "I understand you're looking for help. Let me assist you with that based on my training and configuration.",
              "Thank you for your message. As an AI Employee, I'm designed to help with various tasks in a professional manner.",
              "I appreciate your question. Based on my role as your AI Employee, I'd be happy to provide assistance.",
              "That's an interesting point. As your AI Employee, here's how I can help you.",
              "I see what you're asking about. As an AI Employee, I'm here to provide helpful, accurate information.",
            ];

            const agentMessage = {
              id: `fallback-${Date.now()}-${Math.random()}`,
              text: responses[Math.floor(Math.random() * responses.length)],
              isUser: false,
              timestamp: new Date(),
              source: "chat",
            };

            setMessages((prev) => [...prev, agentMessage]);
            setIsTestLoading(false);
          },
          1000 + Math.random() * 2000,
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsTestLoading(false);
    }
  };

  // Working LiveKit connection implementation (based on your working React component)
  const startAgentCall = useCallback(async () => {
    try {
      setIsConnecting(true);
      setTestStatus("🎤 Requesting microphone access...");
      setConnectionStatus("connecting");
      setStatusMessage("Initializing call...");

      // Check if in secure context (HTTPS required for microphone)
      if (!window.isSecureContext) {
        throw new Error("HTTPS required for microphone access");
      }

      // Request microphone permission first (same as working component)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
            channelCount: 1,
            sampleRate: 48000,
            sampleSize: 16,
          },
        });

        // Stop the stream - LiveKit will create its own
        stream.getTracks().forEach((track) => track.stop());
        setTestStatus("✅ Microphone access granted");
        console.log("✅ Microphone access granted");
      } catch (micError) {
        const errorMessage =
          micError instanceof Error ? micError.message : "Unknown error";
        throw new Error(`Microphone access denied: ${errorMessage}`);
      }

      // Get agent ID from the current agent
      const agentId = currentAgent?.id;
      if (!agentId) {
        throw new Error("Agent ID not found");
      }

      setTestStatus("🔗 Getting LiveKit token...");

      // Get LiveKit token from backend (exact same endpoint as working component)
      const callId = `admin_test_${Date.now()}`;
      console.log("🔑 Getting token with parameters:", {
        agent_id: agentId,
        language: "en-US",
        call_id: callId,
        device: "desktop",
      });

      const response = await fetch(
        "https://python.service.callshivai.com/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agent_id: agentId,
            language: "en-US",
            call_id: callId,
            device: "desktop",
            user_agent: navigator.userAgent,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Token server error:", errorText);
        throw new Error(
          `Failed to get LiveKit token: ${response.status} - ${errorText}`,
        );
      }

      const tokenData = await response.json();
      console.log("🎯 Token received for agent testing:", agentId, tokenData);

      setTestStatus("🔗 Connecting to LiveKit...");

      // Load LiveKit SDK if not available
      if (typeof (window as any).LivekitClient === "undefined") {
        setTestStatus("📦 Loading LiveKit SDK...");

        const script = document.createElement("script");
        script.src =
          "https://unpkg.com/livekit-client@latest/dist/livekit-client.umd.js";
        script.onload = () => {
          console.log("✅ LiveKit SDK loaded");
          connectToLiveKit(tokenData);
        };
        script.onerror = () => {
          throw new Error("Failed to load LiveKit SDK");
        };
        document.head.appendChild(script);
      } else {
        await connectToLiveKit(tokenData);
      }
    } catch (error) {
      console.error("Failed to start agent test call:", error);
      setTestStatus(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setConnectionStatus("disconnected");
      setStatusMessage("Connection failed");
      setIsConnecting(false);
      setIsConnected(false);
    }
  }, [currentAgent]);

  const connectToLiveKit = useCallback(
    async (tokenData: any) => {
      try {
        const LiveKit = (window as any).LivekitClient;

        // Create LiveKit room with same config as working component
        const liveKitRoom = new LiveKit.Room({
          adaptiveStream: true,
          dynacast: true,
          audioCaptureDefaults: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            suppressLocalAudioPlayback: true,
          },
          publishDefaults: {
            audioPreset: LiveKit.AudioPresets.speech,
            dtx: true,
            red: false,
            simulcast: false,
          },
        });

        // Track remote audio (agent speaking) - same as working component
        liveKitRoom.on(LiveKit.RoomEvent.TrackSubscribed, (track: any) => {
          if (track.kind === LiveKit.Track.Kind.Audio) {
            console.log("🔊 Audio track received from agent");
            const audioElement = track.attach();
            audioElement.volume = 0.4; // Same volume as widget for feedback prevention
            audioElement.autoplay = true;
            document.body.appendChild(audioElement);

            audioElement
              .play()
              .catch((err: any) =>
                console.warn("Audio autoplay blocked:", err),
              );
          }
        });

        // Handle real-time transcript and chat data - same as widget.js
        liveKitRoom.on(
          LiveKit.RoomEvent.DataReceived,
          (data: any, participant: any) => {
            try {
              const text = new TextDecoder().decode(data);
              console.log(
                "📨 DataReceived:",
                text,
                "from:",
                participant?.identity,
              );

              if (!text || text.trim().length === 0) return;

              // Skip technical messages
              const skipPatterns = [
                "subscribed",
                "connected",
                "disconnected",
                "enabled",
                "disabled",
                "true",
                "false",
              ];
              if (
                skipPatterns.some((pattern) => text.toLowerCase() === pattern)
              )
                return;

              try {
                const jsonData = JSON.parse(text);

                // Look for text content in various fields
                let transcriptText = "";
                const textFields = [
                  "text",
                  "transcript",
                  "message",
                  "content",
                  "response",
                ];
                for (const field of textFields) {
                  if (
                    jsonData[field] &&
                    typeof jsonData[field] === "string" &&
                    jsonData[field].trim()
                  ) {
                    transcriptText = jsonData[field].trim();
                    break;
                  }
                }

                if (transcriptText) {
                  const isUser =
                    participant?.identity ===
                    liveKitRoom.localParticipant?.identity;
                  const messageKey = `${
                    isUser ? "user" : "ai"
                  }-${transcriptText}-${Math.floor(Date.now() / 2000)}`;

                  // Prevent duplicate messages within 2-second windows
                  if (recentMessagesRef.current.has(messageKey)) {
                    console.log(
                      "🚫 Preventing duplicate DataReceived:",
                      transcriptText,
                    );
                    return;
                  }

                  recentMessagesRef.current.add(messageKey);
                  setTimeout(
                    () => recentMessagesRef.current.delete(messageKey),
                    5000,
                  );

                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `${Date.now()}-${Math.random()}`,
                      text: transcriptText,
                      isUser,
                      timestamp: new Date(),
                      source: "voice",
                    },
                  ]);

                  // Stop loading if this is an agent response
                  if (!isUser) {
                    setIsTestLoading(false);
                  }

                  console.log("✅ Added real-time message:", {
                    isUser,
                    text: transcriptText,
                  });
                }
              } catch (e) {
                // Treat as plain text if not JSON
                if (text.length >= 2 && text.length <= 1000) {
                  const isUser =
                    participant?.identity ===
                    liveKitRoom.localParticipant?.identity;
                  const messageKey = `${
                    isUser ? "user" : "ai"
                  }-${text.trim()}-${Math.floor(Date.now() / 2000)}`;

                  if (recentMessagesRef.current.has(messageKey)) {
                    console.log(
                      "🚫 Preventing duplicate plain text:",
                      text.trim(),
                    );
                    return;
                  }

                  recentMessagesRef.current.add(messageKey);
                  setTimeout(
                    () => recentMessagesRef.current.delete(messageKey),
                    5000,
                  );

                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `${Date.now()}-${Math.random()}`,
                      text: text.trim(),
                      isUser,
                      timestamp: new Date(),
                      source: "voice",
                    },
                  ]);

                  // Stop loading if this is an agent response
                  if (!isUser) {
                    setIsTestLoading(false);
                  }

                  console.log("✅ Added plain text message:", {
                    isUser,
                    text: text.trim(),
                  });
                }
              }
            } catch (error) {
              console.error("❌ Error processing DataReceived:", error);
            }
          },
        );

        // Register text stream handlers for transcription and chat - same as widget.js
        if (typeof liveKitRoom.registerTextStreamHandler === "function") {
          console.log("📝 Registering text stream handlers...");

          // Transcription stream handler
          liveKitRoom.registerTextStreamHandler(
            "lk.transcription",
            async (reader: any, participantInfo: any) => {
              console.log(
                "🎯 Transcription stream from:",
                participantInfo.identity,
              );
              try {
                const text = await reader.readAll();
                if (text && text.trim()) {
                  const isUser =
                    participantInfo.identity ===
                    liveKitRoom.localParticipant?.identity;
                  const messageKey = `${
                    isUser ? "user" : "ai"
                  }-transcription-${text.trim()}-${Math.floor(
                    Date.now() / 2000,
                  )}`;

                  if (recentMessagesRef.current.has(messageKey)) {
                    console.log(
                      "🚫 Preventing duplicate transcription:",
                      text.trim(),
                    );
                    return;
                  }

                  recentMessagesRef.current.add(messageKey);
                  setTimeout(
                    () => recentMessagesRef.current.delete(messageKey),
                    5000,
                  );

                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `transcription-${Date.now()}-${Math.random()}`,
                      text: text.trim(),
                      isUser,
                      timestamp: new Date(),
                      source: "voice",
                    },
                  ]);

                  // Stop loading if this is an agent response
                  if (!isUser) {
                    setIsTestLoading(false);
                  }

                  console.log("✅ Transcription added:", {
                    isUser,
                    text: text.trim(),
                  });
                }
              } catch (error) {
                console.error("❌ Error processing transcription:", error);
              }
            },
          );

          // Chat stream handler
          liveKitRoom.registerTextStreamHandler(
            "lk.chat",
            async (reader: any, participantInfo: any) => {
              console.log("💬 Chat stream from:", participantInfo.identity);
              try {
                const text = await reader.readAll();
                const isUser =
                  participantInfo.identity ===
                  liveKitRoom.localParticipant?.identity;

                if (!isUser && text && text.trim()) {
                  const messageKey = `ai-chat-${text.trim()}-${Math.floor(
                    Date.now() / 2000,
                  )}`;

                  if (recentMessagesRef.current.has(messageKey)) {
                    console.log("🚫 Preventing duplicate chat:", text.trim());
                    return;
                  }

                  recentMessagesRef.current.add(messageKey);
                  setTimeout(
                    () => recentMessagesRef.current.delete(messageKey),
                    5000,
                  );

                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `chat-${Date.now()}-${Math.random()}`,
                      text: text.trim(),
                      isUser: false,
                      timestamp: new Date(),
                      source: "chat",
                    },
                  ]);

                  // Stop loading since this is an agent chat response
                  setIsTestLoading(false);

                  console.log("✅ Chat message added:", { text: text.trim() });
                }
              } catch (error) {
                console.error("❌ Error processing chat:", error);
              }
            },
          );
        }

        // Handle transcript from metadata - enhanced with loading state management
        liveKitRoom.on(
          LiveKit.RoomEvent.ParticipantMetadataChanged,
          (metadata: string, participant: any) => {
            if (metadata) {
              try {
                const data = JSON.parse(metadata);
                if (data.transcript || data.text) {
                  const isUser =
                    participant?.identity ===
                    liveKitRoom.localParticipant?.identity;

                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `metadata-${Date.now()}`,
                      text: data.transcript || data.text,
                      isUser,
                      timestamp: new Date(),
                      source: "voice",
                    },
                  ]);

                  // Stop loading if this is an agent response
                  if (!isUser) {
                    setIsTestLoading(false);
                  }

                  console.log(
                    "✅ Transcript from participant metadata:",
                    data.transcript || data.text,
                  );
                }
              } catch (e) {
                console.log("Metadata not JSON:", metadata);
              }
            }
          },
        );

        // Handle room metadata - enhanced with loading state management
        liveKitRoom.on(
          LiveKit.RoomEvent.RoomMetadataChanged,
          (metadata: string) => {
            if (metadata) {
              try {
                const data = JSON.parse(metadata);
                if (data.transcript || data.text) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `room-metadata-${Date.now()}`,
                      text: data.transcript || data.text,
                      isUser: false, // Room metadata is typically from agent
                      timestamp: new Date(),
                      source: "voice",
                    },
                  ]);

                  // Stop loading since this is an agent response
                  setIsTestLoading(false);

                  console.log(
                    "✅ Transcript from room metadata:",
                    data.transcript || data.text,
                  );
                }
              } catch (e) {
                console.log("Room metadata not JSON:", metadata);
              }
            }
          },
        );

        // Handle connection - same as working component
        liveKitRoom.on(LiveKit.RoomEvent.Connected, async () => {
          console.log("🎉 Connected to LiveKit room for agent testing");
          setIsConnected(true);
          setIsConnecting(false);
          setIsCallActive(true);
          setConnectionStatus("connected");
          setTestStatus("🟢 Connected! You can now speak with the agent.");
          setStatusMessage("✅ Connected - Speak now!");

          // Start call timer
          const timer = setInterval(() => {
            setCallDuration((prev) => prev + 1);
          }, 1000);
          setCallTimerInterval(timer);

          // Enable microphone with same settings as working component
          try {
            await liveKitRoom.localParticipant.setMicrophoneEnabled(true, {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            });

            setIsRecording(true);

            console.log("🎤 Microphone enabled and ready");
          } catch (err) {
            console.error("Failed to enable microphone:", err);
          }
        });

        // Handle disconnection
        liveKitRoom.on(LiveKit.RoomEvent.Disconnected, () => {
          console.log("❌ Disconnected from LiveKit room");
          setIsConnected(false);
          setIsConnecting(false);
          setIsCallActive(false);
          setConnectionStatus("disconnected");
          setTestStatus("🔴 Disconnected");
          setStatusMessage("❌ Disconnected");
          setRoom(null);

          if (callTimerInterval) {
            clearInterval(callTimerInterval);
            setCallTimerInterval(null);
          }
          setCallDuration(0);
        });

        // Connect to room using token data
        console.log("🔗 Connecting to LiveKit room...");
        await liveKitRoom.connect(tokenData.url, tokenData.token);
        setRoom(liveKitRoom);
      } catch (error) {
        console.error("LiveKit connection failed:", error);
        setTestStatus(
          `❌ Connection failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
        setConnectionStatus("disconnected");
        setStatusMessage("Connection failed");
        setIsConnecting(false);
        setIsConnected(false);
      }
    },
    [currentAgent, callTimerInterval],
  );

  const endAgentCall = useCallback(async () => {
    if (room) {
      try {
        await room.disconnect();
        console.log("✅ Disconnected from LiveKit room");
      } catch (error) {
        console.error("Error disconnecting from room:", error);
      }
    }

    setIsConnected(false);
    setIsConnecting(false);
    setIsCallActive(false);
    setConnectionStatus("disconnected");
    setTestStatus("📞 Call ended");
    setStatusMessage("Ready to connect");
    setRoom(null);
    setIsRecording(false);

    if (callTimerInterval) {
      clearInterval(callTimerInterval);
      setCallTimerInterval(null);
    }
    setCallDuration(0);

    // Add disconnect message
    setMessages((prev) => [
      ...prev,
      {
        id: `disconnect-${Date.now()}`,
        text: "Call ended",
        isUser: false,
        timestamp: new Date(),
        source: "system",
      },
    ]);
  }, [room, callTimerInterval]);

  const toggleMute = useCallback(async () => {
    if (room && isConnected) {
      try {
        const newMutedState = !isMuted;
        await room.localParticipant.setMicrophoneEnabled(!newMutedState);
        setIsMuted(newMutedState);
        setIsRecording(!newMutedState);
        console.log(`🎤 Microphone ${newMutedState ? "muted" : "unmuted"}`);
      } catch (error) {
        console.error("Error toggling mute:", error);
      }
    }
  }, [room, isConnected, isMuted]);

  // Test connection function to help debug issues
  const testConnection = useCallback(async () => {
    if (!currentAgent) {
      alert("No agent selected");
      return;
    }

    console.log("🧪 Testing connection components...");

    try {
      // Test 1: Check microphone permission
      console.log("🎤 Testing microphone access...");
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("✅ Microphone access OK");

      // Test 2: Check token server
      console.log("🔑 Testing token server...");
      const response = await fetch(
        "https://python.service.callshivai.com/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_id: currentAgent.id,
            language: "en-US",
            call_id: `test_${Date.now()}`,
            device: "desktop",
            user_agent: navigator.userAgent,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Token server OK", data);
        alert(
          "✅ Connection test passed! Token server is working. Try starting the call again.",
        );
      } else {
        console.error("❌ Token server error:", response.status);
        alert(
          `❌ Token server error: ${response.status}. The voice service may be temporarily unavailable.`,
        );
      }
    } catch (error) {
      console.error("❌ Connection test failed:", error);
      if (error instanceof Error && error.name === "NotAllowedError") {
        alert(
          "❌ Microphone permission denied. Please allow microphone access and try again.",
        );
      } else if (error instanceof Error && error.message.includes("fetch")) {
        alert(
          "❌ Cannot reach voice service. Please check your internet connection.",
        );
      } else {
        alert(
          `❌ Connection test failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      }
    }
  }, [currentAgent]);

  // Remove the old handleStartCall function and replace with startAgentCall
  const handleStartCall = startAgentCall;

  const handleEndCall = endAgentCall;

  const handleToggleMute = toggleMute;

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch agents with filters from API
  const fetchFilteredAgents = useCallback(async () => {
    if (!isDeveloper) {
      setFilteredAgents([]);
      setTotalAgents(0);
      setTotalPages(0);
      return;
    }

    setIsLoadingAgents(true);
    try {
      const result = await agentAPI.getAgentsWithFilters({
        gender: genderFilter,
        sort: sortBy,
        search: debouncedSearchTerm || undefined,
        page: currentPage,
        limit: AGENTS_PER_PAGE,
      });

      setFilteredAgents(result.agents);
      setTotalAgents(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Error fetching filtered agents:", error);
      // Fallback to client-side filtering if API fails
      const fallbackFiltered = agentsRef.current
        .filter((agent) => {
          const matchesSearch = agent.name
            .toLowerCase()
            .includes((debouncedSearchTerm || "").toLowerCase());
          const agentGender = ((agent as any).gender || "").toLowerCase();
          const matchesGender =
            genderFilter === "all" ||
            agentGender === genderFilter.toLowerCase();
          return matchesSearch && matchesGender;
        })
        .sort((a, b) => {
          switch (sortBy) {
            case "a-z":
              return a.name.localeCompare(b.name);
            case "z-a":
              return b.name.localeCompare(a.name);
            case "newest":
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            case "oldest":
              return (
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
              );
            default:
              return 0;
          }
        });

      const total = fallbackFiltered.length;
      const totalPagesCalc = Math.ceil(total / AGENTS_PER_PAGE);
      const startIndex = (currentPage - 1) * AGENTS_PER_PAGE;
      const paginatedFallback = fallbackFiltered.slice(
        startIndex,
        startIndex + AGENTS_PER_PAGE,
      );

      setFilteredAgents(paginatedFallback);
      setTotalAgents(total);
      setTotalPages(totalPagesCalc);
    } finally {
      setIsLoadingAgents(false);
    }
  }, [
    isDeveloper,
    genderFilter,
    sortBy,
    debouncedSearchTerm,
    currentPage,
    agentListRefreshToken,
    // NOTE: `agents` intentionally excluded — adding it would cause fetchFilteredAgents to
    // re-run after every publish/pause and overwrite the optimistic UI update with stale
    // filter-API data. agentsRef.current is used in the catch fallback instead.
  ]);

  // Keep agentsRef in sync with the context agents list (used in fetchFilteredAgents fallback)
  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  // Fetch agents when filters or page changes
  useEffect(() => {
    fetchFilteredAgents();
  }, [fetchFilteredAgents]);

  // Paginated agents are now directly from API response
  const paginatedAgents = filteredAgents;

  useEffect(() => {
    if (!isList || !isDeveloper || filteredAgents.length === 0) {
      setAgentWorkflowChips({});
      setWorkflowsLoading(false);
      return;
    }

    let cancelled = false;
    setWorkflowsLoading(true);
    const agentIds = filteredAgents.map((a: { id: string }) => a.id);

    loadWorkflowChipsForAgents(
      agentIds,
      () => authAPI.getIntegrations("google_sheets"),
      async (agentId) => {
        const res = await workflowAPI.getAgentDocuments(agentId);
        return res.data?.document?.files ?? [];
      },
    )
      .then((map) => {
        if (!cancelled) setAgentWorkflowChips(map);
      })
      .catch(() => {
        if (!cancelled) setAgentWorkflowChips({});
      })
      .finally(() => {
        if (!cancelled) setWorkflowsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isList, isDeveloper, filteredAgents, agentListRefreshToken]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setSearchParams({ page: page.toString() });
    // Scroll to top of the page when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage > 1) {
      // Reset to page 1 when search, gender or sort changes
      setSearchParams({ page: "1" });
    }
  }, [debouncedSearchTerm, genderFilter, sortBy]);

  // AGENT VIEW PAGE - Show whenever there's an ID and not on train route
  if (isView) {
    // If currentAgent is not yet loaded, show a loading state
    if (!currentAgent) {
      return (
        <div className="flex items-center justify-center h-dvh">
          <div className="text-center">
            <Bot className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4 animate-pulse" />
            <p className="text-slate-600 dark:text-slate-400">Loading agent...</p>
          </div>
        </div>
      );
    }

    return (
      <AgentViewPage
        currentAgent={currentAgent}
        publishingAgents={publishingAgents}
        showQRModal={showQRModal}
        setShowQRModal={setShowQRModal}
        openAgentTestPage={openAgentTestPage}
        handlePublish={handlePublish}
        showPublishConfirm={showPublishConfirm}
        handlePublishCancel={handlePublishCancel}
        handlePublishConfirm={handlePublishConfirm}
        isPublishing={isPublishing}
        showPublishContactModal={showPublishContactModal}
        salesWhatsAppHref={salesWhatsAppHref}
        salesEmailHref={salesEmailHref}
        handlePause={handlePause}
        showPauseConfirm={showPauseConfirm}
        handlePauseCancel={handlePauseCancel}
        handlePauseConfirm={handlePauseConfirm}
        isPausing={isPausing}
        showDeleteConfirm={showDeleteConfirm}
        handleDeleteCancel={handleDeleteCancel}
        handleDeleteConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        showTestChat={showTestChat}
        setShowTestChat={setShowTestChat}
        room={room}
        setIsCallActive={setIsCallActive}
        setIsRecording={setIsRecording}
        setConnectionStatus={setConnectionStatus}
        setStatusMessage={setStatusMessage}
        callTimerInterval={callTimerInterval}
        setCallTimerInterval={setCallTimerInterval}
        setCallDuration={setCallDuration}
        activeTestTab={activeTestTab}
        setActiveTestTab={setActiveTestTab}
        connectionStatus={connectionStatus}
        statusMessage={statusMessage}
        isCallActive={isCallActive}
        callDuration={callDuration}
        formatCallDuration={formatCallDuration}
        handleStartCall={handleStartCall}
        isTestLoading={isTestLoading}
        isConnecting={isConnecting}
        handleToggleMute={handleToggleMute}
        isMuted={isMuted}
        handleEndCall={handleEndCall}
        testConnection={testConnection}
        messages={messages}
        testInput={testInput}
        setTestInput={setTestInput}
        handleTestSend={handleTestSend}
      />
    );
  }

  // MAIN AGENT LIST PAGE
  if (isList) {
    return (
      <div className="space-y-4 lg:space-y-6 w-full max-w-full overflow-hidden">
        {/* Header with Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 lg:gap-4 flex-1">
            <div className="bg-white/50 flex items-center justify-center gap-1.5 dark:bg-slate-800/50 rounded-lg px-2 lg:px-6 py-2 lg:py-2 text-center shadow-sm transition-all duration-200 hover:shadow-md">
              <p className="text-base lg:text-2xl font-bold text-slate-800 dark:text-white">
                {isDeveloper ? totalAgents : 0}
              </p>
              <p className="text-[10px] lg:text-sm font-medium text-slate-600 dark:text-slate-400">
                Total
              </p>
            </div>
            <div className="bg-white/50 flex items-center justify-center gap-1.5 dark:bg-slate-800/50 rounded-lg px-2 lg:px-6 py-2 lg:py-2 text-center shadow-sm transition-all duration-200 hover:shadow-md">
              <p className="text-base lg:text-2xl font-bold text-green-600 dark:text-green-400">
                {isDeveloper
                  ? agents.filter(
                      (a) => a.status === "Published" || (a as any).is_active,
                    ).length
                  : 0}
              </p>
              <p className="text-[10px] lg:text-sm font-medium text-slate-600 dark:text-slate-400">
                Live
              </p>
            </div>
            <div className="bg-white/50 flex items-center justify-center gap-1.5 dark:bg-slate-800/50 rounded-lg px-2 lg:px-6 py-2 lg:py-2 text-center shadow-sm transition-all duration-200 hover:shadow-md">
              <p className="text-base lg:text-2xl font-bold text-orange-600 dark:text-orange-400">
                {isDeveloper
                  ? agents.filter(
                      (a) => a.status !== "Published" && !(a as any).is_active,
                    ).length
                  : 0}
              </p>
              <p className="text-[10px] lg:text-sm font-medium text-slate-600 dark:text-slate-400">
                Unpublished
              </p>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={() => {
              if (!isDeveloper || (isCreatingAgent && isModalMinimized)) return;
              setShowQuickCreateModal(true);
            }}
            disabled={!isDeveloper || (isCreatingAgent && isModalMinimized)}
            title={isCreatingAgent && isModalMinimized ? 'Knowledge base training in progress…' : undefined}
            className={`relative overflow-hidden flex items-center justify-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl transition-all duration-200 shadow-sm whitespace-nowrap ${
              isDeveloper && !(isCreatingAgent && isModalMinimized)
                ? "common-button-bg transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50"
            }`}
          >
            {/* Tailwind shine effect (requires keyframes in tailwind.config.js) */}
            {isDeveloper && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 h-full w-full pointer-events-none z-0"
              >
                <span className="block absolute left-[-60%] top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-70 blur-sm animate-shine" />
              </span>
            )}
            <Plus className="w-4 h-4 lg:w-5 lg:h-5 z-10" />
            <span className="text-sm lg:text-base font-medium z-10">
              Create AI Employee
            </span>
          </button>
        </div>

        {/* Search and Filter Row */}
        <GlassCard>
          <div className="p-4 lg:p-6">
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 lg:py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 text-slate-800 dark:text-white text-sm transition-all duration-200"
                />
              </div>

              {/* Gender Filter */}
              <div className="hidden lg:block min-w-[140px]">
                <SearchableSelect
                  options={[
                    { value: "all", label: "All Gender" },
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                  ]}
                  value={genderFilter}
                  onChange={(value) => setGenderFilter(value)}
                  placeholder="Filter by gender..."
                />
              </div>

              {/* Sort By */}
              <div className="hidden lg:block min-w-[140px]">
                <SearchableSelect
                  options={[
                    { value: "newest", label: "Newest" },
                    { value: "oldest", label: "Oldest" },
                    { value: "a-z", label: "A to Z" },
                    { value: "z-a", label: "Z to A" },
                  ]}
                  value={sortBy}
                  onChange={(value) => setSortBy(value)}
                  placeholder="Sort by..."
                />
              </div>

              {/* Filter Button - Mobile Only */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center justify-center common-button-bg2 p-2.5 rounded-lg active:scale-95 relative"
              >
                <Filter className="w-4 h-4" />
                {(genderFilter !== "all" || sortBy !== "newest") && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </button>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || genderFilter !== "all" || sortBy !== "newest") && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Active filters:
                </span>
                {searchTerm && (
                  <span className="px-2 py-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-full text-xs flex items-center gap-1">
                    "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm("")}
                      className="hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full p-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {genderFilter !== "all" && (
                  <span className="px-2 py-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-full text-xs flex items-center gap-1">
                    Gender: {genderFilter}
                    <button
                      onClick={() => setGenderFilter("all")}
                      className="hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full p-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {sortBy !== "newest" && (
                  <span className="px-2 py-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-full text-xs flex items-center gap-1">
                    Sort:{" "}
                    {sortBy === "a-z"
                      ? "A to Z"
                      : sortBy === "z-a"
                        ? "Z to A"
                        : sortBy === "oldest"
                          ? "Oldest"
                          : sortBy}
                    <button
                      onClick={() => setSortBy("newest")}
                      className="hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full p-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setGenderFilter("all");
                    setSortBy("newest");
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Loading State */}
        {isLoadingAgents && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {[...Array(AGENTS_PER_PAGE)].map((_, index) => (
              <GlassCard key={index}>
                <div className="p-4 sm:p-5 lg:p-6 animate-pulse">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded flex-1"></div>
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-10"></div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Mobile-First Agent Grid */}
        {!isLoadingAgents && paginatedAgents.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {paginatedAgents.map((agent) => {
              return (
              <GlassCard key={agent.id} hover>
                <div className="p-4 sm:p-5 lg:p-6 relative">
                  {/* KB Processing Overlay — shown when modal is minimized */}
                  {creatingAgentId && agent.id === creatingAgentId && isCreatingAgent && isModalMinimized && (
                    kbCreationProgress?.status === 'failed' ? (
                      <div
                        className="absolute inset-0 z-10 rounded-xl sm:rounded-2xl bg-red-50/95 dark:bg-red-950/90 flex flex-col items-center justify-center gap-2 cursor-pointer"
                        onClick={() => {
                          setIsModalMinimized(false);
                          setShowQuickCreateModal(true);
                        }}
                      >
                        <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
                        <div className="text-center px-4">
                          <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                            Knowledge Base Training Failed
                          </p>
                          <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
                            Click to view details
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="absolute inset-0 z-10 rounded-xl sm:rounded-2xl bg-blue-50/95 dark:bg-slate-900/95 flex flex-col items-center justify-center gap-3 cursor-pointer"
                        onClick={() => {
                          setIsModalMinimized(false);
                          setShowQuickCreateModal(true);
                        }}
                      >
                        <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <div className="text-center px-4">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">
                            Training Knowledge Base
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Click to view progress
                          </p>
                        </div>
                        {kbCreationProgress?.progress !== undefined && (
                          <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${kbCreationProgress.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )
                  )}
                  {/* Agent Header - Mobile Optimized */}
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
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                            {formatAgentLanguages((agent as any).language)} • {agent.persona}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {(agent as any).agent_type && (() => {
                            const t = (agent as any).agent_type;
                            const meta = t === 'inbound'
                              ? { label: 'Inbound', Icon: PhoneIncoming, cls: 'bg-black' }
                              : t === 'outbound'
                              ? { label: 'Outbound', Icon: PhoneOutgoing, cls: 'bg-black' }
                              : { label: 'Web', Icon: Globe, cls: 'bg-black' };
                            return (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-white shadow-sm ${meta.cls}`}>
                                <meta.Icon className="w-3 h-3" />
                                {meta.label}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agent Details */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-4 sm:mb-5 text-xs sm:text-sm">
                    {/* Voice */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Voice</span>
                      <span className="text-slate-800 dark:text-white font-medium truncate">
                        {agent.voice}
                        {(agent as any).multilingual_voice && Array.isArray((agent as any).language) && (agent as any).language.includes("multilingual") && (
                          <span className="ml-1 text-[10px] text-purple-600 dark:text-purple-400">·ML</span>
                        )}
                      </span>
                    </div>

                    {/* Gender */}
                    {(agent as any).gender && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Gender</span>
                        <span className="text-slate-800 dark:text-white font-medium capitalize truncate">
                          {(agent as any).gender}
                        </span>
                      </div>
                    )}

                    {/* Business Process */}
                    {(agent as any).business_process && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Process</span>
                        <span className="text-slate-800 dark:text-white font-medium capitalize truncate">
                          {String((agent as any).business_process).replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}

                    {/* Industry */}
                    {(agent as any).industry && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Industry</span>
                        <span className="text-slate-800 dark:text-white font-medium capitalize truncate">
                          {(agent as any).industry}
                        </span>
                      </div>
                    )}

                    {/* Created date */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Created</span>
                      <span className="text-slate-800 dark:text-white font-medium truncate">
                        {new Date(agent.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Company — always show */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Company</span>
                      <span className="text-slate-800 dark:text-white font-medium truncate">
                        {(agent as any).company_name || user?.company || '—'}
                      </span>
                    </div>
                  </div>

                  <AgentCardWorkflows
                    agentId={agent.id}
                    chips={agentWorkflowChips[agent.id] ?? []}
                    loading={workflowsLoading && !agentWorkflowChips[agent.id]}
                  />

                  {/* KB Failed Alert Banner */}
                  {(agent as any).knowledge_base_status === 'failed' && (
                    <button
                      onClick={() => {
                        setKbFailedAgent(agent);
                        setKbReuploadFiles([]);
                        setKbReuploadUrls([]);
                        setKbReuploadWebsiteUrls(['']);
                        setKbReuploadSocialUrls(['']);
                      }}
                      className="w-full mb-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-left group hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <span className="flex-shrink-0 relative">
                        <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-red-700 dark:text-red-400">Knowledge Base Training Failed</p>
                        <p className="text-[11px] text-red-500 dark:text-red-500 truncate">Click to re-upload and retry</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-red-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  {/* Primary Actions - Properly Aligned */}
                  <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={() => navigate(`/agents/${agent.id}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 text-sm font-medium active:scale-[0.98]"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>

                        <button
                          onClick={() => navigate(`/agents/${agent.id}/edit`)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200 text-sm font-medium active:scale-[0.98]"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            (agent as any).knowledge_base_status === 'failed'
                              ? undefined
                              : navigate(`/agents/${agent.id}/train`, { state: { from: "list" } })
                          }
                          disabled={(agent as any).knowledge_base_status === 'failed'}
                          title={(agent as any).knowledge_base_status === 'failed' ? 'KB training failed — re-upload required' : 'Train'}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                            (agent as any).knowledge_base_status === 'failed'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                              : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 active:scale-[0.98]'
                          }`}
                        >
                          <Zap className="w-4 h-4" />
                          Train
                        </button>
                      </div>

                      {/* Secondary Actions */}
                      <div className="flex items-center gap-2">
                    {agent.status === "Published" ? (
                      <button
                        onClick={() => handlePause(agent.id)}
                        disabled={publishingAgents.has(agent.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 common-button-bg2 transition-all duration-200 text-sm font-medium ${
                          publishingAgents.has(agent.id)
                            ? "opacity-50 cursor-not-allowed"
                            : "active:scale-[0.98]"
                        }`}
                      >
                        {publishingAgents.has(agent.id) ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        ) : (
                          <Pause className="w-4 h-4" />
                        )}
                        {publishingAgents.has(agent.id)
                          ? "Pausing..."
                          : "Pause"}
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          (agent as any).is_active
                            ? handlePause(agent.id)
                            : handlePublish(agent.id)
                        }
                        disabled={publishingAgents.has(agent.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 transition-all duration-200 text-sm font-medium ${
                          publishingAgents.has(agent.id)
                            ? "opacity-50 cursor-not-allowed"
                            : "active:scale-[0.98]"
                        } ${
                          (agent as any).is_active
                            ? "common-button-bg2"
                            : "common-button-bg"
                        }`}
                      >
                        {publishingAgents.has(agent.id) ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        ) : (agent as any).is_active ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        {publishingAgents.has(agent.id)
                          ? (agent as any).is_active
                            ? "Pausing..."
                            : "Publishing..."
                          : (agent as any).is_active
                            ? "Pause"
                            : "Publish"}
                      </button>
                    )}

                    {(agent.status === "Published" || (agent as any).is_active) && (
                    <button
                      onClick={() => {
                        setCurrentAgent(agent);
                        setShowQRModal(true);
                      }}
                      className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95"
                      title="Show QR code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    )}

                    <button
                      onClick={() => handleDeleteClick(agent.id)}
                      className="p-2.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95"
                      title="Delete agent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalAgents > 0 && (
          <div className="mt-4 lg:mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalAgents}
              itemsPerPage={AGENTS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* Mobile-Optimized Empty State */}
        {filteredAgents.length === 0 && !isLoadingAgents && (
          <div className="text-center py-12 lg:py-16 px-4">
            <Bot className="w-20 lg:w-24 h-20 lg:h-24 text-slate-300 dark:text-slate-600 mx-auto mb-6" />
            <h3 className="text-xl lg:text-2xl font-medium text-slate-600 dark:text-slate-400 mb-3">
              {searchTerm || genderFilter !== "all"
                ? "No agents found"
                : "No agents created yet"}
            </h3>
            <p className="text-sm lg:text-base text-slate-500 dark:text-slate-500 max-w-md lg:max-w-lg mx-auto mb-6 leading-relaxed">
              {searchTerm || genderFilter !== "all"
                ? "Try adjusting your search or filter criteria to find what you're looking for"
                : "Create your first AI agent to get started with automated conversations and boost your business efficiency"}
            </p>
            {!searchTerm && genderFilter === "all" && isDeveloper && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowQuickCreateModal(true)}
                  className="w-full sm:w-auto common-button-bg px-6 py-3 rounded-xl shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Create your first AI Employee
                </button>
                <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">
                  Get started in just 2 minutes ⚡
                </p>
              </div>
            )}
            {(searchTerm || genderFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setGenderFilter("all");
                }}
                className="w-full sm:w-auto common-button-bg2 px-6 py-2.5 rounded-lg"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* QR Modal */}
        {showQRModal && currentAgent && (
          <AgentQRModal
            agent={currentAgent}
            onClose={() => setShowQRModal(false)}
          />
        )}

        {/* KB Failed Re-upload Modal */}
        {kbFailedAgent && createPortal(
          <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4" onClick={() => setKbFailedAgent(null)}>
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
                  <FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 dark:text-white text-base">Re-train Knowledge Base</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Agent: <span className="font-medium text-slate-700 dark:text-slate-300">{(kbFailedAgent as any).name}</span>
                  </p>
                </div>
                <button onClick={() => setKbFailedAgent(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto flex-1 p-5 space-y-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>

                {/* Error callout */}
                <div className="flex gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400">Last training attempt failed</p>
                    <p className="text-xs text-red-600/80 dark:text-red-500/80 mt-0.5">
                      {(kbFailedAgent as any).knowledge_base_error || 'The knowledge base could not be processed. Please re-upload your files and try again.'}
                    </p>
                  </div>
                </div>

                {/* Intro */}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload your documents, FAQs, or website links. Your AI will learn from these to give accurate, company-specific answers.
                </p>

                {/* File Upload */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Files
                    {kbReuploadFiles.length === 0 && !kbReuploadWebsiteUrls.some(u => u.trim()) && (
                      <span className="text-red-500 text-xs">(required — at least one file or URL)</span>
                    )}
                  </label>

                  {/* Drop zone */}
                  <div
                    className={`border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-5 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-800/50 ${isKbReuploading ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => !isKbReuploading && document.getElementById('kb-reupload-input')?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-400', 'bg-blue-50/50'); }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50/50'); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50/50');
                      if (!isKbReuploading) handleKbReuploadFiles(e.dataTransfer.files);
                    }}
                  >
                    <input
                      id="kb-reupload-input"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => { handleKbReuploadFiles(e.target.files); e.target.value = ''; }}
                    />
                    <div className="flex flex-col items-center gap-2">
                      {isKbReuploading ? (
                        <><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /><p className="text-sm text-slate-500">Uploading files…</p></>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 text-slate-400">
                            <FileText className="w-7 h-7" /><File className="w-7 h-7" />
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400"><span className="text-blue-500 font-medium">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-slate-400">PDF, DOC, DOCX, TXT, CSV, Excel (max 25 MB each)</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Uploaded files list */}
                  {kbReuploadFiles.length > 0 && (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {kbReuploadFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          {file.type.includes('pdf') ? <FileText className="w-4 h-4 text-red-500 flex-shrink-0" /> : <File className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                          <span className="flex-1 text-xs text-slate-700 dark:text-slate-300 truncate">{file.name}</span>
                          <span className="text-[10px] text-slate-400 hidden sm:inline">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          {kbReuploadUrls[i] && <span className="text-[10px] text-green-500">✓</span>}
                          <button onClick={() => { setKbReuploadFiles(p => p.filter((_, j) => j !== i)); setKbReuploadUrls(p => p.filter((_, j) => j !== i)); }} className="p-0.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Website URLs */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Link className="w-4 h-4" />
                    Website URLs
                  </label>
                  {kbReuploadWebsiteUrls.map((url, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setKbReuploadWebsiteUrls(p => p.map((u, j) => j === i ? e.target.value : u))}
                        placeholder="https://yourcompany.com"
                        className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                      />
                      {kbReuploadWebsiteUrls.length > 1 && (
                        <button onClick={() => setKbReuploadWebsiteUrls(p => p.filter((_, j) => j !== i))} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"><X className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setKbReuploadWebsiteUrls(p => [...p, ''])} className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 text-sm">
                    <Plus className="w-4 h-4" />Add another URL
                  </button>
                </div>

                {/* Social Media URLs */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Social Media Links
                  </label>
                  {kbReuploadSocialUrls.map((url, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setKbReuploadSocialUrls(p => p.map((u, j) => j === i ? e.target.value : u))}
                        placeholder="https://facebook.com/yourpage or https://x.com/yourhandle"
                        className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                      />
                      {kbReuploadSocialUrls.length > 1 && (
                        <button onClick={() => setKbReuploadSocialUrls(p => p.filter((_, j) => j !== i))} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"><X className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setKbReuploadSocialUrls(p => [...p, ''])} className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 text-sm">
                    <Plus className="w-4 h-4" />Add social media link
                  </button>
                </div>

                {/* Summary */}
                {(kbReuploadFiles.length > 0 || kbReuploadWebsiteUrls.some(u => u.trim()) || kbReuploadSocialUrls.some(u => u.trim())) && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      📚 {kbReuploadFiles.length} file(s), {kbReuploadWebsiteUrls.filter(u => u.trim()).length} URL(s), and {kbReuploadSocialUrls.filter(u => u.trim()).length} social media link(s) will be added to knowledge base
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-2 px-5 py-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                <button
                  onClick={() => setKbFailedAgent(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleKbReuploadSubmit}
                  disabled={isKbReuploading || (kbReuploadUrls.length === 0 && !kbReuploadWebsiteUrls.some(u => u.trim()) && !kbReuploadSocialUrls.some(u => u.trim()))}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isKbReuploading ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />Submitting…</>
                  ) : (
                    <><Zap className="w-3.5 h-3.5" />Retry Training</>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm &&
          createPortal(
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
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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
            </div>,
            document.body
          )}

        {/* Publish Confirmation Modal */}
        {showPublishConfirm &&
          createPortal(
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
                    Are you sure you want to publish this agent? It will become available to users.
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
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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
            </div>,
            document.body
          )}

        {/* Contact Sales Modal */}
        {showPublishContactModal &&
          createPortal(
            <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-full mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white text-center mb-2">
                    Upgrade to Publish Live
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
                    Publishing an agent live is available on a paid subscription. Upgrade your plan or contact our sales team to enable go-live access for your account.
                  </p>
                  <div className="flex flex-col gap-3">
                    <a
                      href={salesWhatsAppHref}
                      target="_blank"
                      rel="noreferrer"
                      className="h-11 px-4 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Contact on WhatsApp</span>
                    </a>
                    <a
                      href={salesEmailHref}
                      className="h-11 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Send Email</span>
                    </a>
                    <button
                      onClick={handlePublishCancel}
                      className="h-11 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Pause Confirmation Modal */}
        {showPauseConfirm &&
          createPortal(
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
                    Are you sure you want to pause this agent? It will no longer be available to users.
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
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 dark:border-slate-300 border-t-slate-700 dark:border-t-slate-100"></div>
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
            </div>,
            document.body
          )}

        {/* Integration Code Modal */}
        {showIntegrationCodeModal && agentForIntegration &&
          createPortal(
            <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-2 sm:p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
                      Widget Integration Code
                    </h3>
                    <button
                      onClick={() => {
                        setShowIntegrationCodeModal(false);
                        setAgentForIntegration(null);
                      }}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                    Copy and paste this script tag into your website's HTML. The widget will automatically load your saved customizations.
                  </p>

                  {/* Code Block */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Script Tag
                      </label>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        Live Configuration
                      </div>
                    </div>

                    <div className="relative">
                      {(() => {
                        const agentObj = agents.find((a: any) => a.id === agentForIntegration);
                        const agentLang = agentObj?.language || '';
                        const embedCode = buildWidgetEmbedScript({
                          agentId: agentForIntegration,
                          userId: user?.id,
                          ...(agentLang ? { language: agentLang } : {}),
                        });
                        return (
                          <>
                      <code className="common-bg-icons block w-full p-4 rounded-lg text-xs sm:text-sm font-mono text-slate-800 dark:text-white overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {embedCode}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(embedCode);
                          appToast.success("Code copied to clipboard!", { duration: 2000 });
                        }}
                        className="absolute top-3 right-3 p-2 common-button-bg rounded-lg hover:shadow-sm transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
                      >
                        <Copy className="w-4 h-4 text-white" />
                      </button>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Installation Instructions */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      📋 Quick Installation:
                    </h4>
                    <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside">
                      <li>Copy the script tag above</li>
                      <li>Paste it in your website's HTML, before the closing &lt;/body&gt; tag</li>
                      <li>The widget will load automatically with all your custom settings</li>
                      <li>To update: copy new script when you change settings</li>
                    </ol>
                  </div>

                  {/* Close Button */}
                  <div className="mt-6 flex items-center justify-end">
                    <button
                      onClick={() => {
                        setShowIntegrationCodeModal(false);
                        setAgentForIntegration(null);
                      }}
                      className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

        {showMobileFilters &&
          createPortal(
            <div className="lg:hidden">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/50 z-[50]"
                onClick={() => setShowMobileFilters(false)}
              />
              {/* Bottom Sheet */}
              <div className="fixed inset-x-0 bottom-0 z-[51] animate-slide-up">
                <div className="bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden">
                  {/* Handle Bar */}
                  <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                  </div>

                  {/* Header */}
                  <div className="flex items-center justify-between px-5 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                      Filters & Sort
                    </h3>
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="px-5 py-4 space-y-5 overflow-y-auto max-h-[50vh]">
                    {/* Gender Filter */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Gender
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: "all", label: "All" },
                          { value: "male", label: "Male" },
                          { value: "female", label: "Female" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setGenderFilter(option.value)}
                            className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                              genderFilter === option.value
                                ? "bg-blue-500 text-white shadow-md"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sort By */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Sort By
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "newest", label: "Newest" },
                          { value: "oldest", label: "Oldest" },
                          { value: "a-z", label: "A → Z" },
                          { value: "z-a", label: "Z → A" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setSortBy(option.value)}
                            className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                              sortBy === option.value
                                ? "bg-blue-500 text-white shadow-md"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 pb-safe">
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setGenderFilter("all");
                          setSortBy("newest");
                        }}
                        className="flex-1 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 font-medium active:scale-[0.98] transition-transform"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setShowMobileFilters(false)}
                        className="flex-1 py-3 common-button-bg rounded-xl font-medium active:scale-[0.98] transition-transform"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}

        {/* Quick Create AI Employee Modal + paired Template Details Modal.
            Extracted to ./agents/QuickCreateAgentWizard.tsx. The minimize /
            creation state below is CONTROLLED here (not inside the wizard)
            because the agent grid overlay and the "Create AI Employee" button
            both read it, and the overlay writes it back. */}
        <QuickCreateAgentWizard
          open={showQuickCreateModal}
          onClose={() => setShowQuickCreateModal(false)}
          onRequestOpen={() => setShowQuickCreateModal(true)}
          dataSource={realAgentDataSource}
          publishAllowedEmails={PUBLISH_ALLOWED_EMAILS}
          userEmail={user?.email}
          isModalMinimized={isModalMinimized}
          setIsModalMinimized={setIsModalMinimized}
          isCreatingAgent={isCreatingAgent}
          setIsCreatingAgent={setIsCreatingAgent}
          creatingAgentId={creatingAgentId}
          setCreatingAgentId={setCreatingAgentId}
          kbCreationProgress={kbCreationProgress}
          setKbCreationProgress={setKbCreationProgress}
          onAgentListRefresh={handleAgentListRefresh}
        />
      </div>
    );
  }


  // Fallback redirect if no route matched
  return <Navigate to="/agents" replace />;
};

export default AgentManagement;