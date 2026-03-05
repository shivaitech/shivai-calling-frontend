import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import appToast from "../../components/AppToast";
import GlassCard from "../../components/GlassCard";
import { useAgent } from "../../contexts/AgentContext";
import { agentAPI } from "../../services/agentAPI";
import Slider from "react-slick";
import {
  Brain,
  Upload,
  FileText,
  Database,
  Target,
  Play,
  CheckCircle,
  BarChart3,
  MessageSquare,
  TrendingUp,
  Zap,
  Lightbulb,
  Download,
  ChevronDown,
  ArrowLeft,
  Bot,
  Sparkles,
  Loader2,
  Save,
  X,
  File,
  Image,
  Trash2,
} from "lucide-react";

const Training = () => {
  const { currentAgent } = useAgent();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  let { state } = location;
  // Check if current user is developer
  // isDeveloper removed — all users can access training features

  // Get agent ID from URL params or current agent
  const agentIdFromUrl = params.id;
  const [selectedAgent, setSelectedAgent] = useState(
    agentIdFromUrl || currentAgent?.id || ""
  );

  // Local state to store fetched agents
  const [localAgents, setLocalAgents] = useState<any[]>([]);

  const [trainingProgress, setTrainingProgress] = useState(0);

  // Fetch latest agents directly from API on component mount
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const fetchedAgents = await agentAPI.getAgents();
        console.log("Agents loaded:", fetchedAgents);
        // Store agents in local state
        setLocalAgents(fetchedAgents);
        // Update the selected agent if agents are loaded
        if (fetchedAgents.length > 0 && !selectedAgent) {
          setSelectedAgent(fetchedAgents[0].id);
        }
      } catch (error) {
        console.error("Failed to load agents from API:", error);
        appToast.error("Failed to load agents. Please refresh the page.");
      }
    };

    loadAgents();
  }, []);

  // Load full agent config whenever selectedAgent changes
  useEffect(() => {
    if (!selectedAgent) return;
    const loadAgentConfig = async () => {
      setIsLoadingAgentConfig(true);
      // Reset fields so stale data doesn't bleed between agents
      setSystemPrompt('');
      setFirstMessage('');
      setManualKnowledge('');
      setExistingKbFiles([]);
      setUploadedFileUrls([]);
      setUploadedFiles([]);
      setSavedSections({ knowledge: false, examples: false, intents: false });
      try {
        const { agent } = await agentAPI.getAgentConfig(selectedAgent);
        // System prompt / instructions
        if (agent.custom_instructions) setSystemPrompt(agent.custom_instructions);
        else if (agent.template?.systemPrompt) setSystemPrompt(agent.template.systemPrompt);
        // First / greeting message
        if (agent.template?.firstMessage) setFirstMessage(agent.template.firstMessage);
        // Knowledge base files
        const kbFiles = agent.knowledge_base_file_urls;
        if (Array.isArray(kbFiles) && kbFiles.length > 0) setExistingKbFiles(kbFiles);
        // Website URLs
        const webUrls = agent.website_urls;
        if (Array.isArray(webUrls) && webUrls.length > 0) setUrls(webUrls);
        // Training data stored inside template
        const tpl = agent.template;
        if (tpl) {
          if (tpl.keyTalkingPoints) setKeyTalkingPoints(tpl.keyTalkingPoints);
          if (tpl.closingScript) setClosingScript(tpl.closingScript);
          if (Array.isArray(tpl.objections) && tpl.objections.length > 0) setObjections(tpl.objections);
          if (Array.isArray(tpl.conversationExamples) && tpl.conversationExamples.length > 0) setConversationExamples(tpl.conversationExamples);
        }
      } catch (err) {
        console.error('Failed to load agent config for training:', err);
      } finally {
        setIsLoadingAgentConfig(false);
      }
    };
    loadAgentConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgent]);

  const [isTraining, setIsTraining] = useState(false);
  const [activeTab, setActiveTab] = useState("knowledge");
  const [urls, setUrls] = useState<string[]>(["", ""]);
  const [objections, setObjections] = useState<
    { objection: string; response: string }[]
  >([{ objection: "", response: "" }]);
  const [intents, setIntents] = useState<
    { name: string; phrases: string; response: string }[]
  >([{ name: "", phrases: "", response: "" }]);

  // Conversation examples state
  const [conversationExamples, setConversationExamples] = useState<
    { customerInput: string; expectedResponse: string }[]
  >([{ customerInput: "", expectedResponse: "" }]);
  const [testMessage, setTestMessage] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isTestingResponse, setIsTestingResponse] = useState(false);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [testMetrics, setTestMetrics] = useState({
    accuracyScore: 0,
    responseTime: 0,
    confidenceLevel: 0,
    intentRecognition: 0,
    totalTests: 0,
  });
  const [savedSections, setSavedSections] = useState({
    knowledge: false,
    examples: false,
    intents: false,
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  // file upload state handled by isUploadingFiles

  // --- Real API state ---
  const [isLoadingAgentConfig, setIsLoadingAgentConfig] = useState(false);
  const [isSavingKnowledge, setIsSavingKnowledge] = useState(false);
  const [isSavingExamples, setIsSavingExamples] = useState(false);
  const [isSavingIntents, setIsSavingIntents] = useState(false);
  const [existingKbFiles, setExistingKbFiles] = useState<string[]>([]);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  // System prompt state
  const [systemPrompt, setSystemPrompt] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [manualKnowledge, setManualKnowledge] = useState("");
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [showGeneratedPrompt, setShowGeneratedPrompt] = useState(false);

  // First message AI generation state
  const [isGeneratingFirstMessage, setIsGeneratingFirstMessage] =
    useState(false);
  const [generatedFirstMessage, setGeneratedFirstMessage] = useState("");
  const [showGeneratedFirstMessage, setShowGeneratedFirstMessage] =
    useState(false);

  // Manual knowledge AI generation state
  const [isGeneratingKnowledge, setIsGeneratingKnowledge] = useState(false);
  const [generatedKnowledge, setGeneratedKnowledge] = useState("");
  const [showGeneratedKnowledge, setShowGeneratedKnowledge] = useState(false);

  // Call script state (opening script removed — first message used instead)
  const [keyTalkingPoints, setKeyTalkingPoints] = useState("");
  const [closingScript, setClosingScript] = useState("");

  // Call script AI generation state
  const [isGeneratingTalkingPoints, setIsGeneratingTalkingPoints] =
    useState(false);
  const [generatedTalkingPoints, setGeneratedTalkingPoints] = useState("");
  const [showGeneratedTalkingPoints, setShowGeneratedTalkingPoints] =
    useState(false);

  const [isGeneratingClosingScript, setIsGeneratingClosingScript] =
    useState(false);
  const [generatedClosingScript, setGeneratedClosingScript] = useState("");
  const [showGeneratedClosingScript, setShowGeneratedClosingScript] =
    useState(false);

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

  const updateObjection = (
    index: number,
    field: "objection" | "response",
    value: string
  ) => {
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

  const updateIntent = (
    index: number,
    field: "name" | "phrases" | "response",
    value: string
  ) => {
    const newIntents = [...intents];
    newIntents[index][field] = value;
    setIntents(newIntents);
  };

  // Conversation example functions
  const addConversationExample = () => {
    setConversationExamples([
      ...conversationExamples,
      { customerInput: "", expectedResponse: "" },
    ]);
  };

  const removeConversationExample = (index: number) => {
    if (conversationExamples.length > 1) {
      setConversationExamples(
        conversationExamples.filter((_, i) => i !== index)
      );
    }
  };

  const updateConversationExample = (
    index: number,
    field: "customerInput" | "expectedResponse",
    value: string
  ) => {
    const newExamples = [...conversationExamples];
    newExamples[index][field] = value;
    setConversationExamples(newExamples);
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
      } else if (
        lowerMessage.includes("price") ||
        lowerMessage.includes("cost")
      ) {
        response =
          "Our pricing starts at $99/month for the basic plan. Would you like me to explain the different options available?";
      } else if (
        lowerMessage.includes("help") ||
        lowerMessage.includes("support")
      ) {
        response =
          "I'm here to help! Please tell me what specific assistance you need and I'll do my best to guide you.";
      } else if (
        lowerMessage.includes("book") ||
        lowerMessage.includes("schedule")
      ) {
        response =
          "I'd be happy to help you schedule an appointment. What date and time works best for you?";
      } else {
        response =
          "Thank you for your message. I understand you're asking about '" +
          testMessage +
          "'. Let me help you with that.";
      }

      setAiResponse(response);
      setIsTestingResponse(false);

      // Update metrics after each test
      setTestMetrics((prev) => {
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
          totalTests: newTotalTests,
        };
      });
    }, 1500);
  };

  const handleTestAudio = () => {
    if (!testMessage.trim()) return;

    setIsTestingAudio(true);

    // Generate a response first (similar to handleTestResponse)
    let response = "";
    const lowerMessage = testMessage.toLowerCase();

    if (lowerMessage.includes("hi") || lowerMessage.includes("hello")) {
      response = "Hello! I'm your AI assistant. How can I help you today?";
    } else if (
      lowerMessage.includes("price") ||
      lowerMessage.includes("cost")
    ) {
      response =
        "Our pricing starts at $99/month for the basic plan. Would you like me to explain the different options available?";
    } else if (
      lowerMessage.includes("help") ||
      lowerMessage.includes("support")
    ) {
      response =
        "I'm here to help! Please tell me what specific assistance you need and I'll do my best to guide you.";
    } else if (
      lowerMessage.includes("book") ||
      lowerMessage.includes("schedule")
    ) {
      response =
        "I'd be happy to help you schedule an appointment. What date and time works best for you?";
    } else {
      response =
        "Thank you for your message. I understand you're asking about '" +
        testMessage +
        "'. Let me help you with that.";
    }

    // Set the AI response
    setAiResponse(response);

    // Update metrics after each test
    setTestMetrics((prev) => {
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
        totalTests: newTotalTests,
      };
    });

    // Use Web Speech API for text-to-speech
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(response);

      // Configure voice settings
      utterance.rate = 1.0; // Normal speed
      utterance.pitch = 1.0; // Normal pitch
      utterance.volume = 1.0; // Full volume

      // Try to find a professional female voice - more aggressive filtering
      const voices = speechSynthesis.getVoices();

      // First, filter out any voices that are clearly male
      const nonMaleVoices = voices.filter(
        (voice) =>
          !voice.name.toLowerCase().includes("male") &&
          !voice.name.toLowerCase().includes("man") &&
          !voice.name.toLowerCase().includes("guy") &&
          !voice.name.toLowerCase().includes("boy") &&
          !voice.name.toLowerCase().includes("david") &&
          !voice.name.toLowerCase().includes("alex") &&
          !voice.name.toLowerCase().includes("tom") &&
          !voice.name.toLowerCase().includes("john") &&
          !voice.name.toLowerCase().includes("mark") &&
          !voice.name.toLowerCase().includes("daniel") &&
          !voice.name.toLowerCase().includes("fred") &&
          !voice.name.toLowerCase().includes("jorge")
      );

      // Then look for explicitly female voices
      const femaleVoice =
        nonMaleVoices.find(
          (voice) =>
            voice.name.toLowerCase().includes("female") ||
            voice.name.toLowerCase().includes("sarah") ||
            voice.name.toLowerCase().includes("samantha") ||
            voice.name.toLowerCase().includes("karen") ||
            voice.name.toLowerCase().includes("susan") ||
            voice.name.toLowerCase().includes("anna") ||
            voice.name.toLowerCase().includes("emma") ||
            voice.name.toLowerCase().includes("zira") ||
            voice.name.toLowerCase().includes("hazel") ||
            voice.name.toLowerCase().includes("fiona") ||
            voice.name.toLowerCase().includes("kate") ||
            voice.name.toLowerCase().includes("victoria") ||
            voice.name.toLowerCase().includes("allison") ||
            voice.name.toLowerCase().includes("ava") ||
            voice.name.toLowerCase().includes("serena") ||
            voice.name.toLowerCase().includes("tessa")
        ) ||
        nonMaleVoices.find((voice) => voice.lang.startsWith("en-US")) ||
        nonMaleVoices.find((voice) => voice.lang.startsWith("en")) ||
        nonMaleVoices[0] ||
        voices[0];

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
        console.error("Speech synthesis error");
      };

      speechSynthesis.speak(utterance);
    } else {
      // Fallback: simulate audio test
      setTimeout(() => {
        setIsTestingAudio(false);
        alert(
          "Audio test completed! (Speech synthesis not supported in this browser)"
        );
      }, 3000);
    }
  };

  const handleKnowledgeBaseUpload = useCallback(async (files: File[]) => {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/csv",
    ];
    const maxSize = 10 * 1024 * 1024;
    const validFiles = files.filter((file) => {
      if (!validTypes.includes(file.type)) {
        appToast.error(`${file.name} is not a supported file type`);
        return false;
      }
      if (file.size > maxSize) {
        appToast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });
    if (validFiles.length === 0) return;
    setIsUploadingFiles(true);
    setUploadedFiles((prev) => [...prev, ...validFiles]);
    try {
      const response = await agentAPI.uploadKnowledgeBase(validFiles);
      const urls: string[] = (response?.data?.files ?? []).map((f: { url: string }) => f.url);
      if (urls.length > 0) {
        setUploadedFileUrls((prev) => [...prev, ...urls]);
        appToast.success(`${validFiles.length} file(s) uploaded successfully!`);
      } else {
        appToast.error("Upload failed: no URLs returned.");
        setUploadedFiles((prev) => prev.filter((f) => !validFiles.includes(f)));
      }
    } catch {
      appToast.error("Failed to upload files.");
      setUploadedFiles((prev) => prev.filter((f) => !validFiles.includes(f)));
    } finally {
      setIsUploadingFiles(false);
    }
  }, []);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleKnowledgeBaseUpload(Array.from(files));
    }
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadedFileUrls((prev) => prev.filter((_, i) => i !== index));
    appToast.success("File removed");
  };

  const removeExistingKbFile = useCallback(async (fileUrl: string) => {
    setExistingKbFiles((prev) => prev.filter((u) => u !== fileUrl));
  }, []);

  // AI-assisted prompt generation using API
  const generateAIPrompt = async () => {
    setIsGeneratingPrompt(true);
    setShowGeneratedPrompt(false);
    console.log(selectedAgentData);

    try {
      const agentName = selectedAgentData?.name || "AI Assistant";
      const userInput = systemPrompt.trim();

      // Gather agent details for context
      const agentDetails = {
        name: agentName,
        gender: selectedAgentData?.gender || "not specified",
        voice: selectedAgentData?.voice || "not specified",
        personality:
          selectedAgentData?.personality ||
          selectedAgentData?.persona ||
          "professional",
        language: selectedAgentData?.language || "English",
        template:
          selectedAgentData?.template ||
          selectedAgentData?.agentType ||
          "general",
        industry: selectedAgentData?.industry || "not specified",
        useCase:
          selectedAgentData?.useCase ||
          selectedAgentData?.use_case ||
          "customer support",
      };

      const promptSuffix =
        " Ensure the prompt is clear, concise, short and professional.";

      // Build detailed context for AI
      const agentContext = `
Agent Details:
- Name: ${agentDetails.name}
- Gender: ${agentDetails.gender}
- Voice Style: ${agentDetails.voice}
- Personality: ${agentDetails.personality}
- Language: ${agentDetails.language}
- Template/Type: ${agentDetails.template}
- Industry: ${agentDetails.industry}
- Use Case: ${agentDetails.useCase}
`.trim();

      // Build the prompt to send to the API
      const promptText = userInput
        ? `Enhance and improve this system prompt for an AI assistant with the following details:

${agentContext}

Current prompt to enhance: ${userInput}

${promptSuffix}`
        : `Generate a professional system prompt for an AI assistant with the following details:

${agentContext}

The agent should handle customer inquiries professionally and efficiently based on its personality, voice style, and use case.

${promptSuffix}`;

      // Call the generate prompt API
      const response = await agentAPI.generatePrompt(promptText);

      // Extract generated text from response.data.generation.response
      const generated =
        response?.data?.generation?.response ||
        response?.generation?.response ||
        response?.response;

      if (generated && typeof generated === "string") {
        setGeneratedPrompt(generated);
        setShowGeneratedPrompt(true);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Failed to generate prompt:", error);
      appToast.error("Failed to generate prompt. Please try again.");
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const applyGeneratedPrompt = () => {
    setSystemPrompt(generatedPrompt);
    setShowGeneratedPrompt(false);
    setGeneratedPrompt("");
    appToast.success("Prompt applied successfully!");
  };

  const cancelGeneratedPrompt = () => {
    setShowGeneratedPrompt(false);
    setGeneratedPrompt("");
  };

  // AI-assisted first message generation
  const generateAIFirstMessage = async () => {
    setIsGeneratingFirstMessage(true);
    setShowGeneratedFirstMessage(false);

    try {
      const agentName = selectedAgentData?.name || "AI Assistant";
      const userInput = firstMessage.trim();

      const agentDetails = {
        name: agentName,
        gender: selectedAgentData?.gender || "not specified",
        voice: selectedAgentData?.voice || "not specified",
        personality:
          selectedAgentData?.personality ||
          selectedAgentData?.persona ||
          "professional",
        language: selectedAgentData?.language || "English",
        template:
          selectedAgentData?.template ||
          selectedAgentData?.agentType ||
          "general",
        industry: selectedAgentData?.industry || "not specified",
        useCase:
          selectedAgentData?.useCase ||
          selectedAgentData?.use_case ||
          "customer support",
      };

      const agentContext = `
Agent Details:
- Name: ${agentDetails.name}
- Gender: ${agentDetails.gender}
- Voice Style: ${agentDetails.voice}
- Personality: ${agentDetails.personality}
- Language: ${agentDetails.language}
- Template/Type: ${agentDetails.template}
- Industry: ${agentDetails.industry}
- Use Case: ${agentDetails.useCase}
`.trim();

      const promptText = userInput
        ? `Enhance and improve this greeting/first message for an AI assistant:\n\n${agentContext}\n\nCurrent greeting to enhance: ${userInput}\n\nGenerate a warm, professional greeting that matches the agent's personality and use case. Keep it concise (1-2 sentences).`
        : `Generate a professional greeting/first message for an AI assistant:\n\n${agentContext}\n\nCreate a warm, welcoming greeting that the agent will use to start conversations. Keep it concise (1-2 sentences) and match the agent's personality.`;

      const response = await agentAPI.generatePrompt(promptText);
      const generated =
        response?.data?.generation?.response ||
        response?.generation?.response ||
        response?.response;

      if (generated && typeof generated === "string") {
        setGeneratedFirstMessage(generated);
        setShowGeneratedFirstMessage(true);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Failed to generate first message:", error);
      appToast.error("Failed to generate first message. Please try again.");
    } finally {
      setIsGeneratingFirstMessage(false);
    }
  };

  const applyGeneratedFirstMessage = () => {
    setFirstMessage(generatedFirstMessage);
    setShowGeneratedFirstMessage(false);
    setGeneratedFirstMessage("");
    appToast.success("First message applied successfully!");
  };

  const cancelGeneratedFirstMessage = () => {
    setShowGeneratedFirstMessage(false);
    setGeneratedFirstMessage("");
  };

  // AI-assisted manual knowledge generation
  const generateAIKnowledge = async () => {
    setIsGeneratingKnowledge(true);
    setShowGeneratedKnowledge(false);

    try {
      const agentName = selectedAgentData?.name || "AI Assistant";
      const userInput = manualKnowledge.trim();

      const agentDetails = {
        name: agentName,
        gender: selectedAgentData?.gender || "not specified",
        voice: selectedAgentData?.voice || "not specified",
        personality:
          selectedAgentData?.personality ||
          selectedAgentData?.persona ||
          "professional",
        language: selectedAgentData?.language || "English",
        template:
          selectedAgentData?.template ||
          selectedAgentData?.agentType ||
          "general",
        industry: selectedAgentData?.industry || "not specified",
        useCase:
          selectedAgentData?.useCase ||
          selectedAgentData?.use_case ||
          "customer support",
      };

      const agentContext = `
Agent Details:
- Name: ${agentDetails.name}
- Gender: ${agentDetails.gender}
- Personality: ${agentDetails.personality}
- Language: ${agentDetails.language}
- Template/Type: ${agentDetails.template}
- Industry: ${agentDetails.industry}
- Use Case: ${agentDetails.useCase}
`.trim();

      const promptText = userInput
        ? `Enhance and expand this knowledge base content for an AI assistant:\n\n${agentContext}\n\nCurrent knowledge to enhance:\n${userInput}\n\nImprove and expand this content with relevant FAQs, policies, and product information that would be useful for the agent's use case. Format it clearly with sections.`
        : `Generate sample knowledge base content for an AI assistant:\n\n${agentContext}\n\nCreate helpful FAQs, policies, and product information relevant to this agent's industry and use case. Format it clearly with sections and bullet points.`;

      const response = await agentAPI.generatePrompt(promptText);
      const generated =
        response?.data?.generation?.response ||
        response?.generation?.response ||
        response?.response;

      if (generated && typeof generated === "string") {
        setGeneratedKnowledge(generated);
        setShowGeneratedKnowledge(true);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Failed to generate knowledge:", error);
      appToast.error("Failed to generate knowledge. Please try again.");
    } finally {
      setIsGeneratingKnowledge(false);
    }
  };

  const applyGeneratedKnowledge = () => {
    setManualKnowledge(generatedKnowledge);
    setShowGeneratedKnowledge(false);
    setGeneratedKnowledge("");
    appToast.success("Knowledge applied successfully!");
  };

  const cancelGeneratedKnowledge = () => {
    setShowGeneratedKnowledge(false);
    setGeneratedKnowledge("");
  };

  // AI-assisted key talking points generation
  const generateAITalkingPoints = async () => {
    setIsGeneratingTalkingPoints(true);
    setShowGeneratedTalkingPoints(false);

    try {
      const agentName = selectedAgentData?.name || "AI Assistant";
      const userInput = keyTalkingPoints.trim();
      const promptSuffix =
        " Format the response as clear,short, concise bullet points,sorted by importance.";

      const agentDetails = {
        name: agentName,
        gender: selectedAgentData?.gender || "not specified",
        personality:
          selectedAgentData?.personality ||
          selectedAgentData?.persona ||
          "professional",
        language: selectedAgentData?.language || "English",
        template:
          selectedAgentData?.template ||
          selectedAgentData?.agentType ||
          "general",
        industry: selectedAgentData?.industry || "not specified",
        useCase:
          selectedAgentData?.useCase ||
          selectedAgentData?.use_case ||
          "customer support",
      };

      const agentContext = `Agent: ${agentDetails.name}, ${agentDetails.personality} personality, ${agentDetails.industry} industry, ${agentDetails.useCase} use case.`;

      const promptText = userInput
        ? `Improve these key talking points for ${agentContext}:\n\n${userInput}\n\nEnhance with clear, persuasive bullet points covering benefits, features, and value propositions.${promptSuffix}`
        : `Generate key talking points for ${agentContext}\n\nCreate 5-7 bullet points covering product benefits, pricing highlights, common objection handling, and call to action. Format as bullet points.${promptSuffix}  `;

      const response = await agentAPI.generatePrompt(promptText);
      const generated =
        response?.data?.generation?.response ||
        response?.generation?.response ||
        response?.response;

      if (generated && typeof generated === "string") {
        setGeneratedTalkingPoints(generated);
        setShowGeneratedTalkingPoints(true);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Failed to generate talking points:", error);
      appToast.error("Failed to generate talking points. Please try again.");
    } finally {
      setIsGeneratingTalkingPoints(false);
    }
  };

  const applyGeneratedTalkingPoints = () => {
    setKeyTalkingPoints(generatedTalkingPoints);
    setShowGeneratedTalkingPoints(false);
    setGeneratedTalkingPoints("");
    appToast.success("Talking points applied!");
  };

  const cancelGeneratedTalkingPoints = () => {
    setShowGeneratedTalkingPoints(false);
    setGeneratedTalkingPoints("");
  };

  // AI-assisted closing script generation
  const generateAIClosingScript = async () => {
    setIsGeneratingClosingScript(true);
    setShowGeneratedClosingScript(false);

    try {
      const agentName = selectedAgentData?.name || "AI Assistant";
      const userInput = closingScript.trim();

      const agentDetails = {
        name: agentName,
        gender: selectedAgentData?.gender || "not specified",
        personality:
          selectedAgentData?.personality ||
          selectedAgentData?.persona ||
          "professional",
        language: selectedAgentData?.language || "English",
        template:
          selectedAgentData?.template ||
          selectedAgentData?.agentType ||
          "general",
        industry: selectedAgentData?.industry || "not specified",
        useCase:
          selectedAgentData?.useCase ||
          selectedAgentData?.use_case ||
          "customer support",
      };

      const agentContext = `Agent: ${agentDetails.name}, ${agentDetails.personality} personality, ${agentDetails.industry} industry, ${agentDetails.useCase} use case.`;

      const promptText = userInput
        ? `Improve this closing script for ${agentContext}:\n\n${userInput}\n\nMake it professional, courteous, and include a clear next step or call to action. Keep it concise.`
        : `Generate a closing script for ${agentContext}\n\nCreate a professional closing that thanks the customer, summarizes next steps, and leaves a positive impression. Keep it concise (2-3 sentences).`;

      const response = await agentAPI.generatePrompt(promptText);
      const generated =
        response?.data?.generation?.response ||
        response?.generation?.response ||
        response?.response;

      if (generated && typeof generated === "string") {
        setGeneratedClosingScript(generated);
        setShowGeneratedClosingScript(true);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Failed to generate closing script:", error);
      appToast.error("Failed to generate closing script. Please try again.");
    } finally {
      setIsGeneratingClosingScript(false);
    }
  };

  const applyGeneratedClosingScript = () => {
    setClosingScript(generatedClosingScript);
    setShowGeneratedClosingScript(false);
    setGeneratedClosingScript("");
    appToast.success("Closing script applied!");
  };

  const selectedAgentData = localAgents.find(
    (agent) => agent.id === selectedAgent
  );

  const cancelGeneratedClosingScript = () => {
    setShowGeneratedClosingScript(false);
    setGeneratedClosingScript("");
  };

  const saveKnowledgeBase = async () => {
    if (!selectedAgent) return;
    setIsSavingKnowledge(true);
    try {
      const allKbUrls = [...new Set([...existingKbFiles, ...uploadedFileUrls])];
      const baseTemplate = selectedAgentData?.template || { name: "", description: "", icon: "", features: [] };
      await agentAPI.updateAgent(selectedAgent, {
        custom_instructions: systemPrompt,
        knowledge_base_file_urls: allKbUrls,
        website_urls: urls.filter((u) => u.trim()),
        template: { ...baseTemplate, systemPrompt, firstMessage },
      } as any);
      setSavedSections((prev) => ({ ...prev, knowledge: true }));
      appToast.success("Knowledge base saved successfully!");
    } catch {
      appToast.error("Failed to save knowledge base.");
    } finally {
      setIsSavingKnowledge(false);
    }
  };

  const saveTrainingExamples = async () => {
    if (!selectedAgent) return;
    setIsSavingExamples(true);
    try {
      const baseTemplate = selectedAgentData?.template || { name: "", description: "", icon: "", features: [] };
      await agentAPI.updateAgent(selectedAgent, {
        template: {
          ...baseTemplate,
          systemPrompt,
          firstMessage,
          keyTalkingPoints,
          closingScript,
          objections,
          conversationExamples,
        },
      } as any);
      setSavedSections((prev) => ({ ...prev, examples: true }));
      appToast.success("Training examples saved successfully!");
    } catch {
      appToast.error("Failed to save training examples.");
    } finally {
      setIsSavingExamples(false);
    }
  };

  const saveIntentTraining = async () => {
    if (!selectedAgent) return;
    setIsSavingIntents(true);
    try {
      const baseTemplate = selectedAgentData?.template || { name: "", description: "", icon: "", features: [] };
      await agentAPI.updateAgent(selectedAgent, {
        template: {
          ...baseTemplate,
          systemPrompt,
          firstMessage,
          intents,
        },
      } as any);
      setSavedSections((prev) => ({ ...prev, intents: true }));
      appToast.success("Intent training saved!");
    } catch {
      appToast.error("Failed to save behavior settings.");
    } finally {
      setIsSavingIntents(false);
    }
  };

  const canStartTraining = () => {
    return (
      savedSections.knowledge && savedSections.examples && savedSections.intents
    );
  };

  const trainingTabs = [
    { id: "knowledge", label: "Knowledge Base", icon: Database },
    { id: "examples", label: "Training Examples", icon: MessageSquare },
    { id: "intents", label: "Intent Training", icon: Target },
    { id: "testing", label: "Testing & Validation", icon: CheckCircle },
  ];

  const knowledgeStats = [
        { label: "Documents", value: `${existingKbFiles.length + uploadedFiles.length}`, icon: FileText, color: "blue" },
        { label: "FAQ Items", value: "—", icon: Lightbulb, color: "green" },
        {
          label: "Training Examples",
          value: `${conversationExamples.length}`,
          icon: MessageSquare,
          color: "purple",
        },
        {
          label: "Intents Trained",
          value: `${intents.length}`,
          icon: Target,
          color: "orange",
        },
      ];

  const trainingMetrics = [
        {
          label: "Accuracy Score",
          value: `${testMetrics.accuracyScore}%`,
          change:
            testMetrics.totalTests > 0
              ? `+${(Math.random() * 3 + 0.5).toFixed(1)}%`
              : "No data",
          trend: "up",
        },
        {
          label: "Response Time",
          value: `${testMetrics.responseTime}s`,
          change:
            testMetrics.totalTests > 0
              ? `-${(Math.random() * 0.5 + 0.1).toFixed(1)}s`
              : "No data",
          trend: "down",
        },
        {
          label: "Confidence Level",
          value: `${testMetrics.confidenceLevel}%`,
          change:
            testMetrics.totalTests > 0
              ? `+${(Math.random() * 5 + 1).toFixed(1)}%`
              : "No data",
          trend: "up",
        },
        {
          label: "Intent Recognition",
          value: `${testMetrics.intentRecognition}%`,
          change:
            testMetrics.totalTests > 0
              ? `+${(Math.random() * 2 + 0.5).toFixed(1)}%`
              : "No data",
          trend: "up",
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
            {isLoadingAgentConfig ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-3 text-slate-600 dark:text-slate-400">Loading agent...</span>
              </div>
            ) : localAgents.length === 0 ? (
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
                  className="common-button-bg"
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
                        {localAgents.map((agent) => (
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
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-medium capitalize">
                        {selectedAgentData.gender || "N/A"}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="truncate capitalize">
                        {selectedAgentData.personality ||
                          selectedAgentData.persona ||
                          "N/A"}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="truncate capitalize">
                        {selectedAgentData.voice || "N/A"}
                      </span>
                    </div>
                    <span
                      className={`inline-flex w-fit px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                        selectedAgentData.status === "Published"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : selectedAgentData.status === "Pending"
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
                      {localAgents.map((agent) => (
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
                            📄 Upload Knowledge Documents
                            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                              (PDF, DOC, TXT, CSV)
                            </span>
                          </label>
                          {/* Existing KB Files from saved agent */}
                          {existingKbFiles.length > 0 && (
                            <div className="mb-4 space-y-2">
                              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Saved Knowledge Files ({existingKbFiles.length})
                              </h4>
                              {existingKbFiles.map((fileUrl, index) => {
                                const filename = fileUrl.split("/").pop()?.split("?")[0] || fileUrl;
                                const cleanName = filename.replace(/^\d+-/, "");
                                const ext = cleanName.split(".").pop()?.toLowerCase() || "";
                                const isImage = ["jpg","jpeg","png","gif","webp","svg"].includes(ext);
                                return (
                                  <div
                                    key={fileUrl}
                                    className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {isImage ? (
                                          <Image className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                                        ) : (
                                          <File className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 truncate max-w-[200px]" title={cleanName}>
                                          {index === 0 ? "📚 " : ""}{cleanName}
                                        </p>
                                        {index === 0 && (
                                          <p className="text-xs text-blue-500 dark:text-blue-400">Main Knowledge Base</p>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => removeExistingKbFile(fileUrl)}
                                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 flex-shrink-0"
                                      title="Remove file"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Upload Zone */}
                          <div className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl text-center hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                            <input
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx,.txt,.csv"
                              onChange={handleFileInputChange}
                              className="hidden"
                              id="training-kb-file-input"
                              disabled={isUploadingFiles}
                            />
                            <label
                              htmlFor={isUploadingFiles ? undefined : "training-kb-file-input"}
                              className="block p-4 sm:p-6 cursor-pointer"
                            >
                              <div className="flex flex-col items-center">
                                {isUploadingFiles ? (
                                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                                ) : (
                                  <Upload className="w-8 h-8 text-slate-400 mb-3" />
                                )}
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                  {isUploadingFiles ? "Uploading..." : "Drop files here or tap to browse"}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-500 mb-4">
                                  Max 10MB each • PDF, DOC, TXT, CSV
                                </p>
                                <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium transition-all ${isUploadingFiles ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
                                  {isUploadingFiles ? "Uploading..." : "Browse Files"}
                                </span>
                              </div>
                            </label>
                          </div>

                          {/* Newly Uploaded Files (pending save) */}
                          {uploadedFiles.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                New Files (pending save) ({uploadedFiles.length})
                              </h4>
                              {uploadedFiles.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                                >
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
                                    <X className="w-4 h-4" />
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

                          {/* Textarea with AI Assist button inside */}
                          <div className="relative">
                            <textarea
                              value={systemPrompt}
                              onChange={(e) => setSystemPrompt(e.target.value)}
                              placeholder="Define your agent's role, personality, and core instructions. E.g., 'You are a friendly sales assistant for ShivAI. Your goal is to help customers understand our AI calling platform...'"
                              rows={5}
                              className="common-bg-icons w-full px-4 py-3 pb-12 rounded-xl resize-none text-sm sm:text-base border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                            {/* AI Assist button inside textarea */}
                            <button
                              onClick={generateAIPrompt}
                              disabled={isGeneratingPrompt}
                              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-medium rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isGeneratingPrompt ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Generating...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>AI Assist</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Generated Prompt Preview */}
                          {showGeneratedPrompt && generatedPrompt && (
                            <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-xl">
                              <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-purple-500" />
                                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                  AI Generated Prompt
                                </span>
                              </div>
                              <div className="bg-white dark:bg-slate-800 rounded-lg mb-3">
                                <textarea
                                  value={generatedPrompt}
                                  onChange={(e) => setGeneratedPrompt(e.target.value)}
                                  className="w-full h-48 p-3 text-sm text-slate-700 dark:text-slate-300 bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 rounded-lg"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={applyGeneratedPrompt}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-sm font-medium rounded-lg transition-all"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Add
                                </button>
                                <button
                                  onClick={cancelGeneratedPrompt}
                                  className="px-4 py-2 common-bg-icons text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:shadow-sm transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            This defines how your agent behaves and responds in
                            all conversations
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
                          <div className="relative">
                            <textarea
                              value={firstMessage}
                              onChange={(e) => setFirstMessage(e.target.value)}
                              placeholder="Hi! This is Sarah from ShivAI. How can I help you today?"
                              rows={3}
                              className="common-bg-icons w-full px-4 py-3 pb-12 rounded-xl resize-none text-sm sm:text-base border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                            <button
                              onClick={generateAIFirstMessage}
                              disabled={isGeneratingFirstMessage}
                              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-medium rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isGeneratingFirstMessage ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Generating...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>AI Assist</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Generated First Message Preview */}
                          {showGeneratedFirstMessage &&
                            generatedFirstMessage && (
                              <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-xl">
                                <div className="flex items-center gap-2 mb-3">
                                  <Sparkles className="w-4 h-4 text-purple-500" />
                                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                    AI Generated Greeting
                                  </span>
                                </div>
                                <div className="bg-white dark:bg-slate-800 rounded-lg mb-3">
                                  <textarea
                                    value={generatedFirstMessage}
                                    onChange={(e) => setGeneratedFirstMessage(e.target.value)}
                                    className="w-full h-32 p-3 text-sm text-slate-700 dark:text-slate-300 bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 rounded-lg"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={applyGeneratedFirstMessage}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-sm font-medium rounded-lg transition-all"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Add
                                  </button>
                                  <button
                                    onClick={cancelGeneratedFirstMessage}
                                    className="px-4 py-2 common-bg-icons text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:shadow-sm transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            The opening message when a call starts or customer
                            initiates chat
                          </p>
                        </div>

                        {/* Mobile-Optimized File Upload */}

                        {/* URL-based Knowledge */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            🌐 Website URLs
                            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                              (Add websites to learn from)
                            </span>
                          </label>
                          <div className="space-y-3">
                            {/* URL Input List */}
                            <div className="space-y-2">
                              {urls.map((url, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <input
                                    type="url"
                                    value={url}
                                    onChange={(e) =>
                                      updateUrl(index, e.target.value)
                                    }
                                    placeholder={`https://example${
                                      index + 1
                                    }.com/${index === 0 ? "help" : "faq"}`}
                                    className="common-bg-icons flex-1 min-w-0 px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                  />
                                  {urls.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeUrl(index)}
                                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
                                      title="Remove"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={addUrl}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                            >
                              + Add URL
                            </button>
                          </div>
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Agent learns from public web content
                          </p>
                        </div>

                        {/* Manual Knowledge Entry */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            ✍️ Manual Knowledge
                            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                              (FAQs, policies, product info)
                            </span>
                          </label>
                          <div className="relative">
                            <textarea
                              value={manualKnowledge}
                              onChange={(e) =>
                                setManualKnowledge(e.target.value)
                              }
                              placeholder="Enter knowledge, FAQs, policies, or any information your agent should know..."
                              rows={5}
                              className="common-bg-icons w-full px-3 py-2 pb-12 rounded-lg text-sm border border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                            />
                            <button
                              onClick={generateAIKnowledge}
                              disabled={isGeneratingKnowledge}
                              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-medium rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isGeneratingKnowledge ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Generating...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>AI Assist</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Generated Knowledge Preview */}
                          {showGeneratedKnowledge && generatedKnowledge && (
                            <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-xl">
                              <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-purple-500" />
                                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                  AI Generated Knowledge
                                </span>
                              </div>
                              <div className="bg-white dark:bg-slate-800 rounded-lg mb-3">
                                <textarea
                                  value={generatedKnowledge}
                                  onChange={(e) => setGeneratedKnowledge(e.target.value)}
                                  className="w-full h-48 p-3 text-sm text-slate-700 dark:text-slate-300 bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 rounded-lg"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={applyGeneratedKnowledge}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-sm font-medium rounded-lg transition-all"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Add
                                </button>
                                <button
                                  onClick={cancelGeneratedKnowledge}
                                  className="px-4 py-2 common-bg-icons text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:shadow-sm transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-xs text-slate-500">
                              Detailed, relevant information works best
                            </span>
                          </div>
                        </div>

                        {/* Save Knowledge Base Button */}
                        <div className="flex justify-end">
                          <button
                            onClick={saveKnowledgeBase}
                            disabled={isSavingKnowledge || isUploadingFiles}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              savedSections.knowledge && !isSavingKnowledge
                                ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                                : "common-button-bg"
                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                          >
                            {isSavingKnowledge ? (
                              <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                            ) : savedSections.knowledge ? (
                              <>✓ Saved</>
                            ) : (
                              <><Save className="w-3 h-3" /> Save Knowledge</>
                            )}
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
                            Call Script & Talking Points
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            The agent's first message is set in the Knowledge Base tab. Here define key talking points and closing.
                          </p>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                Key Talking Points:
                              </label>
                              <div className="relative">
                                <textarea
                                  value={keyTalkingPoints}
                                  onChange={(e) =>
                                    setKeyTalkingPoints(e.target.value)
                                  }
                                  placeholder="• Product benefits&#10;• Pricing details&#10;• Common objection handling&#10;• Call to action"
                                  rows={4}
                                  className="common-bg-icons w-full px-4 py-3 pb-12 rounded-lg text-sm sm:text-base resize-none"
                                />
                                <button
                                  onClick={generateAITalkingPoints}
                                  disabled={isGeneratingTalkingPoints}
                                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-medium rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isGeneratingTalkingPoints ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>Generating...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>AI Assist</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              {showGeneratedTalkingPoints &&
                                generatedTalkingPoints && (
                                  <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-xl">
                                    <div className="flex items-center gap-2 mb-3">
                                      <Sparkles className="w-4 h-4 text-purple-500" />
                                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                        AI Generated Talking Points
                                      </span>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 rounded-lg mb-3">
                                      <textarea
                                        value={generatedTalkingPoints}
                                        onChange={(e) => setGeneratedTalkingPoints(e.target.value)}
                                        className="w-full h-40 p-3 text-sm text-slate-700 dark:text-slate-300 bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 rounded-lg"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={applyGeneratedTalkingPoints}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-sm font-medium rounded-lg transition-all"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                        Add
                                      </button>
                                      <button
                                        onClick={cancelGeneratedTalkingPoints}
                                        className="px-4 py-2 common-bg-icons text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:shadow-sm transition-all"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                Closing Script:
                              </label>
                              <div className="relative">
                                <textarea
                                  value={closingScript}
                                  onChange={(e) =>
                                    setClosingScript(e.target.value)
                                  }
                                  placeholder="Thank you for your time. I'll send you the information we discussed. Is there anything else I can help you with?"
                                  rows={3}
                                  className="common-bg-icons w-full px-4 py-3 pb-12 rounded-lg text-sm sm:text-base resize-none"
                                />
                                <button
                                  onClick={generateAIClosingScript}
                                  disabled={isGeneratingClosingScript}
                                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-medium rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isGeneratingClosingScript ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>Generating...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>AI Assist</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              {showGeneratedClosingScript &&
                                generatedClosingScript && (
                                  <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-xl">
                                    <div className="flex items-center gap-2 mb-3">
                                      <Sparkles className="w-4 h-4 text-purple-500" />
                                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                        AI Generated Closing
                                      </span>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 rounded-lg mb-3">
                                      <textarea
                                        value={generatedClosingScript}
                                        onChange={(e) => setGeneratedClosingScript(e.target.value)}
                                        className="w-full h-32 p-3 text-sm text-slate-700 dark:text-slate-300 bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 rounded-lg"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={applyGeneratedClosingScript}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-sm font-medium rounded-lg transition-all"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                        Add
                                      </button>
                                      <button
                                        onClick={cancelGeneratedClosingScript}
                                        className="px-4 py-2 common-bg-icons text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:shadow-sm transition-all"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>

                        {/* Sample Conversations */}
                        <div className="common-bg-icons p-4 sm:p-5 rounded-xl">
                          <h4 className="font-medium text-slate-800 dark:text-white mb-2 sm:mb-3">
                            Sample Conversation Examples
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Provide example conversations to improve agent
                            responses
                          </p>
                          <div className="space-y-6">
                            {conversationExamples.map((example, index) => (
                              <div
                                key={index}
                                className="space-y-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg relative"
                              >
                                {conversationExamples.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeConversationExample(index)
                                    }
                                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-xs"
                                    title="Remove"
                                  >
                                    ✕
                                  </button>
                                )}
                                <div className="pr-8">
                                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Customer Input {index + 1}:
                                  </label>
                                  <input
                                    type="text"
                                    value={example.customerInput}
                                    onChange={(e) =>
                                      updateConversationExample(
                                        index,
                                        "customerInput",
                                        e.target.value
                                      )
                                    }
                                    placeholder="What the customer might say..."
                                    className="common-bg-icons w-full px-4 py-3 rounded-lg text-sm sm:text-base"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Expected Response:
                                  </label>
                                  <textarea
                                    value={example.expectedResponse}
                                    onChange={(e) =>
                                      updateConversationExample(
                                        index,
                                        "expectedResponse",
                                        e.target.value
                                      )
                                    }
                                    placeholder="How the agent should respond..."
                                    rows={3}
                                    className="common-bg-icons w-full px-4 py-3 rounded-lg text-sm sm:text-base resize-none"
                                  />
                                </div>
                              </div>
                            ))}
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={addConversationExample}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                              >
                                + Add More Example
                              </button>
                              <button
                                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                              >
                                <FileText className="w-3 h-3" />
                                Import CSV
                              </button>
                              <button
                                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                              >
                                <Zap className="w-3 h-3" />
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
                            Train your agent to handle common objections
                            professionally
                          </p>
                          <div className="space-y-6">
                            {objections.map((objection, index) => (
                              <div
                                key={index}
                                className="space-y-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg relative"
                              >
                                {objections.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeObjection(index)}
                                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-xs"
                                    title="Remove"
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
                                    onChange={(e) =>
                                      updateObjection(
                                        index,
                                        "objection",
                                        e.target.value
                                      )
                                    }
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
                                    onChange={(e) =>
                                      updateObjection(
                                        index,
                                        "response",
                                        e.target.value
                                      )
                                    }
                                    placeholder="How should the agent respond to this objection?"
                                    rows={3}
                                    className="common-bg-icons w-full px-4 py-3 rounded-lg text-sm sm:text-base resize-none"
                                  />
                                </div>
                              </div>
                            ))}
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={addObjection}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                              >
                                + Add Objection
                              </button>
                              <button
                                onClick={saveTrainingExamples}
                                disabled={isSavingExamples}
                                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 disabled:opacity-60"
                              >
                                Save Objections
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Save Training Examples Button */}
                      <div className="flex justify-end">
                        <button
                          onClick={saveTrainingExamples}
                          disabled={isSavingExamples}
                          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium disabled:opacity-60 disabled:cursor-not-allowed ${
                            savedSections.examples && !isSavingExamples
                              ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                              : "common-button-bg"
                          }`}
                        >
                          {isSavingExamples ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                          ) : savedSections.examples ? (
                            <>✓ Training Examples Saved</>
                          ) : (
                            <><Save className="w-4 h-4" /> Save Training Examples</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === "intents" && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">
                        Intent Training
                      </h3>

                      <div className="space-y-4">

                        {/* ── Intent Recognition ── */}
                        <div className="common-bg-icons p-4 sm:p-5 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="w-4 h-4 text-orange-500" />
                            <h4 className="font-medium text-slate-800 dark:text-white">Intent Recognition</h4>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Train the agent to recognize specific intents and respond with preset replies
                          </p>
                          <div className="space-y-6">
                            {intents.map((intent, index) => (
                              <div
                                key={index}
                                className="space-y-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg relative"
                              >
                                {intents.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeIntent(index)}
                                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    title="Remove"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <div className="pr-8">
                                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Intent Name {index + 1}:
                                  </label>
                                  <input
                                    type="text"
                                    value={intent.name}
                                    onChange={(e) => updateIntent(index, "name", e.target.value)}
                                    placeholder="e.g., pricing_inquiry, booking_request"
                                    className="common-bg-icons w-full px-4 py-3 rounded-lg text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Example Phrases (one per line):
                                  </label>
                                  <textarea
                                    value={intent.phrases}
                                    onChange={(e) => updateIntent(index, "phrases", e.target.value)}
                                    placeholder={"How much does it cost?\nWhat's your pricing?\nWhat are your rates?"}
                                    rows={3}
                                    className="common-bg-icons w-full px-4 py-3 rounded-lg text-sm resize-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Intent Response:
                                  </label>
                                  <textarea
                                    value={intent.response}
                                    onChange={(e) => updateIntent(index, "response", e.target.value)}
                                    placeholder="Our pricing starts at $99/month..."
                                    rows={2}
                                    className="common-bg-icons w-full px-4 py-3 rounded-lg text-sm resize-none"
                                  />
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={addIntent}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                            >
                              + Add Intent
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Save Intent Training Button */}
                      <div className="flex justify-end">
                        <button
                          onClick={saveIntentTraining}
                          disabled={isSavingIntents}
                          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium disabled:opacity-60 disabled:cursor-not-allowed ${
                            savedSections.intents && !isSavingIntents
                              ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                              : "common-button-bg"
                          }`}
                        >
                          {isSavingIntents ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                          ) : savedSections.intents ? (
                            <>✓ Intent Training Saved</>
                          ) : (
                            <><Save className="w-4 h-4" /> Save Intent Training</>
                          )}
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
                                disabled={
                                  !testMessage.trim() ||
                                  isTestingResponse
                                }
                                className={`w-full sm:w-auto touch-manipulation ${
                                  testMessage.trim() && !isTestingResponse
                                    ? "common-button-bg"
                                    : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50 px-6 py-3 rounded-lg"
                                }`}
                              >
                                {isTestingResponse
                                  ? "Testing..."
                                  : "Test Response"}
                              </button>
                              <button
                                onClick={handleTestAudio}
                                disabled={!testMessage.trim() || isTestingAudio}
                                className={`flex items-center gap-2 ${
                                  testMessage.trim() && !isTestingAudio
                                    ? "common-button-bg2"
                                    : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50 px-4 py-3 rounded-lg"
                                }`}
                              >
                                <Play className="w-4 h-4" />
                                {isTestingAudio
                                  ? "Playing..."
                                  : "Test Audio Response"}
                              </button>
                            </div>

                            {/* AI Response Display */}
                            {(aiResponse || isTestingResponse) && (
                              <div
                                className={`mt-4 p-4 border rounded-lg transition-all duration-300 ${
                                  isTestingAudio
                                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                    : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                                      isTestingAudio
                                        ? "bg-green-100 dark:bg-green-800 animate-pulse"
                                        : "bg-blue-100 dark:bg-blue-800"
                                    }`}
                                  >
                                    <Bot
                                      className={`w-4 h-4 ${
                                        isTestingAudio
                                          ? "text-green-600 dark:text-green-300"
                                          : "text-blue-600 dark:text-blue-300"
                                      }`}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p
                                        className={`text-sm font-medium ${
                                          isTestingAudio
                                            ? "text-green-800 dark:text-green-200"
                                            : "text-blue-800 dark:text-blue-200"
                                        }`}
                                      >
                                        AI Agent Response:
                                      </p>
                                      {isTestingAudio && (
                                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                          <div className="flex space-x-1">
                                            <div className="w-1 h-3 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></div>
                                            <div
                                              className="w-1 h-3 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"
                                              style={{ animationDelay: "0.1s" }}
                                            ></div>
                                            <div
                                              className="w-1 h-3 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"
                                              style={{ animationDelay: "0.2s" }}
                                            ></div>
                                          </div>
                                          <span className="text-xs font-medium">
                                            Speaking...
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    {isTestingResponse ? (
                                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                        <div className="animate-spin w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full"></div>
                                        <span className="text-sm">
                                          Generating response...
                                        </span>
                                      </div>
                                    ) : (
                                      <p
                                        className={`text-sm leading-relaxed ${
                                          isTestingAudio
                                            ? "text-green-700 dark:text-green-300"
                                            : "text-blue-700 dark:text-blue-300"
                                        }`}
                                      >
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
                                  <strong>Tests Completed:</strong>{" "}
                                  {testMetrics.totalTests} |
                                  <strong className="ml-2">
                                    Latest Accuracy:
                                  </strong>{" "}
                                  {testMetrics.accuracyScore}% |
                                  <strong className="ml-2">
                                    Response Time:
                                  </strong>{" "}
                                  {testMetrics.responseTime}s
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
                              <span className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                                ✓
                              </span>
                            ) : (
                              <span className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs">
                                ○
                              </span>
                            )}
                            <span>Knowledge Base saved</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {savedSections.examples ? (
                              <span className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                                ✓
                              </span>
                            ) : (
                              <span className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs">
                                ○
                              </span>
                            )}
                            <span>Training Examples saved</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {savedSections.intents ? (
                              <span className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                                ✓
                              </span>
                            ) : (
                              <span className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs">
                                ○
                              </span>
                            )}
                            <span>Intent Training saved</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
                        {canStartTraining()
                          ? "All requirements complete! Ready to train your agent."
                          : "Please save all training sections before starting training."}
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
                        {canStartTraining()
                          ? "Start Training"
                          : "Save All Sections First"}
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
