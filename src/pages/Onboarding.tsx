"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Bot,
  CheckCircle,
  Check,
  Building2,
  ChevronDown,
  Upload,
  X,
  Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../resources/images/ShivaiLogo.svg";

// Individual Agent Configuration
interface AgentConfig {
  agentName: string;
  agentDescription: string;
  primaryUseCase: string;
  useCases: string[];
  expectedCallVolume: string;
  currentSolution: string;
  agentPersonality: string;
  responseStyle: string;
  specialInstructions: string;
  languages: string[];
  escalationRules: string;
  knowledgeBase: File[];
  referralWebsites: string[];
  agentVoice: string;
  agentGender: string;
  agentBehavior: string;
  voiceStyle: string;
}

// Form data interface
interface OnboardingFormData {
  // Step 1: Company Info + Agent Count
  companyName: string;
  companySize: string;
  industry: string[];
  role: string;
  agentCount: number;
  
  // Step 2: Agent Configurations
  agents: AgentConfig[];
}

// Company options
const companySizeOptions = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-1000", label: "201-1000 employees" },
  { value: "1000+", label: "1000+ employees" },
];

const industryOptions = [
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "retail", label: "Retail" },
  { value: "education", label: "Education" },
  { value: "real-estate", label: "Real Estate" },
  { value: "consulting", label: "Consulting" },
  { value: "manufacturing", label: "Manufacturing" },
];

const roleOptions = [
  { value: "ceo", label: "CEO/Founder" },
  { value: "cto", label: "CTO" },
  { value: "marketing", label: "Marketing Manager" },
  { value: "sales", label: "Sales Manager" },
  { value: "operations", label: "Operations Manager" },
  { value: "developer", label: "Developer" },
  { value: "customer-success", label: "Customer Success" },
];

// Use case options
const useCaseOptions = [
  { value: "lead-qualification", label: "Lead Qualification" },
  { value: "lead-generation", label: "Lead Generation" },
  { value: "follow-ups", label: "Follow-ups" },
  { value: "general-support", label: "General Support" },
  { value: "technical-support", label: "Technical Support" },
  { value: "complaints", label: "Complaints Handling" },
  { value: "appointment-booking", label: "Appointment Booking" },
  { value: "order-taking", label: "Order Taking" },
  { value: "billing-queries", label: "Billing Queries" },
  { value: "surveys", label: "Surveys & Feedback" },
];

// Agent templates
const agentTemplates = [
  {
    id: "sales-agent",
    name: "Sales Agent",
    description: "Focused on lead generation and qualification",
    triggerCases: ["lead-qualification", "lead-generation"],
    agentName: "Sales Assistant",
    personality: "enthusiastic",
    responseStyle: "conversational",
    escalationRules: "smart",
    languages: ["english"],
    agentVoice: "nova",
    agentGender: "neutral",
    agentBehavior: "proactive",
    voiceStyle: "enthusiastic",
    specialInstructions: "Focus on understanding customer needs and qualifying leads effectively.",
    features: [
      "Lead scoring and qualification",
      "Product recommendation engine",
      "Follow-up scheduling",
      "CRM integration",
    ],
  },
  {
    id: "support-agent",
    name: "Customer Support",
    description: "Handles general customer inquiries and support",
    triggerCases: ["general-support", "technical-support"],
    agentName: "Support Assistant",
    personality: "friendly",
    responseStyle: "detailed",
    escalationRules: "shivai-first",
    languages: ["english"],
    agentVoice: "echo",
    agentGender: "neutral",
    agentBehavior: "supportive",
    voiceStyle: "empathetic",
    specialInstructions: "Always try to resolve issues before escalating to human agents.",
    features: [
      "Ticket creation and tracking",
      "Knowledge base integration",
      "Multi-language support",
      "Escalation management",
    ],
  },
  {
    id: "service-agent",
    name: "Service Agent",
    description: "Manages appointments, orders, and billing",
    triggerCases: ["appointment-booking", "order-taking", "billing-queries"],
    agentName: "Service Assistant",
    personality: "professional",
    responseStyle: "structured",
    escalationRules: "smart",
    languages: ["english"],
    agentVoice: "alloy",
    agentGender: "neutral",
    agentBehavior: "analytical",
    voiceStyle: "formal",
    specialInstructions: "Be precise with scheduling and order details.",
    features: [
      "Calendar integration",
      "Payment processing",
      "Order management",
      "Billing inquiry handling",
    ],
  },
  {
    id: "feedback-agent",
    name: "Feedback & Survey Agent",
    description: "Collects customer feedback and conducts surveys",
    triggerCases: ["surveys", "follow-ups"],
    agentName: "Feedback Collector",
    personality: "friendly",
    responseStyle: "conversational",
    escalationRules: "no-escalation",
    languages: ["english"],
    agentVoice: "fable",
    agentGender: "neutral",
    agentBehavior: "consultative",
    voiceStyle: "casual",
    specialInstructions: "Be encouraging and make surveys feel like conversations.",
    features: [
      "Dynamic survey generation",
      "Sentiment analysis",
      "Response tracking",
      "Report generation",
    ],
  },
  {
    id: "complaints-agent",
    name: "Complaints Handler",
    description: "Specialized in handling customer complaints and issues",
    triggerCases: ["complaints"],
    agentName: "Resolution Specialist",
    personality: "calm",
    responseStyle: "detailed",
    escalationRules: "shivai-first",
    languages: ["english"],
    agentVoice: "shimmer",
    agentGender: "neutral",
    agentBehavior: "supportive",
    voiceStyle: "calm",
    specialInstructions: "Listen actively, empathize, and focus on resolution.",
    features: [
      "Complaint classification",
      "Resolution tracking",
      "Compensation logic",
      "Follow-up automation",
    ],
  },
  {
    id: "retention-agent",
    name: "Customer Retention Agent",
    description: "Focuses on customer retention and loyalty",
    triggerCases: ["follow-ups", "lead-qualification"],
    agentName: "Retention Specialist",
    personality: "enthusiastic",
    responseStyle: "conversational",
    escalationRules: "smart",
    languages: ["english"],
    agentVoice: "nova",
    agentGender: "neutral",
    agentBehavior: "proactive",
    voiceStyle: "enthusiastic",
    specialInstructions: "Focus on building long-term relationships and identifying upsell opportunities.",
    features: [
      "Churn prediction",
      "Loyalty program management",
      "Upsell identification",
      "Relationship scoring",
    ],
  },
  {
    id: "technical-agent",
    name: "Technical Support Agent",
    description: "Advanced technical support and troubleshooting",
    triggerCases: ["technical-support"],
    agentName: "Tech Support Specialist",
    personality: "professional",
    responseStyle: "structured",
    escalationRules: "always",
    languages: ["english"],
    agentVoice: "onyx",
    agentGender: "neutral",
    agentBehavior: "analytical",
    voiceStyle: "formal",
    specialInstructions: "Provide step-by-step technical guidance and diagnostic help.",
    features: [
      "Diagnostic workflows",
      "Technical documentation access",
      "Remote assistance integration",
      "Issue escalation protocols",
    ],
  },
  {
    id: "multilingual-agent",
    name: "Multilingual Support Agent",
    description: "Provides support in multiple languages",
    triggerCases: ["general-support", "technical-support", "billing-queries"],
    agentName: "Global Support Assistant",
    personality: "friendly",
    responseStyle: "conversational",
    escalationRules: "shivai-first",
    languages: ["english", "spanish", "french"],
    agentVoice: "echo",
    agentGender: "neutral",
    agentBehavior: "supportive",
    voiceStyle: "natural",
    specialInstructions: "Automatically detect language and respond appropriately.",
    features: [
      "Auto-language detection",
      "Multi-language responses",
      "Cultural awareness",
      "Translation capabilities",
    ],
  },
  {
    id: "custom-multi-purpose",
    name: "Custom Multi-Purpose Agent",
    description: "Advanced agent capable of handling multiple use cases with intelligent context switching",
    triggerCases: [], // Will be shown when 3+ use cases are selected
    agentName: "Multi-Purpose Assistant",
    personality: "professional",
    responseStyle: "detailed",
    escalationRules: "shivai-first",
    languages: ["english"],
    agentVoice: "alloy",
    agentGender: "neutral",
    agentBehavior: "consultative",
    voiceStyle: "natural",
    specialInstructions: "Handle multiple types of inquiries with context switching. Maintain conversation flow across different use cases. Escalate when tasks require specialized human intervention.",
    features: [
      "Multi-context handling",
      "Advanced conversation flow",
      "Intelligent escalation",
      "Cross-use case learning",
      "Dynamic response adaptation",
      "Context switching capabilities",
    ],
  },
];

const callVolumeOptions = [
  { value: "1-100", label: "1-100 calls/month" },
  { value: "101-500", label: "101-500 calls/month" },
  { value: "501-1000", label: "501-1000 calls/month" },
  { value: "1001-5000", label: "1001-5000 calls/month" },
  { value: "5000+", label: "5000+ calls/month" },
];

const personalityOptions = [
  { value: "professional", label: "Professional & Formal" },
  { value: "friendly", label: "Friendly & Casual" },
  { value: "enthusiastic", label: "Enthusiastic & Energetic" },
  { value: "calm", label: "Calm & Patient" },
  { value: "authoritative", label: "Authoritative & Direct" },
];

const responseStyleOptions = [
  { value: "concise", label: "Concise & Brief" },
  { value: "detailed", label: "Detailed & Thorough" },
  { value: "conversational", label: "Conversational & Engaging" },
  { value: "structured", label: "Structured & Step-by-step" },
];

const languageOptions = [
  { value: "english", label: "English" },
  { value: "spanish", label: "Spanish" },
  { value: "french", label: "French" },
  { value: "german", label: "German" },
  { value: "portuguese", label: "Portuguese" },
  { value: "italian", label: "Italian" },
];

const escalationOptions = [
  { value: "always", label: "Always escalate complex queries" },
  { value: "smart", label: "Smart escalation (confidence-based)" },
  { value: "shivai-first", label: "ShivAI first, escalate if needed" },
  { value: "minimal", label: "Minimal escalation (ShivAI handles majority)" },
  { value: "no-escalation", label: "No escalation (ShivAI only)" },
  { value: "custom", label: "Custom escalation rules" },
];

const voiceOptions = [
  { value: "alloy", label: "Alloy - Natural & Clear" },
  { value: "echo", label: "Echo - Warm & Professional" },
  { value: "fable", label: "Fable - Friendly & Approachable" },
  { value: "onyx", label: "Onyx - Deep & Authoritative" },
  { value: "nova", label: "Nova - Bright & Energetic" },
  { value: "shimmer", label: "Shimmer - Smooth & Calm" },
];

const genderOptions = [
  { value: "neutral", label: "Gender Neutral" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const behaviorOptions = [
  { value: "proactive", label: "Proactive - Takes initiative" },
  { value: "reactive", label: "Reactive - Responds to queries" },
  { value: "consultative", label: "Consultative - Advisory approach" },
  { value: "supportive", label: "Supportive - Helpful & understanding" },
  { value: "analytical", label: "Analytical - Data-driven responses" },
];

const voiceStyleOptions = [
  { value: "natural", label: "Natural - Human-like flow" },
  { value: "formal", label: "Formal - Business appropriate" },
  { value: "casual", label: "Casual - Relaxed & friendly" },
  { value: "enthusiastic", label: "Enthusiastic - High energy" },
  { value: "calm", label: "Calm - Steady & reassuring" },
  { value: "empathetic", label: "Empathetic - Understanding tone" },
];

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [activeAgentTab, setActiveAgentTab] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<Record<number, string>>({});
  const [showTemplateFeatures, setShowTemplateFeatures] = useState<Record<number, boolean>>({});
  const [showUseCaseDropdown, setShowUseCaseDropdown] = useState<Record<number, boolean>>({});
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showCompanySizeDropdown, setShowCompanySizeDropdown] = useState(false);
  const [showCallVolumeDropdown, setShowCallVolumeDropdown] = useState<Record<number, boolean>>({});
  const [showPersonalityDropdown, setShowPersonalityDropdown] = useState<Record<number, boolean>>({});
  const [showResponseStyleDropdown, setShowResponseStyleDropdown] = useState<Record<number, boolean>>({});
  const [showEscalationDropdown, setShowEscalationDropdown] = useState<Record<number, boolean>>({});
  const [showVoiceDropdown, setShowVoiceDropdown] = useState<Record<number, boolean>>({});
  const [showGenderDropdown, setShowGenderDropdown] = useState<Record<number, boolean>>({});
  const [showBehaviorDropdown, setShowBehaviorDropdown] = useState<Record<number, boolean>>({});
  const [showVoiceStyleDropdown, setShowVoiceStyleDropdown] = useState<Record<number, boolean>>({});
  const [showLanguageDropdown, setShowLanguageDropdown] = useState<Record<number, boolean>>({});
  const [industrySearch, setIndustrySearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [companySizeSearch, setCompanySizeSearch] = useState("");
  const [callVolumeSearch, setCallVolumeSearch] = useState<Record<number, string>>({});
  const [personalitySearch, setPersonalitySearch] = useState<Record<number, string>>({});
  const [responseStyleSearch, setResponseStyleSearch] = useState<Record<number, string>>({});
  const [escalationSearch, setEscalationSearch] = useState<Record<number, string>>({});
  const [voiceSearch, setVoiceSearch] = useState<Record<number, string>>({});
  const [genderSearch, setGenderSearch] = useState<Record<number, string>>({});
  const [behaviorSearch, setBehaviorSearch] = useState<Record<number, string>>({});
  const [voiceStyleSearch, setVoiceStyleSearch] = useState<Record<number, string>>({});
  const [languageSearch, setLanguageSearch] = useState<Record<number, string>>({});

  const {
    register,
    handleSubmit,
    watch,
    setValue,
  } = useForm<OnboardingFormData>({
    defaultValues: {
      companyName: "",
      companySize: "",
      industry: [],
      role: "",
      agentCount: 1,
      agents: [],
    },
  });

  const totalSteps = 2;

  // Initialize agents array when agent count changes
  const agentCount = watch("agentCount");
  React.useEffect(() => {
    const currentAgents = watch("agents") || [];
    if (agentCount > currentAgents.length) {
      const newAgents = [...currentAgents];
      for (let i = currentAgents.length; i < agentCount; i++) {
        newAgents.push({
          agentName: `Agent ${i + 1}`,
          agentDescription: "",
          primaryUseCase: "",
          useCases: [],
          expectedCallVolume: "",
          currentSolution: "",
          agentPersonality: "",
          responseStyle: "",
          specialInstructions: "",
          languages: [],
          escalationRules: "",
          knowledgeBase: [],
          referralWebsites: [],
          agentVoice: "",
          agentGender: "",
          agentBehavior: "",
          voiceStyle: "",
        });
      }
      setValue("agents", newAgents);
    } else if (agentCount < currentAgents.length) {
      setValue("agents", currentAgents.slice(0, agentCount));
    }
  }, [agentCount, setValue, watch]);

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Helper function to close all dropdowns
  const closeAllDropdowns = () => {
    setShowCallVolumeDropdown({});
    setShowPersonalityDropdown({});
    setShowResponseStyleDropdown({});
    setShowEscalationDropdown({});
    setShowVoiceDropdown({});
    setShowGenderDropdown({});
    setShowBehaviorDropdown({});
    setShowVoiceStyleDropdown({});
    setShowLanguageDropdown({});
    setShowUseCaseDropdown({});
    setShowIndustryDropdown(false);
    setShowRoleDropdown(false);
    setShowCompanySizeDropdown(false);
  };

  const onSubmit = async (data: OnboardingFormData) => {
    if (currentStep !== totalSteps) return;

    setIsSubmitting(true);
    try {
      console.log("Onboarding data:", data);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Onboarding error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    navigate("/");
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4 sm:space-y-5 bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-md lg:shadow-lg border border-gray-200"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Company Information
              </h2>
              <p className="text-sm sm:text-base text-gray-600 px-2">
                Tell us about your company and how many AI agents you need
              </p>
            </div>

            {/* Company Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  {...register("companyName", { required: "Company name is required" })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your company name"
                />
              </div>

              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Size
                  </label>
                  <div className="relative">
                    <input
                      {...register("companySize")}
                      value={companySizeSearch}
                      onChange={(e) => {
                        setCompanySizeSearch(e.target.value);
                        setValue("companySize", e.target.value);
                      }}
                      onFocus={() => setShowCompanySizeDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCompanySizeDropdown(false), 150)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Search or type company size"
                    />
                    <ChevronDown className={`absolute right-3 top-3 w-4 h-4 text-gray-400 transition-transform ${showCompanySizeDropdown ? 'rotate-180' : ''}`} />
                    
                    {showCompanySizeDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {companySizeOptions
                          .filter(option => option.label.toLowerCase().includes(companySizeSearch.toLowerCase()))
                          .map((option) => (
                            <div
                              key={option.value}
                              onClick={() => {
                                setValue("companySize", option.value);
                                setCompanySizeSearch(option.label);
                                setShowCompanySizeDropdown(false);
                              }}
                              className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              {option.label}
                            </div>
                          ))
                        }
                        {companySizeSearch && !companySizeOptions.some(opt => opt.label.toLowerCase().includes(companySizeSearch.toLowerCase())) && (
                          <div
                            onClick={() => {
                              setValue("companySize", companySizeSearch);
                              setShowCompanySizeDropdown(false);
                            }}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-blue-600 font-medium"
                          >
                            + Add "{companySizeSearch}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Role
                  </label>
                  <div className="relative">
                    <input
                      {...register("role")}
                      value={roleSearch}
                      onChange={(e) => {
                        setRoleSearch(e.target.value);
                        setValue("role", e.target.value);
                      }}
                      onFocus={() => setShowRoleDropdown(true)}
                      onBlur={() => setTimeout(() => setShowRoleDropdown(false), 150)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Search or type your role"
                    />
                    <ChevronDown className={`absolute right-3 top-3 w-4 h-4 text-gray-400 transition-transform ${showRoleDropdown ? 'rotate-180' : ''}`} />
                    
                    {showRoleDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {roleOptions
                          .filter(option => option.label.toLowerCase().includes(roleSearch.toLowerCase()))
                          .map((option) => (
                            <div
                              key={option.value}
                              onClick={() => {
                                setValue("role", option.value);
                                setRoleSearch(option.label);
                                setShowRoleDropdown(false);
                              }}
                              className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              {option.label}
                            </div>
                          ))
                        }
                        {roleSearch && !roleOptions.some(opt => opt.label.toLowerCase().includes(roleSearch.toLowerCase())) && (
                          <div
                            onClick={() => {
                              setValue("role", roleSearch);
                              setShowRoleDropdown(false);
                            }}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-blue-600 font-medium"
                          >
                            + Add "{roleSearch}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <div className="relative">
                  <input
                    value={industrySearch}
                    onChange={(e) => setIndustrySearch(e.target.value)}
                    onFocus={() => setShowIndustryDropdown(true)}
                    onBlur={() => setTimeout(() => setShowIndustryDropdown(false), 150)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search or add industries"
                  />
                  <ChevronDown className={`absolute right-3 top-3 w-4 h-4 text-gray-400 transition-transform ${showIndustryDropdown ? 'rotate-180' : ''}`} />
                  
                  {/* Selected Industries Display */}
                  {(() => {
                    const selectedIndustries = watch("industry") || [];
                    if (selectedIndustries.length > 0) {
                      return (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedIndustries.map((industry, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center gap-1"
                            >
                              {industry}
                              <button
                                type="button"
                                onClick={() => {
                                  const newIndustries = selectedIndustries.filter((_, i) => i !== index);
                                  setValue("industry", newIndustries);
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {showIndustryDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {industryOptions
                        .filter(option => 
                          option.label.toLowerCase().includes(industrySearch.toLowerCase()) &&
                          !(watch("industry") || []).includes(option.value)
                        )
                        .map((option) => (
                          <div
                            key={option.value}
                            onClick={() => {
                              const currentIndustries = watch("industry") || [];
                              setValue("industry", [...currentIndustries, option.value]);
                              setIndustrySearch("");
                            }}
                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            {option.label}
                          </div>
                        ))
                      }
                      {industrySearch && 
                       !industryOptions.some(opt => opt.label.toLowerCase().includes(industrySearch.toLowerCase())) &&
                       !(watch("industry") || []).includes(industrySearch) && (
                        <div
                          onClick={() => {
                            const currentIndustries = watch("industry") || [];
                            setValue("industry", [...currentIndustries, industrySearch]);
                            setIndustrySearch("");
                          }}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-blue-600 font-medium"
                        >
                          + Add "{industrySearch}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Agent Count Selection */}
            <div className="border-t border-gray-200 pt-6 mt-6 w-full">
              <div className="text-center mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  How many AI agents do you need?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose the number of AI agents you want to set up
                </p>
              </div>

              <div className="flex justify-center">
                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center w-full ">
                  {[1, 2, 3, 4].map((count) => (
                    <label
                      key={count}
                      className={`flex-1 min-w-[44%] sm:min-w-[80px] h-12 px-2 sm:px-4 rounded-lg cursor-pointer transition-all font-medium text-sm flex items-center justify-center
                        ${watch("agentCount") === count
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-gray-100 text-gray-700 hover:bg-blue-50 border border-gray-200"
                        }`}
                      style={{ maxWidth: "48%" }}
                    >
                      <input
                        type="radio"
                        value={count}
                        checked={watch("agentCount") === count}
                        onChange={() => setValue("agentCount", count)}
                        className="sr-only"
                      />
                      {count} {count === 1 ? "Agent" : "Agents"}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-5 bg-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Configure Your AI Agents
              </h2>
              <p className="text-sm sm:text-base text-gray-600 px-2">
                Set up each agent with specific roles and capabilities
              </p>
            </div>

            {/* Agent Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6">
              {Array.from({ length: agentCount }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveAgentTab(index)}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm sm:text-base font-semibold transition-all touch-manipulation ${
                    activeAgentTab === index
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800 active:bg-gray-200"
                  }`}
                >
                  Agent {index + 1}
                </button>
              ))}
            </div>

            {/* Agent Configuration Form */}
            <div className="space-y-6">
              

              {/* Use Case Selection - Multi-Select Dropdown */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Select Use Cases for Agent {activeAgentTab + 1}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Choose what this AI agent will help with. Select multiple use cases for a versatile agent.
                  </p>
                  
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowUseCaseDropdown(prev => ({ ...prev, [activeAgentTab]: !prev[activeAgentTab] }))}
                      className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg bg-white flex items-center justify-between focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const selectedUseCases = watch(`agents.${activeAgentTab}.useCases`) || [];
                          if (selectedUseCases.length === 0) {
                            return <span className="text-gray-500">Select use cases...</span>;
                          }
                          if (selectedUseCases.length <= 2) {
                            return selectedUseCases.map(value => {
                              const option = useCaseOptions.find(opt => opt.value === value);
                              return (
                                <span key={value} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                                  {option?.label}
                                </span>
                              );
                            });
                          }
                          return (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                              {selectedUseCases.length} use cases selected
                            </span>
                          );
                        })()}
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showUseCaseDropdown[activeAgentTab] ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showUseCaseDropdown[activeAgentTab] && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {useCaseOptions.map((option) => {
                          const isSelected = watch(`agents.${activeAgentTab}.useCases`)?.includes(option.value) || false;
                          return (
                            <label
                              key={option.value}
                              className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const currentUseCases = watch(`agents.${activeAgentTab}.useCases`) || [];
                                  if (e.target.checked) {
                                    setValue(`agents.${activeAgentTab}.useCases`, [...currentUseCases, option.value]);
                                  } else {
                                    setValue(`agents.${activeAgentTab}.useCases`, currentUseCases.filter(uc => uc !== option.value));
                                  }
                                }}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                              />
                              <span className="text-sm font-medium text-gray-900">{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

              
              </div>


              {/* Template Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Choose a Template (Optional)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Start with a pre-configured template based on your selected use cases, or configure manually.
                </p>
                

                
                {/* Template Slider */}
                <div className="relative">
                  <div className="flex overflow-x-auto gap-4 pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {(() => {
                      const agentUseCases = watch(`agents.${activeAgentTab}.useCases`) || [];
                      
                      // Sort templates to show recommended ones first
                      const sortedTemplates = [...agentTemplates].sort((a, b) => {
                        // If 3+ use cases selected, show custom template first
                        if (agentUseCases.length >= 3) {
                          if (a.id === "custom-multi-purpose") return -1;
                          if (b.id === "custom-multi-purpose") return 1;
                        }
                        
                        const aMatches = a.triggerCases.filter(trigger => agentUseCases.includes(trigger)).length;
                        const bMatches = b.triggerCases.filter(trigger => agentUseCases.includes(trigger)).length;
                        return bMatches - aMatches; // Sort by match count descending
                      });
                      
                      return sortedTemplates.map((template) => {
                        const matchCount = template.triggerCases.filter(trigger => agentUseCases.includes(trigger)).length;
                        const isRecommended = matchCount > 0 || (template.id === "custom-multi-purpose" && agentUseCases.length >= 3);
                        const isSelected = selectedTemplates[activeAgentTab] === template.id;
                      
                      return (
                        <div
                          key={template.id}
                          className={`flex-shrink-0 w-72 border rounded-lg p-4 cursor-pointer transition-all ${
                            isSelected 
                              ? "border-blue-500 bg-blue-50 shadow-md" 
                              : isRecommended 
                                ? "border-green-300 bg-green-50" 
                                : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => {
                            setValue(`agents.${activeAgentTab}.agentName`, template.agentName);
                            setValue(`agents.${activeAgentTab}.agentPersonality`, template.personality);
                            setValue(`agents.${activeAgentTab}.responseStyle`, template.responseStyle);
                            setValue(`agents.${activeAgentTab}.escalationRules`, template.escalationRules);
                            setValue(`agents.${activeAgentTab}.specialInstructions`, template.specialInstructions);
                            setValue(`agents.${activeAgentTab}.languages`, template.languages);
                            setValue(`agents.${activeAgentTab}.agentVoice`, template.agentVoice);
                            setValue(`agents.${activeAgentTab}.agentGender`, template.agentGender);
                            setValue(`agents.${activeAgentTab}.agentBehavior`, template.agentBehavior);
                            setValue(`agents.${activeAgentTab}.voiceStyle`, template.voiceStyle);
                            
                            // Clear search states so template values show up
                            setCallVolumeSearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                            setPersonalitySearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                            setResponseStyleSearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                            setEscalationSearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                            setVoiceSearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                            setGenderSearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                            setBehaviorSearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                            setVoiceStyleSearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                            setLanguageSearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                            
                            setSelectedTemplates(prev => ({ ...prev, [activeAgentTab]: template.id }));
                            setShowTemplateFeatures(prev => ({ ...prev, [activeAgentTab]: true }));
                          }}
                        >
                          <div className="flex justify-between items-start mb-3">
                            {isRecommended && (
                              <div className={`text-xs px-2 py-1 rounded-full ${
                                template.id === "custom-multi-purpose" && agentUseCases.length >= 3
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-green-100 text-green-800"
                              }`}>
                                {template.id === "custom-multi-purpose" && agentUseCases.length >= 3
                                  ? `🎯 Best for ${agentUseCases.length} Use Cases`
                                  : "⭐ Recommended"
                                }
                              </div>
                            )}
                            {isSelected && (
                              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                ✓ Selected
                              </div>
                            )}
                          </div>
                          
                          <h4 className="font-semibold text-gray-900 mb-2">{template.name}</h4>
                          <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                          
                          <div className="text-xs text-gray-500 border-t pt-2 space-y-1">
                            <p><strong>Style:</strong> {responseStyleOptions.find(s => s.value === template.responseStyle)?.label}</p>
                            <p><strong>Escalation:</strong> {escalationOptions.find(e => e.value === template.escalationRules)?.label}</p>
                          </div>
                        </div>
                      );
                      });
                    })()}
                  </div>
                  
                  {/* Scroll indicators */}
                  <div className="flex justify-center mt-2 space-x-1">
                    {agentTemplates.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          selectedTemplates[activeAgentTab] === agentTemplates[index].id
                            ? "bg-blue-500"
                            : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Template Features Detail View */}
                {selectedTemplates[activeAgentTab] && showTemplateFeatures[activeAgentTab] && (() => {
                  const selectedTemplate = agentTemplates.find(t => t.id === selectedTemplates[activeAgentTab]);
                  if (!selectedTemplate) return null;
                  
                  return (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-3">
                        {selectedTemplate.name} - Detailed Features
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Core Capabilities</h5>
                          <ul className="space-y-1">
                            {selectedTemplate.features.map((feature, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-center">
                                <span className="text-blue-500 mr-2">•</span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Configuration</h5>
                          <div className="text-sm text-gray-700 space-y-1">
                            <p><strong>Personality:</strong> {personalityOptions.find(p => p.value === selectedTemplate.personality)?.label}</p>
                            <p><strong>Response Style:</strong> {responseStyleOptions.find(s => s.value === selectedTemplate.responseStyle)?.label}</p>
                            <p><strong>Escalation:</strong> {escalationOptions.find(e => e.value === selectedTemplate.escalationRules)?.label}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <h5 className="font-medium text-gray-900 mb-2">Special Instructions</h5>
                        <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                          {selectedTemplate.specialInstructions}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Name
                  </label>
                  <input
                    {...register(`agents.${activeAgentTab}.agentName`)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter agent name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Call Volume
                  </label>
                  <div className="relative">
                    <div
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer flex items-center justify-between"
                      onClick={() => {
                        closeAllDropdowns();
                        setShowCallVolumeDropdown(prev => ({ ...prev, [activeAgentTab]: !prev[activeAgentTab] }));
                        if (!showCallVolumeDropdown[activeAgentTab]) {
                          setCallVolumeSearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                        }
                      }}
                    >
                      <input
                        {...register(`agents.${activeAgentTab}.expectedCallVolume`)}
                        placeholder="Search or select call volume..."
                        className="flex-1 bg-transparent border-none outline-none text-gray-900"
                        value={callVolumeSearch[activeAgentTab] || watch(`agents.${activeAgentTab}.expectedCallVolume`) || ""}
                        onChange={(e) => {
                          setCallVolumeSearch(prev => ({ ...prev, [activeAgentTab]: e.target.value }));
                          setValue(`agents.${activeAgentTab}.expectedCallVolume`, e.target.value);
                        }}
                        autoComplete="off"
                      />
                      <ChevronDown 
                        className={`h-4 w-4 text-gray-400 transition-transform ${showCallVolumeDropdown[activeAgentTab] ? 'rotate-180' : ''}`} 
                      />
                    </div>
                    
                    {showCallVolumeDropdown[activeAgentTab] && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {callVolumeOptions
                          .filter(option => 
                            option.label.toLowerCase().includes((callVolumeSearch[activeAgentTab] || "").toLowerCase())
                          )
                          .map((option) => (
                            <div
                              key={option.value}
                              className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-gray-900"
                              onClick={() => {
                                setValue(`agents.${activeAgentTab}.expectedCallVolume`, option.value);
                                setCallVolumeSearch(prev => ({ ...prev, [activeAgentTab]: option.label }));
                                setShowCallVolumeDropdown(prev => ({ ...prev, [activeAgentTab]: false }));
                              }}
                            >
                              {option.label}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                  {/* Knowledge Base Upload */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Knowledge Base Upload</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Upload documents, PDFs, or files that the agent should reference for better responses.
                  </p>
                  
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drop files here or <span className="text-blue-600 font-medium">browse</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports PDF, DOC, DOCX, TXT files (Max 10MB each)
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const currentFiles = watch(`agents.${activeAgentTab}.knowledgeBase`) || [];
                        setValue(`agents.${activeAgentTab}.knowledgeBase`, [...currentFiles, ...files]);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      style={{ zIndex: 2 }}
                    />
                  </div>
                  
                  {/* Display uploaded files */}
                  {(() => {
                    const uploadedFiles = watch(`agents.${activeAgentTab}.knowledgeBase`) || [];
                    if (uploadedFiles.length > 0) {
                      return (
                        <div className="mt-3 space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                              <span className="text-sm text-gray-700 truncate">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newFiles = uploadedFiles.filter((_, i) => i !== index);
                                  setValue(`agents.${activeAgentTab}.knowledgeBase`, newFiles);
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Referral Websites */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Referral Websites</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Add website URLs that the agent can reference for information or direct customers to.
                  </p>
                  
                  <div className="space-y-2">
                    {(() => {
                      const websites = watch(`agents.${activeAgentTab}.referralWebsites`) || [];
                      return websites.map((website, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="url"
                            value={website}
                            onChange={(e) => {
                              const newWebsites = [...websites];
                              newWebsites[index] = e.target.value;
                              setValue(`agents.${activeAgentTab}.referralWebsites`, newWebsites);
                            }}
                            placeholder="https://example.com"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newWebsites = websites.filter((_, i) => i !== index);
                              setValue(`agents.${activeAgentTab}.referralWebsites`, newWebsites);
                            }}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ));
                    })()}
                    
                    <button
                      type="button"
                      onClick={() => {
                        const currentWebsites = watch(`agents.${activeAgentTab}.referralWebsites`) || [];
                        setValue(`agents.${activeAgentTab}.referralWebsites`, [...currentWebsites, ""]);
                      }}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Website
                    </button>
                  </div>
                </div>
              </div>

              {/* Manual Configuration */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  Manual Configuration
                </h3>
                <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-2 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agent Personality
                    </label>
                    <div className="relative">
                      <div
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer flex items-center justify-between"
                        onClick={() => {
                          closeAllDropdowns();
                          setShowPersonalityDropdown(prev => ({ ...prev, [activeAgentTab]: !prev[activeAgentTab] }));
                          if (!showPersonalityDropdown[activeAgentTab]) {
                            setPersonalitySearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                          }
                        }}
                      >
                        <input
                          {...register(`agents.${activeAgentTab}.agentPersonality`)}
                          placeholder="Search or select personality..."
                          className="flex-1 bg-transparent border-none outline-none text-gray-900"
                          value={personalitySearch[activeAgentTab] || personalityOptions.find(p => p.value === watch(`agents.${activeAgentTab}.agentPersonality`))?.label || watch(`agents.${activeAgentTab}.agentPersonality`) || ""}
                          onChange={(e) => {
                            setPersonalitySearch(prev => ({ ...prev, [activeAgentTab]: e.target.value }));
                            const matchingOption = personalityOptions.find(option => 
                              option.label.toLowerCase() === e.target.value.toLowerCase()
                            );
                            setValue(`agents.${activeAgentTab}.agentPersonality`, matchingOption ? matchingOption.value : e.target.value);
                          }}
                          autoComplete="off"
                        />
                        <ChevronDown 
                          className={`h-4 w-4 text-gray-400 transition-transform ${showPersonalityDropdown[activeAgentTab] ? 'rotate-180' : ''}`} 
                        />
                      </div>
                      
                      {showPersonalityDropdown[activeAgentTab] && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {personalityOptions
                            .filter(option => 
                              option.label.toLowerCase().includes((personalitySearch[activeAgentTab] || "").toLowerCase())
                            )
                            .map((option) => (
                              <div
                                key={option.value}
                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-gray-900"
                                onClick={() => {
                                  setValue(`agents.${activeAgentTab}.agentPersonality`, option.value);
                                  setPersonalitySearch(prev => ({ ...prev, [activeAgentTab]: option.label }));
                                  setShowPersonalityDropdown(prev => ({ ...prev, [activeAgentTab]: false }));
                                }}
                              >
                                {option.label}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Response Style
                    </label>
                    <div className="relative">
                      <div
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer flex items-center justify-between"
                        onClick={() => {
                          closeAllDropdowns();
                          setShowResponseStyleDropdown(prev => ({ ...prev, [activeAgentTab]: !prev[activeAgentTab] }));
                          if (!showResponseStyleDropdown[activeAgentTab]) {
                            setResponseStyleSearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                          }
                        }}
                      >
                        <input
                          {...register(`agents.${activeAgentTab}.responseStyle`)}
                          placeholder="Search or select response style..."
                          className="flex-1 bg-transparent border-none outline-none text-gray-900"
                          value={responseStyleSearch[activeAgentTab] || responseStyleOptions.find(s => s.value === watch(`agents.${activeAgentTab}.responseStyle`))?.label || watch(`agents.${activeAgentTab}.responseStyle`) || ""}
                          onChange={(e) => {
                            setResponseStyleSearch(prev => ({ ...prev, [activeAgentTab]: e.target.value }));
                            const matchingOption = responseStyleOptions.find(option => 
                              option.label.toLowerCase() === e.target.value.toLowerCase()
                            );
                            setValue(`agents.${activeAgentTab}.responseStyle`, matchingOption ? matchingOption.value : e.target.value);
                          }}
                          autoComplete="off"
                        />
                        <ChevronDown 
                          className={`h-4 w-4 text-gray-400 transition-transform ${showResponseStyleDropdown[activeAgentTab] ? 'rotate-180' : ''}`} 
                        />
                      </div>
                      
                      {showResponseStyleDropdown[activeAgentTab] && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {responseStyleOptions
                            .filter(option => 
                              option.label.toLowerCase().includes((responseStyleSearch[activeAgentTab] || "").toLowerCase())
                            )
                            .map((option) => (
                              <div
                                key={option.value}
                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-gray-900"
                                onClick={() => {
                                  setValue(`agents.${activeAgentTab}.responseStyle`, option.value);
                                  setResponseStyleSearch(prev => ({ ...prev, [activeAgentTab]: option.label }));
                                  setShowResponseStyleDropdown(prev => ({ ...prev, [activeAgentTab]: false }));
                                }}
                              >
                                {option.label}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agent Voice
                    </label>
                    <div className="relative">
                      <div
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer flex items-center justify-between"
                        onClick={() => {
                          closeAllDropdowns();
                          setShowVoiceDropdown(prev => ({ ...prev, [activeAgentTab]: !prev[activeAgentTab] }));
                          if (!showVoiceDropdown[activeAgentTab]) {
                            setVoiceSearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                          }
                        }}
                      >
                        <input
                          {...register(`agents.${activeAgentTab}.agentVoice`)}
                          placeholder="Search or select voice..."
                          className="flex-1 bg-transparent border-none outline-none text-gray-900"
                          value={voiceSearch[activeAgentTab] || voiceOptions.find(v => v.value === watch(`agents.${activeAgentTab}.agentVoice`))?.label || watch(`agents.${activeAgentTab}.agentVoice`) || ""}
                          onChange={(e) => {
                            setVoiceSearch(prev => ({ ...prev, [activeAgentTab]: e.target.value }));
                            const matchingOption = voiceOptions.find(option => 
                              option.label.toLowerCase() === e.target.value.toLowerCase()
                            );
                            setValue(`agents.${activeAgentTab}.agentVoice`, matchingOption ? matchingOption.value : e.target.value);
                          }}
                          autoComplete="off"
                        />
                        <ChevronDown 
                          className={`h-4 w-4 text-gray-400 transition-transform ${showVoiceDropdown[activeAgentTab] ? 'rotate-180' : ''}`} 
                        />
                      </div>
                      
                      {showVoiceDropdown[activeAgentTab] && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {voiceOptions
                            .filter(option => 
                              option.label.toLowerCase().includes((voiceSearch[activeAgentTab] || "").toLowerCase())
                            )
                            .map((option) => (
                              <div
                                key={option.value}
                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-gray-900"
                                onClick={() => {
                                  setValue(`agents.${activeAgentTab}.agentVoice`, option.value);
                                  setVoiceSearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                                  setShowVoiceDropdown(prev => ({ ...prev, [activeAgentTab]: false }));
                                }}
                              >
                                {option.label}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <div className="relative">
                      <div
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer flex items-center justify-between"
                        onClick={() => {
                          closeAllDropdowns();
                          setShowGenderDropdown(prev => ({ ...prev, [activeAgentTab]: !prev[activeAgentTab] }));
                          if (!showGenderDropdown[activeAgentTab]) {
                            setGenderSearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                          }
                        }}
                      >
                        <input
                          {...register(`agents.${activeAgentTab}.agentGender`)}
                          placeholder="Search or select gender..."
                          className="flex-1 bg-transparent border-none outline-none text-gray-900"
                          value={genderSearch[activeAgentTab] || genderOptions.find(g => g.value === watch(`agents.${activeAgentTab}.agentGender`))?.label || watch(`agents.${activeAgentTab}.agentGender`) || ""}
                          onChange={(e) => {
                            setGenderSearch(prev => ({ ...prev, [activeAgentTab]: e.target.value }));
                            const matchingOption = genderOptions.find(option => 
                              option.label.toLowerCase() === e.target.value.toLowerCase()
                            );
                            setValue(`agents.${activeAgentTab}.agentGender`, matchingOption ? matchingOption.value : e.target.value);
                          }}
                          autoComplete="off"
                        />
                        <ChevronDown 
                          className={`h-4 w-4 text-gray-400 transition-transform ${showGenderDropdown[activeAgentTab] ? 'rotate-180' : ''}`} 
                        />
                      </div>
                      
                      {showGenderDropdown[activeAgentTab] && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {genderOptions
                            .filter(option => 
                              option.label.toLowerCase().includes((genderSearch[activeAgentTab] || "").toLowerCase())
                            )
                            .map((option) => (
                              <div
                                key={option.value}
                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-gray-900"
                                onClick={() => {
                                  setValue(`agents.${activeAgentTab}.agentGender`, option.value);
                                  setGenderSearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                                  setShowGenderDropdown(prev => ({ ...prev, [activeAgentTab]: false }));
                                }}
                              >
                                {option.label}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agent Behavior
                    </label>
                    <div className="relative">
                      <div
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer flex items-center justify-between"
                        onClick={() => {
                          closeAllDropdowns();
                          setShowBehaviorDropdown(prev => ({ ...prev, [activeAgentTab]: !prev[activeAgentTab] }));
                          if (!showBehaviorDropdown[activeAgentTab]) {
                            setBehaviorSearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                          }
                        }}
                      >
                        <input
                          {...register(`agents.${activeAgentTab}.agentBehavior`)}
                          placeholder="Search or select behavior..."
                          className="flex-1 bg-transparent border-none outline-none text-gray-900"
                          value={behaviorSearch[activeAgentTab] || behaviorOptions.find(b => b.value === watch(`agents.${activeAgentTab}.agentBehavior`))?.label || watch(`agents.${activeAgentTab}.agentBehavior`) || ""}
                          onChange={(e) => {
                            setBehaviorSearch(prev => ({ ...prev, [activeAgentTab]: e.target.value }));
                            const matchingOption = behaviorOptions.find(option => 
                              option.label.toLowerCase() === e.target.value.toLowerCase()
                            );
                            setValue(`agents.${activeAgentTab}.agentBehavior`, matchingOption ? matchingOption.value : e.target.value);
                          }}
                          autoComplete="off"
                        />
                        <ChevronDown 
                          className={`h-4 w-4 text-gray-400 transition-transform ${showBehaviorDropdown[activeAgentTab] ? 'rotate-180' : ''}`} 
                        />
                      </div>
                      
                      {showBehaviorDropdown[activeAgentTab] && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {behaviorOptions
                            .filter(option => 
                              option.label.toLowerCase().includes((behaviorSearch[activeAgentTab] || "").toLowerCase())
                            )
                            .map((option) => (
                              <div
                                key={option.value}
                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-gray-900"
                                onClick={() => {
                                  setValue(`agents.${activeAgentTab}.agentBehavior`, option.value);
                                  setBehaviorSearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                                  setShowBehaviorDropdown(prev => ({ ...prev, [activeAgentTab]: false }));
                                }}
                              >
                                {option.label}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Voice Style
                    </label>
                    <div className="relative">
                      <div
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer flex items-center justify-between"
                        onClick={() => {
                          closeAllDropdowns();
                          setShowVoiceStyleDropdown(prev => ({ ...prev, [activeAgentTab]: !prev[activeAgentTab] }));
                          if (!showVoiceStyleDropdown[activeAgentTab]) {
                            setVoiceStyleSearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                          }
                        }}
                      >
                        <input
                          {...register(`agents.${activeAgentTab}.voiceStyle`)}
                          placeholder="Search or select voice style..."
                          className="flex-1 bg-transparent border-none outline-none text-gray-900"
                          value={voiceStyleSearch[activeAgentTab] || voiceStyleOptions.find(vs => vs.value === watch(`agents.${activeAgentTab}.voiceStyle`))?.label || watch(`agents.${activeAgentTab}.voiceStyle`) || ""}
                          onChange={(e) => {
                            setVoiceStyleSearch(prev => ({ ...prev, [activeAgentTab]: e.target.value }));
                            const matchingOption = voiceStyleOptions.find(option => 
                              option.label.toLowerCase() === e.target.value.toLowerCase()
                            );
                            setValue(`agents.${activeAgentTab}.voiceStyle`, matchingOption ? matchingOption.value : e.target.value);
                          }}
                          autoComplete="off"
                        />
                        <ChevronDown 
                          className={`h-4 w-4 text-gray-400 transition-transform ${showVoiceStyleDropdown[activeAgentTab] ? 'rotate-180' : ''}`} 
                        />
                      </div>
                      
                      {showVoiceStyleDropdown[activeAgentTab] && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {voiceStyleOptions
                            .filter(option => 
                              option.label.toLowerCase().includes((voiceStyleSearch[activeAgentTab] || "").toLowerCase())
                            )
                            .map((option) => (
                              <div
                                key={option.value}
                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-gray-900"
                                onClick={() => {
                                  setValue(`agents.${activeAgentTab}.voiceStyle`, option.value);
                                  setVoiceStyleSearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                                  setShowVoiceStyleDropdown(prev => ({ ...prev, [activeAgentTab]: false }));
                                }}
                              >
                                {option.label}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Languages
                    </label>
                    <div className="relative">
                      <div
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer flex items-center justify-between min-h-[42px]"
                        onClick={() => {
                          closeAllDropdowns();
                          setShowLanguageDropdown(prev => ({ ...prev, [activeAgentTab]: !prev[activeAgentTab] }));
                          if (!showLanguageDropdown[activeAgentTab]) {
                            setLanguageSearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                          }
                        }}
                      >
                        <div className="flex flex-wrap gap-1 flex-1">
                          {(() => {
                            const selectedLanguages = watch(`agents.${activeAgentTab}.languages`) || [];
                            if (selectedLanguages.length > 0) {
                              return selectedLanguages.map((langValue, index) => {
                                const langOption = languageOptions.find(opt => opt.value === langValue);
                                return (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {langOption?.label || langValue}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const currentLanguages = watch(`agents.${activeAgentTab}.languages`) || [];
                                        setValue(`agents.${activeAgentTab}.languages`, currentLanguages.filter((_, i) => i !== index));
                                      }}
                                      className="ml-1 text-blue-600 hover:text-blue-800"
                                    >
                                      ×
                                    </button>
                                  </span>
                                );
                              });
                            }
                            return <span className="text-gray-500">Select languages...</span>;
                          })()}
                        </div>
                        <ChevronDown 
                          className={`h-4 w-4 text-gray-400 transition-transform ${showLanguageDropdown[activeAgentTab] ? 'rotate-180' : ''}`} 
                        />
                      </div>
                      
                      {showLanguageDropdown[activeAgentTab] && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          <div className="p-2 border-b border-gray-200">
                            <input
                              type="text"
                              placeholder="Search languages..."
                              value={languageSearch[activeAgentTab] || ""}
                              onChange={(e) => setLanguageSearch(prev => ({ ...prev, [activeAgentTab]: e.target.value }))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          {languageOptions
                            .filter(option => {
                              const searchTerm = languageSearch[activeAgentTab] || "";
                              const selectedLanguages = watch(`agents.${activeAgentTab}.languages`) || [];
                              return option.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                     !selectedLanguages.includes(option.value);
                            })
                            .map((option) => (
                              <div
                                key={option.value}
                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-gray-900"
                                onClick={() => {
                                  const currentLanguages = watch(`agents.${activeAgentTab}.languages`) || [];
                                  setValue(`agents.${activeAgentTab}.languages`, [...currentLanguages, option.value]);
                                  setLanguageSearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                                }}
                              >
                                {option.label}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Escalation Rules
                    </label>
                    <div className="relative">
                      <div
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer flex items-center justify-between"
                        onClick={() => {
                          closeAllDropdowns();
                          setShowEscalationDropdown(prev => ({ ...prev, [activeAgentTab]: !prev[activeAgentTab] }));
                          if (!showEscalationDropdown[activeAgentTab]) {
                            setEscalationSearch(prev => ({ ...prev, [activeAgentTab]: "" }));
                          }
                        }}
                      >
                        <input
                          {...register(`agents.${activeAgentTab}.escalationRules`)}
                          placeholder="Search or select escalation rules..."
                          className="flex-1 bg-transparent border-none outline-none text-gray-900"
                          value={escalationSearch[activeAgentTab] || escalationOptions.find(e => e.value === watch(`agents.${activeAgentTab}.escalationRules`))?.label || watch(`agents.${activeAgentTab}.escalationRules`) || ""}
                          onChange={(e) => {
                            setEscalationSearch(prev => ({ ...prev, [activeAgentTab]: e.target.value }));
                            const matchingOption = escalationOptions.find(option => 
                              option.label.toLowerCase() === e.target.value.toLowerCase()
                            );
                            setValue(`agents.${activeAgentTab}.escalationRules`, matchingOption ? matchingOption.value : e.target.value);
                          }}
                          autoComplete="off"
                        />
                        <ChevronDown 
                          className={`h-4 w-4 text-gray-400 transition-transform ${showEscalationDropdown[activeAgentTab] ? 'rotate-180' : ''}`} 
                        />
                      </div>
                      
                      {showEscalationDropdown[activeAgentTab] && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {escalationOptions
                            .filter(option => 
                              option.label.toLowerCase().includes((escalationSearch[activeAgentTab] || "").toLowerCase())
                            )
                            .map((option) => (
                              <div
                                key={option.value}
                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-gray-900"
                                onClick={() => {
                                  setValue(`agents.${activeAgentTab}.escalationRules`, option.value);
                                  setEscalationSearch(prev => ({ ...prev, [activeAgentTab]: option.label }));
                                  setShowEscalationDropdown(prev => ({ ...prev, [activeAgentTab]: false }));
                                }}
                              >
                                {option.label}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    {...register(`agents.${activeAgentTab}.specialInstructions`)}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Any specific instructions for this agent..."
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="ShivAI Logo" className="h-6" />
              <p className="text-gray-600">Agent Setup</p>
            </div>

            {/* Progress bar */}
            <div className="flex items-center space-x-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    i + 1 < currentStep
                      ? "bg-blue-500 text-white"
                      : i + 1 === currentStep
                      ? "bg-blue-100 text-blue-600 border-2 border-blue-500"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {i + 1 < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    i + 1
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 ">
        <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

        {/* Navigation */}
        <div className="mt-4 mb-8 flex flex-row justify-between gap-3 sm:gap-4">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center justify-center px-4 sm:px-8 py-3 flex-1 sm:flex-none sm:min-w-[120px] rounded-xl font-semibold text-sm sm:text-base transition-all touch-manipulation ${
              currentStep === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400"
            }`}
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Previous
          </button>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center justify-center px-4 sm:px-8 py-3 flex-1 sm:flex-none sm:min-w-[120px] bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 font-semibold text-sm sm:text-base transition-all touch-manipulation"
            >
              Next
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="flex items-center justify-center px-4 sm:px-8 py-3 flex-1 sm:flex-none sm:min-w-[140px] bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 font-semibold text-sm sm:text-base transition-all touch-manipulation disabled:opacity-50"
            >
              {isSubmitting ? "Setting up..." : "Complete Setup"}
            </button>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-8 max-w-md w-full text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Setup Complete!
            </h3>
            <p className="text-gray-600 mb-6">
              Your AI agents have been successfully configured and are ready to start handling calls.
            </p>
            <button
              onClick={closeSuccessModal}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium"
            >
              Go to Dashboard
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;