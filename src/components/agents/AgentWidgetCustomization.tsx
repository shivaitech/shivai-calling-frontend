import React, { useState, useRef, useEffect } from "react";
import { Smartphone, Monitor, Copy, Check, Download, Save, RefreshCw, Eye, Globe } from "lucide-react";
import GlassCard from "../GlassCard";

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
  const [activeTab, setActiveTab] = useState("preview");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [previewKey, setPreviewKey] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const configTimeoutRef = useRef<number | null>(null);

  // Reset tab to preview if currently on advanced/install tab when agent becomes unpublished
  useEffect(() => {
    if (!isPublished && (activeTab === "install" || activeTab === "advanced")) {
      setActiveTab("preview");
    }
  }, [isPublished, activeTab]);

  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({
    theme: {
      primaryColor: "#ffffff",
      secondaryColor: "#ffffff",
      accentColor: "#2563eb",
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
      companyName: "ShivAI",
      companyDescription: "AI-Powered Support",
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
          console.log('✅ Widget configuration loaded');
        }
      } catch (error) {
        console.error('Failed to load widget configuration:', error);
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
      setLogoFile(file);
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
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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
      setPreviewKey(prev => prev + 1);
      
      console.log('✅ Widget configuration saved successfully');
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all';
      notification.textContent = 'Widget configuration saved!';
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 3000);
      
    } catch (error) {
      console.error('Failed to save widget configuration:', error);
      alert('Failed to save widget configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Real-time widget configuration update
  const updateWidgetJS = async () => {
    try {
      const customizedJS = await generateCustomizedWidget();
      
      // Send to backend to update widget.js file
      const response = await fetch('/api/widget/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          widgetCode: customizedJS,
          config: widgetConfig,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update widget.js');
      }
      
      console.log('✅ Widget.js updated successfully');
    } catch (error) {
      console.error('Failed to update widget.js:', error);
    }
  };

  const generateCustomizedWidget = async () => {
    // Read the base widget.js and apply customizations
    const response = await fetch('/widget.js');
    let widgetCode = await response.text();
    
    // Apply theme customizations
    widgetCode = widgetCode.replace(
      /background: linear-gradient\(135deg, #4b5563 0%, #6b7280 30%, #374151 70%, #1f2937 100%\)/g,
      `background: linear-gradient(135deg, ${widgetConfig.theme.primaryColor} 0%, ${widgetConfig.theme.accentColor} 100%)`
    );
    
    // Apply UI customizations
    widgetCode = widgetCode.replace(
      /bottom: 20px;\s*right: 20px;/g,
      `${widgetConfig.ui.position.includes('bottom') ? 'bottom' : 'top'}: 20px; ${widgetConfig.ui.position.includes('right') ? 'right' : 'left'}: 20px;`
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
        '// Custom styles will be inserted here',
        widgetConfig.customCSS
      );
    }
    
    return widgetCode;
  };

  useEffect(() => {
    if (activeTab === "preview" && iframeRef.current) {
      // Add a small delay to ensure iframe is ready
      const timer = setTimeout(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        
        if (iframeDoc) {
          const { ui, theme, content } = widgetConfig;
          
          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Widget Preview</title>
                <style>
                  body {
                    margin: 0;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    height: 100vh;
                    overflow: hidden;
                    position: relative;
                  }
                  
                  /* Live preview styles with current configuration */
                  .shivai-trigger {
                    position: fixed !important;
                    ${ui.position === "bottom-right" ? "right: 20px !important; bottom: 20px !important;" : 
                      ui.position === "bottom-left" ? "left: 20px !important; bottom: 20px !important;" :
                      ui.position === "top-right" ? "right: 20px !important; top: 20px !important;" :
                      "left: 20px !important; top: 20px !important;"}
                    background: ${theme.primaryColor} !important;
                    border-radius: ${theme.borderRadius} !important;
                    width: ${ui.buttonSize === 'small' ? '50px' : ui.buttonSize === 'large' ? '70px' : '60px'} !important;
                    height: ${ui.buttonSize === 'small' ? '50px' : ui.buttonSize === 'large' ? '70px' : '60px'} !important;
                  }
                  
                  .shivai-widget {
                    position: fixed !important;
                    ${ui.position === "bottom-right" ? "right: 20px !important; bottom: 80px !important;" : 
                      ui.position === "bottom-left" ? "left: 20px !important; bottom: 80px !important;" :
                      ui.position === "top-right" ? "right: 20px !important; top: 80px !important;" :
                      "left: 20px !important; top: 80px !important;"}
                    width: ${ui.chatWidth} !important;
                    height: ${ui.chatHeight} !important;
                    border-radius: ${theme.borderRadius} !important;
                  }
                  
                  .widget-header {
                    background: ${theme.primaryColor} !important;
                    color: ${theme.secondaryColor} !important;
                  }
                  
                  .widget-title {
                    color: ${theme.secondaryColor} !important;
                  }
                  
                  ${widgetConfig.customCSS}
                  
                  /* Loading indicator */
                  .preview-loading {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    color: white;
                    font-size: 14px;
                  }
                  
                  .spinner {
                    width: 32px;
                    height: 32px;
                    border: 3px solid rgba(255,255,255,0.3);
                    border-top: 3px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 10px;
                  }
                  
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                </style>
              </head>
              <body>
                <div class="preview-loading" id="loading">
                  <div class="spinner"></div>
                  <div>Loading widget preview...</div>
                </div>
                
                <script>
                  // Inject configuration into window object
                  window.SHIVAI_CONFIG = {
                    agentId: '${agentId}',
                    theme: ${JSON.stringify(theme)},
                    ui: ${JSON.stringify(ui)},
                    content: ${JSON.stringify(content)},
                    features: ${JSON.stringify(widgetConfig.features)}
                  };
                  
                  // Auto-open widget for preview after script loads
                  let widgetLoaded = false;
                  let retryCount = 0;
                  const maxRetries = 10;
                  
                  function checkAndOpenWidget() {
                    const trigger = document.querySelector('.shivai-trigger');
                    const loading = document.getElementById('loading');
                    
                    if (trigger && !widgetLoaded) {
                      widgetLoaded = true;
                      if (loading) loading.style.display = 'none';
                      
                      // Small delay to ensure widget is fully initialized
                      setTimeout(() => {
                        trigger.click();
                      }, 500);
                    } else if (retryCount < maxRetries) {
                      retryCount++;
                      setTimeout(checkAndOpenWidget, 300);
                    } else if (loading) {
                      loading.innerHTML = '<div>Widget failed to load. Please refresh.</div>';
                    }
                  }
                  
                  // Start checking for widget after script loads
                  setTimeout(checkAndOpenWidget, 1000);
                </script>
                <script src="/widget.js?v=${previewKey}&t=${Date.now()}"></script>
              </body>
            </html>
          `;
          
          iframeDoc.open();
          iframeDoc.write(html);
          iframeDoc.close();
        }
      }, 100); // Small delay to ensure iframe is ready
      
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [activeTab, widgetConfig, previewKey, agentId]);

  const updateConfig = (section: keyof WidgetConfig, key: string, value: any) => {
    setWidgetConfig((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, any>),
        [key]: value,
      },
    }));
    
    setHasUnsavedChanges(true);
    
    // Debounced real-time preview update
    if (configTimeoutRef.current) {
      clearTimeout(configTimeoutRef.current);
    }
    
    configTimeoutRef.current = window.setTimeout(() => {
      if (activeTab === "preview") {
        setPreviewKey(prev => prev + 1);
      }
    }, 500);
  };

  const copyEmbedCode = () => {
    const embedCode = `<script 
  src="https://cdn.callshivai.com/widget.js" 
  data-agent-id="${agentId}"
  data-theme-primary="${widgetConfig.theme.primaryColor}"
  data-theme-accent="${widgetConfig.theme.accentColor}"
  data-position="${widgetConfig.ui.position}"
  data-auto-open="${widgetConfig.ui.autoOpen}"
  data-draggable="${widgetConfig.ui.draggable}"
  data-voice-enabled="${widgetConfig.features.voiceEnabled}"
  data-sound-effects="${widgetConfig.features.soundEffects}"
  data-show-branding="${widgetConfig.features.showBranding}">
</script>`;
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderPreviewWidget = () => {
    return (
      <div className="relative h-full w-full">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0 rounded-lg"
          title="Widget Preview"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    );
  };

  return (
    <GlassCard>
      <div className="p-4 sm:p-6">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading widget configuration...</p>
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
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "preview"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Eye className="w-4 h-4 inline mr-1" />
            Preview
          </button>
          <button
            onClick={() => setActiveTab("customize")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "customize"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Configure
          </button>
          {isPublished && (
            <button
              onClick={() => setActiveTab("advanced")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "advanced"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Advanced
            </button>
          )}
          {isPublished && (
            <button
              onClick={() => setActiveTab("install")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "install"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Globe className="w-4 h-4 inline mr-1" />
              Integration
            </button>
          )}
          
          {/* Save Button in Header */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setPreviewKey(prev => prev + 1)}
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
        {activeTab === "customize" && (
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
                          src={logoPreview || widgetConfig.content.companyLogo}
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
                        Recommended: 200x200px, PNG or SVG
                      </p>
                    </div>
                  </div>
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={widgetConfig.content.companyName}
                    onChange={(e) => updateConfig("content", "companyName", e.target.value)}
                    placeholder="Enter your company name"
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                  />
                </div>

                {/* Company Description */}
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={widgetConfig.content.companyDescription}
                    onChange={(e) => updateConfig("content", "companyDescription", e.target.value)}
                    placeholder="e.g., AI-Powered Support"
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                  />
                </div>

                {/* Welcome Message */}
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Welcome Message
                  </label>
                  <textarea
                    value={widgetConfig.content.welcomeMessage}
                    onChange={(e) => updateConfig("content", "welcomeMessage", e.target.value)}
                    rows={3}
                    placeholder="Enter welcome message..."
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm resize-none"
                  />
                </div>
                
                {/* Additional Content Fields */}
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Placeholder Text
                  </label>
                  <input
                    type="text"
                    value={widgetConfig.content.placeholderText}
                    onChange={(e) => updateConfig("content", "placeholderText", e.target.value)}
                    placeholder="e.g., Type your message..."
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Offline Message
                  </label>
                  <input
                    type="text"
                    value={widgetConfig.content.offlineMessage}
                    onChange={(e) => updateConfig("content", "offlineMessage", e.target.value)}
                    placeholder="e.g., We're currently offline..."
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Theme Section */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Theme & Appearance
              </h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Primary Color
                  </label>
                  <input
                    type="color"
                    value={widgetConfig.theme.primaryColor}
                    onChange={(e) => updateConfig("theme", "primaryColor", e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Accent Color
                  </label>
                  <input
                    type="color"
                    value={widgetConfig.theme.accentColor}
                    onChange={(e) => updateConfig("theme", "accentColor", e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Border Radius
                  </label>
                  <select
                    value={widgetConfig.theme.borderRadius}
                    onChange={(e) => updateConfig("theme", "borderRadius", e.target.value)}
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                  >
                    <option value="4px">Sharp (4px)</option>
                    <option value="8px">Small (8px)</option>
                    <option value="16px">Medium (16px)</option>
                    <option value="24px">Large (24px)</option>
                    <option value="50%">Rounded (50%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Button Style
                  </label>
                  <select
                    value={widgetConfig.theme.buttonStyle}
                    onChange={(e) => updateConfig("theme", "buttonStyle", e.target.value)}
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                  >
                    <option value="floating">Floating</option>
                    <option value="solid">Solid</option>
                    <option value="outline">Outline</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Position & Size */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Position & Behavior
              </h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Position
                  </label>
                  <select
                    value={widgetConfig.ui.position}
                    onChange={(e) => updateConfig("ui", "position", e.target.value)}
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Button Size
                  </label>
                  <select
                    value={widgetConfig.ui.buttonSize}
                    onChange={(e) => updateConfig("ui", "buttonSize", e.target.value)}
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Chat Height
                  </label>
                  <input
                    type="text"
                    value={widgetConfig.ui.chatHeight}
                    onChange={(e) => updateConfig("ui", "chatHeight", e.target.value)}
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                    placeholder="500px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Chat Width
                  </label>
                  <input
                    type="text"
                    value={widgetConfig.ui.chatWidth}
                    onChange={(e) => updateConfig("ui", "chatWidth", e.target.value)}
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                    placeholder="380px"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widgetConfig.ui.autoOpen}
                    onChange={(e) => updateConfig("ui", "autoOpen", e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Auto-open widget on page load
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widgetConfig.ui.draggable}
                    onChange={(e) => updateConfig("ui", "draggable", e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Allow users to drag widget
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widgetConfig.ui.minimizeButton}
                    onChange={(e) => updateConfig("ui", "minimizeButton", e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Show minimize button
                  </span>
                </label>
              </div>
            </div>

            {/* Content */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Advanced Settings
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                      Chat Height
                    </label>
                    <input
                      type="text"
                      value={widgetConfig.ui.chatHeight}
                      onChange={(e) => updateConfig("ui", "chatHeight", e.target.value)}
                      className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                      Chat Width
                    </label>
                    <input
                      type="text"
                      value={widgetConfig.ui.chatWidth}
                      onChange={(e) => updateConfig("ui", "chatWidth", e.target.value)}
                      className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Features & Functionality
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widgetConfig.features.voiceEnabled}
                    onChange={(e) => updateConfig("features", "voiceEnabled", e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Enable Voice Calls
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widgetConfig.features.soundEffects}
                    onChange={(e) => updateConfig("features", "soundEffects", e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Sound Effects
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widgetConfig.features.showBranding}
                    onChange={(e) => updateConfig("features", "showBranding", e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Show "Powered by ShivAI"
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widgetConfig.features.messageHistory}
                    onChange={(e) => updateConfig("features", "messageHistory", e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Message History
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widgetConfig.features.typingIndicator}
                    onChange={(e) => updateConfig("features", "typingIndicator", e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Typing Indicator
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widgetConfig.features.fileUpload}
                    onChange={(e) => updateConfig("features", "fileUpload", e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    File Upload
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Tab - Only show when published */}
        {activeTab === "advanced" && isPublished && (
          <div className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
                ⚠️ Advanced Settings
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                These settings require technical knowledge. Incorrect values may break your widget.
              </p>
            </div>

            {/* Custom CSS */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Custom CSS
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                Add custom CSS to override widget styles. Use widget-specific selectors like .shivai-widget, .shivai-trigger
              </p>
              <textarea
                value={widgetConfig.customCSS}
                onChange={(e) => {
                  setWidgetConfig(prev => ({
                    ...prev,
                    customCSS: e.target.value
                  }));
                  setHasUnsavedChanges(true);
                }}
                rows={10}
                placeholder={`/* Custom widget styles */
.shivai-trigger {
  /* Custom trigger button styles */
}

.shivai-widget {
  /* Custom widget container styles */
}

.widget-header {
  /* Custom header styles */
}`}
                className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm font-mono resize-y"
              />
            </div>

            {/* Widget Configuration Export/Import */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Configuration Management
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    const config = JSON.stringify(widgetConfig, null, 2);
                    const blob = new Blob([config], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `widget-config-${agentId}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="common-button-bg2 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Config
                </button>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const config = JSON.parse(event.target?.result as string);
                          setWidgetConfig(config);
                          setHasUnsavedChanges(true);
                        } catch (error) {
                          alert('Invalid configuration file');
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="hidden"
                  id="import-config"
                />
                <label
                  htmlFor="import-config"
                  className="common-button-bg2 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
                >
                  Import Config
                </label>
              </div>
            </div>

            {/* Live Preview URL */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Live Preview URL
              </h4>
              <div className="common-bg-icons p-3 rounded-lg">
                <code className="text-sm text-slate-800 dark:text-slate-200 break-all">
                  {window.location.origin}/widget-preview?agent={agentId}&preview=true
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/widget-preview?agent=${agentId}&preview=true`);
                    alert('Preview URL copied to clipboard!');
                  }}
                  className="ml-2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === "preview" && (
          <div className="space-y-4">
            {/* Device Toggle */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPreviewDevice("mobile")}
                className={`p-2 rounded-lg transition-colors ${
                  previewDevice === "mobile"
                    ? "common-button-bg text-white"
                    : "common-bg-icons text-slate-600 dark:text-slate-400"
                }`}
              >
                <Smartphone className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPreviewDevice("desktop")}
                className={`p-2 rounded-lg transition-colors ${
                  previewDevice === "desktop"
                    ? "common-button-bg text-white"
                    : "common-bg-icons text-slate-600 dark:text-slate-400"
                }`}
              >
                <Monitor className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Container */}
            <div
              ref={previewRef}
              className="relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl overflow-hidden"
              style={{
                height: previewDevice === "mobile" ? "600px" : "500px",
                width: "100%",
              }}
            >
              {renderPreviewWidget()}
            </div>

             <div className="space-y-6">
            {/* Company Branding Section */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Company Branding
              </h4>
              <div className="space-y-4">
                {/* Company Logo */}
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Company Logo
                  </label>
                  <div className="flex items-start gap-4">
                    {/* Logo Preview */}
                    <div className="w-20 h-20 common-bg-icons rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {logoPreview || widgetConfig.content.companyLogo ? (
                        <img
                          src={logoPreview || widgetConfig.content.companyLogo}
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
                        Recommended: 200x200px, PNG or SVG
                      </p>
                    </div>
                  </div>
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={widgetConfig.content.companyName}
                    onChange={(e) => updateConfig("content", "companyName", e.target.value)}
                    placeholder="Enter your company name"
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                  />
                </div>

                {/* Company Description */}
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={widgetConfig.content.companyDescription}
                    onChange={(e) => updateConfig("content", "companyDescription", e.target.value)}
                    placeholder="e.g., AI-Powered Support"
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                  />
                </div>

                {/* Welcome Message */}
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Welcome Message
                  </label>
                  <textarea
                    value={widgetConfig.content.welcomeMessage}
                    onChange={(e) => updateConfig("content", "welcomeMessage", e.target.value)}
                    rows={3}
                    placeholder="Enter welcome message..."
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm resize-none"
                  />
                </div>
                
                {/* Additional Content Fields */}
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Placeholder Text
                  </label>
                  <input
                    type="text"
                    value={widgetConfig.content.placeholderText}
                    onChange={(e) => updateConfig("content", "placeholderText", e.target.value)}
                    placeholder="e.g., Type your message..."
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Offline Message
                  </label>
                  <input
                    type="text"
                    value={widgetConfig.content.offlineMessage}
                    onChange={(e) => updateConfig("content", "offlineMessage", e.target.value)}
                    placeholder="e.g., We're currently offline..."
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Theme Section */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Theme & Appearance
              </h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Primary Color
                  </label>
                  <input
                    type="color"
                    value={widgetConfig.theme.primaryColor}
                    onChange={(e) => updateConfig("theme", "primaryColor", e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Accent Color
                  </label>
                  <input
                    type="color"
                    value={widgetConfig.theme.accentColor}
                    onChange={(e) => updateConfig("theme", "accentColor", e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Border Radius
                  </label>
                  <select
                    value={widgetConfig.theme.borderRadius}
                    onChange={(e) => updateConfig("theme", "borderRadius", e.target.value)}
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                  >
                    <option value="4px">Sharp (4px)</option>
                    <option value="8px">Small (8px)</option>
                    <option value="16px">Medium (16px)</option>
                    <option value="24px">Large (24px)</option>
                    <option value="50%">Rounded (50%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Button Style
                  </label>
                  <select
                    value={widgetConfig.theme.buttonStyle}
                    onChange={(e) => updateConfig("theme", "buttonStyle", e.target.value)}
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                  >
                    <option value="floating">Floating</option>
                    <option value="solid">Solid</option>
                    <option value="outline">Outline</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Position & Size */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Position & Behavior
              </h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Position
                  </label>
                  <select
                    value={widgetConfig.ui.position}
                    onChange={(e) => updateConfig("ui", "position", e.target.value)}
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Button Size
                  </label>
                  <select
                    value={widgetConfig.ui.buttonSize}
                    onChange={(e) => updateConfig("ui", "buttonSize", e.target.value)}
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Chat Height
                  </label>
                  <input
                    type="text"
                    value={widgetConfig.ui.chatHeight}
                    onChange={(e) => updateConfig("ui", "chatHeight", e.target.value)}
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                    placeholder="500px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                    Chat Width
                  </label>
                  <input
                    type="text"
                    value={widgetConfig.ui.chatWidth}
                    onChange={(e) => updateConfig("ui", "chatWidth", e.target.value)}
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                    placeholder="380px"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widgetConfig.ui.autoOpen}
                    onChange={(e) => updateConfig("ui", "autoOpen", e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Auto-open widget on page load
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widgetConfig.ui.draggable}
                    onChange={(e) => updateConfig("ui", "draggable", e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Allow users to drag widget
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widgetConfig.ui.minimizeButton}
                    onChange={(e) => updateConfig("ui", "minimizeButton", e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Show minimize button
                  </span>
                </label>
              </div>
            </div>

            {/* Content */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Advanced Settings
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                      Chat Height
                    </label>
                    <input
                      type="text"
                      value={widgetConfig.ui.chatHeight}
                      onChange={(e) => updateConfig("ui", "chatHeight", e.target.value)}
                      className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">
                      Chat Width
                    </label>
                    <input
                      type="text"
                      value={widgetConfig.ui.chatWidth}
                      onChange={(e) => updateConfig("ui", "chatWidth", e.target.value)}
                      className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Features & Functionality
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widgetConfig.features.voiceEnabled}
                    onChange={(e) => updateConfig("features", "voiceEnabled", e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Enable Voice Calls
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widgetConfig.features.soundEffects}
                    onChange={(e) => updateConfig("features", "soundEffects", e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Sound Effects
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widgetConfig.features.showBranding}
                    onChange={(e) => updateConfig("features", "showBranding", e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Show "Powered by ShivAI"
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widgetConfig.features.messageHistory}
                    onChange={(e) => updateConfig("features", "messageHistory", e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Message History
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widgetConfig.features.typingIndicator}
                    onChange={(e) => updateConfig("features", "typingIndicator", e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Typing Indicator
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widgetConfig.features.fileUpload}
                    onChange={(e) => updateConfig("features", "fileUpload", e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    File Upload
                  </span>
                </label>
              </div>
            </div>
          </div>

          </div>
        )}

        {/* Install Tab - Only show when published */}
        {activeTab === "install" && isPublished && (
          <div className="space-y-6">
            <div className="common-bg-icons p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Customized Embed Code
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                This embed code includes your current widget configuration. Add it before the closing{" "}
                <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">
                  &lt;/body&gt;
                </code>{" "}
                tag on your website
              </p>
              <div className="relative">
                <pre className="common-bg-icons p-4 rounded-lg text-xs overflow-x-auto max-h-40">
                  <code className="text-slate-800 dark:text-slate-200">
{`<script 
  src="https://cdn.callshivai.com/widget.js" 
  data-agent-id="${agentId}"
  data-theme-primary="${widgetConfig.theme.primaryColor}"
  data-theme-accent="${widgetConfig.theme.accentColor}"
  data-position="${widgetConfig.ui.position}"
  data-auto-open="${widgetConfig.ui.autoOpen}"
  data-draggable="${widgetConfig.ui.draggable}"
  data-voice-enabled="${widgetConfig.features.voiceEnabled}"
  data-sound-effects="${widgetConfig.features.soundEffects}"
  data-show-branding="${widgetConfig.features.showBranding}">
</script>`}
                  </code>
                </pre>
                <button
                  onClick={copyEmbedCode}
                  className="absolute top-2 right-2 p-2 common-bg-icons rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Simple Embed Code */}
            <div className="common-bg-icons p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Simple Embed Code (Minimal)
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Basic embed code without custom configuration (uses saved settings)
              </p>
              <div className="relative">
                <pre className="common-bg-icons p-4 rounded-lg text-xs overflow-x-auto">
                  <code className="text-slate-800 dark:text-slate-200">
                    {`<script src="https://cdn.callshivai.com/widget.js" data-agent-id="${agentId}"></script>`}
                  </code>
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`<script src="https://cdn.callshivai.com/widget.js" data-agent-id="${agentId}"></script>`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="absolute top-2 right-2 p-2 common-bg-icons rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* WordPress Plugin */}
            <div className="common-bg-icons p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                WordPress Integration
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                For WordPress sites, use this shortcode in posts, pages, or widgets:
              </p>
              <div className="relative">
                <pre className="common-bg-icons p-4 rounded-lg text-xs overflow-x-auto">
                  <code className="text-slate-800 dark:text-slate-200">
                    {`[shivai_widget agent_id="${agentId}" theme_primary="${widgetConfig.theme.primaryColor}"]`}
                  </code>
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`[shivai_widget agent_id="${agentId}" theme_primary="${widgetConfig.theme.primaryColor}"]`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="absolute top-2 right-2 p-2 common-bg-icons rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>

            {/* Installation Steps */}
            <div className="common-bg-icons p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Installation Steps
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>Copy the embed code above</li>
                <li>Open your website's HTML file or CMS admin panel</li>
                <li>Paste the code before the closing &lt;/body&gt; tag</li>
                <li>Save and publish your changes</li>
                <li>Test the widget on your live website</li>
                <li>Use the preview URL to test before going live</li>
              </ol>
            </div>

            {/* Testing & Debugging */}
            <div className="common-bg-icons p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Testing & Debugging
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Test URL:</p>
                  <code className="text-xs text-slate-600 dark:text-slate-400 break-all">
                    {window.location.origin}/widget-test?agent={agentId}
                  </code>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-500">
                  <p>• Open browser developer tools to see any console errors</p>
                  <p>• Check that the agent ID matches your configuration</p>
                  <p>• Verify network connectivity to cdn.callshivai.com</p>
                  <p>• Test on mobile devices for responsive behavior</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  const config = {
                    agentId,
                    config: widgetConfig,
                    embedCode: `<script src="https://cdn.callshivai.com/widget.js" data-agent-id="${agentId}"></script>`,
                    customizedEmbedCode: `<script src="https://cdn.callshivai.com/widget.js" data-agent-id="${agentId}" data-theme-primary="${widgetConfig.theme.primaryColor}" data-theme-accent="${widgetConfig.theme.accentColor}" data-position="${widgetConfig.ui.position}"></script>`,
                    timestamp: new Date().toISOString()
                  };
                  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `shivai-widget-${agentId}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 common-button-bg text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Download className="w-4 h-4" />
                Download Package
              </button>
              <button
                onClick={copyEmbedCode}
                className="flex-1 common-bg-icons px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Embed Code
                  </>
                )}
              </button>
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
