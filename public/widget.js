(function () {
  "use strict";
  
  // ✅ Load LiveKit SDK dynamically
  function loadLiveKitSDK() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (typeof LivekitClient !== 'undefined') {
        console.log('✅ LiveKit already loaded');
        resolve();
        return;
      }
      
      console.log('📦 Loading LiveKit SDK...');
      
      // Load livekit-client directly (components-core not needed)
      const clientScript = document.createElement('script');
      clientScript.src = 'https://unpkg.com/livekit-client@2.5.8/dist/livekit-client.umd.js';
      clientScript.onload = () => {
        console.log('✅ LiveKit client loaded successfully');
        resolve();
      };
      clientScript.onerror = () => {
        console.error('❌ Failed to load LiveKit client');
        reject(new Error('Failed to load LiveKit client'));
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
  let userInteracted = false;
  let audioBufferingStarted = false;
  let minBufferChunks = 3;
  let audioStreamComplete = false;
  let ringAudio = null;
  let messageBubble = null;
  let connectionTimeout = null;
  let aiResponseTimeout = null;
  let retryCount = 0;
  const MAX_RETRIES = 2;
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
    isAgentSpeaking: false
  };
  
  let liveMessages = [
    "📞 Call ShivAI!",
    "📞 Call ShivAI!",
    "📞 Call ShivAI!",
    "📞 Call ShivAI!",
  ];
  let currentMessageIndex = 0;
  let messageInterval = null;
  let triggerBtn = null;
  let widgetContainer = null;
  let landingView = null;
  let callView = null;
  let statusDiv = null;
  let connectBtn = null;
  let messagesDiv = null;
  let clearBtn = null;
  let muteBtn = null;
  let visualizerBars = null;
  let languageSelect = null;
  let currentView = "landing";
  let callTimerElement = null;
  let callStartTime = null;
  let callTimerInterval = null;
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
    const frequencies = [440, 554, 659];
    let delay = 0;
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        generateTone(freq, 0.15, 0.3);
      }, delay);
      delay += 120;
    });
  }
  
  function playRingSound() {
    try {
      if (!ringAudio) {
        ringAudio = new Audio('./assets/Rings/ring1.mp3');
        ringAudio.loop = true;
        ringAudio.volume = 0.7;
      }
      ringAudio.currentTime = 0;
      ringAudio.play().catch(error => {
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
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const mediaStream = new MediaStream([track.mediaStreamTrack]);
    const source = audioContext.createMediaStreamSource(mediaStream);
    
    source.connect(analyser);
    analyser.fftSize = 256;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const SPEECH_THRESHOLD = 30;
    const SILENCE_DURATION = 800; // 800ms of silence = end of speech
    let silenceStart = null;
    
    function checkAudioLevel() {
      if (!isConnected) return;
      
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      
      if (average > SPEECH_THRESHOLD) {
        // User is speaking
        if (!latencyMetrics.isSpeaking) {
          latencyMetrics.isSpeaking = true;
          latencyMetrics.userSpeechStartTime = performance.now();
          console.log('👤 User started speaking');
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
            console.log('👤 User stopped speaking');
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
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const mediaStream = new MediaStream([track.mediaStreamTrack]);
    const source = audioContext.createMediaStreamSource(mediaStream);
    
    source.connect(analyser);
    analyser.fftSize = 256;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const SPEECH_THRESHOLD = 20;
    
    function checkAudioLevel() {
      // Clear AI response timeout when agent starts speaking
      if (aiResponseTimeout && !hasReceivedFirstAIResponse) {
        clearTimeout(aiResponseTimeout);
        aiResponseTimeout = null;
        console.log('✅ AI response received - timeout cleared');
      }
      if (!isConnected) return;
      
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      
      if (average > SPEECH_THRESHOLD && !latencyMetrics.isAgentSpeaking) {
        // Agent started responding
        latencyMetrics.isAgentSpeaking = true;
        
        // Start timer on first AI response
        if (!hasReceivedFirstAIResponse) {
          hasReceivedFirstAIResponse = true;
          startCallTimer();
          console.log('🎉 First AI response - timer started');
        }
        
        if (latencyMetrics.userSpeechEndTime) {
          latencyMetrics.agentResponseStartTime = performance.now();
          const latency = latencyMetrics.agentResponseStartTime - latencyMetrics.userSpeechEndTime;
          
          latencyMetrics.measurements.push(latency);
          if (latencyMetrics.measurements.length > latencyMetrics.maxSamples) {
            latencyMetrics.measurements.shift();
          }
          
          console.log(`⚡ Response latency: ${Math.round(latency)}ms`);
          updateStatus("🤖 AI Speaking...", "speaking");
          
          latencyMetrics.userSpeechEndTime = null;
        }
      } else if (average <= SPEECH_THRESHOLD && latencyMetrics.isAgentSpeaking) {
        latencyMetrics.isAgentSpeaking = false;
        updateStatus("🟢 Connected - Speak naturally!", "connected");
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
    landingView.innerHTML = `
      <div class="widget-header">
        <div class="header-content">
          <button class="widget-close" aria-label="Close widget">×</button>
          <div class="header-info">
            <div class="widget-avatar">
             <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 1500">
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
    </svg>
            </div>
            <div class="header-text">
              <div class="widget-title">AI Employee</div>
              <div class="widget-subtitle">ShivAI offers 24/7 voice support to handle your business calls efficiently and professionally.</div>
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
    callView.innerHTML = `
    <div class="call-visualizer" id="call-visualizer">
      <div class="call-header">
      <button class="back-btn" id="back-btn" aria-label="Back to landing">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      </button>
      <div class="call-info">
      <div class="call-info-name text-2xl">ShivAI Employee</div>
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
    clearBtn = document.getElementById("shivai-clear");
    muteBtn = document.getElementById("shivai-mute");
    visualizerBars = document.querySelectorAll(".visualizer-bar");
    languageSelect = document.getElementById("shivai-language");
    callTimerElement = document.getElementById("call-timer");
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
      background: linear-gradient(135deg, #4b5563 0%, #6b7280 30%, #374151 70%, #1f2937 100%);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15);
      }
      .shivai-trigger:hover {
      transform: scale(1.1);
      background: linear-gradient(135deg, #6b7280 0%, #9ca3af 30%, #4b5563 70%, #374151 100%);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35), 0 4px 12px rgba(0, 0, 0, 0.25);
      }
      .shivai-trigger:active {
      transform: scale(0.95);
      background: linear-gradient(135deg, #374151 0%, #4b5563 30%, #1f2937 70%, #111827 100%);
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
      width: 360px;
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
      background: linear-gradient(135deg, #4b5563 0%, #6b7280 30%, #374151 70%, #1f2937 100%);
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
      background: linear-gradient(135deg, #6b7280 0%, #9ca3af 30%, #4b5563 70%, #374151 100%);
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
      background: linear-gradient(180deg, #6b7280 0%, #4b5563 100%);
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
        background: linear-gradient(180deg, #6b7280 0%, #4b5563 100%);
      }
      50% {
        height: 24px;
        opacity: 1;
        background: linear-gradient(180deg, #4b5563 0%, #374151 100%);
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
      background: linear-gradient(180deg, #6b7280 0%, #4b5563 100%);
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
      background: linear-gradient(135deg, #4b5563 0%, #6b7280 30%, #374151 70%, #1f2937 100%);
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
      background: linear-gradient(135deg, #6b7280 0%, #9ca3af 30%, #4b5563 70%, #374151 100%);
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
        max-height: 450px;
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
      }
    `;
    const styleSheet = document.createElement("style");
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
          // source.connect(soundContext.destination);
          source.start();
        }
      } catch (e) {
        console.warn("🍎 [iOS] Audio unlock failed:", e);
      }
    }

    if (isConnecting) {
      return;
    }
    if (isConnected) {
      console.log("🔴 Immediate hang up requested");
      isConnected = false;
      isConnecting = false;
      stopRingSound(); // Stop ring sound when hanging up
      clearLoadingStatus();
      stopCallTimer();
      if (ws) {
        console.log("🔌 Closing WebSocket immediately");
        ws.close();
        ws = null;
      }
      stopAllScheduledAudio();
      updateStatus("Disconnecting...", "connecting");
      connectBtn.disabled = true;
      stopConversation().finally(() => {
        connectBtn.disabled = false;
        console.log("✅ Hang up completed");
      });
      return;
    } else {
      isConnecting = true;
      connectBtn.disabled = true;
      playSound("ring"); // Start playing ring sound during loading
      try {
        connectBtn.innerHTML =
          '<svg width="26" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" transform="rotate(135 12 12)"></path></svg>';
        connectBtn.classList.add("connected");
        connectBtn.title = "Hang Up";
        await startConversation();
        connectBtn.disabled = false;
        isConnecting = false;
      } catch (error) {
        console.error("Failed to start conversation:", error);
        stopRingSound(); // Stop ring sound on error
        isConnected = false;
        isConnecting = false;
        hasReceivedFirstAIResponse = false;
        shouldAutoUnmute = false;
        clearLoadingStatus();
        stopCallTimer();
        updateStatus("❌ Failed to connect", "disconnected");
        connectBtn.innerHTML =
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
        connectBtn.classList.remove("connected");
        connectBtn.title = "Start Call";
        connectBtn.disabled = false;
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
    if (!isConnected || !mediaStream) return;
    isMuted = !isMuted;
    updateMuteButton();
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
    const emptyState = messagesDiv.querySelector(".empty-state");
    if (emptyState) {
      emptyState.remove();
    }
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role}`;
    const labelDiv = document.createElement("div");
    labelDiv.className = "message-label";
    labelDiv.textContent = role === "user" ? "You" : "Assistant";
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
  async function startConversation() {
    try {
      hasReceivedFirstAIResponse = false;
      shouldAutoUnmute = true;
      audioStreamComplete = false;
      
      // Clear any existing timeouts
      if (connectionTimeout) clearTimeout(connectionTimeout);
      if (aiResponseTimeout) clearTimeout(aiResponseTimeout);
      
      // Set connection timeout
      connectionTimeout = setTimeout(() => {
        if (!isConnected) {
          console.error('❌ Connection timeout - AI server not responding');
          updateStatus('⚠️ Connection timeout', 'disconnected');
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`🔄 Retrying connection... Attempt ${retryCount}/${MAX_RETRIES}`);
            stopConversation().then(() => {
              setTimeout(() => startConversation(), 2000);
            });
          } else {
            updateStatus('❌ Unable to connect. Please try again later.', 'disconnected');
            alert('Unable to connect to AI. The service might be busy. Please try again in a few moments.');
            stopConversation();
            retryCount = 0;
          }
        }
      }, CONNECTION_TIMEOUT);
      
      await showProgressiveConnectionStates();
      
      const selectedLanguage = languageSelect.value;
      const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
      
      // Check LiveKit support
      if (typeof LivekitClient === 'undefined') {
        console.error('❌ LiveKit client library not loaded');
        updateStatus("❌ LiveKit not available", "disconnected");
        alert("LiveKit library is not loaded. Please refresh the page.");
        throw new Error("LiveKit not available");
      }
      
      updateStatus("Connecting to LiveKit...", "connecting");
      
      // Get LiveKit token from backend
      const callId = `call_${Date.now()}`;
      window.currentCallId = callId;
      
      const response = await fetch('https://test-livekit-agent.onrender.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: 'test-agent',
          language: selectedLanguage,
          call_id: callId,
          device: deviceType,
          user_agent: navigator.userAgent
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get LiveKit token: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ [LiveKit] Token received');
      
      // Create LiveKit room
      room = new LivekitClient.Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
          sampleSize: 16,
        }
      });
      
      // ✅ Track remote audio (agent speaking)
      room.on(LivekitClient.RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === LivekitClient.Track.Kind.Audio) {
          // Create Web Audio API gain boost for louder volume
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const source = audioContext.createMediaStreamSource(new MediaStream([track.mediaStreamTrack]));
            const gainNode = audioContext.createGain();
            gainNode.gain.value = isIOS() ? 2.0 : 1.0;  // 🔊 2x volume boost for iOS, 1x for other devices
            source.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          // Keep regular element too
          const audioElement = track.attach();
          audioElement.volume = 1.0;
          document.body.appendChild(audioElement);
          audioElement.play();
          
          remoteAudioTrack = track;
          monitorRemoteAudioLevel(track);
          console.log('🔊 Agent audio track received with 2x volume boost - monitoring started');
        }
      });
      
      // Room connected
      room.on(LivekitClient.RoomEvent.Connected, async () => {
        console.log('✅ Connected to LiveKit room');
        isConnected = true;
        retryCount = 0; // Reset retry count on successful connection
        
        // Clear connection timeout
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
        
        updateStatus('✅ Connected - Waiting for AI...', 'connected');
        playSound('call-start');
        
        languageSelect.disabled = true;
        stopRingSound();
        
        // Set AI response timeout
        aiResponseTimeout = setTimeout(() => {
          if (!hasReceivedFirstAIResponse) {
            console.warn('⚠️ AI not responding - may be initializing');
            updateStatus('⚠️ AI is taking longer than usual...', 'connected');
            
            // Extended timeout
            setTimeout(() => {
              if (!hasReceivedFirstAIResponse) {
                console.error('❌ AI response timeout');
                updateStatus('❌ AI not responding', 'disconnected');
                alert('AI agent is not responding. Please try again.');
                stopConversation();
              }
            }, 15000); // Additional 15 secondsclear token
          }
        }, AI_RESPONSE_TIMEOUT);
        
        // Don't start timer here - wait for first AI response
      });
      
      // Room disconnected
      room.on(LivekitClient.RoomEvent.Disconnected, (reason) => {
        console.log('Disconnected from LiveKit room', reason);
        if (isConnected) {
          updateStatus('❌ Connection lost', 'disconnected');
        }
        stopConversation();
      });
      
      // Connection state change
      room.on(LivekitClient.RoomEvent.ConnectionStateChanged, (state) => {
        console.log('🔗 Connection state:', state);
        if (state === LivekitClient.ConnectionState.Reconnecting) {
          updateStatus('🔄 Reconnecting...', 'connecting');
        } else if (state === LivekitClient.ConnectionState.Disconnected) {
          updateStatus('❌ Disconnected', 'disconnected');
        }
      });
      
      // Data received
      room.on(LivekitClient.RoomEvent.DataReceived, (payload, participant) => {
        try {
          const data = JSON.parse(new TextDecoder().decode(payload));
          console.log('📨 Data received:', data);
          
          // Handle transcripts and events from agent
          if (data.type === 'transcript') {
            if (data.role === 'user') {
              if (!lastUserMessageDiv) {
                lastUserMessageDiv = addMessage("user", data.text);
              } else {
                updateMessage(lastUserMessageDiv, data.text);
              }
            } else if (data.role === 'assistant') {
              addMessage("assistant", data.text);
            }
          }
        } catch (e) {
          console.error('Error parsing data:', e);
        }
      });
      
      // Connect to room
      await room.connect(data.url, data.token);
      console.log('🔗 LiveKit room connected successfully');
      
      // ✅ Enable microphone and monitor local audio
      await room.localParticipant.setMicrophoneEnabled(true, {
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 48000,
        sampleSize: 16,
      });
      
      // Get local audio track and start monitoring
      const audioTracks = Array.from(room.localParticipant.audioTrackPublications.values());
      if (audioTracks.length > 0) {
        localAudioTrack = audioTracks[0].track;
        monitorLocalAudioLevel(localAudioTrack);
        console.log('🎤 Microphone monitoring started');
      }
      
      console.log('🎤 Microphone enabled with LiveKit');
      
    } catch (error) {
      console.error("❌ Connection Error:", error);
      clearLoadingStatus();
      
      // Clear timeouts
      if (connectionTimeout) clearTimeout(connectionTimeout);
      if (aiResponseTimeout) clearTimeout(aiResponseTimeout);
      
      // Show user-friendly error message
      let errorMsg = 'Connection failed';
      if (error.message.includes('token')) {
        errorMsg = 'Authentication failed';
      } else if (error.message.includes('timeout')) {
        errorMsg = 'Connection timeout';
      } else if (error.message.includes('network')) {
        errorMsg = 'Network error';
      }
      
      updateStatus(`❌ ${errorMsg}`, "disconnected");
      
      // Retry logic
      if (retryCount < MAX_RETRIES && !error.message.includes('token')) {
        retryCount++;
        console.log(`🔄 Retrying connection... Attempt ${retryCount}/${MAX_RETRIES}`);
        setTimeout(() => startConversation(), 2000);
      } else {
        if (retryCount >= MAX_RETRIES) {
          alert('Unable to connect after multiple attempts. Please check your internet connection and try again.');
        }
        stopConversation();
        retryCount = 0;
      }
    }
  }
  async function stopConversation() {
    console.log("🛑 stopConversation() called");
    isConnected = false;
    isConnecting = false;
    hasReceivedFirstAIResponse = false;
    shouldAutoUnmute = false;
    isMuted = false;
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
    document.querySelectorAll('audio').forEach(el => el.remove());
    
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
        processedSample = Math.max(-maxOutput, Math.min(maxOutput, processedSample));
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
    stopRingSound(); // Stop ring sound when stopping all audio
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
  
  // ✅ Load LiveKit SDK first, then initialize widget
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      loadLiveKitSDK()
        .then(() => {
          console.log('🚀 Initializing widget with LiveKit support');
          initWidget();
        })
        .catch((error) => {
          console.error('❌ Failed to load LiveKit SDK:', error);
          console.log('⚠️ Initializing widget anyway (LiveKit features may not work)');
          initWidget();
        });
    });
  } else {
    loadLiveKitSDK()
      .then(() => {
        console.log('🚀 Initializing widget with LiveKit support');
        initWidget();
      })
      .catch((error) => {
        console.error('❌ Failed to load LiveKit SDK:', error);
        console.log('⚠️ Initializing widget anyway (LiveKit features may not work)');
        initWidget();
      });
  }
})(window, document);
