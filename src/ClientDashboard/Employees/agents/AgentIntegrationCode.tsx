import React, { useState, useEffect } from "react";
import { Copy } from "lucide-react";
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

interface Agent {
  id: string;
  name: string;
  language: string;
}

interface AgentIntegrationCodeProps {
  currentAgent: Agent;
}

const AgentIntegrationCode: React.FC<AgentIntegrationCodeProps> = ({
  currentAgent,
}) => {
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
      welcomeMessage: `Hi! I'm ${currentAgent.name}. How can I help you today?`,
      companyName: currentAgent.name,
      companyDescription:
        "AI-Powered Support - We offer 24/7 voice support to handle your business calls efficiently and professionally.",
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

  // Load widget configuration
  useEffect(() => {
    const loadWidgetConfig = async () => {
      try {
        const response = await fetch(`/api/agents/${currentAgent.id}/widget-config`);
        if (response.ok) {
          const config = await response.json();
          setWidgetConfig(config);
        }
      } catch (error) {
        console.error("Failed to load widget configuration:", error);
      }
    };

    loadWidgetConfig();

    // Listen for widget configuration updates
    const handleWidgetConfigUpdate = (event: CustomEvent) => {
      if (event.detail.agentId === currentAgent.id) {
        setWidgetConfig(event.detail.config);
      }
    };

    window.addEventListener('widgetConfigUpdated', handleWidgetConfigUpdate as EventListener);

    return () => {
      window.removeEventListener('widgetConfigUpdated', handleWidgetConfigUpdate as EventListener);
    };
  }, [currentAgent.id]);

  // Generate the JavaScript embed code with all configurations in URL
  const generateEmbedCode = () => {
    // Build URL parameters from widget configuration
    const params = new URLSearchParams({
      agentId: currentAgent.id,
      agentName: currentAgent.name,
      language: currentAgent.language,
      primaryColor: widgetConfig.theme.primaryColor,
      secondaryColor: widgetConfig.theme.secondaryColor,
      accentColor: widgetConfig.theme.accentColor,
      position: widgetConfig.ui.position,
      chatWidth: widgetConfig.ui.chatWidth,
      chatHeight: widgetConfig.ui.chatHeight,
      autoOpen: widgetConfig.ui.autoOpen.toString(),
      voiceEnabled: widgetConfig.features.voiceEnabled.toString(),
      companyName: widgetConfig.content.companyName,
      companyDescription: widgetConfig.content.companyDescription,
      welcomeMessage: widgetConfig.content.welcomeMessage,
      v: Date.now().toString()
    });

    const widgetUrl = `https://callshivai.com/widget.js?${params.toString()}`;

    return `<script src="${widgetUrl}"></script>`;
  };

  const embedCode = generateEmbedCode();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode);
  };

  return (
    <div className="mt-6 sm:mt-8">
      <GlassCard>
        <div className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white mb-3 sm:mb-4">
            Widget Integration Code
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Copy and paste this script tag into your website's HTML. All your widget customizations are included in the URL.
          </p>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Script Tag
              </label>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Live Configuration
              </div>
            </div>
            
            <div className="relative">
              <code className="common-bg-icons block w-full p-3 rounded-lg text-xs sm:text-sm font-mono text-slate-800 dark:text-white overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                {embedCode}
              </code>
              <button
                onClick={handleCopyCode}
                className="absolute top-2 right-2 p-2 common-bg-icons rounded-md hover:shadow-sm transition-all touch-manipulation min-h-[36px] min-w-[36px] bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm"
                title="Copy embed code"
              >
                <Copy className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

          

            {/* Installation help */}
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                📋 Quick Installation:
              </h4>
              <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                <li>Copy the script tag above</li>
                <li>Paste it in your website's HTML, before the closing &lt;/body&gt; tag</li>
                <li>The widget will load automatically with all your custom settings</li>
                <li>To update: copy new script when you change settings</li>
              </ol>
              
            
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default AgentIntegrationCode;