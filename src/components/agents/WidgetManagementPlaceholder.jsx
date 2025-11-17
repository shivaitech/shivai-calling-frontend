import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import {
  Bot,
  Settings,
  Palette,
  Code,
  Eye,
  Play,
  Monitor,
  Smartphone,
  Tablet,
  MessageSquare,
  Phone,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  Download,
  ExternalLink,
  Copy,
  Check,
  BotIcon,
} from "lucide-react";

const WidgetManagementPlaceholder = () => {
  const { theme, currentTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("customize");
  const [previewDevice, setPreviewDevice] = useState("mobile");
  const [previewMode, setPreviewMode] = useState("chat");
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

  // Styled Button Component matching your specifications
  const StyledButton = ({
    children,
    onClick,
    title,
    variant = "default",
    className = "",
  }) => {
    const variantStyles = {
      default: `${currentTheme.cardBg} border ${currentTheme.border} hover:${currentTheme.activeBg}`,
      primary: "bg-blue-600 hover:bg-blue-700 text-white border-blue-600",
      secondary: `${currentTheme.activeBg} border ${currentTheme.border} ${currentTheme.text}`,
    };

    return (
      <button
        onClick={onClick}
        title={title}
        className={`p-2 rounded-lg transition-all duration-200 ${variantStyles[variant]} ${className}`}
      >
        {children}
      </button>
    );
  };

  const [widgetConfig, setWidgetConfig] = useState({
    theme: {
      primaryColor: "#2563eb",
      secondaryColor: "#ffffff",
      accentColor: "#3b82f6",
      borderRadius: "16px",
      fontFamily: "Inter, sans-serif",
      shadowIntensity: "medium",
    },
    ui: {
      position: "bottom-right",
      buttonSize: "medium",
      chatHeight: "450px",
      chatWidth: "380px",
      animationType: "slide",
    },
    content: {
      welcomeMessage: "Hi! I'm your AI assistant. How can I help you today?",
      placeholderText: "Type your message...",
      companyName: "ShivAI",
      subtitle: "AI-Powered Support",
    },
    features: {
      chatEnabled: true,
      voiceEnabled: true,
      soundEffects: true,
      showBranding: true,
      autoOpen: false,
    },
  });

  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const previewRef = useRef(null);

  // Auto-set mobile preview on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && previewDevice !== "mobile") {
        setPreviewDevice("mobile");
      }
    };

    // Set initial device based on screen size
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [previewDevice]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderPreviewWidget = () => {
    // Create a simple preview HTML page that loads the actual widget.js
    const previewHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ShivAI Widget Preview</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .preview-content {
            text-align: center;
            max-width: 600px;
            width: 100%;
        }
        .preview-title {
            color: #1f2937;
            font-size: 2rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        .preview-subtitle {
            color: #6b7280;
            font-size: 1.1rem;
            margin-bottom: 2rem;
        }
        .device-info {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 500;
            margin-bottom: 1rem;
        }
        @media (max-width: 768px) {
            body { padding: 10px; }
            .preview-title { font-size: 1.5rem; }
            .preview-subtitle { font-size: 1rem; }
        }
    </style>
</head>
<body>
    <div class="preview-content">
        <h1 class="preview-title">ShivAI Widget Preview</h1>
        <p class="preview-subtitle">Testing widget functionality in ${previewDevice} view</p>
        <div class="device-info">
            ${previewDevice.charAt(0).toUpperCase() + previewDevice.slice(1)} Preview Mode
        </div>
    </div>

    <!-- Widget Configuration -->
    <script>
        window.ShivAIConfig = ${JSON.stringify(widgetConfig, null, 2)};
        console.log('ShivAI Widget Config Applied:', window.ShivAIConfig);
    </script>
    
    <!-- Load the actual widget -->
    <script src="${window.location.origin}/widget.js" data-client-id="PREVIEW_CLIENT"></script>
</body>
</html>`;

    const blob = new Blob([previewHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    return (
      <iframe
        key={`${JSON.stringify(widgetConfig)}-${previewDevice}-${Date.now()}`}
        src={url}
        className="w-full h-full border-0 rounded-lg"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '8px',
        }}
        title="Widget Preview"
        onLoad={() => {
          // Clean up the blob URL after iframe loads
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}
      />
    );
  };

  return (
    <div className="space-y- lg:mt-2">
      {/* Main Content Card */}
      <div className={`${currentTheme.cardBg} backdrop-blur-lg rounded-xl border ${currentTheme.border} p-4 sm:p-6 shadow-lg`}>
        {/* Navigation Tabs - Mobile Responsive */}
        <div className="mb-6 overflow-x-auto">
          <div className={`flex space-x-1 p-1 ${currentTheme.activeBg} rounded-lg`}>
          {[
            {
              id: "overview",
              label: "Overview",
              shortLabel: "Overview",
              icon: Eye,
            },
            {
              id: "customize",
              label: "Customize & Preview",
              shortLabel: "Customize",
              icon: Palette,
            },
            {
              id: "integration",
              label: "Integration",
              shortLabel: "Code",
              icon: Code,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? `${currentTheme.cardBg} text-blue-600 shadow-sm`
                    : `${currentTheme.textSecondary} hover:${currentTheme.text}`
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-4 hover:shadow-md transition-shadow`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold ${currentTheme.text}`}>12</p>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>Active Widgets</p>
                  </div>
                  <Bot className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-4 hover:shadow-md transition-shadow`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold ${currentTheme.text}`}>2.4k</p>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>Conversations</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-4 hover:shadow-md transition-shadow`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold ${currentTheme.text}`}>8</p>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>Custom Themes</p>
                  </div>
                  <Palette className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-4 hover:shadow-md transition-shadow`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold ${currentTheme.text}`}>98%</p>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>Uptime</p>
                  </div>
                  <Eye className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-4 sm:p-6`}>
                <h3 className={`text-base sm:text-lg font-semibold ${currentTheme.text} mb-3 sm:mb-4`}>
                  Quick Actions
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <StyledButton
                    onClick={() => setActiveTab("customize")}
                    className="w-full flex items-center gap-3 p-3 sm:p-4 text-left touch-manipulation"
                    title="Customize & Preview Widget"
                  >
                    <Palette className="w-5 h-5 shrink-0" />
                    <span className="text-sm sm:text-base truncate">
                      Customize & Preview Widget
                    </span>
                  </StyledButton>
                  <StyledButton
                    onClick={() => setActiveTab("integration")}
                    className="w-full flex items-center gap-3 p-3 sm:p-4 text-left touch-manipulation"
                    title="Get Embed Code"
                  >
                    <Code className="w-5 h-5 shrink-0" />
                    <span className="text-sm sm:text-base truncate">
                      Get Embed Code
                    </span>
                  </StyledButton>
                </div>
              </div>

              <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-4 sm:p-6`}>
                <h3 className={`text-base sm:text-lg font-semibold ${currentTheme.text} mb-3 sm:mb-4`}>
                  Recent Widgets
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-3 sm:p-4 border ${currentTheme.border} rounded-lg ${currentTheme.hover} transition-colors`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 ${currentTheme.activeBg} rounded-lg flex items-center justify-center shrink-0`}>
                          <Bot className={`w-4 h-4 sm:w-5 sm:h-5 ${currentTheme.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${currentTheme.text} text-sm sm:text-base truncate`}>
                            Client Widget {i}
                          </p>
                          <p className={`text-xs sm:text-sm ${currentTheme.textSecondary} truncate`}>
                            Updated 2 hours ago
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <button
                          onClick={() => setActiveTab("customize")}
                          className={`p-1.5 sm:p-2 ${currentTheme.hover} rounded touch-manipulation`}
                          title="Customize Widget"
                        >
                          <Palette className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${currentTheme.text}`} />
                        </button>
                        <span className={`px-2 py-1 ${theme === 'dark' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-green-100 text-green-800'} text-xs rounded-full whitespace-nowrap`}>
                          Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "customize" && (
          <div className="flex flex-col xl:grid xl:grid-cols-2 gap-4 sm:gap-6">
            {/* Customization Panel */}
            <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-4 sm:p-6 order-2 xl:order-1`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`text-base sm:text-lg font-semibold ${currentTheme.text}`}>
                    Widget Customization
                  </h3>
                  <p className={`text-sm ${currentTheme.textSecondary}`}>
                    Configure your widget's appearance and behavior
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Theme Colors */}
                <div className={`p-4 ${theme === 'dark' ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20' : 'bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200'} rounded-lg shadow-sm`}>
                  <h4 className={`text-sm font-semibold ${currentTheme.text} mb-3 flex items-center gap-2`}>
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
                      <Palette className="w-3 h-3 text-white" />
                    </div>
                    Theme Colors
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-medium ${currentTheme.textSecondary} mb-2`}>
                        Primary Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={widgetConfig.theme.primaryColor}
                          onChange={(e) =>
                            setWidgetConfig({
                              ...widgetConfig,
                              theme: {
                                ...widgetConfig.theme,
                                primaryColor: e.target.value,
                              },
                            })
                          }
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={widgetConfig.theme.primaryColor}
                          onChange={(e) =>
                            setWidgetConfig({
                              ...widgetConfig,
                              theme: {
                                ...widgetConfig.theme,
                                primaryColor: e.target.value,
                              },
                            })
                          }
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="#2563eb"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium ${currentTheme.textSecondary} mb-2`}>
                        Accent Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={widgetConfig.theme.accentColor}
                          onChange={(e) =>
                            setWidgetConfig({
                              ...widgetConfig,
                              theme: {
                                ...widgetConfig.theme,
                                accentColor: e.target.value,
                              },
                            })
                          }
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={widgetConfig.theme.accentColor}
                          onChange={(e) =>
                            setWidgetConfig({
                              ...widgetConfig,
                              theme: {
                                ...widgetConfig.theme,
                                accentColor: e.target.value,
                              },
                            })
                          }
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* UI Settings */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
                  <h4 className={`text-sm font-semibold ${currentTheme.text} mb-3 flex items-center gap-2`}>
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-md flex items-center justify-center">
                      <Monitor className="w-3 h-3 text-white" />
                    </div>
                    UI Settings
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs font-medium ${currentTheme.textSecondary} mb-2`}>
                          Button Size
                        </label>
                        <select
                          value={widgetConfig.ui.buttonSize}
                          onChange={(e) =>
                            setWidgetConfig({
                              ...widgetConfig,
                              ui: {
                                ...widgetConfig.ui,
                                buttonSize: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="small">Small (32px)</option>
                          <option value="medium">Medium (40px)</option>
                          <option value="large">Large (48px)</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${currentTheme.textSecondary} mb-2`}>
                          Animation Type
                        </label>
                        <select
                          value={widgetConfig.ui.animationType}
                          onChange={(e) =>
                            setWidgetConfig({
                              ...widgetConfig,
                              ui: {
                                ...widgetConfig.ui,
                                animationType: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="slide">Slide Up</option>
                          <option value="fade">Fade In</option>
                          <option value="none">No Animation</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs font-medium ${currentTheme.textSecondary} mb-2`}>
                          Chat Width (px)
                        </label>
                        <input
                          type="number"
                          min="280"
                          max="500"
                          step="10"
                          value={parseInt(widgetConfig.ui.chatWidth)}
                          onChange={(e) =>
                            setWidgetConfig({
                              ...widgetConfig,
                              ui: {
                                ...widgetConfig.ui,
                                chatWidth: `${e.target.value}px`,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${currentTheme.textSecondary} mb-2`}>
                          Chat Height (px)
                        </label>
                        <input
                          type="number"
                          min="300"
                          max="600"
                          step="10"
                          value={parseInt(widgetConfig.ui.chatHeight)}
                          onChange={(e) =>
                            setWidgetConfig({
                              ...widgetConfig,
                              ui: {
                                ...widgetConfig.ui,
                                chatHeight: `${e.target.value}px`,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Settings */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 shadow-sm">
                  <h4 className={`text-sm font-semibold ${currentTheme.text} mb-3 flex items-center gap-2`}>
                    <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-md flex items-center justify-center">
                      <MessageSquare className="w-3 h-3 text-white" />
                    </div>
                    Content & Messages
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs font-medium ${currentTheme.textSecondary} mb-2`}>
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={widgetConfig.content.companyName}
                          onChange={(e) =>
                            setWidgetConfig({
                              ...widgetConfig,
                              content: {
                                ...widgetConfig.content,
                                companyName: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Your Company"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${currentTheme.textSecondary} mb-2`}>
                          Subtitle
                        </label>
                        <input
                          type="text"
                          value={widgetConfig.content.subtitle}
                          onChange={(e) =>
                            setWidgetConfig({
                              ...widgetConfig,
                              content: {
                                ...widgetConfig.content,
                                subtitle: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="AI-Powered Support"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className={`block text-xs font-medium ${currentTheme.textSecondary} mb-2`}>
                        Welcome Message
                      </label>
                      <textarea
                        value={widgetConfig.content.welcomeMessage}
                        onChange={(e) =>
                          setWidgetConfig({
                            ...widgetConfig,
                            content: {
                              ...widgetConfig.content,
                              welcomeMessage: e.target.value,
                            },
                          })
                        }
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Hi! I'm your AI assistant. How can I help you today?"
                      />
                    </div>
                  </div>
                </div>

                {/* Feature Toggles */}
                <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200 shadow-sm">
                  <h4 className={`text-sm font-semibold ${currentTheme.text} mb-3 flex items-center gap-2`}>
                    <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-amber-500 rounded-md flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                    Widget Features
                  </h4>
                  <div className="space-y-3">
                    {[
                      { key: 'chatEnabled', label: 'Chat Mode', icon: MessageSquare, desc: 'Enable text-based conversations' },
                      { key: 'voiceEnabled', label: 'Voice Mode', icon: Phone, desc: 'Enable voice calls with AI' },
                      { key: 'soundEffects', label: 'Sound Effects', icon: Volume2, desc: 'Play notification sounds' },
                      { key: 'showBranding', label: 'Show Branding', icon: BotIcon, desc: 'Display "Powered by ShivAI"' },
                      { key: 'autoOpen', label: 'Auto Open', icon: Play, desc: 'Open widget automatically after 3s' },
                    ].map(({ key, label, icon: Icon, desc }) => (
                      <label key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={widgetConfig.features[key]}
                          onChange={(e) =>
                            setWidgetConfig({
                              ...widgetConfig,
                              features: {
                                ...widgetConfig.features,
                                [key]: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <Icon className="w-5 h-5 text-blue-600 shrink-0" />
                        <div className="flex-1">
                          <span className={`text-sm font-medium ${currentTheme.text} block`}>
                            {label}
                          </span>
                          <span className={`text-xs ${currentTheme.textSecondary}`}>
                            {desc}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Preview Panel */}
            <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-4 sm:p-6 order-1 xl:order-2`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-base sm:text-lg font-semibold ${currentTheme.text}`}>
                      Live Preview
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        Real-time
                      </span>
                      <span className={`text-xs ${currentTheme.textSecondary}`}>
                        Using actual widget.js
                      </span>
                    </div>
                  </div>
                </div>

                {/* Device & Controls */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                    <button
                      onClick={() => setPreviewDevice("mobile")}
                      className={`p-2 rounded-md transition-colors ${
                        previewDevice === "mobile"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      title="Mobile Preview"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice("tablet")}
                      className={`hidden sm:flex p-2 rounded-md transition-colors ${
                        previewDevice === "tablet"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      title="Tablet Preview"
                    >
                      <Tablet className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice("desktop")}
                      className={`hidden md:flex p-2 rounded-md transition-colors ${
                        previewDevice === "desktop"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      title="Desktop Preview"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => setIsPreviewFullscreen(!isPreviewFullscreen)}
                    className={`p-2 rounded-md transition-colors ${
                      isPreviewFullscreen
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600 hover:text-gray-900"
                    }`}
                    title={isPreviewFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
                  >
                    <Maximize className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Preview Container */}
              <div
                className={`relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-2 border-dashed border-gray-200 rounded-lg overflow-hidden transition-all duration-300 ${
                  isPreviewFullscreen
                    ? "fixed inset-4 z-50 rounded-2xl shadow-2xl"
                    : ""
                }`}
                style={{
                  height: isPreviewFullscreen
                    ? "calc(100vh - 2rem)"
                    : previewDevice === "mobile"
                    ? "90vh"
                    : previewDevice === "tablet"
                    ? "75vh"
                    : "70vh",
                }}
              >
                {isPreviewFullscreen && (
                  <button
                    onClick={() => setIsPreviewFullscreen(false)}
                    className="absolute top-4 right-4 z-10 px-4 py-2 bg-white/90 hover:bg-white text-gray-600 rounded-full text-sm font-medium transition-colors shadow-lg"
                  >
                    Exit Fullscreen
                  </button>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                  <div className="relative h-full">{renderPreviewWidget()}</div>
                </div>
              </div>

              {/* Preview Controls */}
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <StyledButton
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium"
                  title="Refresh Preview"
                  onClick={() => {
                    // Force refresh by updating key
                    setIsAnimating(true);
                    setTimeout(() => setIsAnimating(false), 300);
                  }}
                >
                  <RotateCcw size={16} />
                  <span>Refresh Preview</span>
                </StyledButton>
                <StyledButton
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium"
                  title={`Switch to ${previewMode === "chat" ? "Voice" : "Chat"} Mode`}
                  onClick={() => setPreviewMode(previewMode === "chat" ? "voice" : "chat")}
                >
                  {previewMode === "chat" ? (
                    <Phone size={16} />
                  ) : (
                    <MessageSquare size={16} />
                  )}
                  <span className="hidden sm:inline">
                    {previewMode === "chat" ? "Voice" : "Chat"}
                  </span>
                </StyledButton>
              </div>
            </div>
          </div>
        )}

        {activeTab === "integration" && (
          <div className="space-y-6">
            <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-4 sm:p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <Code className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`text-base sm:text-lg font-semibold ${currentTheme.text}`}>
                    Widget Integration
                  </h3>
                  <p className={`text-sm ${currentTheme.textSecondary}`}>
                    Copy and paste these codes to embed your widget
                  </p>
                </div>
              </div>

              {/* Basic Embed Code */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <label className={`text-sm font-semibold ${currentTheme.text}`}>
                    Basic Embed Code
                  </label>
                  <StyledButton
                    onClick={() =>
                      copyToClipboard(
                        `<script src="${window.location.origin}/widget.js" data-client-id="CLIENT_123"></script>`
                      )
                    }
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm"
                    title={copied ? "Copied!" : "Copy Code"}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? "Copied!" : "Copy Code"}</span>
                  </StyledButton>
                </div>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                    {`<script src="${window.location.origin}/widget.js" data-client-id="CLIENT_123"></script>`}
                  </pre>
                </div>
              </div>

              {/* Advanced Configuration */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <label className={`text-sm font-semibold ${currentTheme.text}`}>
                    With Custom Configuration
                  </label>
                  <StyledButton
                    onClick={() =>
                      copyToClipboard(`<script>
  window.ShivAIConfig = ${JSON.stringify(widgetConfig, null, 2)};
</script>
<script src="${window.location.origin}/widget.js" data-client-id="CLIENT_123"></script>`)
                    }
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm"
                    title="Copy Configuration"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>Copy Config</span>
                  </StyledButton>
                </div>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto max-h-60 overflow-y-auto">
                    {`<script>
  window.ShivAIConfig = ${JSON.stringify(widgetConfig, null, 2)};
</script>
<script src="${window.location.origin}/widget.js" data-client-id="CLIENT_123"></script>`}
                  </pre>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <StyledButton
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium"
                  title="Download Script"
                >
                  <Download size={16} />
                  <span>Download Script</span>
                </StyledButton>
                <StyledButton
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium"
                  title="View Documentation"
                >
                  <ExternalLink size={16} />
                  <span>View Documentation</span>
                </StyledButton>
              </div>
            </div>

            {/* Success Message */}
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-900 mb-2">
                    ✅ Widget System Ready!
                  </h4>
                  <p className="text-sm text-green-800 mb-3 leading-relaxed">
                    Your embeddable widget system is fully functional with real-time preview, 
                    theme customization, and seamless integration capabilities.
                  </p>
                  <div className="space-y-2 text-sm text-green-700">
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <div>
                        <strong>Live Preview:</strong> Real-time widget preview using actual widget.js
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <div>
                        <strong>Theme System:</strong> JSON-based configuration with instant updates
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <div>
                        <strong>Dual Mode:</strong> Chat and Voice functionality
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <div>
                        <strong>Easy Integration:</strong> Copy-paste embed codes
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WidgetManagementPlaceholder;