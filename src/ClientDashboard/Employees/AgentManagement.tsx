import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
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
  AgentWidgetCustomization,
  AgentQRModal,
  AgentIntegrationCode,
} from "./agents";
import { useAgent } from "../../contexts/AgentContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  aiEmployeeTemplates,
  getMatchingTemplatesWithScore,
  TemplateMatchResult,
} from "../../constants/aiEmployeeTemplates";
import {
  aiTemplateService,
  GeneratedTemplate,
} from "../../services/aiTemplateService";
import { isDeveloperUser } from "../../lib/utils";
import {
  liveKitService,
  LiveKitMessage,
  LiveKitCallbacks,
} from "../../services/liveKitService";
import { agentAPI } from "../../services/agentAPI";
import { knowledgeBaseSocket, KnowledgeBaseProgress } from "../../services/knowledgeBaseSocket";
import {
  Bot,
  ArrowLeft,
  Play,
  Pause,
  Eye,
  Edit,
  Edit2,
  Trash2,
  Copy,
  Download,
  MessageSquare,
  Globe,
  Zap,
  Clock,
  Users,
  CheckCircle,
  Lightbulb,
  Plus,
  Search,
  Filter,
  Settings,
  X,
  Send,
  Phone,
  PhoneCall,
  Mic,
  MicOff,
  Building2,
  Briefcase,
  Factory,
  Layers,
  Link,
  Share2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ArrowRight,
  SkipForward,
  FileText,
  Image,
  Upload,
  File,
  UploadCloud,
  PauseCircle,
} from "lucide-react";

const AGENTS_PER_PAGE = 6;

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

  // Check if current user is developer
  const isDeveloper = isDeveloperUser(user?.email);

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
  const [totalPages, setTotalPages] = useState(0);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);

  // Pagination state - read from URL query params
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showTestChat, setShowTestChat] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
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

  // Quick Create Modal State
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [quickCreateStep, setQuickCreateStep] = useState(1);
  const [businessProcessSlideIndex, setBusinessProcessSlideIndex] = useState(0);
  const [industrySlideIndex, setIndustrySlideIndex] = useState(0);
  const [subIndustrySlideIndex, setSubIndustrySlideIndex] = useState(0);
  const [templateSlideIndex, setTemplateSlideIndex] = useState(0);
  const [quickCreateData, setQuickCreateData] = useState({
    companyName: "",
    aiEmployeeName: "",
    businessProcess: "",
    industry: "",
    subIndustry: "",
    websiteUrls: [""],
    socialMediaUrls: [""],
    uploadedFiles: [] as File[],
    uploadedFileUrls: [] as string[],
    selectedTemplate: null as string | null,
  });
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  // Template Details Modal State
  const [showTemplateDetails, setShowTemplateDetails] = useState(false);
  const [selectedTemplateForDetails, setSelectedTemplateForDetails] = useState<
    string | null
  >(null);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editedTemplate, setEditedTemplate] =
    useState<Partial<GeneratedTemplate> | null>(null);

  // AI-Generated Templates State
  const [aiGeneratedTemplates, setAIGeneratedTemplates] = useState<
    GeneratedTemplate[]
  >([]);
  const [isGeneratingTemplates, setIsGeneratingTemplates] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [templateGenerationError, setTemplateGenerationError] = useState<
    string | null
  >(null);

  // Helper function to replace template placeholders with actual values
  const replaceTemplatePlaceholders = (text: string | undefined): string => {
    if (!text) return "";
    return text
      .replace(/\[AI Employee Name\]/g, quickCreateData.aiEmployeeName || "AI Assistant")
      .replace(/\[Company Name\]/g, quickCreateData.companyName || "Company")
      .replace(/\[Company\]/g, quickCreateData.companyName || "Company")
      .replace(/\[Business Name\]/g, quickCreateData.companyName || "Company")
      .replace(/\[Store Name\]/g, quickCreateData.companyName || "Company")
      .replace(/\[Clinic Name\]/g, quickCreateData.companyName || "Company")
      .replace(/\[Real Estate Company\]/g, quickCreateData.companyName || "Company")
      .replace(/\[Agent Name\]/g, quickCreateData.aiEmployeeName || "AI Assistant");
  };

  // Business Process Options
  const businessProcessOptions = [
    { value: "customer-support", label: "Customer Support", icon: "🎧" },
    { value: "sales-marketing", label: "Sales & Marketing", icon: "💼" },
    { value: "appointment-setting", label: "Appointment Setting", icon: "📅" },
    { value: "lead-qualification", label: "Lead Qualification", icon: "🎯" },
    { value: "technical-support", label: "Technical Support", icon: "🔧" },
    { value: "order-processing", label: "Order Processing", icon: "📦" },
    { value: "billing-inquiries", label: "Billing Inquiries", icon: "💳" },
    { value: "onboarding", label: "Customer Onboarding", icon: "🚀" },
  ];

  // Industry Options
  const industryOptions = [
    { value: "real-estate", label: "Real Estate", icon: "🏠" },
    { value: "healthcare", label: "Healthcare", icon: "🏥" },
    { value: "dental", label: "Dental", icon: "🦷" },
    { value: "fitness", label: "Fitness & Wellness", icon: "💪" },
    { value: "education", label: "Education", icon: "🎓" },
    { value: "finance", label: "Finance & Banking", icon: "🏦" },
    { value: "insurance", label: "Insurance", icon: "🛡️" },
    { value: "ecommerce", label: "E-commerce", icon: "🛒" },
    { value: "retail", label: "Retail", icon: "🏪" },
    { value: "technology", label: "Technology", icon: "💻" },
    { value: "saas", label: "SaaS", icon: "☁️" },
    { value: "legal", label: "Legal Services", icon: "⚖️" },
    { value: "hospitality", label: "Hospitality", icon: "🏨" },
    { value: "restaurants", label: "Restaurants", icon: "🍽️" },
    { value: "automotive", label: "Automotive", icon: "🚗" },
    { value: "beauty", label: "Beauty & Salon", icon: "💇" },
    { value: "home-services", label: "Home Services", icon: "🏠" },
    { value: "other", label: "Other", icon: "📋" },
  ];

  // Sub-Industry Options
  const subIndustryOptions: Record<string, { value: string; label: string }[]> =
    {
      "real-estate": [
        { value: "residential", label: "Residential Sales" },
        { value: "commercial", label: "Commercial Real Estate" },
        { value: "property-management", label: "Property Management" },
        { value: "luxury-real-estate", label: "Luxury Real Estate" },
        { value: "vacation-rentals", label: "Vacation Rentals" },
        { value: "real-estate-investment", label: "Real Estate Investment" },
        { value: "land-sales", label: "Land & Lot Sales" },
        { value: "real-estate-appraisal", label: "Real Estate Appraisal" },
      ],
      healthcare: [
        { value: "hospitals", label: "Hospitals" },
        { value: "clinics", label: "General Clinics" },
        { value: "mental-health", label: "Mental Health Services" },
        { value: "home-healthcare", label: "Home Healthcare" },
        { value: "urgent-care", label: "Urgent Care Centers" },
        { value: "specialized-clinics", label: "Specialized Clinics" },
        { value: "diagnostic-centers", label: "Diagnostic Centers" },
        { value: "rehabilitation", label: "Rehabilitation Centers" },
        { value: "telemedicine", label: "Telemedicine" },
        { value: "nursing-homes", label: "Nursing Homes" },
      ],
      dental: [
        { value: "general-dentistry", label: "General Dentistry" },
        { value: "orthodontics", label: "Orthodontics" },
        { value: "cosmetic-dentistry", label: "Cosmetic Dentistry" },
        { value: "pediatric-dentistry", label: "Pediatric Dentistry" },
        { value: "periodontics", label: "Periodontics" },
        { value: "endodontics", label: "Endodontics" },
        { value: "oral-surgery", label: "Oral Surgery" },
        { value: "dental-implants", label: "Dental Implants" },
      ],
      fitness: [
        { value: "gyms", label: "Gyms & Fitness Centers" },
        { value: "yoga-studios", label: "Yoga Studios" },
        { value: "personal-training", label: "Personal Training" },
        { value: "crossfit", label: "CrossFit Gyms" },
        { value: "pilates", label: "Pilates Studios" },
        { value: "martial-arts", label: "Martial Arts & Boxing" },
        { value: "dance-studios", label: "Dance Studios" },
        { value: "sports-facilities", label: "Sports Facilities" },
        { value: "wellness-centers", label: "Wellness Centers" },
      ],
      education: [
        { value: "k12", label: "K-12 Schools" },
        { value: "higher-education", label: "Higher Education" },
        { value: "online-learning", label: "Online Learning Platforms" },
        { value: "tutoring", label: "Tutoring Services" },
        { value: "vocational-training", label: "Vocational Training" },
        { value: "language-schools", label: "Language Schools" },
        { value: "test-prep", label: "Test Preparation" },
        { value: "preschool", label: "Preschool & Daycare" },
      ],
      finance: [
        { value: "banking", label: "Banking Services" },
        { value: "investment", label: "Investment Services" },
        { value: "wealth-management", label: "Wealth Management" },
        { value: "accounting", label: "Accounting Services" },
        { value: "financial-planning", label: "Financial Planning" },
        { value: "tax-services", label: "Tax Services" },
        { value: "mortgage-lending", label: "Mortgage Lending" },
        { value: "credit-unions", label: "Credit Unions" },
      ],
      insurance: [
        { value: "health-insurance", label: "Health Insurance" },
        { value: "life-insurance", label: "Life Insurance" },
        { value: "auto-insurance", label: "Auto Insurance" },
        { value: "property-insurance", label: "Property Insurance" },
        { value: "business-insurance", label: "Business Insurance" },
        { value: "travel-insurance", label: "Travel Insurance" },
        { value: "disability-insurance", label: "Disability Insurance" },
      ],
      ecommerce: [
        { value: "fashion", label: "Fashion & Apparel" },
        { value: "electronics", label: "Electronics" },
        { value: "food-beverage", label: "Food & Beverage" },
        { value: "home-decor", label: "Home Decor" },
        { value: "beauty-products", label: "Beauty Products" },
        { value: "sporting-goods", label: "Sporting Goods" },
        { value: "toys-games", label: "Toys & Games" },
        { value: "books-media", label: "Books & Media" },
        { value: "pet-supplies", label: "Pet Supplies" },
      ],
      retail: [
        { value: "grocery", label: "Grocery Stores" },
        { value: "fashion-retail", label: "Fashion Retail" },
        { value: "electronics-retail", label: "Electronics Retail" },
        { value: "home-improvement", label: "Home Improvement" },
        { value: "department-stores", label: "Department Stores" },
        { value: "specialty-retail", label: "Specialty Retail" },
        { value: "convenience-stores", label: "Convenience Stores" },
        { value: "furniture-stores", label: "Furniture Stores" },
      ],
      technology: [
        { value: "software-development", label: "Software Development" },
        { value: "it-services", label: "IT Services & Consulting" },
        { value: "cybersecurity", label: "Cybersecurity" },
        { value: "cloud-services", label: "Cloud Services" },
        { value: "data-analytics", label: "Data Analytics" },
        { value: "ai-ml", label: "AI & Machine Learning" },
        { value: "mobile-development", label: "Mobile App Development" },
        { value: "web-development", label: "Web Development" },
      ],
      saas: [
        { value: "crm", label: "CRM Software" },
        { value: "erp", label: "ERP Software" },
        { value: "marketing-automation", label: "Marketing Automation" },
        { value: "project-management", label: "Project Management" },
        { value: "hr-software", label: "HR & Payroll Software" },
        { value: "accounting-software", label: "Accounting Software" },
        { value: "collaboration-tools", label: "Collaboration Tools" },
        { value: "analytics-platforms", label: "Analytics Platforms" },
      ],
      legal: [
        { value: "corporate-law", label: "Corporate Law" },
        { value: "family-law", label: "Family Law" },
        { value: "immigration-law", label: "Immigration Law" },
        { value: "criminal-law", label: "Criminal Defense" },
        { value: "real-estate-law", label: "Real Estate Law" },
        { value: "estate-planning", label: "Estate Planning" },
        { value: "personal-injury", label: "Personal Injury" },
        { value: "intellectual-property", label: "Intellectual Property" },
      ],
      hospitality: [
        { value: "hotels", label: "Hotels & Motels" },
        { value: "resorts", label: "Resorts & Spas" },
        { value: "event-venues", label: "Event Venues" },
        { value: "bed-breakfast", label: "Bed & Breakfast" },
        { value: "vacation-rentals", label: "Vacation Rentals" },
        { value: "hostels", label: "Hostels" },
        { value: "conference-centers", label: "Conference Centers" },
      ],
      restaurants: [
        { value: "fine-dining", label: "Fine Dining" },
        { value: "casual-dining", label: "Casual Dining" },
        { value: "fast-food", label: "Fast Food & QSR" },
        { value: "cafes", label: "Cafes & Coffee Shops" },
        { value: "food-trucks", label: "Food Trucks" },
        { value: "bakeries", label: "Bakeries & Pastry Shops" },
        { value: "catering", label: "Catering Services" },
        { value: "bars-pubs", label: "Bars & Pubs" },
        { value: "buffets", label: "Buffets" },
      ],
      automotive: [
        { value: "dealerships", label: "Car Dealerships" },
        { value: "auto-repair", label: "Auto Repair & Maintenance" },
        { value: "car-rental", label: "Car Rental Services" },
        { value: "auto-parts", label: "Auto Parts & Accessories" },
        { value: "car-wash", label: "Car Wash & Detailing" },
        { value: "body-shops", label: "Body Shops & Collision Repair" },
        { value: "tire-services", label: "Tire Services" },
        { value: "oil-change", label: "Oil Change & Lube" },
        { value: "auto-glass", label: "Auto Glass Repair" },
        { value: "towing", label: "Towing Services" },
      ],
      beauty: [
        { value: "hair-salons", label: "Hair Salons" },
        { value: "nail-salons", label: "Nail Salons" },
        { value: "med-spas", label: "Medical Spas" },
        { value: "barbershops", label: "Barbershops" },
        { value: "day-spas", label: "Day Spas" },
        { value: "cosmetics", label: "Cosmetics & Makeup" },
        { value: "tattoo-piercing", label: "Tattoo & Piercing" },
        { value: "waxing", label: "Waxing & Threading" },
        { value: "aesthetic-clinics", label: "Aesthetic Clinics" },
      ],
      "home-services": [
        { value: "plumbing", label: "Plumbing Services" },
        { value: "electrical", label: "Electrical Services" },
        { value: "hvac", label: "HVAC Services" },
        { value: "cleaning", label: "Cleaning Services" },
        { value: "landscaping", label: "Landscaping & Lawn Care" },
        { value: "pest-control", label: "Pest Control" },
        { value: "roofing", label: "Roofing Services" },
        { value: "painting", label: "Painting Services" },
        { value: "moving", label: "Moving Services" },
        { value: "handyman", label: "Handyman Services" },
        { value: "carpet-cleaning", label: "Carpet Cleaning" },
        { value: "window-cleaning", label: "Window Cleaning" },
      ],
      other: [
        { value: "general", label: "General Business" },
        { value: "custom", label: "Custom Industry" },
        { value: "non-profit", label: "Non-Profit Organization" },
        { value: "government", label: "Government Services" },
      ],
    };

  // Get matching templates with scoring based on all user selections
  const getMatchingTemplatesScored = (): TemplateMatchResult[] => {
    return getMatchingTemplatesWithScore(
      quickCreateData.businessProcess,
      quickCreateData.industry,
      quickCreateData.subIndustry,
    );
  };

  // Handle quick create wizard navigation
  const handleQuickCreateNext = async () => {
    if (quickCreateStep < 6) {
      const nextStep = quickCreateStep + 1;
      setQuickCreateStep(nextStep);

      // Generate AI templates when moving to step 6
      if (nextStep === 6) {
        await generateAITemplates();
      }
    }
  };

  const generateAITemplates = async () => {
    setIsGeneratingTemplates(true);
    setTemplateGenerationError(null);
    setGenerationProgress(0);

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) return prev;
        return Math.min(90, prev + Math.random() * 15);
      });
    }, 400);

    try {
      const templates = await aiTemplateService.generateTemplates({
        companyName: quickCreateData.companyName,
        businessProcess: quickCreateData.businessProcess,
        industry: quickCreateData.industry,
        subIndustry: quickCreateData.subIndustry,
        websiteUrls: quickCreateData.websiteUrls.filter((url) => url.trim()),
        additionalContext: quickCreateData.aiEmployeeName
          ? `The AI employee will be named: ${quickCreateData.aiEmployeeName}`
          : undefined,
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);
      setAIGeneratedTemplates(templates);
      console.log("✅ AI templates generated successfully");
    } catch (error) {
      clearInterval(progressInterval);
      console.error("❌ Error generating AI templates:", error);
      setTemplateGenerationError(
        error instanceof Error ? error.message : "Failed to generate templates",
      );
      // Fall back to predefined templates if AI generation fails
      const fallbackTemplates = getMatchingTemplatesScored();
      setAIGeneratedTemplates(
        fallbackTemplates.map((t) => ({
          name: t.template.name,
          description: t.template.description,
          icon: t.template.icon,
          features: t.template.features,
        })),
      );
      setGenerationProgress(100);
    } finally {
      setTimeout(() => {
        setIsGeneratingTemplates(false);
        setGenerationProgress(0);
      }, 500);
    }
  };

  const handleQuickCreateBack = () => {
    if (quickCreateStep > 1) {
      setQuickCreateStep(quickCreateStep - 1);
    }
  };

  const handleQuickCreateClose = () => {
    // Don't allow closing while creating agent
    if (isCreatingAgent) {
      return;
    }
    
    setShowQuickCreateModal(false);
    setQuickCreateStep(1);
    setBusinessProcessSlideIndex(0);
    setIndustrySlideIndex(0);
    setSubIndustrySlideIndex(0);
    setTemplateSlideIndex(0);
    setAIGeneratedTemplates([]);
    setTemplateGenerationError(null);
    setIsCreatingAgent(false);
    setKbCreationProgress(null);
    setQuickCreateData({
      companyName: "",
      aiEmployeeName: "",
      businessProcess: "",
      industry: "",
      subIndustry: "",
      websiteUrls: [""],
      socialMediaUrls: [""],
      uploadedFiles: [],
      uploadedFileUrls: [],
      selectedTemplate: null,
    });
  };

  // Handle knowledge base file upload
  const handleKnowledgeBaseUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploadingFiles(true);
    try {
      setQuickCreateData((prev) => ({
        ...prev,
        uploadedFiles: [...prev.uploadedFiles, ...files],
      }));

      // Upload files to the API
      const response = await agentAPI.uploadKnowledgeBase(files);
      console.log("📤 Knowledge base upload response:", response);

      // Extract URLs from response.data.files array
      const urls = response.data?.files?.map((file: any) => file.url) || [];
      if (urls.length > 0) {
        setQuickCreateData((prev) => ({
          ...prev,
          uploadedFileUrls: [...prev.uploadedFileUrls, ...urls],
        }));
        console.log("✅ Knowledge base files uploaded:", urls);
        toast.success(`${files.length} file(s) uploaded successfully!`);
      }
    } catch (error) {
      console.error("❌ Error uploading knowledge base files:", error);
      toast.error("Failed to upload files. Please try again.");
      setQuickCreateData((prev) => ({
        ...prev,
        uploadedFiles: prev.uploadedFiles.filter(
          (f) => !files.some((newFile) => newFile.name === f.name)
        ),
      }));
    } finally {
      setIsUploadingFiles(false);
    }
  };

  // Handle knowledge base file removal
  const handleRemoveKnowledgeBaseFile = (index: number) => {
    setQuickCreateData((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index),
      uploadedFileUrls: prev.uploadedFileUrls.filter((_, i) => i !== index),
    }));
  };

  const handleAddWebsiteUrl = () => {
    setQuickCreateData((prev) => ({
      ...prev,
      websiteUrls: [...prev.websiteUrls, ""],
    }));
  };

  const handleRemoveWebsiteUrl = (index: number) => {
    setQuickCreateData((prev) => ({
      ...prev,
      websiteUrls: prev.websiteUrls.filter((_, i) => i !== index),
    }));
  };

  const handleWebsiteUrlChange = (index: number, value: string) => {
    setQuickCreateData((prev) => ({
      ...prev,
      websiteUrls: prev.websiteUrls.map((url, i) =>
        i === index ? value : url,
      ),
    }));
  };

  const handleAddSocialMediaUrl = () => {
    setQuickCreateData((prev) => ({
      ...prev,
      socialMediaUrls: [...prev.socialMediaUrls, ""],
    }));
  };

  const handleRemoveSocialMediaUrl = (index: number) => {
    setQuickCreateData((prev) => ({
      ...prev,
      socialMediaUrls: prev.socialMediaUrls.filter((_, i) => i !== index),
    }));
  };

  const handleSocialMediaUrlChange = (index: number, value: string) => {
    setQuickCreateData((prev) => ({
      ...prev,
      socialMediaUrls: prev.socialMediaUrls.map((url, i) =>
        i === index ? value : url,
      ),
    }));
  };

  const handleProceedToCreate = async () => {
    // Get the full template data (either edited or selected)
    let selectedTemplateData: GeneratedTemplate | null = null;

    if (quickCreateData.selectedTemplate) {
      // Try to find in AI-generated templates first
      const aiTemplate = aiGeneratedTemplates.find(
        (t) => t.name === quickCreateData.selectedTemplate,
      );
      if (aiTemplate) {
        selectedTemplateData = aiTemplate;
      } else {
        // Fallback to predefined templates
        const predefinedTemplate =
          aiEmployeeTemplates[quickCreateData.selectedTemplate];
        if (predefinedTemplate) {
          selectedTemplateData = predefinedTemplate;
        }
      }
    }

    // If no template selected, navigate to CreateAgent page to let user create manually
    if (!quickCreateData.selectedTemplate) {
      handleQuickCreateClose();
      navigate(`/agents/create`, {
        state: {
          quickCreateData: quickCreateData,
        },
      });
      return;
    }

    // If template IS selected, create agent directly via API
    console.log('🚀 [CREATE] Starting agent creation...');
    setIsCreatingAgent(true);
    console.log('🚀 [CREATE] isCreatingAgent set to TRUE');
    setKbCreationProgress({
      agentId: '',
      status: 'pending',
      progress: 0,
      message: 'Creating agent...',
    });
    console.log('🚀 [CREATE] Initial KB progress set');

    try {
      console.log(
        "📤 Creating agent with selected template:",
        quickCreateData.aiEmployeeName,
      );

      // Map voice to one of the valid enum values
      const validVoices = [
        "alloy",
        "echo",
        "fable",
        "onyx",
        "nova",
        "shimmer",
        "sage",
      ];
      let mappedVoice = "alloy"; // default

      if (selectedTemplateData?.voice) {
        const voiceLower = selectedTemplateData.voice.toLowerCase();
        // Try to find a matching voice
        if (validVoices.includes(voiceLower)) {
          mappedVoice = voiceLower;
        } else {
          // Use first valid voice as fallback
          mappedVoice = validVoices[0];
        }
      }

      // Filter and prepare website URLs
      const validWebsiteUrls = quickCreateData.websiteUrls.filter(
        (url) => url.trim().length > 0,
      );

      // Filter and prepare social media URLs
      const validSocialMediaUrls = quickCreateData.socialMediaUrls.filter(
        (url) => url.trim().length > 0,
      );

      // Use the uploaded file URLs from the API
      const knowledgeBaseFileUrls = quickCreateData.uploadedFileUrls;

      const agentPayload = {
        name: quickCreateData.aiEmployeeName,
        gender: "female",
        business_process: quickCreateData.businessProcess,
        industry: quickCreateData.industry,
        personality: selectedTemplateData?.personality || "Professional",
        language: "English (US)",
        voice: mappedVoice,
        custom_instructions: selectedTemplateData?.description || "",
        guardrails_level: "medium",
        response_style: "Balanced",
        max_response_length: "Medium (150 words)",
        context_window: "Standard (8K tokens)",
        temperature: 0.5, // Must be <= 1 (temperature scale is 0-1, not 0-100)
        // Template object with all details - replace placeholders with actual values
        template: selectedTemplateData
          ? {
              name: selectedTemplateData.name,
              description: replaceTemplatePlaceholders(selectedTemplateData.description),
              icon: selectedTemplateData.icon,
              features: selectedTemplateData.features,
              systemPrompt: replaceTemplatePlaceholders(selectedTemplateData.systemPrompt),
              firstMessage: replaceTemplatePlaceholders(selectedTemplateData.firstMessage),
              openingScript: replaceTemplatePlaceholders(selectedTemplateData.openingScript),
              keyTalkingPoints: replaceTemplatePlaceholders(selectedTemplateData.keyTalkingPoints),
              closingScript: replaceTemplatePlaceholders(selectedTemplateData.closingScript),
              objections: selectedTemplateData.objections,
              conversationExamples: selectedTemplateData.conversationExamples,
            }
          : undefined,
        // Knowledge base URLs
        website_urls: validWebsiteUrls,
        social_media_urls: validSocialMediaUrls,
        knowledge_base_file_urls: knowledgeBaseFileUrls,
      };

      console.log("📤 Agent payload:", agentPayload);
      console.log("📄 Website URLs:", validWebsiteUrls);
      console.log("� Social Media URLs:", validSocialMediaUrls);
      console.log("�📎 Knowledge Base Files:", knowledgeBaseFileUrls);

      // Call the agent creation API
      const newAgent = await agentAPI.createAgent(agentPayload);

      console.log('✅ Agent created successfully:', newAgent);
      console.log('✅ New Agent ID:', newAgent?.id);

      // Update progress to show agent created
      console.log('✅ [CREATE] Agent created, updating progress...');
      setKbCreationProgress({
        agentId: newAgent?.id || '',
        status: 'processing',
        progress: 0,
        message: 'Agent created! Setting up knowledge base...',
      });
      console.log('✅ [CREATE] Progress updated to processing');

      // KB progress is tracked via global callback set in useEffect
      // Just wait - the callback will update state and close modal when done
      
      console.log('✅ Agent creation complete, waiting for KB progress via WebSocket...');
    } catch (error) {
      console.error("❌ Error creating agent:", error);

      setIsCreatingAgent(false);
      setKbCreationProgress(null);

      // Show error toast
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create agent. Please try again.";
      toast.error(errorMessage, {
        duration: 4000,
      });
    }
  };

  const canProceedToNextStep = () => {
    switch (quickCreateStep) {
      case 1:
        return (
          quickCreateData.companyName.trim().length > 0 &&
          quickCreateData.aiEmployeeName.trim().length > 0
        );
      case 2:
        return quickCreateData.businessProcess.length > 0;
      case 3:
        return quickCreateData.industry.length > 0;
      case 4:
        return true; // Sub-industry is optional
      case 5:
        return true; // Website URLs are optional
      case 6:
        return true; // Template selection is optional
      default:
        return false;
    }
  };

  const [publishingAgents, setPublishingAgents] = useState<Set<string>>(
    new Set(),
  );
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [kbCreationProgress, setKbCreationProgress] = useState<KnowledgeBaseProgress | null>(null);
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

  // Connect to WebSocket for knowledge base tracking
  useEffect(() => {
    const connectSocket = async () => {
      if (user?.id) {
        console.log('🔌 [KB Socket] Attempting to connect with userId:', user.id);
        try {
          await knowledgeBaseSocket.connect(user.id);
          console.log('✅ [KB Socket] Connection completed for user:', user.id);
        } catch (error) {
          console.error('❌ [KB Socket] Failed to connect:', error);
        }
      }
    };

    // Connect immediately if user is available
    if (user?.id) {
      connectSocket();
    }

    return () => {
      knowledgeBaseSocket.clearCallback();
    };
  }, [user?.id]);

  // Set up global KB progress callback when creating agent
  useEffect(() => {
    if (isCreatingAgent) {
      console.log('📡 Setting up KB progress listener...');
      const agentName = quickCreateData.aiEmployeeName;
      
      knowledgeBaseSocket.onProgress((progress) => {
        console.log('📊 KB Progress:', progress.status, progress.progress, '%', progress.message);
        
        // Update progress state
        setKbCreationProgress(progress);
        
        if (progress.status === 'completed') {
          console.log('🏁 KB creation completed!');
          
          // Refresh agents and close modal
          refreshAgents();
          
          setTimeout(() => {
            setIsCreatingAgent(false);
            setKbCreationProgress(null);
            setShowQuickCreateModal(false);
            setQuickCreateStep(1);
            setAIGeneratedTemplates([]);
            setQuickCreateData({
              companyName: "",
              aiEmployeeName: "",
              businessProcess: "",
              industry: "",
              subIndustry: "",
              websiteUrls: [""],
              socialMediaUrls: [""],
              uploadedFiles: [],
              uploadedFileUrls: [],
              selectedTemplate: null,
            });
            
            toast.success(`✅ ${agentName} has been created successfully!`, { duration: 3000 });
            setSortBy("newest");
            navigate("/agents?page=1");
          }, 500);
        } else if (progress.status === 'failed') {
          console.error('❌ KB creation failed:', progress.error);
          
          setIsCreatingAgent(false);
          setKbCreationProgress(null);
          setShowQuickCreateModal(false);
          
          toast.error(progress.error || 'Knowledge base creation failed.', { duration: 5000 });
          refreshAgents();
          navigate("/agents?page=1");
        }
      });
    } else {
      knowledgeBaseSocket.clearCallback();
    }
  }, [isCreatingAgent]);

  // Blur any focused element when Quick Create modal opens to prevent keyboard auto-open on mobile
  useEffect(() => {
    if (showQuickCreateModal) {
      // Blur any currently focused element
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [showQuickCreateModal]);

  useEffect(() => {
    if (id) {
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
  }, [id, agents, setCurrentAgent]);

  // Refresh agents when navigating back from edit page
  useEffect(() => {
    if (location.state?.refresh) {
      refreshAgents();
      // Clear the state to prevent re-fetching on subsequent renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.refresh, refreshAgents, navigate, location.pathname]);

  // Fetch session history from API
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
    setShowPublishConfirm(true);
  };

  const handlePublishConfirm = async () => {
    if (!agentToPublish) return;

    setIsPublishing(true);
    try {
      // Add to publishing set for loading state
      setPublishingAgents((prev) => new Set(prev).add(agentToPublish));

      await publishAgentStatus(agentToPublish);
      await refreshAgents();
      console.log("✅ Agent published successfully");
      
      // Show success toast
      toast.success("Agent published successfully!", { duration: 3000 });
      setShowPublishConfirm(false);
      setAgentToPublish(null);
    } catch (error: any) {
      console.error("❌ Error publishing agent:", error);
      toast.error(error.message || "Failed to publish agent. Please try again.", { duration: 4000 });
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
      await refreshAgents();
      console.log("✅ Agent paused successfully");
      
      // Show success toast
      toast.success("Agent paused successfully!", { duration: 3000 });
      setShowPauseConfirm(false);
      setAgentToPause(null);
    } catch (error: any) {
      console.error("❌ Error pausing agent:", error);
      toast.error(error.message || "Failed to pause agent. Please try again.", { duration: 4000 });
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
    try {
      await deleteAgent(agentToDelete);
      await refreshAgents();
      console.log("✅ Agent deleted successfully");
      setShowDeleteConfirm(false);
      setAgentToDelete(null);

      // If we're viewing the deleted agent, navigate back to list
      if (currentAgent?.id === agentToDelete) {
        navigate("/agents");
      }
    } catch (error: any) {
      console.error("❌ Error deleting agent:", error);
      alert(error.message || "Failed to delete agent. Please try again.");
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
      const fallbackFiltered = agents
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
    agents,
  ]);

  // Fetch agents when filters or page changes
  useEffect(() => {
    fetchFilteredAgents();
  }, [fetchFilteredAgents]);

  // Paginated agents are now directly from API response
  const paginatedAgents = filteredAgents;

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
                {isDeveloper ? agents.length : 0}
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
            onClick={() => isDeveloper && setShowQuickCreateModal(true)}
            disabled={!isDeveloper}
            className={`relative overflow-hidden flex items-center justify-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl transition-all duration-200 shadow-sm whitespace-nowrap ${
              isDeveloper
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
          <>
            {console.log('🎨 [Render] Rendering', paginatedAgents.length, 'agents')}
            {console.log('🎨 [Render] Paginated agent IDs:', paginatedAgents.map(a => a.id))}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {paginatedAgents.map((agent) => {
              return (
              <GlassCard key={agent.id} hover>
                <div className="p-4 sm:p-5 lg:p-6 relative">
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
                            agent.status === "Published" ||
                            (agent as any).is_active
                              ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                          }`}
                        >
                          {agent.status === "Published" ||
                          (agent as any).is_active
                            ? "Live"
                            : "Unpublished"}
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
                      <span className="text-slate-800 dark:text-white ml-2">
                        {new Date(agent.createdAt).toLocaleDateString()}
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

                    <button
                      onClick={() => {
                        setAgentForIntegration(agent.id);
                        setShowIntegrationCodeModal(true);
                      }}
                      className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95"
                      title="Copy integration code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

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
          </>
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
                      <code className="common-bg-icons block w-full p-4 rounded-lg text-xs sm:text-sm font-mono text-slate-800 dark:text-white overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {`<script src="https://callshivai.com/widget2.js?agentId=${agentForIntegration}"><\/script>`}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `<script src="https://callshivai.com/widget2.js?agentId=${agentForIntegration}"><\/script>`
                          );
                          toast.success("Code copied to clipboard!", { duration: 2000 });
                        }}
                        className="absolute top-3 right-3 p-2 common-button-bg rounded-lg hover:shadow-sm transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
                      >
                        <Copy className="w-4 h-4 text-white" />
                      </button>
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

        {/* Quick Create AI Employee Modal */}
        {showQuickCreateModal &&
          createPortal(
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4"
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60"
              />

              {/* Modal */}
              <div
                className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl h-auto  sm:max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700"
                tabIndex={-1}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                        Create AI Employee
                      </h2>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                        Step {quickCreateStep} of 6
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleQuickCreateClose}
                    disabled={isCreatingAgent}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                      isCreatingAgent
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="px-3 sm:px-5 pt-3 sm:pt-4 flex-shrink-0">
                  <div className="flex items-center gap-1 sm:gap-2">
                    {[1, 2, 3, 4, 5, 6].map((step) => (
                      <div key={step} className="flex-1 flex items-center">
                        <div
                          className={`h-1.5 sm:h-2 w-full rounded-full transition-all duration-300 ${
                            step <= quickCreateStep
                              ? "bg-blue-400 dark:bg-blue-500"
                              : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 py-4 sm:p-5 overflow-y-auto flex-1 min-h-0 ">
                  {/* Step 1: Company Name & AI Employee Name */}
                  {quickCreateStep === 1 && (
                    <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                      <div className="text-center mb-4 sm:mb-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
                          <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-1 sm:mb-2">
                          Let's get started!
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto px-2">
                          Enter your company name and give your AI a friendly
                          name. This helps personalize conversations with your
                          customers.
                        </p>
                      </div>

                      {/* Company Name Input */}
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={quickCreateData.companyName}
                          onChange={(e) =>
                            setQuickCreateData((prev) => ({
                              ...prev,
                              companyName: e.target.value,
                            }))
                          }
                          placeholder="e.g., Acme Corporation"
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                        />
                      </div>

                      {/* AI Employee Name Input */}
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          AI Employee Name
                        </label>
                        <input
                          type="text"
                          value={quickCreateData.aiEmployeeName}
                          onChange={(e) =>
                            setQuickCreateData((prev) => ({
                              ...prev,
                              aiEmployeeName: e.target.value,
                            }))
                          }
                          placeholder="e.g., Alex, Sarah, Max"
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                        />
                        <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
                          This is how your AI Employee will introduce itself to
                          callers
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Business Process */}
                  {quickCreateStep === 2 && (
                    <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                      <div className="text-center mb-4 sm:mb-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
                          <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-1 sm:mb-2">
                          What should your AI Employee do?
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto px-2">
                          Select the main task your AI will handle. This
                          determines how it responds and what skills it
                          prioritizes.
                        </p>
                      </div>

                      {/* Business Process Slider */}
                      <div className="relative">
                        {/* Navigation Arrows */}
                        <button
                          onClick={() =>
                            setBusinessProcessSlideIndex(
                              Math.max(0, businessProcessSlideIndex - 1),
                            )
                          }
                          disabled={businessProcessSlideIndex === 0}
                          className={`absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all ${
                            businessProcessSlideIndex === 0
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110"
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
                        </button>

                        <button
                          onClick={() =>
                            setBusinessProcessSlideIndex(
                              Math.min(
                                Math.ceil(businessProcessOptions.length / 2) -
                                  1,
                                businessProcessSlideIndex + 1,
                              ),
                            )
                          }
                          disabled={
                            businessProcessSlideIndex >=
                            Math.ceil(businessProcessOptions.length / 2) - 1
                          }
                          className={`absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all ${
                            businessProcessSlideIndex >=
                            Math.ceil(businessProcessOptions.length / 2) - 1
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110"
                          }`}
                        >
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
                        </button>

                        {/* Cards Container - 2 cards per slide */}
                        <div 
                          className="overflow-x-auto px-1 sm:px-2 touch-pan-x snap-x [&::-webkit-scrollbar]:hidden"
                          style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none'
                          }}
                        >
                          <div
                            className="flex transition-transform duration-300 ease-out"
                            style={{
                              transform: `translateX(-${businessProcessSlideIndex * 100}%)`,
                            }}
                          >
                            {Array.from({
                              length: Math.ceil(
                                businessProcessOptions.length / 2,
                              ),
                            }).map((_, slideIdx) => (
                              <div
                                key={slideIdx}
                                className="flex gap-2 sm:gap-4 min-w-full flex-shrink-0"
                              >
                                {businessProcessOptions
                                  .slice(slideIdx * 2, slideIdx * 2 + 2)
                                  .map((option) => (
                                    <button
                                      key={option.value}
                                      onClick={() =>
                                        setQuickCreateData((prev) => ({
                                          ...prev,
                                          businessProcess: option.value,
                                        }))
                                      }
                                      className={`flex-1 p-3 sm:p-4 rounded-xl border-2 text-center transition-colors duration-200 relative ${
                                        quickCreateData.businessProcess ===
                                        option.value
                                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                                          : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-slate-800/50"
                                      }`}
                                    >
                                      {quickCreateData.businessProcess ===
                                        option.value && (
                                        <CheckCircle className="w-4 h-4 text-blue-500 absolute top-2 right-2" />
                                      )}
                                      <span className="text-2xl sm:text-3xl mb-1 sm:mb-2 block">
                                        {option.icon}
                                      </span>
                                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white block">
                                        {option.label}
                                      </span>
                                    </button>
                                  ))}
                                {businessProcessOptions.slice(
                                  slideIdx * 2,
                                  slideIdx * 2 + 2,
                                ).length === 1 && <div className="flex-1" />}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Dots Indicator */}
                        <div className="flex justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                          {Array.from({
                            length: Math.ceil(
                              businessProcessOptions.length / 2,
                            ),
                          }).map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setBusinessProcessSlideIndex(idx)}
                              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                                businessProcessSlideIndex === idx
                                  ? "bg-blue-500 w-4 sm:w-6"
                                  : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Industry */}
                  {quickCreateStep === 3 && (
                    <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                      <div className="text-center mb-4 sm:mb-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
                          <Factory className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-1 sm:mb-2">
                          What industry are you in?
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto px-2">
                          Your AI will use industry-specific language,
                          understand common terms, and follow your industry best
                          practices.
                        </p>
                      </div>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setIndustrySlideIndex(
                              Math.max(0, industrySlideIndex - 1),
                            )
                          }
                          disabled={industrySlideIndex === 0}
                          className={`absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all ${
                            industrySlideIndex === 0
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110"
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
                        </button>

                        <button
                          onClick={() =>
                            setIndustrySlideIndex(
                              Math.min(
                                Math.ceil(industryOptions.length / 6) - 1,
                                industrySlideIndex + 1,
                              ),
                            )
                          }
                          disabled={
                            industrySlideIndex >=
                            Math.ceil(industryOptions.length / 6) - 1
                          }
                          className={`absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all ${
                            industrySlideIndex >=
                            Math.ceil(industryOptions.length / 6) - 1
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110"
                          }`}
                        >
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
                        </button>

                        {/* Cards Container */}
                        <div 
                          className="overflow-x-auto px-1 sm:px-2 touch-pan-x snap-x [&::-webkit-scrollbar]:hidden"
                          style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none'
                          }}
                        >
                          <div
                            className="flex transition-transform duration-300 ease-out"
                            style={{
                              transform: `translateX(-${industrySlideIndex * 100}%)`,
                            }}
                          >
                            {Array.from({
                              length: Math.ceil(industryOptions.length / 6),
                            }).map((_, slideIdx) => (
                              <div
                                key={slideIdx}
                                className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 min-w-full"
                              >
                                {industryOptions
                                  .slice(slideIdx * 6, slideIdx * 6 + 6)
                                  .map((option) => (
                                    <button
                                      key={option.value}
                                      onClick={() =>
                                        setQuickCreateData((prev) => ({
                                          ...prev,
                                          industry: option.value,
                                          subIndustry: "",
                                        }))
                                      }
                                      className={`p-2 sm:p-3 rounded-xl border-2 text-center transition-colors duration-200 relative ${
                                        quickCreateData.industry ===
                                        option.value
                                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                                          : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-slate-800/50"
                                      }`}
                                    >
                                      {quickCreateData.industry ===
                                        option.value && (
                                        <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500 absolute top-1 right-1 sm:top-1.5 sm:right-1.5" />
                                      )}
                                      <span className="text-xl sm:text-2xl mb-0.5 sm:mb-1 block">
                                        {option.icon}
                                      </span>
                                      <span className="text-[10px] sm:text-xs font-medium text-slate-800 dark:text-white leading-tight">
                                        {option.label}
                                      </span>
                                    </button>
                                  ))}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Dots Indicator */}
                        <div className="flex justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                          {Array.from({
                            length: Math.ceil(industryOptions.length / 6),
                          }).map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setIndustrySlideIndex(idx)}
                              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                                industrySlideIndex === idx
                                  ? "bg-blue-500 w-4 sm:w-6"
                                  : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Sub-Industry */}
                  {quickCreateStep === 4 && (
                    <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                      <div className="text-center mb-4 sm:mb-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
                          <Layers className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-1 sm:mb-2">
                          Specify your niche
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto px-2">
                          Select a sub-category for{" "}
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {
                              industryOptions.find(
                                (i) => i.value === quickCreateData.industry,
                              )?.label
                            }
                          </span>{" "}
                          to help your AI understand specific terminology and
                          practices.
                        </p>
                      </div>
                      {quickCreateData?.industry &&
                      subIndustryOptions[quickCreateData?.industry] ? (
                        <div className="relative">
                          {/* Navigation Buttons */}
                          <button
                            onClick={() =>
                              setSubIndustrySlideIndex(
                                Math.max(0, subIndustrySlideIndex - 1),
                              )
                            }
                            disabled={subIndustrySlideIndex === 0}
                            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center transition-all duration-200 ${
                              subIndustrySlideIndex === 0
                                ? "opacity-30 cursor-not-allowed"
                                : "hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-orange-300 dark:hover:border-orange-600"
                            }`}
                          >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
                          </button>

                          <button
                            onClick={() =>
                              setSubIndustrySlideIndex(
                                Math.min(
                                  Math.ceil(
                                    subIndustryOptions[quickCreateData.industry]
                                      .length / 6,
                                  ) - 1,
                                  subIndustrySlideIndex + 1,
                                ),
                              )
                            }
                            disabled={
                              subIndustrySlideIndex >=
                              Math.ceil(
                                subIndustryOptions[quickCreateData.industry]
                                  .length / 6,
                              ) -
                                1
                            }
                            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center transition-all duration-200 ${
                              subIndustrySlideIndex >=
                              Math.ceil(
                                subIndustryOptions[quickCreateData.industry]
                                  .length / 6,
                              ) -
                                1
                                ? "opacity-30 cursor-not-allowed"
                                : "hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-orange-300 dark:hover:border-orange-600"
                            }`}
                          >
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
                          </button>

                          {/* Cards Container */}
                          <div 
                            className="overflow-x-auto px-1 sm:px-2 touch-pan-x snap-x [&::-webkit-scrollbar]:hidden"
                            style={{
                              scrollbarWidth: 'none',
                              msOverflowStyle: 'none'
                            }}
                          >
                            <div
                              className="flex transition-transform duration-300 ease-out"
                              style={{
                                transform: `translateX(-${subIndustrySlideIndex * 100}%)`,
                              }}
                            >
                              {Array.from({
                                length: Math.ceil(
                                  subIndustryOptions[quickCreateData.industry]
                                    .length / 6,
                                ),
                              }).map((_, slideIdx) => (
                                <div
                                  key={slideIdx}
                                  className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 min-w-full auto-rows-fr"
                                >
                                  {subIndustryOptions[quickCreateData.industry]
                                    .slice(slideIdx * 6, slideIdx * 6 + 6)
                                    .map((option) => (
                                      <button
                                        key={option.value}
                                        onClick={() =>
                                          setQuickCreateData((prev) => ({
                                            ...prev,
                                            subIndustry: option.value,
                                          }))
                                        }
                                        className={`p-2 sm:p-3 rounded-xl border-2 text-center transition-colors duration-200 relative h-[70px] sm:h-[80px] flex items-center justify-center ${
                                          quickCreateData.subIndustry ===
                                          option.value
                                            ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-md"
                                            : "border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 bg-white dark:bg-slate-800/50"
                                        }`}
                                      >
                                        {quickCreateData.subIndustry ===
                                          option.value && (
                                          <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500 absolute top-1 right-1 sm:top-1.5 sm:right-1.5" />
                                        )}
                                        <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white px-1 leading-tight">
                                          {option.label}
                                        </span>
                                      </button>
                                    ))}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Slide Indicators */}
                          {Math.ceil(
                            subIndustryOptions[quickCreateData.industry]
                              .length / 6,
                          ) > 1 && (
                            <div className="flex justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                              {Array.from({
                                length: Math.ceil(
                                  subIndustryOptions[quickCreateData.industry]
                                    .length / 6,
                                ),
                              }).map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setSubIndustrySlideIndex(idx)}
                                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                                    idx === subIndustrySlideIndex
                                      ? "w-6 sm:w-8 bg-orange-500"
                                      : "w-1.5 sm:w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                          <p>
                            No sub-industries available for selected industry
                          </p>
                          <p className="text-sm mt-2">You can skip this step</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 5: Knowledge Base */}
                  {quickCreateStep === 5 && (
                    <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                      <div className="text-center mb-4 sm:mb-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
                          <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-1 sm:mb-2">
                          Train Your AI
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto px-2">
                          Upload your documents, FAQs, or website links. Your AI
                          will learn from these to give accurate,
                          company-specific answers.
                        </p>
                      </div>

                      {/* Scrollable Content Container */}
                      <div 
                        className=" space-y-3 sm:space-y-4 [&::-webkit-scrollbar]:hidden"
                        style={{
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none'
                        }}
                      >
                        {/* File Upload Section */}
                        <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          Upload Files
                        </label>

                        {/* Drop Zone */}
                        <div
                          className={`border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 sm:p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-800/50 ${isUploadingFiles ? 'opacity-50 pointer-events-none' : ''}`}
                          onClick={() =>
                            !isUploadingFiles && document
                              .getElementById("knowledge-file-input")
                              ?.click()
                          }
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (!isUploadingFiles) {
                              e.currentTarget.classList.add(
                                "border-blue-400",
                                "bg-blue-50/50",
                              );
                            }
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove(
                              "border-blue-400",
                              "bg-blue-50/50",
                            );
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove(
                              "border-blue-400",
                              "bg-blue-50/50",
                            );
                            if (!isUploadingFiles) {
                              const files = Array.from(e.dataTransfer.files);
                              handleKnowledgeBaseUpload(files);
                            }
                          }}
                        >
                          <input
                            id="knowledge-file-input"
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/png,image/jpeg,image/gif,image/webp"
                            className="hidden"
                            disabled={isUploadingFiles}
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              handleKnowledgeBaseUpload(files);
                              e.target.value = "";
                            }}
                          />
                          <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                            {isUploadingFiles ? (
                              <>
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                  Uploading files...
                                </p>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 sm:gap-3 text-slate-400">
                                  <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
                                  <Image className="w-6 h-6 sm:w-8 sm:h-8" />
                                  <File className="w-6 h-6 sm:w-8 sm:h-8" />
                                </div>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                  <span className="text-blue-500 font-medium">
                                    Click to upload
                                  </span>{" "}
                                  or drag and drop
                                </p>
                                <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
                                  PDF, DOC, TXT, CSV, Excel, Images (max 10MB each)
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Uploaded Files List */}
                        {quickCreateData.uploadedFiles.length > 0 && (
                          <div className="space-y-1.5 sm:space-y-2 max-h-24 sm:max-h-32 overflow-y-auto">
                            {quickCreateData.uploadedFiles.map(
                              (file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
                                >
                                  {file.type.includes("image") ? (
                                    <Image className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                                  ) : file.type.includes("pdf") ? (
                                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                                  ) : (
                                    <File className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                                  )}
                                  <span className="flex-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 truncate">
                                    {file.name}
                                  </span>
                                  <span className="text-[10px] sm:text-xs text-slate-400 hidden sm:inline">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </span>
                                  {quickCreateData.uploadedFileUrls[index] && (
                                    <span className="text-[10px] sm:text-xs text-green-500">
                                      ✓
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleRemoveKnowledgeBaseFile(index)}
                                    disabled={isUploadingFiles}
                                    className="p-0.5 sm:p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                                  >
                                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </button>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>

                      {/* Website URLs Section */}
                      <div className="space-y-2 sm:space-y-3">
                        <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Link className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Website URLs
                        </label>
                        {quickCreateData.websiteUrls.map((url, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1.5 sm:gap-2"
                          >
                            <input
                              type="url"
                              value={url}
                              onChange={(e) =>
                                handleWebsiteUrlChange(index, e.target.value)
                              }
                              placeholder="https://yourcompany.com"
                              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                            />
                            {quickCreateData.websiteUrls.length > 1 && (
                              <button
                                onClick={() => handleRemoveWebsiteUrl(index)}
                                className="p-2 sm:p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                              >
                                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={handleAddWebsiteUrl}
                          className="w-full py-2 sm:py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
                        >
                          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Add another URL
                        </button>
                      </div>

                      {/* Social Media URLs Section */}
                      <div className="space-y-2 sm:space-y-3">
                        <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Social Media Links
                        </label>
                        {quickCreateData.socialMediaUrls.map((url, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1.5 sm:gap-2"
                          >
                            <input
                              type="url"
                              value={url}
                              onChange={(e) =>
                                handleSocialMediaUrlChange(index, e.target.value)
                              }
                              placeholder="https://facebook.com/yourpage or https://x.com/yourhandle"
                              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                            />
                            {quickCreateData.socialMediaUrls.length > 1 && (
                              <button
                                onClick={() => handleRemoveSocialMediaUrl(index)}
                                className="p-2 sm:p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                              >
                                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={handleAddSocialMediaUrl}
                          className="w-full py-2 sm:py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
                        >
                          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Add social media link
                        </button>
                      </div>

                      {/* Summary */}
                      {(quickCreateData.uploadedFiles.length > 0 ||
                        quickCreateData.websiteUrls.some((u) => u.trim()) ||
                        quickCreateData.socialMediaUrls.some((u) => u.trim())) && (
                        <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                          <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400">
                            📚 {quickCreateData.uploadedFiles.length} file(s),{" "}
                            {
                              quickCreateData.websiteUrls.filter((u) =>
                                u.trim(),
                              ).length
                            }{" "}
                            URL(s), and{" "}
                            {
                              quickCreateData.socialMediaUrls.filter((u) =>
                                u.trim(),
                              ).length
                            }{" "}
                            social media link(s) will be added to knowledge base
                          </p>
                        </div>
                      )}
                      </div>
                      {/* End of Scrollable Content Container */}
                    </div>
                  )}

                  {/* Step 6: Template Selection with AI-Generated Templates */}
                  {quickCreateStep === 6 &&
                    (() => {
                      // Use AI-generated templates, fallback to scored templates
                      const templates =
                        aiGeneratedTemplates.length > 0
                          ? aiGeneratedTemplates
                          : getMatchingTemplatesScored().map((t) => ({
                              name: t.template.name,
                              description: t.template.description,
                              icon: t.template.icon,
                              features: t.template.features,
                            }));

                      console.log("📊 Template carousel:", {
                        totalTemplates: templates.length,
                        templates: templates.map((t) => t.name),
                        templateSlideIndex,
                      });

                      // Mobile: 1 card per slide, Desktop: 2 cards per slide
                      const isMobile = window.innerWidth < 768;
                      const cardsPerSlide = isMobile ? 1 : 2;
                      const totalSlides = Math.ceil(
                        templates.length / cardsPerSlide,
                      );

                      console.log("🎠 Carousel config:", {
                        isMobile,
                        cardsPerSlide,
                        totalSlides,
                        totalTemplates: templates.length,
                      });

                      return (
                        <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                          {/* Loading State - Show only while generating */}
                          {isGeneratingTemplates ? (
                            <div className="h-64 sm:h-80 flex items-center justify-center">
                              <div className="text-center space-y-6 sm:space-y-8">
                                {/* Animated Icon */}
                                <div className="flex justify-center">
                                  <div className="relative">
                                    {/* Pulsing Background Rings */}
                                 
                                    <div className="absolute inset-0 flex items-center justify-center animate-ping">
                                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-r from-pink-400/10 via-purple-400/10 to-blue-400/10"></div>
                                    </div>
                                    
                                    {/* Main Icon Container */}
                                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto">
                                      {/* Rotating Gradient Ring */}
                                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 animate-spin" style={{ animationDuration: '3s' }}></div>
                                      <div className="absolute inset-1 rounded-full bg-white dark:bg-slate-900"></div>
                                      
                                      {/* Center Icon - Aimark Logo */}
                                      <div className="absolute inset-0 flex items-center justify-center p-3">
                                        <img 
                                          src="/Aimark2.png"
                                          alt="AI Bot"
                                          className="w-full h-full object-contain animate-pulse"
                                          style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))' }}
                                        />
                                      </div>
                                      
                                      {/* Orbiting Dots */}
                                      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s' }}>
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-pink-500"></div>
                                      </div>
                                      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s', animationDelay: '0.66s' }}>
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-purple-500"></div>
                                      </div>
                                      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s', animationDelay: '1.33s' }}>
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-500"></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Animated Text Messages */}
                                <div className="space-y-3">
                                  <div className="h-8 sm:h-10 flex items-center justify-center overflow-hidden">
                                    <div className="animate-slideUp">
                                      <p className="text-base sm:text-lg font-semibold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent whitespace-nowrap">
                                        {generationProgress < 20 && "✨ Analyzing your business..."}
                                        {generationProgress >= 20 && generationProgress < 40 && "🎯 Understanding your industry..."}
                                        {generationProgress >= 40 && generationProgress < 60 && "🚀 Creating something amazing..."}
                                        {generationProgress >= 60 && generationProgress < 80 && "💡 Crafting perfect templates..."}
                                        {generationProgress >= 80 && generationProgress < 95 && "🎨 Adding final touches..."}
                                        {generationProgress >= 95 && "✅ Almost ready!"}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Progress Indicator */}
                                  <div className="max-w-xs mx-auto space-y-2">
                                    <div className="flex justify-between items-center text-xs sm:text-sm">
                                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                                        {generationProgress < 100 ? "Processing..." : "Complete!"}
                                      </span>
                                      <span className="text-slate-700 dark:text-slate-300 font-semibold">
                                        {Math.round(generationProgress)}%
                                      </span>
                                    </div>
                                    {/* Modern Progress Bar */}
                                    <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                      <div 
                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${generationProgress}%` }}
                                      >
                                        {/* Shimmer Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Subtle Hint Text */}
                                  <p className="text-xs text-slate-500 dark:text-slate-500 animate-pulse">
                                    Hang tight, we're building your AI Employee in 
                                    <span className="font-semibold text-purple-600 dark:text-purple-400"> 5 simple steps</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Header */}
                              <div className="text-center mb-4 sm:mb-6">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
                                  <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-pink-600 dark:text-pink-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-1 sm:mb-2">
                                  Recommended Templates
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto px-2">
                                  Based on your selections, here are the best
                                  templates for your AI Employee.
                                </p>
                              </div>

                              {/* Selection Summary - Minimalist Version */}
                              {(quickCreateData.businessProcess ||
                                quickCreateData.industry ||
                                quickCreateData.subIndustry) && (
                                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                                  {quickCreateData.businessProcess && (
                                    <span className="px-2 sm:px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-[10px] sm:text-xs font-medium">
                                      {
                                        businessProcessOptions.find(
                                          (b) =>
                                            b.value ===
                                            quickCreateData.businessProcess,
                                        )?.icon
                                      }{" "}
                                      {
                                        businessProcessOptions.find(
                                          (b) =>
                                            b.value ===
                                            quickCreateData.businessProcess,
                                        )?.label
                                      }
                                    </span>
                                  )}
                                  {quickCreateData.industry && (
                                    <span className="px-2 sm:px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-[10px] sm:text-xs font-medium">
                                      {
                                        industryOptions.find(
                                          (i) =>
                                            i.value ===
                                            quickCreateData.industry,
                                        )?.icon
                                      }{" "}
                                      {
                                        industryOptions.find(
                                          (i) =>
                                            i.value ===
                                            quickCreateData.industry,
                                        )?.label
                                      }
                                    </span>
                                  )}
                                  {quickCreateData.subIndustry && (
                                    <span className="px-2 sm:px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-[10px] sm:text-xs font-medium">
                                      {
                                        subIndustryOptions[
                                          quickCreateData.industry
                                        ]?.find(
                                          (s) =>
                                            s.value ===
                                            quickCreateData.subIndustry,
                                        )?.label
                                      }
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Template Slider - 2 cards per slide */}
                              <div className="relative">
                                {/* Navigation Arrows */}
                                <button
                                  onClick={() =>
                                    setTemplateSlideIndex(
                                      Math.max(0, templateSlideIndex - 1),
                                    )
                                  }
                                  disabled={templateSlideIndex === 0}
                                  className={`absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all ${
                                    templateSlideIndex === 0
                                      ? "opacity-40 cursor-not-allowed"
                                      : "hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110"
                                  }`}
                                >
                                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
                                </button>

                                <button
                                  onClick={() =>
                                    setTemplateSlideIndex(
                                      Math.min(
                                        totalSlides - 1,
                                        templateSlideIndex + 1,
                                      ),
                                    )
                                  }
                                  disabled={
                                    templateSlideIndex >= totalSlides - 1
                                  }
                                  className={`absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all ${
                                    templateSlideIndex >= totalSlides - 1
                                      ? "opacity-40 cursor-not-allowed"
                                      : "hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110"
                                  }`}
                                >
                                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
                                </button>

                                {/* Cards Container - 1 card per slide on mobile, 2 on desktop */}
                                <div 
                                  className="overflow-x-auto px-1 sm:px-2 touch-pan-x snap-x [&::-webkit-scrollbar]:hidden"
                                  style={{
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none'
                                  }}
                                >
                                  <div
                                    className="flex transition-transform duration-300 ease-out"
                                    style={{
                                      transform: `translateX(-${templateSlideIndex * 100}%)`,
                                    }}
                                  >
                                    {isGeneratingTemplates ? (
                                      <div className="w-full h-64 flex items-center justify-center">
                                        <div className="text-center">
                                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-3"></div>
                                          <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Generating templates...
                                          </p>
                                        </div>
                                      </div>
                                    ) : templateGenerationError ? (
                                      <div className="w-full h-64 flex items-center justify-center">
                                        <div className="text-center">
                                          <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                                            {templateGenerationError}
                                          </p>
                                          <button
                                            onClick={() =>
                                              generateAITemplates()
                                            }
                                            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                          >
                                            Retry
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      Array.from({ length: totalSlides }).map(
                                        (_, slideIdx) => {
                                          const slideCards = templates.slice(
                                            slideIdx * cardsPerSlide,
                                            slideIdx * cardsPerSlide +
                                              cardsPerSlide,
                                          );
                                          return (
                                            <div
                                              key={slideIdx}
                                              className="flex gap-2 sm:gap-4 min-w-full flex-shrink-0 justify-center sm:justify-start"
                                            >
                                              {slideCards.map(
                                                (template, idx) => {
                                                  const templateKey = `${slideIdx}-${idx}`;
                                                  const isSelected =
                                                    quickCreateData.selectedTemplate ===
                                                    template.name;
                                                  return (
                                                    <div
                                                      key={templateKey}
                                                      onClick={() =>
                                                        setQuickCreateData(
                                                          (prev) => ({
                                                            ...prev,
                                                            selectedTemplate:
                                                              isSelected
                                                                ? null
                                                                : template.name,
                                                          }),
                                                        )
                                                      }
                                                      className={`${isMobile ? "w-full max-w-xs" : " max-w-[260px]"} p-3 sm:p-4 rounded-xl border-2 text-left transition-colors duration-200 relative cursor-pointer ${
                                                        quickCreateData.selectedTemplate ===
                                                        template.name
                                                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                                                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50"
                                                      }`}
                                                    >
                                                      {quickCreateData.selectedTemplate ===
                                                        template.name && (
                                                        <CheckCircle className="w-4 h-4 text-blue-500 absolute top-2 right-2" />
                                                      )}

                                                      <div className="flex flex-col h-full mt-1">
                                                        <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                                                          <span className="text-xl sm:text-2xl">
                                                            {template.icon}
                                                          </span>
                                                          <h4 className="font-semibold text-slate-800 dark:text-white text-xs sm:text-sm flex-1">
                                                            {template.name}
                                                          </h4>
                                                        </div>
                                                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2 line-clamp-2 max-w-[260px]">
                                                          {template.description}
                                                        </p>

                                                        <div className="flex flex-wrap gap-1 mb-2">
                                                          {template.features
                                                            .slice(0, 2)
                                                            .map(
                                                              (feature, i) => (
                                                                <span
                                                                  key={i}
                                                                  className="px-1.5 sm:px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[10px] sm:text-xs"
                                                                >
                                                                  {feature}
                                                                </span>
                                                              ),
                                                            )}
                                                        </div>

                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedTemplateForDetails(
                                                              template.name,
                                                            );
                                                            setShowTemplateDetails(
                                                              true,
                                                            );
                                                          }}
                                                          className="mt-auto pt-2 w-full px-2.5 py-1.5 sm:py-2 bg-blue-500/10 hover:bg-blue-500/20 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors border border-blue-200 dark:border-blue-900/30"
                                                        >
                                                          <Eye className="w-4 h-4" />
                                                          <span className="text-xs sm:text-sm">
                                                            View Details
                                                          </span>
                                                        </button>
                                                      </div>
                                                    </div>
                                                  );
                                                },
                                              )}
                                            </div>
                                          );
                                        },
                                      )
                                    )}
                                  </div>
                                </div>

                                {/* Dots Indicator */}
                                <div className="flex justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                                  {Array.from({ length: totalSlides }).map(
                                    (_, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() =>
                                          setTemplateSlideIndex(idx)
                                        }
                                        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                                          templateSlideIndex === idx
                                            ? "bg-blue-500 w-4 sm:w-6"
                                            : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
                                        }`}
                                      />
                                    ),
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}
                </div>

                {/* Footer */}
                <div className="p-3 sm:p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    {quickCreateStep > 1 ? (
                      <button
                        onClick={handleQuickCreateBack}
                        className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-sm"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Back
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {quickCreateStep === 6 && (
                        <button
                          onClick={() => {
                            handleQuickCreateClose();
                            navigate(`/agents/create`, {
                              state: {
                                quickCreateData: quickCreateData,
                              },
                            });
                          }}
                          className="hidden sm:flex items-center gap-2 px-4 py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        >
                          <SkipForward className="w-4 h-4" />
                          Skip & Configure Manually
                        </button>
                      )}

                      {quickCreateStep < 6 ? (
                        <button
                          onClick={handleQuickCreateNext}
                          disabled={!canProceedToNextStep()}
                          className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-medium transition-all text-sm sm:text-base ${
                            canProceedToNextStep()
                              ? "common-button-bg hover:scale-[1.02] active:scale-[0.98]"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                          }`}
                        >
                          Continue
                          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={handleProceedToCreate}
                          disabled={
                            isGeneratingTemplates ||
                            !quickCreateData.selectedTemplate ||
                            isCreatingAgent
                          }
                          className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-medium transition-all text-sm sm:text-base ${
                            isGeneratingTemplates ||
                            !quickCreateData.selectedTemplate ||
                            isCreatingAgent
                              ? "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                              : "common-button-bg hover:scale-[1.02] active:scale-[0.98]"
                          }`}
                        >
                          {isCreatingAgent ? (
                            <>
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>
                                {kbCreationProgress?.progress !== undefined ? `${Math.round(kbCreationProgress.progress)}%` : 'Creating...'}
                              </span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">
                                Create AI Employee
                              </span>
                              <span className="sm:hidden">Create</span>
                              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mobile Skip Button for Step 6 */}
                  {quickCreateStep === 6 && (
                    <button
                      onClick={() => {
                        handleQuickCreateClose();
                        navigate(`/agents/create`, {
                          state: {
                            quickCreateData: quickCreateData,
                          },
                        });
                      }}
                      className="sm:hidden w-full mt-2 flex items-center justify-center gap-2 py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      Skip & Configure Manually
                    </button>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )}

        {/* Template Details Modal */}
        {showTemplateDetails &&
          selectedTemplateForDetails &&
          createPortal(
            <div className="fixed inset-0 z-[65] flex items-center justify-center p-2 sm:p-4">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60"
              />

              {/* Modal */}
              <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl h-[95vh] sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-slate-100 dark:bg-slate-800">
                      {aiGeneratedTemplates.find(
                        (t) => t.name === selectedTemplateForDetails,
                      )?.icon ||
                        aiEmployeeTemplates[selectedTemplateForDetails]?.icon ||
                        "🤖"}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                        {selectedTemplateForDetails}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        AI Employee Template
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTemplateDetails(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-4">
                  {(() => {
                    // Try to find in AI-generated templates first, then fallback to predefined
                    const aiTemplate = aiGeneratedTemplates.find(
                      (t) => t.name === selectedTemplateForDetails,
                    );
                    const predefinedTemplate =
                      aiEmployeeTemplates[selectedTemplateForDetails];
                    const template = aiTemplate || predefinedTemplate;

                    if (!template) return null;

                    return (
                      <>
                        {/* Description */}
                        <div>
                          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Description
                          </h3>
                          {isEditingTemplate ? (
                            <textarea
                              value={editedTemplate?.description || ""}
                              onChange={(e) =>
                                setEditedTemplate((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={3}
                            />
                          ) : (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {aiTemplate?.description ||
                                predefinedTemplate?.description}
                            </p>
                          )}
                        </div>

                        {/* Key Features */}
                        <div>
                          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Key Features
                          </h3>
                          {isEditingTemplate ? (
                            <textarea
                              value={(editedTemplate?.features || []).join(
                                "\n",
                              )}
                              onChange={(e) =>
                                setEditedTemplate((prev) => ({
                                  ...prev,
                                  features: e.target.value
                                    .split("\n")
                                    .filter((f) => f.trim()),
                                }))
                              }
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={3}
                              placeholder="Enter features (one per line)"
                            />
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {(
                                aiTemplate?.features ||
                                predefinedTemplate?.features ||
                                []
                              ).map((feature, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* AI-Generated Template Specific Fields */}
                        {aiTemplate && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                Gender
                              </p>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                {aiTemplate.gender || "Not specified"}
                              </p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                Voice Type
                              </p>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                {aiTemplate.voice || "Not specified"}
                              </p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                Personality
                              </p>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                {aiTemplate.personality || "Not specified"}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Tone and Industry Focus (both templates) */}
                        {(aiTemplate?.tone || aiTemplate?.industryFocus) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {aiTemplate?.tone && (
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                  Tone
                                </p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                  {aiTemplate.tone}
                                </p>
                              </div>
                            )}
                            {aiTemplate?.industryFocus && (
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                  Industry Focus
                                </p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                  {aiTemplate.industryFocus}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* System Prompt */}
                        {(aiTemplate?.systemPrompt ||
                          template?.systemPrompt) && (
                          <div>
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                              System Prompt
                            </h3>
                            {isEditingTemplate ? (
                              <textarea
                                value={editedTemplate?.systemPrompt || ""}
                                onChange={(e) =>
                                  setEditedTemplate((prev) => ({
                                    ...prev,
                                    systemPrompt: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                rows={16}
                              />
                            ) : (
                              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 max-h-[40vh] overflow-y-auto">
                                <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-sans">
                                  {aiTemplate?.systemPrompt ||
                                    template?.systemPrompt}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}

                        {/* First Message */}
                        {(aiTemplate?.firstMessage ||
                          template?.firstMessage) && (
                          <div>
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                              First Message
                            </h3>
                            {isEditingTemplate ? (
                              <textarea
                                value={editedTemplate?.firstMessage || ""}
                                onChange={(e) =>
                                  setEditedTemplate((prev) => ({
                                    ...prev,
                                    firstMessage: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                              />
                            ) : (
                              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                                  "
                                  {replaceTemplatePlaceholders(aiTemplate?.firstMessage ||
                                    template?.firstMessage)}
                                  "
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Manual Knowledge / Knowledge Base */}
                        {aiTemplate?.manualKnowledge && (
                          <div>
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                              Knowledge Base
                            </h3>
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
                              <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-sans">
                                {aiTemplate.manualKnowledge}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Divider for Call Scripts */}
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">
                            Call Scripts
                          </h3>
                        </div>

                        {/* Call Scripts Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Opening Script */}
                          {(aiTemplate?.openingScript ||
                            template?.openingScript) && (
                            <div>
                              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Opening Script
                              </h3>
                              {isEditingTemplate ? (
                                <textarea
                                  value={editedTemplate?.openingScript || ""}
                                  onChange={(e) =>
                                    setEditedTemplate((prev) => ({
                                      ...prev,
                                      openingScript: e.target.value,
                                    }))
                                  }
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  rows={3}
                                />
                              ) : (
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto">
                                  <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                                    {aiTemplate?.openingScript ||
                                      template?.openingScript}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Key Talking Points */}
                          {(aiTemplate?.keyTalkingPoints ||
                            template?.keyTalkingPoints) && (
                            <div>
                              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Key Talking Points
                              </h3>
                              {isEditingTemplate ? (
                                <textarea
                                  value={editedTemplate?.keyTalkingPoints || ""}
                                  onChange={(e) =>
                                    setEditedTemplate((prev) => ({
                                      ...prev,
                                      keyTalkingPoints: e.target.value,
                                    }))
                                  }
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  rows={3}
                                />
                              ) : (
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto">
                                  <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                                    {aiTemplate?.keyTalkingPoints ||
                                      template?.keyTalkingPoints}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Closing Script */}
                          {(aiTemplate?.closingScript ||
                            template?.closingScript) && (
                            <div>
                              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Closing Script
                              </h3>
                              {isEditingTemplate ? (
                                <textarea
                                  value={editedTemplate?.closingScript || ""}
                                  onChange={(e) =>
                                    setEditedTemplate((prev) => ({
                                      ...prev,
                                      closingScript: e.target.value,
                                    }))
                                  }
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  rows={3}
                                />
                              ) : (
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto">
                                  <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                                    {aiTemplate?.closingScript ||
                                      template?.closingScript}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Divider for Training Data */}
                        {(aiTemplate?.objections?.length ||
                          aiTemplate?.conversationExamples?.length ||
                          aiTemplate?.intents?.length) && (
                          <>
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">
                                Training Data
                              </h3>
                            </div>

                            {/* Objections */}
                            {aiTemplate?.objections &&
                              aiTemplate.objections.length > 0 && (
                                <div>
                                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Objection Handling (
                                    {aiTemplate.objections.length})
                                  </h3>
                                  <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {aiTemplate.objections.map((obj, i) => (
                                      <div
                                        key={i}
                                        className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
                                      >
                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                          "{obj.objection}"
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                          → {obj.response}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {/* Conversation Examples */}
                            {aiTemplate?.conversationExamples &&
                              aiTemplate.conversationExamples.length > 0 && (
                                <div>
                                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Conversation Examples (
                                    {aiTemplate.conversationExamples.length})
                                  </h3>
                                  <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {aiTemplate.conversationExamples.map(
                                      (example, i) => (
                                        <div
                                          key={i}
                                          className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
                                        >
                                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Customer: "{example.customerInput}"
                                          </p>
                                          <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Agent: "{example.expectedResponse}"
                                          </p>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Intents */}
                            {aiTemplate?.intents &&
                              aiTemplate.intents.length > 0 && (
                                <div>
                                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Intent Training ({aiTemplate.intents.length}
                                    )
                                  </h3>
                                  <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {aiTemplate.intents.map((intent, i) => (
                                      <div
                                        key={i}
                                        className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
                                      >
                                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                          {intent.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                          Phrases: {intent.phrases}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                          Response: {intent.response}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </>
                        )}

                        {/* Predefined Template Specific Sections */}
                        {predefinedTemplate && !aiTemplate && (
                          <>
                            {/* Industries & Processes */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                  Best For Industries
                                </h3>
                                <div className="flex flex-wrap gap-1.5">
                                  {predefinedTemplate.matchingIndustries.map(
                                    (industry, i) => (
                                      <span
                                        key={i}
                                        className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs capitalize border border-emerald-200 dark:border-emerald-800"
                                      >
                                        {industry === "all"
                                          ? "All Industries"
                                          : industry.replace("-", " ")}
                                      </span>
                                    ),
                                  )}
                                </div>
                              </div>

                              <div>
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                  Recommended For
                                </h3>
                                <div className="flex flex-wrap gap-1.5">
                                  {predefinedTemplate.matchingProcesses.map(
                                    (process, i) => (
                                      <span
                                        key={i}
                                        className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs capitalize border border-blue-200 dark:border-blue-800"
                                      >
                                        {process.replace("-", " ")}
                                      </span>
                                    ),
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Agent Settings */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                  Persona
                                </p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                  {predefinedTemplate.persona}
                                </p>
                              </div>
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                  Guardrails
                                </p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                  {predefinedTemplate.guardrailsLevel}
                                </p>
                              </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">
                                Training Configuration
                              </h3>
                            </div>

                            {/* Custom Instructions */}
                            <div>
                              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Custom Instructions
                              </h3>
                              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 max-h-20 overflow-y-auto">
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  {predefinedTemplate.customInstructions}
                                </p>
                              </div>
                            </div>

                            {/* First Message */}
                            <div>
                              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                First Message
                              </h3>
                              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                                  "{replaceTemplatePlaceholders(predefinedTemplate.firstMessage)}"
                                </p>
                              </div>
                            </div>

                            {/* Call Scripts */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                  Opening Script
                                </h3>
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 h-24 overflow-y-auto">
                                  <p className="text-xs text-slate-600 dark:text-slate-400">
                                    {replaceTemplatePlaceholders(predefinedTemplate.openingScript)}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                  Closing Script
                                </h3>
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 h-24 overflow-y-auto">
                                  <p className="text-xs text-slate-600 dark:text-slate-400">
                                    {replaceTemplatePlaceholders(predefinedTemplate.closingScript)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Key Talking Points */}
                            <div>
                              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Key Talking Points
                              </h3>
                              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 max-h-24 overflow-y-auto">
                                <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line">
                                  {replaceTemplatePlaceholders(predefinedTemplate.keyTalkingPoints)}
                                </p>
                              </div>
                            </div>

                            {/* Objection Handling */}
                            <div>
                              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Objection Handling (
                                {predefinedTemplate.objections.length})
                              </h3>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {predefinedTemplate.objections.map((obj, i) => (
                                  <div
                                    key={i}
                                    className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
                                  >
                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                      "{obj.objection}"
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      → {obj.response}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Conversation Examples */}
                            <div>
                              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Conversation Examples (
                                {predefinedTemplate.conversationExamples.length}
                                )
                              </h3>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {predefinedTemplate.conversationExamples.map(
                                  (example, i) => (
                                    <div
                                      key={i}
                                      className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
                                    >
                                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Customer: "{example.customerInput}"
                                      </p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Agent: "{example.expectedResponse}"
                                      </p>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowTemplateDetails(false);
                        setIsEditingTemplate(false);
                        setEditedTemplate(null);
                      }}
                      className="flex-1 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Close
                    </button>
                    {isEditingTemplate ? (
                      <button

                        onClick={() => {
                          if (editedTemplate) {
                            const templateIndex =
                              aiGeneratedTemplates.findIndex(
                                (t) => t.name === selectedTemplateForDetails,
                              );
                            if (templateIndex !== -1) {
                              const updated = [...aiGeneratedTemplates];
                              updated[templateIndex] = {
                                ...updated[templateIndex],
                                ...editedTemplate,
                              };
                              setAIGeneratedTemplates(updated);
                            }
                          }
                          setIsEditingTemplate(false);
                          setEditedTemplate(null);
                        }}
                        className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Save Changes
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setIsEditingTemplate(true);
                            const template =
                              aiGeneratedTemplates.find(
                                (t) => t.name === selectedTemplateForDetails,
                              ) ||
                              aiEmployeeTemplates[selectedTemplateForDetails];
                            setEditedTemplate(template || {});
                          }}
                          className="flex-1 py-2.5 border border-orange-300 dark:border-orange-600 rounded-xl text-orange-600 dark:text-orange-400 font-medium hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center justify-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setQuickCreateData((prev) => ({
                              ...prev,
                              selectedTemplate: selectedTemplateForDetails,
                            }));
                            setShowTemplateDetails(false);
                          }}
                          className="flex-1 py-2.5 common-button-bg rounded-xl font-medium hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Select Template
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    );
  }

  if (isView && currentAgent) {
    return (
      <div className="space-y-3 sm:space-y-4 lg:space-y-6 w-full">
        <GlassCard>
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <button
                  onClick={() => navigate("/agents")}
                  className="common-button-bg2 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl flex-shrink-0 touch-manipulation"
                >
                  <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600 dark:text-slate-300" />
                </button>

                <div className="w-10 h-10 sm:w-12 sm:h-12 common-bg-icons flex items-center justify-center flex-shrink-0 rounded-lg sm:rounded-xl">
                  <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-black dark:text-white" />
                </div>

                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-white leading-tight truncate">
                    {currentAgent.name}
                  </h1>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium mt-1 ${
                      currentAgent.status === "Published" ||
                      (currentAgent as any).is_active
                        ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                    }`}
                  >
                    {currentAgent.status === "Published" ||
                    (currentAgent as any).is_active
                      ? "Live"
                      : "Unpublished"}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate(`/agents/${currentAgent.id}/edit`)}
                  className="common-button-bg2 flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg touch-manipulation"
                >
                  <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline text-xs sm:text-sm font-medium">Edit</span>
                </button>
                
                {(currentAgent.status === "Published" ||
                  (currentAgent as any).is_active) && (
                  <>
                    <button
                      onClick={() => setShowTestChat(true)}
                      className="common-button-bg flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg touch-manipulation"
                    >
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline text-xs sm:text-sm font-medium text-white">Test</span>
                    </button>
                    <button
                      onClick={() => handlePause(currentAgent.id)}
                      disabled={publishingAgents.has(currentAgent.id)}
                      className={`common-button-bg2 flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg touch-manipulation ${
                        publishingAgents.has(currentAgent.id)
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {publishingAgents.has(currentAgent.id) ? (
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      ) : (
                        <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                      <span className="hidden sm:inline text-xs sm:text-sm font-medium">
                        {publishingAgents.has(currentAgent.id) ? "..." : "Pause"}
                      </span>
                    </button>
                  </>
                )}
                
                {!(currentAgent.status === "Published" || (currentAgent as any).is_active) && (
                  <button
                    onClick={() => handlePublish(currentAgent.id)}
                    disabled={publishingAgents.has(currentAgent.id)}
                    className={`common-button-bg flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg touch-manipulation ${
                      publishingAgents.has(currentAgent.id)
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {publishingAgents.has(currentAgent.id) ? (
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                    <span className="text-xs sm:text-sm font-medium text-white">
                      {publishingAgents.has(currentAgent.id) ? "..." : "Publish"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Configuration Grid - Simple & Clean */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-4">
              <div className="p-2 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 mb-1">
                  <Globe className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Language</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {currentAgent.language}
                </p>
              </div>

              <div className="p-2 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Voice</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {currentAgent.voice}
                </p>
              </div>

              <div className="p-2 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Persona</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                  {currentAgent.persona}
                </p>
              </div>

              <div className="p-2 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Created</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {new Date(currentAgent.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Performance Overview - Mobile Slider */}
        <div className="sm:hidden">
          <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
            {/* Conversations Card */}
            <GlassCard className="flex-shrink-0 w-32 snap-start">
              <div className="p-2.5">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-6 h-6 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-center justify-center mb-1">
                    <MessageSquare className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">
                    {currentAgent.stats.conversations.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 text-center leading-tight">
                    Conversations
                  </p>
                  {currentAgent.stats.conversations > 0 ? (
                    <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
                      No data
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 dark:text-slate-500">
                      No data
                    </span>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Success Rate Card */}
            <GlassCard className="flex-shrink-0 w-32 snap-start">
              <div className="p-2.5">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-6 h-6 bg-green-50 dark:bg-green-900/20 rounded-md flex items-center justify-center mb-1">
                    <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">
                    {currentAgent.stats.successRate}%
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 text-center leading-tight">
                    Success Rate
                  </p>
                  {currentAgent.stats.successRate > 0 ? (
                    <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
                      No data
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 dark:text-slate-500">
                      No data
                    </span>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Avg Response Card */}
            <GlassCard className="flex-shrink-0 w-32 snap-start">
              <div className="p-2.5">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-6 h-6 bg-purple-50 dark:bg-purple-900/20 rounded-md flex items-center justify-center mb-1">
                    <Clock className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">
                    {currentAgent.stats.avgResponseTime}s
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 text-center leading-tight">
                    Avg Response
                  </p>
                  {currentAgent.stats.avgResponseTime > 0 ? (
                    <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
                      No data
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 dark:text-slate-500">
                      No data
                    </span>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Active Users Card */}
            <GlassCard className="flex-shrink-0 w-32 snap-start">
              <div className="p-2.5">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-6 h-6 bg-orange-50 dark:bg-orange-900/20 rounded-md flex items-center justify-center mb-1">
                    <Users className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                  </div>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">
                    {currentAgent.stats.activeUsers}
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 text-center leading-tight">
                    Active Users
                  </p>
                  {currentAgent.stats.activeUsers > 0 ? (
                    <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
                      No data
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 dark:text-slate-500">
                      No data
                    </span>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Tablet & Desktop Grid View - Compact */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-3">
          <GlassCard className="hover:shadow-md transition-all duration-200">
            <div className="p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-800 dark:text-white">
                    {currentAgent.stats.conversations.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Conversations
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {currentAgent.stats.conversations > 0 ? (
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    No data
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    No data yet
                  </span>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="hover:shadow-md transition-all duration-200">
            <div className="p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-800 dark:text-white">
                    {currentAgent.stats.successRate}%
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Success Rate
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {currentAgent.stats.successRate > 0 ? (
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    No data
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    No data yet
                  </span>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="hover:shadow-md transition-all duration-200">
            <div className="p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-800 dark:text-white">
                    {currentAgent.stats.avgResponseTime}s
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Avg Response
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {currentAgent.stats.avgResponseTime > 0 ? (
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    No data
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    No data yet
                  </span>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="hover:shadow-md transition-all duration-200">
            <div className="p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-800 dark:text-white">
                    {currentAgent.stats.activeUsers}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Active Users
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {currentAgent.stats.activeUsers > 0 ? (
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    No data
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    No data yet
                  </span>
                )}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Widget Customization Section - Only show when agent is published */}
        <div className="mt-3 sm:mt-4 lg:mt-6">
          <AgentWidgetCustomization
            agentId={currentAgent.id}
            agentName={currentAgent.name}
            isPublished={true}
          />
        </div>

        {/* Integration Code Section - Only show when agent is published */}
        {(currentAgent.status === "Published" ||
          (currentAgent as any).is_active) && (
          <div className="mt-4 sm:mt-6">
            <AgentIntegrationCode currentAgent={currentAgent} />
          </div>
        )}

        {showQRModal && currentAgent && (
          <AgentQRModal
            agent={currentAgent}
            onClose={() => setShowQRModal(false)}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
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
          </div>
        )}

        {/* Quick Actions - Bottom Section */}
        <div className="mt-4 sm:mt-6">
          {/* Mobile: Compact Stack */}
          <div className="lg:hidden">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate(`/agents/${currentAgent.id}/train`, {
                  state: { from: "view" },
                })}
                className="common-bg-icons hover:shadow-md transition-all duration-200 p-2 rounded-lg touch-manipulation group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Lightbulb className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-xs font-medium text-slate-800 dark:text-white">
                    Train
                  </p>
                </div>
              </button>

              <button className="common-bg-icons hover:shadow-md transition-all duration-200 p-2 rounded-lg touch-manipulation group">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Download className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-xs font-medium text-slate-800 dark:text-white">
                    Export
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Desktop: Horizontal Grid */}
          <div className="hidden lg:block">
            <GlassCard>
              <div className="p-4 lg:p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                    Quick Actions
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate(`/agents/${currentAgent.id}/train`, {
                      state: { from: "list" },
                    })}
                    className="common-bg-icons hover:shadow-md transition-all duration-200 p-4 rounded-lg touch-manipulation group"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">
                          Train Agent
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          Improve responses
                        </p>
                      </div>
                    </div>
                  </button>

               

                
                  <button className="common-bg-icons hover:shadow-md transition-all duration-200 p-4 rounded-lg touch-manipulation group">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Download className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">
                          Export Data
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          Download config
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Comprehensive Agent Testing Modal - Only show for published agents */}
        {showTestChat &&
          currentAgent &&
          currentAgent.status === "Published" && (
            <div className="fixed inset-0 bg-black/20 z-[60] flex items-center justify-center p-3 sm:p-4 -top-8">
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl w-full max-w-2xl h-[80vh] max-h-[600px] relative flex flex-col shadow-xl border border-white/20 dark:border-slate-700/50">
                {/* Minimalist Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Test {currentAgent.name}
                    </h3>
                  </div>
                  <button
                    onClick={async () => {
                      // Cleanup and close
                      if (room) {
                        try {
                          await room.disconnect();
                        } catch (error) {
                          console.error("Error disconnecting on close:", error);
                        }
                      }

                      setShowTestChat(false);
                      setIsCallActive(false);
                      setIsRecording(false);
                      setConnectionStatus("disconnected");
                      setStatusMessage("Ready to connect");
                      if (callTimerInterval) {
                        clearInterval(callTimerInterval);
                        setCallTimerInterval(null);
                      }
                      setCallDuration(0);
                      setActiveTestTab("call");
                    }}
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* Minimalist Tab Navigation */}
                <div className="flex border-b border-slate-200/50 dark:border-slate-700/50">
                  {[
                    { id: "call", label: "Voice", icon: Phone },
                    {
                      id: "conversation",
                      label: "Conversation",
                      icon: MessageSquare,
                    },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTestTab(id as any)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors ${
                        activeTestTab === id
                          ? "text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white bg-slate-50/50 dark:bg-slate-800/50"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden">
                  {/* Call Tab */}
                  {activeTestTab === "call" && (
                    <div className="h-full flex flex-col items-center justify-center p-6">
                      {/* Status Indicator */}
                      <div className="text-center mb-6">
                        <div
                          className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 mx-auto transition-all ${
                            connectionStatus === "connected"
                              ? "bg-green-100 dark:bg-green-900/20"
                              : connectionStatus === "connecting"
                                ? "bg-yellow-100 dark:bg-yellow-900/20 animate-pulse"
                                : "bg-slate-100 dark:bg-slate-800/50"
                          }`}
                        >
                          <Phone
                            className={`w-8 h-8 ${
                              connectionStatus === "connected"
                                ? "text-green-600 dark:text-green-400"
                                : connectionStatus === "connecting"
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-slate-400"
                            }`}
                          />
                        </div>

                        <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-1">
                          {connectionStatus === "connected"
                            ? "Connected"
                            : connectionStatus === "connecting"
                              ? "Connecting..."
                              : "Ready to Call"}
                        </h3>

                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {statusMessage}
                        </p>

                        {isCallActive && (
                          <p className="text-sm font-mono text-slate-600 dark:text-slate-300 mt-2">
                            {formatCallDuration(callDuration)}
                          </p>
                        )}
                      </div>

                      {/* Simple Controls */}
                      <div className="flex items-center gap-3">
                        {!isCallActive && !isConnecting ? (
                          <>
                            <button
                              onClick={handleStartCall}
                              disabled={isTestLoading || isConnecting}
                              className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                              <PhoneCall className="w-4 h-4" />
                              {isConnecting ? "Connecting..." : "Start Call"}
                            </button>

                            <button
                              onClick={testConnection}
                              className="flex items-center gap-2 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-sm"
                            >
                              <Settings className="w-4 h-4" />
                              Test
                            </button>
                          </>
                        ) : isCallActive ? (
                          <>
                            <button
                              onClick={handleToggleMute}
                              className={`p-3 rounded-xl transition-colors ${
                                isMuted
                                  ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                                  : "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                              }`}
                              title={isMuted ? "Unmute" : "Mute"}
                            >
                              {isMuted ? (
                                <MicOff className="w-5 h-5" />
                              ) : (
                                <Mic className="w-5 h-5" />
                              )}
                            </button>

                            <button
                              onClick={handleEndCall}
                              className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                              title="End Call"
                            >
                              <Phone className="w-5 h-5" />
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                            <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-slate-900 dark:border-t-white rounded-full animate-spin"></div>
                            <span>Connecting...</span>
                          </div>
                        )}
                      </div>

                      {isCallActive && (
                        <div className="mt-6 text-center">
                          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                !isMuted ? "bg-green-500" : "bg-red-500"
                              }`}
                            ></div>
                            {!isMuted ? "Listening" : "Muted"}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Conversation Tab (Combined Transcript + Chat) */}
                  {activeTestTab === "conversation" && (
                    <div className="h-full flex flex-col">
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 ? (
                          <div className="text-center py-8">
                            <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Start a conversation to see messages
                            </p>
                          </div>
                        ) : (
                          messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex mb-4 ${
                                message.isUser ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`flex gap-3 max-w-[80%] ${
                                  message.isUser ? "flex-row-reverse" : ""
                                }`}
                              >
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    message.isUser
                                      ? "bg-blue-500 text-white"
                                      : "bg-green-500 text-white"
                                  }`}
                                >
                                  {message.isUser ? (
                                    <span className="text-sm font-medium">
                                      U
                                    </span>
                                  ) : (
                                    <span className="text-sm font-medium">
                                      AI
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                      {message.isUser ? "You" : "AI Employee"}
                                    </span>
                                    <span className="text-xs text-slate-400 dark:text-slate-500">
                                      {message.timestamp.toLocaleTimeString(
                                        [],
                                        { hour: "2-digit", minute: "2-digit" },
                                      )}
                                    </span>
                                    {message.source && (
                                      <span
                                        className={`text-xs px-2 py-0.5 rounded-full ${
                                          message.source === "voice"
                                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                        }`}
                                      >
                                        {message.source === "voice"
                                          ? "🎙️"
                                          : "💬"}
                                      </span>
                                    )}
                                  </div>
                                  <div
                                    className={`px-4 py-2 rounded-2xl text-sm ${
                                      message.isUser
                                        ? "bg-blue-500 text-white"
                                        : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                                    }`}
                                  >
                                    {message.text}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        {isTestLoading && (
                          <div className="flex justify-start mb-4">
                            <div className="flex gap-3 max-w-[80%]">
                              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-medium">AI</span>
                              </div>
                              <div className="flex flex-col">
                                <div className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                                    <div
                                      className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"
                                      style={{ animationDelay: "0.1s" }}
                                    ></div>
                                    <div
                                      className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"
                                      style={{ animationDelay: "0.2s" }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chat Input */}
                      <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={testInput}
                            onChange={(e) => setTestInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter" && !isTestLoading) {
                                handleTestSend();
                              }
                            }}
                            placeholder={
                              connectionStatus === "connected"
                                ? "Type a message or use voice..."
                                : "Type a message..."
                            }
                            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 text-slate-700 dark:text-slate-300 text-sm placeholder-slate-400 dark:placeholder-slate-500"
                            disabled={isTestLoading}
                          />
                          <button
                            onClick={handleTestSend}
                            disabled={!testInput.trim() || isTestLoading}
                            className="px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                        {connectionStatus === "connected" && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                            🔴 Live conversation • Voice and text messages
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        {/* Publish Confirmation Modal */}
        {showPublishConfirm && (
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
          </div>
        )}

        {/* Pause Confirmation Modal */}
        {showPauseConfirm && (
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
          </div>
        )}
      </div>
    );
  }

  return <Navigate to="/agents" replace />;
};

export default AgentManagement;
