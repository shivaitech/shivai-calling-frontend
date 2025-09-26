import React, { useState } from "react";
import { UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { motion } from "framer-motion";
import { Bot, ChevronDown, X, Plus, Upload } from "lucide-react";

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
}

// Form data interface
export interface OnboardingFormData {
  companyName: string;
  industry: string[];
  businessProcesses: string;
  website: string;
  primaryRegion: string;
  plan: "base" | "advanced" | "";
  agentCount: number;
  agents: AgentConfig[];
}

interface Step3Props {
  register: UseFormRegister<OnboardingFormData>;
  watch: UseFormWatch<OnboardingFormData>;
  setValue: UseFormSetValue<OnboardingFormData>;
  agentCount: number;
  stepVariants: any;
  activeAgentTab: number;
  setActiveAgentTab: (tab: number) => void;
  selectedTemplates: Record<number, string>;
  setSelectedTemplates: (templates: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void;
  showTemplateFeatures: Record<number, boolean>;
  setShowTemplateFeatures: (features: Record<number, boolean> | ((prev: Record<number, boolean>) => Record<number, boolean>)) => void;
  showUseCaseDropdown: Record<number, boolean>;
  setShowUseCaseDropdown: (dropdown: Record<number, boolean> | ((prev: Record<number, boolean>) => Record<number, boolean>)) => void;
}

const agentTypeOptions = [
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
  { value: "appointment", label: "Appointment" },
];

const languageOptions = [
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
  { value: "minimal", label: "Minimal escalation (AI Employee handles majority)" },
  { value: "no-escalation", label: "No escalation (AI Employee only)" },
  { value: "custom", label: "Custom escalation rules" },
];

const callVolumeOptions = [
  { value: "1-100", label: "1-100 calls/month" },
  { value: "101-500", label: "101-500 calls/month" },
  { value: "501-1000", label: "501-1000 calls/month" },
  { value: "1001-5000", label: "1001-5000 calls/month" },
  { value: "5000+", label: "5000+ calls/month" },
];

const voiceStyleOptions = [
  { value: "natural", label: "Natural & Clear" },
  { value: "energetic", label: "Energetic & Enthusiastic" },
  { value: "calm", label: "Calm & Soothing" },
  { value: "confident", label: "Confident & Assertive" },
];

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
    voiceStyle: "energetic",
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
    voiceStyle: "calm",
    specialInstructions: "Always try to resolve issues before escalating to human staff.",
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
    voiceStyle: "natural",
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
    voiceStyle: "natural",
    specialInstructions: "Be encouraging and make surveys feel like conversations.",
    features: [
      "Dynamic survey generation",
      "Sentiment analysis",
      "Response tracking",
      "Report generation",
    ],
  },
];

const Step3: React.FC<Step3Props> = ({ 
  register, 
  watch, 
  setValue, 
  agentCount, 
  stepVariants,
  activeAgentTab,
  setActiveAgentTab,
  selectedTemplates,
  setSelectedTemplates,
  showTemplateFeatures,
  setShowTemplateFeatures,
  showUseCaseDropdown,
  setShowUseCaseDropdown
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [websites, setWebsites] = useState<string[]>([""]);

  // Add missing state that the template UI needs
  const [callVolumeSearch, setCallVolumeSearch] = useState<Record<number, string>>({});
  const [personalitySearch, setPersonalitySearch] = useState<Record<number, string>>({});
  const [responseStyleSearch, setResponseStyleSearch] = useState<Record<number, string>>({});
  const [escalationSearch, setEscalationSearch] = useState<Record<number, string>>({});
  const [voiceSearch, setVoiceSearch] = useState<Record<number, string>>({});
  const [genderSearch, setGenderSearch] = useState<Record<number, string>>({});
  const [behaviorSearch, setBehaviorSearch] = useState<Record<number, string>>({});
  const [voiceStyleSearch, setVoiceStyleSearch] = useState<Record<number, string>>({});
  const [languageSearch, setLanguageSearch] = useState<Record<number, string>>({});

  const addWebsite = () => {
    setWebsites([...websites, ""]);
  };

  const removeWebsite = (index: number) => {
    setWebsites(websites.filter((_, i) => i !== index));
  };

  const updateWebsite = (index: number, value: string) => {
    const newWebsites = [...websites];
    newWebsites[index] = value;
    setWebsites(newWebsites);
  };

  return (
    <motion.div
      key="step3"
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
          Configure Your AI Employees
        </h2>
        <p className="text-sm sm:text-base text-gray-600 px-2">
          Set up each AI Employee with their basic details
        </p>
      </div>

      {/* AI Employee Tabs */}
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
            AI Employee {index + 1}
          </button>
        ))}
      </div>

      {/* Comprehensive Template Selection Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Select Use Cases for AI Employee {activeAgentTab + 1}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Choose what this AI Employee will help with. Select multiple
            use cases for a versatile AI Employee.
          </p>

          <div className="relative" data-dropdown-trigger>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowUseCaseDropdown((prev) => ({
                  ...prev,
                  [activeAgentTab]: !prev[activeAgentTab],
                }));
              }}
              className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg bg-white flex items-center justify-between focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <div className="flex flex-wrap gap-1">
                {(() => {
                  const selectedUseCases =
                    watch(`agents.${activeAgentTab}.useCases`) || [];
                  if (selectedUseCases.length === 0) {
                    return (
                      <span className="text-gray-500">
                        Select use cases...
                      </span>
                    );
                  }
                  if (selectedUseCases.length <= 2) {
                    return selectedUseCases.map((value) => {
                      const option = useCaseOptions.find(
                        (opt) => opt.value === value
                      );
                      return (
                        <span
                          key={value}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                        >
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
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  showUseCaseDropdown[activeAgentTab]
                    ? "rotate-180"
                    : ""
                }`}
              />
            </button>

            {showUseCaseDropdown[activeAgentTab] && (
              <div
                className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
                data-dropdown
              >
                {useCaseOptions.map((option) => {
                  const isSelected =
                    watch(
                      `agents.${activeAgentTab}.useCases`
                    )?.includes(option.value) || false;
                  return (
                    <label
                      key={option.value}
                      className="flex items-start px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const currentUseCases =
                            watch(
                              `agents.${activeAgentTab}.useCases`
                            ) || [];
                          if (e.target.checked) {
                            setValue(
                              `agents.${activeAgentTab}.useCases`,
                              [...currentUseCases, option.value]
                            );
                          } else {
                            setValue(
                              `agents.${activeAgentTab}.useCases`,
                              currentUseCases.filter(
                                (uc) => uc !== option.value
                              )
                            );
                          }
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Primary Use Case Display */}
        {(() => {
          const selectedUseCases =
            watch(`agents.${activeAgentTab}.useCases`) || [];
          const primaryUseCase = watch(
            `agents.${activeAgentTab}.primaryUseCase`
          );

          if (selectedUseCases.length > 0) {
            return (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Primary Use Case
                </h4>
                <p className="text-xs text-gray-600 mb-2">
                  This AI Employee's main focus:
                </p>
                {selectedUseCases.length === 1 ? (
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {
                        useCaseOptions.find(
                          (opt) => opt.value === selectedUseCases[0]
                        )?.label
                      }
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={primaryUseCase || selectedUseCases[0]}
                      onChange={(e) =>
                        setValue(
                          `agents.${activeAgentTab}.primaryUseCase`,
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {selectedUseCases.map((useCase) => {
                        const option = useCaseOptions.find(
                          (opt) => opt.value === useCase
                        );
                        return (
                          <option key={useCase} value={useCase}>
                            {option?.label || useCase}
                          </option>
                        );
                      })}
                    </select>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Secondary:{" "}
                        {selectedUseCases
                          .filter(
                            (uc) =>
                              uc !==
                              (primaryUseCase || selectedUseCases[0])
                          )
                          .map(
                            (uc) =>
                              useCaseOptions.find(
                                (opt) => opt.value === uc
                              )?.label || uc
                          )
                          .join(", ")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Template Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Choose a Template (Optional)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Start with a pre-configured template based on your selected
          use cases, or configure manually.
        </p>

        {(() => {
          const selectedUseCases =
            watch(`agents.${activeAgentTab}.useCases`) || [];
          if (selectedUseCases.length === 0) {
            return (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800 text-sm">
                  💡 Select use cases above to see recommended templates
                  for your AI Employee.
                </p>
              </div>
            );
          }
          return null;
        })()}

        {/* Template Slider */}
        <div className="relative">
          <div
            className="flex overflow-x-auto gap-4 pb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {(() => {
              const agentUseCases =
                watch(`agents.${activeAgentTab}.useCases`) || [];

              // Sort templates to show recommended ones first
              const sortedTemplates = [...agentTemplates].sort(
                (a, b) => {
                  // If 3+ use cases selected, show custom template first
                  if (agentUseCases.length >= 3) {
                    if (a.id === "custom-multi-purpose") return -1;
                    if (b.id === "custom-multi-purpose") return 1;
                  }

                  const aMatches = a.triggerCases.filter((trigger) =>
                    agentUseCases.includes(trigger)
                  ).length;
                  const bMatches = b.triggerCases.filter((trigger) =>
                    agentUseCases.includes(trigger)
                  ).length;
                  return bMatches - aMatches; // Sort by match count descending
                }
              );

              return sortedTemplates.map((template) => {
                const matchCount = template.triggerCases.filter(
                  (trigger) => agentUseCases.includes(trigger)
                ).length;
                const isRecommended =
                  matchCount > 0 ||
                  (template.id === "custom-multi-purpose" &&
                    agentUseCases.length >= 3);
                const isSelected =
                  selectedTemplates[activeAgentTab] === template.id;

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
                      setValue(
                        `agents.${activeAgentTab}.agentName`,
                        template.agentName
                      );
                      setValue(
                        `agents.${activeAgentTab}.agentPersonality`,
                        template.personality
                      );
                      setValue(
                        `agents.${activeAgentTab}.responseStyle`,
                        template.responseStyle
                      );
                      setValue(
                        `agents.${activeAgentTab}.escalationRules`,
                        template.escalationRules
                      );
                      setValue(
                        `agents.${activeAgentTab}.specialInstructions`,
                        template.specialInstructions
                      );
                      setValue(
                        `agents.${activeAgentTab}.languages`,
                        template.languages
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
                        `agents.${activeAgentTab}.agentBehavior`,
                        template.agentBehavior
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
                      }

                      // Clear search states so template values show up
                      setCallVolumeSearch((prev) => ({
                        ...prev,
                        [activeAgentTab]: "",
                      }));
                      setPersonalitySearch((prev) => ({
                        ...prev,
                        [activeAgentTab]: "",
                      }));
                      setResponseStyleSearch((prev) => ({
                        ...prev,
                        [activeAgentTab]: "",
                      }));
                      setEscalationSearch((prev) => ({
                        ...prev,
                        [activeAgentTab]: "",
                      }));
                      setVoiceSearch((prev) => ({
                        ...prev,
                        [activeAgentTab]: "",
                      }));
                      setGenderSearch((prev) => ({
                        ...prev,
                        [activeAgentTab]: "",
                      }));
                      setBehaviorSearch((prev) => ({
                        ...prev,
                        [activeAgentTab]: "",
                      }));
                      setVoiceStyleSearch((prev) => ({
                        ...prev,
                        [activeAgentTab]: "",
                      }));
                      setLanguageSearch((prev) => ({
                        ...prev,
                        [activeAgentTab]: "",
                      }));

                      setSelectedTemplates((prev) => ({
                        ...prev,
                        [activeAgentTab]: template.id,
                      }));
                      setShowTemplateFeatures((prev) => ({
                        ...prev,
                        [activeAgentTab]: true,
                      }));
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      {isRecommended && (
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${
                            template.id === "custom-multi-purpose" &&
                            agentUseCases.length >= 3
                              ? "bg-purple-100 text-purple-800"
                              : matchCount > 0
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {template.id === "custom-multi-purpose" &&
                          agentUseCases.length >= 3
                            ? `🎯 Best for ${agentUseCases.length} Use Cases`
                            : matchCount > 0
                            ? `⭐ Matches ${matchCount} Use Case${
                                matchCount > 1 ? "s" : ""
                              }`
                            : "💡 Alternative Option"}
                        </div>
                      )}
                      {isSelected && (
                        <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          ✓ Selected
                        </div>
                      )}
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-2">
                      {template.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
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
              });
            })()}
          </div>

          {/* Scroll indicators */}
          <div className="flex justify-center mt-2 space-x-1">
            {agentTemplates.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  selectedTemplates[activeAgentTab] ===
                  agentTemplates[index].id
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
                      {selectedTemplate.features.map(
                        (feature, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-700 flex items-center"
                          >
                            <span className="text-blue-500 mr-2">
                              •
                            </span>
                            {feature}
                          </li>
                        )
                      )}
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
                            (p) =>
                              p.value === selectedTemplate.personality
                          )?.label
                        }
                      </p>
                      <p>
                        <strong>Response Style:</strong>{" "}
                        {
                          responseStyleOptions.find(
                            (s) =>
                              s.value === selectedTemplate.responseStyle
                          )?.label
                        }
                      </p>
                      <p>
                        <strong>Escalation:</strong>{" "}
                        {
                          escalationOptions.find(
                            (e) =>
                              e.value ===
                              selectedTemplate.escalationRules
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
              </div>
            );
          })()}
      </div>

      {/* Simple AI Employee Configuration Form */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Employee Name *
            </label>
            <input
              {...register(`agents.${activeAgentTab}.agentName`)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter AI Employee name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Employee Type *
            </label>
            <select
              {...register(`agents.${activeAgentTab}.agentType`)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select type</option>
              {agentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Language *
            </label>
            <select
              {...register(`agents.${activeAgentTab}.preferredLanguage`)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select language</option>
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voice Gender *
            </label>
            <select
              {...register(`agents.${activeAgentTab}.voiceGender`)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select voice gender</option>
              {voiceGenderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Configuration Toggle */}
        <div className="border-t pt-6">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            Advanced Configuration
          </button>
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
                  Response Style
                </label>
                <select
                  {...register(`agents.${activeAgentTab}.responseStyle`)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select style</option>
                  {responseStyleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Call Volume
                </label>
                <select
                  {...register(`agents.${activeAgentTab}.expectedCallVolume`)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select volume</option>
                  {callVolumeOptions.map((option) => (
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escalation Rules
              </label>
              <textarea
                {...register(`agents.${activeAgentTab}.escalationRules`)}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Define when and how to escalate calls..."
              />
            </div>

            {/* Knowledge Base Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Knowledge Base Files
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">Upload training documents, FAQs, or knowledge base files</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.csv"
                  className="hidden"
                  id={`knowledge-base-${activeAgentTab}`}
                />
                <label
                  htmlFor={`knowledge-base-${activeAgentTab}`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Choose Files
                </label>
              </div>
            </div>

            {/* Referral Websites */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referral Websites
              </label>
              <div className="space-y-2">
                {websites.map((website, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => updateWebsite(index, e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com"
                    />
                    {websites.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWebsite(index)}
                        className="px-3 py-2.5 text-red-600 hover:text-red-700 border border-gray-300 rounded-lg hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addWebsite}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Website
                </button>
              </div>
            </div>
          </div>
        )}

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
                                Type: {agent.agentType || "Not set"} | 
                                Language: {agent.preferredLanguage || "Not set"} | 
                                Voice: {agent.voiceGender || "Not set"}
                              </div>
                              {agent.agentPersonality && (
                                <div>Personality: {agent.agentPersonality}</div>
                              )}
                              {agent.expectedCallVolume && (
                                <div>Expected Volume: {agent.expectedCallVolume}</div>
                              )}
                              {agent.specialInstructions && (
                                <div className="text-xs">Instructions: {agent.specialInstructions.substring(0, 50)}...</div>
                              )}
                              {selectedTemplates[index] && (
                                <div className="text-xs text-blue-600">Template: {agentTemplates.find(t => t.id === selectedTemplates[index])?.name}</div>
                              )}
                              {agent.useCases && agent.useCases.length > 0 && (
                                <div className="text-xs text-green-600">Use Cases: {agent.useCases.length} selected</div>
                              )}
                              {agent.primaryUseCase && (
                                <div className="text-xs text-purple-600">Primary: {useCaseOptions.find(uc => uc.value === agent.primaryUseCase)?.label}</div>
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