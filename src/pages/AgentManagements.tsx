import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import SearchableSelect from "../components/SearchableSelect";
import Tooltip from "../components/Tooltip";
import { AgentWidgetCustomization, AgentQRModal } from "../ClientDashboard/Employees/agents";
import { useAgent } from "../contexts/AgentContext";
import { useAuth } from "../contexts/AuthContext";
import { isDeveloperUser } from "../lib/utils";
import { liveKitService, LiveKitMessage } from "../services/liveKitService";
import {
  Bot,
  ArrowLeft,
  Save,
  Play,
  Pause,
  Eye,
  Edit,
  Trash2,
  Copy,
  Download,
  MessageSquare,
  Phone,
  Globe,
  Shield,
  Zap,
  Clock,
  Users,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Info,
  Lightbulb,
  Plus,
  Search,
  Filter,
  Settings,
  QrCode,
} from "lucide-react";

const AgentManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { agents, currentAgent, setCurrentAgent, addAgent, updateAgent, isLoading, error, refreshAgents, publishAgentStatus, unpublishAgentStatus } =
    useAgent();
  const { user } = useAuth();

  // Check if current user is developer
  const isDeveloper = isDeveloperUser(user?.email);

  const isCreate = location.pathname.includes("/create");
  const isEdit = location.pathname.includes("/edit");
  const isTrain = location.pathname.includes("/train");
  const isView = id && !isEdit && !isTrain;
  const isList = !id && !isCreate; // Main agent list page

  const [formData, setFormData] = useState({
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

  const [showTemplates, setShowTemplates] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showQRModal, setShowQRModal] = useState(false);

  // LiveKit test modal state
  const [showTestModal, setShowTestModal] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState('');
  const [callState, setCallState] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [activeTab, setActiveTab] = useState<'call' | 'transcript' | 'chat'>('call');
  const [messages, setMessages] = useState<LiveKitMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [publishingAgents, setPublishingAgents] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (id && !isCreate) {
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
      }
    } else if (isCreate) {
      setFormData({
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
    }
  }, [id, isCreate, agents, setCurrentAgent]);

  const businessProcesses = [
    { value: "customer-support", label: "Customer Support", group: "Support" },
    { value: "sales-marketing", label: "Sales & Marketing", group: "Sales" },
    {
      value: "appointment-setting",
      label: "Appointment Setting",
      group: "Sales",
    },
    {
      value: "lead-qualification",
      label: "Lead Qualification",
      group: "Sales",
    },
    {
      value: "product-explanation",
      label: "Product Explanation",
      group: "Support",
    },
    {
      value: "order-processing",
      label: "Order Processing",
      group: "Operations",
    },
    {
      value: "technical-support",
      label: "Technical Support",
      group: "Support",
    },
    {
      value: "billing-inquiries",
      label: "Billing Inquiries",
      group: "Support",
    },
    {
      value: "feedback-collection",
      label: "Feedback Collection",
      group: "Operations",
    },
    { value: "onboarding", label: "Customer Onboarding", group: "Operations" },
  ];

  const industries = [
    { value: "real-estate", label: "Real Estate" },
    { value: "healthcare", label: "Healthcare" },
    { value: "dental", label: "Dental" },
    { value: "fitness", label: "Fitness & Wellness" },
    { value: "education", label: "Education" },
    { value: "finance", label: "Finance & Banking" },
    { value: "insurance", label: "Insurance" },
    { value: "ecommerce", label: "E-commerce" },
    { value: "retail", label: "Retail" },
    { value: "technology", label: "Technology" },
    { value: "saas", label: "SaaS" },
    { value: "legal", label: "Legal Services" },
    { value: "consulting", label: "Consulting" },
    { value: "accounting", label: "Accounting" },
    { value: "hospitality", label: "Hospitality" },
    { value: "restaurants", label: "Restaurants" },
    { value: "automotive", label: "Automotive" },
    { value: "construction", label: "Construction" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "travel", label: "Travel & Tourism" },
    { value: "beauty", label: "Beauty & Salon" },
    { value: "home-services", label: "Home Services" },
    { value: "nonprofit", label: "Non-Profit" },
    { value: "government", label: "Government" },
    { value: "entertainment", label: "Entertainment" },
    { value: "other", label: "Other" },
  ];

  const genders = [
    { value: "Female", label: "Female" },
    { value: "Male", label: "Male" },
    { value: "Non-binary", label: "Non-binary" },
    { value: "Other", label: "Other" },
  ];

  const templates = {
    "customer-support-real-estate": {
      name: "Real Estate Support Agent",
      description:
        "Handles property inquiries, scheduling viewings, and providing property information",
      features: [
        "Property Search",
        "Viewing Scheduling",
        "Market Updates",
        "Document Assistance",
      ],
      persona: "Formal",
      customInstructions:
        "You are a knowledgeable real estate assistant. Help clients with property inquiries, schedule viewings, provide market insights, and assist with documentation. Always be professional and detail-oriented.",
      guardrailsLevel: "High",
    },
    "sales-marketing-healthcare": {
      name: "Healthcare Sales Assistant",
      description:
        "Promotes healthcare services, books consultations, and provides service information",
      features: [
        "Service Promotion",
        "Consultation Booking",
        "Insurance Queries",
        "Health Education",
      ],
      persona: "Empathetic",
      customInstructions:
        "You are a caring healthcare sales assistant. Help patients understand services, book appointments, answer insurance questions, and provide health education. Always prioritize patient care and privacy.",
      guardrailsLevel: "High",
    },
    "appointment-setting-dental": {
      name: "Dental Appointment Scheduler",
      description:
        "Schedules dental appointments, handles cancellations, and provides dental care information",
      features: [
        "Appointment Booking",
        "Reminder Calls",
        "Treatment Info",
        "Insurance Verification",
      ],
      persona: "Reassuring (Support)",
      customInstructions:
        "You are a friendly dental appointment scheduler. Help patients book appointments, provide treatment information, handle insurance verification, and ease dental anxiety with reassuring communication.",
      guardrailsLevel: "Medium",
    },
    "lead-qualification-saas": {
      name: "SaaS Lead Qualifier",
      description:
        "Qualifies software leads, demos features, and nurtures prospects through the sales funnel",
      features: [
        "Lead Scoring",
        "Demo Scheduling",
        "Feature Explanation",
        "Pricing Information",
      ],
      persona: "Persuasive (Sales)",
      customInstructions:
        "You are a tech-savvy SaaS sales assistant. Qualify leads by understanding their needs, explain software features, schedule demos, and provide pricing information. Focus on value proposition and ROI.",
      guardrailsLevel: "Medium",
    },
  };

  const getTemplate = () => {
    const key = `${formData.businessProcess}-${formData.industry}`;
    return (
      templates[key as keyof typeof templates] || {
        name: `${
          businessProcesses.find((bp) => bp.value === formData.businessProcess)
            ?.label || "Custom"
        } Agent`,
        description: `Handles ${
          businessProcesses
            .find((bp) => bp.value === formData.businessProcess)
            ?.label?.toLowerCase() || "various tasks"
        } for ${
          industries
            .find((ind) => ind.value === formData.industry)
            ?.label?.toLowerCase() || "your business"
        }`,
        features: [
          "Customer Interaction",
          "Query Resolution",
          "Information Provision",
          "Process Automation",
        ],
        persona: "Friendly",
        customInstructions: `You are a professional AI assistant specializing in ${
          businessProcesses
            .find((bp) => bp.value === formData.businessProcess)
            ?.label?.toLowerCase() || "customer service"
        } for the ${
          industries
            .find((ind) => ind.value === formData.industry)
            ?.label?.toLowerCase() || "business"
        } industry. Provide helpful, accurate, and timely assistance to users.`,
        guardrailsLevel: "Medium",
      }
    );
  };

  const applyTemplate = () => {
    const template = getTemplate();
    setFormData((prev) => ({
      ...prev,
      persona: template.persona,
      customInstructions: template.customInstructions,
      guardrailsLevel: template.guardrailsLevel,
    }));
    setShowTemplates(false);
  };

  const handleSave = () => {
    // Validate agent name
    if (!formData.name || formData.name.trim() === "") {
      alert("Agent name is required. Please enter a name for your agent.");
      return;
    }

    if (isCreate) {
      addAgent({
        name: formData.name,
        status: "Draft",
        persona: formData.persona,
        language: formData.language,
        voice: formData.voice,
        stats: {
          conversations: 0,
          successRate: 0,
          avgResponseTime: 0,
          activeUsers: 0,
        },
      });
      navigate("/agents");
    } else if (isEdit && currentAgent) {
      updateAgent(currentAgent.id, {
        name: formData.name,
        persona: formData.persona,
        language: formData.language,
        voice: formData.voice,
      });
      navigate(`/agents/${currentAgent.id}`);
    }
  };

  const handlePublish = async (agentId: string) => {
    try {
      // Add to publishing set for loading state
      setPublishingAgents(prev => new Set(prev).add(agentId));
      
      // Use context function for publication
      await publishAgentStatus(agentId);
      console.log('✅ Agent published successfully');
    } catch (error: any) {
      console.error('❌ Error publishing agent:', error);
      alert(error.message || 'Failed to publish agent. Please try again.');
    } finally {
      // Remove from publishing set
      setPublishingAgents(prev => {
        const next = new Set(prev);
        next.delete(agentId);
        return next;
      });
    }
  };

  const handlePause = async (agentId: string) => {
    try {
      // Add to publishing set for loading state
      setPublishingAgents(prev => new Set(prev).add(agentId));
      
      // Use context function for unpublication
      await unpublishAgentStatus(agentId);
      console.log('✅ Agent unpublished successfully');
    } catch (error: any) {
      console.error('❌ Error unpublishing agent:', error);
      alert(error.message || 'Failed to unpublish agent. Please try again.');
    } finally {
      // Remove from publishing set
      setPublishingAgents(prev => {
        const next = new Set(prev);
        next.delete(agentId);
        return next;
      });
    }
  };

  const voiceOptions = [
    {
      value: "Sarah - Professional",
      label: "Sarah - Professional",
      group: "English",
    },
    { value: "John - Friendly", label: "John - Friendly", group: "English" },
    { value: "Emma - Warm", label: "Emma - Warm", group: "English" },
    { value: "Arjun - Friendly", label: "Arjun - Friendly", group: "Hindi" },
    {
      value: "Priya - Professional",
      label: "Priya - Professional",
      group: "Hindi",
    },
    { value: "Raj - Confident", label: "Raj - Confident", group: "Hindi" },
  ];

  const languageOptions = [
    // India
    { value: "Hindi", label: "Hindi", group: "India" },
    { value: "Punjabi", label: "Punjabi", group: "India" },
    { value: "Tamil", label: "Tamil", group: "India" },
    { value: "Telugu", label: "Telugu", group: "India" },
    { value: "Bengali", label: "Bengali", group: "India" },
    { value: "Marathi", label: "Marathi", group: "India" },
    { value: "Gujarati", label: "Gujarati", group: "India" },
    { value: "Kannada", label: "Kannada", group: "India" },
    { value: "Malayalam", label: "Malayalam", group: "India" },
    { value: "Odia", label: "Odia", group: "India" },
    { value: "Urdu", label: "Urdu", group: "India" },
    // Middle East
    { value: "Arabic", label: "Arabic", group: "Middle East" },
    { value: "Persian", label: "Persian", group: "Middle East" },
    { value: "Hebrew", label: "Hebrew", group: "Middle East" },
    { value: "Turkish", label: "Turkish", group: "Middle East" },
    // Europe
    { value: "English (UK)", label: "English (UK)", group: "Europe" },
    { value: "French", label: "French", group: "Europe" },
    { value: "German", label: "German", group: "Europe" },
    { value: "Spanish", label: "Spanish", group: "Europe" },
    { value: "Italian", label: "Italian", group: "Europe" },
    { value: "Dutch", label: "Dutch", group: "Europe" },
    // Americas
    { value: "English (US)", label: "English (US)", group: "Americas" },
    { value: "Spanish (MX)", label: "Spanish (MX)", group: "Americas" },
    { value: "Portuguese (BR)", label: "Portuguese (BR)", group: "Americas" },
    { value: "French (CA)", label: "French (CA)", group: "Americas" },
    // APAC
    { value: "Chinese (Mandarin)", label: "Chinese (Mandarin)", group: "APAC" },
    { value: "Japanese", label: "Japanese", group: "APAC" },
    { value: "Korean", label: "Korean", group: "APAC" },
    { value: "Thai", label: "Thai", group: "APAC" },
    { value: "Vietnamese", label: "Vietnamese", group: "APAC" },
  ];

  const responseStyleOptions = [
    { value: "Concise", label: "Concise" },
    { value: "Balanced", label: "Balanced" },
    { value: "Detailed", label: "Detailed" },
  ];

  const maxResponseOptions = [
    { value: "Short (50 words)", label: "Short (50 words)" },
    { value: "Medium (150 words)", label: "Medium (150 words)" },
    { value: "Long (300 words)", label: "Long (300 words)" },
  ];

  const contextWindowOptions = [
    { value: "Small (4K tokens)", label: "Small (4K tokens)" },
    { value: "Standard (8K tokens)", label: "Standard (8K tokens)" },
    { value: "Large (16K tokens)", label: "Large (16K tokens)" },
  ];

  // LiveKit callback functions - EXACT implementation from widget.js
  const handleStartCall = async () => {
    console.log('🎯 Starting LiveKit voice test...');
    setIsCallActive(true);
    setCallStatus('🔄 Initializing...');
    setCallState('connecting');
    setMessages([]); // Clear previous messages
    
    try {
      // Setup LiveKit callbacks
      liveKitService.setCallbacks({
        onMessage: (message: LiveKitMessage) => {
          console.log('📨 New message received:', message);
          setMessages(prev => [...prev, message]);
        },
        onConnected: () => {
          console.log('✅ LiveKit connected');
          setCallState('connected');
          setCallStatus('✅ Connected - Speak now!');
        },
        onDisconnected: (reason?: string) => {
          console.log('❌ LiveKit disconnected:', reason);
          setCallState('disconnected');
          setCallStatus(reason ? `❌ Disconnected: ${reason}` : '❌ Disconnected');
          setIsCallActive(false);
        },
        onConnectionStateChange: (state: string) => {
          console.log('🔗 Connection state changed:', state);
        },
        onError: (error: string) => {
          console.error('❌ LiveKit error:', error);
          setCallStatus(`❌ Error: ${error}`);
          setIsCallActive(false);
        },
        onStatusUpdate: (status: string, state: 'connecting' | 'connected' | 'disconnected') => {
          console.log('📊 Status update:', status, state);
          setCallStatus(status);
          setCallState(state);
        }
      });

      // Connect to LiveKit with agent context
      await liveKitService.connect(
        currentAgent?.id || 'test-agent',
        'en-US'
      );

      console.log('🎤 LiveKit connection initiated');
    } catch (error) {
      console.error('❌ Failed to start call:', error);
      setCallStatus('❌ Failed to connect');
      setIsCallActive(false);
      setCallState('disconnected');
    }
  };

  const handleEndCall = async () => {
    console.log('🛑 Ending LiveKit call...');
    try {
      await liveKitService.disconnect();
      setIsCallActive(false);
      setCallState('disconnected');
      setCallStatus('📴 Call ended');
    } catch (error) {
      console.error('❌ Error ending call:', error);
      setIsCallActive(false);
      setCallState('disconnected');
      setCallStatus('📴 Call ended');
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !isCallActive) return;

    try {
      console.log('💬 Sending chat message:', chatInput);
      await liveKitService.sendMessage(chatInput.trim());
      setChatInput('');
    } catch (error) {
      console.error('❌ Failed to send message:', error);
    }
  };

  // Filter agents based on search and status
  const filteredAgents = isDeveloper
    ? agents.filter((agent) => {
        const matchesSearch = agent.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === "all" ||
          agent.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
      })
    : [];

  // MAIN AGENT LIST PAGE
  if (isList) {
    return (
      <div className="space-y-4 lg:space-y-6 w-full max-w-full overflow-hidden">
        {/* Header with Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 lg:gap-4 flex-1">
            <div className="bg-white/50 flex items-center justify-center gap-2 dark:bg-slate-800/50 rounded-xl px-4 lg:px-6 py-2.5 lg:py-2 text-center shadow-sm transition-all duration-200 hover:shadow-md">
              <p className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-white">
                {isDeveloper ? agents.length : 0}
              </p>
              <p className="text-xs lg:text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Agents
              </p>
            </div>
            <div className="bg-white/50 flex items-center justify-center gap-2 dark:bg-slate-800/50 rounded-xl px-4 lg:px-6 py-2.5 lg:py-2 text-center shadow-sm transition-all duration-200 hover:shadow-md">
              <p className="text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400">
                {isDeveloper
                  ? agents.filter((a) => a.status === "Published").length
                  : 0}
              </p>
              <p className="text-xs lg:text-sm font-medium text-slate-600 dark:text-slate-400">
                Published
              </p>
            </div>
            <div className="bg-white/50 flex items-center justify-center gap-2 dark:bg-slate-800/50 rounded-xl px-4 lg:px-6 py-2.5 lg:py-2 text-center shadow-sm transition-all duration-200 hover:shadow-md">
              <p className="text-xl lg:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {isDeveloper
                  ? agents.filter((a) => a.status === "Training").length
                  : 0}
              </p>
              <p className="text-xs lg:text-sm font-medium text-slate-600 dark:text-slate-400">
                Training
              </p>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={() => isDeveloper && navigate("/agents/create")}
            disabled={!isDeveloper}
            className={`flex items-center justify-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl transition-all duration-200 shadow-sm whitespace-nowrap ${
              isDeveloper
                ? "common-button-bg transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50"
            }`}
          >
            <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="text-sm lg:text-base font-medium">
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

              {/* Status Filter */}
              <div className="hidden lg:block min-w-[180px]">
                <SearchableSelect
                  options={[
                    { value: "all", label: "All Status" },
                    { value: "published", label: "Published" },
                    { value: "draft", label: "Draft" },
                    { value: "training", label: "Training" },
                  ]}
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value)}
                  placeholder="Filter by status..."
                />
              </div>

              {/* Filter Button - Mobile Only */}
              <button className="lg:hidden flex items-center justify-center common-button-bg2 p-2.5 rounded-lg active:scale-95">
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || statusFilter !== "all") && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Active filters:
                </span>
                {searchTerm && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs flex items-center gap-1">
                    "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm("")}
                      className="hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full p-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {statusFilter !== "all" && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs flex items-center gap-1">
                    Status: {statusFilter}
                    <button
                      onClick={() => setStatusFilter("all")}
                      className="hover:bg-green-200 dark:hover:bg-green-800/50 rounded-full p-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Mobile-First Agent Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {[1, 2, 3].map((i) => (
              <GlassCard key={i}>
                <div className="p-4 sm:p-5 lg:p-6 animate-pulse">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : error ? (
          <GlassCard>
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                Failed to Load Agents
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
              <button
                onClick={refreshAgents}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </GlassCard>
        ) : filteredAgents.length === 0 ? (
          <GlassCard>
            <div className="p-8 text-center">
              <Bot className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                No agents found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "No agents match your current filters"
                  : "Create your first AI agent to get started"}
              </p>
              <button
                onClick={() => navigate('/agents/create')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create Agent
              </button>
            </div>
          </GlassCard>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {filteredAgents.map((agent) => (
            <GlassCard key={agent.id} hover>
              <div className="p-4 sm:p-5 lg:p-6">
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
                          {agent.language} • {agent.persona}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                          agent.status === "Published"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : agent.status === "Training"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {agent.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Agent Details - Compact for Mobile */}
                <div className="space-y-2 mb-4 sm:mb-5">
                  <div className="flex items-center justify-start text-xs sm:text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Voice:
                    </span>
                    <span className="text-slate-800 dark:text-white truncate ml-2 text-right">
                      {agent.voice}
                    </span>
                  </div>
                  <div className="flex items-center justify-start text-xs sm:text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Created:
                    </span>
                    <span className="text-slate-800 dark:text-white">
                      {agent.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>

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
                      navigate(`/agents/${agent.id}/train`, {
                        state: { from: "list" },
                      })
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-200 text-sm font-medium active:scale-[0.98]"
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
                      className={`flex-1 flex items-center justify-center gap-1.5 transition-all duration-200 text-sm font-medium active:scale-[0.98] ${
                        publishingAgents.has(agent.id) 
                          ? 'common-button-bg2 opacity-50 cursor-not-allowed' 
                          : 'common-button-bg2'
                      }`}
                    >
                      {publishingAgents.has(agent.id) ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Pausing...
                        </>
                      ) : (
                        <>
                          <Pause className="w-4 h-4" />
                          Pause
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePublish(agent.id)}
                      disabled={publishingAgents.has(agent.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 transition-all duration-200 text-sm font-medium active:scale-[0.98] ${
                        publishingAgents.has(agent.id) 
                          ? 'common-button-bg2 opacity-50 cursor-not-allowed' 
                          : 'common-button-bg'
                      }`}
                    >
                      {publishingAgents.has(agent.id) ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Publish
                        </>
                      )}
                    </button>
                  )}

                  <button className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95">
                    <Copy className="w-4 h-4" />
                  </button>

                  <button className="p-2.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
        )}
          <div className="text-center py-12 lg:py-16 px-4">
            <Bot className="w-20 lg:w-24 h-20 lg:h-24 text-slate-300 dark:text-slate-600 mx-auto mb-6" />
            <h3 className="text-xl lg:text-2xl font-medium text-slate-600 dark:text-slate-400 mb-3">
              {searchTerm || statusFilter !== "all"
                ? "No agents found"
                : "No agents created yet"}
            </h3>
            <p className="text-sm lg:text-base text-slate-500 dark:text-slate-500 max-w-md lg:max-w-lg mx-auto mb-6 leading-relaxed">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria to find what you're looking for"
                : "Create your first AI agent to get started with automated conversations and boost your business efficiency"}
            </p>
            {!searchTerm && statusFilter === "all" && isDeveloper && (
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/agents/create")}
                  className="w-full sm:w-auto common-button-bg px-6 py-3 rounded-xl shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Create Your First Agent
                </button>
                <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">
                  Get started in just 2 minutes ⚡
                </p>
              </div>
            )}
            {(searchTerm || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="w-full sm:w-auto common-button-bg2 px-6 py-2.5 rounded-lg"
              >
                Clear Filters
              </button>
            )}
          </div>
      </div>
    );
  }

  // VIEW MODE - Show agent details
  if (isView && currentAgent) {
    return (
      <div className="space-y-4 sm:space-y-6 w-full">
        {/* Enhanced Mobile-First Header */}
        <GlassCard>
          <div className="p-4 sm:p-6">
            {/* Top row with back button and actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              {/* Main agent info section */}
              <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                <button
                  onClick={() => navigate("/agents")}
                  className="common-button-bg2 p-2 sm:p-2.5 rounded-xl flex-shrink-0 touch-manipulation"
                >
                  <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600 dark:text-slate-300" />
                </button>

                <div className="flex items-start gap-3 sm:gap-4 lg:gap-4 min-w-0 flex-1">
                  {/* Agent avatar/icon */}
                  <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 common-bg-icons flex items-center justify-center flex-shrink-0 rounded-xl">
                    <Bot className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-black dark:text-white" />
                  </div>

                  {/* Agent details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-slate-800 dark:text-white leading-tight truncate">
                          {currentAgent.name}
                        </h1>

                        {/* Agent meta info - Mobile optimized */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 sm:mt-2">
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 sm:w-4 h-3 sm:h-4" />
                            <span className="truncate">
                              {currentAgent.language}
                            </span>
                          </div>
                          <div className="hidden xs:flex items-center gap-1">
                            <Clock className="w-3 sm:w-4 h-3 sm:h-4" />
                            <span className="truncate">
                              Created{" "}
                              {currentAgent.createdAt.toLocaleDateString()}
                            </span>
                          </div>
                          <div className="xs:hidden flex items-center gap-1">
                            <Clock className="w-3 sm:w-4 h-3 sm:h-4" />
                            <span className="truncate">
                              {currentAgent.createdAt.toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex-shrink-0 ${
                                currentAgent.status === "Published"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                  : currentAgent.status === "Training"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {currentAgent.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons - Mobile stacked */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <button
                  onClick={() => navigate(`/agents/${currentAgent.id}/edit`)}
                  className="flex-1 sm:flex-none common-button-bg2 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl touch-manipulation min-h-[40px]"
                >
                  <Edit className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  <span className="text-xs sm:text-sm font-medium">Edit</span>
                </button>
                {/* Test Voice button - Only show when agent is published */}
                {currentAgent.status === "Published" && (
                  <button
                    onClick={() => setShowTestModal(true)}
                    className="flex-1 sm:flex-none common-button-bg flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl touch-manipulation min-h-[40px]"
                  >
                    <Phone className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    <span className="text-xs sm:text-sm font-medium">Test Voice</span>
                  </button>
                )}
                {currentAgent.status === "Published" && (
                  <button
                    onClick={() => setShowQRModal(true)}
                    className="flex-1 sm:flex-none common-button-bg2 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl touch-manipulation min-h-[40px]"
                  >
                    <QrCode className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    <span className="text-xs sm:text-sm font-medium">View QR</span>
                  </button>
                )}
                {currentAgent.status === "Published" ? (
                  <button
                    onClick={() => handlePause(currentAgent.id)}
                    disabled={publishingAgents.has(currentAgent.id)}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl touch-manipulation min-h-[40px] ${
                      publishingAgents.has(currentAgent.id) 
                        ? 'common-button-bg2 opacity-50 cursor-not-allowed' 
                        : 'common-button-bg2'
                    }`}
                  >
                    {publishingAgents.has(currentAgent.id) ? (
                      <>
                        <div className="w-3.5 sm:w-4 h-3.5 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs sm:text-sm font-medium">
                          Pausing...
                        </span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                        <span className="text-xs sm:text-sm font-medium">
                          Pause
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handlePublish(currentAgent.id)}
                    disabled={publishingAgents.has(currentAgent.id)}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl touch-manipulation min-h-[40px] ${
                      publishingAgents.has(currentAgent.id) 
                        ? 'common-button-bg opacity-50 cursor-not-allowed' 
                        : 'common-button-bg'
                    }`}
                  >
                    {publishingAgents.has(currentAgent.id) ? (
                      <>
                        <div className="w-3.5 sm:w-4 h-3.5 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs sm:text-sm font-medium">
                          Publishing...
                        </span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                        <span className="text-xs sm:text-sm font-medium">
                          Publish
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Agent info section */}
          </div>
        </GlassCard>

        {/* Performance Overview - Enhanced Design */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <GlassCard className="hover:shadow-lg transition-all duration-300">
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-right">
                  <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white">
                    {currentAgent.stats.conversations.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Conversations
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {currentAgent.stats.conversations > 0 ? (
                  <>
                    <span className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                      +12%
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      this week
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    No data yet
                  </span>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="hover:shadow-lg transition-all duration-300">
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-right">
                  <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white">
                    {currentAgent.stats.successRate}%
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Success Rate
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {currentAgent.stats.successRate > 0 ? (
                  <>
                    <span className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                      +2.1%
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      improved
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    No data yet
                  </span>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="hover:shadow-lg transition-all duration-300">
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-right">
                  <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white">
                    {currentAgent.stats.avgResponseTime}s
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Avg Response
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {currentAgent.stats.avgResponseTime > 0 ? (
                  <>
                    <span className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                      -0.3s
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      faster
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    No data yet
                  </span>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="hover:shadow-lg transition-all duration-300">
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-right">
                  <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white">
                    {currentAgent.stats.activeUsers}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Active Users
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {currentAgent.stats.activeUsers > 0 ? (
                  <>
                    <span className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                      +8%
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      today
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    No data yet
                  </span>
                )}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Enhanced Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Agent Configuration - Improved Layout */}
          <div className="lg:col-span-2">
            <GlassCard>
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">
                    Configuration
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 border dark:bg-slate-800/50 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Language
                        </span>
                      </div>
                      <p className="text-base font-semibold text-slate-800 dark:text-white">
                        {currentAgent.language}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border dark:bg-slate-800/50 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Voice
                        </span>
                      </div>
                      <p className="text-base font-semibold text-slate-800 dark:text-white">
                        {currentAgent.voice}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 border dark:bg-slate-800/50 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Persona
                        </span>
                      </div>
                      <p className="text-base font-semibold text-slate-800 dark:text-white">
                        {currentAgent.persona}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border dark:bg-slate-800/50 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Created
                        </span>
                      </div>
                      <p className="text-base font-semibold text-slate-800 dark:text-white">
                        {currentAgent.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Quick Actions - Enhanced Design */}
          <div className="space-y-4 sm:space-y-6">
            <GlassCard>
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">
                    Quick Actionsss
                  </h3>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => navigate(`/agents/${currentAgent.id}/train`)}
                    className="w-full common-bg-icons hover:shadow-md transition-all duration-200 p-4 rounded-xl touch-manipulation group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium text-slate-800 dark:text-white">
                          Train Agent
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Improve responses
                        </p>
                      </div>
                    </div>
                  </button>

                  <button className="w-full common-bg-icons hover:shadow-md transition-all duration-200 p-4 rounded-xl touch-manipulation group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Copy className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium text-slate-800 dark:text-white">
                          Clone Agent
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Create duplicate
                        </p>
                      </div>
                    </div>
                  </button>

                  <button className="w-full common-bg-icons hover:shadow-md transition-all duration-200 p-4 rounded-xl touch-manipulation group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Download className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium text-slate-800 dark:text-white">
                          Export Data
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Download config
                        </p>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                    className="w-full common-bg-icons hover:shadow-md transition-all duration-200 p-4 rounded-xl touch-manipulation group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium text-slate-800 dark:text-white">
                          View Call Analytics
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          See performance data
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Widget Customization Section */}
        <AgentWidgetCustomization
          agentId={currentAgent.id}
          agentName={currentAgent.name}
        />

        {/* Integration Code Section - Only show when published */}
        {/* {currentAgent.status === "Published" && (
          <div className="mt-6 sm:mt-8">
            <GlassCard>
              <div className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white mb-3 sm:mb-4">
                  Integration Code
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Copy and paste this code to integrate your agent into your
                  website
                </p>

                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Shortcode (WordPress/CMS)
                    </label>
                    <div className="relative">
                      <code className="common-bg-icons block w-full p-3 rounded-lg text-xs sm:text-sm font-mono text-slate-800 dark:text-white overflow-x-auto">
                        [shivai-agent id="{currentAgent.id}" name="
                        {currentAgent.name}"]
                      </code>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            `[shivai-agent id="${currentAgent.id}" name="${currentAgent.name}"]`
                          )
                        }
                        className="absolute top-2 right-2 p-2 common-bg-icons rounded-md hover:shadow-sm transition-all touch-manipulation min-h-[36px] min-w-[36px]"
                      >
                        <Copy className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      JavaScript Embed Code
                    </label>
                    <div className="relative">
                      <code className="common-bg-icons block w-full p-3 rounded-lg text-xs sm:text-sm font-mono text-slate-800 dark:text-white overflow-x-auto whitespace-pre-wrap break-all sm:break-normal">
                        {`<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://cdn.shivai.com/widget.js';
    script.setAttribute('data-agent-id', '${currentAgent.id}');
    script.setAttribute('data-agent-name', '${currentAgent.name}');
    script.setAttribute('data-language', '${currentAgent.language}');
    document.head.appendChild(script);
  })();
</script>`}
                      </code>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(`<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://cdn.shivai.com/widget.js';
    script.setAttribute('data-agent-id', '${currentAgent.id}');
    script.setAttribute('data-agent-name', '${currentAgent.name}');
    script.setAttribute('data-language', '${currentAgent.language}');
    document.head.appendChild(script);
  })();
</script>`)
                        }
                        className="absolute top-2 right-2 p-2 common-bg-icons rounded-md hover:shadow-sm transition-all touch-manipulation min-h-[36px] min-w-[36px]"
                      >
                        <Copy className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      API Integration
                    </label>
                    <div className="relative">
                      <code className="common-bg-icons block w-full p-3 rounded-lg text-xs sm:text-sm font-mono text-slate-800 dark:text-white overflow-x-auto whitespace-pre-wrap break-all sm:break-normal">
                        {`// API Endpoint
POST https://api.shivai.com/v1/agents/${currentAgent.id}/chat

// Headers
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

// Request Body
{
  "message": "User message here",
  "session_id": "unique_session_id",
  "user_id": "optional_user_id"
}`}
                      </code>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(`// API Endpoint
POST https://api.shivai.com/v1/agents/${currentAgent.id}/chat

// Headers
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

// Request Body
{
  "message": "User message here",
  "session_id": "unique_session_id",
  "user_id": "optional_user_id"
}`)
                        }
                        className="absolute top-2 right-2 p-2 common-bg-icons rounded-md hover:shadow-sm transition-all touch-manipulation min-h-[36px] min-w-[36px]"
                      >
                        <Copy className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Widget Customization Options
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="p-3 common-bg-icons rounded-lg">
                        <h4 className="font-medium text-slate-800 dark:text-white mb-2 text-sm">
                          Position
                        </h4>
                        <code className="text-xs text-slate-600 dark:text-slate-400">
                          data-position="bottom-right"
                        </code>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          Options: bottom-right, bottom-left, top-right,
                          top-left
                        </p>
                      </div>
                      <div className="p-3 common-bg-icons rounded-lg">
                        <h4 className="font-medium text-slate-800 dark:text-white mb-2 text-sm">
                          Theme
                        </h4>
                        <code className="text-xs text-slate-600 dark:text-slate-400">
                          data-theme="light"
                        </code>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          Options: light, dark, auto
                        </p>
                      </div>
                      <div className="p-3 common-bg-icons rounded-lg">
                        <h4 className="font-medium text-slate-800 dark:text-white mb-2 text-sm">
                          Color
                        </h4>
                        <code className="text-xs text-slate-600 dark:text-slate-400">
                          data-color="#3B82F6"
                        </code>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          Custom brand color (hex code)
                        </p>
                      </div>
                      <div className="p-3 common-bg-icons rounded-lg">
                        <h4 className="font-medium text-slate-800 dark:text-white mb-2 text-sm">
                          Auto-open
                        </h4>
                        <code className="text-xs text-slate-600 dark:text-slate-400">
                          data-auto-open="false"
                        </code>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          Auto-open chat widget on page load
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )} */}

        <div className="mt-6 sm:mt-8">
          <GlassCard>
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white mb-3 sm:mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {[
                  {
                    time: "2 min ago",
                    action: "Handled customer inquiry about pricing",
                    status: "success",
                  },
                  {
                    time: "5 min ago",
                    action: "Successfully scheduled appointment",
                    status: "success",
                  },
                  {
                    time: "12 min ago",
                    action: "Escalated complex technical issue",
                    status: "warning",
                  },
                  {
                    time: "1 hour ago",
                    action: "Completed product explanation call",
                    status: "success",
                  },
                  {
                    time: "2 hours ago",
                    action: "Updated knowledge base integration",
                    status: "info",
                  },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        activity.status === "success"
                          ? "bg-green-500"
                          : activity.status === "warning"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-800 dark:text-white">
                        {activity.action}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* LiveKit Test Modal - Only for published agents */}
        {showTestModal && currentAgent && currentAgent.status === "Published" && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Test Voice Agent
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {currentAgent.name} • Live Demo
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowTestModal(false);
                      if (isCallActive) {
                        handleEndCall();
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-slate-200 dark:border-slate-700">
                {[
                  { id: 'call', label: 'Call', icon: Phone },
                  { id: 'transcript', label: 'Transcript', icon: MessageSquare },
                  { id: 'chat', label: 'Chat', icon: MessageSquare }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6 h-96 overflow-y-auto">
                {activeTab === 'call' && (
                  <div className="flex flex-col items-center justify-center h-full space-y-6">
                    {/* Call Status */}
                    <div className="text-center">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                        callState === 'connected' 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                          : callState === 'connecting' 
                            ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' 
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        <Phone className={`w-8 h-8 ${callState === 'connecting' ? 'animate-pulse' : ''}`} />
                      </div>
                      <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                        {callStatus || (isCallActive ? 'Connected' : 'Ready to test')}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {isCallActive ? 'Speak naturally to test the agent' : 'Click start to begin voice test'}
                      </p>
                    </div>

                    {/* Call Controls */}
                    <div className="flex gap-4">
                      {!isCallActive ? (
                        <button
                          onClick={handleStartCall}
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-2"
                        >
                          <Phone className="w-5 h-5" />
                          Start Test Call
                        </button>
                      ) : (
                        <button
                          onClick={handleEndCall}
                          className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center gap-2"
                        >
                          <Phone className="w-5 h-5" />
                          End Call
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'transcript' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                        Voice Transcript
                      </h3>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {messages.filter(m => m.source === 'voice').length} messages
                      </span>
                    </div>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {messages.filter(m => m.source === 'voice').length === 0 ? (
                        <div className="text-center py-8">
                          <MessageSquare className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                          <p className="text-slate-600 dark:text-slate-400">
                            Voice transcript will appear here during the call
                          </p>
                        </div>
                      ) : (
                        messages.filter(m => m.source === 'voice').map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              message.isUser
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                            }`}>
                              <p className="text-sm">{message.text}</p>
                              <p className={`text-xs mt-1 ${
                                message.isUser ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'
                              }`}>
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                        Text Chat
                      </h3>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {messages.filter(m => m.source === 'chat').length} messages
                      </span>
                    </div>
                    
                    <div className="flex-1 space-y-3 max-h-64 overflow-y-auto mb-4">
                      {messages.filter(m => m.source === 'chat').length === 0 ? (
                        <div className="text-center py-8">
                          <MessageSquare className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                          <p className="text-slate-600 dark:text-slate-400">
                            Send a message to test text chat
                          </p>
                        </div>
                      ) : (
                        messages.filter(m => m.source === 'chat').map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              message.isUser
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                            }`}>
                              <p className="text-sm">{message.text}</p>
                              <p className={`text-xs mt-1 ${
                                message.isUser ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'
                              }`}>
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Chat Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={isCallActive ? "Type a message..." : "Start call to enable chat"}
                        disabled={!isCallActive}
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 disabled:opacity-50"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!isCallActive || !chatInput.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showQRModal && currentAgent && (
          <AgentQRModal
            agent={currentAgent}
            onClose={() => setShowQRModal(false)}
          />
        )}
      </div>
    );
  }

  // EDIT/CREATE MODE - Mobile-First
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-visible">
      {/* Consistent Header UI */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Main agent info section */}
            <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
              <button
                onClick={() => {
                  // Navigate to previous page or agents list
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate("/agents");
                  }
                }}
                className="common-button-bg2 p-2 sm:p-2.5 rounded-xl flex-shrink-0 touch-manipulation"
              >
                <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600 dark:text-slate-300" />
              </button>

              <div className="flex items-start gap-3 sm:gap-4 lg:gap-4 min-w-0 flex-1">
                {/* Agent avatar/icon */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 common-bg-icons flex items-center justify-center flex-shrink-0 rounded-xl">
                  <Bot className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-black dark:text-white" />
                </div>

                {/* Agent details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-slate-800 dark:text-white leading-tight truncate">
                        {isCreate
                          ? "Create New Agent"
                          : `Edit ${currentAgent?.name || "Agent"}`}
                      </h1>

                      {/* Agent meta info - Mobile optimized */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 sm:mt-2">
                        <div className="flex items-center gap-1">
                          <Settings className="w-3 sm:w-4 h-3 sm:h-4" />
                          <span className="truncate">
                            {isCreate
                              ? "Configuration"
                              : "Editing Configuration"}
                          </span>
                        </div>
                        {!isCreate && currentAgent && (
                          <>
                            <div className="hidden xs:flex items-center gap-1">
                              <Clock className="w-3 sm:w-4 h-3 sm:h-4" />
                              <span className="truncate">
                                Created{" "}
                                {currentAgent.createdAt.toLocaleDateString()}
                              </span>
                            </div>
                            <div className="xs:hidden flex items-center gap-1">
                              <Clock className="w-3 sm:w-4 h-3 sm:h-4" />
                              <span className="truncate">
                                {currentAgent.createdAt.toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0 md:mt-2 lg:mt-0">
                              <span
                                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex-shrink-0 self-start ${
                                  currentAgent.status === "Published"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                    : currentAgent.status === "Training"
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {currentAgent.status}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons - Mobile stacked */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  // Navigate to previous page or agents list
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate("/agents");
                  }
                }}
                className="flex-1 sm:flex-none common-button-bg2 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl touch-manipulation min-h-[40px]"
              >
                <span className="text-xs sm:text-sm font-medium">Cancel</span>
              </button>

              <button
                onClick={handleSave}
                className="flex-1 sm:flex-none common-button-bg flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl touch-manipulation min-h-[40px]"
              >
                <Save className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">
                  {isCreate ? "Create" : "Save"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 sm:gap-6 lg:gap-8">
        <div className="space-y-4 sm:space-y-6 min-w-0">
          {/* Identity Section - Mobile Optimized */}
          <GlassCard>
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 common-bg-icons rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                  Identity
                </h3>
              </div>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
                Define your agent's basic identity and personality
              </p>

              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Agent Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter a descriptive name for your agent"
                      className="common-bg-icons w-full px-3 sm:px-4 py-3 sm:py-3 rounded-xl text-slate-800 dark:text-white text-base sm:text-sm transition-all duration-200 touch-manipulation"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Choose a clear, descriptive name that reflects your
                      agent's purpose
                    </p>
                  </div>

                  <div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Select Gender <span className="text-red-500">*</span>
                      </label>
                      <SearchableSelect
                        options={genders}
                        value={formData.gender}
                        onChange={(value) =>
                          setFormData({ ...formData, gender: value })
                        }
                        placeholder="Select gender..."
                        groupBy={true}
                      />
                    </div>
                  </div>

                  {isCreate && (
                    <div className="col-span-full space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Business Process{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <SearchableSelect
                            options={businessProcesses}
                            value={formData.businessProcess}
                            onChange={(value) =>
                              setFormData({
                                ...formData,
                                businessProcess: value,
                              })
                            }
                            placeholder="Select business process..."
                            groupBy={true}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Industry <span className="text-red-500">*</span>
                          </label>
                          <SearchableSelect
                            options={industries}
                            value={formData.industry}
                            onChange={(value) =>
                              setFormData({ ...formData, industry: value })
                            }
                            placeholder="Select your industry..."
                            groupBy={true}
                          />
                        </div>
                      </div>

                      {/* Template Suggestion */}
                      {formData.businessProcess && formData.industry && (
                        <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-200 dark:border-blue-700/30 rounded-xl">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <Lightbulb className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-800 dark:text-white mb-1 sm:mb-2 text-sm sm:text-base">
                                Template Available
                              </h4>
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-2 sm:mb-3 leading-relaxed">
                                We have a well-reserached template that fits
                                your selected business process and industry.
                                You can view the recommended template or choose
                                to create a custom agent configuration.
                              </p>
                              <div className="flex flex-col xs:flex-row gap-2">
                                <button
                                  onClick={() => setShowTemplates(true)}
                                  className="flex-1 xs:flex-none common-button-bg active:scale-95"
                                >
                                  View Template
                                </button>
                                <button
                                  onClick={() => setShowTemplates(false)}
                                  className="flex-1 xs:flex-none common-button-bg2 active:scale-95"
                                >
                                  Create Custom
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Template Preview Modal */}
                      {showTemplates && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
                          <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-y-auto m-2 sm:m-0">
                            <div className="p-4 sm:p-6">
                              <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white pr-2">
                                  Recommended Template
                                </h3>
                                <button
                                  onClick={() => setShowTemplates(false)}
                                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                                >
                                  <span className="text-lg">✕</span>
                                </button>
                              </div>

                              {(() => {
                                const template = getTemplate();
                                return (
                                  <div className="space-y-4">
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                                      <h4 className="font-semibold text-slate-800 dark:text-white mb-2">
                                        {template.name}
                                      </h4>
                                      <p className="text-slate-600 dark:text-slate-400 mb-3">
                                        {template.description}
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {template.features.map(
                                          (feature: string, index: number) => (
                                            <span
                                              key={index}
                                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                                            >
                                              {feature}
                                            </span>
                                          )
                                        )}
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                          Persona:
                                        </label>
                                        <p className="text-slate-800 dark:text-white">
                                          {template.persona}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                          Custom Instructions:
                                        </label>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/30 p-3 rounded-lg">
                                          {template.customInstructions}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                          Guardrails Level:
                                        </label>
                                        <p className="text-slate-800 dark:text-white">
                                          {template.guardrailsLevel}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                                      <button
                                        onClick={applyTemplate}
                                        className="flex-1 common-button-bg active:scale-95"
                                      >
                                        Apply Template
                                      </button>
                                      <button
                                        onClick={() => setShowTemplates(false)}
                                        className="flex-1 sm:flex-none common-button-bg2 active:scale-95"
                                      >
                                        Create Custom
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Persona <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        {
                          value: "Friendly",
                          label: "Friendly",
                          desc: "Warm and approachable",
                        },
                        {
                          value: "Formal",
                          label: "Formal",
                          desc: "Professional and structured",
                        },
                        {
                          value: "Concise",
                          label: "Concise",
                          desc: "Brief and to the point",
                        },
                        {
                          value: "Empathetic",
                          label: "Empathetic",
                          desc: "Understanding and caring",
                        },
                        {
                          value: "Persuasive (Sales)",
                          label: "Persuasive (Sales)",
                          desc: "Convincing and goal-oriented",
                        },
                        {
                          value: "Reassuring (Support)",
                          label: "Reassuring (Support)",
                          desc: "Calming and supportive",
                        },
                      ].map((persona) => (
                        <button
                          key={persona.value}
                          onClick={() =>
                            setFormData({ ...formData, persona: persona.value })
                          }
                          className={`p-4 text-left border-2 rounded-xl transition-all duration-200 active:scale-[0.98] touch-manipulation ${
                            formData.persona === persona.value
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <div className="font-medium text-slate-800 dark:text-white text-sm lg:text-base">
                            {persona.label}
                          </div>
                          <div className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                            {persona.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      Select the personality style that best fits your agent's
                      role
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Voice & Language - Mobile Optimized */}

          {/* Advanced Settings */}
          <GlassCard>
            <div className="p-4 sm:p-5 lg:p-6 z-[99] relative">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 common-bg-icons rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                  Advanced Settings
                </h3>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Custom Instructions
                  </label>
                  <textarea
                    value={formData.customInstructions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customInstructions: e.target.value,
                      })
                    }
                    placeholder="Add specific instructions for your agent..."
                    rows={4}
                    className="common-bg-icons w-full px-3 sm:px-4 py-3 rounded-xl resize-none text-sm sm:text-base transition-all duration-200"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Provide specific guidelines, rules, or context for your
                    agent's responses
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Response Style
                    </label>
                    <SearchableSelect
                      options={responseStyleOptions}
                      value={formData.responseStyle}
                      onChange={(value) =>
                        setFormData({ ...formData, responseStyle: value })
                      }
                      placeholder="Select response style..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Maximum Response Length
                    </label>
                    <SearchableSelect
                      options={maxResponseOptions}
                      value={formData.maxResponseLength}
                      onChange={(value) =>
                        setFormData({ ...formData, maxResponseLength: value })
                      }
                      placeholder="Select max length..."
                    />
                  </div>
                </div>

                <div className="common-bg-icons p-4 rounded-xl">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                    Temperature (Creativity):{" "}
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {formData.temperature}%
                    </span>
                  </label>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-600 dark:text-slate-400 min-w-[70px] text-left font-medium">
                        Conservative
                      </span>
                      <div className="flex-1 relative">
                        {/* Track */}
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full">
                          {/* Active track */}
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${formData.temperature}%` }}
                          ></div>
                        </div>

                        {/* Range input */}
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={formData.temperature}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              temperature: parseInt(e.target.value),
                            })
                          }
                          className="absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer z-20 touch-manipulation"
                          style={{
                            background: "transparent",
                            outline: "none",
                          }}
                        />

                        {/* Thumb/Circle */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-slate-100 rounded-full shadow-lg border-2 border-blue-500 dark:border-blue-400 transition-all duration-300 ease-out pointer-events-none z-10 hover:scale-110"
                          style={{
                            left: `calc(${formData.temperature}% - 10px)`,
                            transform: "translateY(-50%)",
                            boxShadow:
                              "0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          {/* Inner circle for better visibility */}
                          <div className="absolute inset-1 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-400 min-w-[50px] text-right font-medium">
                        Creative
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 px-2">
                      <span className="font-medium">0%</span>
                      <span className="font-medium">25%</span>
                      <span className="font-medium">50%</span>
                      <span className="font-medium">75%</span>
                      <span className="font-medium">100%</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                    Lower values for more consistent responses, higher for more
                    creative answers
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Context Window
                  </label>
                  <SearchableSelect
                    options={contextWindowOptions}
                    value={formData.contextWindow}
                    onChange={(value) =>
                      setFormData({ ...formData, contextWindow: value })
                    }
                    placeholder="Select context window..."
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar - Mobile Stacked */}
        <div className="space-y-4 sm:space-y-6">
          <GlassCard>
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 common-bg-icons rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                  Voice & Language
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Configure language and voice settings
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Language <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) =>
                      setFormData({ ...formData, language: e.target.value })
                    }
                    className="common-bg-icons w-full px-3 sm:px-4 py-3 rounded-xl text-slate-800 dark:text-white text-base sm:text-sm transition-all duration-200 touch-manipulation appearance-none bg-no-repeat bg-right"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "1.25rem 1.25rem",
                    }}
                  >
                    <option value="">Select language...</option>
                    <optgroup label="India">
                      <option value="Hindi">Hindi</option>
                      <option value="Punjabi">Punjabi</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Telugu">Telugu</option>
                      <option value="Bengali">Bengali</option>
                      <option value="Marathi">Marathi</option>
                      <option value="Gujarati">Gujarati</option>
                      <option value="Kannada">Kannada</option>
                      <option value="Malayalam">Malayalam</option>
                      <option value="Odia">Odia</option>
                      <option value="Urdu">Urdu</option>
                    </optgroup>
                    <optgroup label="Middle East">
                      <option value="Arabic">Arabic</option>
                      <option value="Persian">Persian</option>
                      <option value="Hebrew">Hebrew</option>
                      <option value="Turkish">Turkish</option>
                    </optgroup>
                    <optgroup label="Europe">
                      <option value="English (UK)">English (UK)</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Spanish">Spanish</option>
                      <option value="Italian">Italian</option>
                      <option value="Dutch">Dutch</option>
                    </optgroup>
                    <optgroup label="Americas">
                      <option value="English (US)">English (US)</option>
                      <option value="Spanish (MX)">Spanish (MX)</option>
                      <option value="Portuguese (BR)">Portuguese (BR)</option>
                      <option value="French (CA)">French (CA)</option>
                    </optgroup>
                    <optgroup label="APAC">
                      <option value="Chinese (Mandarin)">
                        Chinese (Mandarin)
                      </option>
                      <option value="Japanese">Japanese</option>
                      <option value="Korean">Korean</option>
                      <option value="Thai">Thai</option>
                      <option value="Vietnamese">Vietnamese</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Voice <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.voice}
                    onChange={(e) =>
                      setFormData({ ...formData, voice: e.target.value })
                    }
                    className="common-bg-icons w-full px-3 sm:px-4 py-3 rounded-xl text-slate-800 dark:text-white text-base sm:text-sm transition-all duration-200 touch-manipulation appearance-none bg-no-repeat bg-right"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "1.25rem 1.25rem",
                    }}
                  >
                    <option value="">Select voice...</option>
                    <optgroup label="English">
                      <option value="Sarah - Professional">
                        Sarah - Professional
                      </option>
                      <option value="John - Friendly">John - Friendly</option>
                      <option value="Emma - Warm">Emma - Warm</option>
                    </optgroup>
                    <optgroup label="Hindi">
                      <option value="Arjun - Friendly">Arjun - Friendly</option>
                      <option value="Priya - Professional">
                        Priya - Professional
                      </option>
                      <option value="Raj - Confident">Raj - Confident</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          </GlassCard>
          <GlassCard>
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 common-bg-icons rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                  Guardrails Level
                </h3>
                <Tooltip content="Guardrails control how strictly the agent follows guidelines and handles sensitive topics. Higher levels provide more restrictions but may limit flexibility.">
                  <Info className="w-4 h-4 text-slate-400 cursor-help" />
                </Tooltip>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {[
                  {
                    value: "Low",
                    label: "Low",
                    desc: "Minimal restrictions, maximum flexibility",
                  },
                  {
                    value: "Medium",
                    label: "Medium",
                    desc: "Balanced approach with reasonable limits",
                  },
                  {
                    value: "High",
                    label: "High",
                    desc: "Strict guidelines, maximum safety",
                  },
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() =>
                      setFormData({ ...formData, guardrailsLevel: level.value })
                    }
                    className={`w-full p-3 sm:p-4 text-left border-2 rounded-xl transition-all duration-200 active:scale-[0.98] touch-manipulation ${
                      formData.guardrailsLevel === level.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="font-medium text-slate-800 dark:text-white text-sm sm:text-base">
                      {level.label}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                      {level.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 common-bg-icons rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                  Quick Tips
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                      1
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      Choose a descriptive name
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Make it clear what your agent does
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 dark:text-green-400 text-xs font-bold">
                      2
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      Match persona to purpose
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Sales agents should be persuasive, support agents
                      empathetic
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 dark:text-purple-400 text-xs font-bold">
                      3
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      Test before publishing
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Use training mode to validate responses
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default AgentManagement;
