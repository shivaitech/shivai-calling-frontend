import React, { useState, useRef, useEffect } from "react";
import { Smartphone, Monitor, Save, RefreshCw, Settings2, ChevronLeft, ChevronRight } from "lucide-react";
import appToast from "../../../components/AppToast";
import Slider from "react-slick";
import GlassCard from "../../../components/GlassCard";
import { agentAPI } from "../../../services/agentAPI";
import { useAuth } from "../../../contexts/AuthContext";

interface WidgetConfig {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    borderRadius: string;
    buttonStyle: string;
    widgetStyle: string;
  };
  ui: {
    position: string;
    buttonSize: string;
    chatHeight: string;
    chatWidth: string;
    autoOpen: boolean;
    minimizeButton: boolean;
    draggable: boolean;
    visibility: 'public' | 'private';
    allowedDomains: string[];
  };
  content: {
    welcomeMessage: string;
    companyName: string;
    companyDescription: string;
    companyLogo: string;
    triggerButtonImage: string;
    callToActionText: string;
    placeholderText: string;
    offlineMessage: string;
  };
  features: {
    voiceEnabled: boolean;
    soundEffects: boolean;
    showBranding: boolean;
    messageHistory: boolean;
    typingIndicator: boolean;
    fileUpload: boolean;
  };
  customCSS: string;
}

interface AgentWidgetCustomizationProps {
  agentId: string;
  agentName: string;
  isPublished?: boolean;
}

const AgentWidgetCustomization: React.FC<AgentWidgetCustomizationProps> = ({
  agentId,
  agentName,
  isPublished = false,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("configure");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">(
    "mobile"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [triggerButtonImagePreview, setTriggerButtonImagePreview] = useState<string>("");
  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const configTimeoutRef = useRef<number | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const triggerButtonInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentRequestIdRef = useRef<string>("");

  // Gradient presets for theme customization
  const gradientPresets = [
    {
      id: "original",
      name: "Original Default",
      primaryColor: "#4b5563",
      secondaryColor: "#6b7280",
      accentColor: "#374151",
      gradient:
        "linear-gradient(135deg, #4b5563 0%, #6b7280 30%, #374151 70%, #1f2937 100%)",
    },
    {
      id: "default",
      name: "ShivAI Blue",
      primaryColor: "#3b82f6",
      secondaryColor: "#1e40af",
      accentColor: "#2563eb",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    },
    {
      id: "ocean",
      name: "Ocean Breeze",
      primaryColor: "#0ea5e9",
      secondaryColor: "#0284c7",
      accentColor: "#0369a1",
      gradient: "linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)",
    },
    {
      id: "sunset",
      name: "Sunset Glow",
      primaryColor: "#f97316",
      secondaryColor: "#ea580c",
      accentColor: "#dc2626",
      gradient: "linear-gradient(135deg, #f97316 0%, #dc2626 100%)",
    },
    {
      id: "forest",
      name: "Forest Green",
      primaryColor: "#22c55e",
      secondaryColor: "#16a34a",
      accentColor: "#15803d",
      gradient: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
    },
    {
      id: "purple",
      name: "Purple Dream",
      primaryColor: "#a855f7",
      secondaryColor: "#9333ea",
      accentColor: "#7c3aed",
      gradient: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
    },
    {
      id: "teal",
      name: "Teal Wave",
      primaryColor: "#14b8a6",
      secondaryColor: "#0d9488",
      accentColor: "#0f766e",
      gradient: "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)",
    },
    {
      id: "rose",
      name: "Rose Garden",
      primaryColor: "#f43f5e",
      secondaryColor: "#e11d48",
      accentColor: "#be123c",
      gradient: "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)",
    },
    {
      id: "gradient1",
      name: "Cosmic Fusion",
      primaryColor: "#6366f1",
      secondaryColor: "#8b5cf6",
      accentColor: "#a855f7",
      gradient: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    },
    {
      id: "gradient2",
      name: "Warm Citrus",
      primaryColor: "#fbbf24",
      secondaryColor: "#f59e0b",
      accentColor: "#d97706",
      gradient: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
    },
    {
      id: "gradient3",
      name: "Cool Mint",
      primaryColor: "#34d399",
      secondaryColor: "#10b981",
      accentColor: "#059669",
      gradient: "linear-gradient(135deg, #34d399 0%, #059669 100%)",
    },
  ];

  // Apply gradient preset
  const applyGradientPreset = (preset: (typeof gradientPresets)[0]) => {
    const newConfig = {
      ...widgetConfig,
      theme: {
        ...widgetConfig.theme,
        primaryColor: preset.primaryColor,
        secondaryColor: preset.secondaryColor,
        accentColor: preset.accentColor,
      },
    };

    setWidgetConfig(newConfig);
    setHasUnsavedChanges(true);

    // Emit event for integration code real-time updates
    const event = new CustomEvent("widgetConfigUpdated", {
      detail: {
        agentId,
        config: newConfig,
      },
    });
    window.dispatchEvent(event);

    // Force immediate preview refresh
    setTimeout(() => {
      setPreviewKey((prev) => prev + 1);
    }, 50);
  };

  // Reset tab to preview if currently on advanced/install tab when agent becomes unpublished
  useEffect(() => {
    if (!isPublished && (activeTab === "install" || activeTab === "advanced")) {
      setActiveTab("preview");
    }
  }, [isPublished, activeTab]);

  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({
    theme: {
      primaryColor: "#4b5563",
      secondaryColor: "#6b7280",
      accentColor: "#374151",
      borderRadius: "16px",
      buttonStyle: "floating",
      widgetStyle: "modern",
    },
    ui: {
      position: "bottom-right",
      buttonSize: "medium",
      chatHeight: "320px",
      chatWidth: "380px",
      autoOpen: false,
      minimizeButton: true,
      draggable: true,
      visibility: 'public',
      allowedDomains: [],
    },
    content: {
      welcomeMessage: "Loading...",
      companyName: "",
      companyDescription: "",
      companyLogo: "",
      triggerButtonImage: "",
      callToActionText: "📞 Call ShivAI!",
      placeholderText: "Type your message...",
      offlineMessage: "We're currently offline. Please leave a message.",
    },
    features: {
      voiceEnabled: true,
      soundEffects: true,
      showBranding: true,
      messageHistory: true,
      typingIndicator: true,
      fileUpload: false,
    },
    customCSS: "",
  });

  // Main effect to load widget config - this is the ONLY place state should be updated
  useEffect(() => {
    const loadWidgetConfig = async () => {
      // 🧹 CRITICAL: Reset ALL state FIRST before anything else
      console.log("🧹 AGGRESSIVE STATE RESET: Clearing ALL widget state for agentId:", agentId);
      setIsLoading(true);
      setHasUnsavedChanges(false);
      setLastSaved(null);
      setActiveTab("configure");
      setLogoPreview("");
      setTriggerButtonImagePreview("");
      setPreviewKey(0);
      
      // 🧹 CRITICAL: Clear file input refs to prevent showing old images
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
        console.log("🧹 Cleared logoInputRef");
      }
      if (triggerButtonInputRef.current) {
        triggerButtonInputRef.current.value = "";
        console.log("🧹 Cleared triggerButtonInputRef");
      }
      
      // Reset widget config to initial default state
      const defaultConfig: WidgetConfig = {
        theme: {
          primaryColor: "#4b5563",
          secondaryColor: "#6b7280",
          accentColor: "#374151",
          borderRadius: "16px",
          buttonStyle: "floating",
          widgetStyle: "modern",
        },
        ui: {
          position: "bottom-right",
          buttonSize: "medium",
          chatHeight: "320px",
          chatWidth: "380px",
          autoOpen: false,
          minimizeButton: true,
          draggable: true,
          visibility: 'public',
          allowedDomains: [],
        },
        content: {
          welcomeMessage: `Hi! I'm ${agentName}. How can I help you today?`,
          companyName: agentName,
          companyDescription: "AI-Powered Support - We offer 24/7 voice support to handle your business calls effieciently and professionally.",
          companyLogo: "",
          triggerButtonImage: "",
          callToActionText: "📞 Call ShivAI!",
          placeholderText: "Type your message...",
          offlineMessage: "We're currently offline. Please leave a message.",
        },
        features: {
          voiceEnabled: true,
          soundEffects: true,
          showBranding: true,
          messageHistory: true,
          typingIndicator: true,
          fileUpload: false,
        },
        customCSS: "",
      };
      
      // Apply default config immediately before any API call
      setWidgetConfig(defaultConfig);
      console.log("✅ Default config applied - all fields reset to defaults");
      console.log("   allowedDomains explicitly set to:", defaultConfig.ui.allowedDomains);
      
      // 🔄 REQUEST ID TRACKING: Prevent race conditions where old API responses overwrite new agent data
      const requestId = `${agentId}-${Date.now()}-${Math.random()}`;
      currentRequestIdRef.current = requestId;
      console.log("📌 Created new request ID:", requestId);
      
      // 🛑 ABORT CONTROLLER: Cancel previous API calls if user switches agents quickly
      if (abortControllerRef.current) {
        console.log("🛑 Aborting previous API request");
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      try {
        console.log("🔄 Loading widget config via agent-config API for agentId:", agentId);
        const { agent } = await agentAPI.getAgentConfig(agentId);
        
        // ⚡ CHECK: Only apply response if request ID still matches (no race condition)
        if (currentRequestIdRef.current !== requestId) {
          console.log("⚠️ RACE CONDITION DETECTED: Request ID mismatch. Ignoring stale response.");
          console.log("   Current ID:", currentRequestIdRef.current, "Response ID:", requestId);
          setIsLoading(false);
          return;
        }
        
        console.log("📦 agent-config response:", agent);

          // Check if agent and widget configuration exists in response
          if (agent?.widget) {
            console.log("✅ Widget configuration found, prefilling form...");
            const widget = agent.widget;
            
            console.log("🔍 API Widget data:");
            console.log("  ai_employee_name:", widget.ai_employee_name);
            console.log("  ai_employee_description:", widget.ai_employee_description);
            console.log("  company_logo:", widget.company_logo);
            console.log("  primary_color:", widget.primary_color);
            console.log("  gradient_end:", widget.gradient_end);
            console.log("  allowed_domains:", widget.allowed_domains);
            console.log("  visibility:", widget.visibility);
            console.log("  trigger_button_image:", widget.trigger_button_image);

            // Map API response to widget config state
            const loadedConfig: WidgetConfig = {
              theme: {
                primaryColor: widget.primary_color || "#4b5563",
                secondaryColor: widget.gradient_start || "#6b7280",
                accentColor: widget.gradient_end || "#374151",
                borderRadius: "16px",
                buttonStyle: "floating",
                widgetStyle: "modern",
              },
              ui: {
                position: widget.position || "bottom-right",
                buttonSize: "medium",
                chatHeight: "320px",
                chatWidth: "380px",
                autoOpen: false,
                minimizeButton: true,
                draggable: true,
                visibility: (widget.visibility as 'public' | 'private') || 'public',
                allowedDomains: Array.isArray(widget.allowed_domains) ? widget.allowed_domains : [],
              },
              content: {
                welcomeMessage:
                  widget.welcome_message ||
                  `Hi! I'm ${agentName}. How can I help you today?`,
                companyName: widget.ai_employee_name || agentName,
                companyDescription:
                  widget.ai_employee_description ||
                  "AI-Powered Support - We offer 24/7 voice support to handle your business calls effieciently and professionally.",
                companyLogo: widget.company_logo || "",
                triggerButtonImage: widget.trigger_button_image || "",
                callToActionText: widget.button_text || "📞 Call ShivAI!",
                placeholderText: "Type your message...",
                offlineMessage: "We're currently offline. Please leave a message.",
              },
              features: {
                voiceEnabled: true,
                soundEffects: true,
                showBranding: true,
                messageHistory: true,
                typingIndicator: true,
                fileUpload: false,
              },
              customCSS: "",
            };

            console.log("🔄 Setting widget config with loaded data:");
            console.log("  companyName:", loadedConfig.content.companyName);
            console.log("  companyDescription:", loadedConfig.content.companyDescription);
            console.log("  companyLogo:", loadedConfig.content.companyLogo);
            console.log("  primaryColor:", loadedConfig.theme.primaryColor);
            console.log("  ✅ allowedDomains from API:", loadedConfig.ui.allowedDomains);
            console.log("  ✅ visibility from API:", loadedConfig.ui.visibility);
            console.log("  ✅ triggerButtonImage from API:", loadedConfig.content.triggerButtonImage);
            
            // ⚡ FINAL CHECK: Verify request ID AGAIN before committing state changes
            if (currentRequestIdRef.current !== requestId) {
              console.log("⚠️ RACE CONDITION DETECTED on state update: Ignoring stale response");
              setIsLoading(false);
              return;
            }
            
            setWidgetConfig(loadedConfig);
            
            // Set logo preview if widget has a logo URL
            if (widget.company_logo) {
              console.log("🖼️ Raw company_logo from API:", widget.company_logo);
              console.log("🖼️ Logo URL type:", typeof widget.company_logo);
              console.log("🖼️ Logo URL length:", widget.company_logo.length);
              
              // Set logo preview immediately to avoid delay
              setLogoPreview(widget.company_logo);
              console.log("✅ Logo preview set immediately:", widget.company_logo);
              
              // Test if the logo URL is accessible in background (optional validation)
              const logoImg = new Image();
              logoImg.onload = () => {
                console.log("✅ Logo validation: loaded successfully");
              };
              logoImg.onerror = (error) => {
                console.error("❌ Logo validation: failed to load", error);
                console.warn("⚠️ Logo URL might be invalid but still showing it");
              };
              logoImg.src = widget.company_logo;
            } else {
              console.log("ℹ️ No company_logo found in widget data");
              // Clear logo preview if no logo in API response
              setLogoPreview("");
            }

            // Set trigger button image preview if it exists
            if (widget.trigger_button_image) {
              setTriggerButtonImagePreview(widget.trigger_button_image);
            } else {
              setTriggerButtonImagePreview("");
            }
            
            setLastSaved(
              new Date(widget.updatedAt || widget.createdAt || Date.now())
            );
            console.log("✅ Widget configuration loaded and prefilled");
          } else {
            console.log("ℹ️ No widget configuration found in agent-config response");
            
            // ⚡ RACE CONDITION CHECK: before applying defaults to new agent
            if (currentRequestIdRef.current !== requestId) {
              console.log("⚠️ RACE CONDITION DETECTED (no widget): Ignoring stale response");
              setIsLoading(false);
              return;
            }
            
            // Explicitly clear EVERYTHING including allowedDomains for new agent
            console.log("🧹 Clearing ALL fields - No previous widget found");
            setLogoPreview("");
            setTriggerButtonImagePreview("");
            setWidgetConfig(defaultConfig);
            console.log("✅ Reset to clean defaults for new agent - allowedDomains cleared to:", defaultConfig.ui.allowedDomains);
          }
      } catch (error) {
        console.error("❌ Failed to load widget configuration:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWidgetConfig();

    // Cleanup: Abort previous request and clear timeouts on unmount or agent change
    return () => {
      if (abortControllerRef.current) {
        console.log("🛑 Cleanup: Aborting widget config request");
        abortControllerRef.current.abort();
      }
      if (configTimeoutRef.current) {
        clearTimeout(configTimeoutRef.current);
      }
    };
  }, [agentId, agentName]);

  // Handle logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      appToast.error('Please select a valid image file (JPG, PNG, GIF, or WebP)');
      e.target.value = ''; // Clear the input
      return;
    }

    // File size validation (1MB = 1024 * 1024 bytes)
    const maxSizeInBytes = 1024 * 1024; // 1MB
    if (file.size > maxSizeInBytes) {
      const fileSizeInKB = Math.round(file.size / 1024);
      appToast.error(`Logo file size (${fileSizeInKB}KB) exceeds the maximum limit of 1MB. Please choose a smaller image.`);
      e.target.value = ''; // Clear the input
      return;
    }

    // File name validation
    if (file.name.length > 100) {
      appToast.error('Logo file name is too long. Please rename the file and try again.');
      e.target.value = ''; // Clear the input
      return;
    }

    // If all validations pass, process the file
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setLogoPreview(base64);
      updateConfig("content", "companyLogo", base64);
      
      const fileSizeInKB = Math.round(file.size / 1024);
      appToast.success(`Logo uploaded successfully (${fileSizeInKB}KB)`);
    };
    
    reader.onerror = () => {
      appToast.error('Error reading the logo file. Please try again.');
      e.target.value = ''; // Clear the input
    };
    
    reader.readAsDataURL(file);
  };

  // Handle trigger button image upload
  const handleTriggerButtonImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      appToast.error('Please select a valid image file (JPG, PNG, GIF, or WebP)');
      e.target.value = '';
      return;
    }

    const maxSizeInBytes = 1024 * 1024; // 1MB
    if (file.size > maxSizeInBytes) {
      const fileSizeInKB = Math.round(file.size / 1024);
      appToast.error(`Image size (${fileSizeInKB}KB) exceeds the 1MB limit. Please choose a smaller image.`);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setTriggerButtonImagePreview(base64);
      updateConfig('content', 'triggerButtonImage', base64);
      const fileSizeInKB = Math.round(file.size / 1024);
      appToast.success(`Trigger button image uploaded (${fileSizeInKB}KB)`);
    };
    reader.onerror = () => {
      appToast.error('Error reading the image file. Please try again.');
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const saveWidgetConfig = async (silent = false) => {
    setIsSaving(true);
    try {
      let finalLogoUrl = widgetConfig.content.companyLogo;

      // Step 1: If logo is base64 (local preview), upload it first
      if (finalLogoUrl && finalLogoUrl.startsWith("data:image")) {
        console.log("📤 Logo is local, uploading to server first...");

        const response = await fetch(finalLogoUrl);
        const blob = await response.blob();
        const file = new File([blob], "logo.png", { type: blob.type });
        const uploadResponse = await agentAPI.uploadLogo(file);
        console.log("✅ Logo uploaded successfully");

        if (uploadResponse?.logo_url) {
          finalLogoUrl = uploadResponse.logo_url;
        } else if (uploadResponse?.data?.logo_url) {
          finalLogoUrl = uploadResponse.data.logo_url;
        } else if (uploadResponse?.data?.data?.logo_url) {
          finalLogoUrl = uploadResponse.data.data.logo_url;
        } else {
          console.warn("⚠️ No logo URL in upload response, using local URL");
        }
      }

      // Step 1b: Upload trigger button image if it's base64
      let finalTriggerButtonImageUrl = widgetConfig.content.triggerButtonImage;
      if (finalTriggerButtonImageUrl && finalTriggerButtonImageUrl.startsWith("data:image")) {
        console.log("📤 Trigger button image is local, uploading to server first...");
        const response = await fetch(finalTriggerButtonImageUrl);
        const blob = await response.blob();
        const file = new File([blob], "trigger_button.png", { type: blob.type });
        const uploadResponse = await agentAPI.uploadLogo(file);
        console.log("✅ Trigger button image uploaded successfully");
        if (uploadResponse?.logo_url) {
          finalTriggerButtonImageUrl = uploadResponse.logo_url;
        } else if (uploadResponse?.data?.logo_url) {
          finalTriggerButtonImageUrl = uploadResponse.data.logo_url;
        } else if (uploadResponse?.data?.data?.logo_url) {
          finalTriggerButtonImageUrl = uploadResponse.data.data.logo_url;
        }
      }

      // Step 2: Save widget configuration
      console.log("📤 Saving widget configuration...");
      const widgetData = {
        agent_id: agentId,
        company_logo: finalLogoUrl,
        trigger_button_image: finalTriggerButtonImageUrl,
        ai_employee_name: widgetConfig.content.companyName,
        ai_employee_description: widgetConfig.content.companyDescription,
        theme: "shivai-blue",
        position: widgetConfig.ui.position,
        button_text: widgetConfig.content.callToActionText || "📞 Call ShivAI!",
        welcome_message: widgetConfig.content.welcomeMessage,
        primary_color: widgetConfig.theme.primaryColor,
        gradient_start: widgetConfig.theme.primaryColor,
        gradient_end: widgetConfig.theme.accentColor,
        visibility: widgetConfig.ui.visibility,
        allowed_domains: widgetConfig.ui.allowedDomains.filter((domain: string) => domain.trim() !== ''), // Filter out empty domains
      };

      const saveResponse = await agentAPI.saveWidgetConfig(widgetData);
      console.log("✅ Widget configuration saved successfully:", saveResponse);

      // Step 3: Update agent name and custom instructions in EditAgent API
      try {
        console.log("📤 Updating agent name in all template fields...");
        
        // Fetch current agent data to get custom_instructions and template fields
        const agentConfigResponse = await agentAPI.getAgentConfig(agentId);
        const agentData = agentConfigResponse.agent;
        
        // Get the ACTUAL old agent name from the API response
        // This is the current name stored in the database
        const oldAgentName = agentData?.name || agentName;
        
        console.log("🎯 Using agent name for replacement:", {
          fromAPI: agentData?.name,
          fromProp: agentName,
          using: oldAgentName,
        });
        
        const newAgentName = widgetConfig.content.companyName;
        
        console.log("🔍 Agent data fetched:", {
          hasTemplate: !!agentData?.template,
          templateFields: agentData?.template ? Object.keys(agentData.template) : [],
          oldName: oldAgentName,
          newName: newAgentName,
          extractedFromFirstMessage: agentData?.template?.firstMessage?.substring(0, 100),
          firstMessageSample: agentData?.template?.firstMessage?.substring(0, 150),
        });
        
        // Helper function to replace agent name in text (case-insensitive, word boundaries)
        const replaceAgentName = (text: string | undefined | null): string => {
          if (!text) return text || ""; // Preserve empty/null/undefined as is
          if (!oldAgentName || !newAgentName) {
            console.log("⚠️ Missing names:", { oldAgentName, newAgentName });
            return text; // If old or new name missing, return original
          }
          
          console.log("🔍 Starting replacement:", {
            searchingFor: oldAgentName,
            replacingWith: newAgentName,
            textLength: text.length,
            textStart: text.substring(0, 150),
          });

          // Try 1: Exact word-boundary match (handles "Rock", "Linda", etc.)
          const nameRegex = new RegExp(`\\b${oldAgentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          console.log("🔎 Regex pattern:", nameRegex.toString());
          console.log("🔎 Regex test result:", nameRegex.test(text));
          
          // Reset the regex since test() advances the lastIndex
          const nameRegex2 = new RegExp(`\\b${oldAgentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          let result = text.replace(nameRegex2, newAgentName);
          let matchCount = (text.match(nameRegex2) || []).length;
          
          console.log("🔄 Replacement attempt (word boundaries):", {
            searchingFor: oldAgentName,
            replacingWith: newAgentName,
            original: text.substring(0, 100),
            replaced: result.substring(0, 100),
            changed: result !== text,
            matchCount: matchCount,
          });

          // Try 2: If no matches, try case-insensitive substring match
          if (matchCount === 0) {
            console.log("⚠️ No word-boundary matches found, trying substring match...");
            const caseInsensitiveRegex = new RegExp(oldAgentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            result = result.replace(caseInsensitiveRegex, newAgentName);
            const newMatchCount = (result === text ? 0 : 1); // Rough estimate
            console.log("🔄 Replacement attempt (substring):", {
              searchingFor: oldAgentName,
              replacingWith: newAgentName,
              original: text.substring(0, 100),
              replaced: result.substring(0, 100),
              changed: result !== text,
            });
          }
          
          return result;
        };
        
        // Update custom_instructions (systemPrompt)
        let customInstructions = replaceAgentName(agentData?.custom_instructions);
        console.log("✏️ Custom instructions updated:", {
          oldLength: agentData?.custom_instructions?.length || 0,
          newLength: customInstructions?.length || 0,
        });
        
        // Update template fields if they exist - always create updatedTemplate to send all fields
        const updatedTemplate = agentData?.template ? {
          // Required fields - preserve from original
          name: agentData.template.name,
          description: replaceAgentName(agentData.template.description),
          icon: agentData.template.icon,
          features: agentData.template.features,
          // Optional fields - update with name replacement
          systemPrompt: replaceAgentName(agentData.template.systemPrompt),
          firstMessage: replaceAgentName(agentData.template.firstMessage),
          openingScript: replaceAgentName(agentData.template.openingScript),
          keyTalkingPoints: replaceAgentName(agentData.template.keyTalkingPoints),
          closingScript: replaceAgentName(agentData.template.closingScript),
          // Also update objections if they exist
          ...(agentData.template.objections?.length > 0 && {
            objections: agentData.template.objections.map((obj: any) => ({
              objection: replaceAgentName(obj.objection),
              response: replaceAgentName(obj.response),
            })),
          }),
          // Also update conversation examples if they exist
          ...(agentData.template.conversationExamples?.length > 0 && {
            conversationExamples: agentData.template.conversationExamples.map((ex: any) => ({
              customerInput: replaceAgentName(ex.customerInput),
              expectedResponse: replaceAgentName(ex.expectedResponse),
            })),
          }),
        } : undefined;

        console.log("📋 Updated template structure:", {
          hasUpdatedTemplate: !!updatedTemplate,
          requiredFields: {
            name: updatedTemplate?.name,
            description: updatedTemplate?.description?.substring(0, 50),
            icon: updatedTemplate?.icon,
            featuresCount: updatedTemplate?.features?.length,
          },
          optionalFields: {
            systemPrompt: !!updatedTemplate?.systemPrompt,
            firstMessage: !!updatedTemplate?.firstMessage,
            openingScript: !!updatedTemplate?.openingScript,
            keyTalkingPoints: !!updatedTemplate?.keyTalkingPoints,
            closingScript: !!updatedTemplate?.closingScript,
            objections: updatedTemplate?.objections?.length || 0,
            conversationExamples: updatedTemplate?.conversationExamples?.length || 0,
          },
          values: {
            firstMessageBefore: agentData?.template?.firstMessage?.substring(0, 150),
            firstMessageAfter: updatedTemplate?.firstMessage?.substring(0, 150),
            keyTalkingPointsBefore: agentData?.template?.keyTalkingPoints?.substring(0, 150),
            keyTalkingPointsAfter: updatedTemplate?.keyTalkingPoints?.substring(0, 150),
            closingScriptBefore: agentData?.template?.closingScript?.substring(0, 150),
            closingScriptAfter: updatedTemplate?.closingScript?.substring(0, 150),
          },
        });

        // Build update payload with all template fields
        const updatePayload: any = {
          name: widgetConfig.content.companyName,
          custom_instructions: customInstructions,
        };

        // Include template if it exists
        if (updatedTemplate) {
          updatePayload.template = updatedTemplate;
        }

        console.log("📤 Sending update payload:", JSON.stringify(updatePayload, null, 2));
        
        const updateResponse = await agentAPI.updateAgent(agentId, updatePayload);
        console.log("✅ Agent update response:", {
          receivedName: updateResponse?.name,
          hasTemplate: !!updateResponse?.template,
          receivedTemplate: updateResponse?.template ? {
            name: updateResponse.template.name,
            firstMessage: updateResponse.template.firstMessage?.substring(0, 100),
          } : null,
        });
        
        console.log("✅ Agent name updated in all template fields successfully");

        // Emit event to notify parent component that agent was updated
        const agentUpdateEvent = new CustomEvent("agentUpdated", {
          detail: {
            agentId,
            updatedFields: {
              name: widgetConfig.content.companyName,
              custom_instructions: customInstructions,
              template: updatedTemplate,
            },
          },
        });
        window.dispatchEvent(agentUpdateEvent);
      } catch (error: any) {
        console.error("❌ Error updating agent name in template fields:", {
          errorMessage: error?.message,
          errorStatus: error?.response?.status,
          errorData: error?.response?.data,
          fullError: error,
        });
        console.warn("⚠️ Failed to update agent name in template fields:", error);
        // Don't fail the entire save if this step fails, just log a warning
      }

      // Update local config with final URLs
      setWidgetConfig((prev) => ({
        ...prev,
        content: {
          ...prev.content,
          companyLogo: finalLogoUrl,
          triggerButtonImage: finalTriggerButtonImageUrl,
        },
      }));

      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      setPreviewKey((prev) => prev + 1);

      // Emit event for integration code real-time updates
      const event = new CustomEvent("widgetConfigUpdated", {
        detail: {
          agentId,
          config: widgetConfig,
        },
      });
      window.dispatchEvent(event);

      // Show success notification (suppressed for internal/publish-triggered saves)
      if (!silent) appToast.success('Widget configuration saved successfully!');
    } catch (error) {
      console.error("❌ Error saving widget configuration:", error);

      // Show error notification with details
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      appToast.error(`Failed to save widget configuration: ${errorMessage}`);

      alert(
        "Failed to save widget configuration. Please check the console for details and try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Listen for external save trigger (publish / test button in parent)
  // Ref pattern keeps the listener stable without re-registering on every render.
  const saveWidgetConfigRef = useRef(saveWidgetConfig);
  useEffect(() => { saveWidgetConfigRef.current = saveWidgetConfig; });
  useEffect(() => {
    const handleExternalSave = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.agentId && detail.agentId !== agentId) return;
      console.log("💾 External save triggered for agent:", agentId);
      saveWidgetConfigRef.current(true);
    };
    window.addEventListener("shivai:save-widget-config", handleExternalSave);
    return () => window.removeEventListener("shivai:save-widget-config", handleExternalSave);
  }, [agentId]);

  const updateConfig = (
    section: keyof WidgetConfig,
    key: string,
    value: any
  ) => {
    const newConfig = {
      ...widgetConfig,
      [section]: {
        ...(widgetConfig[section] as Record<string, any>),
        [key]: value,
      },
    };

    setWidgetConfig(newConfig);
    setHasUnsavedChanges(true);

    // Emit event for integration code real-time updates
    const event = new CustomEvent("widgetConfigUpdated", {
      detail: {
        agentId,
        config: newConfig,
      },
    });
    window.dispatchEvent(event);

    // Debounced real-time preview update
    if (configTimeoutRef.current) {
      clearTimeout(configTimeoutRef.current);
    }

    configTimeoutRef.current = window.setTimeout(() => {
      setPreviewKey((prev) => prev + 1);
    }, 500);
  };

  return (
    <GlassCard>
      <div className="p-4 sm:p-6">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Loading widget configuration...
            </p>
          </div>
        )}

        {!isLoading && (
          <>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <Settings2 className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white">
                  Widget Customization
                </h3>
              </div>
              {hasUnsavedChanges && (
                <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded-full">
                  Unsaved changes
                </span>
              )}
              {lastSaved && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </h3>

            {/* Save Button */}
            <div className="flex justify-end gap-2 mb-6">
              
                <button
                  onClick={() => saveWidgetConfig()}
                  disabled={isSaving || !hasUnsavedChanges}
                  className="common-button-bg text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    isSaving
                      ? "Saving widget configuration..."
                      : "Save all changes to backend"
                  }
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading & Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
            </div>

            {/* Customization Content */}
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customization Panel */}
                <div className="space-y-6 min-w-0">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Company Branding
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                          Company Logo <span className="text-slate-400">(Max: 1MB)</span>
                        </label>
                        <div className="relative group w-32 h-32">
                          <input
                            ref={logoInputRef}
                            type="file"
                            id="logo-upload"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />

                          {/* Preview Box with Upload/Remove */}
                          <div className="relative w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 overflow-hidden">
                            {logoPreview ? (
                              <>
                                {console.log("🖼️ Rendering logo with preview:", logoPreview.substring(0, 50) + "...")}
                                <label
                                  htmlFor="logo-upload"
                                  className="cursor-pointer block w-full h-full"
                                >
                                  <img
                                    src={logoPreview}
                                    alt="Company Logo"
                                    className="w-full h-full object-contain p-3"
                                    onLoad={() => {
                                      console.log("✅ Logo image rendered successfully");
                                    }}
                                    onError={(e) => {
                                      console.error("❌ Logo image failed to render:", e.currentTarget.src);
                                      console.error("❌ Error details:", e);
                                      // Clear the preview if image fails to load
                                      setLogoPreview("");
                                    }}
                                    crossOrigin="anonymous"
                                  />
                                </label>
                                {/* Remove Button - Top Left */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLogoPreview("");
                                    updateConfig("content", "companyLogo", "");
                                  }}
                                  className="absolute top-2 left-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
                                  title="Remove logo"
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2.5}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <>
                                {console.log("📋 Rendering upload placeholder - no logo preview")}
                                <label
                                  htmlFor="logo-upload"
                                  className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                <svg
                                  className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                  />
                                </svg>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                  Upload
                                </span>
                                </label>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Trigger Button Image */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                          Trigger Button Image <span className="text-slate-400">(Max: 1MB — shown on the call button)</span>
                        </label>
                        <div className="relative group w-28 h-28">
                          <input
                            ref={triggerButtonInputRef}
                            type="file"
                            id="trigger-btn-upload"
                            accept="image/*"
                            onChange={handleTriggerButtonImageUpload}
                            className="hidden"
                          />
                          <div className="relative w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 overflow-hidden">
                            {triggerButtonImagePreview ? (
                              <label htmlFor="trigger-btn-upload" className="cursor-pointer block w-full h-full">
                                <img
                                  src={triggerButtonImagePreview}
                                  alt="Trigger Button"
                                  className="w-full h-full object-cover"
                                  onError={() => setTriggerButtonImagePreview("")}
                                />
                              </label>
                            ) : (
                              <label htmlFor="trigger-btn-upload" className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors rounded-full">
                                <svg className="w-9 h-9 text-slate-400 dark:text-slate-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Upload</span>
                              </label>
                            )}
                          </div>
                          {/* Remove button outside overflow-hidden so it's never clipped */}
                          {triggerButtonImagePreview && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTriggerButtonImagePreview("");
                                updateConfig("content", "triggerButtonImage", "");
                              }}
                              className="absolute -top-1.5 -right-1.5 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-20"
                              title="Remove image"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Upload a photo (e.g. agent avatar) to display inside the floating call button.</p>
                      </div>

                      {/* Call to Action Text */}
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                          Cloud Bubble Text
                        </label>
                        <input
                          type="text"
                          value={widgetConfig.content.callToActionText}
                          onChange={(e) =>
                            updateConfig(
                              "content",
                              "callToActionText",
                              e.target.value
                            )
                          }
                          placeholder="📞 Call ShivAI!"
                          className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Animated text shown in the cloud bubble next to the trigger button.</p>
                      </div>

                      {/* Company Name */}
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                          AI Employee Name *
                        </label>
                        <input
                          type="text"
                          value={widgetConfig.content.companyName}
                          onChange={(e) =>
                            updateConfig(
                              "content",
                              "companyName",
                              e.target.value
                            )
                          }
                          placeholder="Enter your company name"
                          className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                        />
                      </div>

                      {/* Company Description */}
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                          AI Employee Description
                        </label>
                        <textarea
                          value={widgetConfig.content.companyDescription}
                          onChange={(e) =>
                            updateConfig(
                              "content",
                              "companyDescription",
                              e.target.value
                            )
                          }
                          placeholder="AI-Powered Support - We offer 24/7 voice support to handle your business calls..."
                          rows={3}
                          className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm resize-none"
                        />
                      </div>

                      {/* Widget Visibility */}
                      <div className={`rounded-xl border-2 p-4 transition-all duration-200 overflow-hidden ${
                        widgetConfig.ui.visibility === 'public'
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-500/60'
                          : 'border-green-400 bg-green-50 dark:bg-green-900/10 dark:border-green-500/60'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Widget Visibility
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            widgetConfig.ui.visibility === 'public'
                              ? 'bg-amber-200 text-amber-800 dark:bg-amber-700/40 dark:text-amber-300'
                              : 'bg-green-200 text-green-800 dark:bg-green-700/40 dark:text-green-300'
                          }`}>
                            {widgetConfig.ui.visibility === 'public' ? 'Public' : 'Private'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                          Control which websites can load your widget.
                        </p>

                        {/* Toggle */}
                        <div className="flex gap-2 mb-3">
                          <button
                            onClick={() => updateConfig('ui', 'visibility', 'public')}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                              widgetConfig.ui.visibility === 'public'
                                ? 'bg-amber-400 border-amber-500 text-white shadow'
                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-amber-400'
                            }`}
                          >
                            All Websites
                          </button>
                          <button
                            onClick={() => updateConfig('ui', 'visibility', 'private')}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                              widgetConfig.ui.visibility === 'private'
                                ? 'bg-green-500 border-green-600 text-white shadow'
                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-green-400'
                            }`}
                          >
                            Specific URLs
                          </button>
                        </div>

                        {/* Warning banner when All */}
                        {widgetConfig.ui.visibility === 'public' && (
                          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-600">
                            <span className="text-base mt-0.5">⚠️</span>
                            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                              <strong>Heads up:</strong> Setting visibility to <em>All Websites</em> means anyone with your agent ID can embed this widget anywhere. Your AI may get misused. We recommend restricting to specific URLs.
                            </p>
                          </div>
                        )}

                        {/* URL list when Private */}
                        {widgetConfig.ui.visibility === 'private' && (
                          <div className="space-y-2">
                            <p className="text-[11px] text-green-700 dark:text-green-400 font-medium">
                              Widget will only load on the URLs listed below:
                            </p>
                            {(widgetConfig.ui.allowedDomains.length === 0 ? [''] : widgetConfig.ui.allowedDomains).map((url, idx) => (
                              <div key={idx} className="flex items-center gap-2 min-w-0">
                                <input
                                  type="text"
                                  value={url}
                                  onChange={(e) => {
                                    const updated = [...widgetConfig.ui.allowedDomains];
                                    if (updated.length === 0) updated.push('');
                                    updated[idx] = e.target.value;
                                    updateConfig('ui', 'allowedDomains', updated);
                                  }}
                                  placeholder="https://yoursite.com"
                                  className="common-bg-icons flex-1 px-3 py-1.5 rounded-lg text-xs"
                                />
                                {widgetConfig.ui.allowedDomains.length > 1 && (
                                  <button
                                    onClick={() => {
                                      const updated = widgetConfig.ui.allowedDomains.filter((_, i) => i !== idx);
                                      updateConfig('ui', 'allowedDomains', updated);
                                    }}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const updated = widgetConfig.ui.allowedDomains.length === 0
                                  ? ['', '']
                                  : [...widgetConfig.ui.allowedDomains, ''];
                                updateConfig('ui', 'allowedDomains', updated);
                              }}
                              className="text-[11px] text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 mt-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                              </svg>
                              Add another URL
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Theme & Gradient Presets */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Theme & Colors
                    </h4>
                    <div className="space-y-4">
                      {/* Gradient Presets - All in one slider */}
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-3">
                          Choose a Gradient Theme
                        </label>
                        
                        <div className="theme-slider-container">
                          <Slider
                            dots={false}
                            infinite={false}
                            speed={300}
                            slidesToShow={4}
                            slidesToScroll={1}
                            arrows={true}
                            prevArrow={
                              <button className="slick-arrow slick-prev" aria-label="Previous">
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                            }
                            nextArrow={
                              <button className="slick-arrow slick-next" aria-label="Next">
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            }
                            responsive={[
                              {
                                breakpoint: 1024,
                                settings: {
                                  slidesToShow: 3,
                                  slidesToScroll: 1,
                                }
                              },
                              {
                                breakpoint: 640,
                                settings: {
                                  slidesToShow: 2,
                                  slidesToScroll: 1,
                                }
                              }
                            ]}
                          >
                            {gradientPresets.map((preset) => {
                              const isSelected =
                                widgetConfig.theme.primaryColor ===
                                  preset.primaryColor &&
                                widgetConfig.theme.accentColor ===
                                  preset.accentColor;

                              return (
                                <div key={preset.id} className="px-1">
                                  <button
                                    onClick={() => applyGradientPreset(preset)}
                                    className={`relative group w-full h-14 lg:h-16 rounded-lg border-2 transition-all duration-200 ${
                                      isSelected
                                        ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
                                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                                    }`}
                                    style={{ background: preset.gradient }}
                                    title={preset.name}
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-md"></div>
                                    <div className="relative h-full flex flex-col items-center justify-center text-white">
                                      <div className="text-[10px] lg:text-xs font-medium opacity-90 px-1 text-center leading-tight">
                                        {preset.name}
                                      </div>
                                      {isSelected && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-blue-500 rounded-full flex items-center justify-center border border-white">
                                          <svg className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                </div>
                              );
                            })}
                          </Slider>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                          Select a preset theme or customize individual colors
                          below
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Preview Panel */}
                <div id="widget-live-preview" className="space-y-4 scroll-mt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Live Preview
                    </h4>
                    {/* Device Toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewDevice("mobile")}
                        className={`p-2 rounded-lg transition-colors ${
                          previewDevice === "mobile"
                            ? "common-button-bg text-white"
                            : "common-bg-icons text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPreviewDevice("desktop")}
                        className={`p-2 rounded-lg transition-colors ${
                          previewDevice === "desktop"
                            ? "common-button-bg text-white"
                            : "common-bg-icons text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <Monitor className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPreviewKey((prev) => prev + 1)}
                        className="p-2 rounded-lg common-bg-icons text-slate-600 dark:text-slate-400 hover:opacity-90 transition-opacity"
                        title="Refresh Preview"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Preview Container */}
                  <div
                    className={`relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl overflow-hidden ${
                      previewDevice === "mobile" ? "h-[600px]" : "h-[500px]"
                    }`}
                  >
                    <iframe
                      key={`${previewKey}-${JSON.stringify(
                        widgetConfig.content
                      )}`}
                      ref={iframeRef}
                      srcDoc={`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Widget Preview</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        .demo-content {
            text-align: center;
            max-width: 600px;
            width: 100%;
            padding: 2rem;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .company-header {
            margin-bottom: 2rem;
        }
        .company-logo {
            width: 80px;
            height: 80px;
            border-radius: 16px;
            margin: 0 auto 1rem;
            display: block;
            object-fit: cover;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .company-name {
            font-size: 2rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 0.5rem;
        }
        .company-description {
           y font-size: 1.1rem;
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 2rem;
        }
        .demo-text {
            color: #4b5563;
            font-size: 1rem;
            margin-bottom: 1rem;
        }
        .device-badge {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: 1rem;
        }
        @media (max-width: 768px) {
            body { padding: 10px; }
            .demo-content { padding: 1.5rem; }
            .company-name { font-size: 1.5rem; }
            .company-description { font-size: 1rem; }
        }
    </style>
</head>
<body>
    <div class="">
      
        
      

                        

<div class="demo-text">
  <strong> Test Your AI Employee Widget:</strong>
</div>
<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin: 1rem 0; text-align: left;">
  <div style="color: #374151; font-size: 0.9rem; line-height: 1.6;">
    <p style="margin: 0 0 1rem 0; font-weight: 600; color: #1f2937;">
      📋 How to test:
    </p>
    <ol style="margin: 0; padding-left: 1.5rem; color: #4b5563;">
      <li style="margin-bottom: 0.75rem;">
        <strong>Look for the call button</strong> - It should appear in the bottom-right corner
      </li>
      <li style="margin-bottom: 0.75rem;">
        <strong>Click to open</strong> - Test the interface and your custom branding
      </li>
      <li style="margin-bottom: 0.75rem;">
        <strong>Try voice features</strong> - Click the Start call button icon to test voice input of AI Employee
      </li>
      <li style="margin-bottom: 0;">
        <strong>Check response and Other Features</strong> - Send messages, view Transcripts, and see how the AI responds
      </li>
    </ol>
    <div style="margin-top: 1rem; padding: 0.75rem; background: #dbeafe; border-radius: 8px; border-left: 4px solid #3b82f6;">
      <p style="margin: 0; font-size: 0.85rem; color: #1e40af;">
        💡 <strong>Tip:</strong> Make changes in the customization panel and see them update in real-time!
      </p>
    </div>
  </div>
</div>
    </div>

    <!-- Pass configuration to widget -->
    <script>
        // Debug: Log agentId being passed to configure widget
        console.log("🔍 Setting configure widget agentId:", "${agentId}");
        
        window.ShivAI = window.ShivAI || {};
        window.ShivAI.config = {
            companyName: "${widgetConfig.content.companyName}",
            companyDescription: "${widgetConfig.content.companyDescription}",
            ${
              widgetConfig.content.companyLogo
                ? `companyLogo: "${widgetConfig.content.companyLogo}",`
                : ""
            }
            ${
              widgetConfig.content.triggerButtonImage
                ? `triggerButtonImage: "${widgetConfig.content.triggerButtonImage}",`
                : ""
            }
            callToActionText: "${widgetConfig.content.callToActionText || '📞 Call ShivAI!'}",
        };
        
        // Also set SHIVAI_CONFIG for agent ID and user ID (tenant_id)
        window.SHIVAI_CONFIG = {
            agentId: "${agentId}",
            userId: "${user?.id || ''}",
            theme: ${JSON.stringify(widgetConfig.theme)},
            ui: ${JSON.stringify(widgetConfig.ui)},
            content: ${JSON.stringify(widgetConfig.content)},
            features: ${JSON.stringify(widgetConfig.features)}
        };
        
        console.log("✅ Configure widget SHIVAI_CONFIG set:", window.SHIVAI_CONFIG);
        
        // Refresh widget theme after config is set
        setTimeout(() => {
            if (window.ShivAIWidget && window.ShivAIWidget.refreshTheme) {
                window.ShivAIWidget.refreshTheme();
                console.log("🎨 Theme refreshed in configure view");
            }
        }, 100);
    </script>
    
    <!-- Load the actual widget.js -->
    <script src="/widget.js?agentId=${agentId}&userId=${user?.id || ''}&bypass=true&companyName=${encodeURIComponent(
                        widgetConfig.content.companyName
                      )}&companyDescription=${encodeURIComponent(
                        widgetConfig.content.companyDescription
                      )}&agentName=${encodeURIComponent(
                        widgetConfig.content.companyName
                      )}&v=${Date.now()}"></script>
</body>
</html>`}
                      className="w-full h-full border-0"
                      title="Widget Preview"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </GlassCard>
  );
};

export default AgentWidgetCustomization;
