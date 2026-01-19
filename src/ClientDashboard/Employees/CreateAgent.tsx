import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
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
  Loader2,
  X,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const CreateAgent = () => {
  const navigate = useNavigate();
  const { refreshAgents } = useAgent();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [templateApplied, setTemplateApplied] = useState(false);

  // AI generation state for custom instructions
  const [isGeneratingInstructions, setIsGeneratingInstructions] = useState(false);
  const [generatedInstructions, setGeneratedInstructions] = useState("");
  const [showGeneratedInstructions, setShowGeneratedInstructions] = useState(false);

  // Template modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    gender: "female",
    businessProcess: "",
    industry: "",
    subIndustry: "",
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

  const templates: Record<string, {
    name: string;
    description: string;
    features: string[];
    persona: string;
    customInstructions: string;
    guardrailsLevel: string;
    icon?: string;
  }> = {
    "customer-support-general": {
      name: "Customer Support Agent",
      description: "Handles customer inquiries, resolves issues, and provides product/service information",
      features: ["Issue Resolution", "FAQ Handling", "Escalation Management", "Customer Satisfaction"],
      persona: "Empathetic",
      customInstructions: "You are a helpful customer support agent. Listen carefully to customer concerns, provide accurate information, resolve issues efficiently, and maintain a friendly, professional tone. Always aim for first-contact resolution.",
      guardrailsLevel: "Medium",
      icon: "🎧",
    },
    "sales-outbound": {
      name: "Sales Outreach Agent",
      description: "Engages prospects, qualifies leads, and schedules demos or consultations",
      features: ["Lead Qualification", "Product Pitching", "Objection Handling", "Demo Scheduling"],
      persona: "Persuasive (Sales)",
      customInstructions: "You are a professional sales agent. Engage prospects warmly, understand their needs, present value propositions effectively, handle objections gracefully, and guide them towards scheduling demos or making decisions.",
      guardrailsLevel: "Medium",
      icon: "💼",
    },
    "appointment-scheduler": {
      name: "Appointment Scheduler",
      description: "Books appointments, handles rescheduling, and sends reminders",
      features: ["Appointment Booking", "Calendar Management", "Reminder Calls", "Cancellation Handling"],
      persona: "Friendly",
      customInstructions: "You are an efficient appointment scheduler. Help customers book, reschedule, or cancel appointments. Confirm details clearly, provide reminders, and ensure a smooth scheduling experience.",
      guardrailsLevel: "Low",
      icon: "📅",
    },
    "lead-qualifier": {
      name: "Lead Qualification Agent",
      description: "Qualifies inbound leads by gathering information and assessing fit",
      features: ["Lead Scoring", "Information Gathering", "Needs Assessment", "Handoff to Sales"],
      persona: "Formal",
      customInstructions: "You are a professional lead qualifier. Ask relevant questions to understand prospect needs, budget, timeline, and decision-making process. Score leads accurately and provide clear handoff notes to the sales team.",
      guardrailsLevel: "Medium",
      icon: "🎯",
    },
    "technical-support": {
      name: "Technical Support Agent",
      description: "Provides technical assistance, troubleshooting, and product guidance",
      features: ["Troubleshooting", "Product Guidance", "Issue Escalation", "Documentation"],
      persona: "Reassuring (Support)",
      customInstructions: "You are a knowledgeable technical support agent. Guide users through troubleshooting steps, explain technical concepts clearly, and escalate complex issues when needed. Always ensure the user feels supported.",
      guardrailsLevel: "High",
      icon: "🔧",
    },
    "onboarding-specialist": {
      name: "Onboarding Specialist",
      description: "Guides new customers through setup, training, and initial experience",
      features: ["Setup Assistance", "Feature Training", "Best Practices", "Progress Tracking"],
      persona: "Friendly",
      customInstructions: "You are a welcoming onboarding specialist. Help new customers get started, explain features step-by-step, share best practices, and ensure they feel confident using the product or service.",
      guardrailsLevel: "Low",
      icon: "🚀",
    },
  };

  // Get all available templates as an array
  const getAllTemplates = () => {
    return Object.entries(templates).map(([key, template]) => ({
      key,
      ...template,
    }));
  };

  // Get recommended template based on selection
  const getRecommendedTemplate = () => {
    const key = `${formData.businessProcess}-${formData.industry}`;
    if (templates[key]) {
      return { key, ...templates[key] };
    }
    // Return a default recommendation based on business process
    if (formData.businessProcess === "customer-support") return { key: "customer-support-general", ...templates["customer-support-general"] };
    if (formData.businessProcess === "sales-marketing") return { key: "sales-outbound", ...templates["sales-outbound"] };
    if (formData.businessProcess === "appointment-setting") return { key: "appointment-scheduler", ...templates["appointment-scheduler"] };
    if (formData.businessProcess === "lead-qualification") return { key: "lead-qualifier", ...templates["lead-qualifier"] };
    if (formData.businessProcess === "technical-support") return { key: "technical-support", ...templates["technical-support"] };
    if (formData.businessProcess === "onboarding") return { key: "onboarding-specialist", ...templates["onboarding-specialist"] };
    return { key: "customer-support-general", ...templates["customer-support-general"] };
  };

  // Apply selected template from modal
  const applySelectedTemplate = () => {
    if (!selectedTemplateKey || !templates[selectedTemplateKey]) {
      toast.error("Please select a template");
      return;
    }
    
    setIsApplyingTemplate(true);
    setTimeout(() => {
      const template = templates[selectedTemplateKey];
      setFormData((prev) => ({
        ...prev,
        persona: template.persona,
        customInstructions: template.customInstructions,
        guardrailsLevel: template.guardrailsLevel,
      }));
      setIsApplyingTemplate(false);
      setTemplateApplied(true);
      setShowTemplateModal(false);
      setSelectedTemplateKey(null);
      toast.success("Template applied successfully!");
    }, 800);
  };

  const removeTemplate = () => {
    setFormData((prev) => ({
      ...prev,
      persona: "Empathetic",
      customInstructions: "",
      guardrailsLevel: "Medium",
    }));
    setTemplateApplied(false);
    toast.success("Template removed");
  };

  // AI generation functions for custom instructions
  const generateCustomInstructions = async () => {
    if (!formData.businessProcess || !formData.industry) {
      toast.error("Please select a business process and industry first");
      return;
    }

    setIsGeneratingInstructions(true);
    try {
      const businessProcessLabel = businessProcesses.find((bp) => bp.value === formData.businessProcess)?.label || formData.businessProcess;
      const industryLabel = industries.find((ind) => ind.value === formData.industry)?.label || formData.industry;
      const subIndustryLabel = formData.subIndustry && subIndustries[formData.industry]
        ? subIndustries[formData.industry].find((si) => si.value === formData.subIndustry)?.label
        : null;

      const promptText = formData.customInstructions
        ? `Enhance and improve these custom instructions for an AI assistant:\n\nAgent Details:\n- Name: ${formData.name || "AI Assistant"}\n- Business Process: ${businessProcessLabel}\n- Industry: ${industryLabel}${subIndustryLabel ? `\n- Sub-Industry: ${subIndustryLabel}` : ""}\n- Persona: ${formData.persona}\n\nCurrent instructions to enhance: ${formData.customInstructions}\n\nProvide improved, detailed, and professional custom instructions that guide the AI agent's behavior, tone, and capabilities.`
        : `Generate professional custom instructions for an AI assistant with the following details:\n\nAgent Details:\n- Name: ${formData.name || "AI Assistant"}\n- Business Process: ${businessProcessLabel}\n- Industry: ${industryLabel}${subIndustryLabel ? `\n- Sub-Industry: ${subIndustryLabel}` : ""}\n- Persona: ${formData.persona}\n\nCreate detailed custom instructions that define the AI agent's behavior, communication style, capabilities, boundaries, and best practices for handling customer interactions in this specific industry and use case.`;

      const response = await agentAPI.generatePrompt(promptText);

      const generated =
        response?.data?.generation?.response ||
        response?.generation?.response ||
        response?.response;

      if (generated && typeof generated === "string") {
        setGeneratedInstructions(generated);
        setShowGeneratedInstructions(true);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Failed to generate instructions:", error);
      toast.error("Failed to generate instructions. Please try again.");
    } finally {
      setIsGeneratingInstructions(false);
    }
  };

  const applyGeneratedInstructions = () => {
    setFormData((prev) => ({ ...prev, customInstructions: generatedInstructions }));
    setShowGeneratedInstructions(false);
    setGeneratedInstructions("");
    toast.success("Instructions applied successfully!");
  };

  const cancelGeneratedInstructions = () => {
    setShowGeneratedInstructions(false);
    setGeneratedInstructions("");
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
        sub_industry: formData.subIndustry || undefined,
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

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-visible">
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
                      onChange={(value) => setFormData({ ...formData, industry: value, subIndustry: "" })}
                      placeholder="Select industry..."
                    />
                  </div>
                </div>

                {/* Sub Industry Field */}
                <div className="overflow-visible relative z-15">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Sub Industry
                  </label>
                  <SearchableSelect
                    options={formData.industry ? (subIndustries[formData.industry] || []) : []}
                    value={formData.subIndustry}
                    onChange={(value) => setFormData({ ...formData, subIndustry: value })}
                    placeholder={formData.industry ? "Select sub-industry..." : "Select an industry first"}
                    disabled={!formData.industry}
                  />
                  {!formData.industry && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Please select an industry first to see available sub-industries
                    </p>
                  )}
                </div>

                {/* Template Hint - Mobile Only (shows before template) */}
                {(!formData.businessProcess || !formData.industry) && (
                  <div className="lg:hidden flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                    <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Select business process & industry to see AI template suggestions
                    </p>
                  </div>
                )}

                {/* Template Suggestions - Mobile Only */}
                {formData.businessProcess && formData.industry && (
                  <div className="lg:hidden">
                    {templateApplied ? (
                      <div className="common-bg-icons p-4 rounded-xl">
                        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-3">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">Template Applied</span>
                        </div>
                        <button
                          onClick={removeTemplate}
                          className="w-full common-button-bg2 px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <X className="w-4 h-4" />
                          Remove Template
                        </button>
                      </div>
                    ) : (
                      <div className="common-bg-icons p-4 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 dark:text-white text-sm">
                              Pre-built Templates Available
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              We have templates that fit your requirements
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowTemplateModal(true)}
                          className="w-full common-button-bg px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
                        >
                          <Lightbulb className="w-4 h-4" />
                          View Templates
                        </button>
                      </div>
                    )}
                  </div>
                )}

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
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Custom Instructions <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateCustomInstructions}
                      disabled={isGeneratingInstructions || !formData.businessProcess || !formData.industry}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingInstructions ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Assist</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    value={formData.customInstructions}
                    onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
                    placeholder="Provide specific instructions for your agent's behavior..."
                    rows={4}
                    className="common-bg-icons w-full px-4 py-3 rounded-xl resize-none text-sm sm:text-base"
                  />
                  {(!formData.businessProcess || !formData.industry) && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Select business process and industry above to enable AI Assist
                    </p>
                  )}
                  {showGeneratedInstructions && generatedInstructions && (
                    <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                          AI Generated Instructions
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-lg mb-3">
                        <textarea
                          value={generatedInstructions}
                          onChange={(e) => setGeneratedInstructions(e.target.value)}
                          className="w-full h-40 p-3 text-sm text-slate-700 dark:text-slate-300 bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 rounded-lg"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={applyGeneratedInstructions}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-sm font-medium rounded-lg transition-all"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Add
                        </button>
                        <button
                          onClick={cancelGeneratedInstructions}
                          className="px-4 py-2 common-bg-icons text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:shadow-sm transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
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
                templateApplied ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">Template Applied</span>
                    </div>
                    <button
                      onClick={removeTemplate}
                      className="w-full common-button-bg2 px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <X className="w-4 h-4" />
                      Remove Template
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-white">
                          Pre-built Templates
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Ready-to-use configurations
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      We have pre-configured templates that match your selected business process and industry. Choose one to quickly set up your agent with optimal settings.
                    </p>
                    <button
                      onClick={() => setShowTemplateModal(true)}
                      className="w-full common-button-bg px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                    >
                      <Lightbulb className="w-4 h-4" />
                      View Templates
                    </button>
                  </div>
                )
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

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowTemplateModal(false);
              setSelectedTemplateKey(null);
            }}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[calc(100vw-16px)] sm:max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white truncate">
                    Choose a Template
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hidden xs:block">
                    Select a pre-configured template
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setSelectedTemplateKey(null);
                }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0 ml-2"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Recommended Badge */}
            {getRecommendedTemplate() && (
              <div className="px-3 sm:px-4 pt-2 sm:pt-3">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                  <span className="truncate">Recommended: <strong>{getRecommendedTemplate().name}</strong></span>
                </div>
              </div>
            )}

            {/* Templates Carousel */}
            <div className="p-3 sm:p-4">
              {(() => {
                const allTemplates = getAllTemplates();
                const recommendedKey = getRecommendedTemplate()?.key;
                const totalSlides = allTemplates.length;
                
                const goToSlide = (index: number) => {
                  if (index < 0) setCurrentSlide(totalSlides - 1);
                  else if (index >= totalSlides) setCurrentSlide(0);
                  else setCurrentSlide(index);
                };

                const tmpl = allTemplates[currentSlide];
                const isSelected = selectedTemplateKey === tmpl?.key;
                const isRecommended = recommendedKey === tmpl?.key;

                return (
                  <div className="relative">
                    {/* Navigation Arrows */}
                    <button
                      onClick={() => goToSlide(currentSlide - 1)}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow hover:bg-slate-50 dark:hover:bg-slate-700 transition-all -ml-1 sm:-ml-2"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-300" />
                    </button>
                    <button
                      onClick={() => goToSlide(currentSlide + 1)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow hover:bg-slate-50 dark:hover:bg-slate-700 transition-all -mr-1 sm:-mr-2"
                    >
                      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-300" />
                    </button>

                    {/* Template Card */}
                    <div className="px-4 sm:px-6">
                      <div
                        onClick={() => setSelectedTemplateKey(tmpl.key)}
                        className={`relative p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md shadow-blue-500/20"
                            : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-slate-800"
                        }`}
                      >
                        {isRecommended && (
                          <div className="absolute -top-2 sm:-top-2.5 left-1/2 -translate-x-1/2 px-2 sm:px-2.5 py-0.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[9px] sm:text-[10px] font-medium rounded-full shadow whitespace-nowrap">
                            ✨ Recommended
                          </div>
                        )}
                        
                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-base sm:text-lg flex-shrink-0">
                            {tmpl.icon || "🤖"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-800 dark:text-white text-xs sm:text-sm mb-0.5 sm:mb-1 truncate">
                              {tmpl.name}
                            </h4>
                            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                              {tmpl.description}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2.5 sm:mt-3">
                          {tmpl.features.slice(0, 3).map((feature, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 sm:px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] sm:text-[10px] rounded-full"
                            >
                              {feature}
                            </span>
                          ))}
                          {tmpl.features.length > 3 && (
                            <span className="px-1.5 sm:px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[9px] sm:text-[10px] rounded-full">
                              +{tmpl.features.length - 3}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4 text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-slate-700">
                          <span>Persona: <strong className="text-slate-700 dark:text-slate-300">{tmpl.persona}</strong></span>
                          <span>Guardrails: <strong className="text-slate-700 dark:text-slate-300">{tmpl.guardrailsLevel}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Dots Navigation */}
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                      {allTemplates.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlide(idx)}
                          className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all ${
                            idx === currentSlide
                              ? "bg-blue-500 w-5 sm:w-6"
                              : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Slide Counter */}
                    <div className="text-center mt-2 sm:mt-3 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                      {currentSlide + 1} of {totalSlides}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setSelectedTemplateKey(null);
                }}
                className="px-3 sm:px-4 py-2 sm:py-2.5 common-button-bg2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={applySelectedTemplate}
                disabled={!selectedTemplateKey || isApplyingTemplate}
                className="px-4 sm:px-6 py-2 sm:py-2.5 common-button-bg rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApplyingTemplate ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                    <span className="hidden xs:inline">Applying...</span>
                    <span className="xs:hidden">...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Apply</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateAgent;
