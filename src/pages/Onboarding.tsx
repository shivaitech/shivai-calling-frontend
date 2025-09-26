"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Check,
  Building2,
  ChevronDown,
  Crown,
  X,
  Bot,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../resources/images/ShivaiLogo.svg";
import Step3, { AgentConfig, OnboardingFormData } from "../components/Step3";

const industryOptions = [
  { value: "technology-it", label: "Technology / IT Services" },
  { value: "healthcare-clinics", label: "Healthcare & Clinics" },
  { value: "finance-insurance", label: "Finance & Insurance" },
  { value: "retail-ecommerce", label: "Retail & E-Commerce" },
  { value: "education-training", label: "Education & Training" },
  { value: "real-estate-property", label: "Real Estate & Property" },
  { value: "hospitality-travel", label: "Hospitality & Travel" },
  {
    value: "food-beverage",
    label: "Food & Beverage (Restaurants, Cafes, Catering)",
  },
  { value: "automotive-transportation", label: "Automotive & Transportation" },
  { value: "legal-professional", label: "Legal & Professional Services" },
  { value: "manufacturing-industrial", label: "Manufacturing & Industrial" },
  { value: "logistics-supply", label: "Logistics & Supply Chain" },
  { value: "media-entertainment", label: "Media & Entertainment" },
  { value: "beauty-wellness", label: "Beauty, Wellness & Personal Care" },
  {
    value: "nonprofit-community",
    label: "Nonprofit & Community Organizations",
  },
];

const regionOptions = [
  { value: "north-america", label: "North America" },
  { value: "europe", label: "Europe" },
  { value: "asia-pacific", label: "Asia Pacific" },
  { value: "latin-america", label: "Latin America" },
  { value: "middle-east-africa", label: "Middle East & Africa" },
  { value: "global", label: "Global" },
];

const planOptions = [
  {
    id: "base",
    name: "Base Plan",
    description: "Perfect for small businesses getting started",
    maxAgents: 1,
    features: [
      "1 AI Employee",
      "Basic call handling",
      "Standard integrations",
      "Email support",
    ],
    price: "$99/month",
  },
  {
    id: "advanced",
    name: "Advanced Plan",
    description: "Ideal for growing businesses with complex needs",
    maxAgents: 3,
    features: [
      "Up to 3 AI Employees",
      "Advanced call routing",
      "Premium integrations",
      "Priority support",
      "Custom workflows",
    ],
    price: "$299/month",
  },
];

// Use case options
const useCaseOptions = [
  {
    value: "sales-business-development",
    label: "Sales & Business Development",
    description: "Lead qualification, product demos, follow-ups, upselling",
  },
  {
    value: "customer-support-service",
    label: "Customer Support & Service",
    description: "Complaints handling, FAQs, issue resolution, escalations",
  },
  {
    value: "appointment-scheduling",
    label: "Appointment & Scheduling",
    description: "Bookings, reminders, confirmations, cancellations",
  },
  {
    value: "order-billing",
    label: "Order Management & Billing",
    description: "Order taking, payment support, billing queries, refunds",
  },
  {
    value: "product-service-explainers",
    label: "Product / Service Explainers",
    description: "Guided walkthroughs, feature education, onboarding help",
  },
  {
    value: "feedback-engagement",
    label: "Feedback & Engagement",
    description: "Surveys, NPS collection, post-service follow-ups",
  },
  {
    value: "custom-workflows",
    label: "Custom Workflows",
    description: "Any business-specific processes not covered above",
  },
];

// AI Employee templates
const agentTemplates = [
  {
    id: "sales-agent",
    name: "Sales AI Employee",
    description: "Focused on lead generation and qualification",
    triggerCases: ["sales-business-development"],
    agentName: "Sales AI Employee",
    personality: "enthusiastic",
    responseStyle: "conversational",
    escalationRules: "smart",
    languages: ["english"],
    agentVoice: "nova",
    agentGender: "neutral",
    agentBehavior: "proactive",
    voiceStyle: "enthusiastic",
    specialInstructions:
      "Focus on understanding customer needs and qualifying leads effectively.",
    features: [
      "Lead scoring and qualification",
      "Product recommendation engine",
      "Follow-up scheduling",
      "CRM integration",
    ],
  },
  {
    id: "support-agent",
    name: "Customer Support AI Employee",
    description: "Handles general customer inquiries and support",
    triggerCases: ["customer-support-service"],
    agentName: "Support AI Employee",
    personality: "friendly",
    responseStyle: "detailed",
    escalationRules: "shivai-first",
    languages: ["english"],
    agentVoice: "echo",
    agentGender: "neutral",
    agentBehavior: "supportive",
    voiceStyle: "empathetic",
    specialInstructions:
      "Always try to resolve issues before escalating to human staff.",
    features: [
      "Ticket creation and tracking",
      "Knowledge base integration",
      "Multi-language support",
      "Escalation management",
    ],
  },
  {
    id: "service-agent",
    name: "Service AI Employee",
    description: "Manages appointments, orders, and billing",
    triggerCases: ["appointment-scheduling", "order-billing"],
    agentName: "Service AI Employee",
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
    name: "Feedback & Survey AI Employee",
    description: "Collects customer feedback and conducts surveys",
    triggerCases: ["feedback-engagement"],
    agentName: "Feedback AI Employee",
    personality: "friendly",
    responseStyle: "conversational",
    escalationRules: "no-escalation",
    languages: ["english"],
    agentVoice: "fable",
    agentGender: "neutral",
    agentBehavior: "consultative",
    voiceStyle: "casual",
    specialInstructions:
      "Be encouraging and make surveys feel like conversations.",
    features: [
      "Dynamic survey generation",
      "Sentiment analysis",
      "Response tracking",
      "Report generation",
    ],
  },
  {
    id: "complaints-agent",
    name: "Complaints Handler AI Employee",
    description: "Specialized in handling customer complaints and issues",
    triggerCases: ["customer-support-service"],
    agentName: "Resolution AI Employee",
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
    name: "Customer Retention AI Employee",
    description: "Focuses on customer retention and loyalty",
    triggerCases: ["sales-business-development", "feedback-engagement"],
    agentName: "Retention AI Employee",
    personality: "enthusiastic",
    responseStyle: "conversational",
    escalationRules: "smart",
    languages: ["english"],
    agentVoice: "nova",
    agentGender: "neutral",
    agentBehavior: "proactive",
    voiceStyle: "enthusiastic",
    specialInstructions:
      "Focus on building long-term relationships and identifying upsell opportunities.",
    features: [
      "Churn prediction",
      "Loyalty program management",
      "Upsell identification",
      "Relationship scoring",
    ],
  },
  {
    id: "technical-agent",
    name: "Technical Support AI Employee",
    description: "Advanced technical support and troubleshooting",
    triggerCases: ["customer-support-service"],
    agentName: "Tech Support AI Employee",
    personality: "professional",
    responseStyle: "structured",
    escalationRules: "always",
    languages: ["english"],
    agentVoice: "onyx",
    agentGender: "neutral",
    agentBehavior: "analytical",
    voiceStyle: "formal",
    specialInstructions:
      "Provide step-by-step technical guidance and diagnostic help.",
    features: [
      "Diagnostic workflows",
      "Technical documentation access",
      "Remote assistance integration",
      "Issue escalation protocols",
    ],
  },
  {
    id: "multilingual-agent",
    name: "Multilingual Support AI Employee",
    description: "Provides support in multiple languages",
    triggerCases: ["customer-support-service", "order-billing"],
    agentName: "Global Support AI Employee",
    personality: "friendly",
    responseStyle: "conversational",
    escalationRules: "shivai-first",
    languages: ["english", "spanish", "french"],
    agentVoice: "echo",
    agentGender: "neutral",
    agentBehavior: "supportive",
    voiceStyle: "natural",
    specialInstructions:
      "Automatically detect language and respond appropriately.",
    features: [
      "Auto-language detection",
      "Multi-language responses",
      "Cultural awareness",
      "Translation capabilities",
    ],
  },
  {
    id: "custom-multi-purpose",
    name: "Custom Multi-Purpose AI Employee",
    description:
      "Advanced AI Employee capable of handling multiple use cases with intelligent context switching",
    triggerCases: [], // Will be shown when 3+ use cases are selected
    agentName: "Multi-Purpose AI Employee",
    personality: "professional",
    responseStyle: "detailed",
    escalationRules: "shivai-first",
    languages: ["english"],
    agentVoice: "alloy",
    agentGender: "neutral",
    agentBehavior: "consultative",
    voiceStyle: "natural",
    specialInstructions:
      "Handle multiple types of inquiries with context switching. Maintain conversation flow across different use cases. Escalate when tasks require specialized human support.",
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
  { value: "french", label: "French" },
  { value: "german", label: "German" },
  { value: "italian", label: "Italian" },
  { value: "portuguese", label: "Portuguese" },
  { value: "spanish", label: "Spanish" },
];

const escalationOptions = [
  { value: "always", label: "Always escalate complex queries" },
  { value: "smart", label: "Smart escalation (confidence-based)" },
  { value: "shivai-first", label: "AI Employee first, escalate if needed" },
  {
    value: "minimal",
    label: "Minimal escalation (AI Employee handles majority)",
  },
  { value: "no-escalation", label: "No escalation (AI Employee only)" },
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
  const [selectedTemplates, setSelectedTemplates] = useState<
    Record<number, string>
  >({});
  const [showTemplateFeatures, setShowTemplateFeatures] = useState<
    Record<number, boolean>
  >({});
  const [showUseCaseDropdown, setShowUseCaseDropdown] = useState<
    Record<number, boolean>
  >({});
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showCallVolumeDropdown, setShowCallVolumeDropdown] = useState<
    Record<number, boolean>
  >({});
  const [showPersonalityDropdown, setShowPersonalityDropdown] = useState<
    Record<number, boolean>
  >({});
  const [showResponseStyleDropdown, setShowResponseStyleDropdown] = useState<
    Record<number, boolean>
  >({});
  const [showEscalationDropdown, setShowEscalationDropdown] = useState<
    Record<number, boolean>
  >({});
  const [showVoiceDropdown, setShowVoiceDropdown] = useState<
    Record<number, boolean>
  >({});
  const [showGenderDropdown, setShowGenderDropdown] = useState<
    Record<number, boolean>
  >({});
  const [showBehaviorDropdown, setShowBehaviorDropdown] = useState<
    Record<number, boolean>
  >({});
  const [showVoiceStyleDropdown, setShowVoiceStyleDropdown] = useState<
    Record<number, boolean>
  >({});
  const [showLanguageDropdown, setShowLanguageDropdown] = useState<
    Record<number, boolean>
  >({});
  const [industrySearch, setIndustrySearch] = useState("");
  const [regionSearch, setRegionSearch] = useState("");
  const [callVolumeSearch, setCallVolumeSearch] = useState<
    Record<number, string>
  >({});
  const [personalitySearch, setPersonalitySearch] = useState<
    Record<number, string>
  >({});
  const [responseStyleSearch, setResponseStyleSearch] = useState<
    Record<number, string>
  >({});
  const [escalationSearch, setEscalationSearch] = useState<
    Record<number, string>
  >({});
  const [voiceSearch, setVoiceSearch] = useState<Record<number, string>>({});
  const [genderSearch, setGenderSearch] = useState<Record<number, string>>({});
  const [behaviorSearch, setBehaviorSearch] = useState<Record<number, string>>(
    {}
  );
  const [voiceStyleSearch, setVoiceStyleSearch] = useState<
    Record<number, string>
  >({});
  const [languageSearch, setLanguageSearch] = useState<Record<number, string>>(
    {}
  );

  const { register, handleSubmit, watch, setValue } =
    useForm<OnboardingFormData>({
      defaultValues: {
        companyName: "",
        industry: [],
        businessProcesses: "",
        website: "",
        primaryRegion: "",
        plan: "",
        agentCount: 1,
        agents: [],
      },
    });

  const totalSteps = 3;

  // Initialize agents array when agent count changes
  const agentCount = watch("agentCount");
  React.useEffect(() => {
    const currentAgents = watch("agents") || [];
    if (agentCount > currentAgents.length) {
      const newAgents = [...currentAgents];
      for (let i = currentAgents.length; i < agentCount; i++) {
        newAgents.push({
          agentName: `AI Employee ${i + 1}`,
          agentType: "",
          preferredLanguage: "",
          voiceGender: "",
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
    setShowRegionDropdown(false);
  };

  // Global click outside handler and focus handler to close dropdowns
  React.useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as HTMLElement;

      // Check if the click is inside any dropdown or dropdown trigger
      const isInsideDropdown =
        target.closest("[data-dropdown]") ||
        target.closest("[data-dropdown-trigger]");

      if (!isInsideDropdown) {
        closeAllDropdowns();
      }
    };

    const handleFocusChange = (event: FocusEvent) => {
      const target = event.target as HTMLElement;

      // Close dropdowns when focusing on elements that are not dropdown-related
      const isDropdownRelated =
        target.closest("[data-dropdown]") ||
        target.closest("[data-dropdown-trigger]") ||
        target.hasAttribute("data-dropdown-trigger");

      // Only close dropdowns if focusing on input/textarea/button elements that are not dropdown-related
      if (
        !isDropdownRelated &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "BUTTON")
      ) {
        closeAllDropdowns();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("focusin", handleFocusChange);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("focusin", handleFocusChange);
    };
  }, []);

  const onSubmit = async (data: OnboardingFormData) => {
    if (currentStep !== totalSteps) return;

    setIsSubmitting(true);
    try {
      console.log("Onboarding data:", data);
      console.log("AI Employees configured:", data.agents.length);
      console.log(
        "AI Employee details:",
        data.agents.map((agent) => ({
          name: agent.agentName,
          type: agent.agentType,
          language: agent.preferredLanguage,
          voiceGender: agent.voiceGender,
        }))
      );

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
                Company Basics
              </h2>
              <p className="text-sm sm:text-base text-gray-600 px-2">
                Tell us about your company to customize your AI Employee
                experience
              </p>
            </div>

            {/* Company Details */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  {...register("companyName", {
                    required: "Company name is required",
                  })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your company name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    {...register("website")}
                    type="url"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://your-company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Region
                  </label>
                  <div className="relative" data-dropdown-trigger>
                    <input
                      value={regionSearch}
                      onChange={(e) => {
                        setRegionSearch(e.target.value);
                        setValue("primaryRegion", e.target.value);
                      }}
                      onFocus={() => setShowRegionDropdown(true)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Select your primary region"
                    />
                    <ChevronDown
                      className={`absolute right-3 top-3 w-4 h-4 text-gray-400 transition-transform cursor-pointer ${
                        showRegionDropdown ? "rotate-180" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowRegionDropdown(!showRegionDropdown);
                      }}
                    />

                    {showRegionDropdown && (
                      <div
                        className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                        data-dropdown
                      >
                        {regionOptions
                          .filter((option) =>
                            option.label
                              .toLowerCase()
                              .includes(regionSearch.toLowerCase())
                          )
                          .map((option) => (
                            <div
                              key={option.value}
                              onClick={() => {
                                setValue("primaryRegion", option.value);
                                setRegionSearch(option.label);
                                setShowRegionDropdown(false);
                              }}
                              className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              {option.label}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Processes
                </label>
                <textarea
                  {...register("businessProcesses")}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Describe your main business processes (e.g., lead generation, customer support, appointment booking...)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <div className="relative" data-dropdown-trigger>
                  <input
                    value={industrySearch}
                    onChange={(e) => setIndustrySearch(e.target.value)}
                    onFocus={() => setShowIndustryDropdown(true)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search or add industries"
                  />
                  <ChevronDown
                    className={`absolute right-3 top-3 w-4 h-4 text-gray-400 transition-transform cursor-pointer ${
                      showIndustryDropdown ? "rotate-180" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowIndustryDropdown(!showIndustryDropdown);
                    }}
                  />

                  {/* Selected Industries Display */}
                  {(() => {
                    const selectedIndustries = watch("industry") || [];
                    if (selectedIndustries.length > 0) {
                      return (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedIndustries.map((industry, index) => {
                            const industryLabel =
                              industryOptions.find(
                                (opt) => opt.value === industry
                              )?.label || industry;
                            return (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center gap-1"
                              >
                                {industryLabel}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newIndustries =
                                      selectedIndustries.filter(
                                        (_, i) => i !== index
                                      );
                                    setValue("industry", newIndustries);
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {showIndustryDropdown && (
                    <div
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                      data-dropdown
                    >
                      {industryOptions
                        .filter(
                          (option) =>
                            option.label
                              .toLowerCase()
                              .includes(industrySearch.toLowerCase()) &&
                            !(watch("industry") || []).includes(option.value)
                        )
                        .map((option) => (
                          <div
                            key={option.value}
                            onClick={() => {
                              const currentIndustries = watch("industry") || [];
                              setValue("industry", [
                                ...currentIndustries,
                                option.value,
                              ]);
                              setIndustrySearch("");
                            }}
                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            {option.label}
                          </div>
                        ))}
                      {industrySearch &&
                        !industryOptions.some((opt) =>
                          opt.label
                            .toLowerCase()
                            .includes(industrySearch.toLowerCase())
                        ) &&
                        !(watch("industry") || []).includes(industrySearch) && (
                          <div
                            onClick={() => {
                              const currentIndustries = watch("industry") || [];
                              setValue("industry", [
                                ...currentIndustries,
                                industrySearch,
                              ]);
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
            className="space-y-6 bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-md lg:shadow-lg border border-gray-200"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Choose Your Plan
              </h2>
              <p className="text-sm sm:text-base text-gray-600 px-2">
                Select the plan that best fits your business needs
              </p>
            </div>

            {/* Plan Selection */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {planOptions.map((plan) => {
                const isSelected = watch("plan") === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => {
                      setValue("plan", plan.id as "base" | "advanced");
                      // Reset agent count based on plan
                      setValue("agentCount", 1);
                    }}
                    className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-lg"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}

                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {plan.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {plan.description}
                      </p>
                      <div className="text-2xl font-bold text-blue-600">
                        {plan.price}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Employee Count Selection */}
            {watch("plan") && (
              <div className="border-t border-gray-200 pt-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    How many AI Employees do you need?
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {watch("plan") === "base"
                      ? "Base plan includes 1 AI Employee"
                      : "Advanced plan supports up to 3 AI Employees"}
                  </p>
                </div>

                <div className="flex justify-center">
                  <div className="flex flex-wrap gap-3 justify-center">
                    {(() => {
                      const selectedPlan = planOptions.find(
                        (p) => p.id === watch("plan")
                      );
                      const maxAgents = selectedPlan?.maxAgents || 1;
                      return Array.from(
                        { length: maxAgents },
                        (_, i) => i + 1
                      ).map((count) => (
                        <label
                          key={count}
                          className={`px-6 py-3 rounded-lg cursor-pointer transition-all font-medium text-sm flex items-center justify-center min-w-[120px] ${
                            watch("agentCount") === count
                              ? "bg-blue-600 text-white shadow-lg"
                              : "bg-gray-100 text-gray-700 hover:bg-blue-50 border border-gray-200"
                          }`}
                        >
                          <input
                            type="radio"
                            value={count}
                            checked={watch("agentCount") === count}
                            onChange={() => setValue("agentCount", count)}
                            className="sr-only"
                          />
                          {count} {count === 1 ? "AI Employee" : "AI Employees"}
                        </label>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );

      case 3:
        return (
          <Step3
            register={register}
            watch={watch}
            setValue={setValue}
            agentCount={agentCount}
            stepVariants={stepVariants}
            activeAgentTab={activeAgentTab}
            setActiveAgentTab={setActiveAgentTab}
            selectedTemplates={selectedTemplates}
            setSelectedTemplates={setSelectedTemplates}
            showTemplateFeatures={showTemplateFeatures}
            setShowTemplateFeatures={setShowTemplateFeatures}
            showUseCaseDropdown={showUseCaseDropdown}
            setShowUseCaseDropdown={setShowUseCaseDropdown}
          />
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
            className="bg-white rounded-xl p-8 max-w-lg w-full text-center"
          >
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Success!</h3>
            <div className="space-y-3 text-left bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-gray-800 font-medium">
                Your requirements have been submitted.
              </p>
              <p className="text-gray-700">
                Your AI Employee is being configured. Please check back shortly
                – you'll soon be able to test, refine, and go live with ShivAI.
              </p>
              <p className="text-gray-700">
                We'll notify you the moment it's ready to take calls.
              </p>
            </div>
            <button
              onClick={closeSuccessModal}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Continue to Dashboard
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
