(function () {
  "use strict";

  // ✅ Load LiveKit SDK dynamically
  function loadLiveKitSDK() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (typeof LivekitClient !== "undefined") {
        console.log("✅ LiveKit already loaded");
        resolve();
        return;
      }

      console.log("📦 Loading LiveKit SDK...");

      // Load livekit-client directly (components-core not needed)
      const clientScript = document.createElement("script");
      clientScript.src =
        "https://unpkg.com/livekit-client@latest/dist/livekit-client.umd.js";
      clientScript.onload = () => {
        console.log("✅ LiveKit client loaded successfully");
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
  console.log("📱 Mobile browser detected:", isMobile);
  let ringAudio = null;
  let messageBubble = null;
  let connectionTimeout = null;
  let aiResponseTimeout = null;
  let retryCount = 0;
  const MAX_RETRIES = 0; // No retries - terminate immediately on error
  const CONNECTION_TIMEOUT = 15000; // 15 seconds
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

  // Helper function to get company info from URL parameters
  function getCompanyInfo() {
    let companyName = "ShivAI";
    let companyDescription = "AI-Powered Support";
    let agentName = "AI Assistant";
    let companyLogo = ""; // Empty means use default ShivAI logo
    let themeColors = {
      primaryColor: "#4b5563",
      secondaryColor: "#ffffff", 
      accentColor: "#2563eb"
    };
    
    try {
      // Get from URL parameters
      const scriptTags = document.getElementsByTagName('script');
      for (let i = scriptTags.length - 1; i >= 0; i--) {
        const script = scriptTags[i];
        if (script.src && script.src.includes('/widget.js')) {
          try {
            const url = new URL(script.src);
            const urlCompanyName = url.searchParams.get('companyName');
            const urlCompanyDescription = url.searchParams.get('companyDescription');
            const urlAgentName = url.searchParams.get('agentName');
            if (urlCompanyName) {
              companyName = decodeURIComponent(urlCompanyName);
              console.log("🏢 Using companyName from URL parameter:", companyName);
            }
            if (urlCompanyDescription) {
              companyDescription = decodeURIComponent(urlCompanyDescription);
              console.log("📄 Using companyDescription from URL parameter:", companyDescription);
            }
            if (urlAgentName) {
              agentName = decodeURIComponent(urlAgentName);
              console.log("🤖 Using agentName from URL parameter:", agentName);
            }
            break;
          } catch (urlError) {
            console.warn("⚠️ Error parsing script URL:", urlError);
            continue;
          }
        }
      }
      
      // Get company logo from SHIVAI_CONFIG (not URL to avoid length issues)
      if (window.SHIVAI_CONFIG && window.SHIVAI_CONFIG.content && window.SHIVAI_CONFIG.content.companyLogo) {
        companyLogo = window.SHIVAI_CONFIG.content.companyLogo;
        console.log("🖼️ Using companyLogo from SHIVAI_CONFIG");
      }
      
      // Get theme colors from SHIVAI_CONFIG
      if (window.SHIVAI_CONFIG && window.SHIVAI_CONFIG.theme) {
        if (window.SHIVAI_CONFIG.theme.primaryColor) {
          themeColors.primaryColor = window.SHIVAI_CONFIG.theme.primaryColor;
        }
        if (window.SHIVAI_CONFIG.theme.secondaryColor) {
          themeColors.secondaryColor = window.SHIVAI_CONFIG.theme.secondaryColor;
        }
        if (window.SHIVAI_CONFIG.theme.accentColor) {
          themeColors.accentColor = window.SHIVAI_CONFIG.theme.accentColor;
        }
        console.log("🎨 Using theme colors from SHIVAI_CONFIG:", themeColors);
      }
      
    } catch (error) {
      console.warn("⚠️ Error getting company info from URL parameters, using defaults:", error);
    }
    
    const result = { 
      name: companyName, 
      description: companyDescription,
      agentName: agentName,
      logo: companyLogo,
      theme: themeColors
    };
    console.log("✅ Final company info being used:", result);
    return result;
  }
  let currentMessageIndex = 0;
  let messageInterval = null;
  let triggerBtn = null;
  let widgetContainer = null;
  let landingView = null;
  let callView = null;
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
  // Enhanced microphone permission handler with retry logic
  async function requestMicrophonePermission(retryCount = 0) {
    const MAX_RETRIES = 3;
    
    console.log(`🎤 Requesting microphone permission (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
    
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
      
      console.log("✅ Microphone permission granted!");
      console.log("📍 Stream tracks:", stream.getTracks().length);
      
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
            console.log("❌ User cancelled microphone permission retry");
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
    console.log("🎨 Widget theme refreshed with new colors");
  }

  // Expose refresh function globally for theme updates
  window.ShivAIWidget = window.ShivAIWidget || {};
  window.ShivAIWidget.refreshTheme = refreshWidgetTheme;

  function initWidget() {
    createWidgetUI();
    setupEventListeners();
    initSoundContext();
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
              console.log("🔊 Sound context resumed");
            })
            .catch((err) => {
              console.warn("Failed to resume sound context:", err);
            });
          if (audioContext && audioContext.state === "suspended") {
            audioContext
              .resume()
              .then(() => {
                console.log("🎤 Voice audio context resumed");
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
        ringAudio = new Audio("./assets/Rings/ring1.mp3");
        ringAudio.volume = 0.7;
      }
      ringAudio.loop = true; // Loop until stopped
      ringAudio.currentTime = 0;
      ringAudio.play().catch((error) => {
        console.warn("Could not play connecting sound:", error);
      });
      console.log("🔊 Playing connecting sound (ring1.mp3)");
    } catch (error) {
      console.warn("Error playing connecting sound:", error);
    }
  }

  function stopConnectingSound() {
    console.log("🔇 Stopping connecting sound...");

    if (ringAudio) {
      try {
        ringAudio.pause();
        ringAudio.currentTime = 0;
        ringAudio.loop = false;
        console.log("✅ Ring audio stopped");
      } catch (error) {
        console.warn("⚠️ Error stopping ring audio:", error);
      }
    }

    if (connectingSoundInterval) {
      clearInterval(connectingSoundInterval);
      connectingSoundInterval = null;
      console.log("✅ Connecting sound interval cleared");
    }
  }

  function playRingSound() {
    try {
      if (!ringAudio) {
        ringAudio = new Audio("./assets/Rings/ring1.mp3");
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
          console.log("🌐 [IP] Retrieved via ipapi.co:", data.ip);
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
          console.log("🌐 [IP] Retrieved via ipify:", data.ip);
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
          console.log("🌐 [IP] Retrieved via ipinfo.io:", data.ip);
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

      console.log(
        `🎤 Audio Level: ${audioLevel.toFixed(2)} (threshold: ${SPEECH_THRESHOLD})`
      );

      if (audioLevel > SPEECH_THRESHOLD) {
        // User is speaking
        if (!latencyMetrics.isSpeaking) {
          latencyMetrics.isSpeaking = true;
          latencyMetrics.userSpeechStartTime = performance.now();
          console.log("👤 User started speaking");
          updateStatus("🎤 Listening...", "listening");
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
            console.log("👤 User stopped speaking");
            updateStatus("🤔 Processing...", "speaking");
            silenceStart = null;
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
    const SPEECH_THRESHOLD = 35; // Increased from 12 to 35 for close voices only

    function checkAudioLevel() {
      // Clear AI response timeout when agent starts speaking
      if (aiResponseTimeout && !hasReceivedFirstAIResponse) {
        clearTimeout(aiResponseTimeout);
        aiResponseTimeout = null;
        console.log("✅ AI response received - timeout cleared");
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

      console.log(
        `🤖 AI Audio Level: ${audioLevel.toFixed(2)} (threshold: ${SPEECH_THRESHOLD}, peak: ${peak})`
      );

      if (audioLevel > SPEECH_THRESHOLD && !latencyMetrics.isAgentSpeaking) {
        // Agent started responding
        latencyMetrics.isAgentSpeaking = true;

        // Start timer on first AI response
        if (!hasReceivedFirstAIResponse) {
          hasReceivedFirstAIResponse = true;
          startCallTimer();

          // Stop connecting sound when AI first responds
          stopConnectingSound();

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
                  console.log("🎤 Microphone monitoring started immediately");
                }

                console.log(
                  "🎤 Microphone enabled immediately - ready for conversation"
                );
                updateStatus("🎤 You can speak now!", "connected");
              } catch (error) {
                console.error("❌ Error enabling microphone:", error);
              }
            })();
          }

          console.log(
            "🎉 First AI response - timer started, connecting sound stopped, mic will unmute in 3s"
          );
        }

        // Always update status when AI starts speaking
        updateStatus("🤖 AI Speaking...", "speaking");

        if (latencyMetrics.userSpeechEndTime) {
          latencyMetrics.agentResponseStartTime = performance.now();
          const latency =
            latencyMetrics.agentResponseStartTime -
            latencyMetrics.userSpeechEndTime;

          latencyMetrics.measurements.push(latency);
          if (latencyMetrics.measurements.length > latencyMetrics.maxSamples) {
            latencyMetrics.measurements.shift();
          }

          console.log(`⚡ Response latency: ${Math.round(latency)}ms`);

          latencyMetrics.userSpeechEndTime = null;
        }
      } else if (
        average <= SPEECH_THRESHOLD &&
        latencyMetrics.isAgentSpeaking
      ) {
        latencyMetrics.isAgentSpeaking = false;
        aiJustFinished = true; // Set flag to prevent immediate feedback detection

        // Clear the flag after a delay to allow user input
        setTimeout(() => {
          aiJustFinished = false;
          console.log(
            "✅ User input detection re-enabled after AI buffer period"
          );
        }, 500); // 500ms buffer to prevent feedback

        updateStatus("🟢 Connected - Speak naturally!", "connected");
        console.log("🤖 AI stopped speaking - buffer period started");
      }

      requestAnimationFrame(checkAudioLevel);
    }

    checkAudioLevel();
  }

  function makeDraggable(element) {
    let isDragging = false;
    let startX, startY, initialX, initialY;
    let dragTimeout;
    element.style.cursor = "move";
    element.addEventListener("mousedown", startDrag);
    element.addEventListener("touchstart", startDrag, { passive: false });
    function startDrag(e) {
      e.preventDefault();
      if (dragTimeout) {
        clearTimeout(dragTimeout);
      }
      dragTimeout = setTimeout(() => {
        isDragging = true;
        element.style.transition = "none";
        if (e.type === "mousedown") {
          startX = e.clientX;
          startY = e.clientY;
        } else {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
        }
        const rect = element.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        document.addEventListener("mousemove", drag);
        document.addEventListener("mouseup", stopDrag);
        document.addEventListener("touchmove", drag, { passive: false });
        document.addEventListener("touchend", stopDrag);
        element.classList.add("dragging");
      }, 100);
    }
    function drag(e) {
      if (!isDragging) return;
      e.preventDefault();
      let currentX, currentY;
      if (e.type === "mousemove") {
        currentX = e.clientX;
        currentY = e.clientY;
      } else {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
      }
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      let newX = initialX + deltaX;
      let newY = initialY + deltaY;
      const elementRect = element.getBoundingClientRect();
      const maxX = window.innerWidth - elementRect.width;
      const maxY = window.innerHeight - elementRect.height;
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      element.style.position = "fixed";
      element.style.left = newX + "px";
      element.style.top = newY + "px";
      element.style.bottom = "auto";
      element.style.right = "auto";
    }
    function stopDrag(e) {
      if (dragTimeout) {
        clearTimeout(dragTimeout);
        dragTimeout = null;
      }
      if (isDragging) {
        isDragging = false;
        element.style.transition = "";
        element.classList.remove("dragging");
      }
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("mouseup", stopDrag);
      document.removeEventListener("touchmove", drag);
      document.removeEventListener("touchend", stopDrag);
    }
  }
  function makeWidgetDraggable(widgetElement) {
    let isDragging = false;
    let startX, startY, initialX, initialY;
    let dragTimeout;
    const headers = widgetElement.querySelectorAll(
      ".widget-header, .call-header"
    );
    headers.forEach((header) => {
      header.style.cursor = "move";
      header.addEventListener("mousedown", startDrag);
      header.addEventListener("touchstart", startDrag, { passive: false });
    });
    function startDrag(e) {
      if (
        e.target.classList.contains("widget-close") ||
        e.target.closest(".widget-close") ||
        e.target.classList.contains("start-call-btn") ||
        e.target.closest(".start-call-btn") ||
        e.target.classList.contains("back-btn") ||
        e.target.closest(".back-btn") ||
        e.target.classList.contains("language-select-styled-landing") ||
        e.target.closest(".language-section-landing") ||
        e.target.classList.contains("privacy-link") ||
        e.target.tagName === "SELECT" ||
        e.target.tagName === "OPTION"
      ) {
        return;
      }
      e.preventDefault();
      if (dragTimeout) {
        clearTimeout(dragTimeout);
      }
      dragTimeout = setTimeout(() => {
        isDragging = true;
        widgetElement.style.transition = "none";
        if (e.type === "mousedown") {
          startX = e.clientX;
          startY = e.clientY;
        } else {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
        }
        const rect = widgetElement.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        document.addEventListener("mousemove", drag);
        document.addEventListener("mouseup", stopDrag);
        document.addEventListener("touchmove", drag, { passive: false });
        document.addEventListener("touchend", stopDrag);
        widgetElement.classList.add("dragging");
      }, 100);
    }
    function drag(e) {
      if (!isDragging) return;
      e.preventDefault();
      let currentX, currentY;
      if (e.type === "mousemove") {
        currentX = e.clientX;
        currentY = e.clientY;
      } else {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
      }
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      let newX = initialX + deltaX;
      let newY = initialY + deltaY;
      const elementRect = widgetElement.getBoundingClientRect();
      const maxX = window.innerWidth - elementRect.width;
      const maxY = window.innerHeight - elementRect.height;
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      widgetElement.style.position = "fixed";
      widgetElement.style.left = newX + "px";
      widgetElement.style.top = newY + "px";
      widgetElement.style.bottom = "auto";
      widgetElement.style.right = "auto";
    }
    function stopDrag(e) {
      if (dragTimeout) {
        clearTimeout(dragTimeout);
        dragTimeout = null;
      }
      if (isDragging) {
        isDragging = false;
        widgetElement.style.transition = "";
        widgetElement.classList.remove("dragging");
      }
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("mouseup", stopDrag);
      document.removeEventListener("touchmove", drag);
      document.removeEventListener("touchend", stopDrag);
    }
  }
  function makeTriggerBtnDraggable(btnElement) {
    let isDragging = false;
    let startX, startY, initialX, initialY;
    let dragTimeout;
    btnElement.addEventListener("mousedown", startDrag);
    btnElement.addEventListener("touchstart", startDrag, { passive: false });
    function startDrag(e) {
      if (dragTimeout) {
        clearTimeout(dragTimeout);
      }
      dragTimeout = setTimeout(() => {
        isDragging = true;
        btnElement.style.transition = "none";
        if (e.type === "mousedown") {
          startX = e.clientX;
          startY = e.clientY;
        } else {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
        }
        const rect = btnElement.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        document.addEventListener("mousemove", drag);
        document.addEventListener("mouseup", stopDrag);
        document.addEventListener("touchmove", drag, { passive: false });
        document.addEventListener("touchend", stopDrag);
        btnElement.classList.add("dragging");
      }, 100);
    }
    function drag(e) {
      if (!isDragging) return;
      e.preventDefault();
      let currentX, currentY;
      if (e.type === "mousemove") {
        currentX = e.clientX;
        currentY = e.clientY;
      } else {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
      }
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      let newX = initialX + deltaX;
      let newY = initialY + deltaY;
      const elementRect = btnElement.getBoundingClientRect();
      const maxX = window.innerWidth - elementRect.width;
      const maxY = window.innerHeight - elementRect.height;
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      btnElement.style.position = "fixed";
      btnElement.style.left = newX + "px";
      btnElement.style.top = newY + "px";
      btnElement.style.bottom = "auto";
      btnElement.style.right = "auto";
      if (messageBubble) {
        const bubbleOffset = 70;
        messageBubble.style.left = newX - messageBubble.offsetWidth - 10 + "px";
        messageBubble.style.top =
          newY + elementRect.height / 2 - messageBubble.offsetHeight / 2 + "px";
        messageBubble.style.bottom = "auto";
        messageBubble.style.right = "auto";
      }
    }
    function stopDrag(e) {
      if (dragTimeout) {
        clearTimeout(dragTimeout);
        dragTimeout = null;
      }
      if (isDragging) {
        isDragging = false;
        btnElement.style.transition = "";
        btnElement.classList.remove("dragging");
      }
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("mouseup", stopDrag);
      document.removeEventListener("touchmove", drag);
      document.removeEventListener("touchend", stopDrag);
    }
  }
  function createWidgetUI() {
    triggerBtn = document.createElement("button");
    triggerBtn.className = "shivai-trigger shivai-neon-pulse";
    triggerBtn.innerHTML = `
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
      </svg>
    `;
    triggerBtn.setAttribute("aria-label", "Open ShivAI Assistant");
    widgetContainer = document.createElement("div");
    widgetContainer.className = "shivai-widget";
    landingView = document.createElement("div");
    landingView.className = "landing-view";
    
    // Get company info for dynamic content
    const companyInfo = getCompanyInfo();
    console.log("🏢 Using company info:", companyInfo);
    
    landingView.innerHTML = `
      <div class="widget-header">
        <div class="header-content">
          <button class="widget-close" aria-label="Close widget">×</button>
          <div class="header-info">
            <div class="widget-avatar">
            ${companyInfo.logo ? 
              `<img src="${companyInfo.logo}" alt="${companyInfo.name} Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">` :
              `<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 1500">
      <defs>
        <style>
          .cls-1 {
            stroke-width: 0px;
          }
        </style>
      </defs>
      <path class="cls-1" d="m404.66,608.33c-9.95-7.3-50.21-35.08-105.88-29.33-26.64,2.75-47.74,12.25-62.31,21.06-14.39,8.7-26.96,20.35-35.39,34.9-12.13,20.93-15.94,45.25-9.6,67.8,4.02,14.28,11.39,25.29,18.63,33.3,6.91,7.65,15.23,13.89,24.25,18.89,25.77,14.32,51.54,28.63,77.31,42.95,11.98,7.56,18.69,20.94,17.17,34.34-.11,1.01-.27,1.98-.47,2.93-2.85,13.83-15.4,23.46-29.5,24.28-8.62.5-18.56.28-29.41-1.45-34.59-5.51-58.34-23.08-69.39-32.54-13.35,21.1-26.71,42.2-40.06,63.3,13.96,9.75,32.81,20.78,56.52,29.33,42.03,15.17,79.38,15.38,102.3,13.59,7.85-.92,45.14-6.13,72.25-39.35,1.28-1.57,2.49-3.15,3.65-4.73,27.87-38.33,23.14-92-9.89-125.97-.3-.31-.6-.62-.91-.93-17.09-17.27-35.69-27.61-51.02-33.85-19.44-7.9-38.05-17.71-55.07-29.99-.78-.56-1.56-1.12-2.33-1.68-9.66-6.97-12.29-20.21-6.03-30.34h0c7.3-11.68,22.31-17.66,37.92-15.02,8.22-.53,21.33-.36,36.48,4.29,15.34,4.71,26.38,12.07,32.91,17.17,9.3-20.98,18.6-41.97,27.9-62.95Z"/>
      <path class="cls-1" d="m630.61,740.85c-3.86-4.46-8.41-8.89-13.76-13.05-17.19-13.34-35.56-18.29-49.77-19.92-15.45-1.76-31.19.76-45.13,7.63-.08.04-.16.08-.25.12-13.14,6.52-22.41,14.79-28.33,21.1v-169.18h-72.25v358.41h72.25v-130.44c9.49-21.4,30.88-33.36,50.51-29.8,3.55.64,6.78,1.75,9.71,3.15,14.12,6.76,22.48,21.69,22.48,37.35v119.75h73.68v-132.05c0-19.38-6.46-38.41-19.14-53.06Z"/>
      <rect class="cls-1" x="662.56" y="712.06" width="74.4" height="213.9"/>
      <path class="cls-1" d="m953.03,825.14c-13.76,33.61-27.52,67.21-41.28,100.82h84.42l25.75-67.96c-8.94-6.55-20.41-13.83-34.43-20.38-12.7-5.93-24.48-9.84-34.47-12.48Z"/>
      <circle class="cls-1" cx="1270.13" cy="623.35" r="45.07"/>
      <circle class="cls-1" cx="699.76" cy="623.35" r="45.07"/>
      <path class="cls-1" d="m954.09,822.73l95.6-235.02h71.13l94.46,235.02c-13.9-.54-54.29-3.99-86.12-34.9-26-25.25-33.27-56.18-36.12-68.31-.48-2.06-.75-3.53-1.31-6.44-4.83-25.25-5.11-43.74-5.38-76.6-.22-27.23-.29-45.31-.45-45.31-.19,0-.33,26.01-1.25,51.3-.44,12.07-.99,22.81-.99,22.81-.31,5.8-.54,8.99-.78,14.32-.97,21.54-.88,21.8-1.44,25.22-2.48,15.29-13.28,66.99-58.46,96.77-27.62,18.21-55.44,20.82-68.92,21.15Z"/>
      <path class="cls-1" d="m1215.73,825.86c-6.37.43-13.66,1.49-21.51,3.68-22.94,6.41-38.73,19.17-47.51,27.69,7.45,22.45,14.9,44.91,22.35,67.36h137.14v-101.86l-72.84,3.12.57,47.8-18.21-47.8Z"/>
      <polygon class="cls-1" points="1233.94 716.32 1306.21 716.32 1306.21 825.14 1233.94 822.21 1233.94 716.32"/>
      <path class="cls-1" d="m872.77,821c22.25.49,44.49.98,66.74,1.47,18.21-35.7,36.41-71.4,54.62-107.1l-80.12-3.31-48.65,116.61h-5.72l-51.51-116.61h-72.25v27.9l98.72,186h52.22c17.12-33.61,34.25-67.21,51.37-100.82-21.81-1.38-43.62-2.76-65.43-4.14Z"/>
    </svg>`
            }
            </div>
            <div class="header-text">
              <div class="widget-title">${companyInfo.agentName}</div>
              <div class="widget-subtitle">${companyInfo.description}.</div>
            </div>
          </div>
        </div>
      </div>
      <div class="widget-body">
        <div class="language-section-landing">
          <label class="language-label-landing">Select your preferred language:</label>
          <select id="shivai-language-landing" class="language-select-styled-landing">
            <option value="ar">🇸🇦 Arabic</option>
            <option value="zh">🇨🇳 Chinese</option>
            <option value="nl">🇳🇱 Dutch</option>
            <option value="en-GB">🇬🇧 English (UK)</option>
            <option value="en-US" selected>🇺🇸 English (US)</option>
            <option value="en-IN">🇮🇳 English (India)</option>
            <option value="fr">🇫🇷 French</option>
            <option value="de">🇩🇪 German</option>
            <option value="hi">🇮🇳 Hindi</option>
            <option value="it">🇮🇹 Italian</option>
            <option value="ja">🇯🇵 Japanese</option>
            <option value="ko">🇰🇷 Korean</option>
            <option value="pt">🇵🇹 Portuguese</option>
            <option value="pl">🇵🇱 Polish</option>
            <option value="ru">🇷🇺 Russian</option>
            <option value="es">🇪🇸 Spanish</option>
            <option value="tr">🇹🇷 Turkish</option>
          </select>
        </div>
        <button class="start-call-btn mx-auto mb-4" id="start-call-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          Start Call
        </button>
        <div class="privacy-text">By using this service you agree to our <span class="privacy-link">T&C</span></div>
      </div>
      <div class="widget-footer" style="padding: 0; margin: 0; background-color: #f9fafb;">
         <div class="footer-text" style="display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; color: #6b7280; flex-wrap: nowrap; line-height: 1;">
          <span>Powered by</span>
          <a href="https://callshivai.com" target="_blank" rel="noopener noreferrer" class="footer-logo-link" style="display: inline-flex; align-items: center; text-decoration: none; cursor: pointer; transition: all 0.2s ease; vertical-align: middle;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 1500" class="footer-logo" style="height: 42px; width: 42px; fill: #3b82f6; display: inline-block; vertical-align: middle; margin-left: -5px;">
              <path class="cls-1" d="m404.66,608.33c-9.95-7.3-50.21-35.08-105.88-29.33-26.64,2.75-47.74,12.25-62.31,21.06-14.39,8.7-26.96,20.35-35.39,34.9-12.13,20.93-15.94,45.25-9.6,67.8,4.02,14.28,11.39,25.29,18.63,33.3,6.91,7.65,15.23,13.89,24.25,18.89,25.77,14.32,51.54,28.63,77.31,42.95,11.98,7.56,18.69,20.94,17.17,34.34-.11,1.01-.27,1.98-.47,2.93-2.85,13.83-15.4,23.46-29.5,24.28-8.62.5-18.56.28-29.41-1.45-34.59-5.51-58.34-23.08-69.39-32.54-13.35,21.1-26.71,42.2-40.06,63.3,13.96,9.75,32.81,20.78,56.52,29.33,42.03,15.17,79.38,15.38,102.3,13.59,7.85-.92,45.14-6.13,72.25-39.35,1.28-1.57,2.49-3.15,3.65-4.73,27.87-38.33,23.14-92-9.89-125.97-.3-.31-.6-.62-.91-.93-17.09-17.27-35.69-27.61-51.02-33.85-19.44-7.9-38.05-17.71-55.07-29.99-.78-.56-1.56-1.12-2.33-1.68-9.66-6.97-12.29-20.21-6.03-30.34h0c7.3-11.68,22.31-17.66,37.92-15.02,8.22-.53,21.33-.36,36.48,4.29,15.34,4.71,26.38,12.07,32.91,17.17,9.3-20.98,18.6-41.97,27.9-62.95Z"/>
              <path class="cls-1" d="m630.61,740.85c-3.86-4.46-8.41-8.89-13.76-13.05-17.19-13.34-35.56-18.29-49.77-19.92-15.45-1.76-31.19.76-45.13,7.63-.08.04-.16.08-.25.12-13.14,6.52-22.41,14.79-28.33,21.1v-169.18h-72.25v358.41h72.25v-130.44c9.49-21.4,30.88-33.36,50.51-29.8,3.55.64,6.78,1.75,9.71,3.15,14.12,6.76,22.48,21.69,22.48,37.35v119.75h73.68v-132.05c0-19.38-6.46-38.41-19.14-53.06Z"/>
              <rect class="cls-1" x="662.56" y="712.06" width="74.4" height="213.9"/>
              <path class="cls-1" d="m953.03,825.14c-13.76,33.61-27.52,67.21-41.28,100.82h84.42l25.75-67.96c-8.94-6.55-20.41-13.83-34.43-20.38-12.7-5.93-24.48-9.84-34.47-12.48Z"/>
              <circle class="cls-1" cx="1270.13" cy="623.35" r="45.07"/>
              <circle class="cls-1" cx="699.76" cy="623.35" r="45.07"/>
              <path class="cls-1" d="m954.09,822.73l95.6-235.02h71.13l94.46,235.02c-13.9-.54-54.29-3.99-86.12-34.9-26-25.25-33.27-56.18-36.12-68.31-.48-2.06-.75-3.53-1.31-6.44-4.83-25.25-5.11-43.74-5.38-76.6-.22-27.23-.29-45.31-.45-45.31-.19,0-.33,26.01-1.25,51.3-.44,12.07-.99,22.81-.99,22.81-.31,5.8-.54,8.99-.78,14.32-.97,21.54-.88,21.8-1.44,25.22-2.48,15.29-13.28,66.99-58.46,96.77-27.62,18.21-55.44,20.82-68.92,21.15Z"/>
              <path class="cls-1" d="m1215.73,825.86c-6.37.43-13.66,1.49-21.51,3.68-22.94,6.41-38.73,19.17-47.51,27.69,7.45,22.45,14.9,44.91,22.35,67.36h137.14v-101.86l-72.84,3.12.57,47.8-18.21-47.8Z"/>
              <polygon class="cls-1" points="1233.94 716.32 1306.21 716.32 1306.21 825.14 1233.94 822.21 1233.94 716.32"/>
              <path class="cls-1" d="m872.77,821c22.25.49,44.49.98,66.74,1.47,18.21-35.7,36.41-71.4,54.62-107.1l-80.12-3.31-48.65,116.61h-5.72l-51.51-116.61h-72.25v27.9l98.72,186h52.22c17.12-33.61,34.25-67.21,51.37-100.82-21.81-1.38-43.62-2.76-65.43-4.14Z"/>
            </svg>
            </a></div>
      </div>
    `;
    callView = document.createElement("div");
    callView.className = "call-view";
    callView.style.display = "none";
    
    // Get company info for dynamic content
    const callCompanyInfo = getCompanyInfo();
    console.log("📞 Using company info for call view:", callCompanyInfo);
    
    callView.innerHTML = `
    <div class="call-visualizer" id="call-visualizer">
      <div class="call-header">
      <button class="back-btn" id="back-btn" aria-label="Back to landing">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      </button>
      <div class="call-info">
      <div class="call-info-name text-2xl">${callCompanyInfo.agentName}</div>
      <div class="call-info-status" id="shivai-status">
      <span class="status-text ">Online</span>
      </div>
      </div>
      <button class="widget-close" aria-label="Close widget">×</button>
      </div>
      <div class="call-body">
      <div class="language-section">
      <label class="language-label">Selected preferred language:</label>
      <select id="shivai-language" class="language-select-styled">
      <option value="ar">🇸🇦 Arabic</option>
      <option value="zh">🇨🇳 Chinese</option>
      <option value="nl">🇳🇱 Dutch</option>
      <option value="en-GB">🇬🇧 English (UK)</option>
      <option value="en-US">🇺🇸 English (US)</option>
      <option value="en-IN">🇮🇳 English (India)</option>
      <option value="fr">🇫🇷 French</option>
      <option value="de">🇩🇪 German</option>
      <option value="hi">🇮🇳 Hindi</option>
      <option value="it">🇮🇹 Italian</option>
      <option value="ja">🇯🇵 Japanese</option>
      <option value="ko">🇰🇷 Korean</option>
      <option value="pt">🇵🇹 Portuguese</option>
      <option value="pl">🇵🇱 Polish</option>
      <option value="ru">🇷🇺 Russian</option>
      <option value="es">🇪🇸 Spanish</option>
      <option value="tr">🇹🇷 Turkish</option>
      </select>
      </div>
      <div class="messages-container" id="shivai-messages">
      <div class="empty-state">
      <div class="empty-state-icon">👋</div>
      <div class="empty-state-text">Start a conversation to see transcripts here</div>
      </div>
      </div>
      
      <!-- Simplified WhatsApp-style Message Input Interface -->
      <div class="message-input-container" style="display: flex !important; align-items: center !important; gap: 12px !important; padding: 2px 4px !important; border-radius: 0px !important;">
        
        <!-- Attachment Button -->
       

        <!-- Message Input Field Container -->
        <div class="input-field-container" style="flex: 1 !important; position: relative !important; display: flex !important; align-items: center !important; background: white !important; border-radius: 8px !important; border: 1px solid #e1e5ea !important; padding: 8px 16px !important; min-height: 30px  !important; max-height: 120px !important; height:36px !important;  ">
           <div>

        <button id="shivai-attach-btn" class="attach-btn" title="Coming soon..." style="  color: #ccc !important; cursor: not-allowed !important; margin-right: 12px !important; background: transparent !important; border: none !important; display: flex !important; align-items: center !important; justify-content: center !important; padding: 0 !important; opacity: 0.5 !important;" disabled>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
          </svg>
        </button>
        
        <!-- Hidden file inputs -->
        <input type="file" id="shivai-file-input" accept="image/*,video/*,.pdf,.doc,.docx,.txt" style="display: none !important;" multiple>
        <input type="file" id="shivai-image-input" accept="image/*" style="display: none !important;" multiple>
        
        </div>

          <!-- Input Field -->
          <input type="text" id="shivai-message-input" class="message-input" placeholder="Type a message..." style="flex: 1 !important; border: none !important; outline: none !important; background: transparent !important; font-size: 12px !important; line-height: 20px !important; color: #111b21 !important; font-family: inherit !important; padding: 4px 0 !important;" />
          
          <!-- Send Button (Hidden initially, shows when typing) -->
          <button id="shivai-send-btn" class="send-btn" title="Send Message" style="display: none;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13"></path>
              <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
            </svg>
          </button>
        </div>
        
      </div>
      
      <!-- Simplified Attachment Menu Popup -->
      <div id="shivai-attachment-menu" class="attachment-menu" style="position: absolute !important; bottom: 70px !important; left: 16px !important; background: white !important; border-radius: 12px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; padding: 8px !important; display: none !important; z-index: 1000 !important; min-width: 180px !important;">
        
        <div class="attachment-option" id="shivai-attach-image" style="display: flex !important; align-items: center !important; padding: 12px !important; cursor: pointer !important; border-radius: 8px !important; transition: background 0.2s ease !important;">
          <div style="width: 36px !important; height: 36px !important; border-radius: 50% !important; background: #7c3aed !important; display: flex !important; align-items: center !important; justify-content: center !important; margin-right: 12px !important;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="9" cy="9" r="2"></circle>
              <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
            </svg>
          </div>
          <span style="font-size: 14px !important; color: #111b21 !important; font-weight: 500 !important;">Photos & Videos</span>
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
          <span style="font-size: 14px !important; color: #111b21 !important; font-weight: 500 !important;">Documents</span>
        </div>
        
      </div>
      
      <div class="controls">
      <div class="call-timer" id="call-timer" style="display: none;">00:00</div>
      <button class="control-btn-icon mute" id="shivai-mute" style="display: none;" title="Mute Microphone">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
      </svg>
      </button>
      <button class="control-btn-icon connect" id="shivai-connect" title="Start Call">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
      </svg>
      </button>
      </div>
      </div>
       <div class="widget-footer" style="padding: 0; margin: 0; background-color: #f9fafb;">
      <div class="footer-text" style="display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; color: #6b7280; flex-wrap: nowrap; line-height: 1;">
          <span>Powered by</span>
          <a href="https://callshivai.com" target="_blank" rel="noopener noreferrer" class="footer-logo-link" style="display: inline-flex; align-items: center; text-decoration: none; cursor: pointer; transition: all 0.2s ease;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 1500" class="footer-logo" style="height: 42px; width: 42px; fill: #3b82f6; vertical-align: middle; line-height: 1; margin-left: -5px;">
              <path class="cls-1" d="m404.66,608.33c-9.95-7.3-50.21-35.08-105.88-29.33-26.64,2.75-47.74,12.25-62.31,21.06-14.39,8.7-26.96,20.35-35.39,34.9-12.13,20.93-15.94,45.25-9.6,67.8,4.02,14.28,11.39,25.29,18.63,33.3,6.91,7.65,15.23,13.89,24.25,18.89,25.77,14.32,51.54,28.63,77.31,42.95,11.98,7.56,18.69,20.94,17.17,34.34-.11,1.01-.27,1.98-.47,2.93-2.85,13.83-15.4,23.46-29.5,24.28-8.62.5-18.56.28-29.41-1.45-34.59-5.51-58.34-23.08-69.39-32.54-13.35,21.1-26.71,42.2-40.06,63.3,13.96,9.75,32.81,20.78,56.52,29.33,42.03,15.17,79.38,15.38,102.3,13.59,7.85-.92,45.14-6.13,72.25-39.35,1.28-1.57,2.49-3.15,3.65-4.73,27.87-38.33,23.14-92-9.89-125.97-.3-.31-.6-.62-.91-.93-17.09-17.27-35.69-27.61-51.02-33.85-19.44-7.9-38.05-17.71-55.07-29.99-.78-.56-1.56-1.12-2.33-1.68-9.66-6.97-12.29-20.21-6.03-30.34h0c7.3-11.68,22.31-17.66,37.92-15.02,8.22-.53,21.33-.36,36.48,4.29,15.34,4.71,26.38,12.07,32.91,17.17,9.3-20.98,18.6-41.97,27.9-62.95Z"/>
              <path class="cls-1" d="m630.61,740.85c-3.86-4.46-8.41-8.89-13.76-13.05-17.19-13.34-35.56-18.29-49.77-19.92-15.45-1.76-31.19.76-45.13,7.63-.08.04-.16.08-.25.12-13.14,6.52-22.41,14.79-28.33,21.1v-169.18h-72.25v358.41h72.25v-130.44c9.49-21.4,30.88-33.36,50.51-29.8,3.55.64,6.78,1.75,9.71,3.15,14.12,6.76,22.48,21.69,22.48,37.35v119.75h73.68v-132.05c0-19.38-6.46-38.41-19.14-53.06Z"/>
              <rect class="cls-1" x="662.56" y="712.06" width="74.4" height="213.9"/>
              <path class="cls-1" d="m953.03,825.14c-13.76,33.61-27.52,67.21-41.28,100.82h84.42l25.75-67.96c-8.94-6.55-20.41-13.83-34.43-20.38-12.7-5.93-24.48-9.84-34.47-12.48Z"/>
              <circle class="cls-1" cx="1270.13" cy="623.35" r="45.07"/>
              <circle class="cls-1" cx="699.76" cy="623.35" r="45.07"/>
              <path class="cls-1" d="m954.09,822.73l95.6-235.02h71.13l94.46,235.02c-13.9-.54-54.29-3.99-86.12-34.9-26-25.25-33.27-56.18-36.12-68.31-.48-2.06-.75-3.53-1.31-6.44-4.83-25.25-5.11-43.74-5.38-76.6-.22-27.23-.29-45.31-.45-45.31-.19,0-.33,26.01-1.25,51.3-.44,12.07-.99,22.81-.99,22.81-.31,5.8-.54,8.99-.78,14.32-.97,21.54-.88,21.8-1.44,25.22-2.48,15.29-13.28,66.99-58.46,96.77-27.62,18.21-55.44,20.82-68.92,21.15Z"/>
              <path class="cls-1" d="m1215.73,825.86c-6.37.43-13.66,1.49-21.51,3.68-22.94,6.41-38.73,19.17-47.51,27.69,7.45,22.45,14.9,44.91,22.35,67.36h137.14v-101.86l-72.84,3.12.57,47.8-18.21-47.8Z"/>
              <polygon class="cls-1" points="1233.94 716.32 1306.21 716.32 1306.21 825.14 1233.94 822.21 1233.94 716.32"/>
              <path class="cls-1" d="m872.77,821c22.25.49,44.49.98,66.74,1.47,18.21-35.7,36.41-71.4,54.62-107.1l-80.12-3.31-48.65,116.61h-5.72l-51.51-116.61h-72.25v27.9l98.72,186h52.22c17.12-33.61,34.25-67.21,51.37-100.82-21.81-1.38-43.62-2.76-65.43-4.14Z"/>
            </svg>
            </a></div>
      </div>
      </div>
    `;
    widgetContainer.appendChild(landingView);
    widgetContainer.appendChild(callView);
    addWidgetStyles();
    document.body.appendChild(triggerBtn);
    document.body.appendChild(widgetContainer);
    makeWidgetDraggable(widgetContainer);
    makeTriggerBtnDraggable(triggerBtn);
    createLiveMessageBubble();
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
    }, 100);

    setDefaultLanguage();
  }
  function setDefaultLanguage() {
    const languageMap = {
      ar: "ar",
      zh: "zh",
      "zh-CN": "zh",
      "zh-TW": "zh",
      en: "en",
      "en-US": "en-US",
      "en-GB": "en-GB",
      "en-IN": "en-IN",
      fr: "fr",
      de: "de",
      hi: "hi",
      it: "it",
      ja: "ja",
      ko: "ko",
      pt: "pt",
      "pt-BR": "pt",
      es: "es",
      "es-ES": "es",
      "es-MX": "es",
    };
    const browserLang = navigator.language || navigator.userLanguage;
    let detectedLang = languageMap[browserLang];
    if (!detectedLang && browserLang.includes("-")) {
      const baseLang = browserLang.split("-")[0];
      detectedLang = languageMap[baseLang];
    }
    const defaultLang = detectedLang || "en-US";
    if (languageSelect) {
      languageSelect.value = defaultLang;
    }
    const landingLanguageSelect = document.getElementById(
      "shivai-language-landing"
    );
    if (landingLanguageSelect) {
      landingLanguageSelect.value = defaultLang;
      console.log(
        `Auto-detected language: ${defaultLang} (Browser locale: ${browserLang})`
      );
    }
  }

  // Functions to show/hide message interface based on connection state
  function showMessageInterface() {
    console.log("🔍 Attempting to show message interface...");

    // Try multiple ways to find the message interface
    const container =
      messageInputContainer ||
      document.querySelector(".message-input-container");

    if (container) {
      console.log("📝 Container found, removing hidden class");
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

      console.log("📝 Message interface shown - classes:", container.className);
    } else {
      console.warn("⚠️ Message input container not found when showing");
    }
  }

  function hideMessageInterface() {
    console.log("🔍 Attempting to hide message interface...");

    // Try multiple ways to find the message interface
    const container =
      messageInputContainer ||
      document.querySelector(".message-input-container");

    if (container) {
      console.log("📝 Container found, adding hidden class");
      container.classList.add("hidden");

      // Also force with inline style as backup
      container.style.display = "none";
      container.style.visibility = "hidden";
      container.style.opacity = "0";

      console.log(
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
      console.log("📝 Backup hiding by attribute selector applied");
    }
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
      .shivai-trigger {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      cursor: move;
      outline: none;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      color: #ffffff;
      font-size: 24px;
      transition: all 0.3s ease;
      background: linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.accentColor} 100%);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15);
      }
      .shivai-trigger:hover {
      transform: scale(1.1);
      background: linear-gradient(135deg, ${theme.accentColor} 0%, ${theme.primaryColor} 100%);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35), 0 4px 12px rgba(0, 0, 0, 0.25);
      }
      .shivai-trigger:active {
      transform: scale(0.95);
      background: linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.accentColor} 50%, ${theme.primaryColor} 100%);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(0, 0, 0, 0.25);
      }
      .shivai-trigger.dragging {
      transform: scale(1.05);
      opacity: 0.8;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
      transition: none !important;
      }
      .shivai-neon-pulse {
      overflow: visible;
      }
      .shivai-neon-pulse::before,
      .shivai-neon-pulse::after {
      content: "";
      position: absolute;
      inset: -4px;
      border: 2px solid rgba(107, 114, 128, 0.6);
      border-radius: 50%;
      animation: neonPulseOut 2s ease-out infinite;
      opacity: 0;
      pointer-events: none;
      }
      .shivai-neon-pulse::after {
      animation-delay: 1s;
      }
      @keyframes neonPulseOut {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      100% {
        transform: scale(1.5);
        opacity: 0;
      }
      }
      @keyframes bubbleSlideIn {
      0% {
        opacity: 0;
        transform: translateY(15px) scale(0.7);
      }
      60% {
        opacity: 0.8;
        transform: translateY(-2px) scale(1.05);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      }
      @keyframes bubbleSlideOut {
      0% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      100% {
        opacity: 0;
        transform: translateY(10px) scale(0.8);
      }
      }
      @keyframes typingCursor {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
      }
      @keyframes shine {
      0% {
        left: -100%;
      }
      100% {
        left: 100%;
      }
      }
      .start-call-btn {
      position: relative;
      overflow: hidden;
      }
      .start-call-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.4),
        transparent
      );
      animation: shine 2s infinite;
      }
      .start-call-btn:hover::before {
      animation: shine 1s infinite;
      }
      .shivai-message-bubble {
      cursor: pointer;
      }
      @media (max-width: 768px) {
      .shivai-trigger {
        width: 56px;
        height: 56px;
        font-size: 22px;
        bottom: 16px;
        right: 16px;
      }
      .shivai-message-bubble {
        font-size: 13px;
        padding: 6px 10px;
        max-width: 200px;
      }
      }
      @media (max-width: 420px) {
      .shivai-trigger {
        width: 52px;
        height: 52px;
        bottom: 12px;
        right: 12px;
      }
      .shivai-message-bubble {
        font-size: 12px;
        padding: 6px 8px;
        max-width: 180px;
      }
      }
      .shivai-widget {
      position: fixed;
      bottom: 60px;
      right: 20px;
      width: 380px;
      max-width: 380px;
      max-height: 550px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
      z-index: 10000;
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      border: 1px solid #e5e7eb;
      }
      .shivai-widget.active {
      display: flex;
      animation: slideUpWidget 0.3s ease-out;
      }
      @keyframes slideUpWidget {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
      }
      .landing-view {
      display: flex;
      flex-direction: column;
      width: 100%;
      background: white;
      }
      .landing-view .widget-header {
      position: relative;
      text-align: left;
      padding: 16px 14px 2px;
      border-bottom: 1px solid #f3f4f6;
      }
      .header-content {
      position: relative;
      width: 100%;
      }
      .header-info {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 12px;
      }
      .header-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
      }
      .landing-view .widget-avatar {
      width: 42px;
      height: 42px;
      flex-shrink: 0;
      border-radius: 50%;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #111827;
      border: 1.5px solid #e5e7eb;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
      padding: 5px;
      }
      .landing-view .widget-avatar svg {
      width: 100%;
      height: 100%;
      }
      .landing-view .widget-title {
      font-weight: 600;
      font-size: 14px;
      color: #111827;
      margin: 0;
      letter-spacing: -0.01em;
      line-height: 1.3;
      }
      .landing-view .widget-subtitle {
      font-size: 11px;
      color: #6b7280;
      margin: 0;
      font-weight: 400;
      line-height: 1.4;
      }
      .start-call-btn {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid transparent;
      border-radius: 24px;
      font-size: 14px;
      background: linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.accentColor} 100%);
      color: white;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
      margin-bottom: 10px;
      }
      .start-call-btn:hover {
      background: linear-gradient(135deg, ${theme.accentColor} 0%, ${theme.primaryColor} 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      .start-call-btn:active {
      transform: translateY(0);
      }
      .privacy-text {
      font-size: 10px;
      color: #9ca3af;
      text-align: center;
      margin: 0;
      line-height: 1.1;
      }
      .privacy-link {
      color: #2563eb;
      cursor: pointer;
      text-decoration: underline;
      }
      .widget-footer {
      text-align: center;
      border-top: 1px solid #f3f4f6;
      }
      .footer-text {
      font-size: 12px;
      color: #6b7280;
      text-align: center;
      }
      .footer-text span {
      color: #6b7280;
      font-weight: 500;
      }
      .footer-text a {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 600;
      }
      .footer-text a:hover {
      color: #2563eb;
      }
      .footer-logo .cls-1 {
      fill: currentColor;
      stroke-width: 0px;
      }
      .footer-logo-link:hover .footer-logo {
      transform: scale(1.1);
      }
       .footer-logo-link {
          padding: 0px;
          position: relative;
          left: -2px;
          top: 0.5px;
        }
      @media (max-width: 768px) {
        .footer-text {
          font-size: 14px;
          gap: 4px;
        }
        .footer-logo {
          height: 44px !important;
          width: 44px !important;
        }
        .footer-text span {
          font-size: 14px;
        }
       .footer-logo-link {
          padding: 0px;
          position: relative;
          left: -2px;
          top: 0.5px;
        }
      }
      @media (max-width: 480px) {
        .footer-text {
          font-size: 12px;
          gap: 3px;
          padding: 0 4px;
        }
        .footer-logo {
          height: 40px !important;
          width: 40px !important;
          position: relative;
          top: -2px;
        }
        .footer-text span {
          font-size: 11px;
        }
        .footer-logo-link {
          padding: 0px;
          position: relative;
          left: -2px;
        }
      }
      .call-view {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-height: 600px;
      }
      .call-header {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      gap: 10px;
      }
      .back-btn {
      background: transparent;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s ease;
      flex-shrink: 0;
      }
      .back-btn:hover {
      background: #f3f4f6;
      color: #111827;
      }
      .call-info {
      flex: 1;
      min-width: 0;
      }
      .call-info-name {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 2px;
      line-height: 1.2;
      }
      .call-info-status {
      font-size: 11px;
      display: flex;
      align-items: center;
      font-weight: 500;
      color: #10b981;
      }
      .call-info-status .status-text {
      font-size: 11px;
      line-height: 1;
      }
      .call-info-status.connecting {
      color: #d97706;
      }
      .call-info-status.connected {
      color: #2563eb;
      }
      .call-info-status.listening {
      color: #059669;
      }
      .call-info-status.speaking {
      color: #db2777;
      }
      .call-info-status.disconnected {
      color: #dc2626;
      }
      .call-view .widget-close {
      position: static;
      margin: 0;
      }
      .call-body {
      padding: 10px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow-y: auto;
      background: #ffffff;
      }
      .language-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 6px;
      }
      .language-label {
      font-size: 11px;
      font-weight: 400;
      color: #000;
      letter-spacing: 0.5px;
      margin: 0;
      }
      .language-select-styled {
      padding: 6px 10px !important;
      border-radius: 6px;
      border: 1px solid #d1d5db;
      background: white;
      font-size: 12px !important;
      color: #111827;
      cursor: pointer;
      transition: all 0.2s ease;
      background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      padding-right: 32px;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      }
      .language-select-styled:hover {
      border-color: #9ca3af;
      background-color: #f9fafb;
      }
      .language-select-styled:focus {
      outline: none;
      border-color: #6b7280;
      box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.1);
      background-color: white;
      }
      .language-section-landing {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
      padding: 0;
      }
      .language-label-landing {
      font-size: 12px;
      font-weight: 500;
      color: #374151;
      letter-spacing: 0.3px;
      margin: 0;
      text-align: left;
      }
      .language-select-styled-landing {
      padding: 10px 14px;
      border-radius: 8px;
      border: 1.5px solid #d1d5db;
      background: white;
      font-size: 14px;
      color: #111827;
      cursor: pointer;
      transition: all 0.2s ease;
      background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 36px;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      font-weight: 500;
      }
      .language-select-styled-landing:hover {
      border-color: #3b82f6;
      background-color: #f9fafb;
      }
      .language-select-styled-landing:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      background-color: white;
      }
      
      .form-group {
        margin-bottom: 16px;
      }
      
      .agent-input-styled {
        width: 100%;
        padding: 10px 14px;
        border-radius: 8px;
        border: 1.5px solid #d1d5db;
        background: white;
        font-size: 14px;
        color: #111827;
        transition: all 0.2s ease;
        font-weight: 500;
      }
      
      .agent-input-styled:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      .agent-input-styled::placeholder {
        color: #6b7280;
        font-weight: 400;
      }
      
      .audio-controls-section {
        margin-bottom: 20px;
        padding: 12px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }
      
      .checkbox-group {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
      }
      
      .checkbox-group:last-child {
        margin-bottom: 0;
      }
      
      .checkbox-group input[type="checkbox"] {
        width: 16px;
        height: 16px;
        margin: 0;
        cursor: pointer;
        accent-color: #3b82f6;
      }
      
      .checkbox-group label {
        margin: 0;
        font-size: 13px;
        font-weight: 500;
        color: #4b5563;
        cursor: pointer;
        line-height: 1.4;
      }
      
      .latency-monitor {
        margin-top: 15px;
        padding: 12px;
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        font-size: 11px;
      }
      
      .latency-header {
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .latency-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        margin-bottom: 10px;
      }
      
      .latency-metric {
        background: white;
        padding: 8px;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
        text-align: center;
      }
      
      .latency-label {
        font-size: 9px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 2px;
      }
      
      .latency-value {
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
      }
      
      .latency-value.good {
        color: #059669;
      }
      
      .latency-value.medium {
        color: #d97706;
      }
      
      .latency-value.bad {
        color: #dc2626;
      }
      
      .latency-chart {
        background: white;
        padding: 8px;
        border-radius: 6px;
        height: 50px;
        position: relative;
        overflow: hidden;
        margin-bottom: 8px;
        border: 1px solid #e2e8f0;
      }
      
      .latency-bar {
        position: absolute;
        bottom: 0;
        width: 2px;
        background: #3b82f6;
        transition: height 0.3s ease;
        border-radius: 1px 1px 0 0;
      }
      
      .latency-stats {
        font-size: 9px;
        color: #64748b;
        text-align: center;
        line-height: 1.3;
      }
      
      .call-controls-row {
      display: flex;
      align-items: stretch;
      gap: 8px;
      padding: 0;
      margin-bottom: 12px;
      }
      .audio-visualizer-enhanced {
      flex: 0 0 auto;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 3px;
      height: auto;
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border-radius: 8px;
      padding: 8px 10px;
      border: 1px solid #e5e7eb;
      }
      .audio-visualizer-enhanced .visualizer-bar {
      width: 3px;
      height: 16px;
      background: linear-gradient(180deg, ${theme.primaryColor} 0%, ${theme.accentColor} 100%);
      border-radius: 2px;
      transition: all 0.15s ease;
      }
      .audio-visualizer-enhanced .visualizer-bar.active {
      animation: visualizerPulseEnhanced 0.8s ease-in-out infinite;
      }
      .audio-visualizer-enhanced .visualizer-bar:nth-child(1) {
      animation-delay: 0s;
      }
      .audio-visualizer-enhanced .visualizer-bar:nth-child(2) {
      animation-delay: 0.1s;
      }
      .audio-visualizer-enhanced .visualizer-bar:nth-child(3) {
      animation-delay: 0.2s;
      }
      .audio-visualizer-enhanced .visualizer-bar:nth-child(4) {
      animation-delay: 0.3s;
      }
      .audio-visualizer-enhanced .visualizer-bar:nth-child(5) {
      animation-delay: 0.4s;
      }
      @keyframes visualizerPulseEnhanced {
      0%, 100% {
        height: 16px;
        opacity: 0.7;
        background: linear-gradient(180deg, ${theme.primaryColor} 0%, ${theme.accentColor} 100%);
      }
      50% {
        height: 24px;
        opacity: 1;
        background: linear-gradient(180deg, ${theme.accentColor} 0%, ${theme.primaryColor} 100%);
      }
      }
      .widget-header {
      position: relative;
      text-align: center;
      padding: 20px 16px 24px;
      background: #ffffff;
      border-bottom: 1px solid #f3f4f6;
      }
      .widget-avatar {
      width: 64px;
      height: 64px;
      margin: 0 auto 12px;
      border-radius: 50%;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #111827;
      border: 2px solid #e5e7eb;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }
      .widget-title {
      font-weight: 600;
      font-size: 18px;
      color: #111827;
      margin: 0 0 4px 0;
      letter-spacing: -0.01em;
      }
      .widget-subtitle {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
      font-weight: 400;
      }
      .widget-close {
      position: absolute;
      top: -10px;
      right: -8px;
      background: transparent;
      border: none;
      color: #9ca3af;
      font-size: 24px;
      cursor: pointer;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;
      font-weight: 300;
      line-height: 1;
      }
      .widget-close:hover {
      background: #f3f4f6;
      color: #374151;
      }
      .widget-body {
      padding: 20px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow-y: auto;
      background: #ffffff;
      }
      .language-selector {
      display: flex;
      flex-direction: column;
      gap: 6px;
      }
      .language-selector label {
      font-size: 12px;
      font-weight: 500;
      color: #374151;
      }
      .language-selector select {
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid #d1d5db;
      background: white;
      font-size: 13px;
      color: #111827;
      cursor: pointer;
      transition: all 0.2s ease;
      }
      .language-selector select:focus {
      outline: none;
      border-color: #6b7280;
      box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.1);
      }
      .status {
      padding: 10px 12px;
      border-radius: 8px;
      text-align: center;
      font-size: 13px;
      font-weight: 500;
      border: 1px solid transparent;
      }
      .status.connecting {
      background: #fef3c7;
      color: #92400e;
      border-color: #fde68a;
      }
      .status.connected {
      background: #dbeafe;
      color: #1e40af;
      border-color: #bfdbfe;
      }
      .status.listening {
      background: #d1fae5;
      color: #065f46;
      border-color: #a7f3d0;
      }
      .status.speaking {
      background: #fce7f3;
      color: #9f1239;
      border-color: #fbcfe8;
      }
      .status.disconnected {
      background: #fee2e2;
      color: #991b1b;
      border-color: #fecaca;
      }
      .audio-visualizer {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 4px;
      height: 40px;
      background: #f9fafb;
      border-radius: 8px;
      padding: 10px;
      }
      .visualizer-bar {
      width: 4px;
      height: 20px;
      background: linear-gradient(180deg, ${theme.primaryColor} 0%, ${theme.accentColor} 100%);
      border-radius: 2px;
      transition: height 0.15s ease;
      }
      .visualizer-bar.active {
      animation: visualizerPulse 0.8s ease-in-out infinite;
      }
      @keyframes visualizerPulse {
      0%, 100% {
        height: 20px;
        opacity: 0.8;
      }
      50% {
        height: 30px;
        opacity: 1;
      }
      }
      .messages-container {
      flex: 1;
      overflow-y: auto;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 8px;
      max-height: 180px;
      background: #f9fafb;
      min-height: 120px;
      }
      .messages-container::-webkit-scrollbar {
      width: 4px;
      }
      .messages-container::-webkit-scrollbar-track {
      background: #f3f4f6;
      border-radius: 2px;
      }
      .messages-container::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 2px;
      }
      .messages-container::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
      }
      .empty-state {
      text-align: center;
      padding: 20px 10px;
      color: #6b7280;
      }
      .empty-state-icon {
      font-size: 36px;
      margin-bottom: 6px;
      opacity: 0.9;
      }
      .empty-state-text {
      font-size: 13px;
      color: #9ca3af;
      line-height: 1.4;
      }
      .message {
      margin-bottom: 10px;
      padding: 8px 12px;
      border-radius: 10px;
      max-width: 85%;
      font-size: 13px;
      line-height: 1.4;
      word-wrap: break-word;
      }
      .message.user {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      margin-left: auto;
      color: #1e40af;
      border: 1px solid #bfdbfe;
      }
      .message.assistant {
      background: #f3f4f6;
      margin-right: auto;
      color: #111827;
      border: 1px solid #e5e7eb;
      }
      border-bottom-right-radius: 4px;
      }
      .message.assistant {
      background: #f3f4f6;
      margin-right: auto;
      color: #111827;
      border: 1px solid #e5e7eb;
      }
      .message-label {
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 4px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      }
      .message-text {
      font-size: 14px;
      line-height: 1.5;
      color: inherit;
      }
      .controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 2px;
      }
      .call-timer {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.5px;
      margin-right: auto;
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      padding: 8px 14px;
      border-radius: 20px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
      position: relative;
      overflow: hidden;
      }
      .call-timer::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
      animation: timerShimmer 2s infinite;
      }
      @keyframes timerShimmer {
      0% {
        left: -100%;
      }
      100% {
        left: 100%;
      }
      }
      .control-btn-icon {
      width: 44px;
      height: 44px;
      padding: 0;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      flex-shrink: 0;
      }
      .control-btn-icon.connect {
      background: linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.accentColor} 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      animation: connectPulse 2s ease-in-out infinite;
      }
      @keyframes connectPulse {
      0%, 100% {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1), 0 0 0 0 rgba(107, 114, 128, 0.4);
      }
      50% {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1), 0 0 0 6px rgba(107, 114, 128, 0);
      }
      }
      .control-btn-icon.connect:hover {
      background: linear-gradient(135deg, ${theme.accentColor} 0%, ${theme.primaryColor} 100%);
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      .control-btn-icon.connect:active {
      transform: scale(0.95);
      }
      .control-btn-icon.connect.connected {
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%);
      animation: none;
      z-index: 1;
      }
      .control-btn-icon.connect.connected:hover {
      background: linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #b91c1c 100%);
      transform: scale(1.05);
      }
      .control-btn-icon.clear {
      background: #f3f4f6;
      color: #6b7280;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
      }
      .control-btn-icon.clear:hover {
      background: #e5e7eb;
      color: #374151;
      transform: scale(1.05);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }
      .control-btn-icon.clear:active {
      transform: scale(0.95);
      }
      .control-btn-icon.mute {
      background: #f3f4f6;
      color: #10b981;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
      }
      .control-btn-icon.mute:hover {
      background: #d1fae5;
      color: #059669;
      transform: scale(1.05);
      box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
      }
      .control-btn-icon.mute:active {
      transform: scale(0.95);
      }
      .control-btn-icon.mute.muted {
      background: #fee2e2;
      color: #dc2626;
      }
      .control-btn-icon.mute.muted:hover {
      background: #fecaca;
      color: #b91c1c;
      box-shadow: 0 4px 10px rgba(220, 38, 38, 0.2);
      }
      @media (max-width: 768px) {
      .shivai-widget {
        width: calc(100vw - 40px);
        right: 20px;
        bottom: 4%;
        max-height: 500px;
      }
      }
      @media (max-width: 480px) {
      .shivai-widget {
        width: calc(100vw - 24px);
        right: 12px;
        bottom: 3%;
        // max-height: 450px;
      }
      .widget-header {
        padding: 16px 12px 20px;
      }
      .widget-body {
        padding: 16px;
      }
      .control-btn {
        padding: 12px 14px;
        font-size: 13px;
      }
      .dragging {
        opacity: 0.8;
        transform: scale(1.05);
        z-index: 999999 !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
        transition: none !important;
      }
      .shivai-widget.dragging {
        transition: none !important;
      }
      .widget-header:hover,
      .call-header:hover {
        cursor: move;
      }
      .widget-header .widget-close:hover,
      .widget-header .start-call-btn:hover,
      .widget-header .language-select-styled-landing:hover,
      .widget-header .language-section-landing:hover,
      .call-header .widget-close:hover,
      .call-header .back-btn:hover {
        cursor: pointer;
      }
      
      /* Simplified WhatsApp-style Message Input Interface Styles */
      .shivai-widget .message-input-container {
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        padding: 8px 16px !important;
      }
      
      /* Override to hide message interface when not connected */
      .shivai-widget .message-input-container.hidden,
      .shivai-widget.message-input-container.hidden {
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      
      .shivai-widget .attach-btn:hover {
        background: #008069 !important;
        transform: scale(1.05) !important;
      }

      .shivai-widget .send-btn:hover {
        background: #008069 !important;
        transform: scale(1.05) !important;
      }

      .shivai-widget .input-field-container:focus-within {
        border-color: #00a884 !important;
        box-shadow: 0 0 0 2px rgba(0, 168, 132, 0.1) !important;
      }
      
      .shivai-widget .message-input {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      }
      
      .shivai-widget .message-input::placeholder {
        color: #8696a0 !important;
        font-size: 12px !important;
      }

      .shivai-widget .attachment-menu {
        animation: slideUpFade 0.2s ease-out !important;
      }

      @keyframes slideUpFade {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .shivai-widget .attachment-option:hover {
        background: #f5f6f6 !important;
      }
      
      .shivai-widget .message-input:focus {
        background: #ffffff;
        transform: translateY(-1px);
      }
      
      .shivai-widget .message-input::placeholder {
        color: #9ca3af;
        font-style: italic;
      }
      
      .shivai-widget .send-btn {
        padding: 8px !important;
        border: none !important;
        background: transparent !important;
        color: #666 !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-width: 32px !important;
        height: 32px !important;
        flex-shrink: 0 !important;
        transition: color 0.2s ease !important;
      }
      
      .shivai-widget .send-btn:hover {
        color: #333 !important;
      }
      
      .shivai-widget .send-btn:active {
        color: #000 !important;
      }
      
      .shivai-widget .send-btn:disabled {
        color: #ccc !important;
        cursor: not-allowed !important;
      }
      
      .shivai-widget .send-btn svg {
        width: 16px;
        height: 16px;
      }
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
    const startCallBtn = document.getElementById("start-call-btn");
    if (startCallBtn) {
      startCallBtn.addEventListener("click", async (e) => {
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
    document.addEventListener("click", (e) => {
      if (
        isWidgetOpen &&
        !widgetContainer.contains(e.target) &&
        !triggerBtn.contains(e.target)
      ) {
        closeWidget();
      }
    });
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

      // Attachment button functionality
      if (attachBtn && attachmentMenu) {
        attachBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const isVisible = attachmentMenu.style.display === "block";
          attachmentMenu.style.display = isVisible ? "none" : "block";
        });

        // Close attachment menu when clicking outside
        document.addEventListener("click", (e) => {
          if (
            !attachBtn.contains(e.target) &&
            !attachmentMenu.contains(e.target)
          ) {
            attachmentMenu.style.display = "none";
          }
        });

        // Attachment options
        const attachImage = document.getElementById("shivai-attach-image");
        const attachDocument = document.getElementById(
          "shivai-attach-document"
        );

        if (attachImage && imageInput) {
          attachImage.addEventListener("click", () => {
            imageInput.click();
            attachmentMenu.style.display = "none";
          });
        }

        if (attachDocument && fileInput) {
          attachDocument.addEventListener("click", () => {
            fileInput.click();
            attachmentMenu.style.display = "none";
          });
        }

        // File input handlers
        if (fileInput) {
          fileInput.addEventListener("change", (e) => {
            const files = Array.from(e.target.files);
            handleFileUpload(files, "document");
          });
        }

        if (imageInput) {
          imageInput.addEventListener("change", (e) => {
            const files = Array.from(e.target.files);
            handleFileUpload(files, "image");
          });
        }
      }
    }
  }

  // Handle file uploads (images and documents)
  function handleFileUpload(files, type) {
    if (!files || files.length === 0) return;

    files.forEach((file) => {
      const maxSize = 10 * 1024 * 1024; // 10MB limit

      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return;
      }

      // Create preview for images
      if (type === "image" && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const imagePreview = `
            <div style="margin: 8px 0; max-width: 200px;">
              <img src="${e.target.result}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 8px; cursor: pointer;" onclick="window.open('${e.target.result}', '_blank')">
              <p style="font-size: 12px; color: #8696a0; margin: 4px 0;">${file.name} (${(file.size / 1024).toFixed(1)} KB)</p>
            </div>
          `;
          addMessage("user", imagePreview, "image");
        };
        reader.readAsDataURL(file);
      } else {
        // Handle documents and other files
        const fileIcon = getFileIcon(file.type);
        const fileMessage = `
          <div style="display: flex; align-items: center; padding: 12px; border: 1px solid #e1e5ea; border-radius: 8px; background: #f8f9fa; margin: 8px 0; max-width: 300px;">
            <div style="margin-right: 12px; font-size: 24px;">${fileIcon}</div>
            <div style="flex: 1;">
              <div style="font-weight: 500; color: #111b21; font-size: 14px;">${file.name}</div>
              <div style="font-size: 12px; color: #8696a0;">${(file.size / 1024).toFixed(1)} KB • ${file.type || "Unknown type"}</div>
            </div>
          </div>
        `;
        addMessage("user", fileMessage, "document");
      }
    });

    // Clear the file input
    if (type === "image") {
      document.getElementById("shivai-image-input").value = "";
    } else {
      document.getElementById("shivai-file-input").value = "";
    }
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
  }
  function switchToLandingView() {
    currentView = "landing";
    landingView.style.display = "flex";
    callView.style.display = "none";
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
  }
  function closeWidget() {
    console.log("🔴 Widget closing - checking call state");

    // Disconnect LiveKit room if connected
    if (room) {
      console.log("🔴 Disconnecting LiveKit room on widget close");
      room
        .disconnect()
        .then(() => {
          console.log("🔴 LiveKit room disconnected successfully");
        })
        .catch((err) => {
          console.warn("Error disconnecting LiveKit room:", err);
        });
      room = null;
    }

    console.log("🔴 Performing complete cleanup on widget close");
    isConnected = false;
    isConnecting = false;
    hasReceivedFirstAIResponse = false;
    shouldAutoUnmute = false;
    isMuted = false;
    clearLoadingStatus();
    stopCallTimer();
    if (ws) {
      console.log("🔌 Closing WebSocket on widget close");
      ws.close();
      ws = null;
    }
    stopAllScheduledAudio();
    teardownPlaybackProcessor();
    if (mediaStream) {
      console.log(
        "🎤 Stopping microphone and revoking permissions on widget close"
      );
      mediaStream.getTracks().forEach((track) => {
        console.log(
          `Stopping track: ${track.kind}, state: ${track.readyState}`
        );
        track.stop();
        track.enabled = false;
      });
      mediaStream = null;
      console.log("🎤 Microphone permissions revoked successfully");
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
      console.log("📝 Transcripts cleared completely");
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
      fetch("https://shivai-com-backend.onrender.com/api/v1/calls/end-call", {
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
    console.log("🔴 Complete cleanup finished on widget close");
    widgetContainer.classList.remove("active");
    isWidgetOpen = false;
    if (triggerBtn) {
      triggerBtn.style.display = "flex";
    }
    switchToLandingView();
    if (!messageInterval) {
      startLiveMessages();
    }
    console.log("✅ Widget closed successfully");
  }
  async function handleConnectClick(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault(); // Prevent any default behavior
    }

    // Prevent multiple rapid clicks
    if (isDisconnecting) {
      console.log("🚫 Disconnect already in progress - ignoring click");
      return;
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
      console.log("🔴 Disconnect requested - current state:", {
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

      // Close WebSocket if exists
      if (ws) {
        console.log("🔌 Closing WebSocket immediately");
        try {
          ws.close();
        } catch (err) {
          console.warn("Error closing WebSocket:", err);
        }
        ws = null;
      }

      // Update UI to disconnected state IMMEDIATELY
      updateStatus("Disconnected", "disconnected");
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
            console.log("🚪 LiveKit room disconnected");
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
        console.log("✅ Immediate disconnect completed");
      }, 100); // Reduced from 500ms to 100ms for faster reconnection

      return;
    }
    // Start new connection only if not currently connected or connecting
    if (!isConnecting && !isConnected && !isDisconnecting) {
      console.log("🔵 Starting new connection");
      isConnecting = true;
      connectBtn.disabled = true;
      playSound("ring");

      try {
        connectBtn.innerHTML =
          '<svg width="26" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" transform="rotate(135 12 12)"></path></svg>';
        connectBtn.classList.add("connected");
        connectBtn.title = "Hang Up";

        await startConversation();

        // Check if connection was cancelled during startConversation
        if (!isConnecting) {
          console.log("⚠️ Connection was cancelled during startup");
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
    console.log(`🎤 Microphone ${isMuted ? "muted" : "unmuted"} by user`);
  }
  function updateStatus(status, className) {
    const statusText = statusDiv.querySelector(".status-text");
    if (statusText) {
      statusText.textContent = status;
    } else {
      statusDiv.textContent = status;
    }
    statusDiv.className = `call-info-status ${className}`;
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
      '<svg width="26" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" transform="rotate(135 12 12)"></path></svg>';
    connectBtn.classList.add("connected");
    connectBtn.title = "End Call";
    callTimerInterval = setInterval(updateCallTimer, 1000);
    updateCallTimer();
    console.log("⏱️ Call timer started");

    // Microphone is always enabled
    console.log("🎤 Microphone is enabled and ready for conversation");
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
  function addMessage(role, text) {
    console.log("🔍 addMessage called:", {
      role,
      text,
      caller: new Error().stack.split("\n")[2],
    });

    // Stop connecting sound when assistant speaks
    if (role === "assistant") {
      stopConnectingSound();
    }

    const emptyState = messagesDiv.querySelector(".empty-state");
    if (emptyState) {
      emptyState.remove();
    }
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role}`;
    const labelDiv = document.createElement("div");
    labelDiv.className = "message-label";
    labelDiv.textContent = role === "user" ? "You" : "AI Employee";
    const textDiv = document.createElement("div");
    textDiv.className = "message-text";
    textDiv.textContent = text;
    messageDiv.appendChild(labelDiv);
    messageDiv.appendChild(textDiv);
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
      textDiv.textContent = text;
    }
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
        bar.style.height = "14px";
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
        console.log("📤 Sending chat message:", message);

        // Use proper LiveKit sendText method like test-client
        if (typeof room.localParticipant.sendText === "function") {
          console.log("Using sendText method with lk.chat topic");
          room.localParticipant
            .sendText(message, {
              topic: "lk.chat",
            })
            .then((info) => {
              console.log(
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
          console.log("sendText not available, using fallback publishData");
          fallbackSendChat(message);
        }

        // Add message to UI immediately (like test-client does)
        addMessage("user", message, { source: "typed" });

        // Track this message to prevent duplicates from transcription
        lastSentMessage = message;

        // Clear input
        messageInput.value = "";

        console.log("💬 Message sent:", message);
      } catch (error) {
        console.error("❌ Error sending message:", error);
      }
    } else if (!isConnected) {
      console.warn("⚠️ Cannot send message: not connected to room");
    }
  }

  function fallbackSendChat(text) {
    try {
      console.log("Using fallback publishData method");
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

      console.log("✅ Chat sent with publishData");
    } catch (error) {
      console.error("❌ publishData fallback failed:", error);
    }
  }

  async function startConversation() {
    try {
      // Check if connection was cancelled before starting
      if (!isConnecting) {
        console.log("❌ Connection cancelled before start");
        return;
      }

      // 🎤 Request microphone permission FIRST before anything else
      console.log("🎤 Requesting microphone permission...");
      console.log("📍 Browser:", navigator.userAgent);
      console.log("📍 Secure context:", window.isSecureContext);
      console.log("📍 MediaDevices available:", !!navigator.mediaDevices);
      console.log(
        "📍 getUserMedia available:",
        !!navigator.mediaDevices?.getUserMedia
      );

      // Check if we're in a secure context (HTTPS)
      if (!window.isSecureContext) {
        console.error(
          "❌ Not in secure context - HTTPS required for microphone access"
        );
        alert(
          "Microphone access requires HTTPS. Please access this page using HTTPS."
        );
        return;
      }

      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("❌ MediaDevices API not available");
        alert(
          "Microphone API is not available in your browser. Please use a modern browser with HTTPS."
        );
        return;
      }

      // 🎤 Request microphone permission with retry logic
      console.log("🎤 Starting microphone permission process...");
      updateStatus("🎤 Requesting microphone access...", "connecting");
      
      const micPermissionGranted = await requestMicrophonePermission();
      
      if (!micPermissionGranted) {
        console.error("❌ Microphone permission not granted - disconnecting call");
        updateStatus("❌ Microphone access required", "disconnected");
        
        // Disconnect the call immediately
        isConnecting = false;
        isConnected = false;
        
        // Reset UI
        connectBtn.innerHTML =
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
        connectBtn.classList.remove("connected");
        connectBtn.title = "Start Call";
        connectBtn.disabled = false;
        
        stopRingSound();
        stopConnectingSound();
        hideMessageInterface();
        
        return;
      }
      
      console.log("✅ Microphone permission verified - continuing with call setup...");
      updateStatus("✅ Microphone ready - connecting...", "connecting");

      // Check if connection was cancelled after microphone permission
      if (!isConnecting) {
        console.log("❌ Connection cancelled after microphone permission");
        return;
      }

      hasReceivedFirstAIResponse = false;
      audioStreamComplete = false; // Clear any existing timeouts
      if (connectionTimeout) clearTimeout(connectionTimeout);
      if (aiResponseTimeout) clearTimeout(aiResponseTimeout);

      // Check if connection was cancelled before setting timeout
      if (!isConnecting) {
        console.log("❌ Connection cancelled before setting timeout");
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
        console.log("📦 LiveKit not loaded, loading now...");
        updateStatus("Loading LiveKit...", "connecting");
        
        try {
          await loadLiveKitSDK();
          console.log("✅ LiveKit loaded successfully");
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
        console.log("❌ Connection cancelled before token request");
        return;
      }

      // Get LiveKit token from backend
      const callId = `call_${Date.now()}`;
      window.currentCallId = callId;

      // Get agent ID from configuration or script data attributes
      let agentId = "id123"; // default fallback
      
      console.log("🔍 Debug: window.SHIVAI_CONFIG:", window.SHIVAI_CONFIG);
      console.log("🔍 Debug: document.currentScript:", document.currentScript);
      
      // First try to get from URL parameters of the widget script
      const scriptTags = document.getElementsByTagName('script');
      let foundFromUrl = false;
      
      for (let i = scriptTags.length - 1; i >= 0; i--) {
        const script = scriptTags[i];
        if (script.src && script.src.includes('/widget.js')) {
          const url = new URL(script.src);
          const urlAgentId = url.searchParams.get('agentId');
          if (urlAgentId) {
            agentId = urlAgentId;
            foundFromUrl = true;
            console.log("🎯 Using agentId from URL parameter:", agentId);
            break;
          }
        }
      }
      
      // If not found in URL, try SHIVAI_CONFIG (for preview)
      if (!foundFromUrl && window.SHIVAI_CONFIG && window.SHIVAI_CONFIG.agentId) {
        agentId = window.SHIVAI_CONFIG.agentId;
        console.log("🎯 Using agentId from SHIVAI_CONFIG:", agentId);
      } 
      // Then try to get from script data attributes (for production)
      else if (!foundFromUrl) {
        console.log("🔍 SHIVAI_CONFIG not found, checking script attributes...");
        const scriptElements = document.querySelectorAll('script[data-agent-id]');
        console.log("🔍 Found script elements with data-agent-id:", scriptElements);
        
        if (scriptElements.length > 0) {
          agentId = scriptElements[scriptElements.length - 1].getAttribute('data-agent-id');
          console.log("🎯 Using agentId from script data attribute:", agentId);
        }
        // Try to get from current script if available
        else if (document.currentScript && document.currentScript.getAttribute('data-agent-id')) {
          agentId = document.currentScript.getAttribute('data-agent-id');
          console.log("🎯 Using agentId from current script:", agentId);
        }
        else {
          console.warn("⚠️ No agentId found, using default:", agentId);
        }
      }

      const response = await fetch(
        "https://token-server-i5u4.onrender.com/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_id: agentId,
            language: selectedLanguage,
            call_id: callId,
            device: deviceType,
            user_agent: navigator.userAgent,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get LiveKit token: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ [LiveKit] Token received");

      // Check if connection was cancelled after getting token
      if (!isConnecting) {
        console.log("❌ Connection cancelled after token received");
        return;
      }

      // Handle any pending audio elements (for autoplay policy)
      if (window.pendingAudioElement) {
        window.pendingAudioElement
          .play()
          .catch((err) => console.warn("⚠️ Still cannot play audio:", err));
        window.pendingAudioElement = null;
      }

      // Create LiveKit room with enhanced feedback prevention
      room = new LivekitClient.Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          ...audioConfig,
          // Enhanced LiveKit feedback prevention
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true, // Enable for feedback prevention
          suppressLocalAudioPlayback: true, // Critical for feedback prevention
        },
        // Performance optimizations for feedback prevention
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

      // ✅ Track remote audio (agent speaking) with optimized settings
      room.on(
        LivekitClient.RoomEvent.TrackSubscribed,
        (track, publication, participant) => {
          if (track.kind === LivekitClient.Track.Kind.Audio) {
            // Use audio element with feedback prevention settings
            const audioElement = track.attach();
            audioElement.volume = 0.4; // Significantly reduced to prevent feedback
            audioElement.preload = "auto";
            audioElement.autoplay = true;

            // Add audio constraints to prevent feedback
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
            // Start monitoring remote audio with proper feedback prevention
            monitorRemoteAudioLevel(track);
            console.log(
              "🔊 Agent audio track received with feedback prevention"
            );
          }
        }
      );

      room.on(
        LivekitClient.RoomEvent.ParticipantMetadataChanged,
        (metadata, participant) => {
          console.log("📋 Participant metadata changed:", {
            metadata,
            participant: participant?.identity,
          });
          if (metadata) {
            try {
              const data = JSON.parse(metadata);
              if (data.transcript || data.text) {
                addMessage("assistant", data.transcript || data.text);
                console.log(
                  "✅ Transcript from participant metadata:",
                  data.transcript || data.text
                );
              }
            } catch (e) {
              console.log("Metadata not JSON:", metadata);
            }
          }
        }
      );

      room.on(LivekitClient.RoomEvent.RoomMetadataChanged, (metadata) => {
        console.log("🏠 Room metadata changed:", metadata);
        if (metadata) {
          try {
            const data = JSON.parse(metadata);
            if (data.transcript || data.text) {
              addMessage("assistant", data.transcript || data.text);
              console.log(
                "✅ Transcript from room metadata:",
                data.transcript || data.text
              );
            }
          } catch (e) {
            console.log("Room metadata not JSON:", metadata);
          }
        }
      });

      room.on(LivekitClient.RoomEvent.Connected, async () => {
        console.log("✅ Connected to LiveKit room");
        isConnected = true;
        retryCount = 0; // Reset retry count on successful connection

        // Show message interface when connected
        showMessageInterface();

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
          console.log("🎤 Microphone enabled with optimized settings");
        } catch (micError) {
          console.warn(
            "⚠️ Failed to enable microphone with full config, trying basic:",
            micError
          );
          try {
            // Fallback to basic microphone enabling
            await room.localParticipant.setMicrophoneEnabled(true);
            isMuted = false;
            console.log("🎤 Microphone enabled (basic mode)");
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

        // Start call timer and update status
        startCallTimer();

        // Resume audio context if suspended (browser autoplay policy)
        if (window.AudioContext || window.webkitAudioContext) {
          const audioCtx = new (window.AudioContext ||
            window.webkitAudioContext)();
          if (audioCtx.state === "suspended") {
            audioCtx
              .resume()
              .then(() => {
                console.log(
                  "🔊 Audio context resumed for better audio quality"
                );
              })
              .catch((err) =>
                console.warn("⚠️ Could not resume audio context:", err)
              );
          }
        }

        updateStatus("✅ Connected - Speak now!", "connected");

        // Stop connecting sound
        stopConnectingSound();

        // Simplified flow - microphone stays enabled
        console.log(
          "✅ Connection established - microphone ready for conversation"
        );

        // 🎤 Keep microphone ENABLED at all times
        console.log(
          "🎤 Microphone will remain enabled throughout the conversation"
        );

        // Mobile compatibility - microphone is already enabled
        if (isMobile) {
          console.log(
            "📱 Mobile device detected - microphone already enabled and ready"
          );
        }

        const audioTracks = Array.from(
          room.localParticipant.audioTrackPublications.values()
        );
        if (audioTracks.length > 0) {
          localAudioTrack = audioTracks[0].track;
          monitorLocalAudioLevel(localAudioTrack);
          console.log(
            "🎤 Audio track found and monitoring started immediately"
          );
        }

        console.log("🎤 Microphone enabled and ready for conversation");
      });

      // Room disconnected
      room.on(LivekitClient.RoomEvent.Disconnected, (reason) => {
        console.log("Disconnected from LiveKit room", reason);

        // Stop connecting sound on disconnect
        stopConnectingSound();

        if (isConnected) {
          updateStatus(
            "❌ Connection lost - Please start new call",
            "disconnected"
          );
          alert("Connection lost. Please start a new call.");
        }
        stopConversation();
      });

      // Connection state change
      room.on(LivekitClient.RoomEvent.ConnectionStateChanged, (state) => {
        console.log("🔗 Connection state:", state);
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
          console.log("📨 DataReceived EVENT FIRED:", {
            payloadLength: payload.length,
            participant: participant?.identity,
            kind,
            topic,
            timestamp: new Date().toLocaleTimeString(),
          });

          try {
            const decoder = new TextDecoder();
            const text = decoder.decode(payload);
            console.log("📝 Raw decoded text:", text);

            // SUPER AGGRESSIVE - capture ANY text that might be a transcript
            if (text && text.trim().length > 0) {
              let transcriptText = text.trim();
              let shouldAddToChat = false;
              let participantName = participant?.identity || "Agent";

              // Skip ONLY very obvious technical messages
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
                console.log("🚫 Skipping obvious technical message:", text);
                return;
              }

              console.log("🎯 Processing potential transcript:", text);

              // Try to parse as JSON first
              try {
                const jsonData = JSON.parse(text);
                console.log("📋 Parsed JSON data:", jsonData);

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
                    console.log(
                      `✅ Found text in field '${field}':`,
                      transcriptText
                    );
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
                      console.log(
                        "🚫 Skipping user chat message (already shown from sendMessage)"
                      );
                    }
                  } else if (jsonData.role === "assistant") {
                    addMessage("assistant", jsonData.text);
                  }
                  console.log("✅ Processed legacy format transcript");
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
                    console.log("✅ Added JSON transcript:", {
                      role: senderRole,
                      text: transcriptText.substring(0, 50) + "...",
                    });
                  }
                }
              } catch (e) {
                // Not JSON, treat as plain text
                console.log("📄 Not JSON, treating as plain text");

                // If it's reasonable length text (not just noise), add it
                if (text.length >= 2 && text.length <= 1000) {
                  // Assume it's from assistant unless proven otherwise
                  const isUser =
                    participant &&
                    participant.identity === room.localParticipant?.identity;
                  const senderRole = isUser ? "user" : "assistant";

                  // Add all transcripts (both user voice and assistant)
                  addMessage(senderRole, transcriptText);
                  console.log("✅ Added plain text transcript:", {
                    role: senderRole,
                    text: transcriptText.substring(0, 50) + "...",
                  });
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
          console.log("📝 Registering text stream handlers...");

          room.registerTextStreamHandler(
            "lk.transcription",
            async (reader, participantInfo) => {
              console.log(
                "🎯 Transcription stream from:",
                participantInfo.identity
              );
              try {
                const info = reader.info;
                console.log("Stream info:", {
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

                console.log("Transcription attributes:", {
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
                    console.log(
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
                      console.log(
                        "🚫 Skipping duplicate - same message already exists in UI:",
                        text
                      );
                      return;
                    }
                  }

                  // Add transcriptions
                  addMessage(senderName, text);
                  console.log("✅ Transcription added:", {
                    sender: senderName,
                    text,
                    isFinal,
                  });
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
              console.log("💬 Chat stream from:", participantInfo.identity);
              try {
                const text = await reader.readAll();
                const isUser =
                  participantInfo.identity === room.localParticipant?.identity;

                if (!isUser && text && text.trim()) {
                  console.log("💬 AI Chat response received:", text);
                  addMessage("assistant", text, { source: "chat" });
                  console.log("💬 Chat message added:", {
                    sender: participantInfo.identity,
                    text,
                  });
                }
              } catch (error) {
                console.error("❌ Error processing chat stream:", error);
              }
            }
          );

          console.log("✅ Text stream handlers registered successfully");
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
        console.log("❌ Connection cancelled before room connection");
        return;
      }

      await room.connect(data.url, data.token);
      console.log("🔗 Room connected successfully");

      // Check if connection was cancelled during room connection
      if (!isConnecting) {
        console.log("❌ Connection cancelled during room connection");
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
        console.log("🎤 Microphone monitoring started");
      }

      console.log("🎤 Microphone enabled with LiveKit");
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
    console.log("🛑 stopConversation() called");

    // Stop connecting sound immediately
    stopConnectingSound();

    isConnected = false;
    isConnecting = false;
    hasReceivedFirstAIResponse = false;
    shouldAutoUnmute = false;
    isMuted = false;
    aiJustFinished = false;

    // Hide message interface when disconnected
    hideMessageInterface();

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
      console.log("🔌 Closing WebSocket in stopConversation");
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
    if (window.currentCallId) {
      try {
        updateStatus("Disconnecting...", "connecting");
        const response = await fetch(
          "https://shivai-com-backend.onrender.com/api/v1/calls/end-call",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              callId: window.currentCallId,
            }),
          }
        );
        if (response.ok) {
          const data = await response.json();
          console.log("Call ended successfully:", data);
        }
      } catch (error) {
        console.error("Error ending call:", error);
      } finally {
        window.currentCallId = null;
      }
    }

    // Disconnect LiveKit room
    if (room) {
      await room.disconnect();
      room = null;
      console.log("🔴 LiveKit room disconnected");
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

    console.log("✅ Conversation stopped - LiveKit cleanup complete");
  }

  // Remove unused WebSocket audio streaming function
  function startAudioStreaming() {
    // This function is no longer needed with LiveKit
    console.log("startAudioStreaming called but not needed with LiveKit");
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      loadLiveKitSDK()
        .then(() => {
          console.log("🚀 Initializing widget with LiveKit support");
          initWidget();
        })
        .catch((error) => {
          console.error("❌ Failed to load LiveKit SDK:", error);
          console.log(
            "⚠️ Initializing widget anyway (LiveKit features may not work)"
          );
          initWidget();
        });
    });
  } else {
    loadLiveKitSDK()
      .then(() => {
        console.log("🚀 Initializing widget with LiveKit support");
        initWidget();
      })
      .catch((error) => {
        console.error("❌ Failed to load LiveKit SDK:", error);
        console.log(
          "⚠️ Initializing widget anyway (LiveKit features may not work)"
        );
        initWidget();
      });
  }
})(window, document);
