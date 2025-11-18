"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
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
  Globe,
  Phone,
} from "lucide-react";
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import logo from "../resources/images/ShivaiLogo.svg";
import Step3, { OnboardingFormData } from "../components/Step3";
import CountrySelector from "../components/CountrySelector";
import { Country, defaultCountries } from "../types/country";
import { authAPI } from "../services/authAPI";
import { useNavigate } from "react-router-dom";
import { locationAPI, Country as LocationCountry, State, City } from "../services/locationAPI";

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
  { value: "other", label: "Other" },
];

const planOptions = [
  {
    id: "starter",
    name: "Starter",
    apiKey: "Starter Plan",
    description: "Perfect for small businesses",
    maxAgents: 1,
    aiEmployees: 1,
    features: [
      "100 voice conversations/month (2 min each)",
      "1 AI Employee",
      "5 GB storage",
      "Website & app integration",
      "Email support",
      "Email/SMS workflows",
      "Basic voice analytics",
    ],
    price: "$49/mo",
  },
  {
    id: "professional",
    name: "Professional",
    apiKey: "Professional Plan",
    description: "For Growing Teams & Small Businesses",
    maxAgents: 5,
    aiEmployees: 5,
    features: [
      "300 voice conversations/month (2 min each)",
      "5 AI Employees",
      "50 GB storage",
      "Advanced integrations (CRM, payments, calendars)",
      "Priority support",
      "API access",
      "Custom voice branding",
      "Advanced analytics",
    ],
    price: "$149/mo",
    originalPrice: "$179/mo",
  },
  {
    id: "business",
    name: "Business",
    apiKey: "Business Plan",
    description: "For Scaling Companies & Mid-Sized Teams",
    maxAgents: 15,
    aiEmployees: 15,
    features: [
      "1000 voice conversations/month (2 min each)",
      "15 AI Employees",
      "200 GB storage",
      "Dedicated success manager",
      "SLA guarantee",
      "Premium integrations (ERP, call centers)",
      "Regional deployment option",
    ],
    price: "$299/mo",
  },
  {
    id: "custom",
    name: "Custom",
    apiKey: "Custom Plan",
    description: "For Large Organizations & Enterprises",
    maxAgents: 999,
    aiEmployees: 999,
    features: [
      "Unlimited conversations & AI Employees",
      "1 TB+ storage",
      "Full white-label solution",
      "SLA guarantee",
      "On-premises or hybrid deployment",
      "Compliance & governance",
    ],
    price: "Custom",
  },
];

const Onboarding: React.FC = () => {
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
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, File[]>>(
    {}
  );
  const navigate = useNavigate();
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [industrySearch, setIndustrySearch] = useState("");
  const [selectedCompanyCountry, setSelectedCompanyCountry] = useState<Country>(
    defaultCountries[0]
  );
  const [selectedBillingCountry, setSelectedBillingCountry] = useState<Country>(
    defaultCountries[0]
  );
  const industryInputRef = useRef<HTMLInputElement>(null);

  // Location selection states
  const [selectedCountries, setSelectedCountries] = useState<LocationCountry[]>([]);
  const [selectedStates, setSelectedStates] = useState<State[]>([]);
  const [selectedCities, setSelectedCities] = useState<City[]>([]);
  const [countrySearch, setCountrySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // State for "Same as Company address" checkbox
  const [sameAsCompany, setSameAsCompany] = useState(false);

  // State for saving draft
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    mode: "onChange",
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
    if (currentStep < totalSteps && validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const closeAllDropdowns = () => {
    setShowIndustryDropdown(false);
    setShowCountryDropdown(false);
    setShowStateDropdown(false);
    setShowCityDropdown(false);
    // Clear search inputs when dropdowns close
    setCountrySearch("");
    setStateSearch("");
    setCitySearch("");
  };

  React.useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as HTMLElement;

      const isInsideDropdown =
        target.closest("[data-dropdown]") ||
        target.closest("[data-dropdown-trigger]");

      if (!isInsideDropdown) {
        closeAllDropdowns();
      }
    };

    const handleFocusChange = (event: FocusEvent) => {
      const target = event.target as HTMLElement;

      const isDropdownRelated =
        target.closest("[data-dropdown]") ||
        target.closest("[data-dropdown-trigger]") ||
        target.hasAttribute("data-dropdown-trigger");

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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        const industry = watch("industry") || [];
        return !!watch("companyName") && 
               !!watch("companySize") && 
               industry.length > 0 &&
               !!watch("companyEmail");
      case 2:
        return !!watch("plan");
      case 3:
        const agents = watch("agents") || [];
        return (
          agents.length >= 1 &&
          agents.every(
            (agent) =>
              agent.agentName &&
              agent.agentType &&
              agent.preferredLanguage &&
              agent.voiceGender
          )
        );
      default:
        return true;
    }
  };

  // Helper function to build form data payload
  const buildFormDataPayload = (data: OnboardingFormData) => {
    const selectedPlan = planOptions.find((plan) => plan.id === data.plan);

    // Helper function to ensure URL has protocol
    const ensureValidUrl = (url: string) => {
      if (!url) return "";
      if (!url.match(/^https?:\/\//i)) {
        return `https://${url}`;
      }
      return url;
    };

    // Helper function to capitalize first letter of each word
    const capitalizeWords = (str: string) => {
      return str
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    };

    // Helper function to format voice gender
    const formatVoiceGender = (gender: string) => {
      if (!gender) return "Gender Neutral";
      const lowerGender = gender.toLowerCase();
      if (lowerGender.includes("male") && !lowerGender.includes("female")) return "Male";
      if (lowerGender.includes("female")) return "Female";
      return "Gender Neutral";
    };

    // Collect all uploaded files from all agents
    const allFiles: File[] = [];
    Object.values(uploadedFiles).forEach((files) => {
      if (files && files.length > 0) {
        allFiles.push(...files);
      }
    });
      console.log(typeof data.agentCount)


    // Construct payload matching API structure
    const payloadData = {
      // Company basics
      company_basics: {
        phone: data.companyPhone
          ? `${selectedCompanyCountry.dialCode}${data.companyPhone}`
          : "",
        name: data.companyName || "",
        website: ensureValidUrl(data.website || ""),
        company_size: data.companySize || "",
        company_email: data.companyEmail || "",
        company_phone: data.companyPhone
          ? `${selectedCompanyCountry.dialCode}${data.companyPhone}`
          : "",
        linkedin_profile: ensureValidUrl(data.linkedinUrl || ""),
        description: data.companyDescription || "",
        industry: Array.isArray(data.industry) ? data.industry : [data.industry || ""],
        business_regions: {
          countries: selectedCountries.map(c => c.name),
          states: selectedStates.map(s => s.name),
          cities: selectedCities.map(c => c.name),
        },
      },

      

      plan_details: {
        type: selectedPlan?.apiKey || data.plan || "",
        ai_employee_limit: Number(data.agentCount) || 1,
        monthly_price:
          selectedPlan?.price === "Custom pricing"
            ? 299
            : parseFloat(selectedPlan?.price?.replace(/[$\/mo,]/g, "") || "299"),
        billing_contact: {
          name: data.billingContactName || "",
          email: data.billingContactEmail || "",
          phone: data.billingContactPhone
            ? `${selectedBillingCountry.dialCode}${data.billingContactPhone}`
            : "",
          company_name: data.billingCompanyName || data.companyName || "",
          billing_address: {
            street: data.billingAddress || "",
            city: data.billingCity || "",
            state: data.billingState || "",
            postal_code: data.billingZip || "",
            country: data.billingCountry || "",
          },
        },
      },

      ai_employees: (data.agents || []).map((agent, index) => ({
        name: agent.agentName || `AI Employee ${index + 1}`,
        type: capitalizeWords(agent.agentType || "Sales"),
        template: agent.selectedTemplate || "Sales & Business Development",
        preferred_language: capitalizeWords(agent.preferredLanguage || "English"),
        voice_gender: formatVoiceGender(agent.voiceGender || "Gender Neutral"),
        agent_personality: agent.agentPersonality || "Enthusiastic & Energetic",
        voice_style: agent.voiceStyle || "Energetic & Enthusiastic",
        special_instructions: agent.specialInstructions || "Focus on customer needs",
      })),

      knowledge_sources: {
        website_url: ensureValidUrl(data.website || ""),
        social_links: {
          linkedin: ensureValidUrl(data.linkedinUrl || ""),
        },
        faqs_text: "",
      },

      // Instructions
      instructions: {
        dos_and_donts: "Be professional",
        fallback_contacts: data.companyEmail || "",
      },

      // Targets
      targets: {
        success_goals: "Automate 70% interactions",
        success_metrics: "Reduce tickets by 40%",
      },

      // Deployment targets
      deployment_targets: {
        channels: ["Website", "WhatsApp"],
        deployment_notes: "Phase 1: Website",
      },

      // Deployment service
      deployment_service: {
        service_type: "Shivai",
      },

      // Consent options
      consent_options: {
        recording_enabled: true,
        transcript_email_optin: true,
        privacy_notes: "Privacy enabled",
      },
    };

    return { payloadData, allFiles };
  };

  // Save as draft function
  const handleSaveAsDraft = async () => {
    setIsSavingDraft(true);
    try {
      const data = watch();
      const { payloadData, allFiles } = buildFormDataPayload(data);

      // Create FormData to handle file uploads
      const formData = new FormData();
      
      // Append each nested field individually for proper parsing
      Object.entries(payloadData.company_basics).forEach(([key, value]) => {
        if (key === 'industry' && Array.isArray(value)) {
          value.forEach((item, index) => {
            formData.append(`company_basics[industry][${index}]`, item);
          });
        } else if (Array.isArray(value)) {
          formData.append(`company_basics[${key}]`, JSON.stringify(value));
        } else {
          formData.append(`company_basics[${key}]`, String(value));
        }
      });
      
      // Plan details
      formData.append('plan_details[type]', payloadData.plan_details.type);
      formData.append('plan_details[ai_employee_limit]', String(payloadData.plan_details.ai_employee_limit));
      formData.append('plan_details[billing_contact][name]', payloadData.plan_details.billing_contact.name);
      formData.append('plan_details[billing_contact][email]', payloadData.plan_details.billing_contact.email);
      formData.append('plan_details[billing_contact][phone]', payloadData.plan_details.billing_contact.phone);
      formData.append('plan_details[billing_contact][company_name]', payloadData.plan_details.billing_contact.company_name);
      formData.append('plan_details[billing_contact][billing_address][street]', payloadData.plan_details.billing_contact.billing_address.street);
      formData.append('plan_details[billing_contact][billing_address][city]', payloadData.plan_details.billing_contact.billing_address.city);
      formData.append('plan_details[billing_contact][billing_address][state]', payloadData.plan_details.billing_contact.billing_address.state);
      formData.append('plan_details[billing_contact][billing_address][postal_code]', payloadData.plan_details.billing_contact.billing_address.postal_code);
      formData.append('plan_details[billing_contact][billing_address][country]', payloadData.plan_details.billing_contact.billing_address.country);
      
      // AI Employees
      payloadData.ai_employees.forEach((employee, index) => {
        Object.entries(employee).forEach(([key, value]) => {
          formData.append(`ai_employees[${index}][${key}]`, String(value));
        });
      });
      
      // Other sections
      formData.append('knowledge_sources[website_url]', payloadData.knowledge_sources.website_url);
      formData.append('knowledge_sources[social_links][linkedin]', payloadData.knowledge_sources.social_links.linkedin);
      formData.append('knowledge_sources[faqs_text]', payloadData.knowledge_sources.faqs_text);
      formData.append('instructions[dos_and_donts]', payloadData.instructions.dos_and_donts);
      formData.append('instructions[fallback_contacts]', payloadData.instructions.fallback_contacts);
      formData.append('targets[success_goals]', payloadData.targets.success_goals);
      formData.append('targets[success_metrics]', payloadData.targets.success_metrics);
      
      payloadData.deployment_targets.channels.forEach((channel, index) => {
        formData.append(`deployment_targets[channels][${index}]`, channel);
      });
      formData.append('deployment_targets[deployment_notes]', payloadData.deployment_targets.deployment_notes);
      formData.append('deployment_service[service_type]', payloadData.deployment_service.service_type);
      formData.append('consent_options[recording_enabled]', String(payloadData.consent_options.recording_enabled));
      formData.append('consent_options[transcript_email_optin]', String(payloadData.consent_options.transcript_email_optin));
      formData.append('consent_options[privacy_notes]', payloadData.consent_options.privacy_notes);
      
      // Append files
      allFiles.forEach((file) => {
        formData.append('files', file);
      });

      const loadingToast = toast.loading('Saving draft...');

      // Get pending auth token
      const pendingTokens = localStorage.getItem("pending_auth_tokens");
      let accessToken = "";
      if (pendingTokens) {
        const tokens = JSON.parse(pendingTokens);
        accessToken = tokens.accessToken;
      }

      await authAPI.saveDraftOnboarding(formData as any, accessToken);

      toast.dismiss(loadingToast);
      toast.success('Draft saved successfully!');

      // Navigate to home
      navigate("/");
    } catch (error: any) {
      toast.dismiss();
      
      // Enhanced error handling with detailed messages
      let errorMessage = "Failed to save draft. Please try again.";
      
      if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        // Handle validation errors array
        const errors = error.response.data.errors;
        const errorMessages = errors.map((err: any) => {
          if (err.field && err.message) {
            // Format field name to be more readable
            const fieldName = err.field.replace(/_/g, ' ').replace(/\./g, ' > ');
            return `${fieldName}: ${err.message}`;
          }
          return err.message || err;
        });
        errorMessage = errorMessages.join('\n');
        toast.error(errorMessage, { duration: 6000 });
      } else if (error?.response?.data?.message) {
        // Handle single error message
        errorMessage = error.response.data.message;
        toast.error(errorMessage, { duration: 5000 });
      } else if (error?.response?.status === 400) {
        errorMessage = "Invalid data. Please check your inputs and try again.";
        toast.error(errorMessage);
      } else if (error?.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSavingDraft(false);
    }
  };

  const onSubmit = async (data: OnboardingFormData) => {
    if (currentStep !== totalSteps) return;

    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { payloadData, allFiles } = buildFormDataPayload(data);

      // Create FormData to handle file uploads (same logic as draft)
      const formData = new FormData();
      
      // Append each nested field individually for proper parsing
      // Company basics
      Object.entries(payloadData.company_basics).forEach(([key, value]) => {
        if (key === 'industry' && Array.isArray(value)) {
          // Append industry array items individually
          value.forEach((item, index) => {
            formData.append(`company_basics[industry][${index}]`, item);
          });
        } else if (Array.isArray(value)) {
          formData.append(`company_basics[${key}]`, JSON.stringify(value));
        } else {
          formData.append(`company_basics[${key}]`, String(value));
        }
      });
      
    
      formData.append('plan_details[type]', payloadData.plan_details.type);
      formData.append('plan_details[ai_employee_limit]', String(payloadData.plan_details.ai_employee_limit));
      formData.append('plan_details[billing_contact][name]', payloadData.plan_details.billing_contact.name);
      formData.append('plan_details[billing_contact][email]', payloadData.plan_details.billing_contact.email);
      formData.append('plan_details[billing_contact][phone]', payloadData.plan_details.billing_contact.phone);
      formData.append('plan_details[billing_contact][company_name]', payloadData.plan_details.billing_contact.company_name);
      formData.append('plan_details[billing_contact][billing_address][street]', payloadData.plan_details.billing_contact.billing_address.street);
      formData.append('plan_details[billing_contact][billing_address][city]', payloadData.plan_details.billing_contact.billing_address.city);
      formData.append('plan_details[billing_contact][billing_address][state]', payloadData.plan_details.billing_contact.billing_address.state);
      formData.append('plan_details[billing_contact][billing_address][postal_code]', payloadData.plan_details.billing_contact.billing_address.postal_code);
      formData.append('plan_details[billing_contact][billing_address][country]', payloadData.plan_details.billing_contact.billing_address.country);
      
      // AI Employees - append as JSON array
      payloadData.ai_employees.forEach((employee, index) => {
        Object.entries(employee).forEach(([key, value]) => {
          formData.append(`ai_employees[${index}][${key}]`, String(value));
        });
      });
      
      // Knowledge sources
      formData.append('knowledge_sources[website_url]', payloadData.knowledge_sources.website_url);
      formData.append('knowledge_sources[social_links][linkedin]', payloadData.knowledge_sources.social_links.linkedin);
      formData.append('knowledge_sources[faqs_text]', payloadData.knowledge_sources.faqs_text);
      
      // Instructions
      formData.append('instructions[dos_and_donts]', payloadData.instructions.dos_and_donts);
      formData.append('instructions[fallback_contacts]', payloadData.instructions.fallback_contacts);
      
      // Targets
      formData.append('targets[success_goals]', payloadData.targets.success_goals);
      formData.append('targets[success_metrics]', payloadData.targets.success_metrics);
      
      // Deployment targets
      payloadData.deployment_targets.channels.forEach((channel, index) => {
        formData.append(`deployment_targets[channels][${index}]`, channel);
      });
      formData.append('deployment_targets[deployment_notes]', payloadData.deployment_targets.deployment_notes);
      
      // Deployment service
      formData.append('deployment_service[service_type]', payloadData.deployment_service.service_type);
      
      // Consent options
      formData.append('consent_options[recording_enabled]', String(payloadData.consent_options.recording_enabled));
      formData.append('consent_options[transcript_email_optin]', String(payloadData.consent_options.transcript_email_optin));
      formData.append('consent_options[privacy_notes]', payloadData.consent_options.privacy_notes);
      
      // Append files
      allFiles.forEach((file) => {
        formData.append('files', file);
      });

      const loadingToast = toast.loading('Setting up your account...');

      // Get pending auth token
      const pendingTokens = localStorage.getItem("pending_auth_tokens");
      let accessToken = "";
      if (pendingTokens) {
        const tokens = JSON.parse(pendingTokens);
        accessToken = tokens.accessToken;
      }

      await authAPI.createOnboarding(formData as any, accessToken);

      toast.dismiss(loadingToast);
      toast.success('Onboarding completed successfully!');

      setShowSuccessModal(true);
    } catch (error: any) {
      toast.dismiss();

      // Enhanced error handling with detailed validation messages
      let errorMessage = "There was an error submitting your onboarding. Please try again.";

      if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        // Handle validation errors array - PRIORITIZE THIS
        const errors = error.response.data.errors;
        const errorMessages = errors.map((err: any) => {
          if (err.field && err.message) {
            // Format field name to be more readable
            const fieldName = err.field.replace(/_/g, ' ').replace(/\./g, ' > ');
            return `• ${fieldName}: ${err.message}`;
          }
          return `• ${err.message || err}`;
        });
        
        // Show first error immediately, then all errors
        if (errorMessages.length === 1) {
          toast.error(errorMessages[0], { duration: 6000 });
        } else {
          toast.error(`Validation failed:\n${errorMessages.slice(0, 3).join('\n')}${errorMessages.length > 3 ? `\n... and ${errorMessages.length - 3} more` : ''}`, { 
            duration: 8000,
            style: {
              whiteSpace: 'pre-line'
            }
          });
        }
      } else if (error?.response?.data?.message) {
        // Handle API error messages (including 409 conflict)
        errorMessage = error.response.data.message;
        toast.error(errorMessage, { duration: 6000 });
      } else if (error?.response?.status === 400) {
        errorMessage = "Invalid data submitted. Please check your inputs and try again.";
        toast.error(errorMessage);
      } else if (error?.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again and try submitting.";
        toast.error(errorMessage);
      } else if (error?.response?.status === 500) {
        errorMessage = "Server error. Please try again in a few minutes.";
        toast.error(errorMessage);
      } else if (error?.message?.includes("Network")) {
        errorMessage = "Network error. Please check your connection and try again.";
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    
    // Clear pending auth tokens and related data
    localStorage.removeItem("pending_auth_tokens");
    localStorage.removeItem("pending_auth_user");
    localStorage.removeItem("onboarding_code");
    localStorage.removeItem("onboarding_user_id");
    localStorage.removeItem("onboarding_verification_id");
    
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
            className="space-y-3 bg-white p-3 sm:p-4 lg:p-5 rounded-xl shadow-md border border-gray-200"
          >
            <div className="text-start mb-4 bg-slate-100 p-3 rounded-md flex items-center gap-2 ">
              <span className="text-sm text-gray-700 bg-white p-2 rounded-full shadow-sm">
                <Building2 className="w-5 h-5 text-gray-500" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 ">
                Company Basics
              </h2>
            </div>

            {/* Personal Information Section */}
       

            <div className="space-y-2.5">
             

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-2.5">
                 <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  {...register("companyName", {
                    required: "Company name is required",
                    minLength: {
                      value: 2,
                      message: "Company name must be at least 2 characters",
                    },
                  })}
                  className={`w-full px-2.5 py-1.5 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.companyName
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter your company name"
                />
                {errors.companyName && (
                  <p className="mt-0.5 text-xs text-red-600">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      {...register("website", {
                        required: false,
                        pattern: {
                          value: /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/.*)?$/,
                          message:
                            "Please enter a valid website (e.g., facebook.com or https://example.com)",
                        },
                      })}
                      type="text"
                      className={`w-full pl-8 pr-2.5 py-1.5 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.website
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="www.company.com"
                    />
                  </div>
                  {errors.website && (
                    <p className="mt-0.5 text-xs text-red-600">
                      {errors.website.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Company Size <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("companySize", { required: "Company size is required" })}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-all hover:border-gray-400"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 0.5rem center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "1.25em 1.25em",
                      paddingRight: "2.5rem",
                    }}
                  >
                    <option value="">Select company size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                  {errors.companySize && (
                    <p className="mt-0.5 text-xs text-red-600">
                      {errors.companySize.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Company Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <svg
                      className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                    <input
                      {...register("companyEmail", {
                        required: "Company email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Please enter a valid email address",
                        },
                      })}
                      type="email"
                      className="w-full pl-8 pr-2.5 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400"
                      placeholder="info@company.com"
                    />
                  </div>
                  {errors.companyEmail && (
                    <p className="mt-0.5 text-xs text-red-600">
                      {errors.companyEmail.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Company Phone
                  </label>
                  <div className="flex gap-1.5">
                    <div className="">
                      <CountrySelector
                        selectedCountry={selectedCompanyCountry}
                        onCountryChange={setSelectedCompanyCountry}
                      />
                    </div>
                    <div className="flex-1 relative">
                      <Phone className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        {...register("companyPhone", {
                          validate: (value) => {
                            if (!value) return true; // Optional field
                            try {
                              const fullNumber = `${selectedCompanyCountry.dialCode}${value}`;
                              
                              // Parse the number with strict country validation
                              const parsedNumber = parsePhoneNumber(fullNumber, selectedCompanyCountry.code as any);
                              
                              if (!parsedNumber) {
                                return `Invalid phone number for ${selectedCompanyCountry.name}`;
                              }
                              
                              // Check if the parsed country matches the selected country
                              if (parsedNumber.country !== selectedCompanyCountry.code) {
                                return `This number doesn't match ${selectedCompanyCountry.name}`;
                              }
                              
                              // Strict validation: check if the number is valid
                              if (!parsedNumber.isValid()) {
                                return `Invalid phone number for ${selectedCompanyCountry.name}`;
                              }
                              
                              return true;
                            } catch (error) {
                              return "Invalid phone number format";
                            }
                          },
                          pattern: {
                            value: /^[0-9]{0,15}$/,
                            message: "Phone number must contain only digits (max 15)"
                          }
                        })}
                        type="tel"
                        maxLength={15}
                        onInput={(e) => {
                          const target = e.target as HTMLInputElement;
                          target.value = target.value.replace(/[^0-9]/g, '');
                        }}
                        className={`w-full pl-8 pr-2.5 py-1.5 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400 ${
                          errors.companyPhone ? "border-red-500 bg-red-50" : "border-gray-300"
                        }`}
                        placeholder="1234567890"
                      />
                    </div>
                  </div>
                  {errors.companyPhone && (
                    <p className="mt-0.5 text-xs text-red-600">
                      {errors.companyPhone.message}
                    </p>
                  )}
                </div>

               
              </div>
               <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Industry <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({(watch("industry") || []).length}/4 max)
                  </span>
                </label>
                <div className="relative" data-dropdown-trigger>
                  <input
                    ref={industryInputRef}
                    value={industrySearch}
                    onChange={(e) => setIndustrySearch(e.target.value)}
                    onKeyDown={() => {
                      // Clear the placeholder text when user starts typing
                      if (industrySearch === "Add your industry type") {
                        setIndustrySearch("");
                      }
                    }}
                    onFocus={() => setShowIndustryDropdown(true)}
                    disabled={(watch("industry") || []).length >= 4}
                    className={`w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      (watch("industry") || []).length >= 4
                        ? "bg-gray-100 cursor-not-allowed text-gray-500"
                        : "bg-white hover:border-gray-400"
                    }`}
                    placeholder={
                      (watch("industry") || []).length >= 4
                        ? "Maximum 4 industries selected"
                        : "Search or add industries"
                    }
                  />
                  <ChevronDown
                    className={`absolute right-2.5 top-2 w-3.5 h-3.5 text-gray-400 transition-transform cursor-pointer ${
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
                              if (option.value === "other") {
                                // When "Other" is clicked, set placeholder text and focus input
                                setIndustrySearch("Add your industry type");
                                setTimeout(() => {
                                  industryInputRef.current?.focus();
                                  industryInputRef.current?.select();
                                }, 100);
                              } else if (currentIndustries.length < 4) {
                                setValue("industry", [
                                  ...currentIndustries,
                                  option.value,
                                ]);
                                setIndustrySearch("");
                              }
                            }}
                            className={`px-3 py-2 border-b border-gray-100 last:border-b-0 ${
                              (watch("industry") || []).length >= 4
                                ? "cursor-not-allowed text-gray-400 bg-gray-50"
                                : "hover:bg-gray-50 cursor-pointer"
                            }`}
                          >
                            {option.label}
                            {(watch("industry") || []).length >= 4 && (
                              <span className="text-xs text-gray-400 ml-2">
                                (Max reached)
                              </span>
                            )}
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
                              if (currentIndustries.length < 4) {
                                setValue("industry", [
                                  ...currentIndustries,
                                  industrySearch,
                                ]);
                                setIndustrySearch("");
                              }
                            }}
                            className={`px-3 py-2 font-medium ${
                              (watch("industry") || []).length >= 4
                                ? "cursor-not-allowed text-gray-400 bg-gray-50"
                                : "hover:bg-blue-50 cursor-pointer text-blue-600"
                            }`}
                          >
                            + Add "{industrySearch}"
                            {(watch("industry") || []).length >= 4 && (
                              <span className="text-xs text-gray-400 ml-2">
                                (Max 4 reached)
                              </span>
                            )}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>


 <div className="bg-slate-100 rounded-lg p-2.5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-900">
                      Region of Business
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {/* Countries Multi-Select */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Countries
                      <span className="text-xs text-gray-500 ml-2">
                        ({selectedCountries.length} selected)
                      </span>
                    </label>
                    <div className="relative" data-dropdown-trigger>
                      <input
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        onFocus={() => setShowCountryDropdown(true)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400"
                        placeholder="Search countries..."
                      />
                      <ChevronDown
                        className={`absolute right-2.5 top-2 w-3.5 h-3.5 text-gray-400 transition-transform cursor-pointer ${
                          showCountryDropdown ? "rotate-180" : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const newState = !showCountryDropdown;
                          setShowCountryDropdown(newState);
                          if (!newState) {
                            setCountrySearch("");
                          }
                        }}
                      />

                      {/* Selected Countries Display */}
                      {selectedCountries.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {selectedCountries.map((country) => (
                            <span
                              key={country.code}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                            >
                              {country.name}
                              <X
                                className="w-3 h-3 cursor-pointer hover:text-blue-900"
                                onClick={() => {
                                  const newCountries = selectedCountries.filter(
                                    (c) => c.code !== country.code
                                  );
                                  setSelectedCountries(newCountries);
                                  // Clear states and cities that belong to removed country
                                  setSelectedStates(
                                    selectedStates.filter((s) => s.countryCode !== country.code)
                                  );
                                  setSelectedCities(
                                    selectedCities.filter((c) => c.countryCode !== country.code)
                                  );
                                }}
                              />
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Countries Dropdown */}
                      {showCountryDropdown && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto" data-dropdown>
                          {locationAPI.searchCountries(countrySearch).map((country) => {
                            const isSelected = selectedCountries.some(
                              (c) => c.code === country.code
                            );
                            return (
                              <div
                                key={country.code}
                                onClick={() => {
                                  if (isSelected) {
                                    const newCountries = selectedCountries.filter(
                                      (c) => c.code !== country.code
                                    );
                                    setSelectedCountries(newCountries);
                                    // Clear states and cities
                                    setSelectedStates(
                                      selectedStates.filter((s) => s.countryCode !== country.code)
                                    );
                                    setSelectedCities(
                                      selectedCities.filter((c) => c.countryCode !== country.code)
                                    );
                                  } else {
                                    setSelectedCountries([...selectedCountries, country]);
                                  }
                                }}
                                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                                  isSelected
                                    ? "bg-blue-50 text-blue-700 font-medium"
                                    : "hover:bg-gray-50 text-gray-700"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{country.name}</span>
                                  {isSelected && <Check className="w-4 h-4" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* States Multi-Select */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      States/Provinces
                      <span className="text-xs text-gray-500 ml-2">
                        ({selectedStates.length} selected)
                      </span>
                    </label>
                    <div className="relative" data-dropdown-trigger>
                      <input
                        value={stateSearch}
                        onChange={(e) => setStateSearch(e.target.value)}
                        onFocus={() => setShowStateDropdown(true)}
                        disabled={selectedCountries.length === 0}
                        className={`w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          selectedCountries.length === 0
                            ? "bg-gray-100 cursor-not-allowed"
                            : "bg-white hover:border-gray-400"
                        }`}
                        placeholder={
                          selectedCountries.length === 0
                            ? "Select countries first"
                            : "Search states..."
                        }
                      />
                      {selectedCountries.length > 0 && (
                        <ChevronDown
                          className={`absolute right-2.5 top-2 w-3.5 h-3.5 text-gray-400 transition-transform cursor-pointer ${
                            showStateDropdown ? "rotate-180" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const newState = !showStateDropdown;
                            setShowStateDropdown(newState);
                            if (!newState) {
                              setStateSearch("");
                            }
                          }}
                        />
                      )}

                      {/* Selected States Display */}
                      {selectedStates.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {selectedStates.map((state) => (
                            <span
                              key={`${state.countryCode}-${state.code}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full"
                            >
                              {state.name}
                              <X
                                className="w-3 h-3 cursor-pointer hover:text-green-900"
                                onClick={() => {
                                  const newStates = selectedStates.filter(
                                    (s) => s.code !== state.code || s.countryCode !== state.countryCode
                                  );
                                  setSelectedStates(newStates);
                                  // Clear cities that belong to removed state
                                  setSelectedCities(
                                    selectedCities.filter(
                                      (c) => c.stateCode !== state.code || c.countryCode !== state.countryCode
                                    )
                                  );
                                }}
                              />
                            </span>
                          ))}
                        </div>
                      )}

                      {/* States Dropdown - Grouped by Country */}
                      {showStateDropdown && selectedCountries.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto" data-dropdown>
                          {(() => {
                            const allStates = locationAPI.searchStates(
                              selectedCountries.map((c) => c.code),
                              stateSearch
                            );
                            
                            // Group states by country
                            const statesByCountry: Record<string, typeof allStates> = {};
                            allStates.forEach((state) => {
                              if (!statesByCountry[state.countryCode]) {
                                statesByCountry[state.countryCode] = [];
                              }
                              statesByCountry[state.countryCode].push(state);
                            });

                            return Object.entries(statesByCountry).map(([countryCode, states]) => {
                              const country = selectedCountries.find(c => c.code === countryCode);
                              return (
                                <div key={countryCode}>
                                  {/* Country Header */}
                                  <div className="px-3 py-1.5 bg-gray-100 text-xs font-semibold text-gray-600 sticky top-0">
                                    {country?.name || countryCode}
                                  </div>
                                  {/* States under this country */}
                                  {states.map((state) => {
                                    const isSelected = selectedStates.some(
                                      (s) => s.code === state.code && s.countryCode === state.countryCode
                                    );
                                    return (
                                      <div
                                        key={`${state.countryCode}-${state.code}`}
                                        onClick={() => {
                                          if (isSelected) {
                                            const newStates = selectedStates.filter(
                                              (s) => s.code !== state.code || s.countryCode !== state.countryCode
                                            );
                                            setSelectedStates(newStates);
                                            setSelectedCities(
                                              selectedCities.filter(
                                                (c) => c.stateCode !== state.code || c.countryCode !== state.countryCode
                                              )
                                            );
                                          } else {
                                            setSelectedStates([...selectedStates, state]);
                                          }
                                        }}
                                        className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                                          isSelected
                                            ? "bg-green-50 text-green-700 font-medium"
                                            : "hover:bg-gray-50 text-gray-700"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span>{state.name}</span>
                                          {isSelected && <Check className="w-4 h-4" />}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cities Multi-Select */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Key Cities
                      <span className="text-xs text-gray-500 ml-2">
                        ({selectedCities.length} selected)
                      </span>
                    </label>
                    <div className="relative" data-dropdown-trigger>
                      <input
                        value={citySearch}
                        onChange={(e) => setCitySearch(e.target.value)}
                        onFocus={() => setShowCityDropdown(true)}
                        disabled={selectedStates.length === 0}
                        className={`w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          selectedStates.length === 0
                            ? "bg-gray-100 cursor-not-allowed"
                            : "bg-white hover:border-gray-400"
                        }`}
                        placeholder={
                          selectedStates.length === 0
                            ? "Select states first"
                            : "Search cities..."
                        }
                      />
                      {selectedStates.length > 0 && (
                        <ChevronDown
                          className={`absolute right-2.5 top-2 w-3.5 h-3.5 text-gray-400 transition-transform cursor-pointer ${
                            showCityDropdown ? "rotate-180" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const newState = !showCityDropdown;
                            setShowCityDropdown(newState);
                            if (!newState) {
                              setCitySearch("");
                            }
                          }}
                        />
                      )}

                      {/* Selected Cities Display */}
                      {selectedCities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {selectedCities.map((city, idx) => (
                            <span
                              key={`${city.countryCode}-${city.stateCode}-${city.name}-${idx}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
                            >
                              {city.name}
                              <X
                                className="w-3 h-3 cursor-pointer hover:text-purple-900"
                                onClick={() => {
                                  setSelectedCities(
                                    selectedCities.filter((_c, i) => i !== idx)
                                  );
                                }}
                              />
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Cities Dropdown - Grouped by State */}
                      {showCityDropdown && selectedStates.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto" data-dropdown>
                          {(() => {
                            const allCities = locationAPI.searchCities(
                              selectedStates.map((s) => `${s.countryCode}-${s.code}`),
                              citySearch
                            );
                            
                            // Group cities by state
                            const citiesByState: Record<string, typeof allCities> = {};
                            allCities.forEach((city) => {
                              const stateKey = `${city.countryCode}-${city.stateCode}`;
                              if (!citiesByState[stateKey]) {
                                citiesByState[stateKey] = [];
                              }
                              citiesByState[stateKey].push(city);
                            });

                            return Object.entries(citiesByState).map(([stateKey, cities]) => {
                              const [countryCode, stateCode] = stateKey.split('-');
                              const state = selectedStates.find(s => s.code === stateCode && s.countryCode === countryCode);
                              return (
                                <div key={stateKey}>
                                  {/* State Header */}
                                  <div className="px-3 py-1.5 bg-gray-100 text-xs font-semibold text-gray-600 sticky top-0">
                                    {state?.name || stateCode}
                                  </div>
                                  {/* Cities under this state */}
                                  {cities.map((city, idx) => {
                                    const isSelected = selectedCities.some(
                                      (c) =>
                                        c.name === city.name &&
                                        c.stateCode === city.stateCode &&
                                        c.countryCode === city.countryCode
                                    );
                                    return (
                                      <div
                                        key={`${city.countryCode}-${city.stateCode}-${city.name}-${idx}`}
                                        onClick={() => {
                                          if (isSelected) {
                                            setSelectedCities(
                                              selectedCities.filter(
                                                (c) =>
                                                  !(
                                                    c.name === city.name &&
                                                    c.stateCode === city.stateCode &&
                                                    c.countryCode === city.countryCode
                                                  )
                                              )
                                            );
                                          } else {
                                            setSelectedCities([...selectedCities, city]);
                                          }
                                        }}
                                        className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                                          isSelected
                                            ? "bg-purple-50 text-purple-700 font-medium"
                                            : "hover:bg-gray-50 text-gray-700"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span>{city.name}</span>
                                          {isSelected && <Check className="w-4 h-4" />}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Company Description
                </label>
                <textarea
                  {...register("companyDescription")}
                  rows={2}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all hover:border-gray-400"
                  placeholder="Brief description of what your company does..."
                />
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
            className="space-y-3 bg-white p-3 sm:p-4 lg:p-5 rounded-xl shadow-md border border-gray-200"
          >
            <div className="text-start mb-4 bg-slate-100 p-3 rounded-md flex items-center gap-2 ">
              <span className="text-sm text-gray-700 bg-white p-2 rounded-full shadow-sm">
                <Crown className="w-6 h-6 " />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 ">
                Choose Your Plan
              </h2>
            </div>

            {/* Plan Selection */}
            <input
              {...register("plan", { required: "Please select a plan" })}
              type="hidden"
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              {planOptions.map((plan) => {
                const isSelected = watch("plan") === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => {
                      setValue(
                        "plan",
                        plan.id as "starter" | "professional" | "business" | "custom",
                        {
                          shouldValidate: true,
                        }
                      );
                      // Reset agent count based on plan
                      setValue("agentCount", 1);
                    }}
                    className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? plan.id === "custom"
                          ? "border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg"
                          : "border-blue-500 bg-blue-50 shadow-lg"
                        : plan.id === "custom"
                        ? "border-purple-300 bg-gradient-to-br from-purple-25 to-blue-25 hover:border-purple-400 hover:shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    {isSelected && (
                      <div
                        className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                          plan.id === "custom" ? "bg-purple-500" : "bg-blue-500"
                        }`}
                      >
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {plan.id === "custom" && (
                      <div className="absolute -top-1.5 -left-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                        PREMIUM
                      </div>
                    )}

                    <div className="text-center mb-2">
                      <h3
                        className={`text-base font-bold mb-1 ${
                          plan.id === "custom"
                            ? "text-purple-800"
                            : "text-gray-900"
                        }`}
                      >
                        {plan.name}
                      </h3>
                      <p className="text-gray-600 text-xs mb-2">
                        {plan.description}
                      </p>
                      <div
                        className={`text-lg font-bold ${
                          plan.id === "custom"
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
                            : "text-blue-600"
                        }`}
                      >
                        {plan.price}
                      </div>
                      {plan.id === "custom" && (
                        <p className="text-[10px] text-purple-600 mt-0.5 font-medium">
                          Contact us for pricing
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span className="text-xs text-gray-700">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Plan Selection Error */}
            {errors.plan && (
              <div className="text-center mb-2">
                <p className="text-red-600 text-xs">
                  Please select a plan to continue
                </p>
              </div>
            )}

            {/* AI Employee Count Selection */}
            {watch("plan") && (() => {
              const selectedPlan = planOptions.find((p) => p.id === watch("plan"));
              // Hide the entire section if plan has only 1 AI employee (Starter plan)
              if (selectedPlan?.aiEmployees === 1) {
                // Automatically set agentCount to 1 for starter plan
                if (watch("agentCount") !== 1) {
                  setValue("agentCount", 1);
                }
                return null;
              }
              return (
                <div className="border-t border-gray-200 pt-3">
                  <div className="text-center mb-3">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                      How many AI Employees do you need?
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">
                      {watch("plan") === "professional"
                        ? "Professional plan supports up to 4 AI Employees during onboarding"
                        : watch("plan") === "business"
                        ? "Business plan supports up to 4 AI Employees during onboarding"
                        : "Custom plan allows up to 4 AI Employees during onboarding"}
                    </p>
                  </div>

                <div className="flex justify-center">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {(() => {
                      const selectedPlan = planOptions.find(
                        (p) => p.id === watch("plan")
                      );
                      // Limit to 4 employees during onboarding for all plans
                      const maxAgents = Math.min(selectedPlan?.maxAgents || 1, 4);
                      return Array.from(
                        { length: maxAgents },
                        (_, i) => i + 1
                      ).map((count) => (
                        <label
                          key={count}
                          className={`px-4 py-2 rounded-lg cursor-pointer transition-all font-medium text-xs flex items-center justify-center min-w-[100px] ${
                            watch("agentCount") === count
                              ? watch("plan") === "custom"
                                ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-md"
                                : "bg-blue-600 text-white shadow-md"
                              : watch("plan") === "custom"
                              ? "bg-gradient-to-br from-purple-50 to-blue-50 text-gray-700 hover:from-purple-100 hover:to-blue-100 border border-purple-200"
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
                          {count}{" "}
                          {count === 1 ? "AI Employee" : "AI Employees"}
                        </label>
                      ));
                    })()}
                  </div>
                </div>
              </div>
              );
            })()}

            {/* Billing Information Section */}
            {watch("plan") && (
              <div className="border-t border-gray-200 pt-3">
                <div className="text-center mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                    Billing Information
                  </h3>
                </div>

                {/* Show billing form only if offline billing is not selected */}
                {!watch("offlineBilling") && (
                  <div className="max-w-4xl mx-auto space-y-3">
                    {/* Same as Company Info Checkbox */}
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <input
                        type="checkbox"
                        id="sameAsCompany"
                        checked={sameAsCompany}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSameAsCompany(checked);
                          if (checked) {
                            // Auto-fill billing info from company data
                            setValue("billingContactName", watch("companyName") || "");
                            setValue("billingContactEmail", watch("companyEmail") || "");
                            setValue("billingContactPhone", watch("companyPhone") || "");
                            setValue("billingCompanyName", watch("companyName") || "");
                          } else {
                            // Clear billing info when unchecked
                            setValue("billingContactName", "");
                            setValue("billingContactEmail", "");
                            setValue("billingContactPhone", "");
                            setValue("billingCompanyName", "");
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                      />
                      <label
                        htmlFor="sameAsCompany"
                        className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                      >
                        Same as Company information
                      </label>
                    </div>

                    {/* Billing Contact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Billing Contact Name *
                        </label>
                        <input
                          {...register("billingContactName", {
                            required: "Billing contact name is required",
                          })}
                          className={`w-full px-2.5 py-1.5 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.billingContactName
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300"
                          }`}
                          placeholder="John Smith"
                        />
                        {errors.billingContactName && (
                          <p className="mt-0.5 text-xs text-red-600">
                            {errors.billingContactName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Billing Email
                        </label>
                        <input
                          {...register("billingContactEmail", {
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: "Please enter a valid email address",
                            },
                          })}
                          type="email"
                          className={`w-full px-2.5 py-1.5 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.billingContactEmail
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300"
                          }`}
                          placeholder="billing@company.com"
                        />
                        {errors.billingContactEmail && (
                          <p className="mt-0.5 text-xs text-red-600">
                            {errors.billingContactEmail.message}
                          </p>
                        )}
                      </div>


                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Company Name (if different)
                        </label>
                        <input
                          {...register("billingCompanyName")}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Billing Company Name"
                        />
                      </div>
                    </div>

                    {/* Billing Address */}
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Billing Address
                        </label>
                        <input
                          {...register("billingAddress")}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="123 Main Street, Suite 100"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            City
                          </label>
                          <input
                            {...register("billingCity")}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="New York"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            State/Province
                          </label>
                          <input
                            {...register("billingState")}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="NY"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            ZIP/Postal
                          </label>
                          <input
                            {...register("billingZip")}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="10001"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <select
                          {...register("billingCountry")}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Country</option>
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                          <option value="GB">United Kingdom</option>
                          <option value="AU">Australia</option>
                          <option value="DE">Germany</option>
                          <option value="FR">France</option>
                          <option value="IN">India</option>
                          <option value="JP">Japan</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
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
            errors={errors}
            agentCount={agentCount}
            stepVariants={stepVariants}
            activeAgentTab={activeAgentTab}
            setActiveAgentTab={setActiveAgentTab}
            selectedTemplates={selectedTemplates}
            setSelectedTemplates={setSelectedTemplates}
            showTemplateFeatures={showTemplateFeatures}
            setShowTemplateFeatures={setShowTemplateFeatures}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      {/* Toast Notifications */}
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="mx-auto px-4 sm:px-6 lg:px-14 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-end gap-2 sm:gap-3 ">
              <img src={logo} alt="ShivAI Logo" className="h-5 sm:h-6" />
              <h1 className="text-sm sm:text-base font-semibold text-gray-600 relative top-1">
                Onboarding Process
              </h1>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {Array.from({ length: totalSteps }, (_, i) => {
                const stepNumber = i + 1;
                const isCompleted = stepNumber < currentStep;
                const isCurrent = stepNumber === currentStep;
                const isValid = validateStep(stepNumber);

                return (
                  <div
                    key={i}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? isValid
                          ? "bg-blue-500 text-white"
                          : "bg-yellow-500 text-white animate-pulse"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-3">
        <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

        <div className="mt-2 sm:mt-3 mb-4 sm:mb-6 flex flex-row justify-between gap-2">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            style={
              currentStep === 1
                ? {}
                : {
                    background:
                      "linear-gradient(151.44deg, #FFFFFF -62.65%, #FBFBFE 83.01%)",
                    borderRadius: "1549.79px",
                  }
            }
            className={`flex items-center justify-center px-3 sm:px-6 py-2 sm:py-2.5 flex-1 sm:flex-none sm:min-w-[110px] font-semibold text-xs sm:text-sm transition-all touch-manipulation shadow-sm ${
              currentStep === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed rounded-xl"
                : "text-gray-700 hover:bg-gray-50 active:bg-gray-200 border border-gray-300"
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Previous
          </button>

          <button
            type="button"
            onClick={handleSaveAsDraft}
            disabled={isSavingDraft}
            style={{
              // background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "1549.79px",
              boxShadow: "0px 4px 12px rgba(102, 126, 234, 0.3)",
            }}
            className="flex items-center border border-slate-100 bg-white justify-center px-3 sm:px-5 py-2 sm:py-2.5 text-slate-600 font-semibold text-xs sm:text-sm transition-all touch-manipulation hover:transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingDraft ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                Save as Draft
              </>
            )}
          </button>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
              style={
                validateStep(currentStep)
                  ? {
                      background:
                        "linear-gradient(0deg, #0A0A0A 0%, #000000 100%)",
                      boxShadow:
                        "0px 12.4px 18.6px -9.3px #00000040, 0px -6.2px 9.3px 0px #171717 inset, 0px 3.49px 0.77px 0px #5E5E5E inset, 0px 1.55px 0.77px 0px #33332F inset",
                      borderRadius: "1549.79px",
                    }
                  : {
                      borderRadius: "1549.79px",
                    }
              }
              className={`flex items-center justify-center px-4 sm:px-6 py-2 sm:py-2.5 flex-1 sm:flex-none sm:min-w-[110px] font-semibold text-xs sm:text-sm transition-all touch-manipulation ${
                validateStep(currentStep)
                  ? "text-white hover:transform hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              style={{
                background: "linear-gradient(0deg, #0A0A0A 0%, #000000 100%)",
                boxShadow:
                  "0px 12.4px 18.6px -9.3px #00000040, 0px -6.2px 9.3px 0px #171717 inset, 0px 3.49px 0.77px 0px #5E5E5E inset, 0px 1.55px 0.77px 0px #33332F inset",
                borderRadius: "1549.79px",
              }}
              className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-2.5 flex-1 sm:flex-none sm:min-w-[130px] text-white font-semibold text-xs sm:text-sm transition-all touch-manipulation hover:transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Setting up...
                </>
              ) : (
                "Complete Setup"
              )}
            </button>
          )}
        </div>
      </div>

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
                Your AI Employee is being set up.
              </p>
              <p className="text-gray-700">
                You’ll soon be able to test, refine, and go live with ShivAI.
              </p>
              <p className="text-gray-700">
                We’ll notify you as soon as it’s ready to take calls.
              </p>
            </div>
            <button
              onClick={closeSuccessModal}
              style={{
                background: "linear-gradient(0deg, #0A0A0A 0%, #000000 100%)",
                boxShadow:
                  "0px 12.4px 18.6px -9.3px #00000040, 0px -6.2px 9.3px 0px #171717 inset, 0px 3.49px 0.77px 0px #5E5E5E inset, 0px 1.55px 0.77px 0px #33332F inset",
                borderRadius: "1549.79px",
              }}
              className="w-full text-white py-3 px-6 font-semibold transition-all duration-200 hover:transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Go to Home
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
