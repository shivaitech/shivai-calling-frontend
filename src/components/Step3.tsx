import React, { useState, useEffect } from "react";
import {
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
} from "react-hook-form";
import { motion } from "framer-motion";
import {
  Bot,
  ChevronDown,
  X,
  Plus,
  Upload,
  Link,
  FileText,
  Target,
  Globe,
  Smartphone,
  Monitor,
  Users,
  Phone,
  Crown,
} from "lucide-react";

// Individual AI Employee Configuration
export interface AgentConfig {
  agentName: string;
  agentType: string; // Sales, Support, Appointment
  preferredLanguage: string;
  voiceGender: string;
  agentPersonality?: string;
  responseStyle?: string;
  specialInstructions?: string;
  escalationRules?: string;
  expectedCallVolume?: string;
  languages?: string[];
  agentVoice?: string;
  voiceStyle?: string;
  knowledgeBase?: File[];
  referralWebsites?: string[];
  // Template-related fields
  selectedTemplate?: string;
  useCases?: string[];
  templateFeatures?: string[];
  primaryUseCase?: string;
  agentGender?: string;
  agentBehavior?: string;
  // Knowledge sources
  knowledgeWebsiteUrl?: string;
  socialLinks?: string[];
  uploadedFiles?: File[];
  faqsText?: string;
  // Instructions
  dosAndDonts?: string;
  fallbackContacts?: string[];
  // Targets
  successMetrics?: string[];
  targetDescription?: string;
  // Deployment
  deploymentTargets?: string[];
  deploymentService?: string; // 'client' | 'shivai'
  deploymentNotes?: string;
  // Consent options
  recordingEnabled?: boolean;
  transcriptEmailOptIn?: boolean;
  consentNotes?: string;
}

// Template interface
interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  agentName: string;
  personality: string;
  responseStyle: string;
  escalationRules: string;
  languages: string[];
  agentVoice: string;
  agentGender: string;
  agentBehavior: string;
  voiceStyle: string;
  specialInstructions: string;
  features: string[];
  triggerCases: string[];
}

// Form data interface
export interface OnboardingFormData {
  companyName: string;
  industry: string[];
  businessProcesses: string;
  website: string;
  primaryRegion: string;
  // Additional company details
  companySize?: string;
  foundedYear?: string;
  companyDescription?: string;
  companyEmail?: string;
  companyPhone?: string;
  linkedinUrl?: string;
  // Region of business
  businessCountries?: string[];
  businessStates?: string[];
  businessCities?: string[];
  // Plan information
  plan: "base" | "advanced" | "custom" | "";
  agentCount: number;
  agents: AgentConfig[];
  // Billing information
  offlineBilling?: boolean;
  billingContactName?: string;
  billingContactEmail?: string;
  billingContactPhone?: string;
  billingCompanyName?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  billingCountry?: string;
}

interface Step3Props {
  register: UseFormRegister<OnboardingFormData>;
  watch: UseFormWatch<OnboardingFormData>;
  setValue: UseFormSetValue<OnboardingFormData>;
  errors: any;
  agentCount: number;
  stepVariants: any;
  activeAgentTab: number;
  setActiveAgentTab: (tab: number) => void;
  selectedTemplates: Record<number, string>;
  setSelectedTemplates: (
    templates:
      | Record<number, string>
      | ((prev: Record<number, string>) => Record<number, string>)
  ) => void;
  showTemplateFeatures: Record<number, boolean>;
  setShowTemplateFeatures: (
    features:
      | Record<number, boolean>
      | ((prev: Record<number, boolean>) => Record<number, boolean>)
  ) => void;
}

const agentTypeOptions = [
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
  { value: "appointment", label: "Appointment" },
];

const languageOptions = [
  { value: "All", label: "Multilingual" },
  { value: "english", label: "English" },
  { value: "french", label: "French" },
  { value: "german", label: "German" },
  { value: "italian", label: "Italian" },
  { value: "portuguese", label: "Portuguese" },
  { value: "spanish", label: "Spanish" },
];

const voiceGenderOptions = [
  { value: "neutral", label: "Gender Neutral" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
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

// Call volume options removed - using simplified flow

const voiceStyleOptions = [
  { value: "natural", label: "Natural & Clear" },
  { value: "energetic", label: "Energetic & Enthusiastic" },
  { value: "calm", label: "Calm & Soothing" },
  { value: "confident", label: "Confident & Assertive" },
];

// Template system - Direct template selection without use case step
const agentTemplates: AgentTemplate[] = [
  {
    id: "sales-business-development",
    name: "Sales & Business Development",
    description: "Lead qualification, product demos, follow-ups, upselling",
    icon: "📈",
    agentName: "Sales AI Employee",
    personality: "enthusiastic",
    responseStyle: "conversational",
    escalationRules: "smart",
    languages: ["english"],
    agentVoice: "nova",
    agentGender: "neutral",
    agentBehavior: "proactive",
    voiceStyle: "energetic",
    specialInstructions:
      "Focus on understanding customer needs and qualifying leads effectively.",
    features: [
      "Lead scoring and qualification",
      "Product recommendation engine",
      "Follow-up scheduling",
      "CRM integration",
    ],
    triggerCases: ["sales-business-development"],
  },
  {
    id: "customer-support-service",
    name: "Customer Support & Service",
    description: "Complaints handling, FAQs, issue resolution, escalations",
    icon: "🎧",
    agentName: "Support AI Employee",
    personality: "friendly",
    responseStyle: "detailed",
    escalationRules: "shivai-first",
    languages: ["english"],
    agentVoice: "echo",
    agentGender: "neutral",
    agentBehavior: "supportive",
    voiceStyle: "calm",
    specialInstructions:
      "Always try to resolve issues before escalating to human staff.",
    features: [
      "Ticket creation and tracking",
      "Knowledge base integration",
      "Multi-language support",
      "Escalation management",
    ],
    triggerCases: ["customer-support-service"],
  },
  {
    id: "appointment-scheduling",
    name: "Appointment & Scheduling",
    description: "Bookings, reminders, confirmations, cancellations",
    icon: "📅",
    agentName: "Scheduling AI Employee",
    personality: "professional",
    responseStyle: "structured",
    escalationRules: "smart",
    languages: ["english"],
    agentVoice: "alloy",
    agentGender: "neutral",
    agentBehavior: "analytical",
    voiceStyle: "formal",
    specialInstructions:
      "Be precise with scheduling details and always confirm appointments.",
    features: [
      "Calendar integration",
      "Automated reminders",
      "Booking confirmations",
      "Cancellation management",
    ],
    triggerCases: ["appointment-scheduling"],
  },
  {
    id: "order-billing",
    name: "Order Management & Billing",
    description: "Order taking, payment support, billing queries, refunds",
    icon: "💳",
    agentName: "Order Management AI Employee",
    personality: "professional",
    responseStyle: "structured",
    escalationRules: "smart",
    languages: ["english"],
    agentVoice: "onyx",
    agentGender: "neutral",
    agentBehavior: "analytical",
    voiceStyle: "formal",
    specialInstructions:
      "Be accurate with order details and payment information.",
    features: [
      "Order processing",
      "Payment integration",
      "Billing inquiries",
      "Refund handling",
    ],
    triggerCases: ["order-billing"],
  },
  {
    id: "product-service-explainers",
    name: "Product / Service Explainers",
    description: "Guided walkthroughs, feature education, onboarding help",
    icon: "📚",
    agentName: "Product Expert AI Employee",
    personality: "friendly",
    responseStyle: "conversational",
    escalationRules: "smart",
    languages: ["english"],
    agentVoice: "fable",
    agentGender: "neutral",
    agentBehavior: "consultative",
    voiceStyle: "natural",
    specialInstructions:
      "Make complex information easy to understand and engaging.",
    features: [
      "Interactive tutorials",
      "Feature demonstrations",
      "Onboarding guides",
      "Documentation access",
    ],
    triggerCases: ["product-service-explainers"],
  },
  {
    id: "feedback-engagement",
    name: "Feedback & Engagement",
    description: "Surveys, NPS collection, post-service follow-ups",
    icon: "📊",
    agentName: "Feedback AI Employee",
    personality: "friendly",
    responseStyle: "conversational",
    escalationRules: "no-escalation",
    languages: ["english"],
    agentVoice: "shimmer",
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
    triggerCases: ["feedback-engagement"],
  },
  {
    id: "custom-workflows",
    name: "Custom Workflows",
    description: "Any business-specific processes not covered above",
    icon: "🎯",
    agentName: "Custom AI Employee",
    personality: "professional",
    responseStyle: "adaptable",
    escalationRules: "smart",
    languages: ["english"],
    agentVoice: "alloy",
    agentGender: "neutral",
    agentBehavior: "consultative",
    voiceStyle: "natural",
    specialInstructions:
      "Adapt to different conversation types and handle custom business processes.",
    features: [
      "Flexible workflow handling",
      "Custom process automation",
      "Adaptive responses",
      "Business-specific logic",
    ],
    triggerCases: ["custom-workflows"],
  },
];

const Step3: React.FC<Step3Props> = ({
  register,
  watch,
  setValue,
  errors,
  agentCount,
  stepVariants,
  activeAgentTab,
  setActiveAgentTab,
  selectedTemplates,
  setSelectedTemplates,
  showTemplateFeatures,
  setShowTemplateFeatures,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  // UI state for modern always-visible sections

  // Simplified state management for core functionality
  const [socialLinks, setSocialLinks] = useState<string[]>([""]);
  const [fallbackContacts, setFallbackContacts] = useState<string[]>([""]);
  const [successMetrics, setSuccessMetrics] = useState<string[]>([""]);
  const [selectedDeploymentTargets, setSelectedDeploymentTargets] = useState<
    string[]
  >([]);
  const [fileErrors, setFileErrors] = useState<Record<number, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, File[]>>(
    {}
  );

  // State for simplified form management

  // Plan-based consent preselection effect
  useEffect(() => {
    const currentPlan = watch("plan");
    const currentAgent = watch(`agents.${activeAgentTab}`);

    if (currentPlan && currentAgent) {
      // Plan feature mapping - Advanced and Custom plans get privacy features
      if (currentPlan === "advanced" || currentPlan === "custom") {
        // Preselect features for Advanced/Custom plans
        setValue(`agents.${activeAgentTab}.recordingEnabled`, true);
        setValue(`agents.${activeAgentTab}.transcriptEmailOptIn`, true);

        // Set advanced consent notes
        if (!currentAgent.consentNotes) {
          setValue(
            `agents.${activeAgentTab}.consentNotes`,
            "Advanced privacy features enabled. Call recording and transcript services available with proper user consent as per plan features."
          );
        }
      } else if (currentPlan === "base") {
        // Force disable for Basic plan
        setValue(`agents.${activeAgentTab}.recordingEnabled`, false);
        setValue(`agents.${activeAgentTab}.transcriptEmailOptIn`, false);

        // Set basic consent notes
        if (!currentAgent.consentNotes) {
          setValue(
            `agents.${activeAgentTab}.consentNotes`,
            "Basic privacy compliance. Standard call handling without recording. Upgrade to Advanced plan to enable call recording and transcript features."
          );
        }
      }
    }
  }, [watch("plan"), activeAgentTab, setValue, watch]);

  // Helper functions for managing dynamic arrays (website management removed for simplicity)

  const addSocialLink = () => setSocialLinks([...socialLinks, ""]);
  const removeSocialLink = (index: number) =>
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  const updateSocialLink = (index: number, value: string) => {
    const newLinks = [...socialLinks];
    newLinks[index] = value;
    setSocialLinks(newLinks);
  };

  const addFallbackContact = () =>
    setFallbackContacts([...fallbackContacts, ""]);
  const removeFallbackContact = (index: number) =>
    setFallbackContacts(fallbackContacts.filter((_, i) => i !== index));
  const updateFallbackContact = (index: number, value: string) => {
    const newContacts = [...fallbackContacts];
    newContacts[index] = value;
    setFallbackContacts(newContacts);
  };

  const addSuccessMetric = () => setSuccessMetrics([...successMetrics, ""]);
  const removeSuccessMetric = (index: number) =>
    setSuccessMetrics(successMetrics.filter((_, i) => i !== index));
  const updateSuccessMetric = (index: number, value: string) => {
    const newMetrics = [...successMetrics];
    newMetrics[index] = value;
    setSuccessMetrics(newMetrics);
  };

  const toggleDeploymentTarget = (target: string) => {
    setSelectedDeploymentTargets((prev) =>
      prev.includes(target)
        ? prev.filter((t) => t !== target)
        : [...prev, target]
    );
  };

  // File validation handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const maxSize = 20 * 1024 * 1024; // 20MB
    const maxFiles = 10;

    let errorMessage = "";
    const validFiles: File[] = [];

    if (files.length > maxFiles) {
      errorMessage = `Maximum ${maxFiles} files allowed`;
    } else {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (
          !allowedTypes.includes(file.type) &&
          !file.name.match(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx)$/i)
        ) {
          errorMessage = `File "${file.name}" is not a supported format. Only PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX are allowed.`;
          break;
        }

        if (file.size > maxSize) {
          errorMessage = `File "${file.name}" exceeds 20MB size limit`;
          break;
        }

        validFiles.push(file);
      }
    }

    if (errorMessage) {
      setFileErrors((prev) => ({ ...prev, [activeAgentTab]: errorMessage }));
      event.target.value = ""; // Clear the input
    } else {
      setFileErrors((prev) => ({ ...prev, [activeAgentTab]: "" }));
      setUploadedFiles((prev) => ({ ...prev, [activeAgentTab]: validFiles }));
    }
  };

  return (
    <motion.div
      key="step3"
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-3 sm:space-y-5 bg-white p-2 sm:p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100"
    >
      <div className="text-center mb-4 sm:mb-6">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
          Configure Your AI Employees
        </h2>
        <p className="text-xs sm:text-sm lg:text-base text-gray-600 px-1 sm:px-2">
          Set up each AI Employee with their basic details
        </p>
      </div>

      {/* AI Employee Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-4 sm:mb-6">
        {Array.from({ length: agentCount }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveAgentTab(index)}
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm lg:text-base font-semibold transition-all touch-manipulation ${
              activeAgentTab === index
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800 active:bg-gray-200"
            }`}
          >
            <span className="hidden sm:inline">AI Employee {index + 1}</span>
            <span className="sm:hidden">AI {index + 1}</span>
          </button>
        ))}
      </div>

      {/* Comprehensive Template Selection Section */}
      {/* Template Selection - Simplified to direct selection */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
          Choose a Template for AI Employee {activeAgentTab + 1}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
          Select a pre-configured template that matches your business needs, or
          start from scratch.
        </p>

        {/* Template Grid */}
        <div className="relative">
          <div
            className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 px-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {agentTemplates.map((template) => {
              const isSelected =
                selectedTemplates[activeAgentTab] === template.id;

              return (
                <div
                  key={template.id}
                  className={`flex-shrink-0 w-64 sm:w-72 border rounded-lg p-3 sm:p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => {
                    // Core agent identity
                    setValue(
                      `agents.${activeAgentTab}.agentName`,
                      template.agentName
                    );
                    setValue(
                      `agents.${activeAgentTab}.selectedTemplate`,
                      template.id
                    );
                    setValue(
                      `agents.${activeAgentTab}.templateFeatures`,
                      template.features
                    );

                    // Agent type based on template (matching dropdown values)
                    const agentType = template.id.includes("sales")
                      ? "sales"
                      : template.id.includes("support")
                      ? "support"
                      : template.id.includes("appointment")
                      ? "appointment"
                      : "support";
                    setValue(`agents.${activeAgentTab}.agentType`, agentType);

                    // Personality and behavior
                    setValue(
                      `agents.${activeAgentTab}.agentPersonality`,
                      template.personality
                    );
                    setValue(
                      `agents.${activeAgentTab}.responseStyle`,
                      template.responseStyle
                    );
                    setValue(
                      `agents.${activeAgentTab}.agentBehavior`,
                      template.agentBehavior
                    );

                    // Communication settings
                    setValue(
                      `agents.${activeAgentTab}.escalationRules`,
                      template.escalationRules
                    );
                    setValue(
                      `agents.${activeAgentTab}.specialInstructions`,
                      template.specialInstructions
                    );

                    // Language and voice settings
                    setValue(
                      `agents.${activeAgentTab}.languages`,
                      template.languages
                    );
                    setValue(
                      `agents.${activeAgentTab}.preferredLanguage`,
                      template.languages[0] || "english"
                    );
                    setValue(
                      `agents.${activeAgentTab}.agentVoice`,
                      template.agentVoice
                    );
                    setValue(
                      `agents.${activeAgentTab}.agentGender`,
                      template.agentGender
                    );
                    setValue(
                      `agents.${activeAgentTab}.voiceGender`,
                      template.agentGender
                    );
                    setValue(
                      `agents.${activeAgentTab}.voiceStyle`,
                      template.voiceStyle
                    );

                    // Set primary use case based on template's main trigger case
                    if (template.triggerCases.length > 0) {
                      setValue(
                        `agents.${activeAgentTab}.primaryUseCase`,
                        template.triggerCases[0]
                      );
                      setValue(
                        `agents.${activeAgentTab}.useCases`,
                        template.triggerCases
                      );
                    }

                    // Set default success metrics based on template type
                    const defaultMetrics = template.id.includes("sales")
                      ? [
                          "Lead conversion rate",
                          "Meeting bookings",
                          "Follow-up completion",
                        ]
                      : template.id.includes("support")
                      ? [
                          "Issue resolution time",
                          "Customer satisfaction",
                          "First call resolution",
                        ]
                      : template.id.includes("appointment")
                      ? [
                          "Booking completion rate",
                          "No-show reduction",
                          "Calendar efficiency",
                        ]
                      : [
                          "Task completion rate",
                          "User engagement",
                          "Process efficiency",
                        ];

                    setValue(
                      `agents.${activeAgentTab}.successMetrics`,
                      defaultMetrics
                    );

                    // Set default call volume expectation
                    setValue(
                      `agents.${activeAgentTab}.expectedCallVolume`,
                      "medium"
                    );

                    // Template selection complete

                    setSelectedTemplates((prev) => ({
                      ...prev,
                      [activeAgentTab]: template.id,
                    }));
                    setShowTemplateFeatures((prev) => ({
                      ...prev,
                      [activeAgentTab]: true,
                    }));

                    // Automatically show advanced configuration when template is selected
                    setShowAdvanced(true);
                  }}
                >
                  <div className="flex justify-between items-start mb-2 sm:mb-3">
                    <div className="text-xl sm:text-2xl">{template.icon}</div>
                    {isSelected && (
                      <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        ✓ Selected
                      </div>
                    )}
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                    {template.name}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 leading-relaxed">
                    {template.description}
                  </p>

                  <div className="text-xs text-gray-500 border-t pt-2 space-y-1">
                    <p>
                      <strong>Style:</strong>{" "}
                      {
                        responseStyleOptions.find(
                          (s) => s.value === template.responseStyle
                        )?.label
                      }
                    </p>
                    <p>
                      <strong>Escalation:</strong>{" "}
                      {
                        escalationOptions.find(
                          (e) => e.value === template.escalationRules
                        )?.label
                      }
                    </p>
                  </div>
                </div>
              );
            })}
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
        {selectedTemplates[activeAgentTab] &&
          showTemplateFeatures[activeAgentTab] &&
          (() => {
            const selectedTemplate = agentTemplates.find(
              (t) => t.id === selectedTemplates[activeAgentTab]
            );
            if (!selectedTemplate) return null;

            return (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-3">
                  {selectedTemplate.name} - Detailed Features
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">
                      Core Capabilities
                    </h5>
                    <ul className="space-y-1">
                      {selectedTemplate.features.map((feature, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-700 flex items-center"
                        >
                          <span className="text-blue-500 mr-2">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">
                      Configuration
                    </h5>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>
                        <strong>Personality:</strong>{" "}
                        {
                          personalityOptions.find(
                            (p) => p.value === selectedTemplate.personality
                          )?.label
                        }
                      </p>
                      <p>
                        <strong>Response Style:</strong>{" "}
                        {
                          responseStyleOptions.find(
                            (s) => s.value === selectedTemplate.responseStyle
                          )?.label
                        }
                      </p>
                      <p>
                        <strong>Escalation:</strong>{" "}
                        {
                          escalationOptions.find(
                            (e) => e.value === selectedTemplate.escalationRules
                          )?.label
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <h5 className="font-medium text-gray-900 mb-2">
                    Special Instructions
                  </h5>
                  <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                    {selectedTemplate.specialInstructions}
                  </p>
                </div>

                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-green-500 mr-2">✓</span>
                    <h5 className="font-medium text-green-900">
                      Configuration Applied Successfully
                    </h5>
                  </div>
                  <p className="text-sm text-green-700">
                    Basic agent configuration has been automatically filled
                    based on this template. You can review and customize the
                    settings in the sections below.
                  </p>
                  <div className="mt-2 text-xs text-green-600">
                    <strong>Auto-configured:</strong> Agent name, voice
                    settings, personality, response style, escalation rules,
                    success metrics, and language preferences.
                  </div>
                </div>
              </div>
            );
          })()}
      </div>

      <div className="bg-gradient-to-r from-pink-50 to-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-600 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Basic Configuration
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              Essential settings for your AI Employee
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
          <div className="space-y-4 sm:space-y-6">
            {/* Basic AI Employee Fields */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  AI Employee Name *
                </label>
                <input
                  {...register(`agents.${activeAgentTab}.agentName`, {
                    required: "AI Employee name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                  })}
                  className={`w-full px-3 sm:px-3 py-3 sm:py-2.5 text-base sm:text-sm border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400 ${
                    errors?.agents?.[activeAgentTab]?.agentName
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter AI Employee name"
                />
                {errors?.agents?.[activeAgentTab]?.agentName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.agents[activeAgentTab].agentName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Employee Type *
                </label>
                <select
                  {...register(`agents.${activeAgentTab}.agentType`, {
                    required: "Please select an AI Employee type",
                  })}
                  className={`w-full px-3 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-all hover:border-gray-400 ${
                    errors?.agents?.[activeAgentTab]?.agentType
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                    paddingRight: "2.5rem",
                  }}
                >
                  <option value="" disabled>
                    Select AI Employee type
                  </option>
                  {agentTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors?.agents?.[activeAgentTab]?.agentType && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.agents[activeAgentTab].agentType.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Language *
                </label>
                <select
                  {...register(`agents.${activeAgentTab}.preferredLanguage`, {
                    required: "Please select a preferred language",
                  })}
                  className={`w-full px-3 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-all hover:border-gray-400 ${
                    errors?.agents?.[activeAgentTab]?.preferredLanguage
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                    paddingRight: "2.5rem",
                  }}
                >
                  <option value="" disabled>
                    Select preferred language
                  </option>
                  {languageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors?.agents?.[activeAgentTab]?.preferredLanguage && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.agents[activeAgentTab].preferredLanguage.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voice Gender *
                </label>
                <select
                  {...register(`agents.${activeAgentTab}.voiceGender`, {
                    required: "Please select a voice gender",
                  })}
                  className={`w-full px-3 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-all hover:border-gray-400 ${
                    errors?.agents?.[activeAgentTab]?.voiceGender
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                    paddingRight: "2.5rem",
                  }}
                >
                  <option value="" disabled>
                    Select voice gender
                  </option>
                  {voiceGenderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors?.agents?.[activeAgentTab]?.voiceGender && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.agents[activeAgentTab].voiceGender.message}
                  </p>
                )}
              </div>
            </div>

            {/* Advanced Configuration Toggle */}
            <div className="border-t pt-4 sm:pt-6">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm sm:text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors w-full justify-center sm:justify-start py-2 sm:py-0"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showAdvanced ? "rotate-180" : ""
                  }`}
                />
                Advanced Configuration
              </button>
            </div>
          </div>

          {/* Advanced Fields */}
          {showAdvanced && (
            <div className="space-y-6 border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Personality
                  </label>
                  <select
                    {...register(`agents.${activeAgentTab}.agentPersonality`)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select personality</option>
                    {personalityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voice Style
                  </label>
                  <select
                    {...register(`agents.${activeAgentTab}.voiceStyle`)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select voice style</option>
                    {voiceStyleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <textarea
                  {...register(`agents.${activeAgentTab}.specialInstructions`)}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Add any special instructions for this AI Employee..."
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Knowledge Sources Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Knowledge Sources
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              Help your AI Employee learn about your business
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
          <div className="space-y-4 sm:space-y-6">
            {/* Website URL */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
                Knowledge Base Website URL
              </label>
              <input
                {...register(`agents.${activeAgentTab}.knowledgeWebsiteUrl`)}
                type="url"
                className="w-full px-2 sm:px-3 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400"
                placeholder="https://example.com"
              />
            </div>

            {/* Social Links */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Social Media Links
              </label>
              <div className="space-y-2">
                {socialLinks.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Link className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-2 sm:mt-2.5" />
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => updateSocialLink(index, e.target.value)}
                      className="flex-1 px-2 sm:px-3 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://social-platform.com/yourpage"
                    />
                    {socialLinks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSocialLink(index)}
                        className="px-2 sm:px-3 py-2 sm:py-2.5 text-red-600 hover:text-red-700 border border-gray-300 rounded-lg hover:bg-red-50"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSocialLink}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Social Link
                </button>
              </div>
            </div>

            {/* File Uploads */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Files (PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX - Max 20MB
                each, 10 files max)
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  fileErrors[activeAgentTab]
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <Upload
                  className={`w-8 h-8 mx-auto mb-2 ${
                    fileErrors[activeAgentTab]
                      ? "text-red-400"
                      : "text-gray-400"
                  }`}
                />
                <p className="text-sm text-gray-600 mb-2">
                  {uploadedFiles[activeAgentTab]?.length
                    ? `${uploadedFiles[activeAgentTab].length} file(s) selected`
                    : "Upload knowledge base files"}
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                  className="hidden"
                  id={`file-upload-${activeAgentTab}`}
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor={`file-upload-${activeAgentTab}`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Choose Files
                </label>
                {uploadedFiles[activeAgentTab]?.length > 0 && (
                  <div className="mt-3 text-left">
                    <p className="text-xs text-gray-500 mb-1">
                      Selected files:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {uploadedFiles[activeAgentTab].map((file, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <span className="truncate">{file.name}</span>
                          <span className="text-gray-400 ml-2">
                            ({(file.size / 1024 / 1024).toFixed(1)}MB)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {fileErrors[activeAgentTab] && (
                <p className="mt-1 text-sm text-red-600">
                  {fileErrors[activeAgentTab]}
                </p>
              )}
            </div>

            {/* FAQs Text */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                FAQs Text
              </label>
              <textarea
                {...register(`agents.${activeAgentTab}.faqsText`)}
                rows={3}
                className="w-full px-2 sm:px-3 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter frequently asked questions and answers..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Instructions Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Instructions & Rules
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              Set guidelines for your AI Employee's behavior
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
          <div className="space-y-4 sm:space-y-6">
            {/* Do's and Don'ts */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Do's and Don'ts
              </label>
              <textarea
                {...register(`agents.${activeAgentTab}.dosAndDonts`)}
                rows={3}
                className="w-full px-2 sm:px-3 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="List what the AI Employee should and shouldn't do..."
              />
            </div>

            {/* Fallback Contacts */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Fallback Contacts
              </label>
              <div className="space-y-2">
                {fallbackContacts.map((contact, index) => (
                  <div key={index} className="flex gap-2">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-2 sm:mt-2.5" />
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) =>
                        updateFallbackContact(index, e.target.value)
                      }
                      className="flex-1 px-2 sm:px-3 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Name, email, or phone number"
                    />
                    {fallbackContacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFallbackContact(index)}
                        className="px-2 sm:px-3 py-2 sm:py-2.5 text-red-600 hover:text-red-700 border border-gray-300 rounded-lg hover:bg-red-50"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFallbackContact}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Fallback Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Targets Section */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-600 rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Success Targets
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              Define what success looks like for your AI Employee
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
          <div className="space-y-4 sm:space-y-6">
            {/* Target Description */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                What Success Looks Like
              </label>
              <textarea
                {...register(`agents.${activeAgentTab}.targetDescription`)}
                rows={2}
                className="w-full px-2 sm:px-3 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="e.g., lead qualification, booking appointments, FAQ deflection..."
              />
            </div>

            {/* Success Metrics */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Success Metrics
              </label>
              <div className="space-y-2">
                {successMetrics.map((metric, index) => (
                  <div key={index} className="flex gap-2">
                    <Target className="w-5 h-5 text-gray-400 mt-2.5" />
                    <input
                      type="text"
                      value={metric}
                      onChange={(e) =>
                        updateSuccessMetric(index, e.target.value)
                      }
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 80% FAQ resolution rate, 30% call reduction"
                    />
                    {successMetrics.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSuccessMetric(index)}
                        className="px-3 py-2.5 text-red-600 hover:text-red-700 border border-gray-300 rounded-lg hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSuccessMetric}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Success Metric
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deployment Options Section */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Deployment Options
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              Choose where and how to deploy your AI Employee
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
          <div className="space-y-4 sm:space-y-6">
            {/* Deployment Targets */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-3">
                Deployment Targets
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                {[
                  { value: "website", label: "Website", icon: Globe },
                  {
                    value: "mobile-app",
                    label: "Mobile App",
                    icon: Smartphone,
                  },
                  {
                    value: "social-webview",
                    label: "Social Web-view",
                    icon: Monitor,
                  },
                ].map((target) => {
                  const Icon = target.icon;
                  const isSelected = selectedDeploymentTargets.includes(
                    target.value
                  );
                  return (
                    <div
                      key={target.value}
                      onClick={() => toggleDeploymentTarget(target.value)}
                      className={`p-2 sm:p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div
                          className={`w-3 h-3 sm:w-4 sm:h-4 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? "bg-blue-500 border-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-sm"></div>
                          )}
                        </div>
                        <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          {target.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deployment Service */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Deployment Service
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    value: "client",
                    label: "Client will handle deployment",
                    desc: "You will implement at your end",
                  },
                  {
                    value: "shivai",
                    label: "Shivai will handle deployment",
                    desc: "We will handle implementation with access",
                  },
                ].map((service) => (
                  <label
                    key={service.value}
                    className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      {...register(
                        `agents.${activeAgentTab}.deploymentService`
                      )}
                      value={service.value}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3 mt-0.5"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {service.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {service.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Deployment Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deployment Notes
              </label>
              <textarea
                {...register(`agents.${activeAgentTab}.deploymentNotes`)}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Any specific deployment requirements or notes..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Consent & Privacy Options Section */}
      <div className="bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200 rounded-xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-600 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Consent & Privacy
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              Configure privacy and consent settings
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
          <div className="space-y-4 sm:space-y-6">
            {(() => {
              const currentPlan = watch("plan");
              const isBasicPlan = currentPlan === "base";

              return (
                <>
                  {/* Recording Options */}
                  <div className={`${isBasicPlan ? "opacity-60" : ""}`}>
                    <label
                      className={`flex items-start p-2 sm:p-3 rounded-lg transition-colors ${
                        isBasicPlan
                          ? "cursor-not-allowed"
                          : "cursor-pointer hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        {...register(
                          `agents.${activeAgentTab}.recordingEnabled`
                        )}
                        disabled={isBasicPlan}
                        className={`h-5 w-5 sm:h-4 sm:w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 flex-shrink-0 ${
                          isBasicPlan ? "cursor-not-allowed" : ""
                        }`}
                      />
                      <div className="ml-3 sm:ml-2">
                        <span className="text-sm sm:text-sm font-medium text-gray-700 block">
                          Enable call recording
                          {isBasicPlan && (
                            <span className="ml-2 text-xs text-orange-600 font-normal">
                              (Advanced Plan Required)
                            </span>
                          )}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Record conversations for quality and training purposes
                        </p>
                        {isBasicPlan && (
                          <p className="text-xs text-orange-600 mt-1 font-medium">
                            You need Advanced plan or Custom to enable this
                            feature
                          </p>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Transcript Email Opt-in */}
                  <div className={`${isBasicPlan ? "opacity-60" : ""}`}>
                    <label
                      className={`flex items-start p-2 sm:p-3 rounded-lg transition-colors ${
                        isBasicPlan
                          ? "cursor-not-allowed"
                          : "cursor-pointer hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        {...register(
                          `agents.${activeAgentTab}.transcriptEmailOptIn`
                        )}
                        disabled={isBasicPlan}
                        className={`h-5 w-5 sm:h-4 sm:w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 flex-shrink-0 ${
                          isBasicPlan ? "cursor-not-allowed" : ""
                        }`}
                      />
                      <div className="ml-3 sm:ml-2">
                        <span className="text-sm sm:text-sm font-medium text-gray-700 block">
                          Enable transcript email opt-in
                          {isBasicPlan && (
                            <span className="ml-2 text-xs text-orange-600 font-normal">
                              (Advanced Plan Required)
                            </span>
                          )}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Allow users to opt-in to receive conversation
                          transcripts via email
                        </p>
                        {isBasicPlan && (
                          <p className="text-xs text-orange-600 mt-1 font-medium">
                            You need Advanced plan or Custom to enable this
                            feature
                          </p>
                        )}
                      </div>
                    </label>
                  </div>
                </>
              );
            })()}

            {/* Consent Notes */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Privacy & Consent Notes
              </label>
              <textarea
                {...register(`agents.${activeAgentTab}.consentNotes`)}
                rows={3}
                className="w-full px-3 sm:px-3 py-3 sm:py-2.5 text-base sm:text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Additional privacy policies, consent requirements, or compliance notes..."
              />
            </div>

            {/* Plan Upgrade Notice for Basic Plan */}
            {(() => {
              const currentPlan = watch("plan");
              if (currentPlan === "base") {
                return (
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <Crown className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-orange-900 mb-1">
                          Unlock Advanced Privacy Features
                        </h4>
                        <p className="text-xs text-orange-700 mb-2">
                          Upgrade to Advanced or Custom plan to access call
                          recording and transcript email opt-in features.
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            ✓ Call Recording
                          </span>
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            ✓ Email Transcripts
                          </span>
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            ✓ Advanced Compliance
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>

      {/* AI Employee Basic Configuration */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
        {/* AI Employee Summary */}
        {(() => {
          const allAgents = watch("agents") || [];
          const hasAnyConfiguration = allAgents.some(
            (agent) => agent.agentName && agent.agentType
          );

          if (hasAnyConfiguration) {
            return (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-blue-900 mb-3">
                  AI Employees Summary
                </h4>
                <div className="space-y-3">
                  {allAgents.map((agent, index) => {
                    if (!agent.agentName) return null;
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-3 rounded border"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {agent.agentName}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>
                                Type: {agent.agentType || "Not set"} | Language:{" "}
                                {agent.preferredLanguage || "Not set"} | Voice:{" "}
                                {agent.voiceGender || "Not set"}
                              </div>
                              {agent.agentPersonality && (
                                <div>Personality: {agent.agentPersonality}</div>
                              )}
                              {agent.expectedCallVolume && (
                                <div>
                                  Expected Volume: {agent.expectedCallVolume}
                                </div>
                              )}
                              {agent.specialInstructions && (
                                <div className="text-xs">
                                  Instructions:{" "}
                                  {agent.specialInstructions.substring(0, 50)}
                                  ...
                                </div>
                              )}
                              {selectedTemplates[index] && (
                                <div className="text-xs text-blue-600">
                                  Template:{" "}
                                  {
                                    agentTemplates.find(
                                      (t) => t.id === selectedTemplates[index]
                                    )?.name
                                  }
                                </div>
                              )}
                              {agent.useCases && agent.useCases.length > 0 && (
                                <div className="text-xs text-green-600">
                                  Use Cases: {agent.useCases.length} selected
                                </div>
                              )}

                              {agent.knowledgeWebsiteUrl && (
                                <div className="text-xs text-green-600">
                                  Knowledge URL configured
                                </div>
                              )}
                              {agent.deploymentService && (
                                <div className="text-xs text-orange-600">
                                  Deployment:{" "}
                                  {agent.deploymentService === "client"
                                    ? "Client"
                                    : "Shivai"}
                                </div>
                              )}
                              {(agent.recordingEnabled ||
                                agent.transcriptEmailOptIn) && (
                                <div className="text-xs text-gray-600">
                                  {agent.recordingEnabled && "Recording ON"}
                                  {agent.recordingEnabled &&
                                    agent.transcriptEmailOptIn &&
                                    " | "}
                                  {agent.transcriptEmailOptIn &&
                                    "Transcript Opt-in"}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
          return null;
        })()}
      </div>
    </motion.div>
  );
};

export default Step3;
