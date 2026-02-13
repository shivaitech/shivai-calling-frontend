import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, X, Bot, Globe, Settings, Sparkles, Info } from 'lucide-react';
import { useAgent } from '../../contexts/AgentContext';
import { agentAPI } from '../../services/agentAPI';
import GlassCard from '../../components/GlassCard';
import SearchableSelect from '../../components/SearchableSelect';

const EditAgent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentAgent, setCurrentAgent } = useAgent();

  const [formData, setFormData] = useState({
    name: "",
    gender: "female",
    businessProcess: "",
    industry: "",
    subIndustry: "",
    persona: "Empathetic",
    language: "en-US",
    voice: "alloy",
    customInstructions: "",
    guardrailsLevel: "Medium",
    responseStyle: "Balanced",
    maxResponseLength: "Medium (150 words)",
    contextWindow: "Standard (8K tokens)",
    temperature: 0.7,
  });

  const [templateData, setTemplateData] = useState<any>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  const [isLoadingAgent, setIsLoadingAgent] = useState(true);

  // Helper functions to map API values to form values
  const mapBusinessProcess = (apiValue: string | undefined) => {
    if (!apiValue) return '';
    const mapping: Record<string, string> = {
      'sales_marketing': 'sales-marketing',
      'customer_support': 'customer-support',
      'appointment_setting': 'appointment-setting',
      'lead_qualification': 'lead-qualification',
      'product_explanation': 'product-explanation',
      'order_processing': 'order-processing',
      'technical_support': 'technical-support',
      'billing_inquiries': 'billing-inquiries',
      'feedback_collection': 'feedback-collection',
      'onboarding': 'onboarding',
    };
    return mapping[apiValue] || apiValue.replace(/_/g, '-') || '';
  };

  const mapPersonality = (apiValue: string | undefined) => {
    if (!apiValue) return 'Empathetic';
    const mapping: Record<string, string> = {
      'friendly': 'Friendly',
      'formal': 'Formal',
      'empathetic': 'Empathetic',
      'persuasive': 'Persuasive (Sales)',
      'persuasive_sales': 'Persuasive (Sales)',
      'reassuring': 'Reassuring (Support)',
      'reassuring_support': 'Reassuring (Support)',
    };
    return mapping[apiValue.toLowerCase()] || apiValue || 'Empathetic';
  };

  const mapResponseStyle = (apiValue: string | undefined) => {
    if (!apiValue) return 'Balanced';
    const mapping: Record<string, string> = {
      'concise': 'Concise',
      'balanced': 'Balanced',
      'detailed': 'Detailed',
    };
    return mapping[apiValue.toLowerCase()] || apiValue || 'Balanced';
  };

  const mapMaxResponseLength = (apiValue: string | undefined) => {
    if (!apiValue) return 'Medium (150 words)';
    const mapping: Record<string, string> = {
      'short': 'Short (50 words)',
      'medium': 'Medium (150 words)',
      'long': 'Long (300 words)',
    };
    return mapping[apiValue.toLowerCase()] || apiValue || 'Medium (150 words)';
  };

  const mapContextWindow = (apiValue: string | undefined) => {
    if (!apiValue) return 'Standard (8K tokens)';
    const mapping: Record<string, string> = {
      'small': 'Small (4K tokens)',
      'small_4k_tokens': 'Small (4K tokens)',
      'standard': 'Standard (8K tokens)',
      'standard_8k_tokens': 'Standard (8K tokens)',
      'large': 'Large (16K tokens)',
      'large_16k_tokens': 'Large (16K tokens)',
    };
    return mapping[apiValue.toLowerCase()] || apiValue || 'Standard (8K tokens)';
  };

  const mapGuardrailsLevel = (apiValue: string | undefined) => {
    if (!apiValue) return 'Medium';
    const mapping: Record<string, string> = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
    };
    return mapping[apiValue.toLowerCase()] || apiValue || 'Medium';
  };

  const mapIndustry = (apiValue: string | undefined) => {
    if (!apiValue) return '';
    // Industry values should match, but handle underscore to hyphen conversion
    return apiValue.replace(/_/g, '-') || '';
  };

  const mapSubIndustry = (apiValue: string | undefined) => {
    if (!apiValue) return '';
    return apiValue.replace(/_/g, '-') || '';
  };

  useEffect(() => {
    const fetchAgentData = async () => {
      if (!id) return;
      
      setIsLoadingAgent(true);
      try {
        // Fetch agent data directly from API
        const { agent: agentData } = await agentAPI.getAgent(id);
        
        console.log("agentData", agentData);
        
        // Set current agent in context
        const agentForContext = {
          id: agentData.id,
          name: agentData.name,
          status: agentData.status,
          persona: agentData.personality || "Empathetic",
          language: agentData.language || "en-US",
          voice: agentData.voice || "alloy",
          createdAt: new Date(agentData.createdAt),
          stats: agentData.stats || {
            conversations: 0,
            successRate: 0,
            avgResponseTime: 0,
            activeUsers: 0,
          },
        };
        setCurrentAgent(agentForContext);
        
        // Prefill form with all API data (mapping API values to form values)
        setFormData({
          name: agentData.name || "",
          gender: agentData.gender || "female",
          businessProcess: mapBusinessProcess(agentData.business_process),
          industry: mapIndustry(agentData.industry),
          subIndustry: mapSubIndustry(agentData.sub_industry),
          persona: mapPersonality(agentData.personality),
          language: agentData.language || "en-US",
          voice: agentData.voice || "alloy",
          customInstructions: agentData.custom_instructions || "",
          guardrailsLevel: mapGuardrailsLevel(agentData.guardrails_level),
          responseStyle: mapResponseStyle(agentData.response_style),
          maxResponseLength: mapMaxResponseLength(agentData.max_response_length),
          contextWindow: mapContextWindow(agentData.context_window),
          temperature: agentData.temperature !== undefined ? agentData.temperature : 0.7,
        });

        // Load template data if available
        if (agentData.template) {
          setTemplateData(agentData.template);
          setShowTemplateEditor(true);
        }
      } catch (error) {
        console.error("Error fetching agent:", error);
        toast.error("Failed to load agent data");
        navigate('/agents');
      } finally {
        setIsLoadingAgent(false);
      }
    };

    fetchAgentData();
  }, [id, setCurrentAgent, navigate]);

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

  const subIndustries: Record<string, { value: string; label: string }[]> = {
    "real-estate": [
      { value: "residential", label: "Residential" },
      { value: "commercial", label: "Commercial" },
      { value: "property-management", label: "Property Management" },
      { value: "real-estate-investment", label: "Real Estate Investment" },
    ],
    "healthcare": [
      { value: "hospitals", label: "Hospitals" },
      { value: "clinics", label: "Clinics" },
      { value: "mental-health", label: "Mental Health" },
      { value: "home-healthcare", label: "Home Healthcare" },
      { value: "medical-devices", label: "Medical Devices" },
      { value: "pharmaceuticals", label: "Pharmaceuticals" },
    ],
    "dental": [
      { value: "general-dentistry", label: "General Dentistry" },
      { value: "orthodontics", label: "Orthodontics" },
      { value: "cosmetic-dentistry", label: "Cosmetic Dentistry" },
      { value: "pediatric-dentistry", label: "Pediatric Dentistry" },
    ],
    "fitness": [
      { value: "gyms", label: "Gyms & Fitness Centers" },
      { value: "yoga-studios", label: "Yoga Studios" },
      { value: "personal-training", label: "Personal Training" },
      { value: "wellness-spas", label: "Wellness Spas" },
    ],
    "education": [
      { value: "k12", label: "K-12 Schools" },
      { value: "higher-education", label: "Higher Education" },
      { value: "online-learning", label: "Online Learning" },
      { value: "tutoring", label: "Tutoring Services" },
      { value: "vocational", label: "Vocational Training" },
    ],
    "finance": [
      { value: "banking", label: "Banking" },
      { value: "investment", label: "Investment Services" },
      { value: "wealth-management", label: "Wealth Management" },
      { value: "lending", label: "Lending & Mortgages" },
      { value: "fintech", label: "Fintech" },
    ],
    "insurance": [
      { value: "health-insurance", label: "Health Insurance" },
      { value: "life-insurance", label: "Life Insurance" },
      { value: "auto-insurance", label: "Auto Insurance" },
      { value: "property-insurance", label: "Property Insurance" },
      { value: "business-insurance", label: "Business Insurance" },
    ],
    "ecommerce": [
      { value: "fashion", label: "Fashion & Apparel" },
      { value: "electronics", label: "Electronics" },
      { value: "food-beverage", label: "Food & Beverage" },
      { value: "home-garden", label: "Home & Garden" },
      { value: "marketplace", label: "Marketplace" },
    ],
    "retail": [
      { value: "grocery", label: "Grocery" },
      { value: "fashion-retail", label: "Fashion Retail" },
      { value: "electronics-retail", label: "Electronics Retail" },
      { value: "pharmacy", label: "Pharmacy" },
      { value: "department-stores", label: "Department Stores" },
    ],
    "technology": [
      { value: "software-development", label: "Software Development" },
      { value: "it-services", label: "IT Services" },
      { value: "cybersecurity", label: "Cybersecurity" },
      { value: "cloud-services", label: "Cloud Services" },
      { value: "ai-ml", label: "AI & Machine Learning" },
    ],
    "saas": [
      { value: "crm", label: "CRM" },
      { value: "erp", label: "ERP" },
      { value: "marketing-automation", label: "Marketing Automation" },
      { value: "project-management", label: "Project Management" },
      { value: "hr-software", label: "HR Software" },
    ],
    "legal": [
      { value: "corporate-law", label: "Corporate Law" },
      { value: "family-law", label: "Family Law" },
      { value: "criminal-law", label: "Criminal Law" },
      { value: "immigration-law", label: "Immigration Law" },
      { value: "intellectual-property", label: "Intellectual Property" },
    ],
    "consulting": [
      { value: "management-consulting", label: "Management Consulting" },
      { value: "strategy-consulting", label: "Strategy Consulting" },
      { value: "it-consulting", label: "IT Consulting" },
      { value: "hr-consulting", label: "HR Consulting" },
    ],
    "accounting": [
      { value: "tax-services", label: "Tax Services" },
      { value: "audit", label: "Audit" },
      { value: "bookkeeping", label: "Bookkeeping" },
      { value: "payroll", label: "Payroll Services" },
    ],
    "hospitality": [
      { value: "hotels", label: "Hotels" },
      { value: "resorts", label: "Resorts" },
      { value: "event-venues", label: "Event Venues" },
      { value: "vacation-rentals", label: "Vacation Rentals" },
    ],
    "restaurants": [
      { value: "fine-dining", label: "Fine Dining" },
      { value: "casual-dining", label: "Casual Dining" },
      { value: "fast-food", label: "Fast Food" },
      { value: "cafes", label: "Cafes & Coffee Shops" },
      { value: "catering", label: "Catering" },
    ],
    "automotive": [
      { value: "dealerships", label: "Dealerships" },
      { value: "auto-repair", label: "Auto Repair" },
      { value: "car-rental", label: "Car Rental" },
      { value: "auto-parts", label: "Auto Parts" },
    ],
    "construction": [
      { value: "residential-construction", label: "Residential Construction" },
      { value: "commercial-construction", label: "Commercial Construction" },
      { value: "renovation", label: "Renovation" },
      { value: "specialty-trades", label: "Specialty Trades" },
    ],
    "manufacturing": [
      { value: "industrial", label: "Industrial Manufacturing" },
      { value: "consumer-goods", label: "Consumer Goods" },
      { value: "food-manufacturing", label: "Food Manufacturing" },
      { value: "electronics-manufacturing", label: "Electronics Manufacturing" },
    ],
    "travel": [
      { value: "travel-agencies", label: "Travel Agencies" },
      { value: "airlines", label: "Airlines" },
      { value: "tour-operators", label: "Tour Operators" },
      { value: "cruise-lines", label: "Cruise Lines" },
    ],
    "beauty": [
      { value: "hair-salons", label: "Hair Salons" },
      { value: "nail-salons", label: "Nail Salons" },
      { value: "med-spas", label: "Med Spas" },
      { value: "barbershops", label: "Barbershops" },
    ],
    "home-services": [
      { value: "plumbing", label: "Plumbing" },
      { value: "electrical", label: "Electrical" },
      { value: "hvac", label: "HVAC" },
      { value: "cleaning", label: "Cleaning Services" },
      { value: "landscaping", label: "Landscaping" },
    ],
    "nonprofit": [
      { value: "charity", label: "Charity" },
      { value: "foundations", label: "Foundations" },
      { value: "religious", label: "Religious Organizations" },
      { value: "advocacy", label: "Advocacy Groups" },
    ],
    "government": [
      { value: "federal", label: "Federal" },
      { value: "state", label: "State" },
      { value: "local", label: "Local" },
      { value: "public-services", label: "Public Services" },
    ],
    "entertainment": [
      { value: "media", label: "Media & Broadcasting" },
      { value: "gaming", label: "Gaming" },
      { value: "events", label: "Events & Concerts" },
      { value: "sports", label: "Sports" },
    ],
    "other": [
      { value: "general", label: "General" },
      { value: "custom", label: "Custom" },
    ],
  };

  const genders = [
    { value: "female", label: "Female" },
    { value: "male", label: "Male" },
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

  const handleSave = async () => {
    // Validate required fields
    if (!formData.name || formData.name.trim() === "") {
      toast.error("Agent name is required. Please enter a name for your agent.");
      return;
    }

    if (!formData.businessProcess || formData.businessProcess.trim() === "") {
      toast.error("Business process is required. Please select a business process.");
      return;
    }

    if (!formData.industry || formData.industry.trim() === "") {
      toast.error("Industry is required. Please select an industry.");
      return;
    }

    if (currentAgent) {
      const loadingToast = toast.loading("Updating agent...");
      try {
        // Reverse mapping functions - form values to API values
        const personalityToApi = (value: string) => {
          const mapping: Record<string, string> = {
            'Friendly': 'friendly',
            'Formal': 'formal',
            'Empathetic': 'empathetic',
            'Persuasive (Sales)': 'persuasive',
            'Reassuring (Support)': 'reassuring',
          };
          return mapping[value] || value?.toLowerCase()?.split(' ')[0] || 'friendly';
        };

        const maxResponseToApi = (value: string) => {
          const mapping: Record<string, string> = {
            'Short (50 words)': 'short',
            'Medium (150 words)': 'medium',
            'Long (300 words)': 'long',
          };
          return mapping[value] || 'medium';
        };

        const contextWindowToApi = (value: string) => {
          const mapping: Record<string, string> = {
            'Small (4K tokens)': 'small_4k_tokens',
            'Standard (8K tokens)': 'standard_8k_tokens',
            'Large (16K tokens)': 'large_16k_tokens',
          };
          return mapping[value] || 'standard_8k_tokens';
        };

        const guardrailsToApi = (value: string) => {
          const mapping: Record<string, string> = {
            'Low': 'low',
            'Medium': 'medium',
            'High': 'high',
          };
          return mapping[value] || 'medium';
        };

        const responseStyleToApi = (value: string) => {
          const mapping: Record<string, string> = {
            'Concise': 'concise',
            'Balanced': 'balanced',
            'Detailed': 'detailed',
          };
          return mapping[value] || 'balanced';
        };

        const updateData = {
          name: formData.name,
          personality: personalityToApi(formData.persona),
          language: formData.language,
          voice: formData.voice,
          gender: formData.gender,
          business_process: formData.businessProcess.replace(/-/g, '_'),
          industry: formData.industry.replace(/-/g, '_'),
          sub_industry: formData.subIndustry ? formData.subIndustry.replace(/-/g, '_') : undefined,
          custom_instructions: formData.customInstructions,
          guardrails_level: guardrailsToApi(formData.guardrailsLevel),
          response_style: responseStyleToApi(formData.responseStyle),
          max_response_length: maxResponseToApi(formData.maxResponseLength),
          context_window: contextWindowToApi(formData.contextWindow),
          temperature: formData.temperature,
          // Include template data if available
          template: templateData || undefined,
        };

        console.log('Sending update data:', updateData);
        
        await agentAPI.updateAgent(currentAgent.id, updateData);
        toast.dismiss(loadingToast);
        toast.success("Agent updated successfully!");
        
        navigate('/agents', { state: { refresh: true } });
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error("Failed to update agent. Please try again.");
        console.error("Update agent error:", error);
      }
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (isLoadingAgent || !currentAgent) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Loading agent...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-visible">
      {/* <Toaster position="top-right" /> */}
      {/* Header */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          {/* Top row with back button and actions */}
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Main agent info section */}
            <div className="flex items-start gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-1">
              <button
                onClick={handleCancel}
                className="common-button-bg2 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl flex-shrink-0 touch-manipulation"
              >
                <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600 dark:text-slate-300" />
              </button>

              <div className="flex items-start gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-1">
                {/* Agent Icon */}
                <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 common-bg-icons flex items-center justify-center flex-shrink-0 rounded-lg sm:rounded-xl">
                  <Bot className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-black dark:text-white" />
                </div>

                {/* Agent Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    <div className="min-w-0 flex-1">
                      <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-white leading-tight truncate">
                        {currentAgent.name}
                      </h1>

                      {/* Agent meta info - Mobile optimized */}
                      <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="truncate text-xs sm:text-sm">
                            {currentAgent.language}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium flex-shrink-0">
                            Editing
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons - Mobile compact */}
            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0">
              <button
                onClick={handleCancel}
                className="flex-1 sm:flex-none common-button-bg2 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 rounded-lg sm:rounded-xl touch-manipulation min-h-[36px] sm:min-h-[40px]"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">Cancel</span>
              </button>

              <button
                onClick={handleSave}
                className="flex-1 sm:flex-none common-button-bg flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 rounded-lg sm:rounded-xl touch-manipulation min-h-[36px] sm:min-h-[40px]"
              >
                <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">
                  Save
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
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                  Identity & Persona
                </h2>
              </div>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
                Define your agent's basic identity and personality
              </p>

              <div className="space-y-4 sm:space-y-6">
                {/* Agent Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    Agent Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Sarah - Customer Support"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 text-slate-800 dark:text-white text-sm sm:text-base transition-all duration-200"
                  />
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-1.5">
                    This name will be visible to your customers
                  </p>
                </div>

                {/* Business Process and Industry */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                      Business Process <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={businessProcesses}
                      value={formData.businessProcess}
                      onChange={(value) =>
                        setFormData({ ...formData, businessProcess: value })
                      }
                      placeholder="Select process..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                      Industry <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={industries}
                      value={formData.industry}
                      onChange={(value) =>
                        setFormData({ ...formData, industry: value, subIndustry: "" })
                      }
                      placeholder="Select industry..."
                    />
                  </div>
                </div>

                {/* Sub Industry */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    Sub Industry
                  </label>
                  <SearchableSelect
                    options={formData.industry ? (subIndustries[formData.industry] || []) : []}
                    value={formData.subIndustry}
                    onChange={(value) =>
                      setFormData({ ...formData, subIndustry: value })
                    }
                    placeholder={formData.industry ? "Select sub-industry..." : "Select an industry first"}
                    disabled={!formData.industry}
                  />
                  {!formData.industry && (
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-1.5">
                      Please select an industry first to see available sub-industries
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    Gender
                  </label>
                  <SearchableSelect
                    options={genders}
                    value={formData.gender}
                    onChange={(value) =>
                      setFormData({ ...formData, gender: value })
                    }
                    placeholder="Select gender..."
                  />
                </div>

                {/* Personality */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
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
                    onChange={(value) =>
                      setFormData({ ...formData, persona: value })
                    }
                    placeholder="Select persona..."
                  />
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-1.5">
                    Choose the tone that best fits your brand
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Advanced Settings */}
          <GlassCard>
            <div className="p-4 sm:p-5 lg:p-6 z-[99] relative">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                  Advanced Settings
                </h2>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Custom Instructions */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
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
                    placeholder="Add specific instructions or guidelines for your agent..."
                    rows={4}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/20 text-slate-800 dark:text-white text-sm sm:text-base resize-none transition-all duration-200"
                  />
                </div>

                {/* Response Style */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
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

                {/* Max Response Length */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    Max Response Length
                  </label>
                  <SearchableSelect
                    options={maxResponseOptions}
                    value={formData.maxResponseLength}
                    onChange={(value) =>
                      setFormData({ ...formData, maxResponseLength: value })
                    }
                    placeholder="Select max response length..."
                  />
                </div>

                {/* Temperature Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                      Creativity Level
                    </label>
                    <span className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
                      {formData.temperature}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        temperature: parseFloat(e.target.value),
                      })
                    }
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>More Focused</span>
                    <span>More Creative</span>
                  </div>
                </div>

                {/* Context Window */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
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
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-1.5">
                    Larger windows remember more conversation history
                  </p>
                </div>

                {/* Template Editor Toggle */}
                {templateData && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setShowTemplateEditor(!showTemplateEditor)}
                      className="flex items-center justify-between w-full px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                          {showTemplateEditor ? 'Hide' : 'Edit'} Template Details
                        </span>
                      </div>
                      <span className="text-xs text-purple-600 dark:text-purple-400">
                        {templateData.name}
                      </span>
                    </button>
                  </div>
                )}

                {/* Template Editor Expanded Section */}
                {showTemplateEditor && templateData && (
                  <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                      <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Template Configuration
                      </h3>

                      {/* System Prompt */}
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          System Prompt
                        </label>
                        <textarea
                          value={templateData.systemPrompt || ''}
                          onChange={(e) =>
                            setTemplateData({
                              ...templateData,
                              systemPrompt: e.target.value,
                            })
                          }
                          placeholder="Define the agent's core behavior and role..."
                          rows={4}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/20 text-slate-800 dark:text-white text-sm resize-none"
                        />
                      </div>

                      {/* First Message */}
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          First Message
                        </label>
                        <textarea
                          value={templateData.firstMessage || ''}
                          onChange={(e) =>
                            setTemplateData({
                              ...templateData,
                              firstMessage: e.target.value,
                            })
                          }
                          placeholder="Initial greeting message..."
                          rows={2}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/20 text-slate-800 dark:text-white text-sm resize-none"
                        />
                      </div>

                      {/* Opening Script */}
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Opening Script
                        </label>
                        <textarea
                          value={templateData.openingScript || ''}
                          onChange={(e) =>
                            setTemplateData({
                              ...templateData,
                              openingScript: e.target.value,
                            })
                          }
                          placeholder="How the agent should start conversations..."
                          rows={3}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/20 text-slate-800 dark:text-white text-sm resize-none"
                        />
                      </div>

                      {/* Key Talking Points */}
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Key Talking Points
                        </label>
                        <textarea
                          value={templateData.keyTalkingPoints || ''}
                          onChange={(e) =>
                            setTemplateData({
                              ...templateData,
                              keyTalkingPoints: e.target.value,
                            })
                          }
                          placeholder="Important topics to cover..."
                          rows={4}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/20 text-slate-800 dark:text-white text-sm resize-none"
                        />
                      </div>

                      {/* Closing Script */}
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Closing Script
                        </label>
                        <textarea
                          value={templateData.closingScript || ''}
                          onChange={(e) =>
                            setTemplateData({
                              ...templateData,
                              closingScript: e.target.value,
                            })
                          }
                          placeholder="How to end conversations professionally..."
                          rows={3}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/20 text-slate-800 dark:text-white text-sm resize-none"
                        />
                      </div>

                      {/* Objections */}
                      {templateData.objections && templateData.objections.length > 0 && (
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Objection Handling ({templateData.objections.length})
                          </label>
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {templateData.objections.map((obj: any, index: number) => (
                              <div
                                key={index}
                                className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg"
                              >
                                <input
                                  value={obj.objection}
                                  onChange={(e) => {
                                    const updated = [...templateData.objections];
                                    updated[index].objection = e.target.value;
                                    setTemplateData({
                                      ...templateData,
                                      objections: updated,
                                    });
                                  }}
                                  placeholder="Objection..."
                                  className="w-full px-2 py-1.5 mb-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs"
                                />
                                <textarea
                                  value={obj.response}
                                  onChange={(e) => {
                                    const updated = [...templateData.objections];
                                    updated[index].response = e.target.value;
                                    setTemplateData({
                                      ...templateData,
                                      objections: updated,
                                    });
                                  }}
                                  placeholder="Response..."
                                  rows={2}
                                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs resize-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Conversation Examples */}
                      {templateData.conversationExamples && templateData.conversationExamples.length > 0 && (
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Conversation Examples ({templateData.conversationExamples.length})
                          </label>
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {templateData.conversationExamples.map((example: any, index: number) => (
                              <div
                                key={index}
                                className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg"
                              >
                                <input
                                  value={example.customerInput}
                                  onChange={(e) => {
                                    const updated = [...templateData.conversationExamples];
                                    updated[index].customerInput = e.target.value;
                                    setTemplateData({
                                      ...templateData,
                                      conversationExamples: updated,
                                    });
                                  }}
                                  placeholder="Customer says..."
                                  className="w-full px-2 py-1.5 mb-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs"
                                />
                                <textarea
                                  value={example.expectedResponse}
                                  onChange={(e) => {
                                    const updated = [...templateData.conversationExamples];
                                    updated[index].expectedResponse = e.target.value;
                                    setTemplateData({
                                      ...templateData,
                                      conversationExamples: updated,
                                    });
                                  }}
                                  placeholder="Agent responds..."
                                  rows={2}
                                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs resize-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar - Mobile Stacked */}
        <div className="space-y-4 sm:space-y-6">
          <GlassCard>
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                  Voice & Language
                </h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Configure language and voice settings
              </p>

              <div className="space-y-4">
                {/* Language */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
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
                    onChange={(value) =>
                      setFormData({ ...formData, language: value })
                    }
                    placeholder="Select language..."
                  />
                </div>

                {/* Voice */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
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
                    onChange={(value) =>
                      setFormData({ ...formData, voice: value })
                    }
                    placeholder="Select voice..."
                  />
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                  Tips for Better Performance
                </h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Use clear, concise custom instructions for best results
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Test different personality types to match your brand voice
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Lower creativity for factual responses, higher for creative tasks
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default EditAgent;
