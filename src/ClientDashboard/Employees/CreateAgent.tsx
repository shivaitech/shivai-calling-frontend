import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { agentAPI } from "../../services/agentAPI";
import GlassCard from "../../components/GlassCard";
import SearchableSelect from "../../components/SearchableSelect";
import { useAgent } from "../../contexts/AgentContext";
import {
  ArrowLeft,
  Bot,
  Save,
  User,
  Settings,
  Sparkles,
  Lightbulb,
} from "lucide-react";

const CreateAgent = () => {
  const navigate = useNavigate();
  const { refreshAgents } = useAgent();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    gender: "female",
    businessProcess: "",
    industry: "",
    persona: "Empathetic",
    language: "English (US)",
    voice: "alloy",
    customInstructions: "",
    guardrailsLevel: "Medium",
    responseStyle: "Balanced",
    maxResponseLength: "Medium (150 words)",
    contextWindow: "Standard (8K tokens)",
    temperature: 0.7,
  });

  const businessProcesses = [
    { value: "customer-support", label: "Customer Support", group: "Support" },
    { value: "sales-marketing", label: "Sales & Marketing", group: "Sales" },
    { value: "appointment-setting", label: "Appointment Setting", group: "Sales" },
    { value: "lead-qualification", label: "Lead Qualification", group: "Sales" },
    { value: "product-explanation", label: "Product Explanation", group: "Support" },
    { value: "order-processing", label: "Order Processing", group: "Operations" },
    { value: "technical-support", label: "Technical Support", group: "Support" },
    { value: "billing-inquiries", label: "Billing Inquiries", group: "Support" },
    { value: "feedback-collection", label: "Feedback Collection", group: "Operations" },
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
    { value: "female", label: "Female" },
    { value: "male", label: "Male" },
  ];

  const templates = {
    "customer-support-real-estate": {
      name: "Real Estate Support Agent",
      description: "Handles property inquiries, scheduling viewings, and providing property information",
      features: ["Property Search", "Viewing Scheduling", "Market Updates", "Document Assistance"],
      persona: "Formal",
      customInstructions: "You are a knowledgeable real estate assistant. Help clients with property inquiries, schedule viewings, provide market insights, and assist with documentation. Always be professional and detail-oriented.",
      guardrailsLevel: "High",
    },
    "sales-marketing-healthcare": {
      name: "Healthcare Sales Assistant",
      description: "Promotes healthcare services, books consultations, and provides service information",
      features: ["Service Promotion", "Consultation Booking", "Insurance Queries", "Health Education"],
      persona: "Empathetic",
      customInstructions: "You are a caring healthcare sales assistant. Help patients understand services, book appointments, answer insurance questions, and provide health education. Always prioritize patient care and privacy.",
      guardrailsLevel: "High",
    },
    "appointment-setting-dental": {
      name: "Dental Appointment Scheduler",
      description: "Schedules dental appointments, handles cancellations, and provides dental care information",
      features: ["Appointment Booking", "Reminder Calls", "Treatment Info", "Insurance Verification"],
      persona: "Reassuring (Support)",
      customInstructions: "You are a friendly dental appointment scheduler. Help patients book appointments, provide treatment information, handle insurance verification, and ease dental anxiety with reassuring communication.",
      guardrailsLevel: "Medium",
    },
    "lead-qualification-saas": {
      name: "SaaS Lead Qualifier",
      description: "Qualifies software leads, demos features, and nurtures prospects through the sales funnel",
      features: ["Lead Scoring", "Demo Scheduling", "Feature Explanation", "Pricing Information"],
      persona: "Persuasive (Sales)",
      customInstructions: "You are a tech-savvy SaaS sales assistant. Qualify leads by understanding their needs, explain software features, schedule demos, and provide pricing information. Focus on value proposition and ROI.",
      guardrailsLevel: "Medium",
    },
  };

  const getTemplate = () => {
    const key = `${formData.businessProcess}-${formData.industry}`;
    return (
      templates[key as keyof typeof templates] || {
        name: `${businessProcesses.find((bp) => bp.value === formData.businessProcess)?.label || "Custom"} Agent`,
        description: `Handles ${businessProcesses.find((bp) => bp.value === formData.businessProcess)?.label?.toLowerCase() || "various tasks"} for ${industries.find((ind) => ind.value === formData.industry)?.label?.toLowerCase() || "your business"}`,
        features: ["Customer Interaction", "Query Resolution", "Information Provision", "Process Automation"],
        persona: "Friendly",
        customInstructions: `You are a professional AI assistant specializing in ${businessProcesses.find((bp) => bp.value === formData.businessProcess)?.label?.toLowerCase() || "customer service"} for the ${industries.find((ind) => ind.value === formData.industry)?.label?.toLowerCase() || "business"} industry. Provide helpful, accurate, and timely assistance to users.`,
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
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name || formData.name.trim() === "") {
      toast.error("Agent name is required. Please enter a name for your agent.");
      return;
    }

    if (!formData.businessProcess || formData.businessProcess.trim() === "") {
      toast.error("Business Process is required. Please select a business process.");
      return;
    }

    if (!formData.industry || formData.industry.trim() === "") {
      toast.error("Industry is required. Please select an industry.");
      return;
    }

    if (!formData.customInstructions || formData.customInstructions.trim() === "") {
      toast.error("Custom Instructions are required. Please provide instructions for your agent.");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Creating AI agent...");

    try {
      // Prepare API payload
      const payload = {
        name: formData.name,
        gender: formData.gender,
        business_process: formData.businessProcess.replace(/-/g, '_'),
        industry: formData.industry,
        personality: formData.persona.toLowerCase().replace(/\s*\(.*?\)/g, ''),
        language: formData.language === "English (US)" ? "en-US" : formData.language,
        voice: formData.voice,
        custom_instructions: formData.customInstructions,
        guardrails_level: formData.guardrailsLevel.toLowerCase(),
        response_style: formData.responseStyle.toLowerCase(),
        max_response_length: formData.maxResponseLength.split(' ')[0].toLowerCase(),
        context_window: formData.contextWindow.toLowerCase().replace(/\s/g, '_').replace(/\(|\)/g, ''),
        temperature: formData.temperature,
      };

      // Make API call using agentAPI service
      const createdAgent = await agentAPI.createAgent(payload);

      toast.dismiss(loadingToast);
      toast.success("AI agent created successfully!", {
        duration: 4000,
      });

      // Refresh agents list from API
      await refreshAgents();

      // Navigate to agents list
      setTimeout(() => {
        navigate("/agents");
      }, 500);
    } catch (error: any) {
      toast.dismiss(loadingToast);

      let errorMessage = "Failed to create AI agent. Please try again.";

      if (error.response) {
        // Server responded with error
        if (error.response.status === 401) {
          errorMessage = "Session expired. Please log in again.";
          setTimeout(() => {
            localStorage.removeItem("auth_tokens");
            window.location.href = "/landing";
          }, 2000);
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.message || "Invalid input. Please check your fields.";
        } else if (error.response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = "Network error. Please check your connection.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, {
        duration: 5000,
      });

      console.error("Create agent error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const template = getTemplate();

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-visible">
      <Toaster position="top-right" />
      {/* Header */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
              <button
                onClick={() => navigate("/agents")}
                className="common-button-bg2 p-2 sm:p-2.5 rounded-xl flex-shrink-0 touch-manipulation"
              >
                <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600 dark:text-slate-300" />
              </button>

              <div className="flex items-start gap-3 sm:gap-4 lg:gap-4 min-w-0 flex-1">
                <div className="common-bg-icons w-10 sm:w-12 lg:w-14 h-10 sm:h-12 lg:h-14 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 sm:w-6 lg:w-7 h-5 sm:h-6 lg:h-7 text-slate-600 dark:text-slate-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-white mb-1 sm:mb-2 truncate">
                    Create New AI Employee
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Configure your AI agent's identity, personality, and capabilities
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => navigate("/agents")}
                className="flex-1 sm:flex-none common-button-bg2 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl touch-manipulation min-h-[40px]"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none common-button-bg flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl touch-manipulation min-h-[40px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                <span className="text-sm sm:text-base font-medium">
                  {isSubmitting ? "Creating..." : "Create Agent"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 sm:gap-6 lg:gap-8 overflow-visible">
        <div className="space-y-4 sm:space-y-6 min-w-0 overflow-visible">
          {/* Identity Section */}
          <GlassCard className="overflow-visible">
            <div className="p-4 sm:p-5 lg:p-6 overflow-visible">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                  Agent Identity
                </h3>
              </div>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
                Define your agent's basic identity and personality
              </p>

              <div className="space-y-4 sm:space-y-6 overflow-visible">
                {/* Template Suggestions - Mobile Only */}
                <div className="lg:hidden">
                

                  {formData.businessProcess && formData.industry ? (
                    <div className="space-y-4">
                      <div className="common-bg-icons p-4 rounded-xl">
                        <h4 className="font-semibold text-slate-800 dark:text-white mb-2">
                          {template.name}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          {template.description}
                        </p>
                        <div className="space-y-2 mb-4">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            Key Features:
                          </p>
                          <ul className="space-y-1">
                            {template.features.map((feature, idx) => (
                              <li
                                key={idx}
                                className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2"
                              >
                                <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <button
                          onClick={applyTemplate}
                          className="w-full common-button-bg px-4 py-2 rounded-lg text-sm"
                        >
                          Apply Template
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 common-bg-icons rounded-xl">
                      <Lightbulb className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Select a business process and industry to see template recommendations
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Agent Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Sarah - Customer Support"
                    className="common-bg-icons w-full px-4 py-3 rounded-xl text-sm sm:text-base"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-visible">
                  <div className="overflow-visible relative z-20">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Business Process <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={businessProcesses}
                      value={formData.businessProcess}
                      onChange={(value) => setFormData({ ...formData, businessProcess: value })}
                      placeholder="Select process..."
                    />
                  </div>

                  <div className="overflow-visible relative z-20">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Industry <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={industries}
                      value={formData.industry}
                      onChange={(value) => setFormData({ ...formData, industry: value })}
                      placeholder="Select industry..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-visible">
                  <div className="overflow-visible relative z-10">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Gender
                    </label>
                    <SearchableSelect
                      options={genders}
                      value={formData.gender}
                      onChange={(value) => setFormData({ ...formData, gender: value })}
                      placeholder="Select gender..."
                    />
                  </div>

                  <div className="overflow-visible relative z-10">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Persona
                    </label>
                    <SearchableSelect
                      options={[
                        { value: "Friendly", label: "Friendly" },
                        { value: "Formal", label: "Formal" },
                        { value: "Empathetic", label: "Empathetic" },
                        { value: "Persuasive (Sales)", label: "Persuasive (Sales)" },
                        { value: "Reassuring (Support)", label: "Reassuring (Support)" },
                      ]}
                      value={formData.persona}
                      onChange={(value) => setFormData({ ...formData, persona: value })}
                      placeholder="Select persona..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-visible">
                  <div className="overflow-visible relative z-10">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Language
                    </label>
                    <SearchableSelect
                      options={[
                        { value: "multilingual", label: "🌐 Multilingual" },
                        { value: "ar", label: "🇸🇦 Arabic" },
                        { value: "zh", label: "🇨🇳 Chinese" },
                        { value: "nl", label: "🇳🇱 Dutch" },
                        { value: "en-GB", label: "🇬🇧 English (UK)" },
                        { value: "en-US", label: "🇺🇸 English (US)" },
                        { value: "en-IN", label: "🇮🇳 English (India)" },
                        { value: "fr", label: "🇫🇷 French" },
                        { value: "de", label: "🇩🇪 German" },
                        { value: "hi", label: "🇮🇳 Hindi" },
                        { value: "it", label: "🇮🇹 Italian" },
                        { value: "ja", label: "🇯🇵 Japanese" },
                        { value: "ko", label: "🇰🇷 Korean" },
                        { value: "pt", label: "🇵🇹 Portuguese" },
                        { value: "pl", label: "🇵🇱 Polish" },
                        { value: "ru", label: "🇷🇺 Russian" },
                        { value: "es", label: "🇪🇸 Spanish" },
                        { value: "tr", label: "🇹🇷 Turkish" },
                      ]}
                      value={formData.language}
                      onChange={(value) => setFormData({ ...formData, language: value })}
                      placeholder="Select language..."
                    />
                  </div>

                  <div className="overflow-visible relative z-10">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Voice
                    </label>
                    <SearchableSelect
                      options={[
                        { value: "alloy", label: "Alloy - Neutral" },
                        { value: "echo", label: "Echo - Male" },
                        { value: "fable", label: "Fable - British Male" },
                        { value: "onyx", label: "Onyx - Deep Male" },
                        { value: "nova", label: "Nova - Female" },
                        { value: "shimmer", label: "Shimmer - Soft Female" },
                      ]}
                      value={formData.voice}
                      onChange={(value) => setFormData({ ...formData, voice: value })}
                      placeholder="Select voice..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Custom Instructions <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.customInstructions}
                    onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
                    placeholder="Provide specific instructions for your agent's behavior..."
                    rows={4}
                    className="common-bg-icons w-full px-4 py-3 rounded-xl resize-none text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Advanced Settings */}
          <GlassCard className="overflow-visible">
            <div className="p-4 sm:p-5 lg:p-6 overflow-visible relative">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                  Advanced Settings
                </h3>
              </div>

              <div className="space-y-4 sm:space-y-6 overflow-visible">
                <div className="overflow-visible relative z-10">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Guardrails Level
                  </label>
                  <SearchableSelect
                    options={[
                      { value: "Low", label: "Low - Flexible responses" },
                      { value: "Medium", label: "Medium - Balanced control" },
                      { value: "High", label: "High - Strict boundaries" },
                    ]}
                    value={formData.guardrailsLevel}
                    onChange={(value) => setFormData({ ...formData, guardrailsLevel: value })}
                    placeholder="Select guardrails level..."
                  />
                </div>

                <div className="overflow-visible relative z-10">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Response Style
                  </label>
                  <SearchableSelect
                    options={responseStyleOptions}
                    value={formData.responseStyle}
                    onChange={(value) => setFormData({ ...formData, responseStyle: value })}
                    placeholder="Select response style..."
                  />
                </div>

                <div className="overflow-visible relative z-10">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Max Response Length
                  </label>
                  <SearchableSelect
                    options={maxResponseOptions}
                    value={formData.maxResponseLength}
                    onChange={(value) => setFormData({ ...formData, maxResponseLength: value })}
                    placeholder="Select max response length..."
                  />
                </div>

                <div className="overflow-visible relative z-10">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Context Window
                  </label>
                  <SearchableSelect
                    options={contextWindowOptions}
                    value={formData.contextWindow}
                    onChange={(value) => setFormData({ ...formData, contextWindow: value })}
                    placeholder="Select context window..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Temperature: {formData.temperature.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>Focused (0)</span>
                    <span>Creative (1)</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6 overflow-visible">
          {/* Template Suggestions - Desktop Only */}
          <GlassCard className="hidden lg:block">
            <div className="p-4 sm:p-5 lg:p-6">
            

              {formData.businessProcess && formData.industry ? (
                <div className="space-y-4">
                  <div className="common-bg-icons p-4 rounded-xl">
                    <h4 className="font-semibold text-slate-800 dark:text-white mb-2">
                      {template.name}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {template.description}
                    </p>
                    <div className="space-y-2 mb-4">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Key Features:
                      </p>
                      <ul className="space-y-1">
                        {template.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2"
                          >
                            <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      onClick={applyTemplate}
                      className="w-full common-button-bg px-4 py-2 rounded-lg text-sm"
                    >
                      Apply Template
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Lightbulb className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Select a business process and industry to see template recommendations
                  </p>
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-4 sm:p-5 lg:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white mb-4">
                Next Steps
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      Create your agent
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Fill out the basic information
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      Train your agent
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Add knowledge and examples
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      Test & Publish
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Validate and go live
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

export default CreateAgent;
