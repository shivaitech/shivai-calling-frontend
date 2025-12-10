import React, { useState, useRef, useEffect } from "react";
import { Smartphone, Monitor, Save, RefreshCw, Eye } from "lucide-react";
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
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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
                          Recommended: 200x200px, PNG or SVG, max 2MB
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
                      Company Description
                    </label>
                    <textarea
                      value={widgetConfig.content.companyDescription}
                      onChange={(e) => updateConfig("content", "companyDescription", e.target.value)}
                      placeholder="Describe what your AI assistant does..."
                      rows={3}
                      className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm resize-none"
                    />
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
                    onClick={() => setPreviewKey(prev => prev + 1)}
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
                  key={`${previewKey}-${JSON.stringify(widgetConfig.content)}`}
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
    <div class="demo-content">
        <div class="company-header">
            ${widgetConfig.content.companyLogo ? 
              `<img src="${widgetConfig.content.companyLogo}" alt="${widgetConfig.content.companyName} Logo" class="company-logo">` :
              `<div class="company-logo" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">${widgetConfig.content.companyName.charAt(0)}</div>`
            }
            <h1 class="company-name">${widgetConfig.content.companyName}</h1>
            <p class="company-description">${widgetConfig.content.companyDescription}</p>
        </div>
        
        <div class="device-badge">
            ${previewDevice.charAt(0).toUpperCase() + previewDevice.slice(1)} Preview
        </div>
        
        <p class="demo-text">
            This is a live preview of how your widget will appear on your website. 
            The widget will appear in the bottom right corner.
        </p>
    </div>

    <!-- Pass configuration to widget -->
    <script>
        window.ShivAI = window.ShivAI || {};
        window.ShivAI.config = {
            companyName: "${widgetConfig.content.companyName}",
            companyDescription: "${widgetConfig.content.companyDescription}",
            ${widgetConfig.content.companyLogo ? `companyLogo: "${widgetConfig.content.companyLogo}",` : ''}
        };
    </script>
    
    <!-- Load the actual widget.js -->
    <script src="/widget.js"></script>
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

            {/* Preview Container - Full Width */}
            <div
              ref={previewRef}
              className="relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl overflow-hidden"
              style={{
                height: previewDevice === "mobile" ? "700px" : "600px",
                width: "100%",
              }}
            >
              <iframe
                key={`${previewKey}-${JSON.stringify(widgetConfig.content)}`}
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
    <div class="demo-content">
        <div class="company-header">
            ${widgetConfig.content.companyLogo ? 
              `<img src="${widgetConfig.content.companyLogo}" alt="${widgetConfig.content.companyName} Logo" class="company-logo">` :
              `<div class="company-logo" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">${widgetConfig.content.companyName.charAt(0)}</div>`
            }
            <h1 class="company-name">${widgetConfig.content.companyName}</h1>
            <p class="company-description">${widgetConfig.content.companyDescription}</p>
        </div>
        
        <div class="device-badge">
            ${previewDevice.charAt(0).toUpperCase() + previewDevice.slice(1)} Preview
        </div>
        
        <p class="demo-text">
            This is a live preview of how your widget will appear on your website. 
            The widget will appear in the bottom right corner.
        </p>
    </div>

    <!-- Pass configuration to widget -->
    <script>
        window.ShivAI = window.ShivAI || {};
        window.ShivAI.config = {
            companyName: "${widgetConfig.content.companyName}",
            companyDescription: "${widgetConfig.content.companyDescription}",
            ${widgetConfig.content.companyLogo ? `companyLogo: "${widgetConfig.content.companyLogo}",` : ''}
        };
    </script>
    
    <!-- Load the actual widget.js -->
    <script src="/widget.js"></script>
</body>
</html>`}
                className="w-full h-full border-0"
                title="Widget Preview"
                sandbox="allow-scripts allow-same-origin"
              />
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
