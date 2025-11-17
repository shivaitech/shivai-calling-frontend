"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  Phone,
  Sparkles,
  Brain,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../resources/images/ShivaiLogo.svg";
import EnhancedSearchableSelect from "../components/EnhancedSearchableSelect";
import MultiSelectSearchable from "../components/MultiSelectSearchable";
import FileUpload from "../components/FileUpload";

// Form data interface
interface OnboardingFormData {
  // Step 1: Company Info
  companyName: string;
  companySize: string;
  industry: string[];
  role: string;

  // Step 2: Use Case
  primaryUseCase: string;
  expectedCallVolume: string;
  currentSolution: string;

  // Step 3: AI Agent Configuration
  agentName: string;
  agentDescription: string;
  knowledgeBaseFiles: File[];
  knowledgeBaseLinks: string[];
  agentPersonality: string;
  responseStyle: string;
  specialInstructions: string;
  languages: string[];
  workingHours: string;
  escalationRules: string;
}

// Options for select fields
const companySizeOptions = [
  { value: "1-10", label: "1-10 employees", group: "Small" },
  { value: "11-50", label: "11-50 employees", group: "Small" },
  { value: "51-200", label: "51-200 employees", group: "Medium" },
  { value: "201-1000", label: "201-1000 employees", group: "Large" },
  { value: "1000+", label: "1000+ employees", group: "Enterprise" }
];

const industryOptions = [
  { value: "technology", label: "Technology", group: "Tech" },
  { value: "healthcare", label: "Healthcare", group: "Healthcare" },
  { value: "finance", label: "Finance", group: "Financial" },
  { value: "retail", label: "Retail", group: "Commerce" },
  { value: "education", label: "Education", group: "Education" },
  { value: "real-estate", label: "Real Estate", group: "Real Estate" },
  { value: "consulting", label: "Consulting", group: "Professional" },
  { value: "manufacturing", label: "Manufacturing", group: "Industrial" },
  { value: "logistics", label: "Logistics & Transportation", group: "Industrial" },
  { value: "hospitality", label: "Hospitality & Tourism", group: "Service" }
];

const roleOptions = [
  { value: "ceo", label: "CEO/Founder", group: "Executive" },
  { value: "cto", label: "CTO", group: "Executive" },
  { value: "marketing", label: "Marketing Manager", group: "Marketing" },
  { value: "sales", label: "Sales Manager", group: "Sales" },
  { value: "operations", label: "Operations Manager", group: "Operations" },
  { value: "developer", label: "Developer", group: "Technical" },
  { value: "customer-success", label: "Customer Success", group: "Customer" },
  { value: "business-dev", label: "Business Development", group: "Business" }
];

const useCaseOptions = [
  { value: "customer-support", label: "Customer Support", group: "Support" },
  { value: "sales", label: "Sales & Lead Qualification", group: "Sales" },
  { value: "appointment-booking", label: "Appointment Booking", group: "Scheduling" },
  { value: "order-taking", label: "Order Taking", group: "Commerce" },
  { value: "surveys", label: "Surveys & Feedback", group: "Research" },
  { value: "lead-generation", label: "Lead Generation", group: "Sales" },
  { value: "collections", label: "Collections & Follow-ups", group: "Finance" },
  { value: "virtual-receptionist", label: "Virtual Receptionist", group: "Reception" }
];

const callVolumeOptions = [
  { value: "1-100", label: "1-100 calls/month", group: "Low Volume" },
  { value: "101-500", label: "101-500 calls/month", group: "Medium Volume" },
  { value: "501-1000", label: "501-1000 calls/month", group: "High Volume" },
  { value: "1001-5000", label: "1001-5000 calls/month", group: "Very High Volume" },
  { value: "5000+", label: "5000+ calls/month", group: "Enterprise Volume" }
];

const currentSolutionOptions = [
  { value: "manual", label: "Manual/Human agents", group: "Traditional" },
  { value: "basic-ivr", label: "Basic IVR system", group: "Automated" },
  { value: "chatbot", label: "Text chatbot", group: "AI" },
  { value: "other-ai", label: "Other AI voice solution", group: "AI" },
  { value: "none", label: "No current solution", group: "None" }
];

const languageOptions = [
  { value: "english", label: "English", group: "Primary" },
  { value: "spanish", label: "Spanish", group: "Primary" },
  { value: "french", label: "French", group: "European" },
  { value: "german", label: "German", group: "European" },
  { value: "italian", label: "Italian", group: "European" },
  { value: "portuguese", label: "Portuguese", group: "European" },
  { value: "chinese", label: "Chinese (Mandarin)", group: "Asian" },
  { value: "japanese", label: "Japanese", group: "Asian" },
  { value: "korean", label: "Korean", group: "Asian" },
  { value: "hindi", label: "Hindi", group: "Asian" },
  { value: "arabic", label: "Arabic", group: "Other" },
  { value: "russian", label: "Russian", group: "Other" }
];

const workingHoursOptions = [
  { value: "24-7", label: "24/7 Always Available", group: "Continuous" },
  { value: "business-hours", label: "Business Hours (9 AM - 5 PM)", group: "Standard" },
  { value: "extended", label: "Extended Hours (7 AM - 9 PM)", group: "Extended" },
  { value: "weekdays", label: "Weekdays Only", group: "Limited" },
  { value: "custom", label: "Custom Schedule", group: "Custom" }
];

const escalationOptions = [
  { value: "always-human", label: "Always escalate complex queries", group: "Conservative" },
  { value: "smart-escalation", label: "Smart escalation based on confidence", group: "Intelligent" },
  { value: "minimal-escalation", label: "Minimal escalation, AI handles most", group: "Autonomous" },
  { value: "no-escalation", label: "No escalation, AI only", group: "Full AI" }
];

const personalityOptions = [
  { value: "professional", label: "Professional & Formal", group: "Business" },
  { value: "friendly", label: "Friendly & Conversational", group: "Casual" },
  { value: "helpful", label: "Helpful & Supportive", group: "Support" },
  { value: "energetic", label: "Energetic & Enthusiastic", group: "Dynamic" },
  { value: "calm", label: "Calm & Reassuring", group: "Calm" }
];

const responseStyleOptions = [
  { value: "concise", label: "Concise & Direct", group: "Brief" },
  { value: "detailed", label: "Detailed & Thorough", group: "Comprehensive" },
  { value: "conversational", label: "Conversational & Natural", group: "Natural" },
  { value: "structured", label: "Structured & Methodical", group: "Organized" },
  { value: "adaptive", label: "Adaptive to Customer", group: "Flexible" }
];

const Onboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();



  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<OnboardingFormData>({
    mode: "onChange",
    defaultValues: {
      industry: [],
      knowledgeBaseFiles: [],
      knowledgeBaseLinks: [],
      languages: ["english"],
    },
  });

  const totalSteps = 3;

  // Step validation
  const validateStep = async (step: number) => {
    const fieldsToValidate: Record<number, (keyof OnboardingFormData)[]> = {
      1: ["companyName"], // Only company name is mandatory
      2: [], // No mandatory fields
      3: [], // No mandatory fields  
    };

    return await trigger(fieldsToValidate[step]);
  };

  const nextStep = async () => {
    const isStepValid = await validateStep(currentStep);
    if (isStepValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: OnboardingFormData) => {
    // Only allow submission on final step
    if (currentStep !== totalSteps) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      navigate("/");
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
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
            className="space-y-4 bg-white p-6 rounded-lg shadow-md"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                About your company
              </h2>
              <p className="text-sm text-gray-600">
                Help us understand your business context
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                {...register("companyName", {
                  required: "Company name is required",
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                placeholder="Enter your company name"
              />
              {errors.companyName && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.companyName.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Size
                </label>
                <EnhancedSearchableSelect
                  options={companySizeOptions}
                  value={watch("companySize") || ""}
                  onChange={(value) => setValue("companySize", value)}
                  placeholder="Select company size"
                  groupBy={true}
                  allowCustom={true}
                  customLabel="Add size"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <EnhancedSearchableSelect
                  options={roleOptions}
                  value={watch("role") || ""}
                  onChange={(value) => setValue("role", value)}
                  placeholder="Select your role"
                  groupBy={true}
                  allowCustom={true}
                  customLabel="Add role"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry (Select multiple)
              </label>
              <MultiSelectSearchable
                options={industryOptions}
                value={watch("industry") || []}
                onChange={(value) => setValue("industry", value)}
                placeholder="Select industries"
                groupBy={true}
                allowCustom={true}
                maxSelections={5}
              />
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
            className="space-y-4 bg-white p-6 rounded-xl shadow-md"

          >
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Your use case
              </h2>
              <p className="text-sm text-gray-600">
                Tell us how you plan to use ShivAI
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Use Case
              </label>
              <EnhancedSearchableSelect
                options={useCaseOptions}
                value={watch("primaryUseCase") || ""}
                onChange={(value) => setValue("primaryUseCase", value)}
                placeholder="Select primary use case"
                groupBy={true}
                allowCustom={true}
                customLabel="Add use case"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Call Volume
                </label>
                <EnhancedSearchableSelect
                  options={callVolumeOptions}
                  value={watch("expectedCallVolume") || ""}
                  onChange={(value) => setValue("expectedCallVolume", value)}
                  placeholder="Select call volume"
                  groupBy={true}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Solution
                </label>
                <EnhancedSearchableSelect
                  options={currentSolutionOptions}
                  value={watch("currentSolution") || ""}
                  onChange={(value) => setValue("currentSolution", value)}
                  placeholder="Select current solution"
                  groupBy={true}
                  allowCustom={true}
                  customLabel="Add solution"
                />
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4 bg-white p-6 rounded-xl shadow-md"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                AI Agent Configuration
              </h2>
              <p className="text-sm text-gray-600">
                Create and configure your AI agent with personality, knowledge, and behavior
              </p>
            </div>

            {/* Agent Identity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Name
                </label>
                <input
                  {...register("agentName")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  placeholder="e.g., Alex, Sarah, Customer Assistant"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Working Hours
                </label>
                <EnhancedSearchableSelect
                  options={workingHoursOptions}
                  value={watch("workingHours") || ""}
                  onChange={(value) => setValue("workingHours", value)}
                  placeholder="Select availability"
                  groupBy={true}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Escalation Rules
                </label>
                <EnhancedSearchableSelect
                  options={escalationOptions}
                  value={watch("escalationRules") || ""}
                  onChange={(value) => setValue("escalationRules", value)}
                  placeholder="How should complex queries be handled?"
                  groupBy={true}
                />
              </div>
            </div>

            {/* Agent Description & Knowledge Base */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Description
                </label>
                <textarea
                  {...register("agentDescription")}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  placeholder="Describe your AI agent's role and purpose..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Knowledge Base
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Upload documents, add website links, or reference materials your AI agent should know about
                </p>
                <FileUpload
                  onFilesChange={(files) => setValue("knowledgeBaseFiles", files)}
                  onLinksChange={(links) => setValue("knowledgeBaseLinks", links)}
                  maxFiles={10}
                  acceptedTypes={['.pdf', '.txt', '.doc', '.docx', '.md', '.csv']}
                  maxSizeInMB={10}
                />
              </div>
            </div>

            {/* Personality & Behavior */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Personality
                </label>
                <EnhancedSearchableSelect
                  options={personalityOptions}
                  value={watch("agentPersonality") || ""}
                  onChange={(value) => setValue("agentPersonality", value)}
                  placeholder="Select personality"
                  groupBy={true}
                  allowCustom={true}
                  customLabel="Add personality"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response Style
                </label>
                <EnhancedSearchableSelect
                  options={responseStyleOptions}
                  value={watch("responseStyle") || ""}
                  onChange={(value) => setValue("responseStyle", value)}
                  placeholder="Select response style"
                  groupBy={true}
                  allowCustom={true}
                  customLabel="Add style"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supported Languages
                </label>
                <MultiSelectSearchable
                  options={languageOptions}
                  value={watch("languages") || []}
                  onChange={(value) => setValue("languages", value)}
                  placeholder="Select languages"
                  groupBy={true}
                  allowCustom={true}
                  maxSelections={8}
                />
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions & Guidelines (Optional)
              </label>
              <textarea
                {...register("specialInstructions")}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                placeholder="e.g., Always mention our return policy, Never discuss competitor pricing, Use formal language for enterprise clients..."
                onKeyDown={(e) => {
                  // Prevent form submission when Enter is pressed in textarea
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.stopPropagation();
                  }
                }}
              />
              <p className="mt-1 text-xs text-gray-500">
                Provide specific guidelines for how your AI agent should handle certain situations or topics
              </p>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className=" mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <img src={logo} alt="ShivAI Logo" className="h-5 mb-1" />
                <p className="text-xs text-gray-600">Setup your account</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="hidden md:flex items-center space-x-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    i + 1 < currentStep
                      ? "bg-emerald-500 text-white"
                      : i + 1 === currentStep
                      ? "bg-emerald-100 text-emerald-600 border-2 border-emerald-500"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {i + 1 < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile progress bar */}
          <div className="md:hidden mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>
                Step {currentStep} of {totalSteps}
              </span>
              <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`mx-auto py-6 ${
        currentStep === 3 ? 'max-w-4xl px-6' : 'max-w-xl px-4'
      }`}>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            // Only proceed if explicitly on final step
            if (currentStep === totalSteps) {
              handleSubmit(onSubmit)(e);
            }
          }}
        >
          <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-2 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                currentStep === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Setting up...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Complete Setup</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
