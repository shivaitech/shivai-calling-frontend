import React, { useState, useRef, useEffect } from "react";
import { Smartphone, Monitor, Copy, Check, Download } from "lucide-react";
import GlassCard from "../GlassCard";

interface WidgetConfig {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    borderRadius: string;
  };
  ui: {
    position: string;
    buttonSize: string;
    chatHeight: string;
    chatWidth: string;
  };
  content: {
    welcomeMessage: string;
    companyName: string;
    companyDescription: string;
    companyLogo: string; // URL or base64
  };
  features: {
    voiceEnabled: boolean;
    soundEffects: boolean;
    showBranding: boolean;
  };
}

interface AgentWidgetCustomizationProps {
  agentId: string;
  agentName: string;
}

const AgentWidgetCustomization: React.FC<AgentWidgetCustomizationProps> = ({
  agentId,
  agentName,
}) => {
  const [activeTab, setActiveTab] = useState("preview");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const previewRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({
    theme: {
      primaryColor: "#3b82f6",
      secondaryColor: "#ffffff",
      accentColor: "#2563eb",
      borderRadius: "16px",
    },
    ui: {
      position: "bottom-right",
      buttonSize: "medium",
      chatHeight: "500px",
      chatWidth: "380px",
    },
    content: {
      welcomeMessage: `Hi! I'm ${agentName}. How can I help you today?`,
      companyName: "ShivAI",
      companyDescription: "AI-Powered Support",
      companyLogo: "",
    },
    features: {
      voiceEnabled: true,
      soundEffects: true,
      showBranding: true,
    },
  });

  useEffect(() => {
    const loadWidgetConfig = async () => {
      try {
      } catch (error) {
      }
    };

    loadWidgetConfig();
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("Widget configuration saved successfully!");
    } catch (error) {
      alert("Failed to save widget configuration");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (activeTab === "preview" && iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
        const { ui } = widgetConfig;
        
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
                
                /* Override widget positioning for preview */
                .shivai-trigger {
                  position: fixed !important;
                  ${ui.position === "bottom-right" ? "right: 20px !important;" : "left: 20px !important;"}
                  bottom: 20px !important;
                }
                
                .shivai-widget {
                  position: fixed !important;
                  ${ui.position === "bottom-right" ? "right: 20px !important;" : "left: 20px !important;"}
                  bottom: 80px !important;
                }
              </style>
            </head>
            <body>
              <script>
                // Auto-click the widget trigger after load
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    const trigger = document.querySelector('.shivai-trigger');
                    if (trigger) {
                      trigger.click();
                    }
                  }, 500);
                });
              </script>
              <script src="/widget.js"></script>
            </body>
          </html>
        `;
        
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();
      }
    }
  }, [activeTab, widgetConfig.ui.position]);

  const updateConfig = (section: keyof WidgetConfig, key: string, value: any) => {
    setWidgetConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const copyEmbedCode = () => {
    const embedCode = `<script src="https://cdn.callshivai.com/widget.js" data-agent-id="${agentId}"></script>`;
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
        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-4">
          Widget Customization
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
          <button
            onClick={() => setActiveTab("install")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "install"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Install
          </button>
        </div>

    

        {/* Customize Tab */}
        {activeTab === "customize" && (
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
              </div>
            </div>

            {/* Theme Section */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Theme
              </h4>
              <div className="grid grid-cols-2 gap-4">
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
                    Border Radius
                  </label>
                  <select
                    value={widgetConfig.theme.borderRadius}
                    onChange={(e) => updateConfig("theme", "borderRadius", e.target.value)}
                    className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm"
                  >
                    <option value="8px">Small (8px)</option>
                    <option value="16px">Medium (16px)</option>
                    <option value="24px">Large (24px)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Position & Size */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Position & Size
              </h4>
              <div className="grid grid-cols-2 gap-4">
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
                Features
              </h4>
              <div className="space-y-3">
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
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={saveWidgetConfig}
                disabled={isSaving}
                className="common-button-bg text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Configuration
                  </>
                )}
              </button>
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
          </div>
        )}

        {/* Install Tab */}
        {activeTab === "install" && (
          <div className="space-y-4">
            <div className="common-bg-icons p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Embed Code
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Add this code snippet before the closing{" "}
                <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">
                  &lt;/body&gt;
                </code>{" "}
                tag on your website
              </p>
              <div className="relative">
                <pre className="common-bg-icons p-4 rounded-lg text-xs overflow-x-auto">
                  <code className="text-slate-800 dark:text-slate-200">
                    {`<script
  src="https://cdn.callshivai.com/widget.js"
  data-agent-id="${agentId}"
></script>`}
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

            <div className="common-bg-icons p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Installation Steps
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>Copy the embed code above</li>
                <li>Open your website's HTML file</li>
                <li>Paste the code before the closing &lt;/body&gt; tag</li>
                <li>Save and publish your changes</li>
                <li>The widget will appear on your website automatically</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 common-button-bg text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <Download className="w-4 h-4" />
                Download Config
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
                    Copy Code
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default AgentWidgetCustomization;
