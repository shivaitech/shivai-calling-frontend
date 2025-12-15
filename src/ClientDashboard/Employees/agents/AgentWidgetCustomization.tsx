import React, { useState, useRef, useEffect } from "react";
import { Smartphone, Monitor, Save, RefreshCw } from "lucide-react";
import GlassCard from "../../../components/GlassCard";

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
  };
  content: {
    welcomeMessage: string;
    companyName: string;
    companyDescription: string;
    companyLogo: string;
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
  const [activeTab, setActiveTab] = useState("configure");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">(
    "mobile"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const configTimeoutRef = useRef<number | null>(null);

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
    const event = new CustomEvent('widgetConfigUpdated', {
      detail: {
        agentId,
        config: newConfig,
      }
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
    },
    content: {
      welcomeMessage: `Hi! I'm ${agentName}. How can I help you today?`,
      companyName: agentName,
      companyDescription:
        "AI-Powered Support - We offer 24/7 voice support to handle your business calls effieciently and professionally.",
      companyLogo: "",
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

  useEffect(() => {
    const loadWidgetConfig = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/agents/${agentId}/widget-config`);
        if (response.ok) {
          const config = await response.json();
          setWidgetConfig(config);
          setLastSaved(new Date(config.updatedAt || Date.now()));
          console.log("✅ Widget configuration loaded");
        }
      } catch (error) {
        console.error("Failed to load widget configuration:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWidgetConfig();

    // Cleanup timeout on unmount
    return () => {
      if (configTimeoutRef.current) {
        clearTimeout(configTimeoutRef.current);
      }
    };
  }, [agentId]);

  // Handle logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        updateConfig("content", "companyLogo", base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveWidgetConfig = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/agents/${agentId}/widget-config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
          config: widgetConfig,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await response.json(); // Consume response
      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      // Update widget.js with new configuration
      await updateWidgetJS();

      // Refresh preview
      setPreviewKey((prev) => prev + 1);

      // Emit event for integration code real-time updates
      const event = new CustomEvent('widgetConfigUpdated', {
        detail: {
          agentId,
          config: widgetConfig,
        }
      });
      window.dispatchEvent(event);

      console.log("✅ Widget configuration saved successfully");

      // Show success notification
      const notification = document.createElement("div");
      notification.className =
        "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all";
      notification.textContent = "Widget configuration saved!";
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 3000);
    } catch (error) {
      console.error("Failed to save widget configuration:", error);
      alert("Failed to save widget configuration. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Real-time widget configuration update
  const updateWidgetJS = async () => {
    try {
      const customizedJS = await generateCustomizedWidget();

      // Send to backend to update widget.js file
      const response = await fetch("/api/widget/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
          widgetCode: customizedJS,
          config: widgetConfig,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update widget.js");
      }

      console.log("✅ Widget.js updated successfully");
    } catch (error) {
      console.error("Failed to update widget.js:", error);
    }
  };

  const generateCustomizedWidget = async () => {
    // Read the base widget.js and apply customizations
    const response = await fetch("/widget.js");
    let widgetCode = await response.text();

    // Apply theme customizations
    widgetCode = widgetCode.replace(
      /background: linear-gradient\(135deg, #4b5563 0%, #6b7280 30%, #374151 70%, #1f2937 100%\)/g,
      `background: linear-gradient(135deg, ${widgetConfig.theme.primaryColor} 0%, ${widgetConfig.theme.accentColor} 100%)`
    );

    // Apply UI customizations
    widgetCode = widgetCode.replace(
      /bottom: 20px;\s*right: 20px;/g,
      `${
        widgetConfig.ui.position.includes("bottom") ? "bottom" : "top"
      }: 20px; ${
        widgetConfig.ui.position.includes("right") ? "right" : "left"
      }: 20px;`
    );

    // Apply content customizations
    widgetCode = widgetCode.replace(
      /"ShivAI Employee"/g,
      `"${widgetConfig.content.companyName}"`
    );

    widgetCode = widgetCode.replace(
      /"AI-Powered Support"/g,
      `"${widgetConfig.content.companyDescription}"`
    );

    // Add custom CSS if provided
    if (widgetConfig.customCSS) {
      widgetCode = widgetCode.replace(
        "// Custom styles will be inserted here",
        widgetConfig.customCSS
      );
    }

    return widgetCode;
  };

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
    const event = new CustomEvent('widgetConfigUpdated', {
      detail: {
        agentId,
        config: newConfig,
      }
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
              Widget Customization
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

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab("configure")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "configure"
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Configure
              </button>

              {/* Save Button in Header */}
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setPreviewKey((prev) => prev + 1)}
                  disabled={activeTab !== "preview"}
                  className="p-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-50 transition-colors"
                  title="Refresh Preview"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={saveWidgetConfig}
                  disabled={isSaving || !hasUnsavedChanges}
                  className="common-button-bg text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Customize Tab */}
            {activeTab === "configure" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customization Panel */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Company Branding
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                          Company Logo
                        </label>
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-20 common-bg-icons rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {logoPreview || widgetConfig.content.companyLogo ? (
                              <img
                                src={
                                  logoPreview ||
                                  widgetConfig.content.companyLogo
                                }
                                alt="Company Logo"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="text-slate-400 text-center text-xs p-2">
                                No logo
                              </div>
                            )}
                          </div>
                          {/* Upload Button */}
                          <div className="flex-1">
                            <input
                              type="file"
                              id="logo-upload"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                            <label
                              htmlFor="logo-upload"
                              className="inline-block common-button-bg text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:opacity-90 transition-opacity"
                            >
                              Upload Logo
                            </label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                              Recommended: 200x200px, PNG or SVG, max 2MB
                            </p>
                          </div>
                        </div>
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
                    </div>
                  </div>

                  {/* Theme & Gradient Presets */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Theme & Colors
                    </h4>
                    <div className="space-y-4">
                      {/* Gradient Presets */}
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-3">
                          Choose a Gradient Theme
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {gradientPresets.map((preset) => {
                            const isSelected =
                              widgetConfig.theme.primaryColor ===
                                preset.primaryColor &&
                              widgetConfig.theme.accentColor ===
                                preset.accentColor;

                            return (
                              <button
                                key={preset.id}
                                onClick={() => applyGradientPreset(preset)}
                                className={`relative group h-16 rounded-lg border-2 transition-all duration-200 ${
                                  isSelected
                                    ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
                                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                                }`}
                                style={{ background: preset.gradient }}
                                title={preset.name}
                              >
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-md"></div>

                                {/* Content */}
                                <div className="relative h-full flex flex-col items-center justify-center text-white">
                                  <div className="text-xs font-medium mb-1 opacity-90">
                                    {preset.name}
                                  </div>

                                  {/* Selection indicator */}
                                  {isSelected && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                                      <svg
                                        className="w-3 h-3 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          Select a preset theme or customize individual colors
                          below
                        </p>
                      </div>

                      {/* Custom Color Inputs */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                            Primary Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={widgetConfig.theme.primaryColor}
                              onChange={(e) =>
                                updateConfig(
                                  "theme",
                                  "primaryColor",
                                  e.target.value
                                )
                              }
                              className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={widgetConfig.theme.primaryColor}
                              onChange={(e) =>
                                updateConfig(
                                  "theme",
                                  "primaryColor",
                                  e.target.value
                                )
                              }
                              className="flex-1 common-bg-icons px-2 py-1 text-xs rounded"
                              placeholder="#3b82f6"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                            Secondary Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={widgetConfig.theme.secondaryColor}
                              onChange={(e) =>
                                updateConfig(
                                  "theme",
                                  "secondaryColor",
                                  e.target.value
                                )
                              }
                              className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={widgetConfig.theme.secondaryColor}
                              onChange={(e) =>
                                updateConfig(
                                  "theme",
                                  "secondaryColor",
                                  e.target.value
                                )
                              }
                              className="flex-1 common-bg-icons px-2 py-1 text-xs rounded"
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                            Accent Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={widgetConfig.theme.accentColor}
                              onChange={(e) =>
                                updateConfig(
                                  "theme",
                                  "accentColor",
                                  e.target.value
                                )
                              }
                              className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={widgetConfig.theme.accentColor}
                              onChange={(e) =>
                                updateConfig(
                                  "theme",
                                  "accentColor",
                                  e.target.value
                                )
                              }
                              className="flex-1 common-bg-icons px-2 py-1 text-xs rounded"
                              placeholder="#2563eb"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Gradient Preview */}
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                          Current Gradient Preview
                        </label>
                        <div
                          className="h-12 rounded-lg border border-slate-200 dark:border-slate-700"
                          style={{
                            background: `linear-gradient(135deg, ${widgetConfig.theme.primaryColor} 0%, ${widgetConfig.theme.accentColor} 100%)`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Preview Panel */}
                <div className="space-y-4">
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
            font-size: 1.1rem;
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
        <strong>Look for the chat button</strong> - It should appear in the bottom-right corner
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
        };
        
        // Also set SHIVAI_CONFIG for agent ID
        window.SHIVAI_CONFIG = {
            agentId: "${agentId}",
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
    <script src="/widget.js?agentId=${agentId}&companyName=${encodeURIComponent(
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
            )}
          </>
        )}
      </div>
    </GlassCard>
  );
};

export default AgentWidgetCustomization;
