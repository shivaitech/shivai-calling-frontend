import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  Bot,
  Settings,
  Eye,
  Monitor,
  Smartphone,
  Tablet,
  Upload,
  Image,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";

const WidgetManagementPlaceholder = () => {
  const { theme, currentTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("configure");
  const [previewDevice, setPreviewDevice] = useState("mobile");
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const previewRef = useRef(null);

  // Simplified widget configuration - only company details
  const [widgetConfig, setWidgetConfig] = useState({
    companyName: "ShivAI",
    companyDescription: "AI-Powered Voice Assistant for Your Business",
    companyLogo: null, // Will store file or URL
  });

  // Auto-set mobile preview on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && previewDevice !== "mobile") {
        setPreviewDevice("mobile");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [previewDevice]);

  // Handle logo upload
  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setWidgetConfig({
          ...widgetConfig,
          companyLogo: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const refreshPreview = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const renderPreviewWidget = () => {
    // Create HTML page that loads the actual widget.js exactly as it would on a website
    const previewHTML = `
<!DOCTYPE html>
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
            ${widgetConfig.companyLogo ? 
              `<img src="${widgetConfig.companyLogo}" alt="${widgetConfig.companyName} Logo" class="company-logo">` :
              `<div class="company-logo" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">${widgetConfig.companyName.charAt(0)}</div>`
            }
            <h1 class="company-name">${widgetConfig.companyName}</h1>
            <p class="company-description">${widgetConfig.companyDescription}</p>
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
            companyName: "${widgetConfig.companyName}",
            companyDescription: "${widgetConfig.companyDescription}",
            ${widgetConfig.companyLogo ? `companyLogo: "${widgetConfig.companyLogo}",` : ''}
        };
    </script>
    
    <!-- Load the actual widget.js -->
    <script src="/widget.js"></script>
</body>
</html>`;

    return (
      <iframe
        key={`${JSON.stringify(widgetConfig)}-${previewDevice}-${isRefreshing ? Date.now() : 'static'}`}
        srcDoc={previewHTML}
        className="w-full h-full border-0 rounded-lg bg-white"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          borderRadius: "8px",
        }}
        title="Widget Preview"
        sandbox="allow-scripts allow-same-origin"
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${currentTheme.cardBg} backdrop-blur-lg rounded-xl border ${currentTheme.border} p-6 shadow-lg`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Widget Customization</h2>
            <p className={`${currentTheme.textSecondary}`}>Customize your AI widget's branding and preview it live</p>
          </div>
          <button className={`px-4 py-2 ${currentTheme.cardBg} border ${currentTheme.border} rounded-lg hover:${currentTheme.activeBg} transition-colors flex items-center gap-2`}>
            <RotateCcw className="w-4 h-4" />
            Save Changes
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-6">
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-6 py-3 flex items-center gap-2 rounded-lg transition-colors ${
              activeTab === "preview"
                ? "bg-blue-600 text-white"
                : `${currentTheme.textSecondary} hover:${currentTheme.text}`
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => setActiveTab("configure")}
            className={`px-6 py-3 flex items-center gap-2 rounded-lg transition-colors ml-2 ${
              activeTab === "configure"
                ? "bg-blue-600 text-white"
                : `${currentTheme.textSecondary} hover:${currentTheme.text}`
            }`}
          >
            <Settings className="w-4 h-4" />
            Configure
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "preview" && (
          <div className="space-y-6">
            {/* Device Controls */}
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${currentTheme.text}`}>Widget Preview</h3>
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
                    <Smartphone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice("tablet")}
                    className={`p-2 rounded-md transition-colors ${
                      previewDevice === "tablet"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    title="Tablet Preview"
                  >
                    <Tablet className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Full Width Preview */}
            <div
              className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-2 border-dashed border-gray-200 rounded-lg overflow-hidden"
              style={{
                height: "700px",
              }}
            >
              <div className="absolute inset-0 p-4">
                {renderPreviewWidget()}
              </div>
            </div>
          </div>
        )}

        {activeTab === "configure" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customization Panel */}
            <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-6`}>
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-5 h-5 text-blue-600" />
                <h3 className={`text-lg font-semibold ${currentTheme.text}`}>Company Branding</h3>
              </div>

              <div className="space-y-6">
                {/* Company Logo Upload */}
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-3`}>
                    Company Logo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                      {widgetConfig.companyLogo ? (
                        <img 
                          src={widgetConfig.companyLogo} 
                          alt="Company Logo" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <Image className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                          <span className="text-xs text-gray-500">Logo</span>
                        </div>
                      )}
                    </div>
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
                        className={`inline-flex items-center gap-2 px-4 py-2 ${currentTheme.cardBg} border ${currentTheme.border} rounded-lg hover:${currentTheme.activeBg} cursor-pointer transition-colors`}
                      >
                        <Upload className="w-4 h-4" />
                        Upload Logo
                      </label>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                    </div>
                    {widgetConfig.companyLogo && (
                      <button
                        onClick={() => setWidgetConfig({...widgetConfig, companyLogo: null})}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Company Name */}
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-2`}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={widgetConfig.companyName}
                    onChange={(e) =>
                      setWidgetConfig({
                        ...widgetConfig,
                        companyName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Your Company Name"
                  />
                </div>

                {/* Company Description */}
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-2`}>
                    Company Description
                  </label>
                  <textarea
                    value={widgetConfig.companyDescription}
                    onChange={(e) =>
                      setWidgetConfig({
                        ...widgetConfig,
                        companyDescription: e.target.value,
                      })
                    }
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder="Describe what your AI assistant does..."
                  />
                </div>

                {/* Embed Code */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className={`text-sm font-medium ${currentTheme.textSecondary}`}>
                      Embed Code
                    </label>
                    <button
                      onClick={() => copyToClipboard(`<script src="${window.location.origin}/widget.js" data-company-name="${widgetConfig.companyName}" data-company-description="${widgetConfig.companyDescription}"${widgetConfig.companyLogo ? ` data-company-logo="${widgetConfig.companyLogo}"` : ''}></script>`)}
                      className={`flex items-center gap-2 px-3 py-1.5 text-sm ${currentTheme.cardBg} border ${currentTheme.border} rounded-lg hover:${currentTheme.activeBg} transition-colors`}
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded-lg text-sm overflow-x-auto">
                    <code>
                      {`<script src="${window.location.origin}/widget.js" data-company-name="${widgetConfig.companyName}" data-company-description="${widgetConfig.companyDescription}"${widgetConfig.companyLogo ? ` data-company-logo="${widgetConfig.companyLogo}"` : ''}></script>`}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Preview Panel */}
            <div className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-lg p-6`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-green-600" />
                  <h3 className={`text-lg font-semibold ${currentTheme.text}`}>Live Preview</h3>
                </div>

                {/* Device Controls */}
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
                      <Smartphone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice("tablet")}
                      className={`p-2 rounded-md transition-colors ${
                        previewDevice === "tablet"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      title="Tablet Preview"
                    >
                      <Tablet className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice("desktop")}
                      className={`p-2 rounded-md transition-colors ${
                        previewDevice === "desktop"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      title="Desktop Preview"
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={refreshPreview}
                    className={`p-2 rounded-md transition-colors ${currentTheme.cardBg} border ${currentTheme.border} hover:${currentTheme.activeBg}`}
                    title="Refresh Preview"
                  >
                    <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Preview Container */}
              <div
                className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-2 border-dashed border-gray-200 rounded-lg overflow-hidden"
                style={{
                  height: previewDevice === "mobile" 
                    ? "600px" 
                    : previewDevice === "tablet" 
                      ? "500px" 
                      : "450px",
                }}
              >
                <div className="absolute inset-0 p-4">
                  {renderPreviewWidget()}
                </div>
              </div>

              {/* Preview Info */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Live Preview:</strong> This shows exactly how your widget will appear on your website. 
                  The widget loads the actual widget.js file with your customizations.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WidgetManagementPlaceholder;
