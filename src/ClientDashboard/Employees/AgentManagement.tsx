import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import GlassCard from "../../components/GlassCard";
import SearchableSelect from "../../components/SearchableSelect";
import Tooltip from "../../components/Tooltip";
import { AgentWidgetCustomization, AgentQRModal, AgentIntegrationCode } from "./agents";
import SessionTranscriptModal from "./agents/SessionTranscriptModal";
import { useAgent } from "../../contexts/AgentContext";
import { useAuth } from "../../contexts/AuthContext";
import { isDeveloperUser } from "../../lib/utils";
import { liveKitService, LiveKitMessage, LiveKitCallbacks } from "../../services/liveKitService";
import { agentAPI } from "../../services/agentAPI";
import {
  Bot,
  ArrowLeft,
  Save,
  Play,
  Pause,
  Eye,
  Edit,
  Trash2,
  Copy,
  Download,
  MessageSquare,
  Globe,
  Shield,
  Zap,
  Clock,
  Users,
  CheckCircle,
  Info,
  Lightbulb,
  Plus,
  Search,
  Filter,
  Settings,
  QrCode,
  X,
  Send,
  Phone,
  PhoneCall,
  Mic,
  MicOff,
  BarChart3,
} from "lucide-react";

const AgentManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { agents, currentAgent, setCurrentAgent, addAgent, updateAgent, publishAgentStatus, unpublishAgentStatus, refreshAgents } =
    useAgent();
  const { user } = useAuth();

  // Check if current user is developer
  const isDeveloper = isDeveloperUser(user?.email);

  const isCreate = location.pathname.includes("/create");
  const isEdit = location.pathname.includes("/edit");
  const isTrain = location.pathname.includes("/train");
  const isView = id && !isEdit && !isTrain;
  const isList = !id && !isCreate; // Main agent list page

  const [formData, setFormData] = useState({
    name: "",
    gender: "Female",
    businessProcess: "",
    industry: "",
    persona: "Empathetic",
    language: "English (US)",
    voice: "Sarah - Professional",
    customInstructions: "",
    guardrailsLevel: "Medium",
    responseStyle: "Balanced",
    maxResponseLength: "Medium (150 words)",
    contextWindow: "Standard (8K tokens)",
    temperature: 50,
  });

  const [showTemplates, setShowTemplates] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showQRModal, setShowQRModal] = useState(false);
  const [showTestChat, setShowTestChat] = useState(false);
  const [activeTestTab, setActiveTestTab] = useState<'call' | 'conversation'>('call');
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [callTimerInterval, setCallTimerInterval] = useState<number | null>(null);
  const [messages, setMessages] = useState<Array<{id: string, text: string, isUser: boolean, timestamp: Date, source?: string}>>([    
    {
      id: '1',
      text: `Hi! I'm ${currentAgent?.name || 'your AI assistant'}. How can I help you today?`,
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [testInput, setTestInput] = useState("");
  const recentMessagesRef = useRef<Set<string>>(new Set());
  const lastMessageTimeRef = useRef<number>(0);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [publishingAgents, setPublishingAgents] = useState<Set<string>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [statusMessage, setStatusMessage] = useState('Ready to connect');
  const [isMuted, setIsMuted] = useState(false);
  const [testStatus, setTestStatus] = useState('📞 Ready to start call');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<any>(null);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionSearchTerm, setSessionSearchTerm] = useState("");
  const [sessionDeviceFilter, setSessionDeviceFilter] = useState("all");
  const [sessionTimeFilter, setSessionTimeFilter] = useState("all");
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  useEffect(() => {
    // Setup LiveKit callbacks
    const callbacks: LiveKitCallbacks = {
      onMessage: (message: LiveKitMessage) => {
        setMessages(prev => [...prev, {
          id: String(message.id),
          text: message.text,
          isUser: message.isUser,
          timestamp: message.timestamp,
          source: message.source
        }]);
      },
      onConnected: () => {
        setIsCallActive(true);
        setConnectionStatus('connected');
        setStatusMessage('Connected - Speak now!');
        setIsTestLoading(false);
      },
      onDisconnected: () => {
        setIsCallActive(false);
        setConnectionStatus('disconnected');
        setStatusMessage('Disconnected');
        setIsTestLoading(false);
        if (callTimerInterval) {
          clearInterval(callTimerInterval);
          setCallTimerInterval(null);
        }
        setCallDuration(0);
      },
      onConnectionStateChange: (state) => {
        console.log('Connection state changed:', state);
      },
      onError: (error) => {
        setConnectionStatus('disconnected');
        setStatusMessage(error);
        setIsTestLoading(false);
        setIsCallActive(false);
        console.error('LiveKit error:', error);
      },
      onStatusUpdate: (status, state) => {
        setStatusMessage(status);
        setConnectionStatus(state);
      }
    };

    liveKitService.setCallbacks(callbacks);

    // Cleanup on unmount
    return () => {
      liveKitService.disconnect();
      if (callTimerInterval) {
        clearInterval(callTimerInterval);
      }
    };
  }, [callTimerInterval]);

  useEffect(() => {
    if (id && !isCreate) {
      const agent = agents.find((a) => a.id === id);
      if (agent) {
        setCurrentAgent(agent);
        setFormData({
          name: agent.name,
          gender: "Female",
          businessProcess: "",
          industry: "",
          persona: agent.persona,
          language: agent.language,
          voice: agent.voice,
          customInstructions: "",
          guardrailsLevel: "Medium",
          responseStyle: "Balanced",
          maxResponseLength: "Medium (150 words)",
          contextWindow: "Standard (8K tokens)",
          temperature: 50,
        });
        // Reset messages when agent changes
        setMessages([]);
        // Fetch session history for this agent
        fetchSessionHistory(agent.id);
      }
    } else if (isCreate) {
      setFormData({
        name: "",
        gender: "Female",
        businessProcess: "",
        industry: "",
        persona: "Empathetic",
        language: "English (US)",
        voice: "Sarah - Professional",
        customInstructions: "",
        guardrailsLevel: "Medium",
        responseStyle: "Balanced",
        maxResponseLength: "Medium (150 words)",
        contextWindow: "Standard (8K tokens)",
        temperature: 50,
      });
    }
  }, [id, isCreate, agents, setCurrentAgent]);

  // Fetch session history from API
  const fetchSessionHistory = async (agentId: string) => {
    setSessionLoading(true);
    setSessionError(null);
    
    try {
      const response = await agentAPI.getAgentSessions(agentId);
      // response is already response.data.data from the API service
      // which contains { sessions: [...], pagination: {...} }
      const sessions = response?.sessions || [];
      setSessionHistory(sessions);
      console.log('✅ Session history loaded:', sessions.length, 'sessions');
    } catch (error) {
      console.error('❌ Error fetching session history:', error);
      setSessionError(error instanceof Error ? error.message : 'Failed to load session history');
      setSessionHistory([]);
    } finally {
      setSessionLoading(false);
    }
  };

  const businessProcesses = [
    { value: "customer-support", label: "Customer Support", group: "Support" },
    { value: "sales-marketing", label: "Sales & Marketing", group: "Sales" },
    {
      value: "appointment-setting",
      label: "Appointment Setting",
      group: "Sales",
    },
    {
      value: "lead-qualification",
      label: "Lead Qualification",
      group: "Sales",
    },
    {
      value: "product-explanation",
      label: "Product Explanation",
      group: "Support",
    },
    {
      value: "order-processing",
      label: "Order Processing",
      group: "Operations",
    },
    {
      value: "technical-support",
      label: "Technical Support",
      group: "Support",
    },
    {
      value: "billing-inquiries",
      label: "Billing Inquiries",
      group: "Support",
    },
    {
      value: "feedback-collection",
      label: "Feedback Collection",
      group: "Operations",
    },
    { value: "onboarding", label: "Customer Onboarding", group: "Operations" },
  ];

  const industries = [
    { value: "real-estate", label: "Real Estate" },
    { value: "healthcare", label: "Healthcare" },
    { value: "dental", label: "Dental" },
    { value: "fitness", label: "Fitness & Wellness" },
    { value: "education", label: "Education" },
    { value: "finance", label: "Finance & Banking" },
    { value: "insurance", label: "Insurance" },
    { value: "ecommerce", label: "E-commerce" },
    { value: "retail", label: "Retail" },
    { value: "technology", label: "Technology" },
    { value: "saas", label: "SaaS" },
    { value: "legal", label: "Legal Services" },
    { value: "consulting", label: "Consulting" },
    { value: "accounting", label: "Accounting" },
    { value: "hospitality", label: "Hospitality" },
    { value: "restaurants", label: "Restaurants" },
    { value: "automotive", label: "Automotive" },
    { value: "construction", label: "Construction" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "travel", label: "Travel & Tourism" },
    { value: "beauty", label: "Beauty & Salon" },
    { value: "home-services", label: "Home Services" },
    { value: "nonprofit", label: "Non-Profit" },
    { value: "government", label: "Government" },
    { value: "entertainment", label: "Entertainment" },
    { value: "other", label: "Other" },
  ];

  const genders = [
    { value: "Female", label: "Female" },
    { value: "Male", label: "Male" },
    { value: "Non-binary", label: "Non-binary" },
    { value: "Other", label: "Other" },
  ];

  const templates = {
    "customer-support-real-estate": {
      name: "Real Estate Support Agent",
      description:
        "Handles property inquiries, scheduling viewings, and providing property information",
      features: [
        "Property Search",
        "Viewing Scheduling",
        "Market Updates",
        "Document Assistance",
      ],
      persona: "Formal",
      customInstructions:
        "You are a knowledgeable real estate assistant. Help clients with property inquiries, schedule viewings, provide market insights, and assist with documentation. Always be professional and detail-oriented.",
      guardrailsLevel: "High",
    },
    "sales-marketing-healthcare": {
      name: "Healthcare Sales Assistant",
      description:
        "Promotes healthcare services, books consultations, and provides service information",
      features: [
        "Service Promotion",
        "Consultation Booking",
        "Insurance Queries",
        "Health Education",
      ],
      persona: "Empathetic",
      customInstructions:
        "You are a caring healthcare sales assistant. Help patients understand services, book appointments, answer insurance questions, and provide health education. Always prioritize patient care and privacy.",
      guardrailsLevel: "High",
    },
    "appointment-setting-dental": {
      name: "Dental Appointment Scheduler",
      description:
        "Schedules dental appointments, handles cancellations, and provides dental care information",
      features: [
        "Appointment Booking",
        "Reminder Calls",
        "Treatment Info",
        "Insurance Verification",
      ],
      persona: "Reassuring (Support)",
      customInstructions:
        "You are a friendly dental appointment scheduler. Help patients book appointments, provide treatment information, handle insurance verification, and ease dental anxiety with reassuring communication.",
      guardrailsLevel: "Medium",
    },
    "lead-qualification-saas": {
      name: "SaaS Lead Qualifier",
      description:
        "Qualifies software leads, demos features, and nurtures prospects through the sales funnel",
      features: [
        "Lead Scoring",
        "Demo Scheduling",
        "Feature Explanation",
        "Pricing Information",
      ],
      persona: "Persuasive (Sales)",
      customInstructions:
        "You are a tech-savvy SaaS sales assistant. Qualify leads by understanding their needs, explain software features, schedule demos, and provide pricing information. Focus on value proposition and ROI.",
      guardrailsLevel: "Medium",
    },
  };

  const getTemplate = () => {
    const key = `${formData.businessProcess}-${formData.industry}`;
    return (
      templates[key as keyof typeof templates] || {
        name: `${
          businessProcesses.find((bp) => bp.value === formData.businessProcess)
            ?.label || "Custom"
        } Agent`,
        description: `Handles ${
          businessProcesses
            .find((bp) => bp.value === formData.businessProcess)
            ?.label?.toLowerCase() || "various tasks"
        } for ${
          industries
            .find((ind) => ind.value === formData.industry)
            ?.label?.toLowerCase() || "your business"
        }`,
        features: [
          "Customer Interaction",
          "Query Resolution",
          "Information Provision",
          "Process Automation",
        ],
        persona: "Friendly",
        customInstructions: `You are a professional AI assistant specializing in ${
          businessProcesses
            .find((bp) => bp.value === formData.businessProcess)
            ?.label?.toLowerCase() || "customer service"
        } for the ${
          industries
            .find((ind) => ind.value === formData.industry)
            ?.label?.toLowerCase() || "business"
        } industry. Provide helpful, accurate, and timely assistance to users.`,
        guardrailsLevel: "Medium",
      }
    );
  };

  const applyTemplate = () => {
    const template = getTemplate();
    setFormData((prev) => ({
      ...prev,
      persona: template.persona,
      customInstructions: template.customInstructions,
      guardrailsLevel: template.guardrailsLevel,
    }));
    setShowTemplates(false);
  };

  const handleSave = () => {
    // Validate agent name
    if (!formData.name || formData.name.trim() === "") {
      alert("Agent name is required. Please enter a name for your agent.");
      return;
    }

    if (isCreate) {
      addAgent({
        name: formData.name,
        status: "Draft",
        persona: formData.persona,
        language: formData.language,
        voice: formData.voice,
        stats: {
          conversations: 0,
          successRate: 0,
          avgResponseTime: 0,
          activeUsers: 0,
        },
      });
      navigate("/agents");
    } else if (isEdit && currentAgent) {
      updateAgent(currentAgent.id, {
        name: formData.name,
        persona: formData.persona,
        language: formData.language,
        voice: formData.voice,
      });
      navigate(`/agents/${currentAgent.id}`);
    }
  };

  const handlePublish = async (agentId: string) => {
    try {
      // Add to publishing set for loading state
      setPublishingAgents(prev => new Set(prev).add(agentId));
      
      await publishAgentStatus(agentId);
      await refreshAgents();
      console.log('✅ Agent published successfully');
    } catch (error: any) {
      console.error('❌ Error publishing agent:', error);
      alert(error.message || 'Failed to publish agent. Please try again.');
    } finally {
      // Remove from publishing set
      setPublishingAgents(prev => {
        const next = new Set(prev);
        next.delete(agentId);
        return next;
      });
    }
  };

  const handlePause = async (agentId: string) => {
    try {
      // Add to publishing set for loading state
      setPublishingAgents(prev => new Set(prev).add(agentId));
      
      await unpublishAgentStatus(agentId);
      await refreshAgents();
      console.log('✅ Agent paused successfully');
    } catch (error: any) {
      console.error('❌ Error pausing agent:', error);
      alert(error.message || 'Failed to pause agent. Please try again.');
    } finally {
      // Remove from publishing set
      setPublishingAgents(prev => {
        const next = new Set(prev);
        next.delete(agentId);
        return next;
      });
    }
  };

  const handleTestSend = async () => {
    if (!testInput.trim() || isTestLoading) return;

    const message = testInput.trim();
    const now = Date.now();
    
    // Prevent rapid duplicate sends
    if (now - lastMessageTimeRef.current < 1000) {
      console.log('🚫 Message sent too quickly, preventing duplicate');
      return;
    }
    
    // Create unique message key
    const messageKey = `user-${message}-${Math.floor(now / 1000)}`; // Group by second
    
    if (recentMessagesRef.current.has(messageKey)) {
      console.log('🚫 Duplicate message prevented:', message);
      setTestInput("");
      return;
    }
    
    // Track this message
    recentMessagesRef.current.add(messageKey);
    lastMessageTimeRef.current = now;
    
    // Clear old messages from tracking (keep only last 10 seconds)
    setTimeout(() => {
      recentMessagesRef.current.delete(messageKey);
    }, 10000);
    
    setTestInput("");
    setIsTestLoading(true);

    try {
      // Add user message to UI immediately
      const userMessage = {
        id: `user-chat-${now}-${Math.random()}`,
        text: message,
        isUser: true,
        timestamp: new Date(),
        source: 'chat'
      };
      setMessages(prev => [...prev, userMessage]);

      // If connected to LiveKit room, send via room's data channel - same as widget.js
      if (room && connectionStatus === 'connected') {
        const LiveKit = (window as any).LivekitClient;
        const messageData = JSON.stringify({
          type: 'chat',
          text: message,
          timestamp: new Date().toISOString(),
          source: 'typed'
        });
        
        // Send to all participants via data channel
        const encoder = new TextEncoder();
        const data = encoder.encode(messageData);
        await room.localParticipant.publishData(data, LiveKit.DataPacket_Kind.RELIABLE);
        
        console.log('💬 Message sent via LiveKit:', message);
      } else {
        // Fallback to simulation if not connected
        setTimeout(() => {
          const responses = [
            "I understand you're looking for help. Let me assist you with that based on my training and configuration.",
            "Thank you for your message. As an AI Employee, I'm designed to help with various tasks in a professional manner.",
            "I appreciate your question. Based on my role as your AI Employee, I'd be happy to provide assistance.",
            "That's an interesting point. As your AI Employee, here's how I can help you.",
            "I see what you're asking about. As an AI Employee, I'm here to provide helpful, accurate information.",
          ];

          const agentMessage = {
            id: `fallback-${Date.now()}-${Math.random()}`,
            text: responses[Math.floor(Math.random() * responses.length)],
            isUser: false,
            timestamp: new Date(),
            source: 'chat'
          };

          setMessages(prev => [...prev, agentMessage]);
          setIsTestLoading(false);
        }, 1000 + Math.random() * 2000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTestLoading(false);
    }
  };

  // Working LiveKit connection implementation (based on your working React component)
  const startAgentCall = useCallback(async () => {
    try {
      setIsConnecting(true);
      setTestStatus('🎤 Requesting microphone access...');
      setConnectionStatus('connecting');
      setStatusMessage('Initializing call...');
      
      // Check if in secure context (HTTPS required for microphone)
      if (!window.isSecureContext) {
        throw new Error('HTTPS required for microphone access');
      }

      // Request microphone permission first (same as working component)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
            channelCount: 1,
            sampleRate: 48000,
            sampleSize: 16
          }
        });
        
        // Stop the stream - LiveKit will create its own
        stream.getTracks().forEach(track => track.stop());
        setTestStatus('✅ Microphone access granted');
        console.log('✅ Microphone access granted');
      } catch (micError) {
        const errorMessage = micError instanceof Error ? micError.message : 'Unknown error';
        throw new Error(`Microphone access denied: ${errorMessage}`);
      }
      
      // Get agent ID from the current agent
      const agentId = currentAgent?.id;
      if (!agentId) {
        throw new Error('Agent ID not found');
      }
      
      setTestStatus('🔗 Getting LiveKit token...');
      
      // Get LiveKit token from backend (exact same endpoint as working component)
      const callId = `admin_test_${Date.now()}`;
      console.log('🔑 Getting token with parameters:', {
        agent_id: agentId,
        language: 'en-US',
        call_id: callId,
        device: 'desktop'
      });

      const response = await fetch('https://python.service.callshivai.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agent_id: agentId,
          language: 'en-US',
          call_id: callId,
          device: 'desktop',
          user_agent: navigator.userAgent
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Token server error:', errorText);
        throw new Error(`Failed to get LiveKit token: ${response.status} - ${errorText}`);
      }
      
      const tokenData = await response.json();
      console.log('🎯 Token received for agent testing:', agentId, tokenData);
      
      setTestStatus('🔗 Connecting to LiveKit...');
      
      // Load LiveKit SDK if not available
      if (typeof (window as any).LivekitClient === 'undefined') {
        setTestStatus('📦 Loading LiveKit SDK...');
        
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/livekit-client@latest/dist/livekit-client.umd.js';
        script.onload = () => {
          console.log('✅ LiveKit SDK loaded');
          connectToLiveKit(tokenData);
        };
        script.onerror = () => {
          throw new Error('Failed to load LiveKit SDK');
        };
        document.head.appendChild(script);
      } else {
        await connectToLiveKit(tokenData);
      }
      
    } catch (error) {
      console.error('Failed to start agent test call:', error);
      setTestStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setConnectionStatus('disconnected');
      setStatusMessage('Connection failed');
      setIsConnecting(false);
      setIsConnected(false);
    }
  }, [currentAgent]);

  const connectToLiveKit = useCallback(async (tokenData: any) => {
    try {
      const LiveKit = (window as any).LivekitClient;
      
      // Create LiveKit room with same config as working component
      const liveKitRoom = new LiveKit.Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          suppressLocalAudioPlayback: true
        },
        publishDefaults: {
          audioPreset: LiveKit.AudioPresets.speech,
          dtx: true,
          red: false,
          simulcast: false
        }
      });

      // Track remote audio (agent speaking) - same as working component
      liveKitRoom.on(LiveKit.RoomEvent.TrackSubscribed, (track: any) => {
        if (track.kind === LiveKit.Track.Kind.Audio) {
          console.log('🔊 Audio track received from agent');
          const audioElement = track.attach();
          audioElement.volume = 0.4; // Same volume as widget for feedback prevention
          audioElement.autoplay = true;
          document.body.appendChild(audioElement);
          
          audioElement.play().catch((err: any) => 
            console.warn('Audio autoplay blocked:', err)
          );
        }
      });

      // Handle real-time transcript and chat data - same as widget.js
      liveKitRoom.on(LiveKit.RoomEvent.DataReceived, (data: any, participant: any) => {
        try {
          const text = new TextDecoder().decode(data);
          console.log('📨 DataReceived:', text, 'from:', participant?.identity);
          
          if (!text || text.trim().length === 0) return;
          
          // Skip technical messages
          const skipPatterns = ['subscribed', 'connected', 'disconnected', 'enabled', 'disabled', 'true', 'false'];
          if (skipPatterns.some(pattern => text.toLowerCase() === pattern)) return;
          
          try {
            const jsonData = JSON.parse(text);
            
            // Look for text content in various fields
            let transcriptText = '';
            const textFields = ['text', 'transcript', 'message', 'content', 'response'];
            for (const field of textFields) {
              if (jsonData[field] && typeof jsonData[field] === 'string' && jsonData[field].trim()) {
                transcriptText = jsonData[field].trim();
                break;
              }
            }
            
            if (transcriptText) {
              const isUser = participant?.identity === liveKitRoom.localParticipant?.identity;
              const messageKey = `${isUser ? 'user' : 'ai'}-${transcriptText}-${Math.floor(Date.now() / 2000)}`;
              
              // Prevent duplicate messages within 2-second windows
              if (recentMessagesRef.current.has(messageKey)) {
                console.log('🚫 Preventing duplicate DataReceived:', transcriptText);
                return;
              }
              
              recentMessagesRef.current.add(messageKey);
              setTimeout(() => recentMessagesRef.current.delete(messageKey), 5000);
              
              setMessages(prev => [...prev, {
                id: `${Date.now()}-${Math.random()}`,
                text: transcriptText,
                isUser,
                timestamp: new Date(),
                source: 'voice'
              }]);
              
              // Stop loading if this is an agent response
              if (!isUser) {
                setIsTestLoading(false);
              }
              
              console.log('✅ Added real-time message:', { isUser, text: transcriptText });
            }
          } catch (e) {
            // Treat as plain text if not JSON
            if (text.length >= 2 && text.length <= 1000) {
              const isUser = participant?.identity === liveKitRoom.localParticipant?.identity;
              const messageKey = `${isUser ? 'user' : 'ai'}-${text.trim()}-${Math.floor(Date.now() / 2000)}`;
              
              if (recentMessagesRef.current.has(messageKey)) {
                console.log('🚫 Preventing duplicate plain text:', text.trim());
                return;
              }
              
              recentMessagesRef.current.add(messageKey);
              setTimeout(() => recentMessagesRef.current.delete(messageKey), 5000);
              
              setMessages(prev => [...prev, {
                id: `${Date.now()}-${Math.random()}`,
                text: text.trim(),
                isUser,
                timestamp: new Date(),
                source: 'voice'
              }]);
              
              // Stop loading if this is an agent response
              if (!isUser) {
                setIsTestLoading(false);
              }
              
              console.log('✅ Added plain text message:', { isUser, text: text.trim() });
            }
          }
        } catch (error) {
          console.error('❌ Error processing DataReceived:', error);
        }
      });

      // Register text stream handlers for transcription and chat - same as widget.js
      if (typeof liveKitRoom.registerTextStreamHandler === 'function') {
        console.log('📝 Registering text stream handlers...');
        
        // Transcription stream handler
        liveKitRoom.registerTextStreamHandler('lk.transcription', async (reader: any, participantInfo: any) => {
          console.log('🎯 Transcription stream from:', participantInfo.identity);
          try {
            const text = await reader.readAll();
            if (text && text.trim()) {
              const isUser = participantInfo.identity === liveKitRoom.localParticipant?.identity;
              const messageKey = `${isUser ? 'user' : 'ai'}-transcription-${text.trim()}-${Math.floor(Date.now() / 2000)}`;
              
              if (recentMessagesRef.current.has(messageKey)) {
                console.log('🚫 Preventing duplicate transcription:', text.trim());
                return;
              }
              
              recentMessagesRef.current.add(messageKey);
              setTimeout(() => recentMessagesRef.current.delete(messageKey), 5000);
              
              setMessages(prev => [...prev, {
                id: `transcription-${Date.now()}-${Math.random()}`,
                text: text.trim(),
                isUser,
                timestamp: new Date(),
                source: 'voice'
              }]);
              
              // Stop loading if this is an agent response
              if (!isUser) {
                setIsTestLoading(false);
              }
              
              console.log('✅ Transcription added:', { isUser, text: text.trim() });
            }
          } catch (error) {
            console.error('❌ Error processing transcription:', error);
          }
        });
        
        // Chat stream handler
        liveKitRoom.registerTextStreamHandler('lk.chat', async (reader: any, participantInfo: any) => {
          console.log('💬 Chat stream from:', participantInfo.identity);
          try {
            const text = await reader.readAll();
            const isUser = participantInfo.identity === liveKitRoom.localParticipant?.identity;
            
            if (!isUser && text && text.trim()) {
              const messageKey = `ai-chat-${text.trim()}-${Math.floor(Date.now() / 2000)}`;
              
              if (recentMessagesRef.current.has(messageKey)) {
                console.log('🚫 Preventing duplicate chat:', text.trim());
                return;
              }
              
              recentMessagesRef.current.add(messageKey);
              setTimeout(() => recentMessagesRef.current.delete(messageKey), 5000);
              
              setMessages(prev => [...prev, {
                id: `chat-${Date.now()}-${Math.random()}`,
                text: text.trim(),
                isUser: false,
                timestamp: new Date(),
                source: 'chat'
              }]);
              
              // Stop loading since this is an agent chat response
              setIsTestLoading(false);
              
              console.log('✅ Chat message added:', { text: text.trim() });
            }
          } catch (error) {
            console.error('❌ Error processing chat:', error);
          }
        });
      }

      // Handle transcript from metadata - enhanced with loading state management
      liveKitRoom.on(LiveKit.RoomEvent.ParticipantMetadataChanged, (metadata: string, participant: any) => {
        if (metadata) {
          try {
            const data = JSON.parse(metadata);
            if (data.transcript || data.text) {
              const isUser = participant?.identity === liveKitRoom.localParticipant?.identity;
              
              setMessages(prev => [...prev, {
                id: `metadata-${Date.now()}`,
                text: data.transcript || data.text,
                isUser,
                timestamp: new Date(),
                source: 'voice'
              }]);
              
              // Stop loading if this is an agent response
              if (!isUser) {
                setIsTestLoading(false);
              }
              
              console.log('✅ Transcript from participant metadata:', data.transcript || data.text);
            }
          } catch (e) {
            console.log('Metadata not JSON:', metadata);
          }
        }
      });

      // Handle room metadata - enhanced with loading state management
      liveKitRoom.on(LiveKit.RoomEvent.RoomMetadataChanged, (metadata: string) => {
        if (metadata) {
          try {
            const data = JSON.parse(metadata);
            if (data.transcript || data.text) {
              setMessages(prev => [...prev, {
                id: `room-metadata-${Date.now()}`,
                text: data.transcript || data.text,
                isUser: false, // Room metadata is typically from agent
                timestamp: new Date(),
                source: 'voice'
              }]);
              
              // Stop loading since this is an agent response
              setIsTestLoading(false);
              
              console.log('✅ Transcript from room metadata:', data.transcript || data.text);
            }
          } catch (e) {
            console.log('Room metadata not JSON:', metadata);
          }
        }
      });

      // Handle connection - same as working component
      liveKitRoom.on(LiveKit.RoomEvent.Connected, async () => {
        console.log('🎉 Connected to LiveKit room for agent testing');
        setIsConnected(true);
        setIsConnecting(false);
        setIsCallActive(true);
        setConnectionStatus('connected');
        setTestStatus('🟢 Connected! You can now speak with the agent.');
        setStatusMessage('✅ Connected - Speak now!');
        
        // Start call timer
        const timer = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
        setCallTimerInterval(timer);
        
        // Enable microphone with same settings as working component
        try {
          await liveKitRoom.localParticipant.setMicrophoneEnabled(true, {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          });
          
          setIsRecording(true);
          
          console.log('🎤 Microphone enabled and ready');
        } catch (err) {
          console.error('Failed to enable microphone:', err);
        }
      });

      // Handle disconnection
      liveKitRoom.on(LiveKit.RoomEvent.Disconnected, () => {
        console.log('❌ Disconnected from LiveKit room');
        setIsConnected(false);
        setIsConnecting(false);
        setIsCallActive(false);
        setConnectionStatus('disconnected');
        setTestStatus('🔴 Disconnected');
        setStatusMessage('❌ Disconnected');
        setRoom(null);
        
        if (callTimerInterval) {
          clearInterval(callTimerInterval);
          setCallTimerInterval(null);
        }
        setCallDuration(0);
      });

      // Connect to room using token data
      console.log('🔗 Connecting to LiveKit room...');
      await liveKitRoom.connect(tokenData.url, tokenData.token);
      setRoom(liveKitRoom);
      
    } catch (error) {
      console.error('LiveKit connection failed:', error);
      setTestStatus(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setConnectionStatus('disconnected');
      setStatusMessage('Connection failed');
      setIsConnecting(false);
      setIsConnected(false);
    }
  }, [currentAgent, callTimerInterval]);

  const endAgentCall = useCallback(async () => {
    if (room) {
      try {
        await room.disconnect();
        console.log('✅ Disconnected from LiveKit room');
      } catch (error) {
        console.error('Error disconnecting from room:', error);
      }
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setIsCallActive(false);
    setConnectionStatus('disconnected');
    setTestStatus('📞 Call ended');
    setStatusMessage('Ready to connect');
    setRoom(null);
    setIsRecording(false);
    
    if (callTimerInterval) {
      clearInterval(callTimerInterval);
      setCallTimerInterval(null);
    }
    setCallDuration(0);
    
    // Add disconnect message
    setMessages(prev => [...prev, {
      id: `disconnect-${Date.now()}`,
      text: 'Call ended',
      isUser: false,
      timestamp: new Date(),
      source: 'system'
    }]);
  }, [room, callTimerInterval]);

  const toggleMute = useCallback(async () => {
    if (room && isConnected) {
      try {
        const newMutedState = !isMuted;
        await room.localParticipant.setMicrophoneEnabled(!newMutedState);
        setIsMuted(newMutedState);
        setIsRecording(!newMutedState);
        console.log(`🎤 Microphone ${newMutedState ? 'muted' : 'unmuted'}`);
      } catch (error) {
        console.error('Error toggling mute:', error);
      }
    }
  }, [room, isConnected, isMuted]);

  // Test connection function to help debug issues
  const testConnection = useCallback(async () => {
    if (!currentAgent) {
      alert('No agent selected');
      return;
    }

    console.log('🧪 Testing connection components...');
    
    try {
      // Test 1: Check microphone permission
      console.log('🎤 Testing microphone access...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone access OK');
      
      // Test 2: Check token server
      console.log('🔑 Testing token server...');
      const response = await fetch('https://python.service.callshivai.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: currentAgent.id,
          language: 'en-US',
          call_id: `test_${Date.now()}`,
          device: 'desktop',
          user_agent: navigator.userAgent,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Token server OK', data);
        alert('✅ Connection test passed! Token server is working. Try starting the call again.');
      } else {
        console.error('❌ Token server error:', response.status);
        alert(`❌ Token server error: ${response.status}. The voice service may be temporarily unavailable.`);
      }
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        alert('❌ Microphone permission denied. Please allow microphone access and try again.');
      } else if (error instanceof Error && error.message.includes('fetch')) {
        alert('❌ Cannot reach voice service. Please check your internet connection.');
      } else {
        alert(`❌ Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }, [currentAgent]);

  // Remove the old handleStartCall function and replace with startAgentCall
  const handleStartCall = startAgentCall;

  const handleEndCall = endAgentCall;

  const handleToggleMute = toggleMute;

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

 

  const responseStyleOptions = [
    { value: "Concise", label: "Concise" },
    { value: "Balanced", label: "Balanced" },
    { value: "Detailed", label: "Detailed" },
  ];

  const maxResponseOptions = [
    { value: "Short (50 words)", label: "Short (50 words)" },
    { value: "Medium (150 words)", label: "Medium (150 words)" },
    { value: "Long (300 words)", label: "Long (300 words)" },
  ];

  const contextWindowOptions = [
    { value: "Small (4K tokens)", label: "Small (4K tokens)" },
    { value: "Standard (8K tokens)", label: "Standard (8K tokens)" },
    { value: "Large (16K tokens)", label: "Large (16K tokens)" },
  ];

  // Filter agents based on search and status
  const filteredAgents = isDeveloper
    ? agents.filter((agent) => {
        const matchesSearch = agent.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === "all" ||
          agent.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
      })
    : [];

  // MAIN AGENT LIST PAGE
  if (isList) {
    return (
      <div className="space-y-4 lg:space-y-6 w-full max-w-full overflow-hidden">
        {/* Header with Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 lg:gap-4 flex-1">
            <div className="bg-white/50 flex items-center justify-center gap-1.5 dark:bg-slate-800/50 rounded-lg px-2 lg:px-6 py-2 lg:py-2 text-center shadow-sm transition-all duration-200 hover:shadow-md">
              <p className="text-base lg:text-2xl font-bold text-slate-800 dark:text-white">
                {isDeveloper ? agents.length : 0}
              </p>
              <p className="text-[10px] lg:text-sm font-medium text-slate-600 dark:text-slate-400">
                Total
              </p>
            </div>
            <div className="bg-white/50 flex items-center justify-center gap-1.5 dark:bg-slate-800/50 rounded-lg px-2 lg:px-6 py-2 lg:py-2 text-center shadow-sm transition-all duration-200 hover:shadow-md">
              <p className="text-base lg:text-2xl font-bold text-green-600 dark:text-green-400">
                {isDeveloper
                  ? agents.filter((a) => a.status === "Published").length
                  : 0}
              </p>
              <p className="text-[10px] lg:text-sm font-medium text-slate-600 dark:text-slate-400">
                Active
              </p>
            </div>
            <div className="bg-white/50 flex items-center justify-center gap-1.5 dark:bg-slate-800/50 rounded-lg px-2 lg:px-6 py-2 lg:py-2 text-center shadow-sm transition-all duration-200 hover:shadow-md">
              <p className="text-base lg:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {isDeveloper
                  ? agents.filter((a) => a.status === "Training").length
                  : 0}
              </p>
              <p className="text-[10px] lg:text-sm font-medium text-slate-600 dark:text-slate-400">
                Training
              </p>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={() => isDeveloper && navigate("/agents/create")}
            disabled={!isDeveloper}
            className={`flex items-center justify-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl transition-all duration-200 shadow-sm whitespace-nowrap ${
              isDeveloper
                ? "common-button-bg transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50"
            }`}
          >
            <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="text-sm lg:text-base font-medium">
              Create AI Employee
            </span>
          </button>
        </div>

        {/* Search and Filter Row */}
        <GlassCard>
          <div className="p-4 lg:p-6">
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 lg:py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 text-slate-800 dark:text-white text-sm transition-all duration-200"
                />
              </div>

              {/* Status Filter */}
              <div className="hidden lg:block min-w-[180px]">
                <SearchableSelect
                  options={[
                    { value: "all", label: "All Status" },
                    { value: "published", label: "Published" },
                    { value: "draft", label: "Draft" },
                    { value: "training", label: "Training" },
                  ]}
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value)}
                  placeholder="Filter by status..."
                />
              </div>

              {/* Filter Button - Mobile Only */}
              <button className="lg:hidden flex items-center justify-center common-button-bg2 p-2.5 rounded-lg active:scale-95">
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || statusFilter !== "all") && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Active filters:
                </span>
                {searchTerm && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs flex items-center gap-1">
                    "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm("")}
                      className="hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full p-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {statusFilter !== "all" && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs flex items-center gap-1">
                    Status: {statusFilter}
                    <button
                      onClick={() => setStatusFilter("all")}
                      className="hover:bg-green-200 dark:hover:bg-green-800/50 rounded-full p-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Mobile-First Agent Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {filteredAgents.map((agent) => (
            <GlassCard key={agent.id} hover>
              <div className="p-4 sm:p-5 lg:p-6">
                {/* Agent Header - Mobile Optimized */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 common-bg-icons rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 sm:w-6 h-5 sm:h-6 text-slate-900 dark:text-slate-100" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-800 dark:text-white text-sm sm:text-base truncate">
                          {agent.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                          {agent.language} • {agent.persona}

                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                          agent.status === "Published"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : agent.status === "Training"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {agent.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Agent Details - Compact for Mobile */}
                <div className="space-y-2 mb-4 sm:mb-5">
                  <div className="flex items-center justify-start text-xs sm:text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Voice:
                    </span>
                    <span className="text-slate-800 dark:text-white truncate ml-2 text-right">
                      {agent.voice}
                    </span>
                  </div>
                  <div className="flex items-center justify-start text-xs sm:text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Created:
                    </span>
                    <span className="text-slate-800 dark:text-white ml-2">
                      {agent.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Primary Actions - Properly Aligned */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => navigate(`/agents/${agent.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 text-sm font-medium active:scale-[0.98]"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>

                  <button
                    onClick={() => navigate(`/agents/${agent.id}/edit`)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200 text-sm font-medium active:scale-[0.98]"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      navigate(`/agents/${agent.id}/train`, {
                        state: { from: "list" },
                      })
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-200 text-sm font-medium active:scale-[0.98]"
                  >
                    <Zap className="w-4 h-4" />
                    Train
                  </button>
                </div>

                {/* Secondary Actions */}
                <div className="flex items-center gap-2">
                  {agent.status === "Published" ? (
                    <button
                      onClick={() => handlePause(agent.id)}
                      disabled={publishingAgents.has(agent.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 common-button-bg2 transition-all duration-200 text-sm font-medium ${
                        publishingAgents.has(agent.id) 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'active:scale-[0.98]'
                      }`}
                    >
                      {publishingAgents.has(agent.id) ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      ) : (
                        <Pause className="w-4 h-4" />
                      )}
                      {publishingAgents.has(agent.id) ? 'Pausing...' : 'Pause'}
                    </button>
                  ) : (
                    <button
                      onClick={() => (agent as any).is_active ? handlePause(agent.id) : handlePublish(agent.id)}
                      disabled={publishingAgents.has(agent.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 transition-all duration-200 text-sm font-medium ${
                        publishingAgents.has(agent.id) 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'active:scale-[0.98]'
                      } ${
                        (agent as any).is_active ? 'common-button-bg2' : 'common-button-bg'
                      }`}
                    >
                      {publishingAgents.has(agent.id) ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      ) : (
                        (agent as any).is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />
                      )}
                      {publishingAgents.has(agent.id) 
                        ? ((agent as any).is_active ? 'Pausing...' : 'Publishing...')
                        : ((agent as any).is_active ? 'Pause' : 'Publish')
                      }
                    </button>
                  )}

                  <button className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95">
                    <Copy className="w-4 h-4" />
                  </button>

                  <button className="p-2.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Mobile-Optimized Empty State */}
        {filteredAgents.length === 0 && (
          <div className="text-center py-12 lg:py-16 px-4">
            <Bot className="w-20 lg:w-24 h-20 lg:h-24 text-slate-300 dark:text-slate-600 mx-auto mb-6" />
            <h3 className="text-xl lg:text-2xl font-medium text-slate-600 dark:text-slate-400 mb-3">
              {searchTerm || statusFilter !== "all"
                ? "No agents found"
                : "No agents created yet"}
            </h3>
            <p className="text-sm lg:text-base text-slate-500 dark:text-slate-500 max-w-md lg:max-w-lg mx-auto mb-6 leading-relaxed">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria to find what you're looking for"
                : "Create your first AI agent to get started with automated conversations and boost your business efficiency"}
            </p>
            {!searchTerm && statusFilter === "all" && isDeveloper && (
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/agents/create")}
                  className="w-full sm:w-auto common-button-bg px-6 py-3 rounded-xl shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Create Your First Agent
                </button>
                <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">
                  Get started in just 2 minutes ⚡
                </p>
              </div>
            )}
            {(searchTerm || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="w-full sm:w-auto common-button-bg2 px-6 py-2.5 rounded-lg"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // VIEW MODE - Show agent details
  if (isView && currentAgent) {
    return (
      <div className="space-y-3 sm:space-y-4 lg:space-y-6 w-full">
        {/* Enhanced Mobile-First Header */}
        <GlassCard>
          <div className="p-4 sm:p-6">
            {/* Top row with back button and actions */}
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
              {/* Main agent info section */}
              <div className="flex items-start gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-1">
                <button
                  onClick={() => navigate("/agents")}
                  className="common-button-bg2 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl flex-shrink-0 touch-manipulation"
                >
                  <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600 dark:text-slate-300" />
                </button>

                <div className="flex items-start gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-1">
                  {/* Agent avatar/icon */}
                  <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 common-bg-icons flex items-center justify-center flex-shrink-0 rounded-lg sm:rounded-xl">
                    <Bot className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-black dark:text-white" />
                  </div>

                  {/* Agent details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1.5 sm:gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-white leading-tight truncate">
                          {currentAgent.name}
                        </h1>

                        {/* Agent meta info - Mobile optimized */}
                        <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="truncate text-xs sm:text-sm">
                              {currentAgent.language}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                                currentAgent.status === "Published"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                  : currentAgent.status === "Training"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {currentAgent.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons - Mobile compact */}
              <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0">
                <button
                  onClick={() => navigate(`/agents/${currentAgent.id}/edit`)}
                  className="flex-1 sm:flex-none common-button-bg2 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 rounded-lg sm:rounded-xl touch-manipulation min-h-[36px] sm:min-h-[40px]"
                >
                  <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm font-medium">Edit</span>
                </button>
                {(currentAgent.status === "Published" || (currentAgent as any).is_active) && (
                  <button
                    onClick={() => setShowQRModal(true)}
                    className="flex-none common-button-bg2 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 rounded-lg sm:rounded-xl touch-manipulation min-h-[36px] sm:min-h-[40px]"
                  >
                    <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline text-xs sm:text-sm font-medium">
                      QR
                    </span>
                  </button>
                )}
                {currentAgent.status === "Published" ? (
                  <button
                    onClick={() => handlePause(currentAgent.id)}
                    disabled={publishingAgents.has(currentAgent.id)}
                    className={`flex-none common-button-bg2 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 rounded-lg sm:rounded-xl touch-manipulation min-h-[36px] sm:min-h-[40px] ${
                      publishingAgents.has(currentAgent.id) 
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                    }`}
                  >
                    {publishingAgents.has(currentAgent.id) ? (
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    ) : (
                      <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                    <span className="text-xs sm:text-sm font-medium">
                      {publishingAgents.has(currentAgent.id) ? '...' : 'Pause'}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => (currentAgent as any).is_active ? handlePause(currentAgent.id) : handlePublish(currentAgent.id)}
                    disabled={publishingAgents.has(currentAgent.id)}
                    className={`flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 rounded-lg sm:rounded-xl touch-manipulation min-h-[36px] sm:min-h-[40px] ${
                      publishingAgents.has(currentAgent.id) 
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                    } ${
                      (currentAgent as any).is_active ? 'common-button-bg2' : 'common-button-bg'
                    }`}
                  >
                    {publishingAgents.has(currentAgent.id) ? (
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    ) : (
                      (currentAgent as any).is_active ? <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                    <span className="text-xs sm:text-sm font-medium">
                      {publishingAgents.has(currentAgent.id) 
                        ? '...'
                        : ((currentAgent as any).is_active ? 'Pause' : 'Publish')
                      }
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Agent info section */}
          </div>
        </GlassCard>

        {/* Performance Overview - Compact Grid on Mobile */}
        <div className="lg:hidden grid grid-cols-2 gap-2">
          <GlassCard className="hover:shadow-md transition-all duration-200">
            <div className="p-2">
              <div className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-base font-bold text-slate-800 dark:text-white">
                  {currentAgent.stats.conversations.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">
                  Conversations
                </p>
                {currentAgent.stats.conversations > 0 ? (
                  <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
                    +12%
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 dark:text-slate-500">
                    No data
                  </span>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="hover:shadow-md transition-all duration-200">
            <div className="p-2">
              <div className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-base font-bold text-slate-800 dark:text-white">
                  {currentAgent.stats.successRate}%
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">
                  Success Rate
                </p>
                {currentAgent.stats.successRate > 0 ? (
                  <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
                    +2.1%
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 dark:text-slate-500">
                    No data
                  </span>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="hover:shadow-md transition-all duration-200">
            <div className="p-2">
              <div className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-base font-bold text-slate-800 dark:text-white">
                  {currentAgent.stats.avgResponseTime}s
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">
                  Avg Response
                </p>
                {currentAgent.stats.avgResponseTime > 0 ? (
                  <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
                    -0.3s
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 dark:text-slate-500">
                    No data
                  </span>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="hover:shadow-md transition-all duration-200">
            <div className="p-2">
              <div className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-base font-bold text-slate-800 dark:text-white">
                  {currentAgent.stats.activeUsers}
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">
                  Active Users
                </p>
                {currentAgent.stats.activeUsers > 0 ? (
                  <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
                    +8%
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 dark:text-slate-500">
                    No data
                  </span>
                )}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Desktop Grid View */}
        <div className="hidden lg:grid grid-cols-4 gap-4">
          <GlassCard className="hover:shadow-lg transition-all duration-300">
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {currentAgent.stats.conversations.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Conversations
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {currentAgent.stats.conversations > 0 ? (
                  <>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      +12%
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      this week
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    No data yet
                  </span>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="hover:shadow-lg transition-all duration-300">
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {currentAgent.stats.successRate}%
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Success Rate
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {currentAgent.stats.successRate > 0 ? (
                  <>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      +2.1%
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      improved
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    No data yet
                  </span>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="hover:shadow-lg transition-all duration-300">
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {currentAgent.stats.avgResponseTime}s
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Avg Response
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {currentAgent.stats.avgResponseTime > 0 ? (
                  <>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      -0.3s
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      faster
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    No data yet
                  </span>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="hover:shadow-lg transition-all duration-300">
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {currentAgent.stats.activeUsers}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Active Users
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {currentAgent.stats.activeUsers > 0 ? (
                  <>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      +8%
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      today
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    No data yet
                  </span>
                )}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Enhanced Content Grid - Mobile Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Agent Configuration - Mobile Optimized */}
          <div className="order-1 lg:order-1 lg:col-span-2">
            <GlassCard>
              <div className="p-2 sm:p-3">
                <div className="flex flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                      <Settings className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white">
                      Configuration
                    </h3>
                  </div>
                  
                  {/* Test Button - Only show when agent is published */}
                  {(currentAgent.status === "Published" || (currentAgent as any).is_active) && (
                    <button
                      onClick={() => setShowTestChat(true)}
                      className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 border border-1 dark:bg-green-900/20 text-black dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md self-start"
                    >
                      <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Test</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Row 1 */}
                  <div className="p-2 bg-slate-50 border dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Globe className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Language
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      {currentAgent.language}
                    </p>
                  </div>

                  <div className="p-2 bg-slate-50 border dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <MessageSquare className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Voice
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      {currentAgent.voice}
                    </p>
                  </div>

                  {/* Row 2 */}
                  <div className="p-2 bg-slate-50 border dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Users className="w-3 h-3 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Persona
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      {currentAgent.persona}
                    </p>
                  </div>

                  <div className="p-2 bg-slate-50 border dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Clock className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Created
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      {currentAgent.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Quick Actions - Compact Stack on Mobile, Sidebar on Desktop */}
          <div className="order-2 lg:order-2">
            {/* Mobile: Compact Stack */}
            <div className="lg:hidden">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate(`/agents/${currentAgent.id}/train`)}
                  className="common-bg-icons hover:shadow-md transition-all duration-200 p-2 rounded-lg touch-manipulation group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <Lightbulb className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-xs font-medium text-slate-800 dark:text-white">
                      Train
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => navigate(`/agents/${currentAgent.id}/edit`)}
                  className="common-bg-icons hover:shadow-md transition-all duration-200 p-2 rounded-lg touch-manipulation group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                      <Edit className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <p className="text-xs font-medium text-slate-800 dark:text-white">
                      Edit
                    </p>
                  </div>
                </button>

                <button className="common-bg-icons hover:shadow-md transition-all duration-200 p-2 rounded-lg touch-manipulation group">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                      <Copy className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-xs font-medium text-slate-800 dark:text-white">
                      Clone
                    </p>
                  </div>
                </button>

                <button className="common-bg-icons hover:shadow-md transition-all duration-200 p-2 rounded-lg touch-manipulation group">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                      <Download className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-xs font-medium text-slate-800 dark:text-white">
                      Export
                    </p>
                  </div>
                </button>

             
              </div>
            </div>

            {/* Desktop: Vertical Sidebar */}
            <div className="hidden lg:block space-y-4">
            <GlassCard>
              <div className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-slate-50 dark:bg-slate-800 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-800 dark:text-white">
                    Quick Actions
                  </h3>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <button
                    onClick={() => navigate(`/agents/${currentAgent.id}/train`)}
                    className="w-full common-bg-icons hover:shadow-md transition-all duration-200 p-3 sm:p-4 rounded-lg touch-manipulation group"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-white">
                          Train Agent
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Improve responses
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate(`/agents/${currentAgent.id}/edit`)}
                    className="w-full common-bg-icons hover:shadow-md transition-all duration-200 p-3 sm:p-4 rounded-lg touch-manipulation group"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-white">
                          Edit Agent
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Modify settings
                        </p>
                      </div>
                    </div>
                  </button>

                  <button className="w-full common-bg-icons hover:shadow-md transition-all duration-200 p-3 sm:p-4 rounded-lg touch-manipulation group">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-white">
                          Clone Agent
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Create duplicate
                        </p>
                      </div>
                    </div>
                  </button>

                  <button className="w-full common-bg-icons hover:shadow-md transition-all duration-200 p-3 sm:p-4 rounded-lg touch-manipulation group">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Download className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-white">
                          Export Data
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Download config
                        </p>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                    className="w-full common-bg-icons hover:shadow-md transition-all duration-200 p-3 sm:p-4 rounded-lg touch-manipulation group"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-white">
                          View Call Analytics
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          See performance data
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </GlassCard>
            </div>
          </div>
        </div>

        {/* Widget Customization Section - Only show when agent is published */}
          <div className="mt-3 sm:mt-4 lg:mt-6">
            <AgentWidgetCustomization
              agentId={currentAgent.id}
              agentName={currentAgent.name}
              isPublished={true}
            />
          </div>

        {/* Integration Code Section - Only show when agent is published */}
        {(currentAgent.status === "Published" || (currentAgent as any).is_active) && (
          <div className="mt-4 sm:mt-6">
            <AgentIntegrationCode 
              currentAgent={currentAgent}
            />
          </div>
        )}

     

       

        {showQRModal && currentAgent && (
          <AgentQRModal
            agent={currentAgent}
            onClose={() => setShowQRModal(false)}
          />
        )}

        

        {/* Comprehensive Agent Testing Modal - Only show for published agents */}
        {showTestChat && currentAgent && currentAgent.status === "Published" && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] flex items-center justify-center p-3 sm:p-4 -top-8">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl w-full max-w-2xl h-[80vh] max-h-[600px] relative flex flex-col shadow-xl border border-white/20 dark:border-slate-700/50">
              
              {/* Minimalist Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Test {currentAgent.name}
                  </h3>
                </div>
                <button
                  onClick={async () => {
                    // Cleanup and close
                    if (room) {
                      try {
                        await room.disconnect();
                      } catch (error) {
                        console.error('Error disconnecting on close:', error);
                      }
                    }
                    
                    setShowTestChat(false);
                    setIsCallActive(false);
                    setIsRecording(false);
                    setConnectionStatus('disconnected');
                    setStatusMessage('Ready to connect');
                    if (callTimerInterval) {
                      clearInterval(callTimerInterval);
                      setCallTimerInterval(null);
                    }
                    setCallDuration(0);
                    setActiveTestTab('call');
                  }}
                  className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Minimalist Tab Navigation */}
              <div className="flex border-b border-slate-200/50 dark:border-slate-700/50">
                {[
                  { id: 'call', label: 'Voice', icon: Phone },
                  { id: 'conversation', label: 'Conversation', icon: MessageSquare },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTestTab(id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors ${
                      activeTestTab === id
                        ? 'text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white bg-slate-50/50 dark:bg-slate-800/50'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-hidden">
                {/* Call Tab */}
                {activeTestTab === 'call' && (
                  <div className="h-full flex flex-col items-center justify-center p-6">
                    
                    {/* Status Indicator */}
                    <div className="text-center mb-6">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 mx-auto transition-all ${
                        connectionStatus === 'connected' 
                          ? 'bg-green-100 dark:bg-green-900/20' 
                          : connectionStatus === 'connecting'
                          ? 'bg-yellow-100 dark:bg-yellow-900/20 animate-pulse'
                          : 'bg-slate-100 dark:bg-slate-800/50'
                      }`}>
                        <Phone className={`w-8 h-8 ${
                          connectionStatus === 'connected' 
                            ? 'text-green-600 dark:text-green-400' 
                            : connectionStatus === 'connecting'
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-slate-400'
                        }`} />
                      </div>
                      
                      <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-1">
                        {connectionStatus === 'connected' ? 'Connected' : 
                         connectionStatus === 'connecting' ? 'Connecting...' :
                         'Ready to Call'}
                      </h3>
                      
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {statusMessage}
                      </p>
                      
                      {isCallActive && (
                        <p className="text-sm font-mono text-slate-600 dark:text-slate-300 mt-2">
                          {formatCallDuration(callDuration)}
                        </p>
                      )}
                    </div>

                    {/* Simple Controls */}
                    <div className="flex items-center gap-3">
                      {!isCallActive && !isConnecting ? (
                        <>
                          <button
                            onClick={handleStartCall}
                            disabled={isTestLoading || isConnecting}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            <PhoneCall className="w-4 h-4" />
                            {isConnecting ? 'Connecting...' : 'Start Call'}
                          </button>
                          
                          <button
                            onClick={testConnection}
                            className="flex items-center gap-2 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-sm"
                          >
                            <Settings className="w-4 h-4" />
                            Test
                          </button>
                        </>
                      ) : isCallActive ? (
                        <>
                          <button
                            onClick={handleToggleMute}
                            className={`p-3 rounded-xl transition-colors ${
                              isMuted
                                ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                : 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                            }`}
                            title={isMuted ? 'Unmute' : 'Mute'}
                          >
                            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                          </button>
                          
                          <button
                            onClick={handleEndCall}
                            className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                            title="End Call"
                          >
                            <Phone className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                          <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-slate-900 dark:border-t-white rounded-full animate-spin"></div>
                          <span>Connecting...</span>
                        </div>
                      )}
                    </div>

                    {isCallActive && (
                      <div className="mt-6 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <div className={`w-2 h-2 rounded-full ${
                            !isMuted ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          {!isMuted ? 'Listening' : 'Muted'}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Conversation Tab (Combined Transcript + Chat) */}
                {activeTestTab === 'conversation' && (
                  <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                          <p className="text-sm text-slate-500 dark:text-slate-400">Start a conversation to see messages</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex mb-4 ${message.isUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex gap-3 max-w-[80%] ${message.isUser ? 'flex-row-reverse' : ''}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                message.isUser
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-green-500 text-white'
                              }`}>
                                {message.isUser ? (
                                  <span className="text-sm font-medium">U</span>
                                ) : (
                                  <span className="text-sm font-medium">AI</span>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                    {message.isUser ? 'You' : 'AI Employee'}
                                  </span>
                                  <span className="text-xs text-slate-400 dark:text-slate-500">
                                    {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                  {message.source && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      message.source === 'voice' 
                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    }`}>
                                      {message.source === 'voice' ? '🎙️' : '💬'}
                                    </span>
                                  )}
                                </div>
                                <div className={`px-4 py-2 rounded-2xl text-sm ${
                                  message.isUser
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                                }`}>
                                  {message.text}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {isTestLoading && (
                        <div className="flex justify-start mb-4">
                          <div className="flex gap-3 max-w-[80%]">
                            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-medium">AI</span>
                            </div>
                            <div className="flex flex-col">
                              <div className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={testInput}
                          onChange={(e) => setTestInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !isTestLoading) {
                              handleTestSend();
                            }
                          }}
                          placeholder={connectionStatus === 'connected' ? 'Type a message or use voice...' : 'Type a message...'}
                          className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 text-slate-700 dark:text-slate-300 text-sm placeholder-slate-400 dark:placeholder-slate-500"
                          disabled={isTestLoading}
                        />
                        <button
                          onClick={handleTestSend}
                          disabled={!testInput.trim() || isTestLoading}
                          className="px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                      {connectionStatus === 'connected' && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                          🔴 Live conversation • Voice and text messages
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // EDIT/CREATE MODE - Mobile-First
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-visible">
      {/* Consistent Header UI */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Main agent info section */}
            <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
              <button
                onClick={() => {
                  // Navigate to previous page or agents list
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate("/agents");
                  }
                }}
                className="common-button-bg2 p-2 sm:p-2.5 rounded-xl flex-shrink-0 touch-manipulation"
              >
                <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600 dark:text-slate-300" />
              </button>

              <div className="flex items-start gap-3 sm:gap-4 lg:gap-4 min-w-0 flex-1">
                {/* Agent avatar/icon */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 common-bg-icons flex items-center justify-center flex-shrink-0 rounded-xl">
                  <Bot className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-black dark:text-white" />
                </div>

                {/* Agent details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-slate-800 dark:text-white leading-tight truncate">
                        {isCreate
                          ? "Create New Agent"
                          : `Edit ${currentAgent?.name || "Agent"}`}
                      </h1>

                      {/* Agent meta info - Mobile optimized */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 sm:mt-2">
                        <div className="flex items-center gap-1">
                          <Settings className="w-3 sm:w-4 h-3 sm:h-4" />
                          <span className="truncate">
                            {isCreate
                              ? "Configuration"
                              : "Editing Configuration"}
                          </span>
                        </div>
                        {!isCreate && currentAgent && (
                          <>
                            <div className="hidden xs:flex items-center gap-1">
                              <Clock className="w-3 sm:w-4 h-3 sm:h-4" />
                              <span className="truncate">
                                Created{" "}
                                {currentAgent.createdAt.toLocaleDateString()}
                              </span>
                            </div>
                            <div className="xs:hidden flex items-center gap-1">
                              <Clock className="w-3 sm:w-4 h-3 sm:h-4" />
                              <span className="truncate">
                                {currentAgent.createdAt.toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0 md:mt-2 lg:mt-0">
                              <span
                                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex-shrink-0 self-start ${
                                  currentAgent.status === "Published"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                    : currentAgent.status === "Training"
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {currentAgent.status}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons - Mobile stacked */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  // Navigate to previous page or agents list
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate("/agents");
                  }
                }}
                className="flex-1 sm:flex-none common-button-bg2 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl touch-manipulation min-h-[40px]"
              >
                <span className="text-xs sm:text-sm font-medium">Cancel</span>
              </button>

              <button
                onClick={handleSave}
                className="flex-1 sm:flex-none common-button-bg flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl touch-manipulation min-h-[40px]"
              >
                <Save className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">
                  {isCreate ? "Create" : "Save"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 sm:gap-6 lg:gap-8">
        <div className="space-y-4 sm:space-y-6 min-w-0">
          {/* Identity Section - Mobile Optimized */}
          <GlassCard>
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 common-bg-icons rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                  Identity
                </h3>
              </div>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
                Define your agent's basic identity and personality
              </p>

              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Agent Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter a descriptive name for your agent"
                      className="common-bg-icons w-full px-3 sm:px-4 py-3 sm:py-3 rounded-xl text-slate-800 dark:text-white text-base sm:text-sm transition-all duration-200 touch-manipulation"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Choose a clear, descriptive name that reflects your
                      agent's purpose
                    </p>
                  </div>

                  <div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Select Gender <span className="text-red-500">*</span>
                      </label>
                      <SearchableSelect
                        options={genders}
                        value={formData.gender}
                        onChange={(value) =>
                          setFormData({ ...formData, gender: value })
                        }
                        placeholder="Select gender..."
                        groupBy={true}
                      />
                    </div>
                  </div>

                  {isCreate && (
                    <div className="col-span-full space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Business Process{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <SearchableSelect
                            options={businessProcesses}
                            value={formData.businessProcess}
                            onChange={(value) =>
                              setFormData({
                                ...formData,
                                businessProcess: value,
                              })
                            }
                            placeholder="Select business process..."
                            groupBy={true}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Industry <span className="text-red-500">*</span>
                          </label>
                          <SearchableSelect
                            options={industries}
                            value={formData.industry}
                            onChange={(value) =>
                              setFormData({ ...formData, industry: value })
                            }
                            placeholder="Select your industry..."
                            groupBy={true}
                          />
                        </div>
                      </div>

                      {/* Template Suggestion */}
                      {formData.businessProcess && formData.industry && (
                        <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-200 dark:border-blue-700/30 rounded-xl">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <Lightbulb className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-800 dark:text-white mb-1 sm:mb-2 text-sm sm:text-base">
                                Template Available
                              </h4>
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-2 sm:mb-3 leading-relaxed">
                                We have a well-reserached template that fits
                                your selected business process and industry. You
                                can view the recommended template or choose to
                                create a custom agent configuration.
                              </p>
                              <div className="flex flex-col xs:flex-row gap-2">
                                <button
                                  onClick={() => setShowTemplates(true)}
                                  className="flex-1 xs:flex-none common-button-bg active:scale-95"
                                >
                                  View Template
                                </button>
                                <button
                                  onClick={() => setShowTemplates(false)}
                                  className="flex-1 xs:flex-none common-button-bg2 active:scale-95"
                                >
                                  Create Custom
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Template Preview Modal */}
                      {showTemplates && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
                          <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-y-auto m-2 sm:m-0">
                            <div className="p-4 sm:p-6">
                              <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white pr-2">
                                  Recommended Template
                                </h3>
                                <button
                                  onClick={() => setShowTemplates(false)}
                                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                                >
                                  <span className="text-lg">✕</span>
                                </button>
                              </div>

                              {(() => {
                                const template = getTemplate();
                                return (
                                  <div className="space-y-4">
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                                      <h4 className="font-semibold text-slate-800 dark:text-white mb-2">
                                        {template.name}
                                      </h4>
                                      <p className="text-slate-600 dark:text-slate-400 mb-3">
                                        {template.description}
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {template.features.map(
                                          (feature: string, index: number) => (
                                            <span
                                              key={index}
                                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                                            >
                                              {feature}
                                            </span>
                                          )
                                        )}
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                          Persona:
                                        </label>
                                        <p className="text-slate-800 dark:text-white">
                                          {template.persona}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                          Custom Instructions:
                                        </label>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/30 p-3 rounded-lg">
                                          {template.customInstructions}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                          Guardrails Level:
                                        </label>
                                        <p className="text-slate-800 dark:text-white">
                                          {template.guardrailsLevel}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                                      <button
                                        onClick={applyTemplate}
                                        className="flex-1 common-button-bg active:scale-95"
                                      >
                                        Apply Template
                                      </button>
                                      <button
                                        onClick={() => setShowTemplates(false)}
                                        className="flex-1 sm:flex-none common-button-bg2 active:scale-95"
                                      >
                                        Create Custom
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Persona <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        {
                          value: "Friendly",
                          label: "Friendly",
                          desc: "Warm and approachable",
                        },
                        {
                          value: "Formal",
                          label: "Formal",
                          desc: "Professional and structured",
                        },
                        {
                          value: "Concise",
                          label: "Concise",
                          desc: "Brief and to the point",
                        },
                        {
                          value: "Empathetic",
                          label: "Empathetic",
                          desc: "Understanding and caring",
                        },
                        {
                          value: "Persuasive (Sales)",
                          label: "Persuasive (Sales)",
                          desc: "Convincing and goal-oriented",
                        },
                        {
                          value: "Reassuring (Support)",
                          label: "Reassuring (Support)",
                          desc: "Calming and supportive",
                        },
                      ].map((persona) => (
                        <button
                          key={persona.value}
                          onClick={() =>
                            setFormData({ ...formData, persona: persona.value })
                          }
                          className={`p-4 text-left border-2 rounded-xl transition-all duration-200 active:scale-[0.98] touch-manipulation ${
                            formData.persona === persona.value
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <div className="font-medium text-slate-800 dark:text-white text-sm lg:text-base">
                            {persona.label}
                          </div>
                          <div className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                            {persona.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      Select the personality style that best fits your agent's
                      role
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Voice & Language - Mobile Optimized */}

          {/* Advanced Settings */}
          <GlassCard>
            <div className="p-4 sm:p-5 lg:p-6 z-[99] relative">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 common-bg-icons rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                  Advanced Settings
                </h3>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Custom Instructions
                  </label>
                  <textarea
                    value={formData.customInstructions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customInstructions: e.target.value,
                      })
                    }
                    placeholder="Add specific instructions for your agent..."
                    rows={4}
                    className="common-bg-icons w-full px-3 sm:px-4 py-3 rounded-xl resize-none text-sm sm:text-base transition-all duration-200"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Provide specific guidelines, rules, or context for your
                    agent's responses
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Response Style
                    </label>
                    <SearchableSelect
                      options={responseStyleOptions}
                      value={formData.responseStyle}
                      onChange={(value) =>
                        setFormData({ ...formData, responseStyle: value })
                      }
                      placeholder="Select response style..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Maximum Response Length
                    </label>
                    <SearchableSelect
                      options={maxResponseOptions}
                      value={formData.maxResponseLength}
                      onChange={(value) =>
                        setFormData({ ...formData, maxResponseLength: value })
                      }
                      placeholder="Select max length..."
                    />
                  </div>
                </div>

                <div className="common-bg-icons p-4 rounded-xl">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                    Temperature (Creativity):{" "}
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {formData.temperature}%
                    </span>
                  </label>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-600 dark:text-slate-400 min-w-[70px] text-left font-medium">
                        Conservative
                      </span>
                      <div className="flex-1 relative">
                        {/* Track */}
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full">
                          {/* Active track */}
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${formData.temperature}%` }}
                          ></div>
                        </div>

                        {/* Range input */}
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={formData.temperature}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              temperature: parseInt(e.target.value),
                            })
                          }
                          className="absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer z-20 touch-manipulation"
                          style={{
                            background: "transparent",
                            outline: "none",
                          }}
                        />

                        {/* Thumb/Circle */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-slate-100 rounded-full shadow-lg border-2 border-blue-500 dark:border-blue-400 transition-all duration-300 ease-out pointer-events-none z-10 hover:scale-110"
                          style={{
                            left: `calc(${formData.temperature}% - 10px)`,
                            transform: "translateY(-50%)",
                            boxShadow:
                              "0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          {/* Inner circle for better visibility */}
                          <div className="absolute inset-1 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-400 min-w-[50px] text-right font-medium">
                        Creative
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 px-2">
                      <span className="font-medium">0%</span>
                      <span className="font-medium">25%</span>
                      <span className="font-medium">50%</span>
                      <span className="font-medium">75%</span>
                      <span className="font-medium">100%</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                    Lower values for more consistent responses, higher for more
                    creative answers
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Context Window
                  </label>
                  <SearchableSelect
                    options={contextWindowOptions}
                    value={formData.contextWindow}
                    onChange={(value) =>
                      setFormData({ ...formData, contextWindow: value })
                    }
                    placeholder="Select context window..."
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar - Mobile Stacked */}
        <div className="space-y-4 sm:space-y-6">
          <GlassCard>
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 common-bg-icons rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                  Voice & Language
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Configure language and voice settings
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Language <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) =>
                      setFormData({ ...formData, language: e.target.value })
                    }
                    className="common-bg-icons w-full px-3 sm:px-4 py-3 rounded-xl text-slate-800 dark:text-white text-base sm:text-sm transition-all duration-200 touch-manipulation appearance-none bg-no-repeat bg-right"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "1.25rem 1.25rem",
                    }}
                  >
                    <option value="">Select language...</option>
                    <optgroup label="India">
                      <option value="Hindi">Hindi</option>
                      <option value="Punjabi">Punjabi</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Telugu">Telugu</option>
                      <option value="Bengali">Bengali</option>
                      <option value="Marathi">Marathi</option>
                      <option value="Gujarati">Gujarati</option>
                      <option value="Kannada">Kannada</option>
                      <option value="Malayalam">Malayalam</option>
                      <option value="Odia">Odia</option>
                      <option value="Urdu">Urdu</option>
                    </optgroup>
                    <optgroup label="Middle East">
                      <option value="Arabic">Arabic</option>
                      <option value="Persian">Persian</option>
                      <option value="Hebrew">Hebrew</option>
                      <option value="Turkish">Turkish</option>
                    </optgroup>
                    <optgroup label="Europe">
                      <option value="English (UK)">English (UK)</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Spanish">Spanish</option>
                      <option value="Italian">Italian</option>
                      <option value="Dutch">Dutch</option>
                    </optgroup>
                    <optgroup label="Americas">
                      <option value="English (US)">English (US)</option>
                      <option value="Spanish (MX)">Spanish (MX)</option>
                      <option value="Portuguese (BR)">Portuguese (BR)</option>
                      <option value="French (CA)">French (CA)</option>
                    </optgroup>
                    <optgroup label="APAC">
                      <option value="Chinese (Mandarin)">
                        Chinese (Mandarin)
                      </option>
                      <option value="Japanese">Japanese</option>
                      <option value="Korean">Korean</option>
                      <option value="Thai">Thai</option>
                      <option value="Vietnamese">Vietnamese</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Voice <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.voice}
                    onChange={(e) =>
                      setFormData({ ...formData, voice: e.target.value })
                    }
                    className="common-bg-icons w-full px-3 sm:px-4 py-3 rounded-xl text-slate-800 dark:text-white text-base sm:text-sm transition-all duration-200 touch-manipulation appearance-none bg-no-repeat bg-right"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "1.25rem 1.25rem",
                    }}
                  >
                    <option value="">Select voice...</option>
                    <optgroup label="English">
                      <option value="Sarah - Professional">
                        Sarah - Professional
                      </option>
                      <option value="John - Friendly">John - Friendly</option>
                      <option value="Emma - Warm">Emma - Warm</option>
                    </optgroup>
                    <optgroup label="Hindi">
                      <option value="Arjun - Friendly">Arjun - Friendly</option>
                      <option value="Priya - Professional">
                        Priya - Professional
                      </option>
                      <option value="Raj - Confident">Raj - Confident</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          </GlassCard>
          <GlassCard>
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 common-bg-icons rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                  Guardrails Level
                </h3>
                <Tooltip content="Guardrails control how strictly the agent follows guidelines and handles sensitive topics. Higher levels provide more restrictions but may limit flexibility.">
                  <Info className="w-4 h-4 text-slate-400 cursor-help" />
                </Tooltip>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {[
                  {
                    value: "Low",
                    label: "Low",
                    desc: "Minimal restrictions, maximum flexibility",
                  },
                  {
                    value: "Medium",
                    label: "Medium",
                    desc: "Balanced approach with reasonable limits",
                  },
                  {
                    value: "High",
                    label: "High",
                    desc: "Strict guidelines, maximum safety",
                  },
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() =>
                      setFormData({ ...formData, guardrailsLevel: level.value })
                    }
                    className={`w-full p-3 sm:p-4 text-left border-2 rounded-xl transition-all duration-200 active:scale-[0.98] touch-manipulation ${
                      formData.guardrailsLevel === level.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="font-medium text-slate-800 dark:text-white text-sm sm:text-base">
                      {level.label}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                      {level.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 common-bg-icons rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                  Quick Tips
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                      1
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      Choose a descriptive name
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Make it clear what your agent does
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 dark:text-green-400 text-xs font-bold">
                      2
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      Match persona to purpose
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Sales agents should be persuasive, support agents
                      empathetic
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 dark:text-purple-400 text-xs font-bold">
                      3
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      Test before publishing
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Use training mode to validate responses
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default AgentManagement;
