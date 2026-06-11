(function () {
  "use strict";
  const _wlog = () => {};
  // Debug logger — always active, prefixed so easy to filter in DevTools
  const _dbg = (...a) => console.log("[ShivAI]", ...a);

  // ✅ Load LiveKit SDK dynamically
  function loadLiveKitSDK() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (typeof LivekitClient !== "undefined") {
        _wlog("✅ LiveKit already loaded");
        resolve();
        return;
      }

      _wlog("📦 Loading LiveKit SDK...");

      // Load livekit-client directly (components-core not needed)
      const clientScript = document.createElement("script");
      clientScript.src =
        "https://unpkg.com/livekit-client@latest/dist/livekit-client.umd.js";
      clientScript.onload = () => {
        _wlog("✅ LiveKit client loaded successfully");
        resolve();
      };
      
      clientScript.onerror = () => {
        console.error("❌ Failed to load LiveKit client");
        reject(new Error("Failed to load LiveKit client"));
      };
      document.head.appendChild(clientScript);
    });
  }

  try {
    localStorage.removeItem("shivai-trigger-position");
    localStorage.removeItem("shivai-widget-position");
  } catch (e) {}

  // LiveKit variables
  let room = null;
  let localAudioTrack = null;
  let remoteAudioTrack = null;

  // Legacy variables (keeping for compatibility)
  let ws = null;
  let audioContext = null;
  let mediaStream = null;
  let audioWorkletNode = null;
  let isConnected = false;
  let isMuted = false;
  let currentAssistantTranscript = "";
  let currentUserTranscript = "";
  let lastUserMessageDiv = null;
  let lastSentMessage = null; // Track last sent message to prevent duplicates
  let visualizerInterval = null;
  let isWidgetOpen = false;
  let isConnecting = false;
  let loadingInterval = null;
  let hasReceivedFirstAIResponse = false;
  let firstResponseReceived = false;
  let shouldAutoUnmute = false;
  let playbackProcessor = null;
  let playbackBufferQueue = [];
  let playbackBufferOffset = 0;
  let assistantSpeaking = false;
  let masterGainNode = null;
  let soundContext = null;
  let soundsEnabled = true;
  let connectingSoundInterval = null;
  let userInteracted = false;
  let audioBufferingStarted = false;
  let minBufferChunks = 3;
  let audioStreamComplete = false;
  let isDisconnecting = false; // Track disconnect process to prevent multiple clicks
  let aiJustFinished = false; // Track when AI just finished to prevent feedback

  // Mobile browser detection for fallbacks
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  _wlog("📱 Mobile browser detected:", isMobile);
  let ringAudio = null;
  let messageBubble = null;
  let connectionTimeout = null;
  let aiResponseTimeout = null;
  let retryCount = 0;
  const MAX_RETRIES = 0; // No retries - terminate immediately on error
  const CONNECTION_TIMEOUT = 15000; // 15 seconds
  let knowledgeBaseReady = false;
  let callTimerStarted = false;
  const AI_RESPONSE_TIMEOUT = 20000; // 20 seconds after connection

  // ✅ Enhanced latency tracking using audio events
  let latencyMetrics = {
    userSpeechStartTime: null,
    userSpeechEndTime: null,
    agentResponseStartTime: null,
    measurements: [],
    maxSamples: 30,
    isSpeaking: false,
    isAgentSpeaking: false,
  };

  let liveMessages = [
    "📞 Call ShivAI!",
    "📞 Call ShivAI!",
    "📞 Call ShivAI!",
    "📞 Call ShivAI!",
  ];

  // Helper function to get company info from API widget config, URL parameters, or defaults
  function getCompanyInfo() {
    let companyName = "ShivAI";
    let companyDescription = "AI-Powered Support";
    let agentName = "AI Employee";
    let companyLogo = ""; // Empty means use default ShivAI logo
    let triggerButtonImage = ""; // Empty means use default phone icon
    let callToActionText = "📞 Call ShivAI!"; // Default cloud bubble text
    let themeColors = {
      primaryColor: "#4b5563",
      secondaryColor: "#ffffff", 
      accentColor: "#2563eb"
    };
    let configSource = "defaults";
    
    try {
      // ✅ PRIORITY 1: Check for API widget configuration (from AgentWidgetCustomization component)
      if (window.SHIVAI_WIDGET_CONFIG && typeof window.SHIVAI_WIDGET_CONFIG === 'object') {
        _wlog("📦 API Widget Config found, using as primary source:", window.SHIVAI_WIDGET_CONFIG);
        
        const widget = window.SHIVAI_WIDGET_CONFIG;
        
        // Map API response fields to component structure
        // Prefer top-level agent name (_agent_name) over widget.ai_employee_name
        if (widget._agent_name || widget.ai_employee_name) {
          companyName = widget._agent_name || widget.ai_employee_name;
          _wlog("🏢 Using agent name from API config:", companyName);
        }
        
        if (widget.ai_employee_description) {
          companyDescription = widget.ai_employee_description;
          _wlog("📄 Using ai_employee_description from API widget config:", companyDescription);
        }
        
        if (widget.company_logo) {
          companyLogo = widget.company_logo;
          _wlog("🖼️ Using company_logo from API widget config (S3 URL)");
        }

        if (widget.trigger_button_image) {
          triggerButtonImage = widget.trigger_button_image;
          _wlog("🖼️ Using trigger_button_image from API widget config");
        }

        if (widget.button_text) {
          callToActionText = widget.button_text;
          _wlog("💬 Using button_text from API widget config:", callToActionText);
        }
        
        // Map color fields from API response
        if (widget.primary_color) {
          themeColors.primaryColor = widget.primary_color;
        }
        if (widget.gradient_start) {
          themeColors.secondaryColor = widget.gradient_start;
        }
        if (widget.gradient_end) {
          themeColors.accentColor = widget.gradient_end;
        }
        
        _wlog("🎨 Using theme colors from API widget config:", themeColors);
        configSource = "API widget config";
      }
      
      // ✅ PRIORITY 2: Check SHIVAI_CONFIG (legacy component state)
      else if (window.SHIVAI_CONFIG && typeof window.SHIVAI_CONFIG === 'object') {
        _wlog("📦 SHIVAI_CONFIG found, using as fallback source");
        
        const config = window.SHIVAI_CONFIG;
        
        if (config.content) {
          if (config.content.companyName) {
            companyName = config.content.companyName;
            _wlog("🏢 Using companyName from SHIVAI_CONFIG:", companyName);
          }
          if (config.content.companyDescription) {
            companyDescription = config.content.companyDescription;
            _wlog("📄 Using companyDescription from SHIVAI_CONFIG:", companyDescription);
          }
          if (config.content.companyLogo) {
            companyLogo = config.content.companyLogo;
            _wlog("🖼️ Using companyLogo from SHIVAI_CONFIG");
          }
          if (config.content.triggerButtonImage) {
            triggerButtonImage = config.content.triggerButtonImage;
            _wlog("🖼️ Using triggerButtonImage from SHIVAI_CONFIG");
          }
          if (config.content.callToActionText) {
            callToActionText = config.content.callToActionText;
            _wlog("💬 Using callToActionText from SHIVAI_CONFIG:", callToActionText);
          }
        }

        // Also check ShivAI.config for triggerButtonImage / callToActionText
        if (!triggerButtonImage && window.ShivAI && window.ShivAI.config && window.ShivAI.config.triggerButtonImage) {
          triggerButtonImage = window.ShivAI.config.triggerButtonImage;
          _wlog("🖼️ Using triggerButtonImage from ShivAI.config");
        }
        if (window.ShivAI && window.ShivAI.config && window.ShivAI.config.callToActionText) {
          callToActionText = window.ShivAI.config.callToActionText;
          _wlog("💬 Using callToActionText from ShivAI.config:", callToActionText);
        }
        
        if (config.theme) {
          if (config.theme.primaryColor) {
            themeColors.primaryColor = config.theme.primaryColor;
          }
          if (config.theme.secondaryColor) {
            themeColors.secondaryColor = config.theme.secondaryColor;
          }
          if (config.theme.accentColor) {
            themeColors.accentColor = config.theme.accentColor;
          }
          _wlog("🎨 Using theme colors from SHIVAI_CONFIG:", themeColors);
        }
        
        configSource = "SHIVAI_CONFIG";
      }
      
      // ✅ PRIORITY 3: Check URL parameters (legacy fallback)
      else {
        _wlog("📝 No API/component config found, checking URL parameters as fallback");
        
        const scriptTags = document.getElementsByTagName('script');
        for (let i = scriptTags.length - 1; i >= 0; i--) {
          const script = scriptTags[i];
          if (script.src && script.src.includes('/widget2.js')) {
            try {
              const url = new URL(script.src);
              const urlCompanyName = url.searchParams.get('companyName');
              const urlCompanyDescription = url.searchParams.get('companyDescription');
              const urlAgentName = url.searchParams.get('agentName');
              const urlCompanyLogo = url.searchParams.get('companyLogo');
              
              if (urlCompanyName) {
                companyName = decodeURIComponent(urlCompanyName);
                _wlog("🏢 Using companyName from URL parameter:", companyName);
              }
              if (urlCompanyDescription) {
                companyDescription = decodeURIComponent(urlCompanyDescription);
                _wlog("📄 Using companyDescription from URL parameter:", companyDescription);
              }
              if (urlAgentName) {
                agentName = decodeURIComponent(urlAgentName);
                _wlog("🤖 Using agentName from URL parameter:", agentName);
              }
              if (urlCompanyLogo) {
                companyLogo = decodeURIComponent(urlCompanyLogo);
                _wlog("🖼️ Using companyLogo from URL parameter");
              }
              break;
            } catch (urlError) {
              console.warn("⚠️ Error parsing script URL:", urlError);
              continue;
            }
          }
        }
        
        configSource = "URL parameters";
      }
      
    } catch (error) {
      console.warn("⚠️ Error getting company info, using defaults:", error);
      configSource = "defaults";
    }
    
    const result = { 
      name: companyName, 
      description: companyDescription,
      agentName: agentName,
      logo: companyLogo,
      triggerButtonImage: triggerButtonImage,
      callToActionText: callToActionText,
      theme: themeColors,
      configSource: configSource
    };
    _wlog(`✅ Final company info being used (source: ${configSource}):`, result);
    return result;
  }
  
  let currentMessageIndex = 0;
  let messageInterval = null;
  let triggerBtn = null;
  let widgetContainer = null;
  let landingView = null;
  let callView = null;
  let widgetInitialized = false; // becomes true after initWidget() runs once

  // ── Route guard ───────────────────────────────────────────────────────────
  // This widget must only appear on the public landing page, never inside the
  // ShivAI dashboard/app. We allow only "/" and "/landing" (with optional
  // trailing slash). On every other route the trigger + panel are hidden.
  function isLandingRoute() {
    var p = (window.location.pathname || "/").replace(/\/+$/, "") || "/";
    return p === "" || p === "/" || p === "/landing";
  }
  // Show/hide the widget based on the current route. Initialises lazily the
  // first time the user lands on an allowed route.
  function applyRouteVisibility() {
    var show = isLandingRoute();
    if (show && !widgetInitialized) {
      // Lazy first init on the landing page.
      bootstrapWidget();
      return;
    }
    var display = show ? "" : "none";
    if (triggerBtn) triggerBtn.style.display = display;
    if (widgetContainer) {
      if (!show) {
        // Leaving landing — fully close/hide the panel and end any call.
        try { if (typeof stopConversation === "function") stopConversation(); } catch (e) {}
        widgetContainer.style.display = "none";
        widgetContainer.classList.remove("open");
        document.body.classList.remove("shivai-widget-open");
      } else {
        // The panel itself stays closed until the user opens the trigger;
        // we only restore the trigger's visibility here.
        widgetContainer.style.display = "";
      }
    }
  }
  // Patch the History API so single-page-app navigations trigger our guard.
  function hookSpaNavigation() {
    if (window.__shivaiRouteHooked) return;
    window.__shivaiRouteHooked = true;
    var fire = function () {
      // Defer to let the SPA update location first.
      setTimeout(applyRouteVisibility, 0);
    };
    var _push = history.pushState;
    history.pushState = function () { var r = _push.apply(this, arguments); fire(); return r; };
    var _replace = history.replaceState;
    history.replaceState = function () { var r = _replace.apply(this, arguments); fire(); return r; };
    window.addEventListener("popstate", fire);
    window.addEventListener("hashchange", fire);
  }
  let statusDiv = null;
  let connectBtn = null;
  let messagesDiv = null;
  let messageInputContainer = null; // Reference to message input interface
  let clearBtn = null;
  let muteBtn = null;
  let visualizerBars = null;
  let languageSelect = null;
  let currentView = "landing";
  let callTimerElement = null;
  let callStartTime = null;
  let callTimerInterval = null;
  let agentStatus = { active: true, message: '' }; // Store agent status
  let agentLanguage = null; // Store agent's configured language
  let globalTenantId = null; // Store tenant_id globally so it's available in startConversation
  
  // Check agent status when widget loads
  async function checkAgentStatusOnLoad() {
    try {
      // Get agent ID and tenant ID from configuration (dynamic)
      let agentId = null;
      let bypassDomainCheck = false;
      
      // First try to get from URL parameters of the widget script
      const scriptTags = document.getElementsByTagName('script');
      let foundFromUrl = false;
      
      for (let i = scriptTags.length - 1; i >= 0; i--) {
        const script = scriptTags[i];
        if (script.src && (script.src.includes('/widget2.js') || script.src.includes('/widget3.js') || script.src.includes('/widget4.js') || script.src.includes('/widget.js'))) {
          try {
            const url = new URL(script.src);
            const urlAgentId = url.searchParams.get('agentId');
            const urlUserId = url.searchParams.get('userId');
            const urlBypass = url.searchParams.get('bypass');
            
            if (urlAgentId) {
              agentId = urlAgentId;
              foundFromUrl = true;
              _wlog("🎯 Using agentId for status check from URL:", agentId);
            }
            if (urlUserId) {
              globalTenantId = urlUserId;
              _wlog("👤 Using userId (tenant_id) from URL:", globalTenantId);
            }
            if (urlBypass === 'true') {
              bypassDomainCheck = true;
              _wlog("✅ Domain check bypass enabled - testing/preview mode");
            }
            if (foundFromUrl) break;
          } catch (urlErr) {
            console.warn("⚠️ Could not parse script URL:", urlErr);
          }
        }
      }
      
      // If not found in URL, try SHIVAI_CONFIG
      if (!foundFromUrl && window.SHIVAI_CONFIG && window.SHIVAI_CONFIG.agentId) {
        agentId = window.SHIVAI_CONFIG.agentId;
        _wlog("🎯 Using agentId from SHIVAI_CONFIG for status check:", agentId);
      }
      // Also try userId from SHIVAI_CONFIG if not already set from URL
      if (!globalTenantId && window.SHIVAI_CONFIG && window.SHIVAI_CONFIG.userId) {
        globalTenantId = window.SHIVAI_CONFIG.userId;
        _wlog("👤 Using userId (tenant_id) from SHIVAI_CONFIG:", globalTenantId);
      }
      // Then try to get from script data attributes
      if (!foundFromUrl) {
        const scriptElements = document.querySelectorAll('script[data-agent-id]');
        if (scriptElements.length > 0) {
          const lastScript = scriptElements[scriptElements.length - 1];
          agentId = lastScript.getAttribute('data-agent-id');
          _wlog("🎯 Using agentId from script data attribute for status check:", agentId);
          if (!globalTenantId && lastScript.getAttribute('data-user-id')) {
            globalTenantId = lastScript.getAttribute('data-user-id');
            _wlog("👤 Using userId from script data-user-id:", globalTenantId);
          }
        }
        else if (document.currentScript && document.currentScript.getAttribute('data-agent-id')) {
          agentId = document.currentScript.getAttribute('data-agent-id');
          _wlog("🎯 Using agentId from current script for status check:", agentId);
          if (!globalTenantId && document.currentScript.getAttribute('data-user-id')) {
            globalTenantId = document.currentScript.getAttribute('data-user-id');
            _wlog("👤 Using userId from current script data-user-id:", globalTenantId);
          }
        }
      }
      
      _wlog("👤 Final globalTenantId resolved:", globalTenantId || '(not set)');
      
      // If no agentId found, set status to inactive
      if (!agentId) {
        console.warn('⚠️ No agentId found in script URL or configuration');
        agentStatus.active = false;
        agentStatus.message = 'Agent ID not configured. Please check your widget installation.';
        return;
      }
      
      _wlog('🔍 Checking agent status for ID:', agentId);
      const response = await fetch(`https://nodejs.service.callshivai.com/api/v1/agent-configs/${agentId}`);
      
      if (response.ok) {
        const data = await response.json();
        _wlog('✅ Agent status response:', data);
        let agentRes = data?.data?.agent
        agentStatus.active = agentRes?.is_active !== false; // Default to true if not specified
        agentStatus.message = agentRes?.is_active === false 
          ? 'AI Employee is currently under maintenance. Please check back later.' 
          : '';
        
        // Store agent's configured language for widget default
        agentLanguage = agentRes?.language || null;
        _wlog('🌐 Agent language from config:', agentLanguage);
        
        _wlog('📊 Agent status set to:', agentStatus);
        
        // ✅ Extract and set widget configuration from API response
        if (agentRes?.widget) {
          window.SHIVAI_WIDGET_CONFIG = agentRes.widget;
          // Also store the top-level agent name so it takes priority over ai_employee_name
          if (agentRes.name) {
            window.SHIVAI_WIDGET_CONFIG._agent_name = agentRes.name;
          }
          _wlog('📦 Widget configuration set from API:', window.SHIVAI_WIDGET_CONFIG);
          _wlog('🎨 Available widget properties:');
          _wlog('  - ai_employee_name:', agentRes.widget.ai_employee_name);
          _wlog('  - ai_employee_description:', agentRes.widget.ai_employee_description);
          _wlog('  - company_logo:', agentRes.widget.company_logo ? '✅ Present (S3 URL)' : '❌ Not set');
          _wlog('  - primary_color:', agentRes.widget.primary_color);
          _wlog('  - gradient_start:', agentRes.widget.gradient_start);
          _wlog('  - gradient_end:', agentRes.widget.gradient_end);
          _wlog('  - text_color:', agentRes.widget.text_color);
          _wlog('  - position:', agentRes.widget.position);
          
          // Note: Widget UI will be created after this function completes in initWidget()
          // refreshWidgetContent() will be called there after createWidgetUI()

          // ✅ Domain restriction check
          const widgetVisibility = agentRes.widget.visibility || 'public';
          const allowedDomains = agentRes.widget.allowed_domains || [];
          
          // Skip domain check if bypass is enabled (for preview/testing/QR pages)
          if (bypassDomainCheck) {
            _wlog('✅ Domain check skipped - bypass mode enabled');
          } else if (widgetVisibility === 'private' && allowedDomains.length > 0) {
            const currentOrigin = window.location.origin.toLowerCase();
            const currentHost = window.location.hostname.toLowerCase();
            const isAllowed = allowedDomains.some(function(domain) {
              if (!domain) return false;
              const d = domain.toLowerCase().replace(/\/+$/, '');
              // Match full origin or hostname with/without protocol
              return currentOrigin === d ||
                     currentHost === d ||
                     currentOrigin.endsWith('://' + d) ||
                     currentHost.endsWith('.' + d) ||
                     d.replace(/^https?:\/\//, '') === currentHost;
            });
            if (!isAllowed) {
              console.warn('🚫 ShivAI Widget: this domain is not authorised to load this widget. Aborting.');
              agentStatus.active = false;
              agentStatus.blocked = true;
              agentStatus.message = 'Widget not available on this domain.';
              return; // Abort — do not render widget
            }
            _wlog('✅ Domain authorisation passed for:', currentHost);
          }
        } else {
          _wlog('ℹ️ No widget configuration found in agent response - getCompanyInfo() will use URL parameters or defaults');
        }
      } else {
        console.warn('⚠️ Could not fetch agent status, defaulting to inactive');
        agentStatus.active = false;
        agentStatus.message = 'Unable to verify agent status. Please try again later.';
      }
    } catch (error) {
      console.error('❌ Error checking agent status:', error);
      // Default to inactive on error
      agentStatus.active = false;
      agentStatus.message = 'Service temporarily unavailable. Please try again later.';
    }
  }
  
  // Enhanced microphone permission handler with retry logic
  async function requestMicrophonePermission(retryCount = 0) {
    const MAX_RETRIES = 3;
    
    _wlog(`🎤 Requesting microphone permission (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
    
    // Check if we're in secure context
    if (!window.isSecureContext) {
      console.error("❌ Not in secure context - HTTPS required");
      alert("Microphone access requires HTTPS. Please access this page using HTTPS.");
      return false;
    }
    
    // Check API availability
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("❌ MediaDevices API not available");
      alert("Microphone API is not available in your browser. Please use Chrome, Firefox, Safari, or Edge.");
      return false;
    }
    
    try {
      // Always try to get user media to trigger permission dialog
      // This forces the browser to show permission dialog regardless of previous state
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          channelCount: 1,
          sampleRate: 48000,
          sampleSize: 16,
          volume: 0.6,
          latency: 0.05,
          facingMode: "user",
          googEchoCancellation: true,
          googAutoGainControl: false,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googAudioMirroring: false
        }
      });
      
      _wlog("✅ Microphone permission granted!");
      _wlog("📍 Stream tracks:", stream.getTracks().length);
      
      // Stop the test stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      return true;
      
    } catch (error) {
      console.error(`❌ Microphone permission attempt ${retryCount + 1} failed:`, error);
      
      // Handle different error types
      if (error.name === "NotAllowedError") {
        // Permission denied
        if (retryCount < MAX_RETRIES) {
          // Ask user to try again
          const retry = confirm(
            `Microphone access is required for voice calls.\n\n` +
            `Permission was denied. Would you like to try again?\n\n` +
            `Please click "Allow" when the browser asks for microphone permission.\n\n` +
            `Attempt ${retryCount + 1} of ${MAX_RETRIES + 1}`
          );
          
          if (retry) {
            // Wait a bit and retry
            await new Promise(resolve => setTimeout(resolve, 500));
            return await requestMicrophonePermission(retryCount + 1);
          } else {
            _wlog("❌ User cancelled microphone permission retry");
            return false;
          }
        } else {
          // Max retries reached
          alert(
            "Microphone access was denied multiple times.\n\n" +
            "To use voice calls, please:\n" +
            "1. Click the microphone icon in your browser's address bar\n" +
            "2. Select 'Allow' for microphone access\n" +
            "3. Refresh the page and try again"
          );
          return false;
        }
      } else if (error.name === "NotFoundError") {
        alert("No microphone found. Please connect a microphone and try again.");
        return false;
      } else if (error.name === "NotSupportedError") {
        alert("Microphone access is not supported by your browser. Please use Chrome, Firefox, Safari, or Edge.");
        return false;
      } else {
        alert(`Microphone error: ${error.message}. Please check your system settings and try again.`);
        return false;
      }
    }
  }

  // Function to refresh widget styles with updated theme colors
  function refreshWidgetTheme() {
    // Remove existing styles
    const existingStyles = document.getElementById('shivai-widget-styles');
    if (existingStyles) {
      existingStyles.remove();
    }
    // Re-add styles with updated theme
    addWidgetStyles();
    _wlog("🎨 Widget theme refreshed with new colors");
  }

  // Function to refresh widget content with updated company info
  function refreshWidgetContent() {
    if (!widgetContainer) {
      _wlog("📝 Widget not created yet, content will be updated on creation");
      return;
    }

    _wlog("🔄 Refreshing widget content with latest company info...");
    const companyInfo = getCompanyInfo();
    _wlog("🏢 Using refreshed company info:", companyInfo);

    const widgetTitle = document.querySelector('.widget-title');
    if (widgetTitle) {
      widgetTitle.textContent = companyInfo.name;
      _wlog("✅ Updated landing view widget title to:", companyInfo.name);
    }

    const widgetSubtitle = document.querySelector('.widget-subtitle');
    if (widgetSubtitle) {
      widgetSubtitle.textContent = companyInfo.description;
      _wlog("✅ Updated landing view description to:", companyInfo.description);
    }

    const widgetAvatar = document.querySelector('.widget-avatar');
    if (widgetAvatar && companyInfo.logo) {
      widgetAvatar.innerHTML = `<img src="${companyInfo.logo}" alt="${companyInfo.name} Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
      _wlog("✅ Updated landing view logo to:", companyInfo.logo);
    }

    const callInfoName = document.querySelector('.call-info-name');
    if (callInfoName) {
      callInfoName.textContent = companyInfo.name;
      _wlog("✅ Updated call view agent name to:", companyInfo.name);
    }
    
    const callAvatar = document.querySelector('.call-avatar');
    if (callAvatar && companyInfo.logo) {
      callAvatar.innerHTML = `<img src="${companyInfo.logo}" alt="${companyInfo.name} Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      _wlog("✅ Updated call view avatar");
    }

    updateLandingViewBasedOnStatus();
    refreshWidgetTheme();
    
    _wlog("✅ Widget content refresh completed");
  }

  // Expose refresh function globally for theme updates
  window.ShivAIWidget = window.ShivAIWidget || {};
  window.ShivAIWidget.refreshTheme = refreshWidgetTheme;
  window.ShivAIWidget.refreshContent = refreshWidgetContent;

  async function initWidget() {
    // Check agent status first and wait for it to complete
    // This will also fetch and set window.SHIVAI_WIDGET_CONFIG from API
    await checkAgentStatusOnLoad();

    // If domain is not authorised, do not render anything
    if (agentStatus.blocked) {
      console.warn('🚫 ShivAI Widget: rendering aborted — domain not authorised.');
      return;
    }
    
    // Now create the widget UI - getCompanyInfo() will use the API data
    createWidgetUI();
    setupEventListeners();
    initSoundContext();
    
    // Refresh content again to ensure all dynamic elements are updated
    // (in case any elements weren't available during createWidgetUI)
    setTimeout(() => {
      refreshWidgetContent();
    }, 100);
  }
  function initSoundContext() {
    if (!soundsEnabled) return;
    try {
      soundContext = new (window.AudioContext || window.webkitAudioContext)();
      if (soundContext.state === "suspended") {
        const unlockAudio = () => {
          userInteracted = true;
          soundContext
            .resume()
            .then(() => {
              _wlog("🔊 Sound context resumed");
            })
            .catch((err) => {
              console.warn("Failed to resume sound context:", err);
            });
          if (audioContext && audioContext.state === "suspended") {
            audioContext
              .resume()
              .then(() => {
                _wlog("🎤 Voice audio context resumed");
              })
              .catch((err) => {
                console.warn("Failed to resume voice audio context:", err);
              });
          }
          document.removeEventListener("touchstart", unlockAudio);
          document.removeEventListener("click", unlockAudio);
        };
        document.addEventListener("touchstart", unlockAudio);
        document.addEventListener("click", unlockAudio);
      }
    } catch (error) {
      console.warn(
        "Could not initialize audio context for sound effects:",
        error
      );
      soundsEnabled = false;
    }
  }
  function playSound(type) {
    if (!soundsEnabled || !soundContext) {
      initSoundContext();
      if (!soundContext) return;
    }
    try {
      switch (type) {
        case "connecting":
          playConnectingSound();
          break;
        case "dialling":
          playDiallingSound();
          break;
        case "call-start":
          playCallStartSound();
          break;
        case "call-end":
          playCallEndSound();
          break;
        case "ring":
          playRingSound();
          break;
        default:
          console.warn("Unknown sound type:", type);
      }
    } catch (error) {
      console.warn("Error playing sound:", error);
    }
  }
  function playConnectingSound() {
    // Stop any existing connecting sound
    if (connectingSoundInterval) {
      clearInterval(connectingSoundInterval);
      connectingSoundInterval = null;
    }

    // Use ring1.mp3 for connecting sound
    try {
      if (!ringAudio) {
        ringAudio = new Audio(
          "https://shivai--assets.s3.ap-south-1.amazonaws.com/frontend-assets/voice-assets/ring.mpeg"
        );
        ringAudio.volume = 0.7;
      }
      ringAudio.loop = true; // Loop until stopped
      ringAudio.currentTime = 0;
      ringAudio.play().catch((error) => {
        console.warn("Could not play connecting sound:", error);
      });
      _wlog("🔊 Playing connecting sound (ring1.mp3)");
    } catch (error) {
      console.warn("Error playing connecting sound:", error);
    }
  }

  function stopConnectingSound() {
    _wlog("🔇 Stopping connecting sound...");

    if (ringAudio) {
      try {
        ringAudio.pause();
        ringAudio.currentTime = 0;
        ringAudio.loop = false;
        _wlog("✅ Ring audio stopped");
      } catch (error) {
        console.warn("⚠️ Error stopping ring audio:", error);
      }
    }

    if (connectingSoundInterval) {
      clearInterval(connectingSoundInterval);
      connectingSoundInterval = null;
      _wlog("✅ Connecting sound interval cleared");
    }
  }

  function playRingSound() {
    try {
      if (!ringAudio) {
        ringAudio = new Audio(
          "https://shivai--assets.s3.ap-south-1.amazonaws.com/frontend-assets/voice-assets/ring.mpeg"
        );
        ringAudio.loop = true;
        ringAudio.volume = 0.7;
      }
      ringAudio.currentTime = 0;
      ringAudio.play().catch((error) => {
        console.warn("Could not play ring sound:", error);
      });
    } catch (error) {
      console.warn("Error initializing ring sound:", error);
    }
  }

  function stopRingSound() {
    if (ringAudio) {
      ringAudio.pause();
      ringAudio.currentTime = 0;
      ringAudio.loop = false;
    }
  }
  function playDiallingSound() {
    const dialTone = 440;
    let iterations = 0;
    const maxIterations = 3;
    const playDialTone = () => {
      if (iterations < maxIterations) {
        generateTone(dialTone, 0.2, 0.4);
        setTimeout(() => {
          generateTone(dialTone, 0.2, 0.4);
        }, 250);
        iterations++;
        setTimeout(playDialTone, 800);
      }
    };
    playDialTone();
  }
  function playCallStartSound() {
    const frequencies = [261.63, 329.63, 392.0];
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        generateTone(freq, 0.3, 0.25);
      }, index * 50);
    });
  }
  function playCallEndSound() {
    const frequencies = [392.0, 329.63, 261.63];
    let delay = 0;
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        generateTone(freq, 0.2, 0.2);
      }, delay);
      delay += 100;
    });
  }
  async function getClientIP() {
    try {
      try {
        const response = await fetch("https://ipapi.co/json/", {
          method: "GET",
        });
        if (response.ok) {
          const data = await response.json();
          _wlog("🌐 [IP] Retrieved via ipapi.co:", data.ip);
          return data.ip;
        }
      } catch (e) {
        console.warn("🌐 [IP] ipapi.co failed:", e.message);
      }
      try {
        const response = await fetch("https://api.ipify.org?format=json", {
          method: "GET",
        });
        if (response.ok) {
          const data = await response.json();
          _wlog("🌐 [IP] Retrieved via ipify:", data.ip);
          return data.ip;
        }
      } catch (e) {
        console.warn("🌐 [IP] ipify failed:", e.message);
      }
      try {
        const response = await fetch("https://ipinfo.io/json", {
          method: "GET",
        });
        if (response.ok) {
          const data = await response.json();
          _wlog("🌐 [IP] Retrieved via ipinfo.io:", data.ip);
          return data.ip;
        }
      } catch (e) {
        console.warn("🌐 [IP] ipinfo.io failed:", e.message);
      }
      return null;
    } catch (error) {
      console.error("🌐 [IP] All IP detection methods failed:", error);
      return null;
    }
  }
  function generateTone(frequency, duration, volume = 0.1) {
    if (!soundContext) return;
    const oscillator = soundContext.createOscillator();
    const gainNode = soundContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(soundContext.destination);
    oscillator.frequency.setValueAtTime(frequency, soundContext.currentTime);
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0, soundContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      volume,
      soundContext.currentTime + 0.01
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      soundContext.currentTime + duration
    );
    oscillator.start(soundContext.currentTime);
    oscillator.stop(soundContext.currentTime + duration);
  }

  // ✅ LiveKit: Track when user stops speaking (using audio level monitoring)
  function monitorLocalAudioLevel(track) {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const mediaStream = new MediaStream([track.mediaStreamTrack]);
    const source = audioContext.createMediaStreamSource(mediaStream);

    source.connect(analyser);
    // Increase FFT size for better frequency resolution
    analyser.fftSize = 2048;
    // Adjust smoothing for more responsive detection
    analyser.smoothingTimeConstant = 0.3;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Higher threshold to prevent feedback detection and ensure user input only
    const SPEECH_THRESHOLD = 60; // Increased from 45 to 60 for better feedback prevention
    const SILENCE_DURATION = 500; // Increased from 400ms for more stable detection
    let silenceStart = null;

    function checkAudioLevel() {
      if (!isConnected || isMuted) return;

      // CRITICAL: Don't detect user speech if AI is currently speaking OR just finished
      if (latencyMetrics.isAgentSpeaking || aiJustFinished) {
        requestAnimationFrame(checkAudioLevel);
        return;
      }

      analyser.getByteFrequencyData(dataArray);

      // Use RMS (Root Mean Square) for better low-level detection
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength);

      // Also calculate weighted average focusing on speech frequencies (300-3400 Hz)
      const speechStart = Math.floor(
        (300 / (audioContext.sampleRate / 2)) * bufferLength
      );
      const speechEnd = Math.floor(
        (3400 / (audioContext.sampleRate / 2)) * bufferLength
      );
      let speechSum = 0;
      let speechCount = 0;

      for (let i = speechStart; i < Math.min(speechEnd, bufferLength); i++) {
        speechSum += dataArray[i];
        speechCount++;
      }
      const speechAverage = speechCount > 0 ? speechSum / speechCount : 0;

      // Use the higher of RMS or speech-focused average
      const audioLevel = Math.max(rms, speechAverage * 0.8);

      if (audioLevel > SPEECH_THRESHOLD) {
        // User is speaking
        if (!latencyMetrics.isSpeaking) {
          latencyMetrics.isSpeaking = true;
          latencyMetrics.userSpeechStartTime = performance.now();
          _wlog("👤 User started speaking");
          updateStatus("🎤 Listening...", "listening");
          setupSiriWave("user");
        }
        silenceStart = null;
      } else {
        // Silence detected
        if (latencyMetrics.isSpeaking) {
          if (!silenceStart) {
            silenceStart = performance.now();
          } else if (performance.now() - silenceStart > SILENCE_DURATION) {
            // User stopped speaking
            latencyMetrics.isSpeaking = false;
            latencyMetrics.userSpeechEndTime = performance.now();
            _wlog("👤 User stopped speaking");
            updateStatus("🤔 Processing...", "speaking");
            silenceStart = null;
            if (!latencyMetrics.isAgentSpeaking) setupSiriWave("idle");
          }
        }
      }

      requestAnimationFrame(checkAudioLevel);
    }

    checkAudioLevel();
  }

  // ✅ LiveKit: Track when agent starts responding
  function monitorRemoteAudioLevel(track) {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const mediaStream = new MediaStream([track.mediaStreamTrack]);
    const source = audioContext.createMediaStreamSource(mediaStream);

    source.connect(analyser);
    // Increase FFT size for better frequency resolution
    analyser.fftSize = 2048;
    // Adjust smoothing for more responsive detection
    analyser.smoothingTimeConstant = 0.3;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Higher threshold for close proximity detection only
    const SPEECH_THRESHOLD = 10; // Low threshold to detect AI speaking reliably

    function checkAudioLevel() {
      // Clear AI response timeout when agent starts speaking
      if (aiResponseTimeout && !hasReceivedFirstAIResponse) {
        clearTimeout(aiResponseTimeout);
        aiResponseTimeout = null;
        _wlog("✅ AI response received - timeout cleared");
      }
      if (!isConnected) return;

      analyser.getByteFrequencyData(dataArray);

      // Use peak detection for AI voice proximity
      let peak = 0;
      for (let i = 0; i < bufferLength; i++) {
        if (dataArray[i] > peak) {
          peak = dataArray[i];
        }
      }

      // Focus on AI voice frequencies for close detection
      const aiVoiceStart = Math.floor(
        (800 / (audioContext.sampleRate / 2)) * bufferLength
      );
      const aiVoiceEnd = Math.floor(
        (2000 / (audioContext.sampleRate / 2)) * bufferLength
      );
      let aiVoiceSum = 0;
      let aiVoiceCount = 0;

      for (let i = aiVoiceStart; i < Math.min(aiVoiceEnd, bufferLength); i++) {
        aiVoiceSum += dataArray[i];
        aiVoiceCount++;
      }
      const aiVoiceAverage = aiVoiceCount > 0 ? aiVoiceSum / aiVoiceCount : 0;

      // Use weighted combination favoring peak levels
      const audioLevel = peak * 0.7 + aiVoiceAverage * 0.3;

      if (audioLevel > SPEECH_THRESHOLD && !latencyMetrics.isAgentSpeaking) {
        // Agent started responding
        latencyMetrics.isAgentSpeaking = true;

        // Start timer on first AI response
        if (!hasReceivedFirstAIResponse) {
          hasReceivedFirstAIResponse = true;

          // Start call timer (only once)
          if (!callTimerStarted) {
            callTimerStarted = true;
            startCallTimer();
          }

          // Stop connecting sound, clear loading, hide connecting animation
          stopConnectingSound();
          clearLoadingStatus();
          hideConnectingState();

          // Update status to show AI is now ready
          updateStatus("✅ Connected - Speak now!", "connected");

          // Unmute microphone immediately - no delay needed
          if (isConnected && room) {
            (async () => {
              try {
                await room.localParticipant.setMicrophoneEnabled(true, {
                  // Optimized for close voice pickup and feedback prevention
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: false, // Prevent volume pumping
                  suppressLocalAudioPlayback: true, // Critical for feedback prevention

                  // High sensitivity settings
                  channelCount: 1,
                  sampleRate: 48000,
                  sampleSize: 16,
                  volume: 0.7, // Reduced for close voice only
                  latency: 0.05,
                  facingMode: "user",
                });
                isMuted = false;

                // Start monitoring local audio now that microphone is enabled
                const audioTracks = Array.from(
                  room.localParticipant.audioTrackPublications.values()
                );
                if (audioTracks.length > 0) {
                  localAudioTrack = audioTracks[0].track;
                  monitorLocalAudioLevel(localAudioTrack);
                  _wlog("🎤 Microphone monitoring started immediately");
                }

                _wlog(
                  "🎤 Microphone enabled immediately - ready for conversation"
                );
                updateStatus("🎤 You can speak now!", "connected");
              } catch (error) {
                console.error("❌ Error enabling microphone:", error);
              }
            })();
          }

          _wlog(
            "🎉 First AI response - timer started, connecting sound stopped, mic will unmute in 3s"
          );
        }

        // Always update status when AI starts speaking
        updateStatus("🤖 AI Speaking...", "speaking");
        setupSiriWave("ai");

        if (latencyMetrics.userSpeechEndTime) {
          latencyMetrics.agentResponseStartTime = performance.now();
          const latency =
            latencyMetrics.agentResponseStartTime -
            latencyMetrics.userSpeechEndTime;

          latencyMetrics.measurements.push(latency);
          if (latencyMetrics.measurements.length > latencyMetrics.maxSamples) {
            latencyMetrics.measurements.shift();
          }

          _wlog(`⚡ Response latency: ${Math.round(latency)}ms`);

          latencyMetrics.userSpeechEndTime = null;
        }
      } else if (
        audioLevel <= SPEECH_THRESHOLD &&
        latencyMetrics.isAgentSpeaking
      ) {
        latencyMetrics.isAgentSpeaking = false;
        aiJustFinished = true; // Set flag to prevent immediate feedback detection

        // Clear the flag after a delay to allow user input
        setTimeout(() => {
          aiJustFinished = false;
          _wlog(
            "✅ User input detection re-enabled after AI buffer period"
          );
        }, 500); // 500ms buffer to prevent feedback

        updateStatus("🟢 Connected - Speak naturally!", "connected");
        _wlog("🤖 AI stopped speaking - buffer period started");
        if (!latencyMetrics.isSpeaking) setupSiriWave("idle");
      }

      requestAnimationFrame(checkAudioLevel);
    }

    checkAudioLevel();
  }

  // ─── Shared drag helpers ────────────────────────────────────────────────────
  // Uses the Pointer Events API + setPointerCapture so drag events are never
  // lost to React synthetic events, jQuery handlers, iframes or scroll
  // interceptors in Next.js / WordPress / Webflow etc.
  //
  // Key improvements over the old mouse/touch approach:
  //  • setPointerCapture  – element keeps receiving events even when pointer
  //    leaves it or enters a child frame
  //  • Distance threshold – avoids accidental drag on simple clicks/taps
  //  • Coordinates captured immediately at pointerdown (no setTimeout race)
  //  • user-select:none on body prevents text-selection fighting the drag
  //  • clientWidth/Height excludes scrollbar width (no edge-jump)
  //  • Bubble repositioned safely within viewport during trigger drag
  // ────────────────────────────────────────────────────────────────────────────

  function makeDraggable(element) {
    const DRAG_THRESHOLD = 8;
    let isDragging = false;
    let activePointerId = null;
    let startX, startY, initialX, initialY;

    element.style.cursor = "grab";
    element.style.touchAction = "none";
    element.addEventListener("pointerdown", startDrag);

    function startDrag(e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      element.setPointerCapture(e.pointerId);
      activePointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      isDragging = false;
      const rect = element.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      element.addEventListener("pointermove", drag);
      element.addEventListener("pointerup", stopDrag);
      element.addEventListener("pointercancel", stopDrag);
    }

    function drag(e) {
      if (e.pointerId !== activePointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!isDragging) {
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
        isDragging = true;
        element.style.transition = "none";
        element.classList.add("dragging");
        document.body.style.userSelect = "none";
        document.body.style.webkitUserSelect = "none";
      }
      e.preventDefault();
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const rect = element.getBoundingClientRect();
      const margin = 4;
      const newX = Math.max(margin, Math.min(initialX + dx, vw - rect.width - margin));
      const newY = Math.max(margin, Math.min(initialY + dy, vh - rect.height - margin));
      element.style.position = "fixed";
      element.style.left = newX + "px";
      element.style.top = newY + "px";
      element.style.bottom = "auto";
      element.style.right = "auto";
    }

    function stopDrag(e) {
      if (e.pointerId !== activePointerId) return;
      element.removeEventListener("pointermove", drag);
      element.removeEventListener("pointerup", stopDrag);
      element.removeEventListener("pointercancel", stopDrag);
      if (isDragging) {
        isDragging = false;
        element.style.transition = "";
        element.classList.remove("dragging");
        document.body.style.userSelect = "";
        document.body.style.webkitUserSelect = "";
        element.style.cursor = "grab";
      }
      activePointerId = null;
    }
  }
  function makeWidgetDraggable(widgetElement) {
    const DRAG_THRESHOLD = 8;
    let isDragging = false;
    let activePointerId = null;
    let startX, startY, initialX, initialY;
    let activeHeader = null;

    const headers = widgetElement.querySelectorAll(
      ".widget-header, .call-header, .shivai-status-bar"
    );
    headers.forEach((header) => {
      header.style.cursor = "grab";
      header.style.touchAction = "none";
      header.addEventListener("pointerdown", startDrag);
    });

    function startDrag(e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (
        e.target.closest(
          ".widget-close, .start-call-btn, .back-btn, " +
          ".language-section-landing, .privacy-link"
        ) ||
        e.target.tagName === "SELECT" ||
        e.target.tagName === "OPTION"
      ) return;

      e.preventDefault();
      activeHeader = e.currentTarget;
      activeHeader.setPointerCapture(e.pointerId);
      activePointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      isDragging = false;
      const rect = widgetElement.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      activeHeader.addEventListener("pointermove", drag);
      activeHeader.addEventListener("pointerup", stopDrag);
      activeHeader.addEventListener("pointercancel", stopDrag);
    }

    function drag(e) {
      if (e.pointerId !== activePointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!isDragging) {
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
        isDragging = true;
        widgetElement.style.transition = "none";
        widgetElement.classList.add("dragging");
        document.body.style.userSelect = "none";
        document.body.style.webkitUserSelect = "none";
        if (activeHeader) activeHeader.style.cursor = "grabbing";
      }
      e.preventDefault();
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const rect = widgetElement.getBoundingClientRect();
      const margin = 4;
      const newX = Math.max(margin, Math.min(initialX + dx, vw - rect.width - margin));
      const newY = Math.max(margin, Math.min(initialY + dy, vh - rect.height - margin));
      widgetElement.style.position = "fixed";
      widgetElement.style.left = newX + "px";
      widgetElement.style.top = newY + "px";
      widgetElement.style.bottom = "auto";
      widgetElement.style.right = "auto";
    }

    function stopDrag(e) {
      if (e.pointerId !== activePointerId) return;
      if (activeHeader) {
        activeHeader.removeEventListener("pointermove", drag);
        activeHeader.removeEventListener("pointerup", stopDrag);
        activeHeader.removeEventListener("pointercancel", stopDrag);
      }
      if (isDragging) {
        isDragging = false;
        widgetElement.style.transition = "";
        widgetElement.classList.remove("dragging");
        document.body.style.userSelect = "";
        document.body.style.webkitUserSelect = "";
        if (activeHeader) activeHeader.style.cursor = "grab";
      }
      activePointerId = null;
      activeHeader = null;
    }
  }
  function makeTriggerBtnDraggable(btnElement) {
    const DRAG_THRESHOLD = 8;
    let isDragging = false;
    let activePointerId = null;
    let startX, startY, initialX, initialY;

    btnElement.style.touchAction = "none";
    btnElement.addEventListener("pointerdown", startDrag);

    function startDrag(e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      btnElement.setPointerCapture(e.pointerId);
      activePointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      isDragging = false;
      const rect = btnElement.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      btnElement.addEventListener("pointermove", drag);
      btnElement.addEventListener("pointerup", stopDrag);
      btnElement.addEventListener("pointercancel", stopDrag);
    }

    function drag(e) {
      if (e.pointerId !== activePointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!isDragging) {
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
        isDragging = true;
        btnElement.style.transition = "none";
        btnElement.classList.add("dragging");
        document.body.style.userSelect = "none";
        document.body.style.webkitUserSelect = "none";
      }
      e.preventDefault();
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const btnRect = btnElement.getBoundingClientRect();
      const margin = 4;
      const newX = Math.max(margin, Math.min(initialX + dx, vw - btnRect.width - margin));
      const newY = Math.max(margin, Math.min(initialY + dy, vh - btnRect.height - margin));
      btnElement.style.position = "fixed";
      btnElement.style.left = newX + "px";
      btnElement.style.top = newY + "px";
      btnElement.style.bottom = "auto";
      btnElement.style.right = "auto";
      if (messageBubble) {
        const bw = messageBubble.offsetWidth || 200;
        const bh = messageBubble.offsetHeight || 40;
        const btnH = btnRect.height;
        const btnW = btnRect.width;
        let bubbleX = newX - bw - 10;
        if (bubbleX < margin) bubbleX = newX + btnW + 10;
        let bubbleY = newY + btnH / 2 - bh / 2;
        bubbleY = Math.max(margin, Math.min(bubbleY, vh - bh - margin));
        messageBubble.style.position = "fixed";
        messageBubble.style.left = bubbleX + "px";
        messageBubble.style.top = bubbleY + "px";
        messageBubble.style.bottom = "auto";
        messageBubble.style.right = "auto";
      }
    }

    function stopDrag(e) {
      if (e.pointerId !== activePointerId) return;
      btnElement.removeEventListener("pointermove", drag);
      btnElement.removeEventListener("pointerup", stopDrag);
      btnElement.removeEventListener("pointercancel", stopDrag);
      if (isDragging) {
        isDragging = false;
        btnElement.style.transition = "";
        btnElement.classList.remove("dragging");
        document.body.style.userSelect = "";
        document.body.style.webkitUserSelect = "";
      }
      activePointerId = null;
    }
  }
  // Position the widget panel adjacent to the trigger button, wherever it was dragged.
  function positionWidgetNearTrigger() {
    if (!triggerBtn || !widgetContainer) return;
    const btnRect = triggerBtn.getBoundingClientRect();
    if (btnRect.width === 0 && btnRect.height === 0) return;

    const vw = document.documentElement.clientWidth;
    const vh = window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight;
    // Read safe-area-inset-bottom via a temporary sentinel element
    let safeBottom = 0;
    try {
      const sab = document.createElement('div');
      sab.style.cssText = 'position:fixed;bottom:0;left:0;width:1px;height:env(safe-area-inset-bottom,0px);pointer-events:none;opacity:0;';
      document.body.appendChild(sab);
      safeBottom = sab.getBoundingClientRect().height || 0;
      document.body.removeChild(sab);
    } catch (e) {}
    const margin = 10;
    const widgetWidth = Math.min(380, vw - 2 * margin);
    // Maximum height the widget is ever allowed to be — call view gets more room
    const isCallView = currentView === "call";
    const maxWidgetHeight = Math.min(isCallView ? 720 : 550, vh - 2 * margin - safeBottom);

    // Horizontal: center over trigger, clamped to viewport edges
    let left = btnRect.left + btnRect.width / 2 - widgetWidth / 2;
    left = Math.max(margin, Math.min(left, vw - widgetWidth - margin));

    const spaceAbove = btnRect.top - margin;
    const spaceBelow = vh - btnRect.bottom - margin;

    widgetContainer.style.position = "fixed";
    widgetContainer.style.left = left + "px";
    widgetContainer.style.right = "auto";
    // maxHeight is fixed — never clamped to available space (avoids clipping)
    widgetContainer.style.maxHeight = maxWidgetHeight + "px";

    if (spaceAbove >= maxWidgetHeight || spaceAbove >= spaceBelow) {
      // Open ABOVE: use 'bottom' so the widget bottom edge is always flush
      // just above the trigger top — no gap regardless of actual widget height.
      widgetContainer.style.bottom = (vh - btnRect.top + margin) + "px";
      widgetContainer.style.top = "auto";
    } else {
      // Open BELOW: use 'top' so the widget top is flush below the trigger bottom.
      widgetContainer.style.top = (btnRect.bottom + margin) + "px";
      widgetContainer.style.bottom = "auto";
    }
  }

  function createWidgetUI() {
    triggerBtn = document.createElement("button");
    triggerBtn.className = "shivai-trigger";

    // Fetch company info to check for trigger button image
    const triggerCompanyInfo = getCompanyInfo();
    const triggerName = triggerCompanyInfo.name || triggerCompanyInfo.agentName || "ShivAi";
    const triggerSubtitle = "AI Assistant";
    const triggerAvatarSrc = triggerCompanyInfo.triggerButtonImage || triggerCompanyInfo.logo || "";
    const initial = (triggerName || "S").trim().charAt(0).toUpperCase();

    const avatarMarkup = triggerAvatarSrc
      ? `<img class="shivai-trigger-avatar" src="${triggerAvatarSrc}" alt="${triggerName}" />`
      : `<div class="shivai-trigger-avatar shivai-trigger-avatar--fallback">${initial}</div>`;

    triggerBtn.innerHTML = `
      <div class="shivai-trigger-avatar-wrap">
        ${avatarMarkup}
      </div>
      <div class="shivai-trigger-info">
        <div class="shivai-trigger-title">${triggerName}</div>
        <div class="shivai-trigger-subtitle">${triggerSubtitle}</div>
      </div>
      <div class="shivai-trigger-call-btn" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
      </div>
    `;
    triggerBtn.setAttribute("aria-label", `Open ${triggerName} Assistant`);
    widgetContainer = document.createElement("div");
    widgetContainer.className = "shivai-widget";
    landingView = document.createElement("div");
    landingView.className = "landing-view";
    
    // Get company info for dynamic content
    const companyInfo = getCompanyInfo();
    _wlog("🏢 Using company info:", companyInfo);
    
    landingView.innerHTML = `
      <div class="shivai-status-bar">
        <span class="shivai-status-time" id="shivai-status-time-landing">--:--</span>
        <span class="shivai-status-network" id="shivai-status-network-landing">
          <svg class="shivai-status-signal" width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><rect x="0" y="7" width="2.5" height="4" rx="0.5"/><rect x="3.5" y="5" width="2.5" height="6" rx="0.5"/><rect x="7" y="3" width="2.5" height="8" rx="0.5"/><rect x="10.5" y="0" width="2.5" height="11" rx="0.5"/></svg>
          <button class="widget-close status-close" aria-label="Close widget">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
          </button>
        </span>
      </div>
      <div class="landing-content">
        <h2 class="landing-headline">Connect with your AI Employee</h2>
        <div class="landing-agent-card">
          <div class="landing-agent-avatar">
            ${companyInfo.logo
              ? `<img src="${companyInfo.logo}" alt="${companyInfo.name}" />`
              : `<div class="landing-agent-avatar-fallback">${(companyInfo.name||'S').trim().charAt(0).toUpperCase()}</div>`}
          </div>
          <div class="landing-agent-info">
            <div class="landing-agent-name">${companyInfo.name}</div>
            <div class="landing-agent-desc">${companyInfo.description}${companyInfo.description && !companyInfo.description.endsWith('.') ? '.' : ''}</div>
          </div>
        </div>
        <div class="landing-lang-carousel">
          <button type="button" class="landing-lang-arrow landing-lang-arrow-left" id="shivai-lang-prev" aria-label="Previous languages">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div class="landing-lang-grid" id="shivai-lang-grid"></div>
          <button type="button" class="landing-lang-arrow landing-lang-arrow-right" id="shivai-lang-next" aria-label="Next languages">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
        <select id="shivai-language-landing" class="landing-lang-hidden-select" aria-hidden="true"></select>
        <div id="landing-action-area"></div>
        <button class="landing-alt-btn landing-alt-btn-soon" disabled aria-disabled="true">Chat with AI Employee <span class="landing-soon-badge">Coming soon</span></button>
      </div>
      <div class="widget-footer landing-footer">
        <div class="footer-text">
          <span>Powered by</span>
          <a href="https://callshivai.com" target="_blank" rel="noopener noreferrer" class="footer-shivai-link">ShivAI</a>
        </div>
      </div>
    `;
    callView = document.createElement("div");
    callView.className = "call-view";
    callView.style.display = "none";
    
    // Get company info for dynamic content
    const callCompanyInfo = getCompanyInfo();
    _wlog("📞 Using company info for call view:", callCompanyInfo);
    
    const callBgUrl = callCompanyInfo.triggerButtonImage || callCompanyInfo.logo || "";
    const visualizerBarsHtml = Array.from({ length: 64 }, (_, i) => {
      const t = i / 63; // 0 → 1
      // Rainbow hue cycle: cyan → blue → purple → pink → red → orange → yellow-green → cyan
      const hue = Math.round(180 + t * 280) % 360;
      const sat = 78;
      const light = 60;
      const delay = (i * 0.025).toFixed(2);
      // Envelope: short at edges, tall in middle (sine curve)
      const envelope = Math.sin(t * Math.PI);
      const scale = (0.25 + envelope * 0.75).toFixed(2);
      return `<span class="visualizer-bar" style="--bar-color:hsl(${hue},${sat}%,${light}%); --bar-scale:${scale}; animation-delay:${delay}s;"></span>`;
    }).join('');
    callView.innerHTML = `
    <div class="call-bg-photo" id="call-bg-photo"${callBgUrl ? ` style="background-image:url('${callBgUrl}')"` : ''}></div>
    <div class="call-bg-tint"></div>
    <div class="shivai-status-bar call-status-bar">
      <span class="shivai-status-time" id="shivai-status-time-call">--:--</span>
      <span class="shivai-status-network" id="shivai-status-network-call">
        <svg class="shivai-status-signal" width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><rect x="0" y="7" width="2.5" height="4" rx="0.5"/><rect x="3.5" y="5" width="2.5" height="6" rx="0.5"/><rect x="7" y="3" width="2.5" height="8" rx="0.5"/><rect x="10.5" y="0" width="2.5" height="11" rx="0.5"/></svg>
        <button class="widget-close status-close" aria-label="Close widget">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
        </button>
      </span>
    </div>
    <div class="call-overlay" id="call-visualizer">
      <div class="call-header-bar">
        <button class="call-back-btn" id="back-btn" aria-label="Back to landing">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="call-title">
          <span class="call-title-prefix">AI Employee:</span>
          <span class="call-title-lang" id="call-language-label">English</span>
        </div>
      </div>

      <div class="call-visualizer-zone">
        <div class="siri-wave-container" id="siri-wave-container"></div>
      </div>

      <div class="call-transcript-box">
        <div class="transcript-header">
          <span class="transcript-timer" id="call-timer">00:00</span>
          <span class="transcript-status" id="shivai-status">
            <span class="status-text">Online</span>
          </span>
        </div>
        <div class="messages-container" id="shivai-messages">
      <!-- Connecting Animation (shown during call initialization) -->
      <div class="connecting-state" style="display: none;">
        <div class="connecting-animation">
          <div class="call-icon-wrapper">
            <svg class="call-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </div>
          <div class="connecting-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
          <div class="ai-icon-wrapper">
            <svg class="ai-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2"></rect>
              <circle cx="12" cy="5" r="2"></circle>
              <path d="M12 7v4"></path>
              <line x1="8" y1="16" x2="8" y2="16"></line>
              <line x1="16" y1="16" x2="16" y2="16"></line>
            </svg>
          </div>
        </div>
        <div class="connecting-text">Connecting to AI Assistant...</div>
      </div>
      <!-- Empty State (shown when connected but no messages) -->
      <div class="empty-state">
      <div class="empty-state-icon">👋</div>
      <div class="empty-state-text">Start a conversation to see transcripts here</div>
      </div>
      </div>
      </div>

      <!-- Bottom input bar (hidden until the call is live) -->
      <div class="message-input-container hidden">
        <div class="input-field-container">
          <input type="text" id="shivai-message-input" class="message-input" placeholder="Type your message" />
          <button id="shivai-send-btn" class="send-btn" title="Send Message" style="display: none;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 2L11 13"></path>
              <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
            </svg>
          </button>
          <button id="shivai-attach-btn" class="attach-btn" title="Attach document (.pdf, .docx, .doc, .txt, .md, .csv)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Simplified Attachment Menu Popup -->
      <div id="shivai-attachment-menu" class="attachment-menu" style="position: absolute !important; bottom: 70px !important; left: 16px !important; padding: 8px !important; display: none !important; z-index: 1000 !important; min-width: 180px !important;">
        
        <div class="attachment-option" id="shivai-attach-image" style="display: flex !important; align-items: center !important; padding: 12px !important; cursor: pointer !important; border-radius: 8px !important; transition: background 0.2s ease !important;">
          <div style="width: 36px !important; height: 36px !important; border-radius: 50% !important; background: #7c3aed !important; display: flex !important; align-items: center !important; justify-content: center !important; margin-right: 12px !important;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="9" cy="9" r="2"></circle>
              <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
            </svg>
          </div>
          <span style="font-size: 14px !important; color: #f5f5f7 !important; font-weight: 500 !important;">Photos & Videos</span>
        </div>

        <div class="attachment-option" id="shivai-attach-document" style="display: flex !important; align-items: center !important; padding: 12px !important; cursor: pointer !important; border-radius: 8px !important; transition: background 0.2s ease !important;">
          <div style="width: 36px !important; height: 36px !important; border-radius: 50% !important; background: #0ea5e9 !important; display: flex !important; align-items: center !important; justify-content: center !important; margin-right: 12px !important;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
          </div>
          <span style="font-size: 14px !important; color: #f5f5f7 !important; font-weight: 500 !important;">Documents</span>
        </div>
        
      </div>
      
      <div class="call-controls-bar">
        <div class="call-control-item">
          <button class="control-btn-icon mute" id="shivai-mute" title="Mute Microphone">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
          <span class="call-control-label">Mute</span>
        </div>
        <div class="call-control-item end-call-item">
          <button class="end-call-btn control-btn-icon connect" id="shivai-connect" title="Start Call">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </button>
        </div>
        <div class="call-control-item">
          <button class="control-btn-icon keypad" id="shivai-keypad" title="Open Keypad">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="5" cy="5" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="19" cy="5" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="19" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
              <circle cx="19" cy="19" r="1"></circle>
            </svg>
          </button>
          <span class="call-control-label">Keypad</span>
        </div>
      </div>
    </div>
    <input type="file" id="shivai-file-input" accept=".pdf,.docx,.doc,.txt,.md,.csv" style="display: none !important;" multiple>
    <select id="shivai-language" class="call-hidden-select" aria-hidden="true" style="display:none !important; position:absolute; left:-9999px;"></select>
    `;
    widgetContainer.appendChild(landingView);
    widgetContainer.appendChild(callView);
    addWidgetStyles();
    document.body.appendChild(triggerBtn);
    document.body.appendChild(widgetContainer);
    makeWidgetDraggable(widgetContainer);
    makeTriggerBtnDraggable(triggerBtn);

    // Live message bubble disabled — trigger pill already communicates intent
    startStatusBarUpdates();
    statusDiv = document.getElementById("shivai-status");
    connectBtn = document.getElementById("shivai-connect");
    messagesDiv = document.getElementById("shivai-messages");
    messageInputContainer = document.querySelector(".message-input-container");
    clearBtn = document.getElementById("shivai-clear");
    muteBtn = document.getElementById("shivai-mute");
    visualizerBars = document.querySelectorAll(".visualizer-bar");
    languageSelect = document.getElementById("shivai-language");
    callTimerElement = document.getElementById("call-timer");

    // Use setTimeout to ensure DOM is fully loaded
    setTimeout(() => {
      messageInputContainer = document.querySelector(
        ".message-input-container"
      );
      // Hide message interface initially (when not connected)
      hideMessageInterface();
      updateLandingViewBasedOnStatus();
    }, 100);
  }
  
  function updateLandingViewBasedOnStatus() {
    const actionArea = document.getElementById('landing-action-area');
    const privacyText = document.querySelector('.privacy-text');
    if (!actionArea) return;
    
    if (agentStatus.active) {
      // Agent is active - show Start Call button
      actionArea.innerHTML = `
        <button class="start-call-btn" id="start-call-btn">
          <span class="start-call-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="2" width="6" height="13" rx="3"></rect>
              <path d="M5 11a7 7 0 0 0 14 0"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
              <line x1="8" y1="22" x2="16" y2="22"></line>
            </svg>
          </span>
          <span class="start-call-label">Start Call</span>
        </button>
      `;
      
      // Re-attach event listener to the new button
      const startCallBtn = document.getElementById('start-call-btn');
      if (startCallBtn) {
        startCallBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          const landingLanguageSelect = document.getElementById(
            "shivai-language-landing"
          );
          if (landingLanguageSelect && languageSelect) {
            languageSelect.value = landingLanguageSelect.value;
          }
          switchToCallView();
          await handleConnectClick(e);
        });
      }
      
      // Show privacy text when agent is active
      if (privacyText) {
        privacyText.style.display = 'block';
      }
    } else {
      // Show inactive/maintenance message
      actionArea.innerHTML = `
        <div class="agent-inactive-message" style="
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,59,48,0.18);
          border-radius: 14px;
          padding: 14px 16px;
          margin: 8px 0;
          text-align: center;
          box-shadow: 0 2px 8px -2px rgba(70,110,200,0.18);
        ">
          <div style="font-size: 14px; font-weight: 600; color: #0d1117; margin-bottom: 4px;">
            Our AI Employee is currently offline.
          </div>
          <div style="font-size: 13px; color: #6b7280; line-height: 1.4;">
            We're getting things ready and will be back shortly to assist you.
          </div>
        </div>
      `;
      
      // Hide privacy text when agent is not active
      if (privacyText) {
        privacyText.style.display = 'none';
      }
    }

    setDefaultLanguage();
  }
  function setDefaultLanguage() {
    const langToLabel = {
      "en": "English", "en-us": "English (US)", "en-gb": "English (UK)",
      "es": "Spanish", "fr": "French", "de": "German", "pt": "Portuguese",
      "ar": "Arabic", "ja": "Japanese", "ko": "Korean", "zh": "Chinese",
      "th": "Thai", "id": "Indonesian", "ru": "Russian", "it": "Italian",
      "nl": "Dutch", "pl": "Polish", "sv": "Swedish", "da": "Danish",
      "nb": "Norwegian", "fi": "Finnish", "tr": "Turkish", "uk": "Ukrainian",
      "cs": "Czech", "ro": "Romanian", "hu": "Hungarian", "bg": "Bulgarian",
      "el": "Greek", "he": "Hebrew", "vi": "Vietnamese", "hr": "Croatian",
      "sr": "Serbian", "sk": "Slovak", "sl": "Slovenian", "et": "Estonian",
      "lv": "Latvian", "lt": "Lithuanian",
      "en-in": "Indian English", "hi": "Hindi (हिन्दी)", "ta": "Tamil (தமிழ்)", "te": "Telugu (తెలుగు)",
      "mr": "Marathi (मराठी)", "bn": "Bengali (বাংলা)", "gu": "Gujarati (ગુજરાતી)", "kn": "Kannada (ಕನ್ನಡ)",
      "ml": "Malayalam (മലയാളം)", "pa": "Punjabi (ਪੰਜਾਬੀ)",
    };
    const langToCountry = {
      "en": "us", "en-us": "us", "en-gb": "gb", "en-in": "in",
      "es": "es", "fr": "fr", "de": "de", "pt": "pt", "it": "it",
      "ru": "ru", "nl": "nl", "pl": "pl", "sv": "se", "da": "dk",
      "nb": "no", "fi": "fi", "tr": "tr", "uk": "ua", "cs": "cz",
      "ro": "ro", "hu": "hu", "bg": "bg", "el": "gr", "he": "il",
      "vi": "vn", "hr": "hr", "sr": "rs", "sk": "sk", "sl": "si",
      "et": "ee", "lv": "lv", "lt": "lt", "th": "th", "id": "id",
      "ar": "sa", "ja": "jp", "ko": "kr", "zh": "cn",
      "hi": "in", "ta": "in", "te": "in", "mr": "in", "bn": "bd",
      "gu": "in", "kn": "in", "ml": "in", "pa": "in",
    };
    const globeSvg = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><radialGradient id="earthOcean" cx="35%" cy="32%" r="80%"><stop offset="0%" stop-color="#5fb6ff"/><stop offset="60%" stop-color="#0a84ff"/><stop offset="100%" stop-color="#0050b8"/></radialGradient></defs><circle cx="32" cy="32" r="30" fill="url(#earthOcean)"/><path fill="#34c759" d="M16 18c2-1.5 4.5-2 7-1.5 2 .5 3.5 2 4.5 4 .8 1.7 1 3.5 2 5 1.2 1.8 3.5 2.4 5.5 2 1.6-.3 2.8-1.6 3-3.2.1-1.4-.5-2.7-1.4-3.7-1-1.2-2.3-2.2-3-3.5-.5-1-.4-2.4.4-3.3.3-.4.7-.7 1.2-.9 5 1.8 8.7 6.2 9.6 11.4-1-.4-2-.7-3-.5-1.4.3-2.5 1.4-3.3 2.6-1.4 2.3-1.9 5-3.6 7.2-1.6 2-4.4 3-6.6 1.9-1.6-.8-2.6-2.5-3-4.2-.4-2-.1-4.1-1.1-5.9-1-1.7-3-2.6-4.9-2.7-1.5-.1-3.1.4-4.4 1.3-1 .7-1.9 1.7-3 2.2-1 .5-2.3.5-3.1-.3-.5-.4-.7-1-.8-1.6-.3-2 .6-4.1 1.9-5.7 1.4-1.7 3.3-2.9 5.1-3.6zM41 38c1.6-.6 3.5-.4 4.8.8 1 .9 1.5 2.3 1.7 3.6.1 1-.1 2.2-.9 2.9-.7.7-1.8.8-2.7.4-1-.4-1.7-1.4-1.9-2.5-.2-.9-.1-1.9-.5-2.7-.4-.8-1.3-1.3-2.1-1.4.5-.5 1-.9 1.6-1.1z"/><path fill="#34c759" d="M23 38c1.6-.4 3.5.1 4.5 1.4 1 1.3 1.1 3.2.4 4.7-.7 1.5-2.2 2.6-3.9 2.7-1.7.1-3.4-.8-4.3-2.2-1-1.5-1-3.7.1-5.1.7-.9 1.8-1.4 2.9-1.5z"/></svg>`;
    const flagMarkup = (key) => {
      if (key === 'multilingual') {
        return `<span class="landing-lang-flag-globe">${globeSvg}</span>`;
      }
      const cc = langToCountry[key];
      if (!cc) return `<span class="landing-lang-flag-globe">${globeSvg}</span>`;
      return `<img class="landing-lang-flag-img" src="https://flagcdn.com/w80/${cc}.png" srcset="https://flagcdn.com/w160/${cc}.png 2x" alt="" loading="lazy" />`;
    };

    function buildOptions(selectEl, langArray) {
      if (!selectEl || !Array.isArray(langArray) || langArray.length === 0) return;
      selectEl.innerHTML = '';
      const hasMulti = langArray.some(c => String(c).toLowerCase() === 'multilingual');
      if (hasMulti) {
        const opt = document.createElement('option');
        opt.value = 'multilingual';
        opt.textContent = 'Multilingual';
        selectEl.appendChild(opt);
      }
      langArray.forEach(code => {
        const key = String(code).toLowerCase();
        if (key === 'multilingual') return;
        const label = langToLabel[key] || code;
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = label;
        selectEl.appendChild(opt);
      });
    }

    function wireLangCarousel(gridEl) {
      const prevBtn = document.getElementById('shivai-lang-prev');
      const nextBtn = document.getElementById('shivai-lang-next');
      if (!prevBtn || !nextBtn || !gridEl) return;
      const scrollByPair = (dir) => {
        const card = gridEl.querySelector('.landing-lang-card');
        const cardWidth = card ? card.getBoundingClientRect().width : 120;
        const gap = 10;
        const pair = (cardWidth + gap) * 2;
        gridEl.scrollBy({ left: dir * pair, behavior: 'smooth' });
      };
      const updateArrows = () => {
        const max = gridEl.scrollWidth - gridEl.clientWidth - 1;
        prevBtn.disabled = gridEl.scrollLeft <= 2;
        nextBtn.disabled = gridEl.scrollLeft >= max;
      };
      prevBtn.onclick = () => scrollByPair(-1);
      nextBtn.onclick = () => scrollByPair(1);
      gridEl.addEventListener('scroll', updateArrows, { passive: true });
      window.addEventListener('resize', updateArrows);
      setTimeout(updateArrows, 60);
    }

    function buildLangCards(gridEl, hiddenSelectEl, langArray) {
      if (!gridEl || !Array.isArray(langArray) || langArray.length === 0) return;
      gridEl.innerHTML = '';
      const ordered = [];
      const hasMulti = langArray.some(c => String(c).toLowerCase() === 'multilingual');
      if (hasMulti) ordered.push('multilingual');
      langArray.forEach(code => {
        const key = String(code).toLowerCase();
        if (key !== 'multilingual' && !ordered.includes(key)) ordered.push(key);
      });
      ordered.forEach(key => {
        const label = key === 'multilingual' ? 'Multilingual' : (langToLabel[key] || key);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'landing-lang-card';
        btn.setAttribute('data-lang', key);
        btn.innerHTML = `
          <span class="landing-lang-flag">${flagMarkup(key)}</span>
          <span class="landing-lang-name">${label}</span>
        `;
        btn.addEventListener('click', () => {
          if (hiddenSelectEl) hiddenSelectEl.value = key;
          gridEl.querySelectorAll('.landing-lang-card').forEach(c => c.classList.remove('selected'));
          btn.classList.add('selected');
        });
        gridEl.appendChild(btn);
      });
    }

    const langArray = Array.isArray(agentLanguage)
      ? agentLanguage
      : (agentLanguage ? [agentLanguage] : null);

    if (langArray && langArray.length > 0) {
      if (languageSelect) buildOptions(languageSelect, langArray);
      const landingLanguageSelect = document.getElementById('shivai-language-landing');
      const landingLangGrid = document.getElementById('shivai-lang-grid');
      if (landingLanguageSelect) buildOptions(landingLanguageSelect, langArray);
      if (landingLangGrid) {
        buildLangCards(landingLangGrid, landingLanguageSelect, langArray);
        wireLangCarousel(landingLangGrid);
      }
    }

    let defaultLang = null;
    const scriptTags = document.getElementsByTagName('script');
    for (let i = scriptTags.length - 1; i >= 0; i--) {
      const s = scriptTags[i];
      if (s.src && (s.src.includes('/widget2.js') || s.src.includes('/widget.js') || s.src.includes('/widget3.js') || s.src.includes('/widget4.js'))) {
        try {
          const p = new URL(s.src).searchParams.get('language');
          if (p) { defaultLang = String(p).toLowerCase(); break; }
        } catch (e) {}
      }
    }
    if (!defaultLang && langArray && langArray.length > 0) {
      const hasMulti = langArray.some(c => String(c).toLowerCase() === 'multilingual');
      defaultLang = hasMulti ? 'multilingual' : String(langArray[0]).toLowerCase();
    }

    _wlog(`🌐 Default language: ${defaultLang}`);

    if (defaultLang) {
      if (languageSelect) languageSelect.value = defaultLang;
      const landingLanguageSelect = document.getElementById('shivai-language-landing');
      if (landingLanguageSelect) landingLanguageSelect.value = defaultLang;
      const landingLangGrid = document.getElementById('shivai-lang-grid');
      if (landingLangGrid) {
        landingLangGrid.querySelectorAll('.landing-lang-card').forEach(c => c.classList.remove('selected'));
        const sel = landingLangGrid.querySelector(`.landing-lang-card[data-lang="${defaultLang}"]`);
        if (sel) sel.classList.add('selected');
      }
    }
  }

  // Functions to show/hide message interface based on connection state
  function showMessageInterface() {
    _wlog("🔍 Attempting to show message interface...");

    // Try multiple ways to find the message interface
    const container =
      messageInputContainer ||
      document.querySelector(".message-input-container");

    if (container) {
      _wlog("📝 Container found, removing hidden class");
      container.classList.remove("hidden");

      // Clear any inline styles that might be hiding it
      container.style.display = "";
      container.style.visibility = "";
      container.style.opacity = "";

      // Reset input field and hide send button initially
      const messageInput = document.getElementById("shivai-message-input");
      const sendBtn = document.getElementById("shivai-send-btn");

      if (messageInput) {
        messageInput.value = ""; // Clear any existing text
      }
      if (sendBtn) {
        sendBtn.style.setProperty('display', 'none', 'important'); // Hide send button initially
        sendBtn.style.setProperty('visibility', 'hidden', 'important');
      }

      _wlog("📝 Message interface shown - classes:", container.className);
    } else {
      console.warn("⚠️ Message input container not found when showing");
    }
  }

  function hideMessageInterface() {
    _wlog("🔍 Attempting to hide message interface...");

    // Try multiple ways to find the message interface
    const container =
      messageInputContainer ||
      document.querySelector(".message-input-container");

    if (container) {
      _wlog("📝 Container found, adding hidden class");
      container.classList.add("hidden");

      // Also force with inline style as backup
      container.style.display = "none";
      container.style.visibility = "hidden";
      container.style.opacity = "0";

      _wlog(
        "📝 Message interface hidden - classes:",
        container.className
      );
    } else {
      console.warn("⚠️ Message input container not found when hiding");
    }

    // Also hide by ID as additional backup
    const containerById = document.querySelector(
      '[class*="message-input-container"]'
    );
    if (containerById) {
      containerById.style.display = "none";
      _wlog("📝 Backup hiding by attribute selector applied");
    }
  }

  // ───────── SiriWave integration ─────────
  let siriWave = null;
  let siriWaveCurrentSpeaker = null;
  let siriWaveLoaded = false;

  function loadSiriWaveScript() {
    return new Promise((resolve, reject) => {
      if (typeof SiriWave !== "undefined") { siriWaveLoaded = true; resolve(); return; }
      if (siriWaveLoaded) { resolve(); return; }
      const existing = document.querySelector('script[data-siriwave]');
      if (existing) {
        existing.addEventListener("load", () => { siriWaveLoaded = true; resolve(); });
        existing.addEventListener("error", reject);
        return;
      }
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/siriwave/dist/siriwave.umd.min.js";
      s.async = true;
      s.setAttribute("data-siriwave", "1");
      s.onload = () => { siriWaveLoaded = true; resolve(); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function setupSiriWave(speaker) {
    // speaker: 'user' | 'ai' | 'idle'
    if (typeof SiriWave === "undefined") return;
    const container = document.getElementById("siri-wave-container");
    if (!container) return;
    if (speaker === siriWaveCurrentSpeaker && siriWave) {
      // Just nudge amplitude
      try { siriWave.setAmplitude(speaker === "idle" ? 0.06 : 3.5); } catch (e) {}
      return;
    }
    siriWaveCurrentSpeaker = speaker;

    if (siriWave) {
      try { siriWave.dispose(); } catch (e) {}
      siriWave = null;
    }
    container.innerHTML = "";

    const rect = container.getBoundingClientRect();
    const w = Math.max(260, Math.floor(rect.width || 320));
    const h = 56;

    let curves, amp, speed;
    if (speaker === "user") {
      // Cool blue family
      curves = [
        { color: "10, 132, 255", supportLine: true },
        { color: "94, 162, 255" },
        { color: "150, 200, 255" }
      ];
      amp = 3.5;
      speed = 0.22;
    } else if (speaker === "ai") {
      // Purple → magenta
      curves = [
        { color: "191, 90, 242", supportLine: true },
        { color: "232, 121, 249" },
        { color: "240, 90, 180" }
      ];
      amp = 3.5;
      speed = 0.22;
    } else {
      // Idle — flat line, minimal movement
      curves = [
        { color: "148, 163, 184", supportLine: true },
        { color: "180, 190, 200" },
        { color: "210, 218, 226" }
      ];
      amp = 0.06;
      speed = 0.06;
    }

    try {
      siriWave = new SiriWave({
        container: container,
        width: w,
        height: h,
        style: "ios9",
        amplitude: amp,
        speed: speed,
        autostart: true,
        curveDefinition: curves
      });
    } catch (err) {
      console.warn("SiriWave init failed:", err);
    }
  }

  function disposeSiriWave() {
    if (siriWave) {
      try { siriWave.dispose(); } catch (e) {}
      siriWave = null;
    }
    siriWaveCurrentSpeaker = null;
  }

  // Live time + network indicators for status bar
  let statusBarTimer = null;
  function startStatusBarUpdates() {
    const renderTime = () => {
      const timeEls = document.querySelectorAll(".shivai-status-time");
      if (!timeEls.length) return;
      const now = new Date();
      let h = now.getHours();
      const m = now.getMinutes().toString().padStart(2, "0");
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      const text = `${h}:${m} ${ampm}`;
      timeEls.forEach((el) => { el.textContent = text; });
    };
    const renderNetwork = () => {
      const networkEls = document.querySelectorAll(".shivai-status-network");
      const online = navigator.onLine;
      networkEls.forEach((el) => {
        el.classList.toggle("offline", !online);
        el.classList.toggle("online", online);
      });
    };
    const renderBattery = (level, charging) => {
      const levelEls = document.querySelectorAll(".shivai-status-battery-level");
      const shells = document.querySelectorAll(".shivai-status-battery");
      const pct = Math.max(0, Math.min(100, Math.round(level * 100)));
      levelEls.forEach((el) => { el.style.width = pct + "%"; });
      shells.forEach((el) => {
        el.classList.toggle("low", pct <= 20 && !charging);
        el.classList.toggle("charging", !!charging);
      });
    };
    renderTime();
    renderNetwork();
    if (navigator.getBattery) {
      navigator.getBattery().then((bat) => {
        renderBattery(bat.level, bat.charging);
        bat.addEventListener("levelchange", () => renderBattery(bat.level, bat.charging));
        bat.addEventListener("chargingchange", () => renderBattery(bat.level, bat.charging));
      }).catch(() => renderBattery(0.85, false));
    } else {
      renderBattery(0.85, false);
    }
    if (statusBarTimer) clearInterval(statusBarTimer);
    statusBarTimer = setInterval(renderTime, 20000);
    window.addEventListener("online", renderNetwork);
    window.addEventListener("offline", renderNetwork);
  }

  function createLiveMessageBubble() {
    messageBubble = document.createElement("div");
    messageBubble.className = "shivai-message-bubble";
    const isMobile = window.innerWidth <= 768;
    const bubbleBottom = isMobile
      ? window.innerWidth <= 420
        ? "22px"
        : "26px"
      : "30px";
    const bubbleRight = isMobile
      ? window.innerWidth <= 420
        ? "70px"
        : "80px"
      : "90px";
    messageBubble.style.cssText = `
      position: fixed;
      bottom: ${bubbleBottom};
      right: ${bubbleRight};
      transform: translateY(0);
      background-color: #ffffff;
      color: #374151;
      padding: 8px 12px;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      z-index: 9999;
      border: 1px solid #e5e7eb;
      min-width: 60px;
      max-width: 250px;
      width: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      cursor: pointer;
    `;
    const bubbleTail = document.createElement("div");
    bubbleTail.style.cssText = `
      position: absolute;
      right: -6px;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-top: 6px solid transparent;
      border-bottom: 6px solid transparent;
      border-left: 6px solid #ffffff;
    `;
    messageBubble.appendChild(bubbleTail);
    document.body.appendChild(messageBubble);
    messageBubble.addEventListener("click", () => {
      toggleWidget();
    });
    messageBubble.addEventListener("mouseover", () => {
      messageBubble.style.transform = "translateY(0) scale(1.05)";
      messageBubble.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.2)";
    });
    messageBubble.addEventListener("mouseout", () => {
      messageBubble.style.transform = "translateY(0) scale(1)";
      messageBubble.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.15)";
    });
    startLiveMessages();
  }
  function startLiveMessages() {
    setTimeout(() => {
      showNextMessage();
    }, 3000);
    messageInterval = setInterval(() => {
      showNextMessage();
    }, 8000);
  }
  function showNextMessage() {
    if (!isWidgetOpen && messageBubble) {
      const message = liveMessages[currentMessageIndex];
      messageBubble.innerHTML = "";
      const bubbleTail = document.createElement("div");
      bubbleTail.style.cssText = `
        position: absolute;
        right: -6px;
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-top: 6px solid transparent;
        border-bottom: 6px solid transparent;
        border-left: 6px solid #ffffff;
      `;
      const messageEl = document.createElement("span");
      messageEl.style.opacity = "0";
      messageBubble.appendChild(messageEl);
      messageBubble.appendChild(bubbleTail);
      messageBubble.style.visibility = "visible";
      messageBubble.style.animation = "bubbleSlideIn 0.4s ease-out forwards";
      setTimeout(() => {
        typeMessage(message, messageEl);
      }, 400);
      setTimeout(() => {
        hideBubble();
      }, 5000);
      currentMessageIndex = (currentMessageIndex + 1) % liveMessages.length;
    }
  }
  function typeMessage(message, messageEl) {
    let i = 0;
    messageEl.textContent = "";
    messageEl.style.opacity = "1";
    const cursor = document.createElement("span");
    cursor.style.cssText = `
      opacity: 1;
      animation: typingCursor 1s infinite;
      margin-left: 2px;
    `;
    cursor.textContent = "";
    messageEl.appendChild(cursor);
    const typeInterval = setInterval(() => {
      if (i < message.length) {
        const text = message.substring(0, i + 1);
        messageEl.textContent = text;
        messageEl.appendChild(cursor);
        i++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          cursor.remove();
        }, 500);
      }
    }, 60);
  }
  function hideBubble() {
    if (messageBubble) {
      messageBubble.style.animation = "bubbleSlideOut 0.3s ease-in forwards";
      setTimeout(() => {
        messageBubble.style.visibility = "hidden";
        messageBubble.style.opacity = "0";
      }, 300);
    }
  }
  function addWidgetStyles() {
    // Get theme colors from company info
    const companyInfo = getCompanyInfo();
    const theme = companyInfo.theme || {
      primaryColor: "#4b5563",
      secondaryColor: "#ffffff",
      accentColor: "#2563eb"
    };
    
    const styles = `
      /* =====================================================
         SHIVAI WIDGET — APPLE-INSPIRED DARK PREMIUM THEME
         ===================================================== */

      /* ── Trigger Button (glass pill capsule) ── */
      .shivai-trigger {
        position: fixed;
        bottom: calc(24px + env(safe-area-inset-bottom));
        right: 24px;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 6px 12px 6px 6px;
        background: rgba(235, 238, 244, 0.88);
        -webkit-appearance: none;
        appearance: none;
        backdrop-filter: blur(60px) saturate(220%);
        -webkit-backdrop-filter: blur(60px) saturate(220%);
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.72);
        overflow: hidden;
        cursor: grab;
        touch-action: none;
        outline: none;
        -webkit-tap-highlight-color: transparent;
        z-index: 2147483647;
        color: #0d1117;
        text-align: left;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', sans-serif;
        box-shadow:
          0 24px 48px -14px rgba(70, 110, 200, 0.22),
          0 10px 28px -10px rgba(70, 110, 200, 0.18),
          0 1px 0 rgba(255,255,255,0.95) inset,
          0 0 0 1px rgba(120, 150, 220, 0.18);
        transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease;
        min-height: 70px;
        max-height: 72px;
        max-width: 280px;
        width: max-content;
      }
      .shivai-trigger:hover:not(.dragging) {
        transform: translateY(-2px);
        box-shadow:
          0 30px 56px -16px rgba(70, 110, 200, 0.28),
          0 14px 32px -10px rgba(70, 110, 200, 0.22),
          0 1px 0 rgba(255,255,255,0.95) inset,
          0 0 0 1px rgba(120, 150, 220, 0.22);
      }
      .shivai-trigger:active:not(.dragging) {
        transform: translateY(0) scale(0.985);
      }
      .shivai-trigger.dragging {
        cursor: grabbing !important;
        transform: none;
        opacity: 0.96;
        transition: none !important;
      }
      .shivai-trigger-avatar-wrap {
        width: 54px;
        height: 54px;
        border-radius: 50%;
        flex-shrink: 0;
        background: transparent !important;
        box-shadow: 0 0 0 2px rgba(255,255,255,0.95);
      }
      .shivai-trigger-avatar {
        width: 100% !important;
        height: 100% !important;
        border-radius: 50% !important;
        object-fit: cover !important;
        display: block !important;
        background: transparent !important;
        max-width: none !important;
      }
      .shivai-trigger-avatar--fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: 700;
        color: #0a84ff;
        letter-spacing: -0.02em;
        font-family: inherit;
      }
      .shivai-trigger-info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        gap: 2px;
        min-width: 0;
        flex: 1 1 auto;
        padding: 0;
        margin: 0;
        text-align: left;
      }
      .shivai-trigger-title {
        font-size: 18px;
        font-weight: 700;
        color: #0d1117;
        letter-spacing: -0.025em;
        line-height: 1.15;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 180px;
        text-align: left;
        margin: 0;
        padding: 0;
        align-self: flex-start;
        text-shadow: 0 1px 2px rgba(255,255,255,0.6);
      }
      .shivai-trigger-subtitle {
        font-size: 13px;
        color: #374151;
        font-weight: 600;
        letter-spacing: -0.01em;
        line-height: 1.2;
        white-space: nowrap;
        text-align: left;
        margin: 0;
        padding: 0;
        align-self: flex-start;
        text-shadow: 0 1px 2px rgba(255,255,255,0.5);
      }
      @keyframes triggerPulse {
        0%   { box-shadow: 0 0 0 0 rgba(75,85,99,0.55), 0 2px 8px -2px rgba(70,110,200,0.22), 0 0 0 1px rgba(120,150,220,0.18); }
        60%  { box-shadow: 0 0 0 10px rgba(75,85,99,0), 0 2px 8px -2px rgba(70,110,200,0.22), 0 0 0 1px rgba(120,150,220,0.18); }
        100% { box-shadow: 0 0 0 0 rgba(75,85,99,0), 0 2px 8px -2px rgba(70,110,200,0.22), 0 0 0 1px rgba(120,150,220,0.18); }
      }
      .shivai-trigger-call-btn {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: rgba(255,255,255,0.85);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        animation: triggerPulse 2s ease-out infinite;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: #0d1117;
        box-shadow:
          0 2px 8px -2px rgba(70, 110, 200, 0.22),
          0 0 0 1px rgba(120, 150, 220, 0.18);
        transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
      }
      .shivai-trigger:hover:not(.dragging) .shivai-trigger-call-btn {
        background: #0a84ff;
        color: #ffffff;
        animation-play-state: paused;
        box-shadow:
          0 6px 18px -4px rgba(10,132,255,0.5),
          0 0 0 1px rgba(10,132,255,0.55);
        transform: scale(1.04);
      }

      /* ── Message Bubble ── */
      .shivai-message-bubble {
      cursor: pointer;
      background: rgba(18,18,20,0.96) !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
      color: #f5f5f7 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      letter-spacing: -0.01em !important;
      border-radius: 14px !important;
      backdrop-filter: blur(20px) !important;
      box-shadow: 0 8px 28px rgba(0,0,0,0.5) !important;
      }

      /* ── Bubble slide animations ── */
      @keyframes bubbleSlideIn {
      0%   { opacity: 0; transform: translateY(12px) scale(0.88); }
      60%  { opacity: 1; transform: translateY(-2px) scale(1.02); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes bubbleSlideOut {
      0%   { opacity: 1; transform: translateY(0) scale(1); }
      100% { opacity: 0; transform: translateY(8px) scale(0.88); }
      }
      @keyframes typingCursor {
      0%,50% { opacity: 1; } 51%,100% { opacity: 0; }
      }

      /* ── Widget Container (glass like trigger) ── */
      .shivai-widget {
      position: fixed;
      bottom: calc(92px + env(safe-area-inset-bottom));
      right: 24px;
      width: 360px;
      max-width: 360px;
      max-height: min(620px, calc(100dvh - 120px - env(safe-area-inset-bottom)));
      background: rgba(225, 230, 238, 0.62);
      border-radius: 22px;
      border: 1px solid rgba(255,255,255,0.55);
      box-shadow:
        0 32px 64px -16px rgba(70, 110, 200, 0.28),
        0 14px 32px -10px rgba(70, 110, 200, 0.18),
        0 1px 0 rgba(255,255,255,0.85) inset,
        0 0 0 1px rgba(120, 150, 220, 0.15);
      backdrop-filter: blur(40px) saturate(200%);
      -webkit-backdrop-filter: blur(40px) saturate(200%);
      z-index: 10000;
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', sans-serif;
      color: #0d1117;
      }

      /* ── Status bar (time + network) ── */
      .shivai-status-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 20px 4px;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: -0.02em;
        color: #0d1117;
        font-variant-numeric: tabular-nums;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', sans-serif;
        flex-shrink: 0;
      }
      .shivai-status-time { line-height: 1; }
      .shivai-status-network {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #0d1117;
        transition: color 0.2s ease, opacity 0.2s ease;
      }
      .shivai-status-network.offline { color: #ff3b30; opacity: 0.8; }
      .shivai-status-network svg { display: block; }
      .shivai-status-signal { color: inherit; }
      .shivai-status-wifi { color: inherit; }
      .shivai-status-battery {
        display: inline-flex;
        align-items: center;
        gap: 1px;
        margin-left: 2px;
      }
      .shivai-status-battery-shell {
        position: relative;
        width: 24px;
        height: 11px;
        border: 1px solid rgba(13,17,23,0.55);
        border-radius: 3px;
        padding: 1px;
        display: inline-block;
        box-sizing: border-box;
      }
      .shivai-status-battery-level {
        display: block;
        height: 100%;
        width: 85%;
        background: #0d1117;
        border-radius: 1.5px;
        transition: width 0.3s ease, background 0.3s ease;
      }
      .shivai-status-battery.low .shivai-status-battery-level { background: #ff3b30; }
      .shivai-status-battery.charging .shivai-status-battery-level { background: #30d158; }
      .shivai-status-battery-cap {
        display: inline-block;
        width: 2px;
        height: 5px;
        background: rgba(13,17,23,0.55);
        border-radius: 0 1px 1px 0;
      }
      .shivai-widget.active {
      display: flex;
      animation: widgetReveal 0.36s cubic-bezier(0.34,1.56,0.64,1);
      }
      @keyframes widgetReveal {
      from { opacity: 0; transform: translateY(18px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0)    scale(1);    }
      }

      /* ── Landing View ── */
      .landing-view {
      display: flex;
      flex-direction: column;
      width: 100%;
      background: transparent;
      }
      .landing-view .widget-header {
      position: relative;
      padding: 12px 20px 16px;
      background: transparent;
      border-bottom: 1px solid rgba(120, 150, 220, 0.12);
      }
      .header-content { position: relative; width: 100%; }
      .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 0;
      }
      .header-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      }
      .landing-view .widget-avatar {
      width: 52px;
      height: 52px;
      flex-shrink: 0;
      border-radius: 50%;
      background: rgba(255,255,255,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid rgba(255,255,255,0.95);
      box-shadow:
        0 4px 14px -2px rgba(70, 110, 200, 0.22),
        0 0 0 1px rgba(120, 150, 220, 0.12);
      overflow: hidden;
      padding: 0;
      }
      .landing-view .widget-avatar svg {
      width: 100%;
      height: 100%;
      fill: #0a84ff;
      }
      .landing-view .widget-title {
      font-weight: 700;
      font-size: 18px;
      color: #0d1117;
      margin: 0;
      letter-spacing: -0.025em;
      line-height: 1.2;
      }
      .landing-view .widget-subtitle {
      font-size: 12px;
      color: #6b7280;
      margin: 0;
      font-weight: 500;
      line-height: 1.4;
      letter-spacing: -0.01em;
      }

      /* ── Landing Page (screenshot match) ── */
      .landing-view {
        position: relative;
      }
      .shivai-status-bar .status-close {
        position: static !important;
        width: 22px !important;
        height: 22px !important;
        padding: 0 !important;
        margin: 0 0 0 4px !important;
        background: rgba(13,17,23,0.06) !important;
        border: none !important;
        border-radius: 50% !important;
        color: #0d1117 !important;
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: none !important;
        transition: background 0.15s ease, transform 0.15s ease;
        flex-shrink: 0;
      }
      .shivai-status-bar .status-close:hover {
        background: rgba(13,17,23,0.12) !important;
        transform: scale(1.06);
      }
      .shivai-status-bar .status-close svg { display: block; }
      .landing-content {
        padding: 10px 20px 16px;
        display: flex;
        flex-direction: column;
        gap: 18px;
        overflow-y: auto;
        flex: 1;
        scrollbar-width: none;
      }
      .landing-content::-webkit-scrollbar { display: none; }
      .landing-headline {
        font-size: 20px;
        font-weight: 700;
        color: #0d1117;
        letter-spacing: -0.025em;
        line-height: 1.2;
        margin: 10px 2px 10px;
        padding: 0;
        text-align: center;
      }
      .landing-agent-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 0;
      }
      .landing-agent-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        flex-shrink: 0;
        overflow: hidden;
        background: linear-gradient(135deg, #eef1f6 0%, #dde3ed 100%);
        border: 3px solid rgba(255,255,255,0.95);
        box-shadow:
          0 6px 18px -2px rgba(70, 110, 200, 0.28),
          0 0 0 1px rgba(120, 150, 220, 0.15);
      }
      .landing-agent-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .landing-agent-avatar-fallback {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        font-weight: 700;
        color: #0a84ff;
        letter-spacing: -0.02em;
      }
      .landing-agent-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .landing-agent-name {
        font-size: 21px;
        font-weight: 700;
        color: #0d1117;
        letter-spacing: -0.025em;
        line-height: 1.15;
      }
      .landing-agent-desc {
        font-size: 12px;
        color: #6b7280;
        line-height: 1.4;
        font-weight: 500;
        letter-spacing: -0.005em;
      }
      .landing-lang-carousel {
        display: flex;
        align-items: stretch;
        gap: 6px;
        width: auto;
        margin: 0 -14px;
      }
      .landing-lang-arrow {
        flex: 0 0 28px;
        align-self: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: rgba(255,255,255,0.7);
        border: 1px solid rgba(255,255,255,0.85);
        color: #0d1117;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        box-shadow:
          0 2px 8px -2px rgba(70, 110, 200, 0.22),
          0 0 0 1px rgba(120, 150, 220, 0.14);
        transition: background 0.15s ease, transform 0.15s cubic-bezier(0.34,1.56,0.64,1), opacity 0.15s ease, box-shadow 0.15s ease;
      }
      .landing-lang-arrow:hover:not(:disabled) {
        background: rgba(255,255,255,0.92);
        transform: scale(1.06);
        box-shadow:
          0 4px 12px -2px rgba(70, 110, 200, 0.3),
          0 0 0 1px rgba(120, 150, 220, 0.22);
      }
      .landing-lang-arrow:active:not(:disabled) { transform: scale(0.94); }
      .landing-lang-arrow:disabled {
        opacity: 0.35;
        cursor: default;
        pointer-events: none;
      }
      .landing-lang-arrow svg { display: block; }

      .landing-lang-grid {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        gap: 10px;
        overflow-x: auto;
        overflow-y: hidden;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
        scrollbar-width: none;
        padding: 6px 4px 8px;
      }
      .landing-lang-grid::-webkit-scrollbar { display: none; }
      .landing-lang-hidden-select {
        display: none !important;
      }
      .landing-lang-card {
        flex: 0 0 calc((100% - 10px) / 2);
        scroll-snap-align: start;
        min-width: 0;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 7px;
        padding: 8px 10px;
        background: rgba(255,255,255,0.65);
        border: 1px solid rgba(255,255,255,0.8);
        border-radius: 12px;
        cursor: pointer;
        font-family: inherit;
        color: #0d1117;
        transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), background 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        box-shadow:
          0 2px 8px -2px rgba(70, 110, 200, 0.18),
          0 0 0 1px rgba(120, 150, 220, 0.1);
        outline: none;
      }
      .landing-lang-card:hover {
        background: rgba(255,255,255,0.85);
        transform: translateY(-1px);
        box-shadow:
          0 6px 16px -4px rgba(70, 110, 200, 0.28),
          0 0 0 1px rgba(120, 150, 220, 0.18);
      }
      .landing-lang-card:active {
        transform: translateY(0) scale(0.98);
      }
      .landing-lang-card.selected {
        background: rgba(255,255,255,0.97);
        border-color: rgba(10, 132, 255, 0.55);
        box-shadow:
          0 6px 16px -4px rgba(10, 132, 255, 0.32),
          inset 0 0 0 2px rgba(10, 132, 255, 0.5);
      }
      .landing-lang-flag {
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        flex-shrink: 0;
      }
      .landing-lang-flag-img {
        width: 26px;
        height: 19px;
        object-fit: cover;
        border-radius: 3px;
        display: block;
        box-shadow:
          0 1px 3px rgba(0,0,0,0.18),
          0 0 0 1px rgba(0,0,0,0.06);
      }
      .landing-lang-flag-globe {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        overflow: hidden;
        box-shadow:
          0 2px 6px -1px rgba(10, 80, 184, 0.4),
          inset 0 0 0 1px rgba(255,255,255,0.4);
      }
      .landing-lang-flag-globe svg {
        width: 100%;
        height: 100%;
        display: block;
      }
      .landing-lang-name {
        font-size: 12px;
        font-weight: 600;
        color: #0d1117;
        letter-spacing: -0.015em;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .landing-alt-btn {
        display: block;
        margin: 6px auto 0;
        padding: 7px 18px;
        border-radius: 999px;
        border: 1px solid rgba(13,17,23,0.12);
        background: rgba(255,255,255,0.7);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        font-size: 12px;
        font-weight: 500;
        color: #374151;
        cursor: pointer;
        letter-spacing: -0.01em;
        transition: background 0.15s ease, border-color 0.15s ease, transform 0.12s ease;
        white-space: nowrap;
      }
      .landing-alt-btn:hover {
        background: rgba(255,255,255,0.92);
        border-color: rgba(13,17,23,0.2);
        transform: translateY(-1px);
      }
      .landing-alt-btn:active { transform: translateY(0); }
      /* Coming-soon (disabled) state for the chat button */
      .landing-alt-btn-soon {
        cursor: not-allowed;
        opacity: 0.75;
        color: #6b7280;
        display: inline-flex;
        align-items: center;
        gap: 7px;
      }
      .landing-alt-btn-soon:hover {
        background: rgba(255,255,255,0.7);
        border-color: rgba(13,17,23,0.12);
        transform: none;
      }
      .landing-soon-badge {
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: #2563eb;
        background: rgba(37,99,235,0.10);
        border: 1px solid rgba(37,99,235,0.20);
        padding: 1px 6px;
        border-radius: 999px;
        line-height: 1.4;
      }
      .landing-footer {
        text-align: center;
        background: transparent !important;
        border-top: 1px solid rgba(120, 150, 220, 0.12) !important;
        padding: 12px 20px 16px !important;
      }
      .landing-footer .footer-text {
        font-size: 12px !important;
        color: #6b7280 !important;
        gap: 4px !important;
        font-weight: 500 !important;
      }
      .footer-shivai-link {
        color: #0a84ff !important;
        text-decoration: none;
        font-weight: 700 !important;
        cursor: pointer;
        letter-spacing: -0.01em;
      }
      .footer-shivai-link:hover { color: #1a94ff !important; text-decoration: underline; text-underline-offset: 2px; }

      /* Start-call button (landing) — widget2 gray→blue gradient */
      .start-call-btn {
      width: 100%;
      padding: 12px 24px;
      border: 1px solid transparent;
      border-radius: 999px;
      font-size: 15px;
      background: linear-gradient(135deg, #4b5563 0%, #2563eb 100%);
      color: white;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      letter-spacing: -0.015em;
      transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      box-shadow:
        0 8px 22px -8px rgba(37, 99, 235, 0.5),
        0 4px 12px -4px rgba(75, 85, 99, 0.4),
        0 1px 0 rgba(255,255,255,0.18) inset;
      position: relative;
      overflow: hidden;
      margin: 4px 0 0;
      font-family: inherit;
      }
      .start-call-btn:hover {
      background: linear-gradient(135deg, #2563eb 0%, #4b5563 100%);
      transform: translateY(-1px);
      box-shadow:
        0 12px 28px -8px rgba(37, 99, 235, 0.6),
        0 6px 16px -4px rgba(75, 85, 99, 0.45),
        0 1px 0 rgba(255,255,255,0.2) inset;
      }
      .start-call-btn:active {
      transform: scale(0.985) translateY(0);
      }
      .start-call-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      }
      .start-call-label {
      letter-spacing: -0.01em;
      }
      @keyframes shine {
      0%   { left: -100%; }
      40%  { left: 100%; }
      100% { left: 100%; }
      }
      .start-call-btn::before {
      content: '';
      position: absolute;
      top: 0; left: -100%;
      width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
      animation: shine 3.5s infinite;
      }

      /* ── Privacy + Footer ── */
      .privacy-text {
      font-size: 11px;
      color: #6b7280;
      text-align: center;
      margin: 0;
      line-height: 1.5;
      }
      .privacy-link {
      color: #0a84ff;
      cursor: pointer;
      text-decoration: none;
      font-weight: 500;
      }
      .privacy-link:hover { color: #1a94ff; }
      .widget-footer {
      text-align: center;
      border-top: 1px solid rgba(120, 150, 220, 0.12) !important;
      background: transparent !important;
      padding: 10px 20px 14px !important;
      }
      .footer-text {
      font-size: 11px !important;
      color: #6b7280 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 3px !important;
      }
      .footer-text span { color: #6b7280 !important; font-weight: 500 !important; }
      .footer-logo { fill: #0a84ff !important; height: 34px !important; width: 34px !important; }
      .footer-logo .cls-1 { fill: currentColor; stroke-width: 0px; }
      .footer-logo-link { padding: 0 !important; position: relative; left: -2px; top: 0.5px; transition: opacity 0.15s; }
      .footer-logo-link:hover { opacity: 0.7; }

      /* ── Widget Body ── */
      .widget-body {
      padding: 18px 20px 14px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-y: auto;
      background: transparent;
      scrollbar-width: none;
      color: #0d1117;
      }
      .widget-body::-webkit-scrollbar { display: none; }

      /* ── Language section (landing) ── */
      .language-section-landing {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 0;
      padding: 0;
      }
      .language-label-landing {
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin: 0;
      }
      .language-select-styled-landing {
      padding: 12px 14px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.7);
      background: rgba(255,255,255,0.65);
      font-size: 14px;
      color: #0d1117;
      cursor: pointer;
      transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
      padding-right: 36px;
      appearance: none;
      -webkit-appearance: none;
      font-weight: 600;
      font-family: inherit;
      box-shadow:
        0 2px 8px -2px rgba(70, 110, 200, 0.18),
        0 0 0 1px rgba(120, 150, 220, 0.1);
      }
      .language-select-styled-landing:hover {
      border-color: rgba(255,255,255,0.9);
      background-color: rgba(255,255,255,0.8);
      }
      .language-select-styled-landing:focus {
      outline: none;
      border-color: rgba(10,132,255,0.55);
      box-shadow: 0 0 0 3px rgba(10,132,255,0.18);
      }
      .language-select-styled-landing option {
      background: #ffffff;
      color: #0d1117;
      }

      /* ── Close button ── */
      .widget-close {
      position: absolute;
      top: 0; right: 0;
      background: rgba(255,255,255,0.7);
      border: 1px solid rgba(255,255,255,0.9);
      color: #6b7280;
      font-size: 20px;
      cursor: pointer;
      width: 30px; height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.15s ease;
      font-weight: 400;
      line-height: 1;
      box-shadow: 0 2px 6px -2px rgba(70, 110, 200, 0.2);
      }
      .widget-close:hover {
      background: rgba(255,255,255,0.95);
      color: #0d1117;
      }

      /* ── Call View ── */
      .call-view {
      display: flex;
      flex-direction: column;
      width: 100%;
      background: transparent;
      position: relative;
      overflow: visible;
      }

      /* ── Call View v2: Blurred photo bg + glass controls ── */
      .call-bg-photo {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        background-color: #4a90e2;
        filter: blur(18px) saturate(120%);
        transform: scale(1.12);
        z-index: 0;
        opacity: 0.95;
      }
      .call-bg-tint {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.28) 100%);
        z-index: 1;
        pointer-events: none;
      }
      .call-status-bar {
        position: relative;
        z-index: 5;
        color: #0d1117;
      }
      .call-overlay {
        position: relative;
        z-index: 4;
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        gap: 0;
      }

      /* Header bar */
      .call-header-bar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 6px 16px 4px;
        order: 1;
        flex-shrink: 0;
      }
      .call-back-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #0d1117;
        cursor: pointer;
        flex-shrink: 0;
        backdrop-filter: blur(10px) saturate(160%);
        -webkit-backdrop-filter: blur(10px) saturate(160%);
        box-shadow: 0 2px 6px -2px rgba(0,0,0,0.15);
        transition: background 0.15s ease, transform 0.15s ease;
      }
      .call-back-btn:hover { background: rgba(255,255,255,0.85); transform: scale(1.06); }
      .call-back-btn svg { display: block; }
      .call-title {
        font-size: 15px;
        font-weight: 600;
        color: #ffffff;
        flex: 1;
        line-height: 1.25;
        letter-spacing: -0.015em;
        text-shadow:
          0 1px 3px rgba(0,0,0,0.5),
          0 0 12px rgba(0,0,0,0.35);
      }
      .call-title-prefix { font-weight: 500; opacity: 0.92; margin-right: 4px; color: #ffffff; }
      .call-title-lang { font-weight: 700; text-transform: capitalize; color: #ffffff; }
      .call-hidden-status { display: none !important; }

      /* Visualizer (SiriWave) */
      .call-visualizer-zone {
        padding: 0;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 0;
        order: 2;
        flex-shrink: 0;
        width: 100%;
      }
      .siri-wave-container {
        width: 100%;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .siri-wave-container canvas {
        display: block;
        margin: 0 auto;
        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.18));
      }
      .audio-visualizer-rainbow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1px;
        height: 32px;
        width: 100%;
        padding: 0 14px;
        overflow: hidden;
        box-sizing: border-box;
      }
      .audio-visualizer-rainbow .visualizer-bar {
        flex: 1 1 0;
        min-width: 2px;
        max-width: 3px;
        height: 4px;
        border-radius: 1.5px;
        background: var(--bar-color, #5b9bd5);
        animation: rainbowPulseV2 1.6s ease-in-out infinite;
        transform-origin: center;
        will-change: height, transform;
        transform: scaleY(var(--bar-scale, 1));
      }
      @keyframes rainbowPulseV2 {
        0%, 100% { height: 3px;  opacity: 0.65; }
        18%      { height: 20px; opacity: 1; }
        42%      { height: 6px;  opacity: 0.85; }
        62%      { height: 26px; opacity: 1; }
        82%      { height: 10px; opacity: 0.9; }
      }
      /* Transcript Box (always visible) */
      .call-transcript-box {
        order: 3;
        background: rgba(255,255,255,0.97);
        border: 1px solid rgba(255,255,255,0.7);
        border-radius: 18px;
        margin: 4px 14px 4px;
        box-shadow:
          0 6px 18px -4px rgba(0,0,0,0.18),
          0 0 0 1px rgba(120,150,220,0.1);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 120px;
        max-height: 280px;
      }
      .transcript-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 14px;
        border-bottom: 1px solid rgba(13,17,23,0.08);
        background: transparent;
        flex-shrink: 0;
      }
      .transcript-timer {
        font-size: 14px;
        font-weight: 700;
        color: #0d1117;
        font-variant-numeric: tabular-nums;
        letter-spacing: -0.01em;
      }
      /* Status (always visible inside transcript header) */
      .call-view #shivai-status,
      .transcript-status {
        display: inline-flex !important;
        align-items: center !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        letter-spacing: -0.005em !important;
        position: static !important;
        left: auto !important;
        visibility: visible !important;
        color: #30d158;
      }
      .transcript-status.connecting,
      #shivai-status.connecting { color: #d4a017 !important; }
      .transcript-status.connected,
      #shivai-status.connected { color: #0a84ff !important; }
      .transcript-status.listening,
      #shivai-status.listening { color: #30d158 !important; }
      .transcript-status.speaking,
      #shivai-status.speaking { color: #bf5af2 !important; }
      .transcript-status.disconnected,
      #shivai-status.disconnected { color: #ff3b30 !important; }
      .transcript-status .status-text,
      #shivai-status .status-text { font-size: 11px; line-height: 1; }

      /* Messages (inside transcript box) */
      .call-view .messages-container {
        flex: 1 1 auto;
        overflow-y: scroll;
        -webkit-overflow-scrolling: touch;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-height: 0;
        max-height: 220px;
        background: transparent;
        scrollbar-width: none;
      }
      .call-view .messages-container::-webkit-scrollbar { display: none; }

      .call-view .message {
        background: #f1f3f6 !important;
        color: #0d1117 !important;
        border: none !important;
        border-radius: 14px !important;
        padding: 8px 12px !important;
        max-width: 88% !important;
        box-shadow: none !important;
        font-size: 13px !important;
        line-height: 1.4 !important;
        letter-spacing: -0.005em !important;
      }
      .call-view .message.user {
        background: linear-gradient(135deg, #0a84ff 0%, #2563eb 100%) !important;
        color: #ffffff !important;
        margin-left: auto !important;
        border-bottom-right-radius: 4px !important;
      }
      .call-view .message.assistant {
        background: #f1f3f6 !important;
        margin-right: auto !important;
        border-bottom-left-radius: 4px !important;
      }
      .call-view .message-label {
        display: inline !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        margin: 0 4px 0 0 !important;
        padding: 0 !important;
        color: inherit !important;
        text-transform: none !important;
        letter-spacing: -0.005em !important;
      }
      .call-view .message-label::after { content: ":"; }
      .call-view .message.user .message-label { color: rgba(255,255,255,1) !important; }
      .call-view .message-text { display: inline !important; font-size: 13px !important; line-height: 1.42 !important; color: inherit !important; }
      .call-view .connecting-text { color: #0d1117; text-shadow: 0 1px 2px rgba(255,255,255,0.5); }
      .call-view .empty-state { color: rgba(13,17,23,0.55); }
      .call-view .empty-state-text { color: rgba(13,17,23,0.55); text-shadow: 0 1px 2px rgba(255,255,255,0.4); }

      /* Controls */
      .call-controls-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px 36px 14px;
        gap: 20px;
        order: 5;
        flex-shrink: 0;
      }
      .call-control-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }
      .call-view .control-btn-icon {
        width: 49px !important;
        height: 49px !important;
        background: rgba(255,255,255,0.95) !important;
        border: 1px solid rgba(255,255,255,0.7) !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer;
        color: #0d1117 !important;
        box-shadow: 0 4px 14px -4px rgba(0,0,0,0.22) !important;
        transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1), background 0.15s ease !important;
        animation: none !important;
        flex-shrink: 0;
        padding: 0;
      }
      .call-view .control-btn-icon svg { width: 18px; height: 18px; }
      .call-view .control-btn-icon:hover {
        background: rgba(255,255,255,1) !important;
        transform: scale(1.05);
      }
      .call-view .control-btn-icon.mute.muted {
        background: rgba(255,59,48,0.18) !important;
        color: #ff3b30 !important;
        border-color: rgba(255,59,48,0.35) !important;
      }
      .call-control-label {
        font-size: 12px;
        font-weight: 600;
        color: #0d1117;
        text-shadow: 0 1px 2px rgba(255,255,255,0.5);
        letter-spacing: -0.005em;
      }

      /* Main call action (phone icon by default, hangup when connected) */
      .call-view .end-call-btn {
        width: 77px !important;
        height: 77px !important;
        border-radius: 50% !important;
        background: linear-gradient(135deg, #4b5563 0%, #2563eb 100%) !important;
        border: none !important;
        color: #ffffff !important;
        cursor: pointer;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-shadow:
          0 10px 26px -6px rgba(37, 99, 235, 0.5),
          0 4px 12px -4px rgba(75, 85, 99, 0.4),
          inset 0 1px 0 rgba(255,255,255,0.22) !important;
        transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), background 0.2s ease, box-shadow 0.2s ease !important;
        animation: none !important;
        padding: 0;
      }
      .call-view .end-call-btn svg {
        display: block !important;
        width: 28px !important;
        height: 28px !important;
        stroke: #ffffff;
        stroke-width: 2.2;
      }
      .call-view .end-call-btn .end-call-label { display: none !important; }
      .call-view .end-call-btn:hover {
        background: linear-gradient(135deg, #2563eb 0%, #4b5563 100%) !important;
        transform: scale(1.04);
      }
      .call-view .end-call-btn:active { transform: scale(0.96); }
      /* Connected state — turn red */
      .call-view .end-call-btn.connected {
        background: #ff3b30 !important;
        box-shadow:
          0 10px 28px -6px rgba(255, 59, 48, 0.6),
          0 4px 12px -4px rgba(255, 59, 48, 0.5),
          inset 0 1px 0 rgba(255,255,255,0.25) !important;
      }
      .call-view .end-call-btn.connected:hover {
        background: #ff5546 !important;
      }

      /* Bottom input bar (Type to ShivAi) */
      .call-view .message-input-container {
        order: 4;
        align-items: center !important;
        padding: 4px 14px 4px !important;
        background: transparent !important;
        border-top: none !important;
        gap: 0 !important;
        border-radius: 0 !important;
        flex-shrink: 0;
      }
      .call-view .message-input-container:not(.hidden) {
        display: flex !important;
      }
      .call-view .input-field-container {
        flex: 1 !important;
        display: flex !important;
        align-items: center !important;
        background: #ffffff !important;
        border: 1px solid rgba(0,0,0,0.08) !important;
        border-radius: 999px !important;
        padding: 4px 6px 4px 18px !important;
        min-height: 46px !important;
        height: 46px !important;
        max-height: 46px !important;
        box-shadow: 0 4px 14px -4px rgba(0,0,0,0.18) !important;
        gap: 8px;
        position: relative;
      }
      .call-view .input-field-container:focus-within {
        border-color: rgba(10,132,255,0.45) !important;
        box-shadow: 0 4px 16px -4px rgba(10,132,255,0.25), 0 0 0 3px rgba(10,132,255,0.12) !important;
      }
      .call-view .message-input {
        flex: 1 !important;
        border: none !important;
        outline: none !important;
        background: transparent !important;
        font-size: 14px !important;
        line-height: 1.3 !important;
        color: #0d1117 !important;
        font-family: inherit !important;
        padding: 0 !important;
      }
      .call-view .message-input::placeholder {
        color: rgba(13,17,23,0.4) !important;
        font-size: 14px !important;
        font-style: normal !important;
      }
      .call-view #shivai-attach-btn {
        width: 36px !important;
        height: 36px !important;
        background: transparent !important;
        border: none !important;
        cursor: pointer !important;
        color: rgba(13,17,23,0.55) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0 !important;
        border-radius: 50% !important;
        margin: 0 !important;
        flex-shrink: 0 !important;
        transition: color 0.15s ease;
      }
      .call-view #shivai-attach-btn:hover { color: rgba(13,17,23,0.85) !important; background: transparent !important; }
      .call-view #shivai-send-btn {
        width: 30px !important;
        height: 30px !important;
        background: transparent !important;
        color: #0d1117 !important;
        border-radius: 0 !important;
        border: none !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        flex-shrink: 0 !important;
        padding: 0 !important;
        min-width: 30px !important;
        margin-right: 2px;
        opacity: 0.75;
        transition: opacity 0.15s ease;
      }
      .call-view #shivai-send-btn:hover { background: transparent !important; opacity: 1 !important; }

      /* Hide unused elements in call view */
      .call-view .language-section { display: none !important; }
      .call-view #shivai-language { display: none !important; }
      .call-view .widget-footer { display: none !important; }
      .call-view .footer-text { display: none !important; }
      .call-view .controls { display: none !important; }

      .call-header {
      display: flex;
      align-items: center;
      padding: 16px 20px 12px;
      background: linear-gradient(150deg, rgba(10,132,255,0.12) 0%, transparent 100%);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      gap: 12px;
      }
      .back-btn {
      background: rgba(255,255,255,0.07);
      border: none;
      color: rgba(245,245,247,0.75);
      cursor: pointer;
      padding: 0;
      width: 32px; height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.15s ease;
      flex-shrink: 0;
      }
      .back-btn:hover {
      background: rgba(255,255,255,0.13);
      color: #f5f5f7;
      }
      .call-info { flex: 1; min-width: 0; }
      .call-info-name {
      font-size: 15px !important;
      font-weight: 600 !important;
      color: #f5f5f7 !important;
      margin-bottom: 2px;
      line-height: 1.2;
      letter-spacing: -0.02em !important;
      }
      .call-info-status {
      font-size: 11px;
      display: flex;
      align-items: center;
      font-weight: 500;
      color: #30d158;
      }
      .call-info-status .status-text { font-size: 11px; line-height: 1; }
      .call-info-status.connecting { color: #ffd60a; }
      .call-info-status.connected  { color: #0a84ff; }
      .call-info-status.listening  { color: #30d158; }
      .call-info-status.speaking   { color: #bf5af2; }
      .call-info-status.disconnected { color: #ff3b30; }
      .call-view .widget-close { position: static; margin: 0; }

      /* ── Call Body ── */
      .call-body {
      padding: 8px 0 0;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0;
      overflow-y: auto;
      background: transparent;
      }
      .language-section {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px 0;
      margin-bottom: 4px;
      }
      .language-label {
      font-size: 11px;
      font-weight: 500;
      color: rgba(245,245,247,0.38);
      letter-spacing: 0.04em;
      margin: 0;
      white-space: nowrap;
      }
      .language-select-styled {
      flex: 1;
      padding: 6px 10px !important;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.06);
      font-size: 12px !important;
      color: #f5f5f7 !important;
      cursor: pointer;
      transition: border-color 0.15s ease;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(245,245,247,0.35)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      padding-right: 28px !important;
      appearance: none;
      -webkit-appearance: none;
      font-family: inherit;
      }
      .language-select-styled option { background: #1c1c1e; color: #f5f5f7; }
      .language-select-styled:focus {
      outline: none;
      border-color: rgba(10,132,255,0.45);
      box-shadow: 0 0 0 3px rgba(10,132,255,0.12);
      }
      
      .form-group { margin-bottom: 14px; }
      .agent-input-styled {
        width: 100%;
        padding: 10px 14px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.09);
        background: rgba(255,255,255,0.07);
        font-size: 14px;
        color: #f5f5f7;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
        font-weight: 500;
        font-family: inherit;
      }
      .agent-input-styled:focus {
        outline: none;
        border-color: rgba(10,132,255,0.55);
        box-shadow: 0 0 0 3px rgba(10,132,255,0.14);
      }
      .agent-input-styled::placeholder { color: rgba(245,245,247,0.3); font-weight: 400; }

      /* ── Latency monitor (keep functional, restyle) ── */
      .latency-monitor {
        margin-top: 12px; padding: 12px;
        background: rgba(255,255,255,0.04);
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.07);
        font-size: 11px;
      }
      .latency-header {
        font-size: 12px; font-weight: 600; color: #f5f5f7;
        margin-bottom: 8px; display: flex; align-items: center; gap: 5px;
      }
      .latency-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 6px; margin-bottom: 8px; }
      .latency-metric { background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); text-align: center; }
      .latency-label { font-size: 9px; font-weight: 600; color: rgba(245,245,247,0.4); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
      .latency-value { font-size: 14px; font-weight: 700; color: #f5f5f7; }
      .latency-value.good   { color: #30d158; }
      .latency-value.medium { color: #ffd60a; }
      .latency-value.bad    { color: #ff3b30; }
      .latency-chart { background: rgba(255,255,255,0.04); padding: 8px; border-radius: 8px; height: 50px; position: relative; overflow: hidden; margin-bottom: 6px; border: 1px solid rgba(255,255,255,0.06); }
      .latency-bar { position: absolute; bottom: 0; width: 2px; background: #0a84ff; transition: height 0.3s ease; border-radius: 1px 1px 0 0; }
      .latency-stats { font-size: 9px; color: rgba(245,245,247,0.35); text-align: center; line-height: 1.3; }

      /* ── Audio visualizer ── */
      .call-controls-row { display: flex; align-items: stretch; gap: 8px; padding: 0; margin-bottom: 10px; }
      .audio-visualizer-enhanced {
      flex: 0 0 auto; display: flex; justify-content: center; align-items: center;
      gap: 3px; height: auto;
      background: rgba(10,132,255,0.08);
      border-radius: 10px; padding: 8px 10px;
      border: 1px solid rgba(10,132,255,0.15);
      }
      .audio-visualizer-enhanced .visualizer-bar {
      width: 3px; height: 16px;
      background: linear-gradient(180deg, #0a84ff 0%, #5e5ce6 100%);
      border-radius: 2px; transition: all 0.15s ease;
      }
      .audio-visualizer-enhanced .visualizer-bar.active { animation: visualizerPulseEnhanced 0.8s ease-in-out infinite; }
      .audio-visualizer-enhanced .visualizer-bar:nth-child(1) { animation-delay: 0s; }
      .audio-visualizer-enhanced .visualizer-bar:nth-child(2) { animation-delay: 0.1s; }
      .audio-visualizer-enhanced .visualizer-bar:nth-child(3) { animation-delay: 0.2s; }
      .audio-visualizer-enhanced .visualizer-bar:nth-child(4) { animation-delay: 0.3s; }
      .audio-visualizer-enhanced .visualizer-bar:nth-child(5) { animation-delay: 0.4s; }
      @keyframes visualizerPulseEnhanced {
      0%,100% { height: 16px; opacity: 0.65; }
      50%      { height: 26px; opacity: 1; }
      }

      /* ── Shared widget-header (generic) ── */
      .widget-header {
      position: relative;
      padding: 20px 20px 16px;
      background: linear-gradient(150deg, rgba(10,132,255,0.14) 0%, rgba(94,92,230,0.07) 55%, transparent 100%);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      .widget-avatar {
      width: 48px; height: 48px;
      margin: 0 auto 10px;
      border-radius: 14px;
      background: rgba(255,255,255,0.06);
      display: flex; align-items: center; justify-content: center;
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 2px 14px rgba(0,0,0,0.35);
      }
      .widget-title {
      font-weight: 600; font-size: 16px; color: #f5f5f7;
      margin: 0 0 3px; letter-spacing: -0.025em;
      }
      .widget-subtitle {
      font-size: 12px;
      color: rgba(245,245,247,0.45);
      margin: 0;
      font-weight: 400;
      letter-spacing: -0.01em;
      }

      /* ── Status badge ── */
      .status {
      padding: 8px 12px;
      border-radius: 10px;
      text-align: center;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid transparent;
      }
      .status.connecting  { background: rgba(255,214,10,0.1);  color: #ffd60a; border-color: rgba(255,214,10,0.2); }
      .status.connected   { background: rgba(10,132,255,0.1);  color: #0a84ff; border-color: rgba(10,132,255,0.2); }
      .status.listening   { background: rgba(48,209,88,0.1);   color: #30d158; border-color: rgba(48,209,88,0.2); }
      .status.speaking    { background: rgba(191,90,242,0.1);  color: #bf5af2; border-color: rgba(191,90,242,0.2); }
      .status.disconnected{ background: rgba(255,59,48,0.1);   color: #ff3b30; border-color: rgba(255,59,48,0.2); }

      /* ── Visualizer ── */
      .audio-visualizer {
      display: flex; justify-content: center; align-items: center;
      gap: 3px; height: 36px;
      background: rgba(10,132,255,0.07);
      border-radius: 10px; padding: 8px;
      }
      .visualizer-bar {
      width: 3px; height: 18px;
      background: linear-gradient(180deg, #0a84ff 0%, #5e5ce6 100%);
      border-radius: 2px; transition: height 0.12s ease;
      }
      .visualizer-bar.active { animation: visualizerPulse 0.8s ease-in-out infinite; }
      @keyframes visualizerPulse {
      0%,100% { height: 18px; opacity: 0.65; }
      50%      { height: 28px; opacity: 1;    }
      }

      /* ── Messages ── */
      .messages-container {
      flex: 1; overflow-y: auto;
      padding: 10px 14px;
      max-height: 190px; min-height: 100px;
      scrollbar-width: none;
      display: flex; flex-direction: column; gap: 6px;
      }
      .messages-container::-webkit-scrollbar { display: none; }

      /* ── Connecting state ── */
      .connecting-state {
      text-align: center; padding: 32px 20px;
      color: rgba(245,245,247,0.45);
      display: flex; flex-direction: column; align-items: center; gap: 14px;
      }
      .connecting-animation {
      display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 0;
      }
      .call-icon-wrapper, .ai-icon-wrapper {
      width: 44px; height: 44px;
      border-radius: 14px;
      background: transparent;
      border: none;
      display: flex; align-items: center; justify-content: center;
      }
      .call-icon-wrapper { animation: pulse-call 2s ease-in-out infinite; }
      .ai-icon-wrapper   { animation: pulse-ai  2s ease-in-out infinite 0.3s; }
      .call-icon, .ai-icon { stroke: #0d1117; }
      @keyframes pulse-call { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
      @keyframes pulse-ai   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
      
      /* ── Connecting dots ── */
      .connecting-dots { display: flex; gap: 5px; align-items: center; }
      .connecting-dots .dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #0d1117;
      animation: dot-bounce 1.4s ease-in-out infinite;
      }
      .connecting-dots .dot:nth-child(1) { animation-delay: 0s; }
      .connecting-dots .dot:nth-child(2) { animation-delay: 0.2s; }
      .connecting-dots .dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes dot-bounce {
      0%,60%,100% { transform: translateY(0); opacity: 0.35; }
      30%          { transform: translateY(-8px); opacity: 1; }
      }
      .connecting-text { font-size: 13px; font-weight: 500; color: rgba(245,245,247,0.45); letter-spacing: -0.01em; }

      /* ── Empty state ── */
      .empty-state { text-align: center; padding: 18px 10px; color: rgba(245,245,247,0.35); }
      .empty-state-icon { font-size: 28px; margin-bottom: 5px; opacity: 0.55; }
      .empty-state-text { font-size: 12px; color: rgba(245,245,247,0.35); line-height: 1.5; }

      /* ── Message bubbles ── */
      .message {
      margin-bottom: 0;
      padding: 9px 13px;
      border-radius: 16px;
      max-width: 82%;
      font-size: 13px;
      line-height: 1.45;
      letter-spacing: -0.01em;
      word-wrap: break-word;
      animation: msgIn 0.22s cubic-bezier(0.34,1.56,0.64,1);
      }
      @keyframes msgIn { from{opacity:0;transform:translateY(6px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
      .message.user {
      background: #0a84ff;
      margin-left: auto;
      color: #ffffff;
      border-bottom-right-radius: 4px;
      }
      .message.assistant {
      background: rgba(255,255,255,0.09);
      border: 1px solid rgba(255,255,255,0.07);
      margin-right: auto;
      color: #f5f5f7;
      border-bottom-left-radius: 4px;
      }
      .message-label {
      font-size: 10px; font-weight: 600; margin-bottom: 3px;
      color: rgba(245,245,247,0.4);
      text-transform: uppercase; letter-spacing: 0.5px;
      }
      .message-text { font-size: 13px; line-height: 1.45; color: inherit; }

      /* ── Doc card (dark) ── */
      .doc-card {
      display: flex; align-items: center; gap: 10px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 12px; padding: 10px 12px; max-width: 260px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.25); text-decoration: none;
      }
      .doc-card:hover { background: rgba(255,255,255,0.1); }
      .doc-icon-wrap { flex-shrink:0; width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:18px; }
      .doc-icon-wrap.pdf  { background: rgba(255,59,48,0.18);  }
      .doc-icon-wrap.word { background: rgba(10,132,255,0.18); }
      .doc-icon-wrap.xls  { background: rgba(48,209,88,0.18);  }
      .doc-icon-wrap.ppt  { background: rgba(255,214,10,0.15); }
      .doc-icon-wrap.txt  { background: rgba(255,255,255,0.08);}
      .doc-icon-wrap.zip    { background: rgba(191,90,242,0.18); }
      .doc-icon-wrap.file   { background: rgba(255,255,255,0.08); }
      .doc-icon-wrap.link   { background: rgba(10,132,255,0.18); }
      .doc-icon-wrap.social { background: rgba(255,55,95,0.18);  }
      .doc-icon-wrap.img    { background: rgba(191,90,242,0.18); }
      .doc-meta { flex:1; min-width:0; }
      .doc-name { font-size:13px; font-weight:600; color:#f5f5f7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:155px; }
      .doc-size { font-size:11px; color:rgba(245,245,247,0.4); margin-top:1px; }
      .doc-type-label { font-size:10px; color:rgba(245,245,247,0.3); margin-top:2px; text-transform:uppercase; letter-spacing:0.4px; font-weight:500; }
      .doc-dl-btn { flex-shrink:0; width:28px; height:28px; border-radius:50%; background:rgba(10,132,255,0.15); border:1px solid rgba(10,132,255,0.25); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background 0.15s; }
      .doc-dl-btn:hover { background:rgba(10,132,255,0.25); }
      .doc-dl-btn svg { width:14px; height:14px; stroke:#0a84ff; fill:none; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
      .doc-caption { font-size:12px; color:rgba(245,245,247,0.4); margin-top:5px; line-height:1.4; }

      /* ── Controls ── */
      .controls {
      display: flex; align-items: center; justify-content: center;
      gap: 18px; padding: 12px 20px 16px;
      border-top: 1px solid rgba(255,255,255,0.06);
      }
      .call-timer {
      font-size: 13px; font-weight: 500;
      color: rgba(245,245,247,0.5);
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.04em;
      margin-right: auto;
      background: rgba(255,255,255,0.06);
      padding: 6px 12px; border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.08);
      position: relative; overflow: hidden;
      }
      .call-timer::before {
      content: '';
      position: absolute;
      top: 0; left: -100%;
      width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      animation: timerShimmer 2.5s infinite;
      }
      @keyframes timerShimmer {
      0% { left: -100%; }
      100% { left: 100%; }
      }

      /* ── Control buttons ── */
      .control-btn-icon {
      width: 48px; height: 48px;
      padding: 0; border: none; border-radius: 50%;
      cursor: pointer;
      transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease;
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden; flex-shrink: 0;
      color: #f5f5f7;
      }
      .control-btn-icon.connect {
      width: 58px; height: 58px;
      background: #0a84ff;
      box-shadow: 0 4px 22px rgba(10,132,255,0.5);
      animation: connectPulse 2.2s ease-in-out infinite;
      }
      @keyframes connectPulse {
      0%,100% { box-shadow: 0 4px 22px rgba(10,132,255,0.5), 0 0 0 0 rgba(10,132,255,0.35); }
      50%      { box-shadow: 0 4px 22px rgba(10,132,255,0.5), 0 0 0 8px rgba(10,132,255,0);  }
      }
      .control-btn-icon.connect:hover { background:#1a94ff; transform:scale(1.06); box-shadow:0 6px 30px rgba(10,132,255,0.65); }
      .control-btn-icon.connect:active { transform:scale(0.94); }
      .control-btn-icon.connect.connected {
      background: #ff3b30; animation: none;
      box-shadow: 0 4px 22px rgba(255,59,48,0.5);
      }
      .control-btn-icon.connect.connected:hover { background:#ff4d44; transform:scale(1.06); box-shadow:0 6px 30px rgba(255,59,48,0.65); }
      .control-btn-icon.clear {
      background: rgba(255,255,255,0.09);
      border: 1px solid rgba(255,255,255,0.08);
      }
      .control-btn-icon.clear:hover { background:rgba(255,255,255,0.15); transform:scale(1.05); }
      .control-btn-icon.clear:active { transform:scale(0.95); }
      .control-btn-icon.mute {
      background: rgba(255,255,255,0.09);
      border: 1px solid rgba(255,255,255,0.08);
      color: #30d158;
      }
      .control-btn-icon.mute:hover { background:rgba(48,209,88,0.12); transform:scale(1.05); }
      .control-btn-icon.mute:active { transform:scale(0.95); }
      .control-btn-icon.mute.muted { background:rgba(255,59,48,0.12); border-color:rgba(255,59,48,0.2); color:#ff3b30; }
      .control-btn-icon.mute.muted:hover { background:rgba(255,59,48,0.2); }

      /* ── Responsive ── */
      @media (max-width: 768px) {
      .shivai-trigger { bottom:calc(18px + env(safe-area-inset-bottom)); right:18px; }
      .shivai-message-bubble { font-size:12px; padding:8px 12px; max-width:200px; }
      .shivai-widget { width:calc(100vw - 32px); right:16px; bottom:calc(96px + env(safe-area-inset-bottom)); max-height:min(620px, calc(100dvh - 120px - env(safe-area-inset-bottom))); }
      }
      @media (max-width: 480px) {
      .shivai-widget { width:calc(100vw - 24px); right:12px; bottom:calc(90px + env(safe-area-inset-bottom)); max-height:min(580px, calc(100dvh - 110px - env(safe-area-inset-bottom))); }
      .widget-header  { padding:16px 16px 14px; }
      .widget-body    { padding:14px 16px; }
      .shivai-trigger { bottom:calc(14px + env(safe-area-inset-bottom)); right:14px; }
      .shivai-message-bubble { font-size:12px; padding:7px 11px; max-width:175px; }
      .call-view .input-field-container { background: #ffffff !important; }
      .dragging {
        opacity: 0.92;
        cursor: grabbing !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        z-index: 999999 !important;
        box-shadow: 0 16px 48px rgba(0,0,0,0.5) !important;
        transition: none !important;
      }
      .shivai-widget.dragging { transition: none !important; }
      .widget-header, .call-header, .shivai-status-bar { cursor: grab; touch-action: none; }
      .widget-header:hover, .call-header:hover, .shivai-status-bar:hover { cursor: grab; }
      .widget-header.dragging-active, .call-header.dragging-active, .shivai-status-bar.dragging-active { cursor: grabbing !important; }
      .widget-header .widget-close:hover,
      .widget-header .start-call-btn:hover,
      .widget-header .language-select-styled-landing:hover,
      .call-header .widget-close:hover,
      .call-header .back-btn:hover,
      .shivai-status-bar .widget-close:hover { cursor: pointer; }

      /* ── Message input container ── */
      .shivai-widget .message-input-container {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        padding: 8px 14px !important;
        background: rgba(255,255,255,0.03) !important;
        border-top: 1px solid rgba(255,255,255,0.06) !important;
      }
      .shivai-widget .message-input-container.hidden,
      .shivai-widget.message-input-container.hidden {
        display: none !important; opacity: 0 !important; pointer-events: none !important;
      }
      .shivai-widget .input-field-container {
        background: rgba(255,255,255,0.07) !important;
        border: 1px solid rgba(255,255,255,0.08) !important;
        border-radius: 12px !important;
        transition: border-color 0.15s ease !important;
      }
      .shivai-widget .input-field-container:focus-within {
        border-color: rgba(10,132,255,0.45) !important;
        box-shadow: 0 0 0 3px rgba(10,132,255,0.12) !important;
      }
      .shivai-widget .message-input {
        color: #f5f5f7 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif !important;
      }
      .shivai-widget .message-input::placeholder { color: rgba(245,245,247,0.3) !important; font-size: 12px !important; font-style: normal !important; }
      .shivai-widget .attach-btn { color: rgba(245,245,247,0.4) !important; }
      .shivai-widget .attach-btn:hover { color: rgba(245,245,247,0.75) !important; background: transparent !important; }
      .shivai-widget .send-btn {
        padding: 6px !important; border: none !important; background: transparent !important;
        color: #0a84ff !important; cursor: pointer !important;
        display: flex !important; align-items: center !important; justify-content: center !important;
        min-width: 30px !important; height: 30px !important; flex-shrink: 0 !important;
        transition: opacity 0.15s ease !important;
      }
      .shivai-widget .send-btn:hover  { opacity: 0.7 !important; }
      .shivai-widget .send-btn:active { opacity: 0.5 !important; }
      .shivai-widget .send-btn:disabled { color: rgba(245,245,247,0.2) !important; cursor: not-allowed !important; }
      .shivai-widget .send-btn svg { width: 15px; height: 15px; }

      .shivai-widget .attachment-menu {
        animation: slideUpFade 0.2s ease-out !important;
        background: rgba(28,28,30,0.97) !important;
        border: 1px solid rgba(255,255,255,0.09) !important;
        box-shadow: 0 16px 48px rgba(0,0,0,0.55) !important;
        backdrop-filter: blur(20px) !important;
        border-radius: 16px !important;
      }
      @keyframes slideUpFade {
        from { opacity:0; transform:translateY(10px); }
        to   { opacity:1; transform:translateY(0);    }
      }
      .shivai-widget .attachment-option:hover { background: rgba(255,255,255,0.06) !important; }
      .shivai-widget .attachment-option span  { color: #f5f5f7 !important; }

      /* ── File upload ── */
      .shivai-widget .message-file { margin-top: 2px; }
      .shivai-widget .message.user.message-has-file {
        background: none !important; border: none !important;
        padding: 2px 0 !important; box-shadow: none !important;
      }

      /* ── File send preview (dark) ── */
      .shivai-widget .wa-doc-card {
        background: rgba(10,132,255,0.14);
        border: 1px solid rgba(10,132,255,0.2);
        border-radius: 12px;
        padding: 10px 10px 6px;
        max-width: 262px; min-width: 180px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      }
      .shivai-widget .wa-doc-card .wa-doc-footer {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 3px;
        margin-top: 5px;
      }

      /* ── Upload spinner ── */
      @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }

      /* ── File send preview (Apple dark) ── */
      .shivai-widget .shivai-file-send-preview {
        position: absolute; inset: 0; z-index: 2000;
        display: flex; flex-direction: column;
        background: rgba(17,17,19,0.98);
        border-radius: 22px; overflow: hidden;
        animation: fspSlideUp 0.28s cubic-bezier(0.34,1.56,0.64,1);
      }
      @keyframes fspSlideUp {
        from { transform: translateY(100%); opacity: 0; }
        to   { transform: translateY(0);    opacity: 1; }
      }
      .shivai-widget .shivai-fsp-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 18px;
        background: rgba(255,255,255,0.04);
        border-bottom: 1px solid rgba(255,255,255,0.07);
        color: #f5f5f7; font-size: 15px; font-weight: 600; flex-shrink: 0;
        letter-spacing: -0.02em;
      }
      .shivai-widget .shivai-fsp-close {
        background: rgba(255,255,255,0.08); border: none; color: rgba(245,245,247,0.6);
        cursor: pointer; width: 30px; height: 30px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 50%; transition: background 0.15s; padding: 0;
      }
      .shivai-widget .shivai-fsp-close:hover { background: rgba(255,255,255,0.14); color: #f5f5f7; }
      .shivai-widget .shivai-fsp-body {
        flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 28px 20px 16px; gap: 14px; overflow-y: auto;
      }
      .shivai-widget .shivai-fsp-icon-wrap {
        width: 84px; height: 84px; border-radius: 18px;
        display: flex; align-items: center; justify-content: center;
        background: rgba(10,132,255,0.12); border: 1px solid rgba(10,132,255,0.2); flex-shrink: 0;
      }
      .shivai-widget .shivai-fsp-filename {
        color: #f5f5f7; font-size: 14px; font-weight: 600;
        text-align: center; word-break: break-all; max-width: 260px; line-height: 1.4;
        letter-spacing: -0.01em;
      }
      .shivai-widget .shivai-fsp-meta { color: rgba(245,245,247,0.4); font-size: 12px; text-align: center; }
      .shivai-widget .shivai-fsp-footer {
        display: flex; align-items: center; gap: 8px; padding: 10px 14px 14px;
        background: rgba(255,255,255,0.03);
        border-top: 1px solid rgba(255,255,255,0.07); flex-shrink: 0;
      }
      .shivai-widget .shivai-fsp-caption {
        flex: 1; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.09);
        border-radius: 12px; padding: 10px 14px; color: #f5f5f7; font-size: 13px;
        outline: none; min-width: 0; font-family: inherit;
        transition: border-color 0.15s;
      }
      .shivai-widget .shivai-fsp-caption:focus { border-color: rgba(10,132,255,0.45); }
      .shivai-widget .shivai-fsp-caption::placeholder { color: rgba(245,245,247,0.3); }
      .shivai-widget .shivai-fsp-send-btn {
        width: 44px; height: 44px; border-radius: 50%;
        background: #0a84ff; border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; transition: background 0.15s, transform 0.12s;
        box-shadow: 0 4px 16px rgba(10,132,255,0.45);
      }
      .shivai-widget .shivai-fsp-send-btn:hover  { background: #1a94ff; transform: scale(1.06); }
      .shivai-widget .shivai-fsp-send-btn:active { transform: scale(0.94); }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.id = "shivai-widget-styles";
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
  function setupEventListeners() {
    triggerBtn.addEventListener("click", toggleWidget);
    const closeButtons = widgetContainer.querySelectorAll(".widget-close");
    closeButtons.forEach((btn) => {
      btn.addEventListener("click", closeWidget);
    });
    // Note: start-call-btn is now dynamically created in updateLandingViewBasedOnStatus
    // Event listener is attached there instead of here
    const backBtn = document.getElementById("back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", switchToLandingView);
    }
    if (connectBtn) {
      connectBtn.addEventListener("click", handleConnectClick);
    }
    if (muteBtn) {
      muteBtn.addEventListener("click", handleMuteClick);
    }
    const keypadBtn = document.getElementById("shivai-keypad");
    if (keypadBtn) {
      keypadBtn.addEventListener("click", () => {
        const input = document.getElementById("shivai-message-input");
        if (input) {
          input.focus();
          input.scrollIntoView({ block: "end", behavior: "smooth" });
        }
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isWidgetOpen) {
        closeWidget();
      }
    });

    // Simplified message input event listeners
    const messageInput = document.getElementById("shivai-message-input");
    const sendBtn = document.getElementById("shivai-send-btn");
    const attachBtn = document.getElementById("shivai-attach-btn");
    const attachmentMenu = document.getElementById("shivai-attachment-menu");
    const fileInput = document.getElementById("shivai-file-input");
    const imageInput = document.getElementById("shivai-image-input");

    if (messageInput && sendBtn) {
      // Show send button only when user types text
      messageInput.addEventListener("input", () => {
        const hasText = messageInput.value.trim().length > 0;
        if (sendBtn) {
          // Use important styles to override any CSS conflicts on mobile
          if (hasText) {
            sendBtn.style.setProperty('display', 'flex', 'important');
            sendBtn.style.setProperty('visibility', 'visible', 'important');
          } else {
            sendBtn.style.setProperty('display', 'none', 'important');
            sendBtn.style.setProperty('visibility', 'hidden', 'important');
          }
        }
      });

      // Send message on Enter key
      messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (messageInput.value.trim().length > 0) {
            sendMessage();
            // Clear input and hide send button after sending
            messageInput.value = "";
            if (sendBtn) {
              sendBtn.style.setProperty('display', 'none', 'important');
              sendBtn.style.setProperty('visibility', 'hidden', 'important');
            }
          }
        }
      });

      // Send button click
      sendBtn.addEventListener("click", () => {
        if (messageInput.value.trim().length > 0) {
          sendMessage();
          // Clear input and hide send button after sending
          messageInput.value = "";
          sendBtn.style.setProperty('display', 'none', 'important');
          sendBtn.style.setProperty('visibility', 'hidden', 'important');
        }
      });

      // Attachment button — directly open file picker
      if (attachBtn && fileInput) {
        attachBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          fileInput.click();
        });

        fileInput.addEventListener("change", (e) => {
          const files = Array.from(e.target.files);
          if (files.length > 0) handleFileUpload(files, "document");
        });
      }
    }
  }

  // File upload validation constants
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
  const MAX_TEXT_LENGTH = 100000; // 100k characters
  const SUPPORTED_EXT = ['.pdf', '.docx', '.doc', '.txt', '.md', '.csv'];

  // Handle file uploads — validates then shows WhatsApp-style send preview
  async function handleFileUpload(files, type) {
    if (!files || files.length === 0) return;
    const file = Array.from(files)[0];

    const isImageOrVideo = file.type.startsWith('image/') || file.type.startsWith('video/');
    if (isImageOrVideo) {
      addMessage("system", "Image and video uploads are currently disabled. Please upload documents (.pdf, .docx, .doc, .txt, .md, .csv) only.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      addMessage("system", `File "${file.name}" is too large. Maximum size is 25MB.`);
      return;
    }

    const fileExt = '.' + file.name.toLowerCase().split('.').pop();
    if (!SUPPORTED_EXT.includes(fileExt)) {
      addMessage("system", `File type "${fileExt}" is not supported. Please upload: ${SUPPORTED_EXT.join(', ')}`);
      return;
    }

    doSendFile(file, '');
  }

  // WhatsApp-style send preview panel
  function showFileSendPreview(file) {
    const existing = document.getElementById('shivai-file-send-preview');
    if (existing) existing.remove();

    const fileColor = getFileColor(file.type);

    const preview = document.createElement('div');
    preview.id = 'shivai-file-send-preview';
    preview.className = 'shivai-file-send-preview';
    preview.innerHTML = `
      <div class="shivai-fsp-header">
        <button class="shivai-fsp-close" id="shivai-fsp-close-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <span>Send Document</span>
        <div style="width:32px"></div>
      </div>
      <div class="shivai-fsp-body">
        <div class="shivai-fsp-icon-wrap">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${fileColor.iconText}" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        </div>
        <div class="shivai-fsp-filename">${file.name}</div>
        <div class="shivai-fsp-meta">${formatFileSize(file.size)} &bull; ${getFileTypeName(file.type)}</div>
      </div>
      <div class="shivai-fsp-footer">
        <input type="text" class="shivai-fsp-caption" id="shivai-fsp-caption" placeholder="Add a caption..." autocomplete="off" />
        <button class="shivai-fsp-send-btn" id="shivai-fsp-send-btn" title="Send">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    `;

    widgetContainer.appendChild(preview);

    document.getElementById('shivai-fsp-close-btn').addEventListener('click', () => {
      preview.remove();
      const fi = document.getElementById('shivai-file-input');
      if (fi) fi.value = '';
    });

    const doSend = () => {
      const caption = document.getElementById('shivai-fsp-caption')?.value?.trim() || '';
      preview.remove();
      doSendFile(file, caption);
    };

    document.getElementById('shivai-fsp-send-btn').addEventListener('click', doSend);
    document.getElementById('shivai-fsp-caption').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); doSend(); }
    });
  }

  // Perform the actual file upload — adds a WhatsApp-style doc card to the chat transcript
  async function doSendFile(file, caption) {
    try {
      const fileColor = getFileColor(file.type);
      const filePreviewId = `file-preview-${Date.now()}`;
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const captionHtml = caption
        ? `<div style="font-size:13px;color:#111b21;margin:6px 0 2px;word-break:break-word;">${caption}</div>`
        : '';
      const fileMessage = `
        <div id="${filePreviewId}" class="wa-doc-card">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:42px;height:42px;border-radius:6px;background:${fileColor.icon};border:1px solid ${fileColor.iconBorder};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${fileColor.iconText}" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:600;color:#111b21;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:185px;">${file.name}</div>
              <div class="upload-status" style="font-size:11.5px;color:#667781;margin-top:2px;display:flex;align-items:center;gap:4px;">
                <span class="upload-spinner" style="display:inline-block;width:10px;height:10px;border:2px solid rgba(0,168,132,0.3);border-top-color:#00a884;border-radius:50%;animation:spin 0.7s linear infinite;flex-shrink:0;"></span>
                Sending...
              </div>
            </div>
          </div>
          ${captionHtml}
          <div class="wa-doc-footer">
            <span style="font-size:11px;color:#667781;">${timeStr}</span>
            <span class="wa-send-tick" style="display:flex;align-items:center;color:#8696a0;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 15.5 14"></polyline></svg>
            </span>
          </div>
        </div>`;

      addMessage("user", fileMessage, { isFile: true });
      await new Promise(resolve => setTimeout(resolve, 50));
      const success = await sendFileToAI(file, filePreviewId);
      const previewEl = document.getElementById(filePreviewId);
      if (previewEl) {
        const statusEl = previewEl.querySelector('.upload-status');
        const tickEl = previewEl.querySelector('.wa-send-tick');
        if (statusEl) {
          statusEl.innerHTML = success
            ? `${formatFileSize(file.size)} \u2022 ${getFileTypeName(file.type)}`
            : `<span style="color:#ef4444;">\u2717 Failed to send</span>`;
          if (success) statusEl.style.gap = '0';
        }
        if (tickEl) {
          tickEl.innerHTML = success
            ? `<svg width="16" height="11" viewBox="0 0 16 11" fill="none"><path d="M11 1L4.5 8L1 4.5" stroke="#53bdeb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 1L8.5 8L7 6.5" stroke="#53bdeb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
            : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        }
      }
    } catch (error) {
      console.error("Error sending file:", error);
      addMessage("system", `Failed to upload: ${file.name}`);
    }
    const fileInput = document.getElementById("shivai-file-input");
    const imageInput = document.getElementById("shivai-image-input");
    if (fileInput) fileInput.value = "";
    if (imageInput) imageInput.value = "";
  }

  // Send file to AI via LiveKit data channel with chunking (LiveKit limit: 64KB)
  async function sendFileToAI(file, previewId) {
    if (!room || !isConnected) {
      console.warn("Cannot send file - not connected to room");
      addMessage("system", "Please start a call first to send files.");
      return false;
    }

    const CHUNK_SIZE = 45000; // 45KB per chunk (safe limit for base64 + JSON)
    const encoder = new TextEncoder();

    try {
      const fileBuffer = await file.arrayBuffer();
      const fileId = Date.now().toString();
      const totalChunks = Math.ceil(fileBuffer.byteLength / CHUNK_SIZE);

      _wlog(`Sending file in ${totalChunks} chunks: ${file.name} (${formatFileSize(file.size)})`);

      // 1. Send file_start
      await room.localParticipant.publishData(
        encoder.encode(JSON.stringify({
          type: 'file_start',
          fileId: fileId,
          filename: file.name,
          totalChunks: totalChunks,
          totalSize: fileBuffer.byteLength
        })),
        { reliable: true }
      );

      // 2. Send chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileBuffer.byteLength);
        const chunk = fileBuffer.slice(start, end);
        const base64Chunk = btoa(String.fromCharCode(...new Uint8Array(chunk)));

        await room.localParticipant.publishData(
          encoder.encode(JSON.stringify({
            type: 'file_chunk',
            fileId: fileId,
            chunkIndex: i,
            data: base64Chunk
          })),
          { reliable: true }
        );

        const progress = Math.round(((i + 1) / totalChunks) * 100);
        updateUploadProgress(previewId, progress, i + 1, totalChunks);

        // Small delay to avoid overwhelming the data channel
        await new Promise(r => setTimeout(r, 30));
      }

      // 3. Send file_end
      await room.localParticipant.publishData(
        encoder.encode(JSON.stringify({
          type: 'file_end',
          fileId: fileId
        })),
        { reliable: true }
      );

      _wlog(`File upload complete: ${file.name}`);
      return true;

    } catch (error) {
      console.error("Error sending file to AI:", error);
      addMessage("system", `Failed to send file: ${error.message}`);
      return false;
    }
  }

  // Update upload progress in the UI
  function updateUploadProgress(previewId, progress, currentChunk, totalChunks) {
    if (!previewId) return;
    const previewEl = document.getElementById(previewId);
    if (previewEl) {
      const statusEl = previewEl.querySelector('.upload-status');
      if (statusEl) {
        statusEl.innerHTML = `
          <span class="upload-spinner" style="display: inline-block; width: 12px; height: 12px; border: 2px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.6s linear infinite; margin-right: 4px;"></span>
          Uploading... ${progress}% (${currentChunk}/${totalChunks})
        `;
      }
    }
  }

  // Get file color scheme based on type
  function getFileColor(fileType) {
    if (fileType.includes("pdf")) {
      return { bg: "#ffffff", icon: "#ffffff", iconBorder: "#e5e7eb", iconText: "#ef4444" };
    }
    if (fileType.includes("word") || fileType.includes("document")) {
      return { bg: "#ffffff", icon: "#ffffff", iconBorder: "#e5e7eb", iconText: "#3b82f6" };
    }
    if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv")) {
      return { bg: "#ffffff", icon: "#ffffff", iconBorder: "#e5e7eb", iconText: "#22c55e" };
    }
    if (fileType.includes("presentation") || fileType.includes("powerpoint")) {
      return { bg: "#ffffff", icon: "#ffffff", iconBorder: "#e5e7eb", iconText: "#f59e0b" };
    }
    if (fileType.includes("zip") || fileType.includes("rar") || fileType.includes("archive")) {
      return { bg: "#ffffff", icon: "#ffffff", iconBorder: "#e5e7eb", iconText: "#8b5cf6" };
    }
    return { bg: "#ffffff", icon: "#ffffff", iconBorder: "#e5e7eb", iconText: "#6b7280" };
  }

  // Format file size
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  // Get human-readable file type name
  function getFileTypeName(fileType) {
    if (fileType.includes("pdf")) return "PDF";
    if (fileType.includes("word") || fileType.includes("document")) return "Word";
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) return "Excel";
    if (fileType.includes("csv")) return "CSV";
    if (fileType.includes("presentation") || fileType.includes("powerpoint")) return "PowerPoint";
    if (fileType.includes("text")) return "Text";
    if (fileType.includes("json")) return "JSON";
    if (fileType.includes("xml")) return "XML";
    if (fileType.includes("zip")) return "ZIP";
    if (fileType.includes("rar")) return "RAR";
    return "File";
  }

  // Get appropriate icon for file type
  function getFileIcon(fileType) {
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("text")) return "📃";
    if (fileType.includes("spreadsheet") || fileType.includes("excel"))
      return "📊";
    if (fileType.includes("presentation") || fileType.includes("powerpoint"))
      return "📽️";
    if (fileType.includes("video")) return "🎥";
    if (fileType.includes("audio")) return "🎵";
    if (fileType.includes("zip") || fileType.includes("rar")) return "🗜️";
    return "📎";
  }

  function switchToCallView() {
    currentView = "call";
    landingView.style.display = "none";
    callView.style.display = "flex";
    updateCallLanguageLabel();
    refreshCallBgPhoto();
    // Re-position so the widget gets the call-view max height (720px)
    positionWidgetNearTrigger();
    // Initialize the Siri wave in idle mode
    loadSiriWaveScript().then(() => {
      // Wait a tick so the container has its final width
      setTimeout(() => setupSiriWave("idle"), 60);
    }).catch((e) => console.warn("SiriWave failed to load:", e));
  }

  function updateCallLanguageLabel() {
    const labelEl = document.getElementById("call-language-label");
    const select = document.getElementById("shivai-language");
    if (!labelEl || !select) return;
    const opt = select.options[select.selectedIndex];
    let name = opt ? opt.textContent : (select.value || "English");
    // strip native script in parens, e.g. "Hindi (हिन्दी)" -> "Hindi"
    name = name.replace(/\s*\([^)]+\)\s*$/, "").trim();
    labelEl.textContent = name || "English";
  }

  function refreshCallBgPhoto() {
    const photoEl = document.getElementById("call-bg-photo");
    if (!photoEl) return;
    const info = getCompanyInfo();
    const url = info.triggerButtonImage || info.logo || "";
    if (url) {
      photoEl.style.backgroundImage = `url('${url}')`;
    }
  }
  function switchToLandingView() {
    currentView = "landing";
    landingView.style.display = "flex";
    callView.style.display = "none";
    // Re-position so the widget gets the landing-view max height (550px)
    positionWidgetNearTrigger();
    // Dispose Siri wave to free canvas
    disposeSiriWave();
    if (isConnected) {
      stopConversation();
    }
  }
  function toggleWidget() {
    if (isWidgetOpen) {
      closeWidget();
    } else {
      openWidget();
    }
  }
  function openWidget() {
    positionWidgetNearTrigger();
    widgetContainer.classList.add("active");
    isWidgetOpen = true;
    if (triggerBtn) {
      triggerBtn.style.display = "none";
    }
    hideBubble();
    if (messageInterval) {
      clearInterval(messageInterval);
      messageInterval = null;
    }
    
    // Re-check agent status when widget opens to ensure UI is up-to-date
    checkAgentStatusOnLoad().then(() => {
      updateLandingViewBasedOnStatus();
    });
  }
  function closeWidget() {
    _wlog("🔴 Widget closing - checking call state");

    // Disconnect LiveKit room if connected
    if (room) {
      _wlog("🔴 Disconnecting LiveKit room on widget close");
      room
        .disconnect()
        .then(() => {
          _wlog("🔴 LiveKit room disconnected successfully");
        })
        .catch((err) => {
          console.warn("Error disconnecting LiveKit room:", err);
        });
      room = null;
    }

    _wlog("🔴 Performing complete cleanup on widget close");
    isConnected = false;
    isConnecting = false;
    hasReceivedFirstAIResponse = false;
    firstResponseReceived = false;
    shouldAutoUnmute = false;
    isMuted = false;
    clearLoadingStatus();
    stopCallTimer();
    hideConnectingState();
    if (ws) {
      ws.close();
      ws = null;
    }
    stopAllScheduledAudio();
    teardownPlaybackProcessor();
    if (mediaStream) {
      _wlog(
        "🎤 Stopping microphone and revoking permissions on widget close"
      );
      mediaStream.getTracks().forEach((track) => {
        _wlog(
          `Stopping track: ${track.kind}, state: ${track.readyState}`
        );
        track.stop();
        track.enabled = false;
      });
      mediaStream = null;
      _wlog("🎤 Microphone permissions revoked successfully");
    }
    if (audioContext) {
      try {
        audioContext.close().catch((err) => {
          console.warn("Error closing audio context:", err);
        });
      } catch (error) {
        console.error("Error closing audio context:", error);
      }
      audioContext = null;
    }
    if (messagesDiv) {
      _wlog("📝 Transcripts cleared completely");
    }
    currentUserTranscript = "";
    currentAssistantTranscript = "";
    lastUserMessageDiv = null;
    lastSentMessage = null; // Reset last sent message tracker
    if (visualizerInterval) {
      clearInterval(visualizerInterval);
      visualizerInterval = null;
      animateVisualizer(false);
    }
    updateStatus("Ready to connect", "disconnected");
    setupSiriWave("idle");
    if (connectBtn) {
      connectBtn.innerHTML =
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
      connectBtn.classList.remove("connected");
      connectBtn.title = "Start Call";
      connectBtn.disabled = false;
    }
    if (muteBtn) {
      muteBtn.style.display = "none";
      muteBtn.classList.remove("muted");
    }
    if (languageSelect) {
      languageSelect.disabled = false;
    }
    if (window.currentCallId) {
      fetch("https://nodejs.service.callshivai.com/api/v1/calls/end-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId: window.currentCallId }),
      })
        .catch((err) => {
          console.warn("Error ending call via API:", err);
        })
        .finally(() => {
          window.currentCallId = null;
        });
    }
    _wlog("🔴 Complete cleanup finished on widget close");
    widgetContainer.classList.remove("active");
    isWidgetOpen = false;
    if (triggerBtn) {
      triggerBtn.style.display = "flex";
    }
    switchToLandingView();
    if (!messageInterval) {
      startLiveMessages();
    }
    _wlog("✅ Widget closed successfully");
  }
  async function handleConnectClick(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault(); // Prevent any default behavior
    }

    // Prevent multiple rapid clicks
    if (isDisconnecting) {
      _wlog("🚫 Disconnect already in progress - ignoring click");
      return;
    }

    // iOS/mobile requires HTMLAudio autoplay within synchronous user-gesture context
    if (!isConnecting && !isConnected) {
      if (isMobile) ringAudio = null; // force fresh Audio object each call on mobile
      playConnectingSound();
    }

    if (isIOS()) {
      try {
        if (soundContext && soundContext.state === "suspended") {
          await soundContext.resume();
        }
        if (soundContext) {
          const buffer = soundContext.createBuffer(1, 1, 22050);
          const source = soundContext.createBufferSource();
          source.buffer = buffer;
          source.start();
        }
      } catch (e) {
        console.warn("🍎 [iOS] Audio unlock failed:", e);
      }
    }

    // Handle disconnect for any connected or connecting state
    if (isConnecting || isConnected) {
      _wlog("🔴 Disconnect requested - current state:", {
        isConnecting,
        isConnected,
      });

      // Set disconnect flag to prevent multiple clicks
      isDisconnecting = true;
      connectBtn.disabled = true;

      // Immediately set all flags to stop all processes
      isConnecting = false;
      isConnected = false;
      hasReceivedFirstAIResponse = false;
      firstResponseReceived = false;
      shouldAutoUnmute = false;
      aiJustFinished = false;

      // Hide message interface immediately
      hideMessageInterface();

      // Clear all timeouts and intervals immediately
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      if (aiResponseTimeout) {
        clearTimeout(aiResponseTimeout);
        aiResponseTimeout = null;
      }

      // Stop all audio processes
      stopRingSound();
      stopConnectingSound();
      stopAllScheduledAudio();

      // Clear UI state
      clearLoadingStatus();
      stopCallTimer();
      hideConnectingState();

      // Close WebSocket if exists
      if (ws) {
        _wlog("🔌 Closing WebSocket immediately");
        try {
          ws.close();
        } catch (err) {
          console.warn("Error closing WebSocket:", err);
        }
        ws = null;
      }

      // Update UI to disconnected state IMMEDIATELY
      updateStatus("Disconnected", "disconnected");
      setupSiriWave("idle");
      connectBtn.innerHTML =
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
      connectBtn.classList.remove("connected");
      connectBtn.title = "Start Call";

      // Reset microphone state
      if (muteBtn) {
        muteBtn.style.display = "none";
        muteBtn.classList.remove("muted");
        isMuted = false;
      }

      // Re-enable language selector
      if (languageSelect) {
        languageSelect.disabled = false;
      }

      // Close LiveKit room AFTER UI is updated (async in background)
      if (room) {
        room
          .disconnect()
          .then(() => {
            _wlog("🚪 LiveKit room disconnected");
            room = null;
          })
          .catch((err) => {
            console.warn("Error disconnecting LiveKit room:", err);
            room = null;
          });
      }

      // Call stopConversation for cleanup (async in background)
      stopConversation().catch((err) => {
        console.warn("Error in stopConversation:", err);
      });

      // Clear disconnect flag and re-enable button IMMEDIATELY
      setTimeout(() => {
        isDisconnecting = false;
        connectBtn.disabled = false;
        _wlog("✅ Immediate disconnect completed");
      }, 100); // Reduced from 500ms to 100ms for faster reconnection

      return;
    }
    // Start new connection only if not currently connected or connecting
    if (!isConnecting && !isConnected && !isDisconnecting) {
      _wlog("🔵 Starting new connection");
      isConnecting = true;
      connectBtn.disabled = true;

      try {
        connectBtn.innerHTML =
          '<svg width="24" height="24" viewBox="-3 -3 30 30" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" transform="rotate(135 12 12)"></path></svg>';
        connectBtn.classList.add("connected");
        connectBtn.title = "Hang Up";

        await startConversation();

        // Check if connection was cancelled during startConversation
        if (!isConnecting) {
          _wlog("⚠️ Connection was cancelled during startup");
          return;
        }

        connectBtn.disabled = false;
        isConnecting = false;
      } catch (error) {
        console.error("Failed to start conversation:", error);

        // Complete cleanup on connection failure
        stopRingSound();
        stopConnectingSound();
        isConnected = false;
        isConnecting = false;
        isDisconnecting = false; // Reset disconnect flag
        hasReceivedFirstAIResponse = false;
        firstResponseReceived = false;
        shouldAutoUnmute = false;
        aiJustFinished = false;

        // Hide message interface on connection failure
        hideMessageInterface();
        
        // Clear all timeouts
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
        if (aiResponseTimeout) {
          clearTimeout(aiResponseTimeout);
          aiResponseTimeout = null;
        }
        
        clearLoadingStatus();
        stopCallTimer();

        // Reset button state for reconnection
        connectBtn.innerHTML =
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
        connectBtn.classList.remove("connected");
        connectBtn.title = "Start Call";
        connectBtn.disabled = false; // Ensure button is enabled for reconnection
        
        updateStatus(
          "❌ Failed to connect - Click to retry",
          "disconnected"
        );
        
        if (muteBtn) {
          muteBtn.style.display = "none";
          muteBtn.classList.remove("muted");
          isMuted = false;
        }
        languageSelect.disabled = false;
      }
    }
  }
  function updateMuteButton() {
    if (!muteBtn) return;
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
    if (isMuted) {
      muteBtn.classList.add("muted");
      muteBtn.title = "Unmute Microphone";
      muteBtn.innerHTML =
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';
    } else {
      muteBtn.classList.remove("muted");
      muteBtn.title = "Mute Microphone";
      muteBtn.innerHTML =
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';
    }
  }
  function handleMuteClick(e) {
    e.stopPropagation();
    if (!isConnected || !room) return;

    isMuted = !isMuted;

    if (isMuted) {
      room.localParticipant.setMicrophoneEnabled(false);
    } else {
      room.localParticipant.setMicrophoneEnabled(true, {
        // Consistent settings for unmuting
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false, // Keep disabled for consistency
        suppressLocalAudioPlayback: true, // Prevent feedback

        channelCount: 1,
        sampleRate: 48000,
        sampleSize: 16,
        volume: 0.7, // Reduced for close voice only
        latency: 0.05,
        facingMode: "user",
      });
    }

    updateMuteButton();
    _wlog(`🎤 Microphone ${isMuted ? "muted" : "unmuted"} by user`);
  }
  function updateStatus(status, className) {
    const statusText = statusDiv.querySelector(".status-text");
    if (statusText) {
      statusText.textContent = status;
    } else {
      statusDiv.textContent = status;
    }
    statusDiv.className = `call-info-status ${className}`;

    // The message/attachment input is only usable during an active call.
    // Hide it for any non-connected state ("Ready to connect", connecting,
    // disconnected/ended) so it never shows when the call isn't live.
    const liveStates = ["connected", "listening", "speaking"];
    if (liveStates.indexOf(className) !== -1) {
      showMessageInterface();
    } else {
      hideMessageInterface();
    }
  }
  function showLoadingStatus(message) {
    clearLoadingStatus();
    let dots = "";
    loadingInterval = setInterval(() => {
      dots = dots.length >= 3 ? "" : dots + ".";
      const statusText = statusDiv.querySelector(".status-text");
      if (statusText) {
        statusText.textContent = `${message}${dots}`;
      } else {
        statusDiv.textContent = `${message}${dots}`;
      }
    }, 400);
  }
  function clearLoadingStatus() {
    if (loadingInterval) {
      clearInterval(loadingInterval);
      loadingInterval = null;
    }
  }
  function startCallTimer() {
    stopRingSound(); // Stop ring sound when call timer starts
    stopConnectingSound(); // Stop connecting sound when call timer starts
    callStartTime = Date.now();
    if (callTimerElement) {
      callTimerElement.style.display = "block";
    }
    if (muteBtn) {
      muteBtn.style.display = "flex";
    }
    connectBtn.innerHTML =
      '<svg width="24" height="24" viewBox="-3 -3 30 30" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" transform="rotate(135 12 12)"></path></svg>';
    connectBtn.classList.add("connected");
    connectBtn.title = "End Call";
    callTimerInterval = setInterval(updateCallTimer, 1000);
    updateCallTimer();
    _wlog("⏱️ Call timer started");

    // Microphone is always enabled
    _wlog("🎤 Microphone is enabled and ready for conversation");
  }
  function stopCallTimer() {
    if (callTimerInterval) {
      clearInterval(callTimerInterval);
      callTimerInterval = null;
    }
    callStartTime = null;
    if (callTimerElement) {
      callTimerElement.style.display = "none";
      callTimerElement.textContent = "00:00";
    }
  }
  function updateCallTimer() {
    if (!callStartTime || !callTimerElement) return;
    const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    callTimerElement.textContent = `${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  }
  function showConnectingState() {
    if (!messagesDiv) return;
    const connectingState = messagesDiv.querySelector(".connecting-state");
    const emptyState = messagesDiv.querySelector(".empty-state");
    
    if (connectingState) {
      connectingState.style.display = "block";
    }
    if (emptyState) {
      emptyState.style.display = "none";
    }
    
    // Hide message interface during connection
    hideMessageInterface();
    
    _wlog("🔄 Showing connecting animation");
  }
  
  function hideConnectingState() {
    if (!messagesDiv) return;
    const connectingState = messagesDiv.querySelector(".connecting-state");
    const emptyState = messagesDiv.querySelector(".empty-state");
    
    if (connectingState) {
      connectingState.style.display = "none";
    }
    
    // Show empty state only if no messages
    const hasMessages = messagesDiv.querySelector(".message");
    if (emptyState && !hasMessages) {
      emptyState.style.display = "block";
    }
    
    // Show message interface now that connection is stable
    showMessageInterface();
    
    _wlog("✅ Hiding connecting animation");
  }
  
  async function showProgressiveConnectionStates() {
    const wasWarmedUp = false;
    const hasPreloadedAudio = audioContext !== null;
    const baseDelay = wasWarmedUp ? 100 : 200;
    const states = [
      {
        text: "Connecting to AI servers...",
        desc: wasWarmedUp
          ? "Using cached connection"
          : "Establishing secure connection",
        delay: baseDelay + 200,
        sound: false,
      },
      {
        text: "Setting up voice pipeline...",
        desc: hasPreloadedAudio
          ? "Audio pipeline ready"
          : "Configuring audio processing",
        delay: hasPreloadedAudio ? 150 : baseDelay + 100,
        sound: false,
      },
      {
        text: "Configuring audio streams...",
        desc: "Optimizing voice quality",
        delay: baseDelay + 300,
        sound: false,
      },
      {
        text: "Almost ready to talk...",
        desc: "Finalizing setup",
        delay: 400,
        sound: false,
      },
      {
        text: "Connection established! 🎉",
        desc: "AI is warming up, ready in moments...",
        delay: 600,
        sound: false,
      },
    ];
    for (const state of states) {
      updateStatus(state.text, "connecting");
      if (state.desc) {
        showLoadingStatus(state.desc);
      }
      if (state.sound) {
        playSound("ring");
      }
      if (state.delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, state.delay));
      }
    }
  }

// Converts AI responses (HTML or plain text with URLs) into clean formatted content.
  // Returns an HTML string, or null to fall back to textContent.
  function renderMessageText(text) {
    const noComments = text.replace(/<!--[\s\S]*?-->/g, '').trim();

    const esc = function(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
    function docIc(name) {
      const n = (name || '').toLowerCase();
      if (n.match(/\.pdf$/))          return { cls: 'pdf',  emoji: '\uD83D\uDCD5' };
      if (n.match(/\.docx?$/))        return { cls: 'word', emoji: '\uD83D\uDCD8' };
      if (n.match(/\.xlsx?$|\.csv$/)) return { cls: 'xls',  emoji: '\uD83D\uDCD7' };
      if (n.match(/\.pptx?$/))        return { cls: 'ppt',  emoji: '\uD83D\uDCD9' };
      if (n.match(/\.(txt|md)$/))     return { cls: 'txt',  emoji: '\uD83D\uDCC4' };
      if (n.match(/\.(zip|rar)$/))    return { cls: 'zip',  emoji: '\uD83D\uDDDC\uFE0F' };
      return { cls: 'file', emoji: '\uD83D\uDCCE' };
    }
    function makeDocCard(url) {
      const ic = docIc(url);
      const displayName = decodeURIComponent(url.split('/').pop().split('?')[0]);
      return '<a class="doc-card" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">'
        + '<div class="doc-icon-wrap ' + ic.cls + '">' + ic.emoji + '</div>'
        + '<div class="doc-meta"><div class="doc-name" title="' + esc(displayName) + '">' + esc(displayName) + '</div>'
        + '<div class="doc-size">Tap to open</div></div>'
        + '<span class="doc-dl-btn" title="Open">'
        + '<svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'
        + '</span></a>';
    }

    // ── Case 1: plain text containing a URL ──────────────────────────────────
    // URLs in transcript text are handled by the documents[] array as separate cards.
    // Here we just strip the URLs and show the surrounding text cleanly.
    if (!/<[a-z][\s\S]*?>/i.test(noComments)) {
      const urlRe = /https?:\/\/[^\s<>"']+/gi;
      if (!urlRe.test(noComments)) return null; // truly plain text, no special rendering needed
      // Strip all URLs, keep only the human-readable text
      const textOnly = noComments.replace(urlRe, '').replace(/[:\s]+$/, '').trim()
        .replace(/\n{2,}/g, '\n').trim();
      if (!textOnly) return null;
      const lines = textOnly.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
      if (lines.length === 1) return '<span>' + esc(lines[0]) + '</span>';
      return lines.map(function(l) { return '<span style="display:block">' + esc(l) + '</span>'; }).join('');
    }

    // ── Case 2: HTML-wrapped content (e.g. <div>filename</div>) ─────────────
    const tmp = document.createElement('div');
    tmp.innerHTML = noComments;
    const lines = [];
    tmp.childNodes.forEach(function(node) {
      const t = (node.textContent || '').trim();
      if (t) lines.push(t);
    });
    if (lines.length === 0) return null;
    const fileExts = /\.(pdf|doc|docx|txt|csv|xlsx|xls|ppt|pptx|png|jpg|jpeg|gif|mp4|mp3|zip)$/i;
    let html = '<span>' + esc(lines[0]) + '</span>';
    if (lines.length > 1) {
      html += '<div style="margin-top:8px;display:flex;flex-direction:column;gap:6px;">';
      for (let i = 1; i < lines.length; i++) {
        const item = lines[i];
        if (/^https?:\/\//i.test(item) || fileExts.test(item)) {
          const isUrl = /^https?:\/\//i.test(item);
          if (isUrl) {
            html += makeDocCard(item);
          } else {
            const ic = docIc(item);
            html += '<div class="doc-card"><div class="doc-icon-wrap ' + ic.cls + '">' + ic.emoji + '</div>'
              + '<div class="doc-meta"><div class="doc-name" title="' + esc(item) + '">' + esc(item) + '</div></div></div>';
          }
        } else {
          html += '<div style="font-size:13px;color:#374151;">' + esc(item) + '</div>';
        }
      }
      html += '</div>';
    }
    return html;
  }

  function addMessage(role, text, options = {}) {
    _wlog("🔍 addMessage called:", {
      role,
      text,
      caller: new Error().stack.split("\n")[2],
    });

    // CRITICAL: Prevent duplicate messages
    if (!text || text.trim().length === 0) {
      _wlog("🚫 Skipping empty message");
      return null;
    }

    // Check for duplicate messages from the same role in the last 2 seconds
    const now = Date.now();
    const recentMessages = Array.from(messagesDiv.querySelectorAll('.message')).slice(-5);
    for (const msgEl of recentMessages) {
      const msgText = msgEl.querySelector('.message-text')?.textContent?.trim();
      const msgRole = msgEl.classList.contains('user') ? 'user' : 'assistant';
      const msgTime = msgEl.dataset.timestamp ? parseInt(msgEl.dataset.timestamp) : 0;
      if (msgRole === role && msgText === text.trim() && (now - msgTime) < 2000) {
        _wlog("🚫 Skipping duplicate message:", text.substring(0, 50));
        return msgEl;
      }
    }

    // Stop connecting sound when assistant speaks
    if (role === "assistant") {
      stopConnectingSound();
    }

    // CRITICAL: Hide connecting state immediately on first message (matches widget.js)
    const connectingState = messagesDiv.querySelector(".connecting-state");
    if (connectingState) {
      connectingState.style.display = "none";
    }

    // Also trigger full hideConnectingState logic on first AI message
    if (role === "assistant" && !firstResponseReceived) {
      firstResponseReceived = true;
      if (!callTimerStarted) {
        callTimerStarted = true;
        updateStatus("✅ Connected - Speak now!", "connected");
        stopConnectingSound();
        clearLoadingStatus();
        hideConnectingState();
        startCallTimer();
      }
    }

    const emptyState = messagesDiv.querySelector(".empty-state");
    if (emptyState) {
      emptyState.style.display = "none";
    }
    const messageDiv = document.createElement("div");
    messageDiv.className = options.isFile ? `message ${role} message-has-file` : `message ${role}`;
    messageDiv.dataset.timestamp = Date.now().toString();
    const labelDiv = document.createElement("div");
    labelDiv.className = "message-label";
    const _ci = (typeof getCompanyInfo === "function") ? getCompanyInfo() : {};
    const _agentName = _ci.name || _ci.agentName || "AI Employee";
    labelDiv.textContent = role === "user" ? "You" : _agentName;
    if (options.isFile) {
      const fileDiv = document.createElement("div");
      fileDiv.className = "message-file";
      fileDiv.innerHTML = text;
      messageDiv.appendChild(labelDiv);
      messageDiv.appendChild(fileDiv);
    } else {
      const textDiv = document.createElement("div");
      textDiv.className = "message-text";
      const rendered = renderMessageText(text);
      if (rendered !== null) {
        textDiv.innerHTML = rendered;
      } else {
        textDiv.textContent = text;
      }
      messageDiv.appendChild(labelDiv);
      messageDiv.appendChild(textDiv);
    }
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    if (clearBtn) {
      clearBtn.style.display = "flex";
    }
    return messageDiv;
  }
  function updateMessage(messageDiv, text) {
    const textDiv = messageDiv.querySelector(".message-text");
    if (textDiv) {
      const rendered = renderMessageText(text);
      if (rendered !== null) {
        textDiv.innerHTML = rendered;
      } else {
        textDiv.textContent = text;
      }
    }
  }

  // ── WhatsApp-style document card from AI ────────────────────────────────
  function addDocumentMessage(docData) {
    // docData: { url, name, size, mime_type, type, caption }
    if (!docData || !docData.url) return;

    const name      = docData.name     || 'Document';
    const url       = docData.url;
    const caption   = docData.caption  || '';
    const sizeRaw   = docData.size;
    const mime      = (docData.mime_type || '').toLowerCase();
    const typeStr   = (docData.type || '').toLowerCase();
    const typeLabel = docData.type || '';  // original casing for display

    // Human-readable size
    let sizeLabel = '';
    if (sizeRaw) {
      const kb = Math.round(sizeRaw / 1024);
      sizeLabel = kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB';
    }

    // Icon + colour — check docData.type first, then mime_type, then filename
    let iconEmoji = '📄', colorClass = 'file', isLinkType = false;
    if      (typeStr.includes('pdf'))                           { iconEmoji = '📕'; colorClass = 'pdf';    }
    else if (typeStr.includes('word'))                          { iconEmoji = '📘'; colorClass = 'word';   }
    else if (typeStr.includes('image'))                         { iconEmoji = '🖼️'; colorClass = 'img';    }
    else if (typeStr.includes('text'))                          { iconEmoji = '📄'; colorClass = 'txt';    }
    else if (typeStr.includes('website'))                       { iconEmoji = '🌐'; colorClass = 'link';   isLinkType = true; }
    else if (typeStr.includes('social'))                        { iconEmoji = '📱'; colorClass = 'social'; isLinkType = true; }
    else if (typeStr.includes('link'))                          { iconEmoji = '🔗'; colorClass = 'link';   isLinkType = true; }
    else if (mime.includes('pdf'))                              { iconEmoji = '📕'; colorClass = 'pdf';    }
    else if (mime.includes('word') || name.match(/\.docx?$/i)) { iconEmoji = '📘'; colorClass = 'word';   }
    else if (mime.includes('sheet') || name.match(/\.xlsx?$/i)){ iconEmoji = '📗'; colorClass = 'xls';    }
    else if (mime.includes('presentation') || name.match(/\.pptx?$/i)) { iconEmoji = '📙'; colorClass = 'ppt'; }
    else if (mime.includes('text') || name.match(/\.(txt|md)$/i)) { iconEmoji = '📄'; colorClass = 'txt'; }
    else if (mime.includes('image'))                            { iconEmoji = '🖼️'; colorClass = 'img';    }
    else if (mime.includes('zip') || mime.includes('rar'))      { iconEmoji = '🗜️'; colorClass = 'zip';    }
    else if (/^https?:\/\//i.test(url) && !name.match(/\.(pdf|doc|docx|txt|csv|xlsx|xls|ppt|pptx|png|jpg|jpeg|gif)$/i)) {
      iconEmoji = '🌐'; colorClass = 'link'; isLinkType = true;
    }

    // Secondary info: type label takes priority over size
    const secondaryInfo = typeLabel
      ? `<div class="doc-type-label">${typeLabel}</div>`
      : (sizeLabel ? `<div class="doc-size">${sizeLabel}</div>` : '<div class="doc-size">Tap to open</div>');

    // Action button: always open in new tab
    const actionBtn = '<span class="doc-dl-btn" title="Open"><svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></span>';

    // Build card
    const card = document.createElement('div');
    card.className = 'message assistant';
    card.dataset.timestamp = Date.now().toString();

    const label       = document.createElement('div');
    label.className   = 'message-label';
    label.textContent = 'AI Employee';

    const link = document.createElement('a');
    link.className = 'doc-card';
    link.href      = url;
    link.target    = '_blank';
    link.rel       = 'noopener noreferrer';
    link.title     = 'Click to open';
    link.innerHTML = `
      <div class="doc-icon-wrap ${colorClass}">${iconEmoji}</div>
      <div class="doc-meta">
        <div class="doc-name" title="${name}">${name}</div>
        ${secondaryInfo}
      </div>
      ${actionBtn}`;

    card.appendChild(label);
    card.appendChild(link);

    if (caption) {
      const cap = document.createElement('div');
      cap.className   = 'doc-caption';
      cap.textContent = caption;
      card.appendChild(cap);
    }

    if (messagesDiv) {
      const emptyState = messagesDiv.querySelector('.empty-state');
      if (emptyState) emptyState.style.display = 'none';
      messagesDiv.appendChild(card);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    if (clearBtn) clearBtn.style.display = 'flex';
    _wlog('📎 Document card added:', name, typeLabel, url);
  }
  function animateVisualizer(active) {
    if (!visualizerBars) return;
    visualizerBars.forEach((bar, index) => {
      if (active) {
        const randomHeight = Math.random() * 18 + 10;
        setTimeout(() => {
          bar.style.height = `${randomHeight}px`;
        }, index * 30);
      } else {
        // Clear inline height so the CSS rainbow pulse animation keeps running
        bar.style.removeProperty("height");
      }
    });
  }

  // Message sending functionality
  function sendMessage() {
    const messageInput = document.getElementById("shivai-message-input");
    if (!messageInput) return;

    const message = messageInput.value.trim();

    if (message && room && isConnected) {
      try {
        _wlog("📤 Sending chat message:", message);

        // Use proper LiveKit sendText method like test-client
        if (typeof room.localParticipant.sendText === "function") {
          _wlog("Using sendText method with lk.chat topic");
          room.localParticipant
            .sendText(message, {
              topic: "lk.chat",
            })
            .then((info) => {
              _wlog(
                "✅ Chat sent with sendText, stream ID:",
                info.streamId
              );
            })
            .catch((error) => {
              console.error("❌ sendText failed:", error);
              // Fallback to publishData if sendText fails
              fallbackSendChat(message);
            });
        } else {
          _wlog("sendText not available, using fallback publishData");
          fallbackSendChat(message);
        }

        // Add message to UI immediately (like test-client does)
        addMessage("user", message, { source: "typed" });

        // Track this message to prevent duplicates from transcription
        lastSentMessage = message;

        // Clear input
        messageInput.value = "";

        _wlog("💬 Message sent:", message);
      } catch (error) {
        console.error("❌ Error sending message:", error);
      }
    } else if (!isConnected) {
      console.warn("⚠️ Cannot send message: not connected to room");
    }
  }

  function fallbackSendChat(text) {
    try {
      _wlog("Using fallback publishData method");
      const chatMessage = {
        type: "chat",
        text,
        timestamp: Date.now(),
        source: "typed",
      };
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(chatMessage));

      room.localParticipant.publishData(data, {
        reliable: true,
        destinationIdentities: [], // send to all participants
      });

      _wlog("✅ Chat sent with publishData");
    } catch (error) {
      console.error("❌ publishData fallback failed:", error);
    }
  }

  async function startConversation() {
    try {
      // Reset call timer flags for new conversation
      knowledgeBaseReady = false;
      firstResponseReceived = false;
      callTimerStarted = false;

      // Show connecting animation
      showConnectingState();

      // Check if connection was cancelled before starting
      if (!isConnecting) {
        _wlog("❌ Connection cancelled before start");
        return;
      }

      // ✅ CRITICAL: Check permission state FIRST - never auto-request
      _wlog("🔍 Checking microphone permission state...");
      _wlog("📍 Browser:", navigator.userAgent);
      _wlog("📍 Secure context:", window.isSecureContext);
      _wlog("📍 MediaDevices available:", !!navigator.mediaDevices);

      // Check if we're in a secure context (HTTPS)
      if (!window.isSecureContext) {
        console.error("❌ Not in secure context - HTTPS required for microphone access");
        updateStatus("❌ HTTPS required", "disconnected");
        alert("🔒 Microphone access requires HTTPS.\n\nPlease access this page using a secure HTTPS connection.");
        isConnecting = false;
        connectBtn.disabled = false;
        return;
      }

      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("❌ MediaDevices API not available");
        updateStatus("❌ Browser not supported", "disconnected");
        alert("❌ Microphone API not available.\n\nPlease use a modern browser (Chrome, Firefox, Safari, Edge).");
        isConnecting = false;
        connectBtn.disabled = false;
        return;
      }

      // ✅ CRITICAL: Check permission state - STOP if denied
      let permissionState = "prompt";
      try {
        const permissionStatus = await navigator.permissions.query({ name: "microphone" });
        permissionState = permissionStatus.state;
        _wlog("📍 Microphone permission state:", permissionState);

        if (!isConnecting) {
          _wlog("❌ Connection cancelled during permission check");
          return;
        }

        if (permissionState === "denied") {
          console.error("❌ Microphone permission DENIED - stopping");
          updateStatus("❌ Microphone blocked", "disconnected");
          alert(
            "🎤 Microphone Access Blocked\n\n" +
            "To enable microphone:\n\n" +
            "Chrome/Edge:\n" +
            "1. Click the 🔒 lock icon in the address bar\n" +
            "2. Find 'Microphone' and select 'Allow'\n" +
            "3. Refresh the page\n\n" +
            "Firefox:\n" +
            "1. Click the 🔒 icon in the address bar\n" +
            "2. Click the arrow next to 'Blocked Temporarily'\n" +
            "3. Select 'Allow'\n\n" +
            "Safari:\n" +
            "1. Go to Safari → Settings → Websites → Microphone\n" +
            "2. Find this website and select 'Allow'\n" +
            "3. Refresh the page"
          );
          isConnecting = false;
          connectBtn.disabled = false;
          connectBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
          connectBtn.classList.remove("connected");
          return;
        }
      } catch (permError) {
        console.warn("⚠️ Could not query permission state:", permError);
        // Continue - some browsers don't support permissions API
      }

      // ✅ Show status - requesting permission
      updateStatus("🎤 Requesting microphone...", "connecting");

      if (!isConnecting) {
        _wlog("❌ Connection cancelled before requesting microphone");
        return;
      }

      // ✅ CRITICAL: ONE explicit request, ONCE, on user action
      try {
        _wlog("🎤 Requesting getUserMedia (user clicked button)...");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
            channelCount: 1,
            sampleRate: 48000,
            sampleSize: 16,
          },
        });

        _wlog("✅ Microphone permission GRANTED");
        updateStatus("✅ Microphone enabled", "connecting");

        // Stop the test stream immediately - LiveKit will create its own
        stream.getTracks().forEach((track) => track.stop());

      } catch (micError) {
        console.error("❌ Microphone request failed:", micError);
        updateStatus("❌ Microphone denied", "disconnected");

        if (micError.name === "NotAllowedError") {
          alert(
            "🎤 Microphone Access Denied\n\n" +
            "You clicked 'Block' or 'Deny'.\n\n" +
            "To fix:\n" +
            "1. Click the 🔒 lock icon in your browser's address bar\n" +
            "2. Find 'Microphone' permission\n" +
            "3. Change it to 'Allow'\n" +
            "4. Refresh the page and try again"
          );
        } else if (micError.name === "NotFoundError") {
          alert(
            "❌ No Microphone Found\n\n" +
            "Please:\n" +
            "1. Connect a microphone to your device\n" +
            "2. Check your system sound settings\n" +
            "3. Try again"
          );
        } else {
          alert(`❌ Microphone Error\n\n${micError.message}\n\nPlease check your browser settings.`);
        }

        isConnecting = false;
        connectBtn.disabled = false;
        connectBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
        connectBtn.classList.remove("connected");
        return;
      }

      // Check if connection was cancelled after microphone permission
      if (!isConnecting) {
        _wlog("❌ Connection cancelled after microphone permission");
        return;
      }

      hasReceivedFirstAIResponse = false;
      firstResponseReceived = false;
      audioStreamComplete = false; // Clear any existing timeouts
      if (connectionTimeout) clearTimeout(connectionTimeout);
      if (aiResponseTimeout) clearTimeout(aiResponseTimeout);

      // Check if connection was cancelled before setting timeout
      if (!isConnecting) {
        _wlog("❌ Connection cancelled before setting timeout");
        return;
      }

      // Set connection timeout
      connectionTimeout = setTimeout(() => {
        if (!isConnected) {
          console.error("❌ Connection timeout - AI server not responding");
          updateStatus(
            "⚠️ Connection timeout - Please try again",
            "disconnected"
          );
          alert("Connection timeout. Please start a new call.");
          stopConversation();
        }
      }, CONNECTION_TIMEOUT);

      const selectedLanguage = languageSelect.value;
      const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent)
        ? "mobile"
        : "desktop";

      // Optimized audio configuration for feedback prevention and user input
      const audioConfig = {
        // Enhanced feedback prevention
        echoCancellation: true, // Critical for feedback prevention
        noiseSuppression: true, // Remove background noise
        autoGainControl: true, // Enable AGC for stable levels

        // Advanced feedback prevention options
        suppressLocalAudioPlayback: true, // Prevent local audio feedback

        // Constraints for user input detection
        channelCount: 1,
        sampleRate: 48000,
        sampleSize: 16,

        // Optimized volume for feedback prevention
        volume: 0.5, // Lower volume to prevent feedback
        latency: 0.1, // Slightly higher latency for stability

        // Device constraints
        facingMode: "user",
        deviceId: "default",

        // Browser-specific feedback prevention
        googEchoCancellation: true,
        googAutoGainControl: true, // Enable for feedback prevention
        googNoiseSuppression: true,
        googHighpassFilter: true, // Remove low frequencies that cause feedback
        googAudioMirroring: false,

        // Additional experimental options for feedback prevention
        googBeamforming: false, // Disable to prevent feedback amplification
        googArrayGeometry: false, // Disable array processing
        mozAutoGainControl: true, // Firefox feedback prevention
        mozNoiseSuppression: true,
      };

      // Check LiveKit support - load if not available
      if (typeof LivekitClient === "undefined") {
        _wlog("📦 LiveKit not loaded, loading now...");
        updateStatus("Loading LiveKit...", "connecting");
        
        try {
          await loadLiveKitSDK();
          _wlog("✅ LiveKit loaded successfully");
        } catch (error) {
          console.error("❌ Failed to load LiveKit SDK:", error);
          updateStatus("❌ Failed to load audio library", "disconnected");
          alert("Failed to load audio library. Please refresh the page and try again.");
          throw new Error("LiveKit failed to load");
        }
        
        // Check again after loading
        if (typeof LivekitClient === "undefined") {
          console.error("❌ LiveKit still not available after loading");
          updateStatus("❌ Audio library not available", "disconnected");
          alert("Audio library could not be loaded. Please refresh the page.");
          throw new Error("LiveKit not available");
        }
      }

      updateStatus("Connecting...", "connecting");

      // Check if connection was cancelled before token request
      if (!isConnecting) {
        _wlog("❌ Connection cancelled before token request");
        return;
      }

      // Get LiveKit token from backend
      const roomName = `call-${Date.now()}`;
      // Don't set currentCallId yet - wait until token is successfully received
      
      // Get agent ID and user ID from configuration or script data attributes
      let agentId = "6982da5442c2d51081738c0c"; // default fallback
      // Start with globally resolved tenant ID (set at init time in checkAgentStatusOnLoad)
      let userId = globalTenantId || null;
      if (userId) {
        _wlog("👤 Using globalTenantId for tenant_id:", userId);
      }
      
      _wlog("🔍 Debug: window.SHIVAI_CONFIG:", window.SHIVAI_CONFIG);
      _wlog("🔍 Debug: document.currentScript:", document.currentScript);
      
      // First try to get from URL parameters of the widget script
      const scriptTags = document.getElementsByTagName('script');
      let foundFromUrl = false;
      
      for (let i = scriptTags.length - 1; i >= 0; i--) {
        const script = scriptTags[i];
        if (script.src && (script.src.includes('/widget2.js') || script.src.includes('/widget3.js') || script.src.includes('/widget4.js') || script.src.includes('/widget.js'))) {
          const url = new URL(script.src);
          const urlAgentId = url.searchParams.get('agentId');
          const urlUserId = url.searchParams.get('userId');
          if (urlAgentId) {
            agentId = urlAgentId;
            foundFromUrl = true;
            _wlog("🎯 Using agentId from URL parameter:", agentId);
          }
          if (urlUserId) {
            userId = urlUserId; // URL always wins over globalTenantId
            _wlog("👤 Using userId from URL parameter:", userId);
          }
          if (foundFromUrl) break;
        }
      }
      
      if (!foundFromUrl && window.SHIVAI_CONFIG && window.SHIVAI_CONFIG.agentId) {
        agentId = window.SHIVAI_CONFIG.agentId;
        _wlog("🎯 Using agentId from SHIVAI_CONFIG:", agentId);
      }
      // Get userId from SHIVAI_CONFIG if not already from URL
      if (!userId && window.SHIVAI_CONFIG && window.SHIVAI_CONFIG.userId) {
        userId = window.SHIVAI_CONFIG.userId;
        _wlog("👤 Using userId from SHIVAI_CONFIG:", userId);
      }
      if (!foundFromUrl) {
        _wlog("🔍 SHIVAI_CONFIG not found, checking script attributes...");
        const scriptElements = document.querySelectorAll('script[data-agent-id]');
        _wlog("🔍 Found script elements with data-agent-id:", scriptElements);
        
        if (scriptElements.length > 0) {
          const lastScript = scriptElements[scriptElements.length - 1];
          agentId = lastScript.getAttribute('data-agent-id');
          _wlog("🎯 Using agentId from script data attribute:", agentId);
          // Also try to get userId from the same script
          if (!userId && lastScript.getAttribute('data-user-id')) {
            userId = lastScript.getAttribute('data-user-id');
            _wlog("👤 Using userId from script data attribute:", userId);
          }
        }
        else if (document.currentScript && document.currentScript.getAttribute('data-agent-id')) {
          agentId = document.currentScript.getAttribute('data-agent-id');
          _wlog("🎯 Using agentId from current script:", agentId);
          if (!userId && document.currentScript.getAttribute('data-user-id')) {
            userId = document.currentScript.getAttribute('data-user-id');
            _wlog("👤 Using userId from current script:", userId);
          }
        }
        else {
          console.warn("⚠️ No agentId found, using default:", agentId);
        }
      }

      // Validate userId
      if (!userId) {
        console.warn("⚠️ No userId found, tenant_id will not be sent");
      }

      const response = await fetch(
        "https://staging.voice.callshivai.com/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_id: agentId,
            language: selectedLanguage,
            room: roomName,
            device: deviceType,
            user_agent: navigator.userAgent,
            ip: await getClientIP(),
            ...(userId && { tenant_id: userId })
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get LiveKit token: ${response.status}`);
      }

      const data = await response.json();
      window.currentCallId = roomName;
      if (!isConnecting) {
        _wlog("❌ Connection cancelled after token received");
        return;
      }

      if (window.pendingAudioElement) {
        window.pendingAudioElement
          .play()
          .catch((err) => console.warn("⚠️ Still cannot play audio:", err));
        window.pendingAudioElement = null;
      }

      room = new LivekitClient.Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          ...audioConfig,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true, // Enable for feedback prevention
          suppressLocalAudioPlayback: true, // Critical for feedback prevention
        },
        reconnectPolicy: {
          nextRetryDelayInMs: () => 2000, // Slower reconnect to prevent issues
        },
        publishDefaults: {
          audioPreset: LivekitClient.AudioPresets.speech, // Better for voice with feedback prevention
          dtx: true, // Enable discontinuous transmission
          red: false, // Disable redundancy for clarity
          simulcast: false, // Disable simulcast for voice calls
        },
        // Room options for feedback prevention
        e2eeEnabled: false,
        expWebAudioMix: false, // Disable experimental mixing that can cause feedback
      });

      room.on(
        LivekitClient.RoomEvent.TrackSubscribed,
        (track, publication, participant) => {
          if (track.kind === LivekitClient.Track.Kind.Audio) {
            const audioElement = track.attach();
            audioElement.volume = 1.0; // Full volume for clear AI audio
            audioElement.preload = "auto";
            audioElement.autoplay = true;

            if (audioElement.setSinkId) {
              try {
                audioElement.setSinkId("default");
              } catch (err) {
                console.warn("⚠️ Could not set audio sink:", err);
              }
            }

            if (audioElement.webkitAudioDecodedByteCount !== undefined) {
              audioElement.webkitPreservesPitch = false;
            }

            document.body.appendChild(audioElement);

            audioElement.play().catch((error) => {
              console.warn(
                "⚠️ Audio autoplay blocked, will try on user interaction:",
                error
              );
              window.pendingAudioElement = audioElement;
            });

            remoteAudioTrack = track;
            monitorRemoteAudioLevel(track);
            _wlog(
              "🔊 Agent audio track received with feedback prevention"
            );
          }
        }
      );

      room.on(
        LivekitClient.RoomEvent.ParticipantMetadataChanged,
        (metadata, participant) => {
          _wlog("📋 Participant metadata changed:", {
            metadata,
            participant: participant?.identity,
          });
          if (metadata) {
            try {
              const data = JSON.parse(metadata);
              if (data.transcript || data.text) {
                addMessage("assistant", data.transcript || data.text);
                _wlog(
                  "✅ Transcript from participant metadata:",
                  data.transcript || data.text
                );
              }
            } catch (e) {
              _wlog("Metadata not JSON:", metadata);
            }
          }
        }
      );

      room.on(LivekitClient.RoomEvent.RoomMetadataChanged, (metadata) => {
        _wlog("🏠 Room metadata changed:", metadata);
        if (metadata) {
          try {
            const data = JSON.parse(metadata);
            if (data.transcript || data.text) {
              addMessage("assistant", data.transcript || data.text);
              _wlog(
                "✅ Transcript from room metadata:",
                data.transcript || data.text
              );
            }
          } catch (e) {
            _wlog("Room metadata not JSON:", metadata);
          }
        }
      });

      room.on(LivekitClient.RoomEvent.Connected, async () => {
        _wlog("✅ Connected to LiveKit room");
        isConnected = true;
        retryCount = 0; // Reset retry count on successful connection

        // Message interface deferred to hideConnectingState() on first AI audio
        // Clear connection timeout
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }

        updateStatus("🤖 AI is Initializing...", "connected");

        languageSelect.disabled = true;

        // 🎤 Enable microphone with enhanced feedback prevention
        try {
          await room.localParticipant.setMicrophoneEnabled(true, {
            // Enhanced feedback prevention
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true, // Enable for consistent levels and feedback prevention
            suppressLocalAudioPlayback: true, // Critical for feedback prevention

            // Stable audio settings
            channelCount: 1,
            sampleRate: 48000,
            sampleSize: 16,

            // Conservative volume to prevent feedback
            volume: 0.5, // Reduced to prevent feedback loops
            latency: 0.1, // Slightly higher for stability
            facingMode: "user",
          });
          isMuted = false;
          _wlog("🎤 Microphone enabled with optimized settings");
        } catch (micError) {
          console.warn(
            "⚠️ Failed to enable microphone with full config, trying basic:",
            micError
          );
          try {
            // Fallback to basic microphone enabling
            await room.localParticipant.setMicrophoneEnabled(true);
            isMuted = false;
            _wlog("🎤 Microphone enabled (basic mode)");
          } catch (basicError) {
            console.error(
              "❌ Failed to enable microphone completely:",
              basicError
            );
            alert(
              "Failed to enable microphone. Please check your microphone permissions and try again."
            );
          }
        }

        // Call timer starts automatically on first AI audio response
        // (via monitorRemoteAudioLevel to ensure AI is truly ready)

        // Resume audio context if suspended (browser autoplay policy)
        if (window.AudioContext || window.webkitAudioContext) {
          const audioCtx = new (window.AudioContext ||
            window.webkitAudioContext)();
          if (audioCtx.state === "suspended") {
            audioCtx
              .resume()
              .then(() => {
                _wlog(
                  "🔊 Audio context resumed for better audio quality"
                );
              })
              .catch((err) =>
                console.warn("⚠️ Could not resume audio context:", err)
              );
          }
        }

        // Simplified flow - microphone stays enabled
        _wlog(
          "✅ Connection established - microphone ready for conversation"
        );

        // 🎤 Keep microphone ENABLED at all times
        _wlog(
          "🎤 Microphone will remain enabled throughout the conversation"
        );

        // Mobile compatibility - microphone is already enabled
        if (isMobile) {
          _wlog(
            "📱 Mobile device detected - microphone already enabled and ready"
          );
        }

        const audioTracks = Array.from(
          room.localParticipant.audioTrackPublications.values()
        );
        if (audioTracks.length > 0) {
          localAudioTrack = audioTracks[0].track;
          monitorLocalAudioLevel(localAudioTrack);
          _wlog(
            "🎤 Audio track found and monitoring started immediately"
          );
        }

        _wlog("🎤 Microphone enabled and ready for conversation");
      });

      // Room disconnected
      room.on(LivekitClient.RoomEvent.Disconnected, (reason) => {
        _wlog("Disconnected from LiveKit room", reason);
        stopConversation();
      });

      // Connection state change
      room.on(LivekitClient.RoomEvent.ConnectionStateChanged, (state) => {
        _wlog("🔗 Connection state:", state);
        if (state === LivekitClient.ConnectionState.Disconnected) {
          updateStatus(
            "❌ Disconnected - Please start new call",
            "disconnected"
          );
          stopConversation();
        }
      });

      // Data received
      room.on(
        LivekitClient.RoomEvent.DataReceived,
        (payload, participant, kind, topic) => {
          _dbg("📨 DataReceived:", {
            payloadLength: payload.length,
            participant: participant?.identity,
            kind,
            topic,
            timestamp: new Date().toLocaleTimeString(),
          });

          try {
            const decoder = new TextDecoder();
            const text = decoder.decode(payload);
            _dbg("📝 Raw:", text);

            // ── EARLIEST POSSIBLE: handle call_ended before ANY other processing ──
            try {
              const _quick = JSON.parse(text);
              if (_quick && _quick.type === "call_ended") {
                _wlog("📵 [EARLY] call_ended received:", _quick.reason);
                isConnected = false; // prevent alert in Disconnected handler
                // Show immediate feedback while cleanup runs
                updateStatus("Ending call...", "disconnected");
                if (connectBtn) {
                  connectBtn.disabled = true;
                  connectBtn.style.opacity = "0.5";
                }
                stopConversation().finally(() => {
                  if (connectBtn) {
                    connectBtn.disabled = false;
                    connectBtn.style.opacity = "";
                  }
                });
                return;
              }
            } catch (_parseErr) { /* not JSON or no type field, continue normal processing */ }

            if (text && text.trim().length > 0) {
              let transcriptText = text.trim();
              let shouldAddToChat = false;
              let participantName = participant?.identity || "Agent";

              const skipPatterns = [
                "subscribed",
                "connected",
                "disconnected",
                "enabled",
                "disabled",
                "true",
                "false",
                "null",
                "undefined",
              ];

              const shouldSkip = skipPatterns.some(
                (pattern) => text.toLowerCase() === pattern
              );

              if (shouldSkip) {
                _wlog("🚫 Skipping obvious technical message:", text);
                return;
              }

              _dbg("🎯 Processing:", text);

              // Try to parse as JSON first
              try {
                const jsonData = JSON.parse(text);
                _dbg("📋 Parsed JSON:", jsonData);

                // ── PRIORITY: handle call_ended IMMEDIATELY before any other logic ──
                // call_ended is already handled above (early check), skip here
                if (jsonData.type === "call_ended") {
                  return;
                }

                // ── Document / file shared by AI ────────────────────────────
                if (jsonData.type === "document_share" || jsonData.type === "file_share") {
                  _wlog("📎 AI shared a document:", jsonData);
                  addDocumentMessage({
                    url:       jsonData.url       || jsonData.file_url  || jsonData.download_url,
                    name:      jsonData.name      || jsonData.file_name || jsonData.filename || "Document",
                    size:      jsonData.size      || jsonData.file_size || null,
                    mime_type: jsonData.mime_type || jsonData.content_type || jsonData.type_hint || "",
                    type:      jsonData.doc_type  || "",
                    caption:   jsonData.caption   || jsonData.description || "",
                  });
                  return;
                }

                // ── Documents array inside transcription ─────────────────────
                if (Array.isArray(jsonData.documents) && jsonData.documents.length > 0) {
                  _dbg("📎 Documents array in transcript:", jsonData.documents.length, "item(s)");
                  // Delay so the AI text bubble renders first
                  setTimeout(function() {
                    jsonData.documents.forEach(function(doc) {
                      if (doc.url) {
                        addDocumentMessage({
                          url:       doc.url,
                          name:      doc.name      || 'Document',
                          size:      doc.size      || null,
                          mime_type: doc.mime_type || '',
                          type:      doc.type      || '',
                          caption:   doc.description || doc.caption || '',
                        });
                      }
                    });
                  }, 150);
                  // Do NOT return — let the transcript text also render as a chat bubble
                }

                // Look for ANY text field that might contain transcript
                const possibleTextFields = [
                  "text",
                  "transcript",
                  "message",
                  "content",
                  "data",
                  "response",
                  "speech",
                  "voice",
                  "audio",
                  "words",
                  "result",
                  "output",
                ];

                for (const field of possibleTextFields) {
                  if (
                    jsonData[field] &&
                    typeof jsonData[field] === "string" &&
                    jsonData[field].trim().length > 0
                  ) {
                    transcriptText = jsonData[field].trim();
                    shouldAddToChat = true;
                    _dbg(`✅ Found text in field '${field}':`, transcriptText);
                    break;
                  }
                }

                // Check for role information
                let isUser = false;
                if (jsonData.role) {
                  isUser =
                    jsonData.role.includes("user") ||
                    jsonData.role.includes("human");
                } else if (jsonData.speaker) {
                  isUser =
                    jsonData.speaker.includes("user") ||
                    jsonData.speaker.includes("human") ||
                    jsonData.speaker.includes("You");
                } else if (participant) {
                  isUser =
                    participant.identity === room.localParticipant?.identity;
                }

                // Handle status messages for loading states (don't add to chat)
                if (jsonData.type === "status") {
                  _wlog("📊 Status message:", jsonData.text);
                  if (jsonData.text) {
                    updateStatus(jsonData.text, "connecting");
                    
                    // Check if knowledge base is ready
                    if (jsonData.text.toLowerCase().includes("ready")) {
                      _wlog("✅ Knowledge base is ready");
                      knowledgeBaseReady = true;
                      
                      // Start call timer if first response received from AI
                      if (firstResponseReceived && !callTimerStarted) {
                        _wlog("⏱️ Starting call timer (knowledge base ready + first response received)");
                        callTimerStarted = true;
                        updateStatus("✅ Connected - Speak now!", "connected");
                        stopConnectingSound();
                        clearLoadingStatus();
                        hideConnectingState();
                        startCallTimer();
                      }
                    }
                  }
                  return; // Don't add status messages to transcript
                }

                // Handle metrics messages for performance tracking (don't add to chat)
                if (jsonData.type === "metrics" && jsonData.data) {
                  _wlog("📊 Latency metrics received:", jsonData.data);
                  if (jsonData.data.filler !== undefined) latencyMetrics.filler = jsonData.data.filler;
                  if (jsonData.data.qdrant !== undefined) latencyMetrics.qdrant = jsonData.data.qdrant;
                  if (jsonData.data.llm_ttft !== undefined) latencyMetrics.llm_ttft = jsonData.data.llm_ttft;
                  if (jsonData.data.tts_ttfa !== undefined) latencyMetrics.tts_ttfa = jsonData.data.tts_ttfa;
                  if (jsonData.data.first_audio !== undefined) latencyMetrics.first_audio = jsonData.data.first_audio;
                  return; // Don't add metrics to transcript
                }

                // Handle legacy transcript format
                if (jsonData.type === "transcript" && jsonData.text) {
                  if (jsonData.role === "user") {
                    // Allow voice transcripts for user, but skip chat messages
                    if (jsonData.type !== "chat") {
                      if (!lastUserMessageDiv) {
                        lastUserMessageDiv = addMessage("user", jsonData.text);
                      } else {
                        updateMessage(lastUserMessageDiv, jsonData.text);
                      }
                    } else {
                      _wlog(
                        "🚫 Skipping user chat message (already shown from sendMessage)"
                      );
                    }
                  } else if (jsonData.role === "assistant") {
                    addMessage("assistant", jsonData.text);
                    // Track first assistant response
                    if (!firstResponseReceived) {
                      _dbg("✅ First AI response (legacy transcript):", jsonData.text.substring(0,80));
                      firstResponseReceived = true;
                      // Always clear loading state when AI first responds — no knowledgeBaseReady gate
                      if (!callTimerStarted) {
                        callTimerStarted = true;
                        updateStatus("✅ Connected - Speak now!", "connected");
                        stopConnectingSound();
                        clearLoadingStatus();
                        hideConnectingState();
                        startCallTimer();
                      }
                    }
                  }
                  _wlog("✅ Processed legacy format transcript");
                  return;
                }

                if (shouldAddToChat) {
                  const senderRole = isUser ? "user" : "assistant";
                  // Skip typed messages (they have source: 'typed') but allow voice transcripts
                  if (
                    !isUser ||
                    (isUser && jsonData.type !== "chat") ||
                    (isUser && jsonData.source !== "typed")
                  ) {
                    addMessage(senderRole, transcriptText);
                    _dbg("✅ Transcript added:", senderRole, "|", transcriptText.substring(0, 100));
                    // Track first AI response
                    if (!isUser && !firstResponseReceived) {
                      _dbg("✅ First AI response received:", transcriptText.substring(0,80));
                      firstResponseReceived = true;
                      // Always clear loading state when AI first responds — no knowledgeBaseReady gate
                      if (!callTimerStarted) {
                        callTimerStarted = true;
                        updateStatus("✅ Connected - Speak now!", "connected");
                        stopConnectingSound();
                        clearLoadingStatus();
                        hideConnectingState();
                        startCallTimer();
                      }
                    }
                  }
                }
              } catch (e) {
                // Not JSON, treat as plain text
                _dbg("📄 Plain text received:", text);

                // If it's reasonable length text (not just noise), add it
                if (text.length >= 2 && text.length <= 1000) {
                  // Assume it's from assistant unless proven otherwise
                  const isUser =
                    participant &&
                    participant.identity === room.localParticipant?.identity;
                  const senderRole = isUser ? "user" : "assistant";

                  // Add all transcripts (both user voice and assistant)
                  addMessage(senderRole, transcriptText);
                  _dbg("✅ Plain text transcript:", senderRole, "|", transcriptText.substring(0, 100));
                }
              }
            }
          } catch (error) {
            console.error("❌ Error processing DataReceived:", error);
          }
        }
      );

      // CRITICAL: Register text stream handlers BEFORE connecting (exactly like test-client)
      try {
        if (typeof room.registerTextStreamHandler === "function") {
          _wlog("📝 Registering text stream handlers...");

          room.registerTextStreamHandler(
            "lk.transcription",
            async (reader, participantInfo) => {
              _wlog(
                "🎯 Transcription stream from:",
                participantInfo.identity
              );
              try {
                const info = reader.info;
                _wlog("Stream info:", {
                  topic: info.topic,
                  id: info.id,
                  timestamp: info.timestamp,
                  size: info.size,
                  attributes: info.attributes,
                });

                // Check if this is a final transcription
                const isFinal =
                  info.attributes?.["lk.transcription_final"] === "true";
                const transcribedTrackId =
                  info.attributes?.["lk.transcribed_track_id"];
                const segmentId = info.attributes?.["lk.segment_id"];

                _wlog("Transcription attributes:", {
                  isFinal,
                  transcribedTrackId,
                  segmentId,
                });

                // Read the complete text
                const text = await reader.readAll();

                if (text && text.trim()) {
                  const isUser =
                    participantInfo.identity ===
                    room.localParticipant?.identity;
                  const senderName = isUser ? "user" : "assistant";

                  // Prevent duplicate user messages by checking against last sent message
                  if (
                    isUser &&
                    lastSentMessage &&
                    text.trim() === lastSentMessage.trim()
                  ) {
                    _wlog(
                      "🚫 Skipping duplicate user message from transcription:",
                      text
                    );
                    return;
                  }

                  // Also check for any recent user messages with typed source to prevent duplicates
                  if (isUser) {
                    const messagesContainer =
                      document.getElementById("shivai-messages");
                    const lastUserMessage = messagesContainer?.querySelector(
                      ".message.user:last-of-type .message-text"
                    );
                    if (
                      lastUserMessage &&
                      lastUserMessage.textContent.trim() === text.trim()
                    ) {
                      _wlog(
                        "🚫 Skipping duplicate - same message already exists in UI:",
                        text
                      );
                      return;
                    }
                  }

                  // Add transcriptions
                  addMessage(senderName, text);
                  _wlog("✅ Transcription added:", {
                    sender: senderName,
                    text,
                    isFinal,
                  });

                  // Clear loading/connecting state on first AI transcription
                  if (!isUser && !firstResponseReceived) {
                    _wlog("✅ First AI transcription received via lk.transcription stream");
                    firstResponseReceived = true;
                    if (!callTimerStarted) {
                      callTimerStarted = true;
                      updateStatus("✅ Connected - Speak now!", "connected");
                      stopConnectingSound();
                      clearLoadingStatus();
                      hideConnectingState();
                      startCallTimer();
                    }
                  }
                }
              } catch (error) {
                console.error(
                  "❌ Error processing transcription stream:",
                  error
                );
              }
            }
          );

          // Handler for chat messages - THIS IS KEY FOR AI RESPONSES
          room.registerTextStreamHandler(
            "lk.chat",
            async (reader, participantInfo) => {
              _wlog("💬 Chat stream from:", participantInfo.identity);
              try {
                const text = await reader.readAll();
                const isUser =
                  participantInfo.identity === room.localParticipant?.identity;

                if (!isUser && text && text.trim()) {
                  _wlog("💬 AI Chat response received:", text);
                  addMessage("assistant", text, { source: "chat" });
                  _wlog("💬 Chat message added:", {
                    sender: participantInfo.identity,
                    text,
                  });

                  // Clear loading/connecting state on first AI chat message
                  if (!firstResponseReceived) {
                    _wlog("✅ First AI response received via lk.chat stream");
                    firstResponseReceived = true;
                    if (!callTimerStarted) {
                      callTimerStarted = true;
                      updateStatus("✅ Connected - Speak now!", "connected");
                      stopConnectingSound();
                      clearLoadingStatus();
                      hideConnectingState();
                      startCallTimer();
                    }
                  }
                }
              } catch (error) {
                console.error("❌ Error processing chat stream:", error);
              }
            }
          );

          _wlog("✅ Text stream handlers registered successfully");
        } else {
          console.warn(
            "⚠️ registerTextStreamHandler not available, using fallback DataReceived"
          );
        }
      } catch (error) {
        console.error("❌ Error registering text stream handlers:", error);
      }

      // Connect to room
      // Final check before connecting to room
      if (!isConnecting) {
        _wlog("❌ Connection cancelled before room connection");
        return;
      }

      await room.connect(data.url, data.token);
      _wlog("🔗 Room connected successfully");

      // Check if connection was cancelled during room connection
      if (!isConnecting) {
        _wlog("❌ Connection cancelled during room connection");
        if (room) {
          room.disconnect();
          room = null;
        }
        return;
      }

      // Get local audio track and start monitoring (will be null until enabled)
      const audioTracks = Array.from(
        room.localParticipant.audioTrackPublications.values()
      );
      if (audioTracks.length > 0) {
        localAudioTrack = audioTracks[0].track;
        monitorLocalAudioLevel(localAudioTrack);
        _wlog("🎤 Microphone monitoring started");
      }

      _wlog("🎤 Microphone enabled with LiveKit");
    } catch (error) {
      console.error("❌ Connection Error:", error);
      clearLoadingStatus();

      // Clear timeouts
      if (connectionTimeout) clearTimeout(connectionTimeout);
      if (aiResponseTimeout) clearTimeout(aiResponseTimeout);

      // Stop connecting sound on any error
      stopConnectingSound();

      // Show user-friendly error message
      let errorMsg = "Connection failed";
      if (error.message.includes("token")) {
        errorMsg = "Authentication failed";
      } else if (error.message.includes("timeout")) {
        errorMsg = "Connection timeout";
      } else if (error.message.includes("network")) {
        errorMsg = "Network error";
      }

      updateStatus(`❌ ${errorMsg} - Click to retry`, "disconnected");
      console.error("❌ Connection terminated due to error:", error);
      
      // Reset all connection flags
      isConnected = false;
      isConnecting = false;
      isDisconnecting = false;
      
      // Ensure button is clickable for retry
      connectBtn.disabled = false;
      connectBtn.innerHTML =
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
      connectBtn.classList.remove("connected");
      connectBtn.title = "Retry Connection";
      
      alert(`Connection failed: ${errorMsg}. Click the call button to try again.`);
      stopConversation();
    }
  }
  async function stopConversation() {
    _wlog("🛑 stopConversation() called");

    // Stop connecting sound immediately
    stopConnectingSound();

    isConnected = false;
    isConnecting = false;
    isDisconnecting = false; // Always reset so reconnection is possible
    hasReceivedFirstAIResponse = false;
    firstResponseReceived = false;
    shouldAutoUnmute = false;
    isMuted = false;
    aiJustFinished = false;

    // Re-enable connect button so user can retry
    if (connectBtn) {
      connectBtn.disabled = false;
      connectBtn.classList.remove("connected");
      connectBtn.innerHTML =
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
      connectBtn.title = "Start Call";
    }
    if (languageSelect) {
      languageSelect.disabled = false;
    }

    // Hide message interface when disconnected
    hideMessageInterface();
    hideConnectingState();

    stopCallTimer();
    clearLoadingStatus();

    // Clear all timeouts
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }
    if (aiResponseTimeout) {
      clearTimeout(aiResponseTimeout);
      aiResponseTimeout = null;
    }

    // Close WebSocket if exists
    if (ws) {
      _wlog("🔌 Closing WebSocket in stopConversation");
      try {
        ws.close();
      } catch (err) {
        console.warn("Error closing WebSocket in stopConversation:", err);
      }
      ws = null;
    }
    try {
      playSound("call-end");
    } catch (e) {
      console.warn("Could not play call-end sound:", e);
    }
    
    // Clear currentCallId without API call
    if (window.currentCallId) {
      window.currentCallId = null;
    }

    // Disconnect LiveKit room
    if (room) {
      try {
        await room.disconnect();
        _wlog("🔴 LiveKit room disconnected");
      } catch (_e) {
        console.warn("Room already disconnected:", _e);
      }
      room = null;
    }

    localAudioTrack = null;
    remoteAudioTrack = null;

    if (visualizerInterval) {
      clearInterval(visualizerInterval);
      visualizerInterval = null;
      animateVisualizer(false);
    }
    updateStatus("Ready to connect", "disconnected");
    connectBtn.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
    connectBtn.classList.remove("connected");
    connectBtn.title = "Start Call";
    if (muteBtn) {
      muteBtn.style.display = "none";
      muteBtn.classList.remove("muted");
      isMuted = false;
    }
    languageSelect.disabled = false;

    // Remove any attached audio elements
    document.querySelectorAll("audio").forEach((el) => el.remove());

    _wlog("✅ Conversation stopped - LiveKit cleanup complete");
  }

  // Remove unused WebSocket audio streaming function
  function startAudioStreaming() {
    // This function is no longer needed with LiveKit
    _wlog("startAudioStreaming called but not needed with LiveKit");
  }

  function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  function setAssistantSpeaking(isSpeaking, preserveStatus = false) {
    if (assistantSpeaking === isSpeaking) {
      return;
    }
    assistantSpeaking = isSpeaking;
    if (isSpeaking) {
      updateStatus("🔊 Speaking...", "speaking");
    } else if (!preserveStatus) {
      updateStatus("🟢 Connected - Speak naturally!", "connected");
    }
  }
  function setupPlaybackProcessor() {
    if (!audioContext) {
      return;
    }
    teardownPlaybackProcessor();
    playbackBufferQueue = [];
    playbackBufferOffset = 0;
    masterGainNode = audioContext.createGain();
    const masterGainValue = 1.0;
    masterGainNode.gain.setValueAtTime(
      masterGainValue,
      audioContext.currentTime
    );
    masterGainNode.connect(audioContext.destination);
    playbackProcessor = audioContext.createScriptProcessor(4096, 1, 1);
    playbackProcessor.onaudioprocess = handlePlaybackProcess;
    playbackProcessor.connect(masterGainNode);
  }
  function teardownPlaybackProcessor() {
    if (playbackProcessor) {
      playbackProcessor.disconnect();
      playbackProcessor = null;
    }
  }
  function isIOS() {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }
  function handlePlaybackProcess(event) {
    const output = event.outputBuffer.getChannelData(0);
    let offset = 0;
    const baseVolumeGain = isIOS() ? 6.0 : 3.5; // Higher gain for iOS
    const compressionThreshold = isIOS() ? 0.6 : 0.7; // Lower threshold for iOS to handle higher gain
    const compressionRatio = isIOS() ? 0.4 : 0.5; // More aggressive compression for iOS
    if (!audioBufferingStarted && !audioStreamComplete) {
      for (let i = 0; i < output.length; i++) {
        output[i] = 0;
      }
      return;
    }
    while (offset < output.length) {
      if (playbackBufferQueue.length === 0) {
        for (; offset < output.length; offset++) {
          output[offset] = 0;
        }
        if (assistantSpeaking) {
          audioBufferingStarted = false;
          setAssistantSpeaking(false);
        }
        return;
      }
      const currentBuffer = playbackBufferQueue[0];
      const remaining = currentBuffer.length - playbackBufferOffset;
      const samplesToCopy = Math.min(remaining, output.length - offset);
      for (let i = 0; i < samplesToCopy; i++) {
        const rawSample = currentBuffer[playbackBufferOffset + i];
        let processedSample = rawSample * baseVolumeGain;
        const absSample = Math.abs(processedSample);
        if (absSample > compressionThreshold) {
          const excess = absSample - compressionThreshold;
          const compressed = compressionThreshold + excess * compressionRatio;
          processedSample = (processedSample > 0 ? 1 : -1) * compressed;
        }
        // Enhanced clipping prevention for iOS
        const maxOutput = isIOS() ? 0.92 : 0.95; // Slightly more conservative clipping for iOS
        processedSample = Math.max(
          -maxOutput,
          Math.min(maxOutput, processedSample)
        );
        output[offset + i] = processedSample;
      }
      offset += samplesToCopy;
      playbackBufferOffset += samplesToCopy;
      if (playbackBufferOffset >= currentBuffer.length) {
        playbackBufferQueue.shift();
        playbackBufferOffset = 0;
      }
    }
  }
  function scheduleAudioChunk(pcmBuffer) {
    if (!audioContext) {
      return;
    }
    if (!playbackProcessor) {
      setupPlaybackProcessor();
    }
    const float32 = pcm16ToFloat32(pcmBuffer);
    if (float32.length === 0) {
      return;
    }
    playbackBufferQueue.push(float32);
    if (
      !audioBufferingStarted &&
      playbackBufferQueue.length >= minBufferChunks
    ) {
      audioBufferingStarted = true;
      setAssistantSpeaking(true);
    }
  }
  function pcm16ToFloat32(pcmBuffer) {
    const pcm16 = new Int16Array(pcmBuffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 0x8000;
    }
    return float32;
  }
  function stopAllScheduledAudio(options = {}) {
    const preserveStatus = options.preserveStatus === true;
    stopRingSound();
    stopConnectingSound(); // Stop connecting sound when stopping all audio
    playbackBufferQueue = [];
    playbackBufferOffset = 0;
    audioBufferingStarted = false;
    audioStreamComplete = false;
    setAssistantSpeaking(false, preserveStatus);
  }
  function convertFloat32ToPCM16(float32Array) {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return pcm16.buffer;
  }
  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  window.addEventListener("beforeunload", () => {
    stopConversation();
  });

  // Loads the LiveKit SDK then builds the widget. Guarded so it runs only once.
  function bootstrapWidget() {
    if (widgetInitialized) return;
    widgetInitialized = true;
    loadLiveKitSDK()
      .then(() => {
        _wlog("🚀 Initializing widget with LiveKit support");
        return initWidget();
      })
      .catch((error) => {
        console.error("❌ Failed to load LiveKit SDK:", error);
        _wlog("⚠️ Initializing widget anyway (LiveKit features may not work)");
        return initWidget();
      })
      .finally(() => {
        // Re-apply visibility in case the route changed during async init.
        applyRouteVisibility();
      });
  }

  // Entry point: only start on the landing page; otherwise stay dormant.
  // Always hook SPA navigation so a later visit to "/" lazily boots the widget.
  function startWidget() {
    hookSpaNavigation();
    if (isLandingRoute()) {
      bootstrapWidget();
    } else {
      _wlog("⏭️ ShivAI widget suppressed — not on landing route:", window.location.pathname);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startWidget);
  } else {
    startWidget();
  }
})(window, document);
