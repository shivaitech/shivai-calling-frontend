import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Slider from "react-slick";
import GlassCard from "../components/GlassCard";
import SearchableSelect from "../components/SearchableSelect";
import LanguagePicker from "../components/LanguagePicker";
import Tooltip from "../components/Tooltip";
import { useAgent } from "../contexts/AgentContext";
import { useAuth } from "../contexts/AuthContext";
import { isDeveloperUser } from "../lib/utils";
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
  Upload,
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
  Sparkles,
  Target,
  Building,
  Plus,
  Search,
  Filter,
  Settings,
} from "lucide-react";

const AgentManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { agents, currentAgent, setCurrentAgent, addAgent, updateAgent } =
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
    { value: "real-estate", label: "Real Estate", group: "Property" },
    { value: "healthcare", label: "Healthcare", group: "Medical" },
    { value: "dental", label: "Dental Clinics", group: "Medical" },
    { value: "fitness", label: "Fitness & Wellness", group: "Health" },
    { value: "education", label: "Education", group: "Services" },
    { value: "finance", label: "Finance & Banking", group: "Financial" },
    { value: "insurance", label: "Insurance", group: "Financial" },
    { value: "ecommerce", label: "E-commerce", group: "Retail" },
    { value: "saas", label: "SaaS & Technology", group: "Technology" },
    { value: "legal", label: "Legal Services", group: "Professional" },
    { value: "consulting", label: "Consulting", group: "Professional" },
    { value: "hospitality", label: "Hospitality", group: "Services" },
    { value: "automotive", label: "Automotive", group: "Manufacturing" },
    { value: "construction", label: "Construction", group: "Manufacturing" },
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
      persona: "Professional",
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
        persona: "Professional",
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
      name: template.name,
      persona: template.persona,
      customInstructions: template.customInstructions,
      guardrailsLevel: template.guardrailsLevel,
    }));
    setShowTemplates(false);
  };

  const handleSave = () => {
    if (isCreate) {
      addAgent({
        name: formData.name,
        status: "Draft",
        persona: formData.persona,
        language: formData.language,
        voice: formData.voice,
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

  const handlePublish = (agentId: string) => {
    updateAgent(agentId, { status: "Published" });
  };

  const handlePause = (agentId: string) => {
    updateAgent(agentId, { status: "Draft" });
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
      <div className="space-y-2 lg:space-y-4 w-full max-w-full overflow-hidden">
        {/* Mobile-First Header */}
        <div className="px-1">
          <div className="flex flex-col ">
            <div className="flex items-start justify-end gap-3 mb-3 lg:mb-0">
              {/* Mobile Create Button */}
              <button
                onClick={() => isDeveloper && navigate("/agents/create")}
                disabled={!isDeveloper}
                className={`flex items-center gap-2 transition-all duration-200 shadow-sm ${
                  isDeveloper
                    ? "common-button-bg transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg"
                }`}
              >
                <Plus className="w-4 h-4" />
                <span className=" sm:inline">Create AI Employee</span>
              </button>
            </div>

            {/* Stats Row - Mobile Only */}
            <div className="grid grid-cols-3 gap-2 sm:hidden">
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-slate-800 dark:text-white">
                  {isDeveloper ? agents.length : 0}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Agents
                </p>
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {isDeveloper
                    ? agents.filter((a) => a.status === "Published").length
                    : 0}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Live
                </p>
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {isDeveloper
                    ? agents.filter((a) => a.status === "Training").length
                    : 0}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Training
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Row */}
        <GlassCard>
          <div className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 text-slate-800 dark:text-white text-sm transition-all duration-200"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="common-bg-icons px-3 py-2.5 rounded-lg text-slate-800 dark:text-white text-sm min-w-[120px] cursor-pointer"
                style={{ zIndex: 100 }}
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="training">Training</option>
              </select>

              {/* Filter Button */}
              <button className="flex items-center justify-center common-button-bg2 active:scale-95">
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
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Voice:
                    </span>
                    <span className="text-slate-800 dark:text-white truncate ml-2 text-right">
                      {agent.voice}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
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
                    onClick={() => navigate(`/agents/${agent.id}/train`)}
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
                      className="flex-1 flex items-center justify-center gap-1.5 common-button-bg2 transition-all duration-200 text-sm font-medium active:scale-[0.98]"
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePublish(agent.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 common-button-bg transition-all duration-200 text-sm font-medium active:scale-[0.98]"
                    >
                      <Play className="w-4 h-4" />
                      Publish
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

        {/* Mobile-Optimized Empty State */}
        {filteredAgents.length === 0 && (
          <div className="text-center py-8 sm:py-12 lg:py-16 px-4">
            <Bot className="w-16 sm:w-20 h-16 sm:h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4 sm:mb-6" />
            <h3 className="text-lg sm:text-xl font-medium text-slate-600 dark:text-slate-400 mb-2 sm:mb-3">
              {searchTerm || statusFilter !== "all"
                ? "No agents found"
                : "No agents created yet"}
            </h3>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-500 max-w-sm sm:max-w-md mx-auto mb-4 sm:mb-6 leading-relaxed">
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
                className="w-full sm:w-auto common-button-bg2"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // VIEW MODE - Show agent details
  if (isView && currentAgent) {
    // Slider settings for overview cards
    const overviewSliderSettings = {
      dots: false,
      infinite: false,
      speed: 300,
      slidesToShow: 2.2,
      slidesToScroll: 1,
      arrows: false,
      responsive: [
        {
          breakpoint: 640, // sm
          settings: {
            slidesToShow: 2.2,
            slidesToScroll: 1,
          },
        },
        {
          breakpoint: 480, // xs
          settings: {
            slidesToShow: 1.8,
            slidesToScroll: 1,
          },
        },
        {
          breakpoint: 768, // md and up - show grid instead
          settings: "unslick" as const,
        },
      ],
    };

    return (
      <div className="space-y-4 sm:space-y-6 w-full">
        {/* Mobile-First Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <button
              onClick={() => navigate("/agents")}
              className="common-button-bg2 p-2 flex-shrink-0"
            >
              <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white truncate">
                {currentAgent.name}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Agent Details & Performance
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
            <span className="common-bg-icons px-2 sm:px-3 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium text-center whitespace-nowrap order-1">
              {currentAgent.status}
            </span>

            <button
              onClick={() => navigate(`/agents/${currentAgent.id}/edit`)}
              className="common-button-bg2 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 min-h-[32px] sm:min-h-[36px] order-2 flex-shrink-0"
            >
              <Edit className="w-3 sm:w-4 h-3 sm:h-4" />
              <span className="text-xs sm:text-sm">Edit</span>
            </button>

            {currentAgent.status === "Published" ? (
              <button
                onClick={() => handlePause(currentAgent.id)}
                className="common-button-bg2 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 min-h-[32px] sm:min-h-[36px] order-3 flex-shrink-0"
              >
                <Pause className="w-3 sm:w-4 h-3 sm:h-4" />
                <span className="text-xs sm:text-sm">Pause</span>
              </button>
            ) : (
              <button
                onClick={() => handlePublish(currentAgent.id)}
                className="common-button-bg flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 min-h-[32px] sm:min-h-[36px] order-3 flex-shrink-0"
              >
                <Play className="w-3 sm:w-4 h-3 sm:h-4" />
                <span className="text-xs sm:text-sm">Publish</span>
              </button>
            )}
          </div>
        </div>

        {/* Agent Overview Cards - Mobile Slider, Desktop Grid */}
        <div className="overview-cards-container">
          {/* Mobile Slider (md and below) */}
          <div className="block md:hidden">
            <Slider {...overviewSliderSettings} className="mobile-stats-slider">
              <div className="px-2">
                <GlassCard>
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 common-bg-icons rounded-xl flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                          Conversations
                        </h3>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">
                          1,247
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      +12% from last week
                    </p>
                  </div>
                </GlassCard>
              </div>

              <div className="px-2">
                <GlassCard>
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 common-bg-icons rounded-xl flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis">
                          Success Rate
                        </h3>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">
                          94.2%
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      +2.1% improvement
                    </p>
                  </div>
                </GlassCard>
              </div>

              <div className="px-2">
                <GlassCard>
                  <div className="p-4">
                    <div className="flex items-center gap-3 ">
                      <div className="w-10 h-10 common-bg-icons rounded-xl flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                          Avg Response
                        </h3>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">
                          1.2s
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      -0.3s faster
                    </p>
                  </div>
                </GlassCard>
              </div>
            </Slider>
          </div>

          {/* Desktop Grid (md and up) */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <GlassCard>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 common-bg-icons rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                      Conversations
                    </h3>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                      1,247
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  +12% from last week
                </p>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 common-bg-icons rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                      Success Rate
                    </h3>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                      94.2%
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  +2.1% improvement
                </p>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="p-6 md:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 common-bg-icons rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                      Avg Response
                    </h3>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                      1.2s
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  -0.3s faster
                </p>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Agent Configuration - Mobile Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <GlassCard>
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white mb-3 sm:mb-4">
                Agent Configuration
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Language:
                  </span>
                  <span className="text-sm font-medium text-slate-800 dark:text-white">
                    {currentAgent.language}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Voice:
                  </span>
                  <span className="text-sm font-medium text-slate-800 dark:text-white">
                    {currentAgent.voice}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Persona:
                  </span>
                  <span className="text-sm font-medium text-slate-800 dark:text-white">
                    {currentAgent.persona}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Created:
                  </span>
                  <span className="text-sm font-medium text-slate-800 dark:text-white">
                    {currentAgent.createdAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white mb-3 sm:mb-4">
                Quick Actions
              </h3>
              {/* Mobile: Horizontal layout, Desktop: Vertical layout */}
              <div className="flex flex-row gap-2 sm:flex-col sm:space-y-3 sm:gap-0">
                <button
                  onClick={() => navigate(`/agents/${currentAgent.id}/train`)}
                  className="common-bg-icons flex-1 sm:w-full flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-3 p-2 sm:p-3 rounded-lg hover:shadow-sm transition-all touch-manipulation min-h-[60px] sm:min-h-auto"
                >
                  <Zap className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                  <span className="text-xs sm:text-base text-slate-800 dark:text-white text-center sm:text-left">
                    Train
                  </span>
                </button>
                <button className="common-bg-icons flex-1 sm:w-full flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-3 p-2 sm:p-3 rounded-lg hover:shadow-sm transition-all touch-manipulation min-h-[60px] sm:min-h-auto">
                  <Copy className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                  <span className="text-xs sm:text-base text-slate-800 dark:text-white text-center sm:text-left">
                    Clone
                  </span>
                </button>
                <button className="common-bg-icons flex-1 sm:w-full flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-3 p-2 sm:p-3 rounded-lg hover:shadow-sm transition-all touch-manipulation min-h-[60px] sm:min-h-auto">
                  <Download className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                  <span className="text-xs sm:text-base text-slate-800 dark:text-white text-center sm:text-left">
                    Export
                  </span>
                </button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Integration Code Section - Only show when published */}
        {currentAgent.status === "Published" && (
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
                  {/* Shortcode */}
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

                  {/* JavaScript Embed */}
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

                  {/* API Integration */}
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

                  {/* Widget Customization */}
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
        )}

        {/* Recent Activity - Mobile Responsive */}
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
      </div>
    );
  }

  // EDIT/CREATE MODE - Mobile-First
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-visible">
      {/* Mobile-First Header */}
      <div className="px-1">
        <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <button
              onClick={() => navigate(isCreate ? "/agents" : `/agents/${id}`)}
              className="p-2 rounded-lg common-button-bg2 flex-shrink-0 active:scale-95"
            >
              <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-slate-800 dark:text-white truncate">
                {isCreate ? "Create New Agent" : `Edit ${currentAgent?.name}`}
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-slate-600 dark:text-slate-400 leading-tight">
                {isCreate
                  ? "Set up your AI agent with custom personality and capabilities"
                  : "Modify agent settings and configuration"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate(isCreate ? "/agents" : `/agents/${id}`)}
              className="flex-1 sm:flex-none common-button-bg2 active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 common-button-bg shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span className="hidden xs:inline">
                {isCreate ? "Create Agent" : "Save Changes"}
              </span>
              <span className="xs:hidden">{isCreate ? "Create" : "Save"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 overflow-visible">
        <div className="xl:col-span-2 space-y-4 sm:space-y-6 overflow-visible">
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
                      <div style={{ zIndex: 200 }}>
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
                  </div>

                  {isCreate && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Business Process{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div style={{ zIndex: 200 }}>
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
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Industry <span className="text-red-500">*</span>
                          </label>
                          <div style={{ zIndex: 190 }}>
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
                                We have a pre-configured template for your
                                combination. Would you like to see it?
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
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Persona <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
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
                          className={`p-3 sm:p-4 text-left border-2 rounded-xl transition-all duration-200 active:scale-[0.98] touch-manipulation ${
                            formData.persona === persona.value
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <div className="font-medium text-slate-800 dark:text-white text-sm sm:text-base">
                            {persona.label}
                          </div>
                          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-tight">
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
          <GlassCard>
            <div
              className="p-4 sm:p-5 lg:p-6 relative"
              style={{ overflow: "visible" }}
            >
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 common-bg-icons rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                  Voice & Language
                </h3>
              </div>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
                Configure how your agent communicates
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 relative">
                <div className="relative" style={{ zIndex: 300 }}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Language <span className="text-red-500">*</span>
                  </label>
                  <LanguagePicker
                    value={formData.language}
                    onChange={(value) =>
                      setFormData({ ...formData, language: value })
                    }
                  />
                </div>

                <div className="relative" style={{ zIndex: 290 }}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Voice <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={voiceOptions}
                    value={formData.voice}
                    onChange={(value) =>
                      setFormData({ ...formData, voice: value })
                    }
                    placeholder="Select voice..."
                    groupBy={true}
                  />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Advanced Settings */}
          <GlassCard>
            <div
              className="p-4 sm:p-5 lg:p-6 relative"
              style={{ overflow: "visible" }}
            >
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 common-bg-icons rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                  Advanced Settings
                </h3>
              </div>

              <div
                className="space-y-4 sm:space-y-6 relative"
                style={{ overflow: "visible" }}
              >
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
                    <div style={{ zIndex: 170 }}>
                      <SearchableSelect
                        options={responseStyleOptions}
                        value={formData.responseStyle}
                        onChange={(value) =>
                          setFormData({ ...formData, responseStyle: value })
                        }
                        placeholder="Select response style..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Maximum Response Length
                    </label>
                    <div style={{ zIndex: 160 }}>
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
                </div>

                <div className="common-bg-icons p-4 rounded-xl">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Temperature (Creativity):{" "}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formData.temperature}%
                    </span>
                  </label>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-600 dark:text-slate-400 min-w-[70px] text-left">
                        Conservative
                      </span>
                      <div className="flex-1 relative h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-200"
                          style={{ width: `${formData.temperature}%` }}
                        ></div>
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
                          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10 touch-manipulation"
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-slate-200 rounded-full shadow-lg border-2 border-blue-500 transition-all duration-200 pointer-events-none"
                          style={{
                            left: `calc(${formData.temperature}% - 10px)`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-400 min-w-[50px] text-right">
                        Creative
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Lower values for more consistent responses, higher for more
                    creative answers
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Context Window
                  </label>
                  <div style={{ zIndex: 150 }}>
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
            </div>
          </GlassCard>
        </div>

        {/* Sidebar - Mobile Stacked */}
        <div className="space-y-4 sm:space-y-6">
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
