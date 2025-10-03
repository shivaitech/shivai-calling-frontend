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
  Globe,
  Phone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../resources/images/ShivaiLogo.svg";
import Step3, { OnboardingFormData } from "../components/Step3";

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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Scroll to top smoothly when moving to previous step
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        return !!(watch("companyName"));
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
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      {...register("companyPhone")}
                      type="tel"
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400"
                      placeholder="+1 (555) 123-4567"
                    />
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

              {/* Region of Business Section */}
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
                      setValue("plan", plan.id as "base" | "advanced" | "custom", {
                        shouldValidate: true,
                      });
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
                      <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center ${
                        plan.id === "custom" ? "bg-purple-500" : "bg-blue-500"
                      }`}>
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}

                    {plan.id === "custom" && (
                      <div className="absolute -top-2 -left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        PREMIUM
                      </div>
                    )}

                    <div className="text-center mb-4">
                      <h3 className={`text-xl font-bold mb-2 ${
                        plan.id === "custom" ? "text-purple-800" : "text-gray-900"
                      }`}>
                        {plan.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {plan.description}
                      </p>
                      <div className={`text-2xl font-bold ${
                        plan.id === "custom" 
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
                          : "text-blue-600"
                      }`}>
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
                          Each AI Employee can handle different tasks simultaneously
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {Array.from({ length: 4 }, (_, i) => i + 1).map((count) => (
                          <label
                            key={count}
                            className={`px-4 py-6 rounded-xl cursor-pointer transition-all font-medium text-sm flex flex-col items-center justify-center space-y-2 ${
                              watch("agentCount") === count
                                ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg transform scale-105"
                                : "bg-gradient-to-br from-purple-50 to-blue-50 text-gray-700 hover:from-purple-100 hover:to-blue-100 border border-purple-200"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              watch("agentCount") === count
                                ? "bg-white bg-opacity-20"
                                : "bg-purple-200"
                            }`}>
                              <Bot className={`w-5 h-5 ${
                                watch("agentCount") === count ? "text-white" : "text-purple-600"
                              }`} />
                            </div>
                            <input
                              type="radio"
                              value={count}
                              checked={watch("agentCount") === count}
                              onChange={() => setValue("agentCount", count)}
                              className="sr-only"
                            />
                            <span className="text-2xl font-bold">{count}</span>
                            <span className="text-xs text-center">
                              {count === 1 ? "AI Employee" : "AI Employees"}
                            </span>
                          </label>
                        ))}
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
                            {count} {count === 1 ? "AI Employee" : "AI Employees"}
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
            className={`flex items-center justify-center px-3 sm:px-4 lg:px-8 py-2 sm:py-3 flex-1 sm:flex-none sm:min-w-[120px] rounded-xl font-semibold text-xs sm:text-sm lg:text-base transition-all touch-manipulation ${
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
              disabled={!validateStep(currentStep)}
              className={`flex items-center justify-center px-4 sm:px-8 py-3 flex-1 sm:flex-none sm:min-w-[120px] rounded-xl font-semibold text-sm sm:text-base transition-all touch-manipulation ${
                validateStep(currentStep)
                  ? "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
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
