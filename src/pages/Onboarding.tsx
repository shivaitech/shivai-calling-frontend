"use client";

import React, { useState, useRef } from "react";
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
  Globe,
  Phone,
  User,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../resources/images/ShivaiLogo.svg";
import Step3, { OnboardingFormData } from "../components/Step3";
import CountrySelector from "../components/CountrySelector";
import { Country, defaultCountries } from "../types/country";
import { authAPI } from "../services/authAPI";

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
      "Call recording & transcripts",
      "Email transcript opt-in",
      "Advanced call routing",
      "Premium integrations",
      "Priority support",
    ],
    price: "$299/month",
  },
  {
    id: "custom",
    name: "Custom Plan",
    description: "Tailor your AI workforce to your exact needs",
    maxAgents: 4,
    features: [
      "Up to 4 AI Employees",
      "Call recording & transcripts",
      "Email transcript opt-in",
      "Fully customizable workflows",
      "All premium integrations",
      "24/7 priority support",
      "Dedicated account manager",
    ],
    price: "Custom pricing",
  },
];

// Use case options
// Template and use case definitions are now consolidated in Step3.tsx component

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

  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [industrySearch, setIndustrySearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country>(defaultCountries[0]);
  const [selectedCompanyCountry, setSelectedCompanyCountry] = useState<Country>(defaultCountries[0]);
  const industryInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
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
    if (currentStep < totalSteps && validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      // Scroll to top smoothly when moving to next step
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Scroll to top smoothly when moving to previous step
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Helper function to close all dropdowns
  const closeAllDropdowns = () => {
    setShowIndustryDropdown(false);
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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(watch("firstName") && watch("lastName") && watch("email") && watch("companyName"));
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

  const onSubmit = async (data: OnboardingFormData) => {
    if (currentStep !== totalSteps) return;

    // Final validation before submission
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      console.error("Form validation failed");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Submitting complete onboarding data:", data);

      // Get selected plan details
      const selectedPlan = planOptions.find(plan => plan.id === data.plan);

      // Construct comprehensive onboarding request
      const onboardingRequest = {
        company_basics: {
          name: data.companyName || "",
          industry: Array.isArray(data.industry) ? data.industry.join(", ") : data.industry || "",
          description: data.companyDescription || "",
          website: data.website || "",
          primary_region: [
            ...(data.businessCities || []),
            ...(data.businessStates || []),
            ...(data.businessCountries || [])
          ].filter(Boolean).join(", "),
          business_processes: data.businessProcesses ? [data.businessProcesses] : [],
          headquarters_address: {
            city: data.businessCities?.[0] || "",
            state_province: data.businessStates?.[0] || "",
            country: data.businessCountries?.[0] || "",
          },
          time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          primary_phone: data.companyPhone ? `${selectedCompanyCountry.dialCode} ${data.companyPhone}` : (data.phone ? `${selectedCountry.dialCode} ${data.phone}` : ""),
          primary_contact: {
            name: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : data.billingContactName || "",
            email: data.email || data.companyEmail || data.billingContactEmail || "",
            phone: data.phone ? `${selectedCountry.dialCode} ${data.phone}` : (data.companyPhone ? `${selectedCompanyCountry.dialCode} ${data.companyPhone}` : data.billingContactPhone || ""),
            title: "Primary Contact",
          },
        },
        plan_details: {
          type: selectedPlan?.name || data.plan || "",
          ai_employee_limit: data.agentCount || 1,
          monthly_price: selectedPlan?.price === "Custom pricing" ? 0 : parseFloat(selectedPlan?.price?.replace(/[$\/month,]/g, "") || "0"),
          features: selectedPlan?.features || [],
        },
        ai_employees: (data.agents || []).map((agent, index) => ({
          name: agent.agentName || `AI Employee ${index + 1}`,
          type: agent.agentType || "",
          preferred_language: agent.preferredLanguage || "English",
          voice_gender: agent.voiceGender || "neutral",
          personality_traits: [agent.agentPersonality || "Professional", agent.responseStyle || "Helpful"].filter(Boolean),
          specialization: agent.agentType || "General Assistant",
        })),
        knowledge_sources: {
          website_url: data.website || "",
          social_links: {
            linkedin: data.linkedinUrl || "",
            twitter: "",
            facebook: "",
          },
          uploaded_files: [],
          faqs_text: "",
          additional_context: data.companyDescription || "",
        },
        instructions: {
          dos: ["Be professional and helpful", "Listen actively to customers", "Provide accurate information"],
          donts: ["Don't make promises you can't keep", "Don't argue with customers", "Don't share confidential information"],
          escalation_rules: [{
            condition: "Customer requests human agent",
            action: "Transfer to available agent",
            priority: "high",
            notify_contacts: [data.companyEmail || data.billingContactEmail || ""],
          }],
          fallback_contacts: [{
            name: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : data.billingContactName || "Primary Contact",
            email: data.email || data.companyEmail || data.billingContactEmail || "",
            phone: data.phone ? `${selectedCountry.dialCode} ${data.phone}` : (data.companyPhone ? `${selectedCompanyCountry.dialCode} ${data.companyPhone}` : data.billingContactPhone || ""),
            role: "Primary Contact",
            availability: "Business hours",
          }],
          tone_guidelines: "Professional, friendly, and helpful",
          response_style: "Clear and concise",
        },
        targets: {
          primary_goals: ["Improve customer satisfaction", "Reduce response time", "Handle routine inquiries"],
          success_metrics: [{
            metric_name: "Customer Satisfaction",
            target_value: "90%",
            measurement_period: "monthly",
            description: "Percentage of satisfied customers",
          }],
          kpis: ["Response time", "Resolution rate", "Customer satisfaction"],
          target_response_time: 30,
          quality_threshold: 85,
        },
        deployment_targets: {
          channels: ["phone", "web", "email"],
          priority_channel: "phone",
          integration_requirements: ["Basic phone system integration"],
          custom_requirements: "",
        },
        deployment_service: {
          service_type: "full_deployment",
          requires_access: true,
          access_details: {
            platforms: ["phone_system"],
            access_type: "api_integration",
            credentials_required: true,
            additional_info: "",
          },
          timeline_preference: "standard",
          technical_contact: {
            name: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : data.billingContactName || "Primary Contact",
            email: data.email || data.companyEmail || data.billingContactEmail || "",
            phone: data.phone ? `${selectedCountry.dialCode} ${data.phone}` : (data.companyPhone ? `${selectedCompanyCountry.dialCode} ${data.companyPhone}` : data.billingContactPhone || ""),
            role: "Technical Contact",
            availability: "Business hours",
          },
        },
        consent_options: {
          recording_enabled: true,
          transcript_email_optin: false,
          data_retention_period: 365,
          privacy_preferences: ["gdpr_compliant"],
          gdpr_compliance: true,
        },
        billing_contact: {
          name: data.billingContactName || (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : "") || data.billingCompanyName || "",
          email: data.billingContactEmail || data.email || data.companyEmail || "",
          phone: data.billingContactPhone || (data.phone ? `${selectedCountry.dialCode} ${data.phone}` : "") || (data.companyPhone ? `${selectedCompanyCountry.dialCode} ${data.companyPhone}` : ""),
          company_role: "Billing Contact",
          billing_address: {
            street: data.billingAddress || "",
            city: data.billingCity || "",
            state: data.billingState || "",
            postal_code: data.billingZip || "",
            country: data.billingCountry || "",
          },
        },
        shivai_team_notes: {
          internal_notes: `Company Size: ${data.companySize || "Not specified"}, Industry: ${Array.isArray(data.industry) ? data.industry.join(", ") : data.industry || "Not specified"}`,
          priority_level: "standard",
          assigned_team_member: "",
          special_requirements: [],
          follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ["onboarding", data.plan || "base_plan", ...(Array.isArray(data.industry) ? data.industry : [data.industry || ""])].filter(Boolean),
        },
      };

      const response = await authAPI.createOnboarding(onboardingRequest);
      console.log("Onboarding successful:", response);
      
      // Show success modal on successful submission
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Onboarding error:", error);
      
      // Better error handling based on error type
      let errorMessage = "There was an error submitting your onboarding. Please try again.";
      
      if (error?.response?.status === 400) {
        errorMessage = "Please check your input data and try again.";
      } else if (error?.response?.status === 401) {
        errorMessage = "Please log in again and try submitting.";
      } else if (error?.response?.status === 500) {
        errorMessage = "Server error. Please try again in a few minutes.";
      } else if (error?.message?.includes("Network")) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      // You can replace this with a proper toast notification component
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    // navigate("/");
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
                Tell us about yourself and your company to customize your AI Employee experience
              </p>
            </div>

            {/* Personal Information Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Personal Information
                  </h3>
                  <p className="text-sm text-gray-600">
                    Let us know who we're working with
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...register("firstName", {
                          required: "First name is required",
                          minLength: {
                            value: 2,
                            message: "First name must be at least 2 characters",
                          },
                        })}
                        className={`w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.firstName
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        placeholder="Enter your first name"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...register("lastName", {
                          required: "Last name is required",
                          minLength: {
                            value: 2,
                            message: "Last name must be at least 2 characters",
                          },
                        })}
                        className={`w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.lastName
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        placeholder="Enter your last name"
                      />
                    </div>
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>

                {/* Email Field */}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      {...register("email", {
                        required: "Email address is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Please enter a valid email address",
                        },
                      })}
                      type="email"
                      className={`w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.email
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="your.email@company.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Phone Field with Country Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <CountrySelector
                      selectedCountry={selectedCountry}
                      onCountryChange={(country) => setSelectedCountry(country)}
                      className="flex-shrink-0"
                    />
                    <div className="flex-1">
                      <input
                        {...register("phone", {
                          pattern: {
                            value: /^[\d\s\-\(\)\.]+$/,
                            message: "Please enter a valid phone number",
                          },
                        })}
                        type="tel"
                        className={`w-full px-3 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.phone
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        placeholder={selectedCountry.example || "(555) 123-4567"}
                      />
                    </div>
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.phone.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    We'll use this to contact you about your AI Employee setup
                  </p>
                </div>
                </div>

              </div>
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
                    minLength: {
                      value: 2,
                      message: "Company name must be at least 2 characters",
                    },
                  })}
                  className={`w-full px-3 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.companyName
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter your company name"
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                      className={`w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.website
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="facebook.com or https://your-company.com"
                    />
                  </div>
                  {errors.website && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.website.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Size
                  </label>
                  <select
                    {...register("companySize")}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-all hover:border-gray-400"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 0.5rem center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "1.5em 1.5em",
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
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Email
                  </label>
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Please enter a valid email address",
                        },
                      })}
                      type="email"
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400"
                      placeholder="info@company.com"
                    />
                  </div>
                  {errors.companyEmail && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.companyEmail.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Phone
                  </label>
                  <div className="flex gap-2">
                    <div className="">
                      <CountrySelector
                        selectedCountry={selectedCompanyCountry}
                        onCountryChange={setSelectedCompanyCountry}
                      />
                    </div>
                    <div className="flex-1 relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...register("companyPhone")}
                        type="tel"
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400"
                        placeholder="123-456-7890"
                      />
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Selected: {selectedCompanyCountry.name} ({selectedCompanyCountry.dialCode})
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn Profile (Optional)
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <input
                    {...register("linkedinUrl", {
                      pattern: {
                        value: /^(https?:\/\/)?([\w\-]+\.)*linkedin\.com\/.*$/,
                        message: "Please enter a valid LinkedIn URL",
                      },
                    })}
                    type="text"
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400"
                    placeholder="linkedin.com/company/your-company"
                  />
                </div>
                {errors.linkedinUrl && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.linkedinUrl.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Description
                </label>
                <textarea
                  {...register("companyDescription")}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all hover:border-gray-400"
                  placeholder="Brief description of what your company does, your mission, and key services..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
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
                    className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
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

              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Region of Business
                    </h3>
                    <p className="text-sm text-gray-600">
                      Where does your company operate?
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Countries
                    </label>
                    <input
                      {...register("businessCountries")}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400"
                      placeholder="e.g., USA, Canada, UK"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate multiple countries with commas
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      States/Provinces
                    </label>
                    <input
                      {...register("businessStates")}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400"
                      placeholder="e.g., California, Texas, Ontario"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate multiple states with commas
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key Cities
                    </label>
                    <input
                      {...register("businessCities")}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400"
                      placeholder="e.g., New York, Los Angeles, Toronto"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate multiple cities with commas
                    </p>
                  </div>
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
            <input
              {...register("plan", { required: "Please select a plan" })}
              type="hidden"
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {planOptions.map((plan) => {
                const isSelected = watch("plan") === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => {
                      setValue(
                        "plan",
                        plan.id as "base" | "advanced" | "custom",
                        {
                          shouldValidate: true,
                        }
                      );
                      // Reset agent count based on plan
                      setValue("agentCount", 1);
                    }}
                    className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? plan.id === "custom"
                          ? "border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg"
                          : "border-blue-500 bg-blue-50 shadow-lg"
                        : plan.id === "custom"
                        ? "border-purple-300 bg-gradient-to-br from-purple-25 to-blue-25 hover:border-purple-400 hover:shadow-lg"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                    }`}
                  >
                    {isSelected && (
                      <div
                        className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center ${
                          plan.id === "custom" ? "bg-purple-500" : "bg-blue-500"
                        }`}
                      >
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}

                    {plan.id === "custom" && (
                      <div className="absolute -top-2 -left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        PREMIUM
                      </div>
                    )}

                    <div className="text-center mb-4">
                      <h3
                        className={`text-xl font-bold mb-2 ${
                          plan.id === "custom"
                            ? "text-purple-800"
                            : "text-gray-900"
                        }`}
                      >
                        {plan.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {plan.description}
                      </p>
                      <div
                        className={`text-2xl font-bold ${
                          plan.id === "custom"
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
                            : "text-blue-600"
                        }`}
                      >
                        {plan.price}
                      </div>
                      {plan.id === "custom" && (
                        <p className="text-xs text-purple-600 mt-1 font-medium">
                          Contact us for personalized pricing
                        </p>
                      )}
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

            {/* Plan Selection Error */}
            {errors.plan && (
              <div className="text-center mb-4">
                <p className="text-red-600 text-sm">
                  Please select a plan to continue
                </p>
              </div>
            )}

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
                      : watch("plan") === "advanced"
                      ? "Advanced plan supports up to 3 AI Employees"
                      : "Custom plan allows up to 4 AI Employees with full customization"}
                  </p>
                </div>

                <div className="flex justify-center">
                  {watch("plan") === "custom" ? (
                    <div className="w-full max-w-md space-y-4">
                      <div className="text-center mb-4">
                        <p className="text-sm text-purple-600 font-medium">
                          Choose your AI workforce size
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Each AI Employee can handle different tasks
                          simultaneously
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {Array.from({ length: 4 }, (_, i) => i + 1).map(
                          (count) => (
                            <label
                              key={count}
                              className={`px-4 py-6 rounded-xl cursor-pointer transition-all font-medium text-sm flex flex-col items-center justify-center space-y-2 ${
                                watch("agentCount") === count
                                  ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg transform scale-105"
                                  : "bg-gradient-to-br from-purple-50 to-blue-50 text-gray-700 hover:from-purple-100 hover:to-blue-100 border border-purple-200"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  watch("agentCount") === count
                                    ? "bg-white bg-opacity-20"
                                    : "bg-purple-200"
                                }`}
                              >
                                <Bot
                                  className={`w-5 h-5 ${
                                    watch("agentCount") === count
                                      ? "text-white"
                                      : "text-purple-600"
                                  }`}
                                />
                              </div>
                              <input
                                type="radio"
                                value={count}
                                checked={watch("agentCount") === count}
                                onChange={() => setValue("agentCount", count)}
                                className="sr-only"
                              />
                              <span className="text-2xl font-bold">
                                {count}
                              </span>
                              <span className="text-xs text-center">
                                {count === 1 ? "AI Employee" : "AI Employees"}
                              </span>
                            </label>
                          )
                        )}
                      </div>
                    </div>
                  ) : (
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
                            {count}{" "}
                            {count === 1 ? "AI Employee" : "AI Employees"}
                          </label>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Billing Information Section */}
            {watch("plan") && (
              <div className="border-t border-gray-200 pt-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    Billing Information
                  </h3>
                </div>

                {/* Show billing form only if offline billing is not selected */}
                {!watch("offlineBilling") && (
                  <div className="max-w-4xl mx-auto space-y-6">
                    {/* Billing Contact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Billing Contact Name *
                        </label>
                        <input
                          {...register("billingContactName", {
                            required: "Billing contact name is required",
                          })}
                          className={`w-full px-3 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.billingContactName
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300"
                          }`}
                          placeholder="John Smith"
                        />
                        {errors.billingContactName && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.billingContactName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Billing Email *
                        </label>
                        <input
                          {...register("billingContactEmail", {
                            required: "Billing email is required",
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: "Please enter a valid email address",
                            },
                          })}
                          type="email"
                          className={`w-full px-3 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.billingContactEmail
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300"
                          }`}
                          placeholder="billing@company.com"
                        />
                        {errors.billingContactEmail && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.billingContactEmail.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          {...register("billingContactPhone")}
                          type="tel"
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Name (if different)
                        </label>
                        <input
                          {...register("billingCompanyName")}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Billing Company Name"
                        />
                      </div>
                    </div>

                    {/* Billing Address */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Billing Address
                        </label>
                        <input
                          {...register("billingAddress")}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="123 Main Street, Suite 100"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                          </label>
                          <input
                            {...register("billingCity")}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="New York"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State/Province
                          </label>
                          <input
                            {...register("billingState")}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="NY"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ZIP/Postal
                          </label>
                          <input
                            {...register("billingZip")}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="10001"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <select
                          {...register("billingCountry")}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className=" mx-auto px-6 lg:px-14 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-end space-x-3">
              <img src={logo} alt="ShivAI Logo" className="h-6" />
              <p className="text-gray-600 relative top-1">Employees Setup</p>
            </div>

            {/* Progress bar */}
            <div className="flex items-center space-x-2">
              {Array.from({ length: totalSteps }, (_, i) => {
                const stepNumber = i + 1;
                const isCompleted = stepNumber < currentStep;
                const isCurrent = stepNumber === currentStep;
                const isValid = validateStep(stepNumber);

                return (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
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
                      <CheckCircle className="w-5 h-5" />
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

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-8 ">
        <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

        {/* Navigation */}
        <div className="mt-3 sm:mt-4 mb-6 sm:mb-8 flex flex-row justify-between gap-2 sm:gap-3 lg:gap-4">
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
            className={`flex items-center justify-center px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 flex-1 sm:flex-none sm:min-w-[120px] font-semibold text-xs sm:text-sm lg:text-base transition-all touch-manipulation shadow-sm ${
              currentStep === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed rounded-xl"
                : "text-gray-700 hover:bg-gray-50 active:bg-gray-200 border border-gray-300"
            }`}
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Previous
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
              className={`flex items-center justify-center px-4 sm:px-8 py-2.5 sm:py-3 flex-1 sm:flex-none sm:min-w-[120px] font-semibold text-sm sm:text-base transition-all touch-manipulation ${
                validateStep(currentStep)
                  ? "text-white hover:transform hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Next
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              style={{
                background:
                  "linear-gradient(0deg, #0A0A0A 0%, #000000 100%)",
                boxShadow:
                  "0px 12.4px 18.6px -9.3px #00000040, 0px -6.2px 9.3px 0px #171717 inset, 0px 3.49px 0.77px 0px #5E5E5E inset, 0px 1.55px 0.77px 0px #33332F inset",
                borderRadius: "1549.79px",
              }}
              className="flex items-center justify-center px-4 sm:px-8 py-2.5 sm:py-3 flex-1 sm:flex-none sm:min-w-[140px] text-white font-semibold text-sm sm:text-base transition-all touch-manipulation hover:transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
                background:
                  "linear-gradient(0deg, #0A0A0A 0%, #000000 100%)",
                boxShadow:
                  "0px 12.4px 18.6px -9.3px #00000040, 0px -6.2px 9.3px 0px #171717 inset, 0px 3.49px 0.77px 0px #5E5E5E inset, 0px 1.55px 0.77px 0px #33332F inset",
                borderRadius: "1549.79px",
              }}
              className="w-full text-white py-3 px-6 font-semibold transition-all duration-200 hover:transform hover:scale-[1.02] active:scale-[0.98]"
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
