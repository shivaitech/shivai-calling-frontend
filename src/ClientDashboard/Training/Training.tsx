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
  ChevronUp,
  ArrowLeft,
  Bot,
  Sparkles,
  Loader2,
  Save,
  X,
  File,
  Image,
  Trash2,
  Plus,
  Edit2,
  AlertCircle,
  Volume2,
  Settings,
  BookOpen,
  Shield,
  PhoneOff,
} from "lucide-react";

// ─── AgentTraining types ────────────────────────────────────────────────────
interface ConversationExample {
  id: string;
  userMessage: string;
  agentResponse: string;
}

interface ObjectionHandling {
  id: string;
  objection: string;
  response: string;
}

interface DataField {
  id: string;
  name: string;
  type: "text" | "number" | "select";
  required: boolean;
  description: string;
}

interface PronunciationRule {
  id: string;
  word: string;
  phonetic: string;
}

interface TrainingBehavior {
  patience: number;
  creativity: number;
  maxTurns: number;
  confirmBeforeAction: boolean;
  rePromptOnSilence: boolean;
  collectName: boolean;
  collectEmail: boolean;
  endAfterGoal: boolean;
  sentimentDetection: boolean;
  bilingualFallback: boolean;
  logTranscripts: boolean;
}
// ────────────────────────────────────────────────────────────────────────────

const Training = () => {
  const { currentAgent } = useAgent();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  let { state } = location;

  const agentIdFromUrl = params.id;
  const [selectedAgent, setSelectedAgent] = useState(
    agentIdFromUrl || currentAgent?.id || ""
  );
  const [localAgents, setLocalAgents] = useState<any[]>([]);
  const [trainingProgress, setTrainingProgress] = useState(0);

  // ── Fetch agents ────────────────────────────────────────────────────────
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const fetchedAgents = await agentAPI.getAgents();
        setLocalAgents(fetchedAgents);
        if (fetchedAgents.length > 0 && !selectedAgent) {
          setSelectedAgent(fetchedAgents[0].id);
        }
      } catch (error) {
        appToast.error("Failed to load agents. Please refresh the page.");
      }
    };
    loadAgents();
  }, []);

  // ── Load agent config ───────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedAgent) return;
    const loadAgentConfig = async () => {
      setIsLoadingAgentConfig(true);
      // Clear all state variables to ensure fresh data
      setSystemPrompt("");
      setFirstMessage("");
      setManualKnowledge("");
      setExistingKbFiles([]);
      setUploadedFileUrls([]);
      setUploadedFiles([]);
      setUrls(["", ""]);
      setKeyTalkingPoints("");
      setClosingScript("");
      setPrimaryGoal("Help users discover venues and vendors, collect event requirements, and guide them to download or use the app.");
      setSuccessCriteria(["User agrees to try the app", "User provides event details"]);
      setConversationExamples([{ id: "1", userMessage: "", agentResponse: "" }]);
      setObjectionHandling([{ id: "1", objection: "", response: "" }]);
      setDataCollection([
        { id: "1", name: "event_type", type: "text", required: true, description: "Type of event (birthday, wedding, BBQ)" },
        { id: "2", name: "location", type: "text", required: true, description: "City or area for the event" },
      ]);
      setKeywords({
        triggerKeywords: ["book a venue", "plan a party", "find a vendor"],
        doNotSay: ["competitor", "cheap"],
        sensitiveTopics: ["pricing disputes", "legal complaints"],
      });
      setEscalation({
        triggerPhrases: ["speak to a human", "talk to someone", "manager"],
        escalationAction: "Transfer to live agent",
        callEndingConditions: "User says goodbye, thank you, or indicates they're done. End if user is unresponsive after 3 attempts.",
      });
      setPronunciation([{ id: "1", word: "", phonetic: "" }]);
      setBehaviorSettings({
        patience: 3,
        creativity: 0.7,
        maxTurns: 20,
        confirmBeforeAction: true,
        rePromptOnSilence: true,
        collectName: true,
        collectEmail: true,
        endAfterGoal: true,
        sentimentDetection: true,
        bilingualFallback: false,
        logTranscripts: true,
      });
      setSavedSections({ knowledge: false, examples: false, intents: false });
      try {
        const { agent } = await agentAPI.getAgentConfig(selectedAgent);
        if (agent.custom_instructions) setSystemPrompt(agent.custom_instructions);
        else if (agent.template?.systemPrompt) setSystemPrompt(agent.template.systemPrompt);
        if (agent.template?.firstMessage) setFirstMessage(agent.template.firstMessage);
        const kbFiles = agent.knowledge_base_file_urls;
        if (Array.isArray(kbFiles) && kbFiles.length > 0) setExistingKbFiles(kbFiles);
        const webUrls = agent.website_urls;
        if (Array.isArray(webUrls) && webUrls.length > 0) setUrls(webUrls);
        const tpl = agent.template;
        if (tpl) {
          if (tpl.keyTalkingPoints) setKeyTalkingPoints(tpl.keyTalkingPoints);
          if (tpl.closingScript) setClosingScript(tpl.closingScript);
          if (Array.isArray(tpl.objections) && tpl.objections.length > 0) setLegacyObjections(tpl.objections);
          if (Array.isArray(tpl.conversationExamples) && tpl.conversationExamples.length > 0) {
            setConversationExamples(
              tpl.conversationExamples.map((ex: any, i: number) => ({
                id: String(i),
                userMessage: ex.customerInput || "",
                agentResponse: ex.expectedResponse || "",
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to load agent config for training:", err);
      } finally {
        setIsLoadingAgentConfig(false);
      }
    };
    loadAgentConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgent]);

  // ── Tab state ────────────────────────────────────────────────────────────
  const [isTraining, setIsTraining] = useState(false);
  const [activeTab, setActiveTab] = useState("goal");

  // ── URLs ─────────────────────────────────────────────────────────────────
  const [urls, setUrls] = useState<string[]>(["", ""]);

  // ── Legacy objections (for saving) ───────────────────────────────────────
  const [legacyObjections, setLegacyObjections] = useState<
    { objection: string; response: string }[]
  >([{ objection: "", response: "" }]);

  // ── Intents ──────────────────────────────────────────────────────────────
  const [intents, setIntents] = useState<
    { name: string; phrases: string; response: string }[]
  >([{ name: "", phrases: "", response: "" }]);

  // ── Test panel ───────────────────────────────────────────────────────────
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

  // ── File upload ──────────────────────────────────────────────────────────
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isLoadingAgentConfig, setIsLoadingAgentConfig] = useState(false);
  const [isSavingKnowledge, setIsSavingKnowledge] = useState(false);
  const [isSavingExamples, setIsSavingExamples] = useState(false);
  const [isSavingIntents, setIsSavingIntents] = useState(false);
  const [existingKbFiles, setExistingKbFiles] = useState<string[]>([]);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  // ── System prompt / first message / knowledge ────────────────────────────
  const [systemPrompt, setSystemPrompt] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [manualKnowledge, setManualKnowledge] = useState("");
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [showGeneratedPrompt, setShowGeneratedPrompt] = useState(false);
  const [isGeneratingFirstMessage, setIsGeneratingFirstMessage] = useState(false);
  const [generatedFirstMessage, setGeneratedFirstMessage] = useState("");
  const [showGeneratedFirstMessage, setShowGeneratedFirstMessage] = useState(false);
  const [isGeneratingKnowledge, setIsGeneratingKnowledge] = useState(false);
  const [generatedKnowledge, setGeneratedKnowledge] = useState("");
  const [showGeneratedKnowledge, setShowGeneratedKnowledge] = useState(false);

  // ── Call script ──────────────────────────────────────────────────────────
  const [keyTalkingPoints, setKeyTalkingPoints] = useState("");
  const [closingScript, setClosingScript] = useState("");
  const [isGeneratingTalkingPoints, setIsGeneratingTalkingPoints] = useState(false);
  const [generatedTalkingPoints, setGeneratedTalkingPoints] = useState("");
  const [showGeneratedTalkingPoints, setShowGeneratedTalkingPoints] = useState(false);
  const [isGeneratingClosingScript, setIsGeneratingClosingScript] = useState(false);
  const [generatedClosingScript, setGeneratedClosingScript] = useState("");
  const [showGeneratedClosingScript, setShowGeneratedClosingScript] = useState(false);

  // ── AgentTraining new state ──────────────────────────────────────────────
  const [primaryGoal, setPrimaryGoal] = useState(
    "Help users discover venues and vendors, collect event requirements, and guide them to download or use the app."
  );
  const [successCriteria, setSuccessCriteria] = useState<string[]>([
    "User agrees to try the app",
    "User provides event details",
  ]);
  const [conversationExamples, setConversationExamples] = useState<ConversationExample[]>([
    { id: "1", userMessage: "", agentResponse: "" },
  ]);
  const [objectionHandling, setObjectionHandling] = useState<ObjectionHandling[]>([
    { id: "1", objection: "", response: "" },
  ]);
  const [dataCollection, setDataCollection] = useState<DataField[]>([
    { id: "1", name: "event_type", type: "text", required: true, description: "Type of event (birthday, wedding, BBQ)" },
    { id: "2", name: "location", type: "text", required: true, description: "City or area for the event" },
  ]);
  const [keywords, setKeywords] = useState({
    triggerKeywords: ["book a venue", "plan a party", "find a vendor"],
    doNotSay: ["competitor", "cheap"],
    sensitiveTopics: ["pricing disputes", "legal complaints"],
  });
  const [escalation, setEscalation] = useState({
    triggerPhrases: ["speak to a human", "talk to someone", "manager"],
    escalationAction: "Transfer to live agent",
    callEndingConditions:
      "User says goodbye, thank you, or indicates they're done. End if user is unresponsive after 3 attempts.",
  });
  const [pronunciation, setPronunciation] = useState<PronunciationRule[]>([
    { id: "1", word: "", phonetic: "" },
  ]);
  const [behaviorSettings, setBehaviorSettings] = useState<TrainingBehavior>({
    patience: 3,
    creativity: 0.7,
    maxTurns: 20,
    confirmBeforeAction: true,
    rePromptOnSilence: true,
    collectName: true,
    collectEmail: true,
    endAfterGoal: true,
    sentimentDetection: true,
    bilingualFallback: false,
    logTranscripts: true,
  });

  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // ── Expanded sections ────────────────────────────────────────────────────
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    goal: true,
    examples: true,
    objections: true,
    dataCollection: true,
    keywords: true,
    escalation: true,
    pronunciation: true,
    behavior: true,
    knowledgeFiles: true,
    systemPrompt: true,
    callScript: true,
    testPanel: true,
  });
  const toggleSection = (s: string) =>
    setExpandedSections((p) => ({ ...p, [s]: !p[s] }));

  // ── URL helpers ──────────────────────────────────────────────────────────
  const addUrl = () => setUrls([...urls, ""]);
  const removeUrl = (i: number) => urls.length > 1 && setUrls(urls.filter((_, idx) => idx !== i));
  const updateUrl = (i: number, v: string) => {
    const n = [...urls]; n[i] = v; setUrls(n);
  };

  // ── Intent helpers ───────────────────────────────────────────────────────
  const addIntent = () => setIntents([...intents, { name: "", phrases: "", response: "" }]);
  const removeIntent = (i: number) => intents.length > 1 && setIntents(intents.filter((_, idx) => idx !== i));
  const updateIntent = (i: number, f: "name" | "phrases" | "response", v: string) => {
    const n = [...intents]; n[i][f] = v; setIntents(n);
  };

  // ── Conversation example helpers ─────────────────────────────────────────
  const addExample = () =>
    setConversationExamples([...conversationExamples, { id: Date.now().toString(), userMessage: "", agentResponse: "" }]);
  const removeExample = (id: string) =>
    conversationExamples.length > 1 &&
    setConversationExamples(conversationExamples.filter((e) => e.id !== id));
  const updateExample = (id: string, f: "userMessage" | "agentResponse", v: string) =>
    setConversationExamples(conversationExamples.map((e) => (e.id === id ? { ...e, [f]: v } : e)));

  // ── Objection handling helpers ───────────────────────────────────────────
  const addObjection = () =>
    setObjectionHandling([...objectionHandling, { id: Date.now().toString(), objection: "", response: "" }]);
  const removeObjection = (id: string) =>
    objectionHandling.length > 1 &&
    setObjectionHandling(objectionHandling.filter((o) => o.id !== id));
  const updateObjection = (id: string, f: "objection" | "response", v: string) =>
    setObjectionHandling(objectionHandling.map((o) => (o.id === id ? { ...o, [f]: v } : o)));

  // ── Data collection helpers ──────────────────────────────────────────────
  const addDataField = () =>
    setDataCollection([...dataCollection, { id: Date.now().toString(), name: "", type: "text", required: false, description: "" }]);
  const removeDataField = (id: string) =>
    setDataCollection(dataCollection.filter((d) => d.id !== id));
  const updateDataField = (id: string, f: string, v: any) =>
    setDataCollection(dataCollection.map((d) => (d.id === id ? { ...d, [f]: v } : d)));

  // ── Keyword helpers ──────────────────────────────────────────────────────
  const addKeywordTag = (cat: "triggerKeywords" | "doNotSay" | "sensitiveTopics", kw: string) => {
    if (kw.trim()) setKeywords((p) => ({ ...p, [cat]: [...p[cat], kw.trim()] }));
  };
  const removeKeywordTag = (cat: "triggerKeywords" | "doNotSay" | "sensitiveTopics", i: number) =>
    setKeywords((p) => ({ ...p, [cat]: p[cat].filter((_, idx) => idx !== i) }));

  // ── Escalation helpers ───────────────────────────────────────────────────
  const addEscalationPhrase = () => {
    const phrase = prompt("Enter escalation trigger phrase:");
    if (phrase) setEscalation((p) => ({ ...p, triggerPhrases: [...p.triggerPhrases, phrase] }));
  };
  const removeEscalationPhrase = (i: number) =>
    setEscalation((p) => ({ ...p, triggerPhrases: p.triggerPhrases.filter((_, idx) => idx !== i) }));

  // ── Pronunciation helpers ────────────────────────────────────────────────
  const addPronunciationRule = () =>
    setPronunciation([...pronunciation, { id: Date.now().toString(), word: "", phonetic: "" }]);
  const updatePronunciation = (id: string, f: "word" | "phonetic", v: string) =>
    setPronunciation(pronunciation.map((r) => (r.id === id ? { ...r, [f]: v } : r)));
  const removePronunciation = (id: string) =>
    setPronunciation(pronunciation.filter((r) => r.id !== id));

  // ── Success criteria helpers ─────────────────────────────────────────────
  const addCriteria = () => {
    const c = prompt("Enter success criteria:");
    if (c) setSuccessCriteria((p) => [...p, c]);
  };
  const removeCriteria = (i: number) => setSuccessCriteria((p) => p.filter((_, idx) => idx !== i));

  // ── File upload ──────────────────────────────────────────────────────────
  const handleKnowledgeBaseUpload = useCallback(async (files: File[]) => {
    const validTypes = [
      "application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain", "text/csv",
    ];
    const maxSize = 10 * 1024 * 1024;
    const validFiles = files.filter((file) => {
      if (!validTypes.includes(file.type)) { appToast.error(`${file.name} is not a supported file type`); return false; }
      if (file.size > maxSize) { appToast.error(`${file.name} is too large (max 10MB)`); return false; }
      return true;
    });
    if (validFiles.length === 0) return;
    setIsUploadingFiles(true);
    setUploadedFiles((prev) => [...prev, ...validFiles]);
    try {
      const response = await agentAPI.uploadKnowledgeBase(validFiles);
      const fileUrls: string[] = (response?.data?.files ?? []).map((f: { url: string }) => f.url);
      if (fileUrls.length > 0) {
        setUploadedFileUrls((prev) => [...prev, ...fileUrls]);
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
    if (files && files.length > 0) handleKnowledgeBaseUpload(Array.from(files));
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

  // ── AI generation helpers ────────────────────────────────────────────────
  const selectedAgentData = localAgents.find((a) => a.id === selectedAgent);

  const buildAgentContext = () => {
    const d = selectedAgentData;
    return `Agent Details:\n- Name: ${d?.name || "AI Assistant"}\n- Gender: ${d?.gender || "not specified"}\n- Voice Style: ${d?.voice || "not specified"}\n- Personality: ${d?.personality || d?.persona || "professional"}\n- Language: ${d?.language || "English"}\n- Industry: ${d?.industry || "not specified"}\n- Use Case: ${d?.useCase || d?.use_case || "customer support"}`;
  };

  const generateAIPrompt = async () => {
    setIsGeneratingPrompt(true); setShowGeneratedPrompt(false);
    try {
      const promptText = systemPrompt.trim()
        ? `Enhance this system prompt:\n\n${buildAgentContext()}\n\nCurrent: ${systemPrompt}\n\nEnsure clear, concise, short and professional.`
        : `Generate a professional system prompt:\n\n${buildAgentContext()}\n\nEnsure clear, concise, short and professional.`;
      const response = await agentAPI.generatePrompt(promptText);
      const generated = response?.data?.generation?.response || response?.generation?.response || response?.response;
      if (generated) { setGeneratedPrompt(generated); setShowGeneratedPrompt(true); }
      else throw new Error("Invalid response");
    } catch { appToast.error("Failed to generate prompt."); }
    finally { setIsGeneratingPrompt(false); }
  };

  const generateAIFirstMessage = async () => {
    setIsGeneratingFirstMessage(true); setShowGeneratedFirstMessage(false);
    try {
      const promptText = firstMessage.trim()
        ? `Enhance this greeting:\n\n${buildAgentContext()}\n\nCurrent: ${firstMessage}\n\nKeep concise (1-2 sentences).`
        : `Generate a greeting:\n\n${buildAgentContext()}\n\nKeep concise (1-2 sentences).`;
      const response = await agentAPI.generatePrompt(promptText);
      const generated = response?.data?.generation?.response || response?.generation?.response || response?.response;
      if (generated) { setGeneratedFirstMessage(generated); setShowGeneratedFirstMessage(true); }
      else throw new Error("Invalid response");
    } catch { appToast.error("Failed to generate first message."); }
    finally { setIsGeneratingFirstMessage(false); }
  };

  const generateAIKnowledge = async () => {
    setIsGeneratingKnowledge(true); setShowGeneratedKnowledge(false);
    try {
      const promptText = manualKnowledge.trim()
        ? `Enhance this knowledge:\n\n${buildAgentContext()}\n\n${manualKnowledge}`
        : `Generate knowledge base content:\n\n${buildAgentContext()}\n\nFormat clearly with sections.`;
      const response = await agentAPI.generatePrompt(promptText);
      const generated = response?.data?.generation?.response || response?.generation?.response || response?.response;
      if (generated) { setGeneratedKnowledge(generated); setShowGeneratedKnowledge(true); }
      else throw new Error("Invalid response");
    } catch { appToast.error("Failed to generate knowledge."); }
    finally { setIsGeneratingKnowledge(false); }
  };

  const generateAITalkingPoints = async () => {
    setIsGeneratingTalkingPoints(true); setShowGeneratedTalkingPoints(false);
    try {
      const ctx = `Agent: ${selectedAgentData?.name}, ${selectedAgentData?.personality || "professional"}, ${selectedAgentData?.industry || "general"} industry.`;
      const promptText = keyTalkingPoints.trim()
        ? `Improve these talking points for ${ctx}:\n\n${keyTalkingPoints}\n\nFormat as clear bullet points.`
        : `Generate key talking points for ${ctx}\n\nFormat as bullet points sorted by importance.`;
      const response = await agentAPI.generatePrompt(promptText);
      const generated = response?.data?.generation?.response || response?.generation?.response || response?.response;
      if (generated) { setGeneratedTalkingPoints(generated); setShowGeneratedTalkingPoints(true); }
      else throw new Error("Invalid response");
    } catch { appToast.error("Failed to generate talking points."); }
    finally { setIsGeneratingTalkingPoints(false); }
  };

  const generateAIClosingScript = async () => {
    setIsGeneratingClosingScript(true); setShowGeneratedClosingScript(false);
    try {
      const ctx = `Agent: ${selectedAgentData?.name}, ${selectedAgentData?.personality || "professional"}, ${selectedAgentData?.industry || "general"} industry.`;
      const promptText = closingScript.trim()
        ? `Improve this closing script for ${ctx}:\n\n${closingScript}\n\nKeep concise.`
        : `Generate a closing script for ${ctx}\n\nKeep concise (2-3 sentences).`;
      const response = await agentAPI.generatePrompt(promptText);
      const generated = response?.data?.generation?.response || response?.generation?.response || response?.response;
      if (generated) { setGeneratedClosingScript(generated); setShowGeneratedClosingScript(true); }
      else throw new Error("Invalid response");
    } catch { appToast.error("Failed to generate closing script."); }
    finally { setIsGeneratingClosingScript(false); }
  };

  // ── Save / test handlers ─────────────────────────────────────────────────
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
    } catch { appToast.error("Failed to save knowledge base."); }
    finally { setIsSavingKnowledge(false); }
  };

  const saveTrainingExamples = async () => {
    if (!selectedAgent) return;
    setIsSavingExamples(true);
    try {
      const baseTemplate = selectedAgentData?.template || { name: "", description: "", icon: "", features: [] };
      await agentAPI.updateAgent(selectedAgent, {
        template: {
          ...baseTemplate,
          systemPrompt, firstMessage, keyTalkingPoints, closingScript,
          objections: legacyObjections,
          conversationExamples: conversationExamples.map((e) => ({
            customerInput: e.userMessage,
            expectedResponse: e.agentResponse,
          })),
        },
      } as any);
      setSavedSections((prev) => ({ ...prev, examples: true }));
      appToast.success("Training examples saved successfully!");
    } catch { appToast.error("Failed to save training examples."); }
    finally { setIsSavingExamples(false); }
  };

  const saveIntentTraining = async () => {
    if (!selectedAgent) return;
    setIsSavingIntents(true);
    try {
      const baseTemplate = selectedAgentData?.template || { name: "", description: "", icon: "", features: [] };
      await agentAPI.updateAgent(selectedAgent, {
        template: { ...baseTemplate, systemPrompt, firstMessage, intents },
      } as any);
      setSavedSections((prev) => ({ ...prev, intents: true }));
      appToast.success("Intent training saved!");
    } catch { appToast.error("Failed to save behavior settings."); }
    finally { setIsSavingIntents(false); }
  };

  const handleSaveFullConfig = async () => {
    setIsSavingConfig(true);
    try {
      if (!selectedAgent) return;
      const baseTemplate = selectedAgentData?.template || { name: "", description: "", icon: "", features: [] };
      await agentAPI.updateAgent(selectedAgent, {
        custom_instructions: systemPrompt,
        template: {
          ...baseTemplate,
          systemPrompt, firstMessage, keyTalkingPoints, closingScript,
          primaryGoal, successCriteria,
          conversationExamples: conversationExamples.map((e) => ({
            customerInput: e.userMessage,
            expectedResponse: e.agentResponse,
          })),
          objectionHandling,
          dataCollection,
          keywords,
          escalation,
          pronunciation,
          behaviorSettings,
          intents,
        },
      } as any);
      setSavedSections({ knowledge: true, examples: true, intents: true });
      appToast.success("All training configuration saved!");
    } catch { appToast.error("Failed to save configuration."); }
    finally { setIsSavingConfig(false); }
  };

  const handleTestResponse = () => {
    if (!testMessage.trim()) return;
    setIsTestingResponse(true);
    setTimeout(() => {
      const lm = testMessage.toLowerCase();
      let response = lm.includes("hi") || lm.includes("hello")
        ? "Hello! I'm your AI assistant. How can I help you today?"
        : lm.includes("price") || lm.includes("cost")
        ? "Our pricing starts at $99/month for the basic plan. Would you like me to explain the different options available?"
        : lm.includes("help") || lm.includes("support")
        ? "I'm here to help! Please tell me what specific assistance you need."
        : lm.includes("book") || lm.includes("schedule")
        ? "I'd be happy to help you schedule an appointment. What date and time works best for you?"
        : `Thank you for your message. I understand you're asking about '${testMessage}'. Let me help you with that.`;
      setAiResponse(response);
      setIsTestingResponse(false);
      setTestMetrics((prev) => ({
        accuracyScore: Math.floor(Math.random() * 15) + 85,
        responseTime: parseFloat((Math.random() * 2 + 0.5).toFixed(1)),
        confidenceLevel: Math.floor(Math.random() * 20) + 80,
        intentRecognition: Math.floor(Math.random() * 25) + 75,
        totalTests: prev.totalTests + 1,
      }));
    }, 1500);
  };

  const handleTestAudio = () => {
    if (!testMessage.trim()) return;
    setIsTestingAudio(true);
    const lm = testMessage.toLowerCase();
    const response = lm.includes("hi") || lm.includes("hello")
      ? "Hello! I'm your AI assistant. How can I help you today?"
      : `Thank you for your message about '${testMessage}'. Let me help you with that.`;
    setAiResponse(response);
    setTestMetrics((prev) => ({
      accuracyScore: Math.floor(Math.random() * 15) + 85,
      responseTime: parseFloat((Math.random() * 2 + 0.5).toFixed(1)),
      confidenceLevel: Math.floor(Math.random() * 20) + 80,
      intentRecognition: Math.floor(Math.random() * 25) + 75,
      totalTests: prev.totalTests + 1,
    }));
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(response);
      utterance.rate = 1.0; utterance.pitch = 1.2; utterance.volume = 1.0;
      const voices = speechSynthesis.getVoices();
      const femaleVoice = voices.find((v) =>
        ["sarah","samantha","karen","emma","zira","kate","victoria","ava"].some((n) => v.name.toLowerCase().includes(n))
      ) || voices.find((v) => v.lang.startsWith("en-US")) || voices[0];
      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.onend = () => setIsTestingAudio(false);
      utterance.onerror = () => setIsTestingAudio(false);
      speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsTestingAudio(false), 3000);
    }
  };

  const handleStartTraining = () => {
    setIsTraining(true); setTrainingProgress(0);
    const interval = setInterval(() => {
      setTrainingProgress((prev) => {
        if (prev >= 100) { clearInterval(interval); setIsTraining(false); return 100; }
        return prev + 10;
      });
    }, 500);
  };

  const canStartTraining = () =>
    savedSections.knowledge && savedSections.examples && savedSections.intents;

  // ── Tabs definition ──────────────────────────────────────────────────────
  const trainingTabs = [
    { id: "goal", label: "Goal", icon: BookOpen },
    { id: "examples", label: "Examples", icon: Zap },
    { id: "objections", label: "Objections", icon: AlertCircle },
    { id: "dataCollection", label: "Data", icon: Edit2 },
    { id: "keywords", label: "Keywords", icon: Shield },
    { id: "escalation", label: "Escalation", icon: PhoneOff },
    { id: "pronunciation", label: "Pronunciation", icon: Volume2 },
    { id: "behavior", label: "Behavior", icon: Settings },
  ];

  // ── Stats ────────────────────────────────────────────────────────────────
  const knowledgeStats = [
    { label: "Documents", value: `${existingKbFiles.length + uploadedFiles.length}`, icon: FileText, color: "blue" },
    { label: "Examples", value: `${conversationExamples.length}`, icon: MessageSquare, color: "purple" },
    { label: "Objections", value: `${objectionHandling.length}`, icon: AlertCircle, color: "orange" },
    { label: "Intents", value: `${intents.length}`, icon: Target, color: "green" },
  ];

  const trainingMetrics = [
    { label: "Accuracy Score", value: `${testMetrics.accuracyScore}%`, change: testMetrics.totalTests > 0 ? `+${(Math.random() * 3 + 0.5).toFixed(1)}%` : "No data", trend: "up" },
    { label: "Response Time", value: `${testMetrics.responseTime}s`, change: testMetrics.totalTests > 0 ? `-${(Math.random() * 0.5 + 0.1).toFixed(1)}s` : "No data", trend: "down" },
    { label: "Confidence Level", value: `${testMetrics.confidenceLevel}%`, change: testMetrics.totalTests > 0 ? `+${(Math.random() * 5 + 1).toFixed(1)}%` : "No data", trend: "up" },
    { label: "Intent Recognition", value: `${testMetrics.intentRecognition}%`, change: testMetrics.totalTests > 0 ? `+${(Math.random() * 2 + 0.5).toFixed(1)}%` : "No data", trend: "up" },
  ];

  const statsSliderSettings = {
    dots: false, infinite: false, speed: 300, slidesToShow: 2.2, slidesToScroll: 1, arrows: false,
    responsive: [
      { breakpoint: 640, settings: { slidesToShow: 2.2, slidesToScroll: 1 } },
      { breakpoint: 480, settings: { slidesToShow: 1.8, slidesToScroll: 1 } },
      { breakpoint: 768, settings: "unslick" as const },
    ],
  };

  // ── AI Assist button component ───────────────────────────────────────────
  const AIAssistButton = ({ loading, onClick }: { loading: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      disabled={loading}
      className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-medium rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Generating...</span></> : <><Sparkles className="w-3.5 h-3.5" /><span>AI Assist</span></>}
    </button>
  );

  // ── Generated preview component ──────────────────────────────────────────
  const GeneratedPreview = ({
    show, value, onChange, onApply, onCancel, label, rows = 6,
  }: { show: boolean; value: string; onChange: (v: string) => void; onApply: () => void; onCancel: () => void; label: string; rows?: number }) => {
    if (!show || !value) return null;
    return (
      <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{label}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg mb-3">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            className="w-full p-3 text-sm text-slate-700 dark:text-slate-300 bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 rounded-lg"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onApply} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-sm font-medium rounded-lg transition-all">
            <CheckCircle className="w-4 h-4" /> Apply
          </button>
          <button onClick={onCancel} className="px-4 py-2 common-bg-icons text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:shadow-sm transition-all">
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // ── Section header ───────────────────────────────────────────────────────
  const SectionHeader = ({
    sectionKey, icon: Icon, iconColor, title, subtitle, onAdd,
  }: { sectionKey: string; icon: any; iconColor: string; title: string; subtitle?: string; onAdd?: () => void }) => (
    <div
      className="flex items-center justify-between cursor-pointer"
      onClick={() => toggleSection(sectionKey)}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <div>
          <h4 className="font-medium text-slate-800 dark:text-white">{title}</h4>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onAdd && (
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            className={`p-1.5 ${iconColor} hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors`}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
        {expandedSections[sectionKey] ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </div>
    </div>
  );

  // ── Keyword tag input ─────────────────────────────────────────────────────
  const KeywordTagInput = ({
    category, label, placeholder,
  }: { category: "triggerKeywords" | "doNotSay" | "sensitiveTopics"; label: string; placeholder: string }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full px-3 py-2 common-bg-icons border border-slate-200 dark:border-slate-700 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-red-500/30"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const input = e.currentTarget as HTMLInputElement;
            addKeywordTag(category, input.value);
            input.value = "";
          }
        }}
      />
      <div className="flex flex-wrap gap-2">
        {keywords[category].map((kw, idx) => (
          <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs">
            {kw}
            <button onClick={() => removeKeywordTag(category, idx)} className="hover:rotate-90 transition-transform"><X className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Back button */}
      {state?.from === "list" && (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
          <button
            onClick={() => navigate("/agents")}
            className="common-button-bg2 flex items-center gap-2 transition-colors px-4 py-2 -m-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm sm:text-base font-medium">Back to Agents</span>
          </button>
        </div>
      )}

      {/* Agent selection card */}
      <div>
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
                  You need to create your first AI agent before you can access training features.
                </p>
                <button onClick={() => navigate("/agents")} className="common-button-bg">
                  Go to Agent Management
                </button>
              </div>
            ) : selectedAgentData ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 common-bg-icons flex items-center justify-center flex-shrink-0">
                        <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-black dark:text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-white truncate">
                          {selectedAgentData.name}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Training Session</p>
                      </div>
                    </div>
                    <div className="relative w-full sm:w-auto sm:flex-shrink-0">
                      <select
                        value={selectedAgent}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                        className="common-bg-icons w-full px-3 py-2 sm:px-4 sm:py-2 appearance-none pr-8 sm:pr-10 font-medium text-sm sm:text-base"
                      >
                        {localAgents.map((agent) => (
                          <option key={agent.id} value={agent.id}>{agent.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-600 dark:text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-medium capitalize">{selectedAgentData.gender || "N/A"}</span>
                      <span className="text-slate-400">•</span>
                      <span className="truncate capitalize">{selectedAgentData.personality || selectedAgentData.persona || "N/A"}</span>
                      <span className="text-slate-400">•</span>
                      <span className="truncate capitalize">{selectedAgentData.voice || "N/A"}</span>
                    </div>
                    <span className={`inline-flex w-fit px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                      selectedAgentData.status === "Published" ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : selectedAgentData.status === "Pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                    }`}>
                      {selectedAgentData.status}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="training-stats-container">
                  <div className="block md:hidden">
                    <Slider {...statsSliderSettings} className="training-stats-slider">
                      {knowledgeStats.map((stat, index) => (
                        <div key={index} className="px-1.5">
                          <div className="common-bg-icons p-3 rounded-xl h-full">
                            <div className="flex items-center gap-3">
                              <div className="common-bg-icons p-2 rounded-lg flex-shrink-0">
                                <stat.icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-lg font-bold text-slate-800 dark:text-white">{stat.value}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{stat.label}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </Slider>
                  </div>
                  <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {knowledgeStats.map((stat, index) => (
                      <div key={index} className="common-bg-icons p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="common-bg-icons p-2 rounded-lg flex-shrink-0">
                            <stat.icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{stat.label}</p>
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
                <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-2 sm:mb-3">Select an Agent to Train</h3>
                <div className="max-w-xs sm:max-w-sm mx-auto">
                  <div className="relative">
                    <select
                      value={selectedAgent}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                      className="common-bg-icons w-full px-4 py-3 rounded-xl appearance-none pr-10 font-medium text-center text-sm sm:text-base"
                    >
                      <option value="">Choose an agent...</option>
                      {localAgents.map((agent) => (
                        <option key={agent.id} value={agent.id}>{agent.name}</option>
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

      {/* ── Main training area ── */}
      {selectedAgent && selectedAgentData && (
        <div className="space-y-4 sm:space-y-6">
          {/* Tab bar */}
          <GlassCard>
            <div className="p-3 sm:p-4">
              <div className="flex gap-1 common-bg-icons rounded-xl p-1 overflow-x-auto scrollbar-hide">
                {trainingTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                      activeTab === tab.id
                        ? "common-button-bg2 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <tab.icon className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Tab content + sidebar */}
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
            {/* ── LEFT: Tab content ── */}
            <div className="lg:col-span-2 space-y-4">

              {/* ═══════════════ GOAL ═══════════════ */}
              {activeTab === "goal" && (
                <GlassCard>
                  <div className="p-4 sm:p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">Conversation Goal</h3>
                        <span className="text-xs px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">Core</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Primary Goal</label>
                      <textarea
                        value={primaryGoal}
                        onChange={(e) => setPrimaryGoal(e.target.value)}
                        rows={3}
                        className="common-bg-icons w-full px-4 py-3 rounded-xl resize-none text-sm border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        placeholder="Define what a successful call looks like for this agent..."
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Success Criteria</label>
                        <button onClick={addCriteria} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>
                      <div className="space-y-2">
                        {successCriteria.map((criteria, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 common-bg-icons rounded-lg">
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2.5 py-1 rounded">{index + 1}</span>
                            <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{criteria}</span>
                            <button onClick={() => removeCriteria(index)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              )}



              {/* ═══════════════ EXAMPLES ═══════════════ */}
              {activeTab === "examples" && (
                <GlassCard>
                  <div className="p-4 sm:p-6 space-y-5">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">Conversation Examples</h3>
                    </div>

                    {/* Call script sub-section */}
                    <div className="common-bg-icons p-4 rounded-xl space-y-4">
                      <SectionHeader sectionKey="callScript" icon={MessageSquare} iconColor="text-blue-500" title="Call Script & Talking Points" />
                      {expandedSections.callScript && (
                        <div className="space-y-4 pt-1">
                          <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Key Talking Points</label>
                            <div className="relative">
                              <textarea value={keyTalkingPoints} onChange={(e) => setKeyTalkingPoints(e.target.value)} placeholder="• Product benefits&#10;• Pricing details&#10;• Common objection handling" rows={4} className={`common-bg-icons w-full px-4 py-3 pb-12 rounded-lg text-sm resize-none transition-opacity ${isGeneratingTalkingPoints ? 'opacity-75' : ''}`} disabled={isGeneratingTalkingPoints} />
                              {isGeneratingTalkingPoints && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/5 to-transparent rounded-lg pointer-events-none">
                                  <div className="flex items-center gap-2 bg-blue-500/90 text-white px-3 py-1.5 rounded-lg">
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-xs font-medium">Generating...</span>
                                  </div>
                                </div>
                              )}
                              <AIAssistButton loading={isGeneratingTalkingPoints} onClick={generateAITalkingPoints} />
                            </div>
                            <GeneratedPreview show={showGeneratedTalkingPoints} value={generatedTalkingPoints} onChange={setGeneratedTalkingPoints} onApply={() => { setKeyTalkingPoints(generatedTalkingPoints); setShowGeneratedTalkingPoints(false); setGeneratedTalkingPoints(""); appToast.success("Talking points applied!"); }} onCancel={() => { setShowGeneratedTalkingPoints(false); setGeneratedTalkingPoints(""); }} label="AI Generated Talking Points" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Closing Script</label>
                            <div className="relative">
                              <textarea value={closingScript} onChange={(e) => setClosingScript(e.target.value)} placeholder="Thank you for your time. I'll send you the information we discussed..." rows={3} className={`common-bg-icons w-full px-4 py-3 pb-12 rounded-lg text-sm resize-none transition-opacity ${isGeneratingClosingScript ? 'opacity-75' : ''}`} disabled={isGeneratingClosingScript} />
                              {isGeneratingClosingScript && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/5 to-transparent rounded-lg pointer-events-none">
                                  <div className="flex items-center gap-2 bg-blue-500/90 text-white px-3 py-1.5 rounded-lg">
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-xs font-medium">Generating...</span>
                                  </div>
                                </div>
                              )}
                              <AIAssistButton loading={isGeneratingClosingScript} onClick={generateAIClosingScript} />
                            </div>
                            <GeneratedPreview show={showGeneratedClosingScript} value={generatedClosingScript} onChange={setGeneratedClosingScript} onApply={() => { setClosingScript(generatedClosingScript); setShowGeneratedClosingScript(false); setGeneratedClosingScript(""); appToast.success("Closing script applied!"); }} onCancel={() => { setShowGeneratedClosingScript(false); setGeneratedClosingScript(""); }} label="AI Generated Closing" rows={4} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sample conversation examples */}
                    <div className="space-y-4">
                      {conversationExamples.map((example, idx) => (
                        <div key={example.id} className="p-4 common-bg-icons rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Example {idx + 1}</span>
                            {conversationExamples.length > 1 && (
                              <button onClick={() => removeExample(example.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><X className="w-4 h-4" /></button>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Customer Input</label>
                            <textarea value={example.userMessage} onChange={(e) => updateExample(example.id, "userMessage", e.target.value)} rows={2} className="common-bg-icons w-full px-3 py-2 rounded text-sm resize-none" placeholder="What the customer might say..." />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Expected Response</label>
                            <textarea value={example.agentResponse} onChange={(e) => updateExample(example.id, "agentResponse", e.target.value)} rows={2} className="common-bg-icons w-full px-3 py-2 rounded text-sm resize-none" placeholder="How the agent should respond..." />
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={addExample} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1 font-medium"><Plus className="w-3 h-3" /> Add Example</button>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* ═══════════════ OBJECTIONS ═══════════════ */}
              {activeTab === "objections" && (
                <GlassCard>
                  <div className="p-4 sm:p-6 space-y-5">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">Objection Handling</h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Train your agent to handle common pushbacks professionally.</p>
                    <div className="space-y-4">
                      {objectionHandling.map((obj, idx) => (
                        <div key={obj.id} className="p-4 common-bg-icons rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Objection {idx + 1}</span>
                            {objectionHandling.length > 1 && <button onClick={() => removeObjection(obj.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><X className="w-4 h-4" /></button>}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Objection / Pushback</label>
                            <textarea value={obj.objection} onChange={(e) => updateObjection(obj.id, "objection", e.target.value)} rows={2} className="common-bg-icons w-full px-3 py-2 rounded text-sm resize-none" placeholder="e.g., 'It's too expensive' or 'I'm not interested'" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">How to Respond</label>
                            <textarea value={obj.response} onChange={(e) => updateObjection(obj.id, "response", e.target.value)} rows={2} className="common-bg-icons w-full px-3 py-2 rounded text-sm resize-none" placeholder="How should the agent respond?" />
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={addObjection} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1 font-medium"><Plus className="w-3 h-3" /> Add Objection</button>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* ═══════════════ DATA COLLECTION ═══════════════ */}
              {activeTab === "dataCollection" && (
                <GlassCard>
                  <div className="p-4 sm:p-6 space-y-5">
                    <div className="flex items-center gap-3">
                      <Edit2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">Data Collection</h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Define what information your agent should collect during conversations.</p>
                    <div className="space-y-4">
                      {dataCollection.map((field, idx) => (
                        <div key={field.id} className="p-4 common-bg-icons rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Field {idx + 1}</span>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={field.required} onChange={(e) => updateDataField(field.id, "required", e.target.checked)} className="rounded" />
                                <span className="text-xs text-slate-600 dark:text-slate-400">Required</span>
                              </label>
                              <button onClick={() => removeDataField(field.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><X className="w-4 h-4" /></button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Field Name</label>
                              <input type="text" value={field.name} onChange={(e) => updateDataField(field.id, "name", e.target.value)} className="common-bg-icons w-full px-3 py-2 rounded text-sm border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="e.g., event_type" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Type</label>
                              <select value={field.type} onChange={(e) => updateDataField(field.id, "type", e.target.value)} className="common-bg-icons w-full px-3 py-2 rounded text-sm border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="select">Select</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Description</label>
                            <input type="text" value={field.description} onChange={(e) => updateDataField(field.id, "description", e.target.value)} className="common-bg-icons w-full px-3 py-2 rounded text-sm border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="e.g., Type of event (birthday, wedding)" />
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={addDataField} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1 font-medium"><Plus className="w-3 h-3" /> Add Field</button>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* ═══════════════ KEYWORDS ═══════════════ */}
              {activeTab === "keywords" && (
                <GlassCard>
                  <div className="p-4 sm:p-6 space-y-5">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">Keywords & Guardrails</h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Control what your agent listens for, avoids saying, and escalates on.</p>
                    <div className="space-y-5">
                      <KeywordTagInput category="triggerKeywords" label="🎯 Trigger Keywords" placeholder="Type and press Enter or comma..." />
                      <KeywordTagInput category="doNotSay" label="🚫 Do Not Say (Prohibited)" placeholder="Type and press Enter or comma..." />
                      <KeywordTagInput category="sensitiveTopics" label="⚠️ Sensitive Topics → Escalate" placeholder="Type and press Enter or comma..." />
                    </div>
                    <div className="flex justify-end">
                      <button onClick={handleSaveFullConfig} disabled={isSavingConfig} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium common-button-bg disabled:opacity-60">
                        {isSavingConfig ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</> : <><Save className="w-3 h-3" /> Save Keywords</>}
                      </button>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* ═══════════════ ESCALATION ═══════════════ */}
              {activeTab === "escalation" && (
                <GlassCard>
                  <div className="p-4 sm:p-6 space-y-5">
                    <div className="flex items-center gap-3">
                      <PhoneOff className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">Escalation & Handoff</h3>
                    </div>
                    <div className="space-y-5">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Trigger Phrases</label>
                          <button onClick={addEscalationPhrase} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        </div>
                        <div className="space-y-2">
                          {escalation.triggerPhrases.map((phrase, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 common-bg-icons rounded-lg">
                              <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">"{phrase}"</span>
                              <button onClick={() => removeEscalationPhrase(idx)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><X className="w-4 h-4" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Escalation Action</label>
                        <select value={escalation.escalationAction} onChange={(e) => setEscalation((p) => ({ ...p, escalationAction: e.target.value }))} className="common-bg-icons w-full px-4 py-3 rounded-lg text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                          <option>Transfer to live agent</option>
                          <option>End call with message</option>
                          <option>Schedule callback</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Call Ending Conditions</label>
                        <textarea value={escalation.callEndingConditions} onChange={(e) => setEscalation((p) => ({ ...p, callEndingConditions: e.target.value }))} rows={3} className="common-bg-icons w-full px-4 py-3 rounded-lg text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
                      </div>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* ═══════════════ PRONUNCIATION ═══════════════ */}
              {activeTab === "pronunciation" && (
                <GlassCard>
                  <div className="p-4 sm:p-6 space-y-5">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">Pronunciation Dictionary</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Voice accuracy for custom words</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {pronunciation.map((rule) => (
                        <div key={rule.id} className="grid grid-cols-2 gap-3 p-3 common-bg-icons rounded-lg">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Word / Phrase</label>
                            <input type="text" value={rule.word} onChange={(e) => updatePronunciation(rule.id, "word", e.target.value)} className="common-bg-icons w-full px-3 py-2 rounded text-sm border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="Word" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Phonetic Spelling</label>
                            <div className="flex gap-2">
                              <input type="text" value={rule.phonetic} onChange={(e) => updatePronunciation(rule.id, "phonetic", e.target.value)} className="common-bg-icons flex-1 px-3 py-2 rounded text-sm border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="e.g., ah-NAH-sah" />
                              <button onClick={() => removePronunciation(rule.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><X className="w-4 h-4" /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={addPronunciationRule} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1 font-medium"><Plus className="w-3 h-3" /> Add Word</button>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* ═══════════════ BEHAVIOR ═══════════════ */}
              {activeTab === "behavior" && (
                <GlassCard>
                  <div className="p-4 sm:p-6 space-y-5">
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">Behavior Settings</h3>
                    </div>

                    {/* Intents sub-section */}
                    <div className="common-bg-icons p-4 rounded-xl space-y-3">
                      <SectionHeader sectionKey="intentsSection" icon={Target} iconColor="text-orange-500" title="Intent Recognition" subtitle={`${intents.length} intents`} onAdd={addIntent} />
                      {expandedSections.intentsSection !== false && (
                        <div className="space-y-4 pt-1">
                          {intents.map((intent, index) => (
                            <div key={index} className="space-y-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg relative">
                              {intents.length > 1 && (
                                <button type="button" onClick={() => removeIntent(index)} className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><X className="w-3.5 h-3.5" /></button>
                              )}
                              <div className="pr-8">
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Intent Name {index + 1}</label>
                                <input type="text" value={intent.name} onChange={(e) => updateIntent(index, "name", e.target.value)} placeholder="e.g., pricing_inquiry" className="common-bg-icons w-full px-4 py-2 rounded-lg text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Example Phrases (one per line)</label>
                                <textarea value={intent.phrases} onChange={(e) => updateIntent(index, "phrases", e.target.value)} placeholder={"How much does it cost?\nWhat's your pricing?"} rows={3} className="common-bg-icons w-full px-4 py-2 rounded-lg text-sm resize-none" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Intent Response</label>
                                <textarea value={intent.response} onChange={(e) => updateIntent(index, "response", e.target.value)} placeholder="Our pricing starts at $99/month..." rows={2} className="common-bg-icons w-full px-4 py-2 rounded-lg text-sm resize-none" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sliders */}
                    <div className="common-bg-icons p-4 rounded-xl space-y-5">
                      <h4 className="font-medium text-slate-800 dark:text-white text-sm">Tuning Parameters</h4>
                      {[
                        { key: "patience", label: "Patience (silence before re-prompt)", min: 1, max: 10, step: 1, unit: "s", color: "indigo" },
                        { key: "creativity", label: "Creativity / Response Variability", min: 0, max: 1, step: 0.1, unit: "", color: "indigo" },
                        { key: "maxTurns", label: "Max Conversation Turns", min: 5, max: 50, step: 1, unit: "", color: "indigo" },
                      ].map(({ key, label, min, max, step, unit }) => (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
                            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                              {key === "creativity"
                                ? (behaviorSettings[key as keyof TrainingBehavior] as number).toFixed(1)
                                : behaviorSettings[key as keyof TrainingBehavior]}{unit}
                            </span>
                          </div>
                          <input type="range" min={min} max={max} step={step}
                            value={behaviorSettings[key as keyof TrainingBehavior] as number}
                            onChange={(e) => setBehaviorSettings((p) => ({ ...p, [key]: key === "creativity" ? parseFloat(e.target.value) : parseInt(e.target.value) }))}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-slate-500 mt-1"><span>{min}{unit}</span><span>{max}{unit}</span></div>
                        </div>
                      ))}
                    </div>

                    {/* Toggle settings */}
                    <div className="common-bg-icons p-4 rounded-xl space-y-1">
                      <h4 className="font-medium text-slate-800 dark:text-white text-sm mb-3">Conversation Controls</h4>
                      {[
                        { key: "confirmBeforeAction", label: "Confirm before taking action", desc: "Ask caller to confirm before booking or submitting data" },
                        { key: "rePromptOnSilence", label: "Re-prompt on silence", desc: "Repeat or rephrase if caller doesn't respond" },
                        { key: "collectName", label: "Collect caller's name", desc: "Ask for the caller's name early in the call" },
                        { key: "collectEmail", label: "Collect email address", desc: "Request an email for follow-up" },
                        { key: "endAfterGoal", label: "End call after goal is achieved", desc: "Don't keep talking once the primary goal is met" },
                        { key: "sentimentDetection", label: "Sentiment detection", desc: "Adjust tone if caller seems frustrated" },
                        { key: "bilingualFallback", label: "Bilingual fallback", desc: "Switch language if caller switches mid-call" },
                        { key: "logTranscripts", label: "Log call transcripts", desc: "Save full transcripts for review and retraining" },
                      ].map(({ key, label, desc }) => (
                        <label key={key} className="flex items-start gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                          <input type="checkbox"
                            checked={behaviorSettings[key as keyof TrainingBehavior] as boolean}
                            onChange={(e) => setBehaviorSettings((p) => ({ ...p, [key]: e.target.checked }))}
                            className="mt-0.5 rounded"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>


                  </div>
                </GlassCard>
              )}


            </div>

            {/* ── RIGHT: Sidebar ── */}
            <div className="space-y-4 sm:space-y-6">
              {/* Training status */}
              <GlassCard>
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Training Status</h3>
                  {!isTraining && trainingProgress === 0 ? (
                    <div className="text-center">
                      <div className="common-bg-icons w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-left">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Requirements:</p>
                        <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                          {[
                            { key: "knowledge", label: "Knowledge Base saved" },
                            { key: "examples", label: "Training Examples saved" },
                            { key: "intents", label: "Intent Training saved" },
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${savedSections[key as keyof typeof savedSections] ? "bg-green-500 text-white" : "bg-gray-300 dark:bg-gray-600"}`}>
                                {savedSections[key as keyof typeof savedSections] ? "✓" : "○"}
                              </span>
                              <span>{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button onClick={handleStartTraining} disabled={!canStartTraining()} className={`w-full rounded-xl px-4 sm:px-6 py-3 font-medium touch-manipulation ${canStartTraining() ? "common-button-bg" : "bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed opacity-50"}`}>
                        {canStartTraining() ? "Start Training" : "Save All Sections First"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <p className="font-medium text-slate-800 dark:text-white mb-2 text-sm sm:text-base">{isTraining ? "Training in Progress..." : "Training Complete!"}</p>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{trainingProgress}% Complete</p>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 sm:h-3">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 sm:h-3 rounded-full transition-all duration-500" style={{ width: `${trainingProgress}%` }} />
                      </div>
                      {trainingProgress === 100 && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-xl border-2 border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-green-800 dark:text-green-300 text-sm sm:text-base">Training Successful!</p>
                              <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">Your agent is ready for deployment</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Quick save all */}
              <GlassCard>
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">Save All Changes</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Save all tabs at once including goal, behavior, keywords, and escalation settings.</p>
                  <button onClick={handleSaveFullConfig} disabled={isSavingConfig} className="w-full common-button-bg flex items-center justify-center gap-2 py-3 rounded-xl font-medium disabled:opacity-60">
                    {isSavingConfig ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Configuration</>}
                  </button>
                </div>
              </GlassCard>

              {/* Tips */}
              <GlassCard>
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Training Tips</h3>
                  <div className="space-y-4">
                    {[
                      { n: 1, title: "Upload comprehensive documentation", desc: "Include FAQs, product info, and policies" },
                      { n: 2, title: "Provide conversation examples", desc: "Show how to handle different scenarios" },
                      { n: 3, title: "Set escalation triggers", desc: "Define when to hand off to a human" },
                      { n: 4, title: "Test thoroughly before publishing", desc: "Use test mode to validate responses" },
                    ].map(({ n, title, desc }) => (
                      <div key={n} className="flex items-start gap-3">
                        <div className="common-bg-icons w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-slate-600 dark:text-slate-400 text-xs font-bold">{n}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-white mb-1">{title}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>

              {/* Quick actions */}
              <GlassCard>
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Quick Actions</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      { icon: Upload, label: "Bulk Upload Documents" },
                      { icon: Download, label: "Export Training Data" },
                      { icon: BarChart3, label: "View Training Analytics" },
                    ].map(({ icon: Icon, label }) => (
                      <button key={label} className="common-bg-icons w-full flex items-center gap-3 p-3 sm:p-3.5 rounded-lg hover:shadow-sm transition-colors text-sm font-medium touch-manipulation">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-slate-600 dark:text-slate-400" />
                        <span className="text-slate-800 dark:text-white">{label}</span>
                      </button>
                    ))}
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
            <h3 className="text-lg sm:text-xl font-medium text-slate-600 dark:text-slate-400 mb-2 sm:mb-3">Select an agent to start training</h3>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-500 max-w-md mx-auto">
              Choose an agent from the dropdown above to begin training with knowledge base, examples, and intent configuration
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Training;