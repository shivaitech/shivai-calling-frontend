import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, X, Bot, Globe, Settings, Sparkles, Info, Upload, Link, Share2, FileText, File, Image, Plus, BookOpen, Volume2, Play, Square } from 'lucide-react';
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
    voice: "Achernar",
    voiceSpeed: 1.0,
    voiceStyle: "friendly",
    customInstructions: "",
    guardrailsLevel: "Medium",
    responseStyle: "Balanced",
    maxResponseLength: "Medium (150 words)",
    contextWindow: "Standard (8K tokens)",
    temperature: 0.7,
  });

  const [templateData, setTemplateData] = useState<any>(null);

  // Tab state (like Training page)
  const [activeTab, setActiveTab] = useState<string>('identity');
  
  // Tab configuration
  const editTabs = [
    { id: 'identity', label: 'Identity', icon: Bot },
    { id: 'voice', label: 'Voice', icon: Volume2 },
    { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
    { id: 'settings', label: 'Template Setting', icon: Settings },
  ];

  // Knowledge Base State
  const [websiteUrls, setWebsiteUrls] = useState<string[]>(['']);
  const [socialMediaUrls, setSocialMediaUrls] = useState<string[]>(['']);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

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
          voice: agentData.voice || "Achernar",
          voiceSpeed: (agentData as any).voice_speed !== undefined ? (agentData as any).voice_speed : 1.0,
          voiceStyle: (agentData as any).voice_style || "friendly",
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

  // Voice Options by Gender
  // Multilingual voice support
  const multilingualVoices: Record<string, string[]> = {
    female: ["Aoede", "Kore", "Leda", "Zephyr"],
    male: ["Puck", "Charon", "Fenrir", "Orus"],
  };
  const englishOnlyLanguages = ["en-US", "en-GB", "en-IN"];
  const isMultilingualLanguage = !englishOnlyLanguages.includes(formData.language);

  const getFilteredVoiceOptions = (gender: string) => {
    const opts = voiceOptions[gender] || voiceOptions.female;
    if (isMultilingualLanguage) {
      return opts.filter((v) => (multilingualVoices[gender] || []).includes(v.value));
    }
    return opts;
  };

  const voiceOptions: Record<string, { value: string; label: string }[]> = {
    female: [
      { value: "Achernar", label: "Achernar" },
      { value: "Aoede", label: "Aoede" },
      { value: "Autonoe", label: "Autonoe" },
      { value: "Callirrhoe", label: "Callirrhoe" },
      { value: "Despina", label: "Despina" },
      { value: "Erinome", label: "Erinome" },
      { value: "Gacrux", label: "Gacrux" },
      { value: "Kore", label: "Kore" },
      { value: "Laomedeia", label: "Laomedeia" },
      { value: "Leda", label: "Leda" },
      { value: "Pulcherrima", label: "Pulcherrima" },
      { value: "Sulafat", label: "Sulafat" },
      { value: "Vindemiatrix", label: "Vindemiatrix" },
      { value: "Zephyr", label: "Zephyr" },
    ],
    male: [
      { value: "Achird", label: "Achird" },
      { value: "Algenib", label: "Algenib" },
      { value: "Algieba", label: "Algieba" },
      { value: "Alnilam", label: "Alnilam" },
      { value: "Charon", label: "Charon" },
      { value: "Enceladus", label: "Enceladus" },
      { value: "Fenrir", label: "Fenrir" },
      { value: "Iapetus", label: "Iapetus" },
      { value: "Orus", label: "Orus" },
      { value: "Puck", label: "Puck" },
      { value: "Rasalgethi", label: "Rasalgethi" },
      { value: "Sadachbia", label: "Sadachbia" },
      { value: "Sadaltager", label: "Sadaltager" },
      { value: "Schedar", label: "Schedar" },
      { value: "Umbriel", label: "Umbriel" },
      { value: "Zubenelgenubi", label: "Zubenelgenubi" },
    ],
  };

  // Voice preview state
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [isLoadingVoicePreview, setIsLoadingVoicePreview] = useState(false);
  const voicePreviewAudioRef = useRef<HTMLAudioElement | null>(null);

  const previewGeminiVoice = async (voiceName: string) => {
    if (voicePreviewAudioRef.current) {
      voicePreviewAudioRef.current.pause();
      voicePreviewAudioRef.current = null;
    }
    setIsTestingVoice(true);
    setIsLoadingVoicePreview(true);
    try {
      const sampleText = `Hello! I'm ${formData.name || 'your AI assistant'}. How can I help you today?`;
      const authTokens = localStorage.getItem('auth_tokens');
      const accessToken = authTokens ? JSON.parse(authTokens)?.accessToken : null;
      const response = await fetch('https://nodejs.service.callshivai.com/api/v1/voice/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ voiceName, text: sampleText }),
      });
      if (!response.ok) throw new Error(`Voice preview failed: ${response.status}`);
      const json = await response.json();
      const audioData = json.data;
      let audioUrl: string;
      let isDataUrl = false;
      if (audioData?.audioDataUrl) {
        audioUrl = audioData.audioDataUrl;
        isDataUrl = true;
      } else if (audioData?.audioBase64) {
        const byteChars = atob(audioData.audioBase64);
        const byteNums = new Array(byteChars.length).fill(0).map((_, i) => byteChars.charCodeAt(i));
        const byteArray = new Uint8Array(byteNums);
        audioUrl = URL.createObjectURL(new Blob([byteArray], { type: 'audio/mp3' }));
      } else {
        throw new Error('No audio data in response');
      }
      const audio = new Audio(audioUrl);
      voicePreviewAudioRef.current = audio;
      audio.oncanplay = () => setIsLoadingVoicePreview(false);
      audio.onended = () => {
        setIsTestingVoice(false);
        setIsLoadingVoicePreview(false);
        if (!isDataUrl) URL.revokeObjectURL(audioUrl);
        voicePreviewAudioRef.current = null;
      };
      audio.onerror = () => {
        setIsTestingVoice(false);
        setIsLoadingVoicePreview(false);
        voicePreviewAudioRef.current = null;
      };
      await audio.play();
      setIsLoadingVoicePreview(false);
    } catch (error) {
      setIsTestingVoice(false);
      setIsLoadingVoicePreview(false);
      toast.error('Voice preview unavailable. Please try again later.');
    }
  };

  const stopVoicePreview = () => {
    if (voicePreviewAudioRef.current) {
      voicePreviewAudioRef.current.pause();
      voicePreviewAudioRef.current = null;
    }
    setIsTestingVoice(false);
    setIsLoadingVoicePreview(false);
  };

  const maxResponseOptions = [
    { value: "Short (50 words)", label: "Short (50 words)" },
    { value: "Medium (150 words)", label: "Medium (150 words)" },
    { value: "Long (300 words)", label: "Long (300 words)" },
  ];

  // Knowledge Base Handlers
  const handleKnowledgeBaseUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploadingFiles(true);
    try {
      setUploadedFiles((prev) => [...prev, ...files]);

      // Upload files to the API
      const response = await agentAPI.uploadKnowledgeBase(files);
      console.log("📤 Knowledge base upload response:", response);

      // Extract URLs from response.data.files array
      const urls = response.data?.files?.map((file: any) => file.url) || [];
      if (urls.length > 0) {
        setUploadedFileUrls((prev) => [...prev, ...urls]);
        console.log("✅ Knowledge base files uploaded:", urls);
        toast.success(`${files.length} file(s) uploaded successfully!`);
      }
    } catch (error) {
      console.error("❌ Error uploading knowledge base files:", error);
      toast.error("Failed to upload files. Please try again.");
      setUploadedFiles((prev) =>
        prev.filter((f) => !files.some((newFile) => newFile.name === f.name))
      );
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleRemoveKnowledgeBaseFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadedFileUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddWebsiteUrl = () => {
    setWebsiteUrls((prev) => [...prev, ""]);
  };

  const handleRemoveWebsiteUrl = (index: number) => {
    setWebsiteUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleWebsiteUrlChange = (index: number, value: string) => {
    setWebsiteUrls((prev) => prev.map((url, i) => (i === index ? value : url)));
  };

  const handleAddSocialMediaUrl = () => {
    setSocialMediaUrls((prev) => [...prev, ""]);
  };

  const handleRemoveSocialMediaUrl = (index: number) => {
    setSocialMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSocialMediaUrlChange = (index: number, value: string) => {
    setSocialMediaUrls((prev) => prev.map((url, i) => (i === index ? value : url)));
  };

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
          voice_speed: formData.voiceSpeed,
          voice_style: formData.voiceStyle,
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
          // Knowledge base URLs
          website_urls: websiteUrls.filter((url) => url.trim()),
          social_media_urls: socialMediaUrls.filter((url) => url.trim()),
          knowledge_base_file_urls: uploadedFileUrls,
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

                      {/* Agent meta info */}
                      <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                        <span className="font-medium capitalize">{formData.gender}</span>
                        <span className="text-slate-400">•</span>
                        <span className="truncate capitalize">{formData.voice}</span>
                        <span className="text-slate-400">•</span>
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="truncate text-xs sm:text-sm">
                            {currentAgent.language}
                          </span>
                        </div>
                        <span
                          className="px-2 py-0.5 sm:px-3 sm:py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium flex-shrink-0"
                        >
                          Editing
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
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

      {/* Tabs - Training Page Style */}
      <GlassCard>
        <div className="">
          <div className="flex space-x-1 common-bg-icons rounded-xl px-4 py-3 overflow-x-auto">
            {editTabs?.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "common-button-bg2 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition ease-in-out"
                }`}
              >
                <tab.icon className="w-3 sm:w-4 h-3 sm:h-4" />
                <span className="text-xs sm:text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Content based on active tab */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          {/* Identity Tab Content */}
          {activeTab === 'identity' && (
            <GlassCard>
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center gap-2 mb-4">
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
                </div>
              </div>
            </GlassCard>
          )}

          {/* Knowledge Tab Content */}
          {activeTab === 'knowledge' && (
            <GlassCard>
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600 dark:text-cyan-400" />
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                    Knowledge Base
                  </h2>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Upload documents or add URLs to train your AI with company-specific knowledge
                </p>

                <div className="space-y-4 sm:space-y-5">
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
                        !isUploadingFiles && document.getElementById("edit-knowledge-file-input")?.click()
                      }
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (!isUploadingFiles) {
                          e.currentTarget.classList.add("border-blue-400", "bg-blue-50/50");
                        }
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove("border-blue-400", "bg-blue-50/50");
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove("border-blue-400", "bg-blue-50/50");
                        if (!isUploadingFiles) {
                          const files = Array.from(e.dataTransfer.files);
                          handleKnowledgeBaseUpload(files);
                        }
                      }}
                    >
                      <input
                        id="edit-knowledge-file-input"
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
                              <span className="text-blue-500 font-medium">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
                              PDF, DOC, TXT, CSV, Excel, Images (max 10MB each)
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-1.5 sm:space-y-2 max-h-32 overflow-y-auto">
                        {uploadedFiles.map((file, index) => (
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
                            {uploadedFileUrls[index] && (
                              <span className="text-[10px] sm:text-xs text-green-500">✓</span>
                            )}
                            <button
                              onClick={() => handleRemoveKnowledgeBaseFile(index)}
                              disabled={isUploadingFiles}
                              className="p-0.5 sm:p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Website URLs Section */}
                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Link className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Website URLs
                    </label>
                    {websiteUrls.map((url, index) => (
                      <div key={index} className="flex items-center gap-1.5 sm:gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => handleWebsiteUrlChange(index, e.target.value)}
                          placeholder="https://yourcompany.com"
                          className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                        />
                        {websiteUrls.length > 1 && (
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
                    {socialMediaUrls.map((url, index) => (
                      <div key={index} className="flex items-center gap-1.5 sm:gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => handleSocialMediaUrlChange(index, e.target.value)}
                          placeholder="https://facebook.com/yourpage or https://x.com/yourhandle"
                          className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                        />
                        {socialMediaUrls.length > 1 && (
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
                </div>
              </div>
            </GlassCard>
          )}

          {/* Settings Tab Content */}
          {activeTab === 'settings' && (
            <GlassCard>
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                    Advanced Settings
                  </h2>
                </div>

                <div className="space-y-4 sm:space-y-6">
               

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
                  {/* <div>
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
                  </div> */}

              

                  {/* Template Editor Section */}
                  {templateData && (
                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      {/* System Prompt */}
                      <div>
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
                          rows={16}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 text-slate-800 dark:text-white text-sm resize-y min-h-[200px]"
                        />
                      </div>

                      {/* First Message */}
                      <div>
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
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 text-slate-800 dark:text-white text-sm resize-none"
                        />
                      </div>

                      {/* Opening Script */}
                      <div>
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
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 text-slate-800 dark:text-white text-sm resize-none"
                        />
                      </div>

                      {/* Key Talking Points */}
                      <div>
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
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 text-slate-800 dark:text-white text-sm resize-none"
                        />
                      </div>

                      {/* Closing Script */}
                      <div>
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
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 text-slate-800 dark:text-white text-sm resize-none"
                        />
                      </div>

                      {/* Objections */}
                      {templateData.objections && templateData.objections.length > 0 && (
                        <div>
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
                  )}
                </div>
              </div>
            </GlassCard>
          )}

          {/* Voice Tab Content */}
          {activeTab === 'voice' && (
            <GlassCard>
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                    Voice & Language
                  </h2>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Configure language and voice settings
                </p>

                <div className="space-y-4">
                  {/* Gender */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                      Gender
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {genders.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            const newGender = option.value;
                            const needsMultilingual = !englishOnlyLanguages.includes(formData.language);
                            const newVoice = needsMultilingual
                              ? multilingualVoices[newGender]?.[0] || (newGender === 'female' ? 'Aoede' : 'Puck')
                              : (newGender === 'female' ? 'Achernar' : 'Achird');
                            setFormData({ ...formData, gender: newGender, voice: newVoice });
                          }}
                          className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center ${
                            formData.gender === option.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                      Language
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => {
                        const newLang = e.target.value;
                        const isNewMultilingual = !englishOnlyLanguages.includes(newLang);
                        const gender = formData.gender;
                        let newVoice = formData.voice;
                        if (isNewMultilingual && !(multilingualVoices[gender] || []).includes(formData.voice)) {
                          newVoice = multilingualVoices[gender]?.[0] || formData.voice;
                        }
                        setFormData({ ...formData, language: newLang, voice: newVoice });
                      }}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                    >
                      <option value="multilingual">🌐 Multilingual</option>
                      <option value="en-US">🇺🇸 English (US)</option>
                      <option value="en-GB">🇬🇧 English (UK)</option>
                      <option value="en-IN">🇮🇳 English (India)</option>
                      <option value="es">🇪🇸 Spanish</option>
                      <option value="fr">🇫🇷 French</option>
                      <option value="de">🇩🇪 German</option>
                      <option value="it">🇮🇹 Italian</option>
                      <option value="pt">🇵🇹 Portuguese</option>
                      <option value="nl">🇳🇱 Dutch</option>
                      <option value="pl">🇵🇱 Polish</option>
                      <option value="ru">🇷🇺 Russian</option>
                      <option value="ja">🇯🇵 Japanese</option>
                      <option value="ko">🇰🇷 Korean</option>
                      <option value="zh">🇨🇳 Chinese</option>
                      <option value="ar">🇸🇦 Arabic</option>
                      <option value="hi">🇮🇳 Hindi</option>
                      <option value="tr">🇹🇷 Turkish</option>
                    </select>
                  </div>

                  {/* Voice Type */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                      Voice Type
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.voice}
                        onChange={(e) => setFormData({ ...formData, voice: e.target.value })}
                        className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                      >
                        {getFilteredVoiceOptions(formData.gender).map((voice) => (
                          <option key={voice.value} value={voice.value}>{voice.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={isLoadingVoicePreview}
                        onClick={() => {
                          if (isTestingVoice) {
                            stopVoicePreview();
                          } else {
                            previewGeminiVoice(formData.voice);
                          }
                        }}
                        className={`px-4 py-2.5 sm:py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                          isLoadingVoicePreview
                            ? 'bg-slate-400 dark:bg-slate-600 text-white cursor-not-allowed'
                            : isTestingVoice
                            ? 'bg-red-500 hover:bg-red-600 text-white hover:scale-[1.02] active:scale-[0.98]'
                            : 'common-button-bg hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                      >
                        {isLoadingVoicePreview ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                            <span className="hidden sm:inline">Loading</span>
                          </>
                        ) : isTestingVoice ? (
                          <>
                            <Square className="w-4 h-4" />
                            <span className="hidden sm:inline">Stop</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            <span className="hidden sm:inline">Test</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Choose a voice that matches your brand personality
                    </p>
                  </div>

                  {/* Voice Style */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                      Voice Style
                    </label>
                    <select
                      value={formData.voiceStyle}
                      onChange={(e) => setFormData({ ...formData, voiceStyle: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                    >
                      <option value="friendly">Friendly - Warm &amp; approachable</option>
                      <option value="professional">Professional - Business-like &amp; formal</option>
                      <option value="casual">Casual - Relaxed &amp; conversational</option>
                      <option value="authoritative">Authoritative - Confident &amp; commanding</option>
                      <option value="empathetic">Empathetic - Understanding &amp; supportive</option>
                      <option value="enthusiastic">Enthusiastic - Energetic &amp; upbeat</option>
                    </select>
                    <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Set the personality tone for your AI assistant
                    </p>
                  </div>

                  {/* Voice Speed */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                        Voice Speed
                      </label>
                      <span className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
                        {formData.voiceSpeed.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={formData.voiceSpeed}
                      onChange={(e) =>
                        setFormData({ ...formData, voiceSpeed: parseFloat(e.target.value) })
                      }
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      style={{
                        background: `linear-gradient(to right, #2563eb ${((formData.voiceSpeed - 0.5) / (2.0 - 0.5)) * 100}%, #e2e8f0 ${((formData.voiceSpeed - 0.5) / (2.0 - 0.5)) * 100}%)`,
                      }}
                    />
                    <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1">
                      <span>Slower (0.5x)</span>
                      <span>Normal (1.0x)</span>
                      <span>Faster (2.0x)</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Sidebar - Tips Card */}
        <div className="space-y-4 sm:space-y-6">
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
