import React, { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import toast from 'react-hot-toast';
import GlassCard from "../../components/GlassCard";
import { useAgent } from "../../contexts/AgentContext";
import { useAuth } from "../../contexts/AuthContext";
import { isDeveloperUser } from "../../lib/utils";
import Slider from "react-slick";
import {
  Brain,
  Upload,
  FileText,
  Database,
  Target,
  Play,
  CheckCircle,
  AlertCircle,
  BarChart3,
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  Zap,
  Book,
  Lightbulb,
  Settings,
  Download,
  ChevronDown,
  ArrowLeft,
  Bot,
} from "lucide-react";

const Training = () => {
  const { agents, currentAgent } = useAgent();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  let { state } = location;
  // Check if current user is developer
  const isDeveloper = isDeveloperUser(user?.email);

  // Get agent ID from URL params or current agent
  const agentIdFromUrl = params.id;
  const [selectedAgent, setSelectedAgent] = useState(
    agentIdFromUrl || currentAgent?.id || ""
  );

  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [activeTab, setActiveTab] = useState("knowledge");
  const [urls, setUrls] = useState<string[]>(["", ""]);
  const [objections, setObjections] = useState<{objection: string, response: string}[]>([
    { objection: "", response: "" }
  ]);
  const [intents, setIntents] = useState<{name: string, phrases: string, response: string}[]>([
    { name: "", phrases: "", response: "" }
  ]);
  const [testMessage, setTestMessage] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isTestingResponse, setIsTestingResponse] = useState(false);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [testMetrics, setTestMetrics] = useState({
    accuracyScore: 0,
    responseTime: 0,
    confidenceLevel: 0,
    intentRecognition: 0,
    totalTests: 0
  });
  const [savedSections, setSavedSections] = useState({
    knowledge: false,
    examples: false,
    intents: false
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const addUrl = () => {
    setUrls([...urls, ""]);
  };

  const removeUrl = (index: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index));
    }
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const addObjection = () => {
    setObjections([...objections, { objection: "", response: "" }]);
  };

  const removeObjection = (index: number) => {
    if (objections.length > 1) {
      setObjections(objections.filter((_, i) => i !== index));
    }
  };

  const updateObjection = (index: number, field: 'objection' | 'response', value: string) => {
    const newObjections = [...objections];
    newObjections[index][field] = value;
    setObjections(newObjections);
  };

  const addIntent = () => {
    setIntents([...intents, { name: "", phrases: "", response: "" }]);
  };

  const removeIntent = (index: number) => {
    if (intents.length > 1) {
      setIntents(intents.filter((_, i) => i !== index));
    }
  };

  const updateIntent = (index: number, field: 'name' | 'phrases' | 'response', value: string) => {
    const newIntents = [...intents];
    newIntents[index][field] = value;
    setIntents(newIntents);
  };

  const handleTestResponse = () => {
    if (!testMessage.trim()) return;
    
    setIsTestingResponse(true);
    
    // Simulate AI processing time
    setTimeout(() => {
      // Generate a response based on the test message
      let response = "";
      const lowerMessage = testMessage.toLowerCase();
      
      if (lowerMessage.includes("hi") || lowerMessage.includes("hello")) {
        response = "Hello! I'm your AI assistant. How can I help you today?";
      } else if (lowerMessage.includes("price") || lowerMessage.includes("cost")) {
        response = "Our pricing starts at $99/month for the basic plan. Would you like me to explain the different options available?";
      } else if (lowerMessage.includes("help") || lowerMessage.includes("support")) {
        response = "I'm here to help! Please tell me what specific assistance you need and I'll do my best to guide you.";
      } else if (lowerMessage.includes("book") || lowerMessage.includes("schedule")) {
        response = "I'd be happy to help you schedule an appointment. What date and time works best for you?";
      } else {
        response = "Thank you for your message. I understand you're asking about '" + testMessage + "'. Let me help you with that.";
      }
      
      setAiResponse(response);
      setIsTestingResponse(false);
      
      // Update metrics after each test
      setTestMetrics(prev => {
        const newTotalTests = prev.totalTests + 1;
        const randomAccuracy = Math.floor(Math.random() * 15) + 85; // 85-100%
        const randomResponseTime = (Math.random() * 2 + 0.5).toFixed(1); // 0.5-2.5s
        const randomConfidence = Math.floor(Math.random() * 20) + 80; // 80-100%
        const randomIntent = Math.floor(Math.random() * 25) + 75; // 75-100%
        
        return {
          accuracyScore: randomAccuracy,
          responseTime: parseFloat(randomResponseTime),
          confidenceLevel: randomConfidence,
          intentRecognition: randomIntent,
          totalTests: newTotalTests
        };
      });
    }, 1500);
  };

  const handleTestAudio = () => {
    if (!aiResponse.trim()) return;
    
    setIsTestingAudio(true);
    
    // Use Web Speech API for text-to-speech
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(aiResponse);
      
      // Configure voice settings
      utterance.rate = 1.0; // Normal speed
      utterance.pitch = 1.0; // Normal pitch
      utterance.volume = 1.0; // Full volume
      
      // Try to find a professional female voice - more aggressive filtering
      const voices = speechSynthesis.getVoices();
      
      // First, filter out any voices that are clearly male
      const nonMaleVoices = voices.filter(voice => 
        !voice.name.toLowerCase().includes('male') &&
        !voice.name.toLowerCase().includes('man') &&
        !voice.name.toLowerCase().includes('guy') &&
        !voice.name.toLowerCase().includes('boy') &&
        !voice.name.toLowerCase().includes('david') &&
        !voice.name.toLowerCase().includes('alex') &&
        !voice.name.toLowerCase().includes('tom') &&
        !voice.name.toLowerCase().includes('john') &&
        !voice.name.toLowerCase().includes('mark') &&
        !voice.name.toLowerCase().includes('daniel') &&
        !voice.name.toLowerCase().includes('fred') &&
        !voice.name.toLowerCase().includes('jorge')
      );
      
      // Then look for explicitly female voices
      const femaleVoice = nonMaleVoices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('sarah') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('karen') ||
        voice.name.toLowerCase().includes('susan') ||
        voice.name.toLowerCase().includes('anna') ||
        voice.name.toLowerCase().includes('emma') ||
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('hazel') ||
        voice.name.toLowerCase().includes('fiona') ||
        voice.name.toLowerCase().includes('kate') ||
        voice.name.toLowerCase().includes('victoria') ||
        voice.name.toLowerCase().includes('allison') ||
        voice.name.toLowerCase().includes('ava') ||
        voice.name.toLowerCase().includes('serena') ||
        voice.name.toLowerCase().includes('tessa')
      ) || nonMaleVoices.find(voice => voice.lang.startsWith('en-US'))
        || nonMaleVoices.find(voice => voice.lang.startsWith('en')) 
        || nonMaleVoices[0]
        || voices[0];
      
      // Force higher pitch for more feminine sound
      if (femaleVoice) {
        utterance.voice = femaleVoice;
        utterance.pitch = 1.2; // Higher pitch for more feminine sound
      }
      
      utterance.onend = () => {
        setIsTestingAudio(false);
      };
      
      utterance.onerror = () => {
        setIsTestingAudio(false);
        console.error('Speech synthesis error');
      };
      
      speechSynthesis.speak(utterance);
    } else {
      // Fallback: simulate audio test
      setTimeout(() => {
        setIsTestingAudio(false);
        alert('Audio test completed! (Speech synthesis not supported in this browser)');
      }, 3000);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter(file => {
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/csv'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!validTypes.includes(file.type)) {
          toast.error(`${file.name} is not a supported file type`);
          return false;
        }
        
        if (file.size > maxSize) {
          toast.error(`${file.name} is too large (max 10MB)`);
          return false;
        }
        
        return true;
      });
      
      if (validFiles.length > 0) {
        setIsUploading(true);
        
        // Simulate upload process
        setTimeout(() => {
          setUploadedFiles(prev => [...prev, ...validFiles]);
          setIsUploading(false);
          toast.success(`${validFiles.length} file(s) uploaded successfully!`);
        }, 2000);
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    toast.success('File removed');
  };

  const saveKnowledgeBase = () => {
    // Here you would normally save to backend
    setSavedSections(prev => ({ ...prev, knowledge: true }));
    toast.success('Knowledge base saved successfully!');
  };

  const saveTrainingExamples = () => {
    // Here you would normally save to backend
    setSavedSections(prev => ({ ...prev, examples: true }));
    toast.success('Training examples saved successfully!');
  };

  const saveIntentTraining = () => {
    // Here you would normally save to backend
    setSavedSections(prev => ({ ...prev, intents: true }));
    toast.success('Intent training saved successfully!');
  };

  const canStartTraining = () => {
    return savedSections.knowledge && savedSections.examples && savedSections.intents;
  };

  const selectedAgentData = agents.find((agent) => agent.id === selectedAgent);

  const trainingTabs = [
    { id: "knowledge", label: "Knowledge Base", icon: Database },
    { id: "examples", label: "Training Examples", icon: MessageSquare },
    { id: "intents", label: "Intent Training", icon: Target },
    { id: "testing", label: "Testing & Validation", icon: CheckCircle },
  ];

  const knowledgeStats = isDeveloper
    ? [
        { label: "Documents", value: "24", icon: FileText, color: "blue" },
        { label: "FAQ Items", value: "156", icon: Lightbulb, color: "green" },
        {
          label: "Training Examples",
          value: "89",
          icon: MessageSquare,
          color: "purple",
        },
        {
          label: "Intents Trained",
          value: "12",
          icon: Target,
          color: "orange",
        },
      ]
    : [
        { label: "Documents", value: "0", icon: FileText, color: "blue" },
        { label: "FAQ Items", value: "0", icon: Lightbulb, color: "green" },
        {
          label: "Training Examples",
          value: "0",
          icon: MessageSquare,
          color: "purple",
        },
        { label: "Intents Trained", value: "0", icon: Target, color: "orange" },
      ];

  const   trainingMetrics = isDeveloper
    ? [
        {
          label: "Accuracy Score",
          value: `${testMetrics.accuracyScore}%`,
          change: testMetrics.totalTests > 0 ? `+${(Math.random() * 3 + 0.5).toFixed(1)}%` : "No data",
          trend: "up",
        },
        {
          label: "Response Time",
          value: `${testMetrics.responseTime}s`,
          change: testMetrics.totalTests > 0 ? `-${(Math.random() * 0.5 + 0.1).toFixed(1)}s` : "No data",
          trend: "down",
        },
        {
          label: "Confidence Level",
          value: `${testMetrics.confidenceLevel}%`,
          change: testMetrics.totalTests > 0 ? `+${(Math.random() * 5 + 1).toFixed(1)}%` : "No data",
          trend: "up",
        },
        {
          label: "Intent Recognition",
          value: `${testMetrics.intentRecognition}%`,
          change: testMetrics.totalTests > 0 ? `+${(Math.random() * 2 + 0.5).toFixed(1)}%` : "No data",
          trend: "up",
        },
      ]
    : [
        {
          label: "Accuracy Score",
          value: "0%",
          change: "No data",
          trend: "neutral",
        },
        {
          label: "Response Time",
          value: "0s",
          change: "No data",
          trend: "neutral",
        },
        {
          label: "Confidence Level",
          value: "0%",
          change: "No data",
          trend: "neutral",
        },
        {
          label: "Intent Recognition",
          value: "0%",
          change: "No data",
          trend: "neutral",
        },
      ];

  const handleStartTraining = () => {
    setIsTraining(true);
    setTrainingProgress(0);

    const interval = setInterval(() => {
      setTrainingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  // Slider settings for training stats carousel
  const statsSliderSettings = {
    dots: false,
    infinite: false,
    speed: 300,
    slidesToShow: 2.2,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      {
        breakpoint: 640, // sm
        settings: {
          slidesToShow: 2.2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 480, // xs
        settings: {
          slidesToShow: 1.8,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 768, // md and up - show grid instead
        settings: "unslick" as const,
      },
    ],
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Mobile-First Header */}

      {state?.from === "list" && (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
          <button
            onClick={() => navigate("/agents")}
            className="common-button-bg2 flex items-center gap-2 transition-colors px-4 py-2 -m-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm sm:text-base font-medium">
              Back to Agents
            </span>
          </button>
        </div>
      )}

      {/* Mobile-First Agent Selection */}
      <div className="">
        <GlassCard>
          <div className="p-4 sm:p-6">
            {!isDeveloper ? (
              <div className="text-center py-8 sm:py-12">
                <Bot className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-2">
                  Please Create an Agent to Start Training
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-6">
                  You need to create your first AI agent before you can access
                  training features. Go to Agent Management to get started.
                </p>
                <button
                  onClick={() => navigate("/agents")}
                  disabled={!isDeveloper}
                  className={`${
                    isDeveloper
                      ? "common-button-bg"
                      : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50 px-6 py-3 rounded-lg"
                  }`}
                >
                  Go to Agent Management
                </button>
              </div>
            ) : selectedAgentData ? (
              <div className="space-y-4 sm:space-y-6">
                {/* Current Agent Display - Mobile Optimized */}
                <div className="space-y-4">
                  {/* Agent Info Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 common-bg-icons  flex items-center justify-center flex-shrink-0">
                        <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-black dark:text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-white truncate">
                          {selectedAgentData.name}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Training Session
                        </p>
                      </div>
                    </div>
                    {/* Mobile Agent Selector */}
                    <div className="relative w-full sm:w-auto sm:flex-shrink-0">
                      <select
                        value={selectedAgent}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                        className="common-bg-icons w-full px-3 py-2 sm:px-4 sm:py-2 appearance-none pr-8 sm:pr-10 font-medium text-sm sm:text-base"
                      >
                        {agents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-600 dark:text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Agent Details Row - Mobile Optimized */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <span>{selectedAgentData.language}</span>
                      <span className="text-slate-400">•</span>
                      <span className="truncate">
                        {selectedAgentData.persona}
                      </span>
                    </div>
                    <span
                      className={`inline-flex w-fit px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                        selectedAgentData.status === "Published"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : selectedAgentData.status === "Training"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {selectedAgentData.status}
                    </span>
                  </div>
                </div>

                {/* Mobile-First Training Stats with Carousel */}
                <div className="training-stats-container">
                  {/* Mobile Carousel */}
                  <div className="block md:hidden">
                    <Slider
                      {...statsSliderSettings}
                      className="training-stats-slider"
                    >
                      {knowledgeStats?.map((stat, index) => (
                        <div key={index} className="px-1.5">
                          <div className="common-bg-icons p-3 rounded-xl h-full">
                            <div className="flex items-center gap-3">
                              <div className="common-bg-icons p-2 rounded-lg flex-shrink-0">
                                <stat.icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-lg font-bold text-slate-800 dark:text-white">
                                  {stat.value}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                  {stat.label}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </Slider>
                  </div>

                  {/* Desktop Grid */}
                  <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {selectedAgentData?.name === "Ricky sales machine" ||
                    selectedAgentData?.name === "Ami support assistant"
                      ? knowledgeStats.map((stat, index) => (
                          <div
                            key={index}
                            className="common-bg-icons p-4 rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <div className="common-bg-icons p-2 rounded-lg flex-shrink-0">
                                <stat.icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xl font-bold text-slate-800 dark:text-white">
                                  {stat.value}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                                  {stat.label}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      : knowledgeStats.map((stat, index) => (
                          <div
                            key={index}
                            className="common-bg-icons p-4 rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <div className="common-bg-icons p-2 rounded-lg flex-shrink-0">
                                <stat.icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xl font-bold text-slate-800 dark:text-white">
                                  0
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                                  {stat.label}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-2 sm:mb-3">
                  Select an Agent to Train
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 max-w-md mx-auto px-4">
                  Choose an agent from your collection to start training with
                  knowledge base, examples, and validation
                </p>
                <div className="max-w-xs sm:max-w-sm mx-auto">
                  <div className="relative">
                    <select
                      value={selectedAgent}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                      className="common-bg-icons w-full px-4 py-3 rounded-xl appearance-none pr-10 font-medium text-center text-sm sm:text-base"
                    >
                      <option value="">Choose an agent...</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {selectedAgent && selectedAgentData && (
        <div className=" space-y-4 sm:space-y-6">
          {/* Training Tabs - Using Settings.tsx Pattern */}
          <GlassCard>
            <div className="p-4 sm:p-6">
              <div className="flex space-x-1 common-bg-icons rounded-xl p-1 overflow-x-auto">
                {trainingTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? "common-button-bg2 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition ease-in-out"
                    }`}
                  >
                    <tab.icon className="w-3 sm:w-4 h-3 sm:h-4" />
                    <span className="text-xs sm:text-sm">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Mobile-First Training Content */}
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <GlassCard>
                <div className="p-4 sm:p-6">
                  {activeTab === "knowledge" && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">
                        Knowledge Base Management
                      </h3>

                      <div className="space-y-4 sm:space-y-6">
                          <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            Upload Knowledge Documents
                            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                              (PDF, DOC, TXT, CSV)
                            </span>
                          </label>
                          <div className="common-bg-icons border-2 border-dashed rounded-xl p-6 sm:p-8 text-center">
                            <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-3 sm:mb-4" />
                            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-2">
                              Drop files here or tap to upload
                            </p>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 mb-4">
                              PDF, DOC, TXT, CSV files (Max 10MB each)
                            </p>
                            <input
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx,.txt,.csv"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="file-upload"
                              disabled={!isDeveloper || isUploading}
                            />
                            <label
                              htmlFor="file-upload"
                              className={`touch-manipulation cursor-pointer inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg ${
                                isDeveloper && !isUploading
                                  ? "common-button-bg hover:opacity-90 transition-opacity"
                                  : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50"
                              }`}
                            >
                              {isUploading ? (
                                <>
                                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                  Uploading...
                                </>
                              ) : (
                                "Choose Files"
                              )}
                            </label>
                          </div>

                          {/* Uploaded Files List */}
                          {uploadedFiles.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Uploaded Files ({uploadedFiles.length})
                              </h4>
                              {uploadedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                                      <FileText className="w-4 h-4 text-green-600 dark:text-green-300" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-green-800 dark:text-green-200 truncate max-w-[200px]">
                                        {file.name}
                                      </p>
                                      <p className="text-xs text-green-600 dark:text-green-400">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removeFile(index)}
                                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors p-1"
                                    title="Remove file"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* System Prompt / Instructions */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            System Prompt / Agent Instructions
                            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                              (Core behavior and personality)
                            </span>
                          </label>
                          <textarea
                            placeholder="Define your agent's role, personality, and core instructions. E.g., 'You are a friendly sales assistant for ShivAI. Your goal is to help customers understand our AI calling platform...'"
                            rows={5}
                            className="common-bg-icons w-full px-4 py-3 rounded-xl resize-none text-sm sm:text-base"
                          />
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            This defines how your agent behaves and responds in all conversations
                          </p>
                        </div>

                        {/* First Message */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            First Message (Greeting)
                            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                              (How agent starts conversations)
                            </span>
                          </label>
                          <textarea
                            placeholder="Hi! This is Sarah from ShivAI. How can I help you today?"
                            rows={3}
                            className="common-bg-icons w-full px-4 py-3 rounded-xl resize-none text-sm sm:text-base"
                          />
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            The opening message when a call starts or customer initiates chat
                          </p>
                        </div>

                        {/* Mobile-Optimized File Upload */}
                      
                        {/* URL-based Knowledge */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            Website / Knowledge Base URLs
                            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                              (Scrape content from URLs)
                            </span>
                          </label>
                          <div className="space-y-3">
                            {/* URL Input List */}
                            <div className="space-y-2">
                              {urls.map((url, index) => (
                                <div key={index} className="flex gap-2">
                                  <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => updateUrl(index, e.target.value)}
                                    placeholder={`https://example${index + 1}.com/${index === 0 ? 'help-center' : 'faq'}`}
                                    className="common-bg-icons flex-1 px-4 py-3 rounded-xl text-sm sm:text-base"
                                  />
                                  {urls.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeUrl(index)}
                                      className="px-3 py-3 text-red-600 dark:text-red-400 rounded-xl hover:text-red-700 dark:hover:text-red-300 transition-colors"
                                      title="Remove URL"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {/* Add URL Button */}
                            <button
                              type="button"
                              onClick={addUrl}
                              className="w-full sm:w-auto px-4 py-3 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors font-medium text-sm"
                            >
                              + Add Another URL
                            </button>
                          </div>
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Agent will learn from publicly accessible web pages
                          </p>
                        </div>

                        {/* Manual Knowledge Entry */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            Manual Knowledge Entry
                            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                              (FAQs, policies, product info)
                            </span>
                          </label>
                          <textarea
                            placeholder="Enter knowledge, FAQs, policies, or any information your agent should know..."
                            rows={6}
                            className="common-bg-icons w-full px-4 py-3 rounded-xl resize-none text-sm sm:text-base"
                          />
                          <div className="mt-2 flex justify-between items-center text-xs text-slate-500">
                            <span>Provide detailed, relevant information</span>
                            <button
                              disabled={!isDeveloper}
                              className={`font-medium px-3 py-1 rounded ${
                                isDeveloper
                                  ? "common-button-bg2"
                                  : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                              }`}
                            >
                              Save Draft
                            </button>
                          </div>
                        </div>

                        {/* Save Knowledge Base Button */}
                        <div className="flex justify-end">
                          <button
                            onClick={saveKnowledgeBase}
                            disabled={!isDeveloper}
                            className={`px-6 py-3 rounded-xl font-medium ${
                              isDeveloper
                                ? savedSections.knowledge
                                  ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                                  : "common-button-bg"
                                : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50"
                            }`}
                          >
                            {savedSections.knowledge ? "✓ Knowledge Base Saved" : "Save Knowledge Base"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "examples" && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">
                        Training Examples & Conversation Patterns
                      </h3>

                      <div className="space-y-4">
                        {/* Call Script / Conversation Flow */}
                        <div className="common-bg-icons p-4 sm:p-5 rounded-xl">
                          <h4 className="font-medium text-slate-800 dark:text-white mb-2 sm:mb-3">
                            Call Script / Conversation Flow
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Define the structure and flow of conversations
                          </p>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                Opening Script:
                              </label>
                              <textarea
                                placeholder="Hi, this is [Agent Name] calling from [Company]. Is this a good time to talk about [Purpose]?"
                                rows={3}
                                className="common-bg-icons w-full px-4 py-3 rounded-lg text-sm sm:text-base resize-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                Key Talking Points:
                              </label>
                              <textarea
                                placeholder="• Product benefits&#10;• Pricing details&#10;• Common objection handling&#10;• Call to action"
                                rows={4}
                                className="common-bg-icons w-full px-4 py-3 rounded-lg text-sm sm:text-base resize-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                Closing Script:
                              </label>
                              <textarea
                                placeholder="Thank you for your time. I'll send you the information we discussed. Is there anything else I can help you with?"
                                rows={3}
                                className="common-bg-icons w-full px-4 py-3 rounded-lg text-sm sm:text-base resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Sample Conversations */}
                        <div className="common-bg-icons p-4 sm:p-5 rounded-xl">
                          <h4 className="font-medium text-slate-800 dark:text-white mb-2 sm:mb-3">
                            Sample Conversation Examples
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Provide example conversations to improve agent responses
                          </p>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                Customer Input:
                              </label>
                              <input
                                type="text"
                                placeholder="What the customer might say..."
                                className="common-bg-icons w-full px-4 py-3 rounded-lg text-sm sm:text-base"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                Expected Response:
                              </label>
                              <textarea
                                placeholder="How the agent should respond..."
                                rows={4}
                                className="common-bg-icons w-full px-4 py-3 rounded-lg text-sm sm:text-base resize-none"
                              />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                disabled={!isDeveloper}
                                className={`flex-1 touch-manipulation ${
                                  isDeveloper
                                    ? "common-button-bg"
                                    : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50 px-4 py-3 rounded-lg"
                                }`}
                              >
                                Add Example
                              </button>
                              <button
                                disabled={!isDeveloper}
                                className={`flex items-center gap-2 ${
                                  isDeveloper
                                    ? "common-button-bg2"
                                    : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50 px-4 py-3 rounded-lg"
                                }`}
                              >
                                <FileText className="w-4 h-4" />
                                Import CSV
                              </button>
                              <button
                                disabled={!isDeveloper}
                                className={`flex items-center gap-2 ${
                                  isDeveloper
                                    ? "common-button-bg2"
                                    : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50 px-4 py-3 rounded-lg"
                                }`}
                              >
                                <Zap className="w-4 h-4" />
                                Import Audio
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Objection Handling */}
                        <div className="common-bg-icons p-4 sm:p-5 rounded-xl">
                          <h4 className="font-medium text-slate-800 dark:text-white mb-2 sm:mb-3">
                            Objection Handling
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Train your agent to handle common objections professionally
                          </p>
                          <div className="space-y-6">
                            {objections.map((objection, index) => (
                              <div key={index} className="space-y-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg relative">
                                {objections.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeObjection(index)}
                                    className="absolute top-2 right-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                                    title="Remove Objection"
                                  >
                                    ✕
                                  </button>
                                )}
                                <div className="pr-8">
                                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Common Objection {index + 1}:
                                  </label>
                                  <input
                                    type="text"
                                    value={objection.objection}
                                    onChange={(e) => updateObjection(index, 'objection', e.target.value)}
                                    placeholder="e.g., 'It's too expensive' or 'I'm not interested'"
                                    className="common-bg-icons w-full px-4 py-3 rounded-lg text-sm sm:text-base"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Response Strategy {index + 1}:
                                  </label>
                                  <textarea
                                    value={objection.response}
                                    onChange={(e) => updateObjection(index, 'response', e.target.value)}
                                    placeholder="How should the agent respond to this objection?"
                                    rows={3}
                                    className="common-bg-icons w-full px-4 py-3 rounded-lg text-sm sm:text-base resize-none"
                                  />
                                </div>
                              </div>
                            ))}
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                type="button"
                                onClick={addObjection}
                                className="w-full sm:w-auto px-4 py-3 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors font-medium text-sm"
                              >
                                + Add Another Objection
                              </button>
                              <button
                                disabled={!isDeveloper}
                                className={`w-full sm:w-auto ${
                                  isDeveloper
                                    ? "common-button-bg"
                                    : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50 px-4 py-3 rounded-lg"
                                }`}
                              >
                                Save All Objections
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Save Training Examples Button */}
                      <div className="flex justify-end">
                        <button
                          onClick={saveTrainingExamples}
                          disabled={!isDeveloper}
                          className={`px-6 py-3 rounded-xl font-medium ${
                            isDeveloper
                              ? savedSections.examples
                                ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                                : "common-button-bg"
                              : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50"
                          }`}
                        >
                          {savedSections.examples ? "✓ Training Examples Saved" : "Save Training Examples"}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === "intents" && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">
                        Intent Training & Voice Settings
                      </h3>

                      <div className="space-y-4">
                        {/* Voice & Speech Settings */}
                        <div className="common-bg-icons p-4 sm:p-5 rounded-xl">
                          <h4 className="font-medium text-slate-800 dark:text-white mb-2 sm:mb-3">
                            Voice & Speech Configuration
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Customize how your agent sounds and speaks
                          </p>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                Voice Model:
                              </label>
                              <select className="common-bg-icons w-full px-4 py-3 rounded-lg text-sm sm:text-base">
                                <option>Professional Female (US)</option>
                                <option>Professional Male (US)</option>
                                <option>Casual Female (UK)</option>
                                <option>Casual Male (UK)</option>
                                <option>Friendly (Australian)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                Speaking Rate:
                              </label>
                              <div className="flex items-center gap-4">
                                <input
                                  type="range"
                                  min="0.5"
                                  max="2"
                                  step="0.1"
                                  defaultValue="1"
                                  className="flex-1"
                                />
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-12">
                                  1.0x
                                </span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                Interruption Sensitivity:
                              </label>
                              <select className="common-bg-icons w-full px-4 py-3 rounded-lg text-sm sm:text-base">
                                <option>Low (Agent keeps talking)</option>
                                <option>Medium (Balanced)</option>
                                <option>High (Stops immediately)</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Intent Configuration */}
                        <div className="common-bg-icons p-4 sm:p-5 rounded-xl">
                          <h4 className="font-medium text-slate-800 dark:text-white mb-2 sm:mb-3">
                            Intent Recognition
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Train the agent to recognize specific intents and
                            respond appropriately
                          </p>
                          <div className="space-y-6">
                            {intents.map((intent, index) => (
                              <div key={index} className="space-y-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg relative">
                                {intents.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeIntent(index)}
                                    className="absolute top-2 right-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                                    title="Remove Intent"
                                  >
                                    ✕
                                  </button>
                                )}
                                <div className="pr-8">
                                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Intent Name {index + 1}:
                                  </label>
                                  <input
                                    type="text"
                                    value={intent.name}
                                    onChange={(e) => updateIntent(index, 'name', e.target.value)}
                                    placeholder="e.g., pricing_inquiry, support_request, booking_request"
                                    className="common-bg-icons w-full px-4 py-3 rounded-lg text-sm sm:text-base"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Example Phrases {index + 1} (one per line):
                                  </label>
                                  <textarea
                                    value={intent.phrases}
                                    onChange={(e) => updateIntent(index, 'phrases', e.target.value)}
                                    placeholder="How much does it cost?&#10;What's your pricing?&#10;Can you tell me the price?&#10;What are your rates?"
                                    rows={4}
                                    className="common-bg-icons w-full px-4 py-3 rounded-lg text-sm sm:text-base resize-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Intent Response Template {index + 1}:
                                  </label>
                                  <textarea
                                    value={intent.response}
                                    onChange={(e) => updateIntent(index, 'response', e.target.value)}
                                    placeholder="Our pricing starts at $99/month for the basic plan..."
                                    rows={3}
                                    className="common-bg-icons w-full px-4 py-3 rounded-lg text-sm sm:text-base resize-none"
                                  />
                                </div>
                              </div>
                            ))}
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                type="button"
                                onClick={addIntent}
                                className="w-full sm:w-auto px-4 py-3 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors font-medium text-sm"
                              >
                                + Add Another Intent
                              </button>
                              <button
                                disabled={!isDeveloper}
                                className={`flex-1 touch-manipulation ${
                                  isDeveloper
                                    ? "common-button-bg"
                                    : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50 px-4 py-3 rounded-lg"
                                }`}
                              >
                                Save All Intents
                              </button>
                              <button
                                disabled={!isDeveloper}
                                className={`${
                                  isDeveloper
                                    ? "common-button-bg2"
                                    : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50 px-4 py-3 rounded-lg"
                                }`}
                              >
                                Templates
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* End Call Conditions */}
                        <div className="common-bg-icons p-4 sm:p-5 rounded-xl">
                          <h4 className="font-medium text-slate-800 dark:text-white mb-2 sm:mb-3">
                            End Call Conditions
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Define when and how the agent should end calls
                          </p>
                          <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" className="w-4 h-4 rounded" />
                              <span className="text-sm text-slate-700 dark:text-slate-300">
                                End call when objective is completed
                              </span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" className="w-4 h-4 rounded" />
                              <span className="text-sm text-slate-700 dark:text-slate-300">
                                End call on explicit customer request
                              </span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" className="w-4 h-4 rounded" />
                              <span className="text-sm text-slate-700 dark:text-slate-300">
                                Maximum call duration: <input type="number" placeholder="15" className="common-bg-icons w-16 px-2 py-1 rounded ml-2 text-center" /> minutes
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Save Intent Training Button */}
                      <div className="flex justify-end">
                        <button
                          onClick={saveIntentTraining}
                          disabled={!isDeveloper}
                          className={`px-6 py-3 rounded-xl font-medium ${
                            isDeveloper
                              ? savedSections.intents
                                ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                                : "common-button-bg"
                              : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50"
                          }`}
                        >
                          {savedSections.intents ? "✓ Intent Training Saved" : "Save Intent Training"}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === "testing" && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">
                        Testing & Validation
                      </h3>

                      <div className="space-y-4 sm:space-y-6">
                        {/* Mobile-Optimized Test Interface */}
                        <div className="common-bg-icons p-4 sm:p-5 rounded-xl">
                          <h4 className="font-medium text-slate-800 dark:text-white mb-2 sm:mb-3">
                            Test Agent Response
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <textarea
                                value={testMessage}
                                onChange={(e) => setTestMessage(e.target.value)}
                                placeholder="Type a test message to see how your agent responds..."
                                rows={3}
                                className="common-bg-icons w-full px-4 py-3 rounded-lg text-sm sm:text-base resize-none"
                              />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                onClick={handleTestResponse}
                                disabled={!isDeveloper || !testMessage.trim() || isTestingResponse}
                                className={`w-full sm:w-auto touch-manipulation ${
                                  isDeveloper && testMessage.trim() && !isTestingResponse
                                    ? "common-button-bg"
                                    : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50 px-6 py-3 rounded-lg"
                                }`}
                              >
                                {isTestingResponse ? "Testing..." : "Test Response"}
                              </button>
                              <button
                                onClick={handleTestAudio}
                                disabled={!isDeveloper || !aiResponse.trim() || isTestingAudio}
                                className={`flex items-center gap-2 ${
                                  isDeveloper && aiResponse.trim() && !isTestingAudio
                                    ? "common-button-bg2"
                                    : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50 px-4 py-3 rounded-lg"
                                }`}
                              >
                                <Play className="w-4 h-4" />
                                {isTestingAudio ? "Playing..." : "Test Audio"}
                              </button>
                            </div>
                            
                            {/* AI Response Display */}
                            {(aiResponse || isTestingResponse) && (
                              <div className={`mt-4 p-4 border rounded-lg transition-all duration-300 ${
                                isTestingAudio 
                                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                                  : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                              }`}>
                                <div className="flex items-start gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                                    isTestingAudio 
                                      ? "bg-green-100 dark:bg-green-800 animate-pulse" 
                                      : "bg-blue-100 dark:bg-blue-800"
                                  }`}>
                                    <Bot className={`w-4 h-4 ${
                                      isTestingAudio 
                                        ? "text-green-600 dark:text-green-300" 
                                        : "text-blue-600 dark:text-blue-300"
                                    }`} />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className={`text-sm font-medium ${
                                        isTestingAudio 
                                          ? "text-green-800 dark:text-green-200" 
                                          : "text-blue-800 dark:text-blue-200"
                                      }`}>
                                        AI Agent Response:
                                      </p>
                                      {isTestingAudio && (
                                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                          <div className="flex space-x-1">
                                            <div className="w-1 h-3 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></div>
                                            <div className="w-1 h-3 bg-green-600 dark:bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                                            <div className="w-1 h-3 bg-green-600 dark:bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                          </div>
                                          <span className="text-xs font-medium">Speaking...</span>
                                        </div>
                                      )}
                                    </div>
                                    {isTestingResponse ? (
                                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                        <div className="animate-spin w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full"></div>
                                        <span className="text-sm">Generating response...</span>
                                      </div>
                                    ) : (
                                      <p className={`text-sm leading-relaxed ${
                                        isTestingAudio 
                                          ? "text-green-700 dark:text-green-300" 
                                          : "text-blue-700 dark:text-blue-300"
                                      }`}>
                                        {aiResponse}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Test Statistics */}
                            {testMetrics.totalTests > 0 && (
                              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <p className="text-sm text-green-700 dark:text-green-300">
                                  <strong>Tests Completed:</strong> {testMetrics.totalTests} | 
                                  <strong className="ml-2">Latest Accuracy:</strong> {testMetrics.accuracyScore}% | 
                                  <strong className="ml-2">Response Time:</strong> {testMetrics.responseTime}s
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Mobile-First Metrics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {trainingMetrics.map((metric, index) => (
                            <div
                              key={index}
                              className="common-bg-icons p-4 rounded-xl"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-800 dark:text-white truncate">
                                  {metric.label}
                                </span>
                                <div className="flex items-center gap-1 flex-shrink-0 text-slate-600 dark:text-slate-400">
                                  <TrendingUp
                                    className={`w-3 h-3 ${
                                      metric.trend === "down"
                                        ? "rotate-180"
                                        : ""
                                    }`}
                                  />
                                  <span className="text-xs">
                                    {metric.change}
                                  </span>
                                </div>
                              </div>
                              <p className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
                                {metric.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>

            {/* Mobile-First Training Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              <GlassCard>
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                    Training Status
                  </h3>

                  {!isTraining && trainingProgress === 0 && (
                    <div className="text-center">
                      <div className="common-bg-icons w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600 dark:text-slate-400" />
                      </div>
                      
                      {/* Training Requirements */}
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                          Training Requirements:
                        </p>
                        <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                          <div className="flex items-center gap-2">
                            {savedSections.knowledge ? (
                              <span className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">✓</span>
                            ) : (
                              <span className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs">○</span>
                            )}
                            <span>Knowledge Base saved</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {savedSections.examples ? (
                              <span className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">✓</span>
                            ) : (
                              <span className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs">○</span>
                            )}
                            <span>Training Examples saved</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {savedSections.intents ? (
                              <span className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">✓</span>
                            ) : (
                              <span className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs">○</span>
                            )}
                            <span>Intent Training saved</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
                        {canStartTraining() 
                          ? "All requirements complete! Ready to train your agent."
                          : "Please save all training sections before starting training."
                        }
                      </p>
                      <button
                        onClick={handleStartTraining}
                        disabled={!canStartTraining()}
                        className={`w-full rounded-xl px-4 sm:px-6 py-3 font-medium touch-manipulation ${
                          canStartTraining()
                            ? "common-button-bg"
                            : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50"
                        }`}
                      >
                        {canStartTraining() ? "Start Training" : "Save All Sections First"}
                      </button>
                    </div>
                  )}

                  {(isTraining || trainingProgress > 0) && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <p className="font-medium text-slate-800 dark:text-white mb-2 text-sm sm:text-base">
                          {isTraining
                            ? "Training in Progress..."
                            : "Training Complete!"}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          {trainingProgress}% Complete
                        </p>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 sm:h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 sm:h-3 rounded-full transition-all duration-500"
                          style={{ width: `${trainingProgress}%` }}
                        ></div>
                      </div>

                      {trainingProgress === 100 && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-xl border-2 border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-green-800 dark:text-green-300 text-sm sm:text-base">
                                Training Successful!
                              </p>
                              <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                                Your agent is now ready for deployment
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </GlassCard>

              <GlassCard>
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                    Training Tips
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="common-bg-icons w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-slate-600 dark:text-slate-400 text-xs font-bold">
                          1
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white mb-1">
                          Upload comprehensive documentation
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Include FAQs, product info, and policies
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="common-bg-icons w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-slate-600 dark:text-slate-400 text-xs font-bold">
                          2
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white mb-1">
                          Provide conversation examples
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Show how to handle different scenarios
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="common-bg-icons w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-slate-600 dark:text-slate-400 text-xs font-bold">
                          3
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white mb-1">
                          Test thoroughly before publishing
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Use test mode to validate responses
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard>
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <button className="common-bg-icons w-full flex items-center gap-3 p-3 sm:p-3.5 rounded-lg hover:shadow-sm transition-colors text-sm font-medium touch-manipulation">
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-slate-600 dark:text-slate-400" />
                      <span className="text-slate-800 dark:text-white">
                        Bulk Upload Documents
                      </span>
                    </button>
                    <button className="common-bg-icons w-full flex items-center gap-3 p-3 sm:p-3.5 rounded-lg hover:shadow-sm transition-colors text-sm font-medium touch-manipulation">
                      <Download className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-slate-600 dark:text-slate-400" />
                      <span className="text-slate-800 dark:text-white">
                        Export Training Data
                      </span>
                    </button>
                    <button className="common-bg-icons w-full flex items-center gap-3 p-3 sm:p-3.5 rounded-lg hover:shadow-sm transition-colors text-sm font-medium touch-manipulation">
                      <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-slate-600 dark:text-slate-400" />
                      <span className="text-slate-800 dark:text-white">
                        View Training Analytics
                      </span>
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      )}

      {!selectedAgent && (
        <div className="px-4 sm:px-0">
          <div className="text-center py-12 sm:py-16">
            <Brain className="w-16 h-16 sm:w-20 sm:h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4 sm:mb-6" />
            <h3 className="text-lg sm:text-xl font-medium text-slate-600 dark:text-slate-400 mb-2 sm:mb-3">
              Select an agent to start training
            </h3>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-500 max-w-md mx-auto">
              Choose an agent from the dropdown above to begin training with
              knowledge base, examples, and intent configuration
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Training;
